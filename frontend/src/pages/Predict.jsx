import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { API_URL } from "../config";

const Predict = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictedExpense, setPredictedExpense] = useState([]);
  const [chartData, setChartData] = useState([]);

  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const currentYear = new Date().getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!savedUser?.id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/dashboard/predicted-expense/${savedUser.id}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        const data = await response.json();
        if (data.success) {
          setPredictedExpense(data.predicted_expenses);

          // Normalize and combine data
          const months = Array.from({ length: 12 }, (_, i) => i + 1);
          const actualMap = data.expenses || {};

          const combined = months.map((m, i) => ({
            month: monthNames[m - 1],
            actual: actualMap[m] || 0,
            predicted: Math.max(0, data.predicted_expenses[i]),
          }));

          setChartData(combined);
        } else {
          throw new Error("Failed to fetch prediction data.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [savedUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 px-4 py-10 transition-colors">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-6">
          Expense Prediction for {currentYear}
        </h1>

        {loading && (
          <p className="text-center text-blue-600 dark:text-blue-400 font-medium">
            Fetching predictions...
          </p>
        )}
        {error && <p className="text-center text-red-500 font-medium">{error}</p>}

        {!loading && !error && chartData.length > 0 && (
          <>
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#555" }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: "#555" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      color: "#000",
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    name="Actual Expense"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    name="Predicted Expense"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200">
                Total Predicted Expense for {currentYear}
              </h2>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                ₹
                {predictedExpense.length
                  ? predictedExpense
                      .reduce((a, b) => a + Math.max(0, b), 0)
                      .toLocaleString()
                  : 0}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Predict;
