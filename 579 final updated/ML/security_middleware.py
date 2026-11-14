"""Bearer-token authentication and user-id scoping for the combined ML API."""

import json
import re
from urllib.parse import parse_qs

import jwt
from starlette.responses import JSONResponse


PUBLIC_PATHS = {"/", "/health", "/services", "/urls", "/openapi.json", "/docs", "/redoc"}
MAX_JSON_BYTES = 1_048_576


def _normalize_key(value):
    return value.replace("_", "").lower()


def _find_user_ids(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if _normalize_key(str(key)) == "userid" and isinstance(child, (str, int)):
                yield str(child)
            yield from _find_user_ids(child)
    elif isinstance(value, list):
        for child in value:
            yield from _find_user_ids(child)


class MLAuthMiddleware:
    def __init__(self, app, route_apps):
        self.app = app
        self.user_path_patterns = []
        for prefix, service in route_apps.items():
            for route in service.routes:
                route_path = getattr(route, "path", "")
                if not route_path:
                    continue
                names = []

                def replace_parameter(match):
                    name = match.group(1)
                    if _normalize_key(name) == "userid":
                        names.append(name)
                    return "(?P<" + name + ">[^/]+)"

                expression = re.sub(r"\{([A-Za-z0-9_]+)(?::[^}]*)?\}", replace_parameter, prefix + route_path)
                if names:
                    self.user_path_patterns.append((re.compile("^" + expression + "$"), names))

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http":
            return await self.app(scope, receive, send)

        path = scope.get("path", "")
        method = scope.get("method", "GET")
        if method == "OPTIONS" or path in PUBLIC_PATHS or path.endswith(("/docs", "/openapi.json", "/redoc")):
            return await self.app(scope, receive, send)

        secret = __import__("os").environ.get("JWT_SECRET", "")
        if len(secret) < 32:
            return await JSONResponse({"detail": "ML authentication is not configured"}, status_code=503)(scope, receive, send)

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        authorization = headers.get(b"authorization", b"").decode("latin1")
        if not authorization.startswith("Bearer "):
            return await JSONResponse({"detail": "Authentication required"}, status_code=401)(scope, receive, send)
        try:
            claims = jwt.decode(
                authorization[7:], secret, algorithms=["HS256"],
                issuer="fintrackpro", audience="fintrackpro-web",
            )
            owner_id = str(claims["userId"])
        except (jwt.PyJWTError, KeyError, TypeError, ValueError):
            return await JSONResponse({"detail": "Invalid or expired token"}, status_code=401)(scope, receive, send)

        query = parse_qs(scope.get("query_string", b"").decode("latin1"), keep_blank_values=True)
        requested_ids = [
            user_id
            for key, values in query.items()
            if _normalize_key(key) == "userid"
            for user_id in values
        ]
        for pattern, names in self.user_path_patterns:
            match = pattern.match(path)
            if match:
                requested_ids.extend(match.group(name) for name in names)
                break

        content_type = headers.get(b"content-type", b"").decode("latin1").lower()
        if method in {"POST", "PUT", "PATCH"} and content_type.startswith("application/json"):
            chunks = []
            size = 0
            more_body = True
            while more_body:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                chunk = message.get("body", b"")
                size += len(chunk)
                if size > MAX_JSON_BYTES:
                    return await JSONResponse({"detail": "JSON body too large"}, status_code=413)(scope, receive, send)
                chunks.append(chunk)
                more_body = message.get("more_body", False)
            body = b"".join(chunks)

            async def replay_body():
                nonlocal body
                current, body = body, b""
                return {"type": "http.request", "body": current, "more_body": False}

            if body:
                try:
                    requested_ids.extend(_find_user_ids(json.loads(body.decode("utf-8"))))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    pass
            receive_for_app = replay_body
        else:
            receive_for_app = receive

        if any(requested_id != owner_id for requested_id in requested_ids):
            return await JSONResponse({"detail": "Resource not found"}, status_code=404)(scope, receive, send)
        return await self.app(scope, receive_for_app, send)
