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
import { format, parseISO, isValid as isValidDateFn } from "date-fns";
import Loader from "../components/Loader";

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
  "#a4de6c", "#d0ed57", "#ffbb28", "#ff6f61", "#bc5090",
  "#003f5c", "#58508d", "#ffa600", "#2f4b7c", "#e15759"
];

const safeFormat = (isoStr, fmt) => {
  if (!isoStr) return "";
  try {
    const d = parseISO(String(isoStr));
    if (!isValidDateFn(d)) return "";
    return format(d, fmt);
  } catch {
    return "";
  }
};

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

  const months = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  const years = useMemo(() => {
    const start = 2022;
    const current = new Date().getFullYear();
    return Array.from({ length: current - start + 1 }, (_, i) => start + i);
  }, []);

  // fetch function - safe and uses AbortController
  const fetchDashboardData = useCallback(async (uid, y, m, controller) => {
    setLoading(true);
    setError("");
    try {
      const signal = controller?.signal;

      const chartsRes = await fetch(`${API_URL}/dashboard/charts/${uid}?month=${m}&year=${y}`, { signal });
      const chartsJson = await chartsRes.json();
      if (!chartsRes.ok || !chartsJson) {
        throw new Error(chartsJson?.error || "Failed to load dashboard charts");
      }

      const summaryRes = await fetch(`${API_URL}/dashboard/summary/${uid}?month=${m}&year=${y}`, { signal });
      const summaryJson = await summaryRes.json();
      if (!summaryRes.ok || !summaryJson) {
        throw new Error(summaryJson?.error || "Failed to load dashboard summary");
      }

      // Ensure charts object exists
      const finalData = {
        charts: chartsJson.charts || {},
        // allow other top-level fields to survive (if backend sends)
        ...Object.keys(chartsJson).reduce((acc, k) => {
          if (k !== "charts") acc[k] = chartsJson[k];
          return acc;
        }, {})
      };

      // attach summary safely
      finalData.charts.monthly_expense = Array.isArray(summaryJson.summary) ? summaryJson.summary : [];

      setDashboardData(finalData);
      setError("");
    } catch (err) {
      if (err.name === "AbortError") {
        // aborted — ignore
        return;
      }
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect: load on mount and when month/year change
  useEffect(() => {
    const savedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch {
        return null;
      }
    })();

    if (!savedUser) {
      navigate("/login");
      return;
    }
    setUser(savedUser);

    const controller = new AbortController();
    const t = setTimeout(() => {
      fetchDashboardData(savedUser.id, year, month, controller);
    }, 350); // debounce

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [navigate, month, year, fetchDashboardData]);

  // Transform chart data into recharts-friendly shapes, safely
  const {
    expenseCategoryBarData,
    expenseCategoryPieData,
    expenseTrendData,
    earningTrendData,
    monthlyExpenseData,
    stats
  } = useMemo(() => {
    if (!dashboardData) {
      return {
        expenseCategoryBarData: [],
        expenseCategoryPieData: [],
        expenseTrendData: [],
        earningTrendData: [],
        monthlyExpenseData: Array.from({ length: 13 }, (_, i) => i === 0 ? { month: "", year: year, total_expenses: 0, total_earning: 0, cumulative_expenses: 0, cumulative_earning: 0 } : ({
          month: months[i - 1],
          year,
          total_expenses: 0,
          total_earning: 0,
          cumulative_expenses: 0,
          cumulative_earning: 0
        })),
        stats: { totalEarning: 0, totalExpenses: 0, remainingAmount: 0, expenseCount: 0 }
      };
    }

    const charts = dashboardData.charts || {};

    // 1) Expense by category (bar)
    const barX = Array.isArray(charts.expense_by_category_bar?.x) ? charts.expense_by_category_bar.x : [];
    const barY = Array.isArray(charts.expense_by_category_bar?.y) ? charts.expense_by_category_bar.y : [];
    const barData = barX.map((cat, i) => ({ category: String(cat || ""), amount: Number(barY[i] || 0) }));

    // 2) Pie - some backends flip x/y, so handle both shapes:
    // prefer: { x: [names], y: [values] } -> produce [{ name, value }]
    // or fallback: { x: [values], y: [names] } (less likely)
    let pieData = [];
    if (Array.isArray(charts.expense_by_category_pie?.x) && Array.isArray(charts.expense_by_category_pie?.y)) {
      // assume x=names, y=values if x elements are strings & y numeric
      const xIsStrings = charts.expense_by_category_pie.x.every((v) => typeof v === "string" || v == null);
      const yIsNumbers = charts.expense_by_category_pie.y.every((v) => typeof v === "number" || (!isNaN(Number(v))));
      if (xIsStrings && yIsNumbers) {
        pieData = charts.expense_by_category_pie.x.map((name, i) => ({ name: String(name || ""), value: Number(charts.expense_by_category_pie.y[i] || 0) }));
      } else {
        // flip
        pieData = charts.expense_by_category_pie.y.map((name, i) => ({ name: String(name || ""), value: Number(charts.expense_by_category_pie.x[i] || 0) }));
      }
    }

    // 3) Expense trend
    const expX = Array.isArray(charts.expense_trend?.x) ? charts.expense_trend.x : [];
    const expY = Array.isArray(charts.expense_trend?.y) ? charts.expense_trend.y : [];
    const expenseTrend = expX.map((d, i) => ({ date: String(d || ""), amount: Number(expY[i] || 0) }));

    // 4) Earning trend
    const earnX = Array.isArray(charts.earning_trend?.x) ? charts.earning_trend.x : [];
    const earnY = Array.isArray(charts.earning_trend?.y) ? charts.earning_trend.y : [];
    const earningTrend = earnX.map((d, i) => ({ date: String(d || ""), earning: Number(earnY[i] || 0) }));

    // 5) monthly expense/earning from summary API -> construct 13-length array (index 0 placeholder) + months 1..12
    const summary = Array.isArray(charts.monthly_expense) ? charts.monthly_expense : [];
    // convert summary entries to an indexable map by numeric month
    const summaryByMonth = {};
    for (const e of summary) {
      const mm = Number(e.month) || 0;
      summaryByMonth[mm] = {
        month: months[Math.max(0, Math.min(11, mm - 1))] || "",
        year: Number(e.year) || year,
        total_expenses: Number(e.total_expenses || e.total_expenses === 0 ? e.total_expenses : e.total_expenses) || 0,
        total_earning: Number(e.total_earning || e.total_salary || 0) || 0,
        cumulative_expenses: Number(e.cumulative_expenses || 0) || 0,
        cumulative_earning: Number(e.cumulative_earning || e.cumulative_salary || 0) || 0
      };
    }
    const monthlyArr = [
      { month: "", year, total_expenses: 0, total_earning: 0, cumulative_expenses: 0, cumulative_earning: 0 },
      ...Array.from({ length: 12 }, (_, i) => summaryByMonth[i + 1] || ({
        month: months[i],
        year,
        total_expenses: 0,
        total_earning: 0,
        cumulative_expenses: 0,
        cumulative_earning: 0
      }))
    ];

    // stats: safer calculation from monthlyArr (skip placeholder at index 0)
    const totalEarning = monthlyArr.slice(1).reduce((s, e) => s + Number(e.total_earning || 0), 0);
    const totalExpenses = monthlyArr.slice(1).reduce((s, e) => s + Number(e.total_expenses || 0), 0);
    const remainingAmount = totalEarning - totalExpenses;
    const expenseCount = (Array.isArray(charts.expense_trend?.x) && charts.expense_trend.x.length) ||
      (Array.isArray(charts.expense_trend?.y) && charts.expense_trend.y.length) || 0;

    return {
      expenseCategoryBarData: barData,
      expenseCategoryPieData: pieData,
      expenseTrendData: expenseTrend,
      earningTrendData: earningTrend,
      monthlyExpenseData: monthlyArr,
      stats: {
        totalEarning,
        totalExpenses,
        remainingAmount,
        expenseCount
      }
    };
  }, [dashboardData, months, year]);

  if (loading) return <Loader />;

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

  // helper for tooltip styles
  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#111827" : "#f9fafb",
    color: isDarkMode ? "#f3f4f6" : "#111827",
    borderRadius: "0.5rem",
    border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
    boxShadow: isDarkMode ? "0 4px 18px rgba(0,0,0,0.5)" : "0 4px 14px rgba(0,0,0,0.08)",
    padding: "0.5rem 0.75rem"
  };

  return (
    <div className={`min-h-screen px-6 md:px-12 py-6 transition ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <i className="bi bi-graph-up text-sky-500 dark:text-teal-400"></i>
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, <strong>{user?.username}</strong>! Here's your financial overview.
          </p>
        </div>

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
        <div className={`p-4 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <i className="bi bi-cash-coin text-green-600 dark:text-green-400 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total earning</p>
              <h4 className="text-2xl font-semibold text-green-600 dark:text-green-400">₹{Number(stats.totalEarning || 0).toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <i className="bi bi-receipt text-red-600 dark:text-red-400 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <h4 className="text-2xl font-semibold text-red-600 dark:text-red-400">₹{Number(stats.totalExpenses || 0).toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stats.remainingAmount >= 0 ? "bg-blue-100 dark:bg-blue-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
              <i className={`bi bi-wallet text-2xl ${stats.remainingAmount >= 0 ? "text-blue-600 dark:text-blue-400" : "text-yellow-600 dark:text-yellow-400"}`}></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Amount</p>
              <h4 className={`text-2xl font-semibold ${stats.remainingAmount >= 0 ? "text-blue-600 dark:text-blue-400" : "text-yellow-600 dark:text-yellow-400"}`}>₹{Number(stats.remainingAmount || 0).toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
              <i className="bi bi-list-ul text-sky-600 dark:text-sky-400 text-2xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Entries</p>
              <h4 className="text-2xl font-semibold text-sky-600 dark:text-sky-400">{Number(stats.expenseCount || 0)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Year selector */}
      <div className="flex justify-center gap-3 my-6">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-3 py-1.5 rounded-lg border transition ${year === y ? "bg-teal-500 text-white border-green-500" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-gray-700"}`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Month selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {months.map((mName, idx) => (
          <button
            key={mName}
            onClick={() => setMonth(idx + 1)}
            className={`px-3 py-1.5 rounded-lg border transition ${month === idx + 1 ? "bg-sky-500 text-white border-sky-500" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-gray-700"}`}
          >
            {mName}
          </button>
        ))}
      </div>

      {/* Header actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm transition-all duration-300">
        <h3 className="text-2xl font-semibold text-sky-600 dark:text-teal-400">{months[month - 1]} - {year}</h3>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-medium shadow-md hover:shadow-lg active:scale-95 transition">
            <i className="bi bi-stars text-rose-300"></i>
            Predict
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-700 text-white font-medium shadow-md hover:shadow-lg active:scale-95 transition">
            <i className="bi bi-lightbulb text-yellow-300"></i>
            Recommend
          </button>

          <div className="hidden md:flex items-center gap-2 ml-2 px-2 py-1 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-inner">
            <button onClick={() => setViewMode("list")} className={`p-1 rounded-lg ${viewMode === "list" ? "bg-sky-500 text-white shadow-md" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`} title="List view"><i className="bi bi-list text-lg" /></button>
            <button onClick={() => setViewMode("grid")} className={`p-1 rounded-lg ${viewMode === "grid" ? "bg-sky-500 text-white shadow-md" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`} title="Grid view"><i className="bi bi-grid text-lg" /></button>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className={`grid gap-6 p-4 ${viewMode === "list" ? "grid-cols-1" : "md:grid-cols-2 grid-cols-1"}`}>

        {/* Yearly Expense by Category (Bar) */}
        <div className={`p-4 border rounded-lg shadow transition ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">Yearly Expense by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseCategoryBarData}>
              <XAxis dataKey="category" tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="amount" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Expense by Category (Pie) */}
        <div className={`p-4 border rounded-lg shadow transition ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">Monthly Expense by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={expenseCategoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }}>
                {expenseCategoryPieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle}
                labelStyle={{ color: isDarkMode ? "#93c5fd" : "#2563eb", fontWeight: 600, marginBottom: "4px", }}
                itemStyle={{ color: isDarkMode ? "#f3f4f6" : "#1f2937", fontSize: "0.875rem", fontWeight: 500, }}
                cursor={{ fill: "rgba(156, 163, 175, 0.15)" }} />
              <Legend align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Trend */}
        <div className={`p-4 border rounded-lg shadow transition ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">Expense Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={expenseTrendData}>
              <XAxis dataKey="date" tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} tickFormatter={(d) => safeFormat(d, "MMM d")} />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => safeFormat(d, "MMM d, yyyy")} />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Line type="monotone" dataKey="amount" stroke={isDarkMode ? "#f87171" : "#dc2626"} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Earning Trend */}
        <div className={`p-4 border rounded-lg shadow transition ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">Earning Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningTrendData}>
              <XAxis dataKey="date" tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} tickFormatter={(d) => safeFormat(d, "MMM yyyy")} />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => safeFormat(d, "MMM yyyy")} />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Line type="monotone" dataKey="earning" stroke={isDarkMode ? "#34d399" : "#059669"} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Progress of Earning and Expense */}
        <div className={`p-4 border rounded-lg shadow transition ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">Progress of Earning and Expense</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyExpenseData}>
              <XAxis dataKey="month" tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Line type="monotone" dataKey="cumulative_earning" stroke="#34d399" strokeWidth={2} />
              <Line type="monotone" dataKey="cumulative_expenses" stroke="#f87171" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Earning and Expense Distribution */}
        <div className={`p-4 border rounded-lg shadow transition ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <h2 className="text-lg font-semibold mb-2 text-sky-500 dark:text-teal-400">Earning and Expense Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyExpenseData.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <YAxis tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: isDarkMode ? "#e5e7eb" : "#374151" }} />
              <Bar dataKey="total_earning" fill="#34d399" />
              <Bar dataKey="total_expenses" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions footer */}
      <div className="w-full mt-6">
        <div className={`rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}>
          <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col">
              <h6 className={`flex items-center gap-2 text-base font-semibold ${isDarkMode ? "text-amber-400" : "text-amber-500"}`}><i className="bi bi-lightning" />Quick Actions</h6>
              <small className={`${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-0.5`}>Manage your financial data efficiently</small>
            </div>

            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
              <button onClick={() => navigate("/earning")} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 ${isDarkMode ? "border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white" : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"}`}><i className="bi bi-plus-circle me-1" />Add Earning</button>
              <button onClick={() => navigate("/expenses")} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 ${isDarkMode ? "border-gray-400 text-gray-300 hover:bg-gray-600 hover:text-white" : "border-gray-500 text-gray-700 hover:bg-gray-600 hover:text-white"}`}><i className="bi bi-receipt me-1" />Add Expenses</button>
              <button onClick={() => navigate("/summary")} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 ${isDarkMode ? "border-green-500 text-green-400 hover:bg-green-600 hover:text-white" : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"}`}><i className="bi bi-clipboard-check me-1" />Summary</button>
              <button onClick={() => navigate("/comparison")} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 ${isDarkMode ? "border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-white" : "border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"}`}><i className="bi bi-calendar me-1" />Comparison</button>
              <button onClick={() => window.location.reload()} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 ${isDarkMode ? "border-cyan-500 text-cyan-400 hover:bg-cyan-600 hover:text-white" : "border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white"}`}><i className="bi bi-arrow-clockwise me-1" />Refresh</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
