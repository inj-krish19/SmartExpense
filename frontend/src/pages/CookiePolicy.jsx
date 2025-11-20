import React from "react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen px-6 py-12 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

        <h1 className="text-3xl font-bold mb-6 text-sky-600 dark:text-sky-400">
          Cookie Policy
        </h1>

        <p className="mb-4">
          We use cookies to improve user experience and enhance app performance.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Types of Cookies</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Authentication cookies</li>
          <li>Preference cookies</li>
          <li>Analytics cookies</li>
        </ul>

      </div>
    </div>
  );
}
