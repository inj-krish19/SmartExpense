import React from "react";

export default function Disclaimer() {
  return (
    <div className="min-h-screen px-6 py-12 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

        <h1 className="text-3xl font-bold mb-6 text-sky-600 dark:text-sky-400">
          Disclaimer
        </h1>

        <p className="mb-4">
          All information provided in the app is for financial guidance only.
        </p>

        <ul className="list-disc ml-6 space-y-1">
          <li>Predictions are estimates and not guaranteed</li>
          <li>We do not provide financial advice</li>
          <li>Users are responsible for their own decisions</li>
        </ul>

      </div>
    </div>
  );
}
