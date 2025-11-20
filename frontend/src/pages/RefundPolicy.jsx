import React from "react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen px-6 py-12 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

        <h1 className="text-3xl font-bold mb-6 text-sky-600 dark:text-sky-400">
          Refund Policy
        </h1>

        <p className="mb-4">
          Since our platform provides digital services, most purchases are non-refundable.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Refund Eligibility</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Duplicate payments</li>
          <li>Technical failure on our system</li>
        </ul>

        <p className="mt-4">
          To request a refund, contact support within 7 days of payment.
        </p>

      </div>
    </div>
  );
}
