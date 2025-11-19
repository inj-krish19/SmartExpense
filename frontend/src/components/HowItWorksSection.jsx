import React from "react"
import StepCard from "./StepCard"

const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "Add Monthly Earning",
      description:
        "Enter your monthly earning amount. Simple one-time setup for each month to track your income.",
    },
    {
      number: 2,
      title: "Upload Your Expenses",
      description:
        "Upload expenses via CSV/Excel file or add them manually. Link expenses to specific months and categories.",
    },
    {
      number: 3,
      title: "Review & Validate",
      description:
        "Check your uploaded data, edit if needed, and ensure all expenses are properly categorized before finalizing.",
    },
    {
      number: 4,
      title: "View Analytics Dashboard",
      description:
        "See beautiful charts showing earning vs expenses, spending by category, and monthly trends to make informed decisions.",
    },
  ]

  return (
    <section
      id="how-it-works"
      className="py-16 border-t border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent">
            How SmartExpense Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Four simple steps to take control of your finances. Get insights in
            minutes, not hours.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {steps.map((step, index) => (
            <StepCard key={index} {...step} />
          ))}
        </div>

        <div className="border-t  border-gray-200 dark:border-gray-700 mt-16"></div>

        <div className="flex flex-row justify-center place-items-center gap-4 mt-4">

          <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
            Complete workflow in under 5 minutes
          </p>

          {/* Workflow Illustration */}
          <div className=" border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-center items-center gap-4">
              <div className="flex items-center">
                <span className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium">
                  Earning
                </span>
                <i className="bi bi-arrow-right mx-3 text-gray-400 dark:text-gray-500"></i>
              </div>
              <div className="flex items-center">
                <span className="px-4 py-2 rounded-full bg-purple-500 text-white text-sm font-medium">
                  Expenses
                </span>
                <i className="bi bi-arrow-right mx-3 text-gray-400 dark:text-gray-500"></i>
              </div>
              <div className="flex items-center">
                <span className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-medium">
                  Review
                </span>
                <i className="bi bi-arrow-right mx-3 text-gray-400 dark:text-gray-500"></i>
              </div>
              <span className="px-4 py-2 rounded-full bg-yellow-500 text-white text-sm font-medium">
                Dashboard
              </span>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
