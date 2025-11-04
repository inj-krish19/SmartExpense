import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  CartesianGrid
} from "recharts";
import { format, parseISO } from "date-fns";
import Loader from "../components/Loader";

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
  "#a4de6c", "#d0ed57", "#ffbb28", "#ff6f61", "#bc5090",
  "#003f5c", "#58508d", "#ffa600", "#2f4b7c", "#e15759"
];

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = useMemo(() => {
    const start = 2022;
    const current = new Date().getFullYear();
    return Array.from({ length: current - start + 1 }, (_, i) => start + i);
  }, []);

  // Optimized fetch with abort + debounce
  const fetchDashboardData = useCallback(async (uid, y, m, controller) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/charts/${uid}?month=${m}&year=${y}`, {
        signal: controller.signal
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load dashboard charts");

      const r = await fetch(`${API_URL}/dashboard/summary/${uid}?month=${m}&year=${y}`, {
        signal: controller.signal
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Failed to load dashboard summary");

      // attach summary into charts for unified access
      data.charts["monthly_expense"] = d.summary;

      setDashboardData(data);
      setError("");
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
        setDashboardData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Effect for loading data (with debounce + cancel)
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) {
      navigate("/login");
      return;
    }
    setUser(savedUser);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetchDashboardData(savedUser.id, year, month, controller);
    }, 400); // debounce for fast switching

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [navigate, month, year, fetchDashboardData]);

  // Transform chart data
  const {
    expenseCategoryBarData,
    expenseCategoryPieData,
    expenseTrendData,
    earningTrendData,
    monthlyExpenseData,
    stats
  } = useMemo(() => {
    if (!dashboardData) return {};

    const charts = dashboardData.charts || {};
    console.log("Charts", dashboardData.charts)

    return {
      // Expense by Category (Bar)
      expenseCategoryBarData:
        charts.expense_by_category_bar?.x?.map((cat, i) => ({
          category: cat,
          amount: charts.expense_by_category_bar.y[i]
        })) || [],

      // Expense by Category (Pie)
      expenseCategoryPieData:
        charts.expense_by_category_pie?.x?.map((cat, i) => ({
          name: cat,
          value: charts.expense_by_category_pie.y[i]
        })) || [],

      // Expense Trend (Line)
      expenseTrendData:
        charts.expense_trend?.x?.map((date, i) => ({
          date,
          amount: charts.expense_trend.y[i]
        })) || [],

      // earning Trend (Line)
      earningTrendData:
        charts.earning_trend?.x?.map((date, i) => ({
          date,
          earning: charts.earning_trend.y[i]
        })) || [],

      // Monthly Expense & earning (from summary API)
      monthlyExpenseData:
        [{
          month: '',
          year: 2025,
          total_expenses: 0,
          total_earning: 0,
          cumulative_expenses: 0,
          cumulative_earning: 0
        }, ...charts.monthly_expense?.map((entry) => ({
          month: months[entry.month - 1],
          year: entry.year,
          total_expenses: entry.total_expenses,
          total_earning: entry.total_earning,
          cumulative_expenses: entry.cumulative_expenses,
          cumulative_earning: entry.cumulative_earning
        })) || []],

      stats: {
        totalearning: charts.monthly_expense[months.length - 1].cumulative_earning || 0,
        totalExpenses: charts.monthly_expense[months.length - 1].cumulative_expenses || 0,
        remainingAmount: (charts.monthly_expense[months.length - 1].cumulative_earning || 0) - (charts.monthly_expense[months.length - 1].cumulative_expenses || 0),
        expenseCount: charts.expense_trend.x.length || 0
      }
    };

  }, [dashboardData, year]);

  if (loading) return <Loader />

  if (error) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="max-w-md w-full space-y-6">
          <div className="flex items-center gap-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-xl shadow-md">
            <i className="bi bi-exclamation-triangle-fill text-xl"></i>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 md:px-12 py-6 transition ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {/* Left Side */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <i className="bi bi-graph-up text-sky-500 dark:text-teal-400"></i>
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, <strong>{user?.username}</strong>! Here's your financial overview.
          </p>
        </div>

        {/* Right Side */}
        <div className="text-right">
          <small className="block text-gray-500 dark:text-gray-400">Step 4 of 4</small>
          <small className="block text-green-500 font-semibold">100% Complete!</small>
          <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-green-500 w-full transition-all duration-700"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total earning */}
        <div
          className={`p-4 rounded-xl shadow-sm border transition-colors 
      ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <i className="bi bi-cash-coin text-green-600 dark:text-green-400 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total earning</p>
              <h4 className="text-2xl font-semibold text-green-600 dark:text-green-400">
                ₹{stats.totalearning.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div
          className={`p-4 rounded-xl shadow-sm border transition-colors 
      ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <i className="bi bi-receipt text-red-600 dark:text-red-400 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <h4 className="text-2xl font-semibold text-red-600 dark:text-red-400">
                ₹{stats.totalExpenses.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>

        {/* Remaining Amount */}
        <div
          className={`p-4 rounded-xl shadow-sm border transition-colors 
      ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className="flex items-center">
            <div
              className={`p-3 rounded-lg ${stats.remainingAmount >= 0
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}
            >
              <i
                className={`bi bi-wallet text-2xl ${stats.remainingAmount >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-yellow-600 dark:text-yellow-400"
                  }`}
              ></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Amount</p>
              <h4
                className={`text-2xl font-semibold ${stats.remainingAmount >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-yellow-600 dark:text-yellow-400"
                  }`}
              >
                ₹{stats.remainingAmount.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>

        {/* Total Entries */}
        <div
          className={`p-4 rounded-xl shadow-sm border transition-colors 
      ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
              <i className="bi bi-list-ul text-sky-600 dark:text-sky-400 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Entries</p>
              <h4 className="text-2xl font-semibold text-sky-600 dark:text-sky-400">
                {stats.expenseCount}
              </h4>
            </div>
          </div>
        </div>
      </div>



      {/* Year Selector */}
      <div className="flex justify-center gap-3 my-6">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-3 py-1.5 rounded-lg border transition ${year === y
              ? "bg-teal-500 text-white border-green-500"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-gray-700"
              }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Month Selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {months.map((curr_month, index) => (
          <button
            key={index}
            onClick={() => setMonth(index + 1)}
            className={`px-3 py-1.5 rounded-lg border transition ${month === index + 1
              ? "bg-sky-500 text-white border-sky-500"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-gray-700"
              }`}
          >
            {curr_month}
          </button>
        ))}
      </div>


      <div
        className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-2xl shadow-sm transition-all duration-300"
      >
        {/* ✅ Month-Year Display */}
        <h3 className="text-2xl font-semibold text-sky-600 dark:text-teal-400 text-center md:text-left">
          {months[month - 1]} - {year}
        </h3>

        {/* ✅ Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Predict Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl 
            bg-gradient-to-r from-violet-600 to-purple-700 
            text-white font-medium shadow-md hover:shadow-lg 
            hover:from-violet-500 hover:to-purple-600 
            active:scale-95 transition transform duration-200 ease-in-out"
          >
            <i className="bi bi-stars text-rose-300"></i>
            Predict
          </button>

          {/* Recommend Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl 
            bg-gradient-to-r from-rose-600 to-pink-700 
            text-white font-medium shadow-md hover:shadow-lg 
            hover:from-rose-500 hover:to-pink-600 
            active:scale-95 transition transform duration-200 ease-in-out"
          >
            <i className="bi bi-lightbulb text-yellow-300"></i>
            Recommend
          </button>

          {/* ✅ View Toggle Buttons */}
          <div
            className="hidden md:flex items-center gap-2 ml-2 px-2 py-1 rounded-xl 
            bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
            shadow-inner transition-all duration-200"
          >
            {/* List View */}
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-lg transition-all duration-200 ${viewMode === "list"
                ? "bg-sky-500 text-white shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              title="List View"
            >
              <i className="bi bi-list text-lg"></i>
            </button>

            {/* Grid View */}
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-lg transition-all duration-200 ${viewMode === "grid"
                ? "bg-sky-500 text-white shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              title="Grid View"
            >
              <i className="bi bi-grid text-lg"></i>
            </button>
          </div>
        </div>
      </div>


      {/* Charts */}
      <div className={`grid gap-6 p-4 ${viewMode === "list" ? "grid-cols-1" : "md:grid-cols-2 grid-cols-1"}`}>
        {/* Expense by Category Bar */}
        <div className={`p-4 border rounded-lg shadow transition 
    ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400 ">Yearly Expense by Category </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseCategoryBarData}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                  color: isDarkMode ? "#e5e7eb" : "#374151",
                  borderRadius: "0.5rem",
                  border: "none"
                }}
              />
              <Legend />
              <Bar dataKey="amount" fill="var(--color-sky-500)" color="var(--color-teal-500)" />
            </BarChart>
          </ResponsiveContainer>
        </div>


        {/* Expense by Category (Pie) */}
        <div className={`p-4 border rounded-lg shadow transition 
    ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">
            Monthly Expense by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseCategoryPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} // tailwind gray-200 / gray-700
              >
                {expenseCategoryPieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={isDarkMode
                      ? ["#22d3ee", "#34d399", "#facc15", "#f87171", "#c084fc"][index % 5] // sky-400, green-400, yellow-400, red-400, purple-400
                      : ["#0284c7", "#059669", "#ca8a04", "#dc2626", "#9333ea"][index % 5]} // sky-600, green-600, yellow-600, red-600, purple-600
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb", // dark:bg-gray-800, light:bg-gray-50
                  color: isDarkMode ? "#f9fafb" : "#111827",           // dark:text-gray-100, light:text-gray-900
                  borderRadius: "0.75rem",
                  border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                  boxShadow: isDarkMode
                    ? "0 2px 10px rgba(0,0,0,0.4)"
                    : "0 2px 8px rgba(0,0,0,0.1)",
                  padding: "0.5rem 0.75rem",
                }}
                labelStyle={{
                  color: isDarkMode ? "#93c5fd" : "#2563eb", // blue shades for label
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
                itemStyle={{
                  color: isDarkMode ? "#f3f4f6" : "#1f2937", // consistent with theme
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
                cursor={{ fill: "rgba(156, 163, 175, 0.15)" }} // subtle hover background
              />
              <Legend align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Trend */}
        <div className={`p-4 border rounded-lg shadow transition 
    ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">
            Expense Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={expenseTrendData}>
              <XAxis
                dataKey="date"
                tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }}
                tickFormatter={(str) => format(parseISO(str), "MMM d")}
              />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                  color: isDarkMode ? "#e5e7eb" : "#374151",
                  borderRadius: "0.5rem",
                  border: "none"
                }}
                labelFormatter={(str) => format(parseISO(str), "MMM d, yyyy")}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={isDarkMode ? "#f87171" : "#dc2626"} // red-400 / red-600
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* earning Trend */}
        <div className={`p-4 border rounded-lg shadow transition 
    ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">
            Earning Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningTrendData}>
              <XAxis
                dataKey="date"
                tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }}
                tickFormatter={(str) => format(parseISO(str), "MMM yyyy")}
              />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                  color: isDarkMode ? "#e5e7eb" : "#374151",
                  borderRadius: "0.5rem",
                  border: "none"
                }}
                labelFormatter={(str) => format(parseISO(str), "MMM yyyy")}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Line
                type="monotone"
                dataKey="earning"
                stroke={isDarkMode ? "#34d399" : "#059669"} // green-400 / green-600
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Yearly Difference */}
        <div className={`p-4 border rounded-lg shadow transition 
    ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">
            Progress of Earning and Expense
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyExpenseData}>
              <XAxis
                dataKey="month"
                tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }}
              />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                  color: isDarkMode ? "#e5e7eb" : "#374151",
                  borderRadius: "0.5rem",
                  border: "none"
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Line
                type="monotone"
                dataKey="cumulative_earning"
                stroke={isDarkMode ? "var(--color-green-400)" : "var(--color-green-600)"} // red-400 / red-600
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="cumulative_expenses"
                stroke={isDarkMode ? "var(--color-red-400)" : "var(--color-red-600)"} // red-400 / red-600
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly earning vs Expense */}
        <div className={`p-4 border rounded-lg shadow transition 
    ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">
            Earning and Expense Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyExpenseData.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }}
              />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                  color: isDarkMode ? "#e5e7eb" : "#374151",
                  borderRadius: "0.5rem",
                  border: "none"
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Bar
                dataKey="total_earning"
                fill={isDarkMode ? "var(--color-green-400)" : "var(--color-green-600)"} // red-400 / red-600
              />
              <Bar
                dataKey="total_expenses"
                fill={isDarkMode ? "var(--color-red-400)" : "var(--color-red-600)"} // red-400 / red-600
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="w-full mt-6">
        <div
          className={`rounded-2xl border shadow-sm transition-colors duration-300 
        ${isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-white border-gray-200 text-gray-800"
            }`}
        >
          <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left Section */}
            <div className="flex flex-col">
              <h6
                className={`flex items-center gap-2 text-base font-semibold ${isDarkMode ? "text-amber-400" : "text-amber-500"
                  }`}
              >
                <i className="bi bi-lightning"></i>
                Quick Actions
              </h6>
              <small
                className={`${isDarkMode ? "text-gray-400" : "text-gray-500"
                  } mt-0.5`}
              >
                Manage your financial data efficiently
              </small>
            </div>

            {/* Right Section */}
            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
              <button
                onClick={() => navigate("/earning")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border 
                transition-all duration-200 hover:scale-105
                ${isDarkMode
                    ? "border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white"
                    : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  }`}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Add earning
              </button>

              <button
                onClick={() => navigate("/expenses")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border 
                transition-all duration-200 hover:scale-105
                ${isDarkMode
                    ? "border-gray-400 text-gray-300 hover:bg-gray-600 hover:text-white"
                    : "border-gray-500 text-gray-700 hover:bg-gray-600 hover:text-white"
                  }`}
              >
                <i className="bi bi-receipt me-1"></i>
                Add Expenses
              </button>

              <button
                onClick={() => navigate("/summary")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border 
                transition-all duration-200 hover:scale-105
                ${isDarkMode
                    ? "border-green-500 text-green-400 hover:bg-green-600 hover:text-white"
                    : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                  }`}
              >
                <i className="bi bi-clipboard-check me-1"></i>
                Summary
              </button>

              <button
                onClick={() => navigate("/comparison")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border 
                transition-all duration-200 hover:scale-105
                ${isDarkMode
                    ? "border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                    : "border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                  }`}
              >
                <i className="bi bi-calendar me-1"></i>
                Comparison
              </button>

              <button
                onClick={() => window.location.reload()}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border 
                transition-all duration-200 hover:scale-105
                ${isDarkMode
                    ? "border-cyan-500 text-cyan-400 hover:bg-cyan-600 hover:text-white"
                    : "border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white"
                  }`}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;
