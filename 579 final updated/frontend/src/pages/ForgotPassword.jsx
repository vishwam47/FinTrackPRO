import React from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <section className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Password reset unavailable</h1>
        <p className="mt-4 text-gray-600">Password recovery is temporarily disabled while a secure, verified reset flow is being prepared. Contact the site administrator for account recovery.</p>
        <Link className="inline-block mt-6 text-indigo-600 hover:text-indigo-800" to="/login">Return to login</Link>
      </section>
    </main>
  );
}
