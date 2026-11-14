FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NLTK_DATA=/usr/local/share/nltk_data \
    PORT=8000

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm \
    && python -c "import nltk; nltk.download('punkt', download_dir='/usr/local/share/nltk_data', quiet=True)"
COPY . .

EXPOSE 8000
CMD ["sh", "-c", "uvicorn main_combined_api:main_app --host 0.0.0.0 --port ${PORT}"]
