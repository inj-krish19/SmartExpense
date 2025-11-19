import React, { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { API_URL } from "../config";

const COLORS = ["#EF4444", "#10B981"]; // Red for overspent, green for balanced

const Recommend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);

  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const currentYear = new Date().getFullYear();
  const username = savedUser?.name?.split(" ")[0] || "User";

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!savedUser?.id) return;
      setLoading(true);
      setError(null);

      try {
        const [recommendRes, categoryRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/recommented-categories/${savedUser.id}`),
          fetch(`${API_URL}/category/all`),
        ]);

        const recommendData = await recommendRes.json();
        const categoryData = await categoryRes.json();

        if (recommendData.success && categoryData.success) {
          setRecommended(recommendData.recommended_categories || []);
          setCategories(categoryData.categories || []);
        } else {
          throw new Error("Failed to fetch recommendation data.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [savedUser]);

  // Prepare chart data
  const chartData = [
    { name: "Overspent", value: recommended.length },
    { name: "Balanced", value: Math.max(0, categories.length - recommended.length) },
  ];

  const overspentPercent = categories.length
    ? ((recommended.length / categories.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 px-4 py-10 transition-colors">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
          Hello {username}, here's your Spending Overview - {currentYear}
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          We analyzed your spending patterns and compared them across{" "}
          <strong>{categories.length}</strong> tracked categories.
        </p>

        {loading && (
          <p className="text-center text-blue-600 dark:text-blue-400 font-medium">
            Fetching your recommendations...
          </p>
        )}
        {error && <p className="text-center text-red-500 font-medium">{error}</p>}

        {!loading && !error && categories.length > 0 && (
          <>
            {/* Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Chart Section */}
              <div className="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-4 text-center">
                  Spending Distribution
                </h2>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) =>
                          `${value} Categories (${((value / categories.length) * 100).toFixed(1)}%)`
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-gray-700 dark:text-gray-300 mt-4">
                  <strong>{overspentPercent}%</strong> of your categories show high spending activity.
                </p>
              </div>

              {/* Summary Section */}
              <div className="bg-green-50 dark:bg-gray-800 border border-green-100 dark:border-gray-700 rounded-xl p-6 flex flex-col justify-center shadow-sm">
                <h2 className="text-xl font-semibold text-green-900 dark:text-green-200 mb-3">
                  Financial Health Summary
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  You are managing{" "}
                  <strong>{categories.length - recommended.length}</strong> categories well, 
                  but spending more than expected in{" "}
                  <strong>{recommended.length}</strong> categories.
                </p>
                {recommended.length > 0 ? (
                  <p className="text-gray-700 dark:text-gray-300">
                    Focus on cutting costs in these overspent areas for better control over your 
                    monthly savings goals.
                  </p>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    Excellent job! Your expenses are balanced across all categories — 
                    keep up your current strategy.
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Recommendation Cards */}
            {recommended.length > 0 && (
              <>
                <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-6">
                  Categories That Need Your Attention
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommended.map((catName, index) => {
                    const category = categories.find((c) => c.name === catName);
                    return (
                      <div
                        key={index}
                        className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow hover:shadow-lg transform hover:-translate-y-1 transition-all"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full mb-3">
                            <span className="text-red-600 dark:text-red-300 text-2xl font-bold">
                              ₹
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {category ? category.name : catName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                            You’ve been spending more than average in{" "}
                            <strong>{category?.name || catName}</strong>. Try setting a
                            monthly cap or exploring lower-cost alternatives.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Tips Section */}
            <div className="mt-10 text-center bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Smart Spending Tips 💡
              </h2>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-left mx-auto max-w-2xl space-y-2">
                <li>Track expenses weekly instead of monthly for more control.</li>
                <li>Use digital wallets or budgeting apps to set spending alerts.</li>
                <li>
                  Review subscriptions under <strong>Entertainment</strong> and
                  <strong> Shopping</strong> — they often cause unnoticed spikes.
                </li>
                <li>
                  Automate savings before spending — allocate 10–20% of income to
                  <strong> Investments</strong> early in the month.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Recommend;
