import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen px-6 py-12 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-sky-600 dark:text-sky-400">
          Privacy Policy
        </h1>

        <p className="mb-4">
          This Privacy Policy explains how we collect, use, and protect your personal data
          when using our application.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>User account details</li>
          <li>Expense and earning data</li>
          <li>Device & usage analytics</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Your Data</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>To provide predictive analytics</li>
          <li>To personalize dashboards</li>
          <li>To secure your account</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">Your Rights</h2>
        <p>You can request data deletion, correction, or export anytime.</p>
      </div>
    </div>
  );
}
