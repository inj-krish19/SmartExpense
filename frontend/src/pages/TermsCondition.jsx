import React from "react";

export default function TermsConditions() {
  return (
    <div className="min-h-screen px-6 py-12 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

        <h1 className="text-3xl font-bold mb-6 text-sky-600 dark:text-sky-400">
          Terms & Conditions
        </h1>

        <p className="mb-4">
          By using our platform, you agree to all terms and conditions listed on this page.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Use of Service</h2>
        <p>Our tools should be used responsibly and legally.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">User Responsibilities</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Provide accurate information</li>
          <li>Avoid misconduct or misuse</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">Limitations</h2>
        <p>We are not responsible for financial losses caused by incorrect data input.</p>

      </div>
    </div>
  );
}
