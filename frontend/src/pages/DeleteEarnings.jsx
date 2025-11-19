// DeleteEarnings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const months = [
  { id: 1, name: "January" },
  { id: 2, name: "February" },
  { id: 3, name: "March" },
  { id: 4, name: "April" },
  { id: 5, name: "May" },
  { id: 6, name: "June" },
  { id: 7, name: "July" },
  { id: 8, name: "August" },
  { id: 9, name: "September" },
  { id: 10, name: "October" },
  { id: 11, name: "November" },
  { id: 12, name: "December" },
];

export default function DeleteEarnings() {
  const navigate = useNavigate();

  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [previewInfo, setPreviewInfo] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!savedUser) navigate("/login");
  }, [navigate, savedUser]);

  const clearAlerts = () => {
    setMessage(null);
    setError(null);
  };

  // Year Preview
  const fetchYearPreview = async (year) => {
    if (!savedUser) return;
    setPreviewLoading(true);
    setPreviewInfo(null);

    try {
      const res = await fetch(`${API_URL}/earning/yearly?user_id=${savedUser.id}&year=${year}`);
      const data = await res.json();
      setPreviewInfo(data);
    } catch {
      setPreviewInfo(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Month Preview
  const fetchMonthPreview = async (year, month) => {
    if (!savedUser) return;
    setPreviewLoading(true);
    setPreviewInfo(null);

    try {
      const res = await fetch(
        `${API_URL}/earning/delete?user_id=${savedUser.id}&month=${month}&year=${year}`,
        { method: "GET" }
      );
      const data = await res.json();
      setPreviewInfo(data);
    } catch {
      setPreviewInfo(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Delete Year
  const handleDeleteYear = async () => {
    clearAlerts();
    if (!savedUser) return setError("User not authenticated.");

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/earning/yearly?user_id=${savedUser.id}&year=${selectedYear}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || `All earnings of year ${selectedYear} removed successfully.`);
        setPreviewInfo(data);
      } else {
        setError(data.error || "Failed to delete selected year's earnings.");
      }
    } catch {
      setError("Network error while deleting year's earnings.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Month
  const handleDeleteMonth = async () => {
    clearAlerts();
    if (!savedUser) return setError("User not authenticated.");
    if (!selectedMonth) return setError("Please select a month to delete.");

    const monthName = months.find((m) => m.id === Number(selectedMonth))?.name;

    setLoading(true);
    try {
      const url = `${API_URL}/earning/delete?user_id=${savedUser.id}&month=${selectedMonth}&year=${selectedYear}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || `All earnings for ${monthName} ${selectedYear} removed successfully.`);
        setPreviewInfo(data);
      } else {
        setError(data.error || "Failed to delete earnings.");
      }
    } catch {
      setError("Network error while deleting earnings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-10 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Delete Earnings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Remove earnings by month or year. These actions cannot be undone.
            </p>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            Signed in as <strong className="text-sky-600 dark:text-teal-300">{savedUser?.username}</strong>
          </div>
        </header>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          
          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setSelectedMonth(null);
                  clearAlerts();
                }}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-black dark:text-white"
              >
                {availableYears.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Month (optional)</label>
              <select
                value={selectedMonth ?? ""}
                onChange={(e) => {
                  setSelectedMonth(e.target.value ? Number(e.target.value) : null);
                  clearAlerts();
                }}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-black dark:text-white"
              >
                <option value="">-- Select Month --</option>
                {months.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
            <button
              onClick={() => fetchYearPreview(selectedYear)}
              disabled={previewLoading || loading}
              className="px-4 py-2 rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200 transition"
            >
              Preview Year
            </button>

            <button
              onClick={() => fetchMonthPreview(selectedYear, selectedMonth)}
              disabled={!selectedMonth || previewLoading || loading}
              className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
            >
              Preview Month
            </button>

            <div className="flex-1" />

            <button
              onClick={handleDeleteMonth}
              disabled={!selectedMonth || loading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Delete Month
            </button>

            <button
              onClick={handleDeleteYear}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 transition"
            >
              Delete Year
            </button>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Preview</label>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 min-h-[64px]">
              {previewLoading ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">Checking server...</div>
              ) : previewInfo ? (
                Array.isArray(previewInfo?.earnings) && previewInfo.earnings.length > 0 ? (
                  
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-700">
                          <th className="py-1 text-gray-700 dark:text-gray-300">Date</th>
                          <th className="py-1 text-gray-700 dark:text-gray-300">Amount</th>
                        </tr>
                      </thead>

                      <tbody>
                        {previewInfo.earnings.map((e) => (
                          <tr key={e.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-1 text-gray-800 dark:text-gray-200">
                              {new Date(e.earning_date).toLocaleDateString()}
                            </td>
                            <td className="py-1 text-gray-800 dark:text-gray-200">
                              {e.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                ) : (
                  <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-200">
                    {previewInfo.message}
                  </pre>
                )
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Click <strong>Preview Year</strong> or <strong>Preview Month</strong> to see server details.
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="mt-4 space-y-2">
            {message && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                {message}
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Safety & Tips</h3>
          <ul className="list-disc list-inside mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>Use preview before deleting anything.</li>
            <li>Data removal cannot be undone.</li>
            <li>Ensure you are logged in as the correct user.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
