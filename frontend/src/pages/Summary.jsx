import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { useTheme } from "../context/ThemeContext";
import Loader from '../components/Loader'

const Summary = () => {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [year, setYear] = useState(new Date().getFullYear());
  const years = Array.from(
    { length: new Date().getFullYear() - 2022 + 1 },
    (_, i) => 2022 + i
  );

  useEffect(() => {
    const fetchSummary = async () => {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) {
        navigate("/login");
        return;
      }
      setUser(savedUser);

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/dashboard/review/${savedUser.id}?year=${year}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError("Failed to load review summary.");
          setSummary([]);
          return;
        }

        // Always create array for 12 months
        const allMonths = Array.from({ length: 12 }, (_, i) => {
          const monthData = data.summary.find((m) => m.month === i + 1);
          return (
            monthData || {
              month: i + 1,
              earning: 0,
              total_expenses: 0,
              category_breakdown: {},
            }
          );
        });

        setSummary(allMonths);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error fetching review data.");
        setSummary([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [navigate, year]);



  if (loading) return <Loader />

  if (error)
    return (
      <div className="text-center text-red-600 dark:text-red-400 mt-10">
        <p>{error}</p>
      </div>
    );

  return (
    <div
      className={`p-6 md:p-10 min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
    >
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Yearly Financial Review</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Overview of your earnings and expenses for {year}
        </p>
      </div>

      {/* Year Selector */}
      <div className="flex justify-center gap-3 my-6">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => {
              console.log(`Year changes to ${y}`)
              setYear(y)
            }}
            className={`px-3 py-1.5 rounded-lg border transition ${year === y
              ? "bg-teal-500 text-white border-green-500"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-gray-700"
              }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Masonry-like Grid Layout */}
      <div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max"
        style={{ gridAutoFlow: "dense" }}
      >
        {summary.map((item) => {
          const monthName = new Date(2025, item.month - 1).toLocaleString("default", {
            month: "long",
          });
          const categories = Object.entries(item.category_breakdown || {});
          const totalExpense = item.total_expenses || 0;
          const earning = item.earning || 0;
          const savings = earning - totalExpense;

          return (
            <div
              key={item.month}
              className={`rounded-2xl shadow-md overflow-hidden border transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg
                ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              {/* Month Header */}
              <div
                className={`px-4 py-2 font-semibold text-lg ${isDarkMode ? "bg-sky-400 text-white" : "bg-teal-600 text-white"
                  }`}
              >
                {monthName} {year}
              </div>

              {/* Table Section */}
              <div className="overflow-x-auto flex flex-row gap-2">
                <table className="min-w-full text-sm">
                  <thead
                    className={`${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    <tr>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length > 0 ? (
                      categories.map(([cat, amt]) => (
                        <tr
                          key={cat}
                          className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"
                            } hover:bg-gray-50 dark:hover:bg-gray-700 transition`}
                        >
                          <td className="px-4 py-2">{cat}</td>
                          <td className="px-4 py-2">₹{amt.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="text-center text-gray-500 italic py-3"
                        >
                          No expenses recorded
                        </td>
                      </tr>
                    )}

                    {/* Summary rows */}

                    <tr
                      className={`font-semibold ${isDarkMode ? "bg-gray-700" : "bg-gray-50"
                        } border-t `}
                    >
                      <td className="px-4 py-2">Earning</td>
                      <td className="px-4 py-2 text-green-500">
                        ₹{earning.toLocaleString()}
                      </td>
                    </tr>
                    <tr
                      className={`font-semibold ${isDarkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                    >
                      <td className="px-4 py-2">Total Expense</td>
                      <td className="px-4 py-2 text-red-500">
                        ₹{totalExpense.toLocaleString()}
                      </td>
                    </tr>
                    <tr
                      className={`font-semibold ${isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        }`}
                    >
                      <td className="px-4 py-2">Savings</td>
                      <td
                        className={`px-4 py-2 ${savings >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        ₹{savings.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Summary;
