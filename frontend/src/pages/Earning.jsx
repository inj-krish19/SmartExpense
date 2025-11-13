import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Loader from "../components/Loader";
import { API_URL } from "../config";

const Earning = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [user, setUser] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlySalaries, setMonthlySalaries] = useState(Array(12).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const earningTimeout = useRef(null);
  const yearTimeout = useRef(null);
  const abortController = useRef(null);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) navigate("/login");
    else {
      setUser(savedUser);
      fetchSalariesDebounced(savedUser.id, year);
    }
    // Cleanup on unmount
    return () => abortController.current?.abort();
  }, [year, navigate]);

  // Debounced fetch with cancel
  const fetchSalariesDebounced = (userId, selectedYear) => {
    if (yearTimeout.current) clearTimeout(yearTimeout.current);
    if (abortController.current) abortController.current.abort();

    yearTimeout.current = setTimeout(() => {
      fetchSalaries(userId, selectedYear);
    }, 500); // 500ms debounce
  };

  const fetchSalaries = async (userId, selectedYear) => {
    try {
      setLoading(true);
      abortController.current = new AbortController();
      const res = await fetch(`${API_URL}/earning/user/${userId}`, {
        signal: abortController.current.signal,
      });
      const data = await res.json();
      const salariesByMonth = Array(12).fill("");

      data.forEach(item => {
        const date = new Date(item.earning_date);
        if (date.getFullYear() === Number(selectedYear)) {
          salariesByMonth[date.getMonth()] = item.amount;
        }
      });

      setMonthlySalaries(applyRangeFillOptimized(salariesByMonth));
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        setError("Failed to fetch earning data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Optimized range fill: fills only in-between empty months
  const applyRangeFillOptimized = (arr) => {

    console.log("Smart Filler Invoked")

    const filled = [...arr];

    let lastValue = null;

    for (let i = 0; i < 12; i++) {
      if (filled[i] === "") {
        filled[i] = lastValue;
      }
      lastValue = filled[i];
    }



    console.log("Smart Filler Done", filled)

    return filled;
  };

  const handleMonthlyChange = (idx, value) => {
    const updated = [...monthlySalaries];
    updated[idx] = value || "";
    console.log("Start", updated);

    setMonthlySalaries(applyRangeFillOptimized(updated));

    return updated;
  }

  const handleYearChange = (e) => {
    setYear(e.target.value);
    fetchSalariesDebounced(user?.id, e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!monthlySalaries.some(val => val)) {
      setError("Enter at least one month earning!");
      return;
    }

    try {
      setLoading(true);
      const promises = monthlySalaries.map(async (amt, idx) => {
        if (!amt) return null;
        const month = (idx + 1).toString().padStart(2, "0");
        const response = await fetch(`${API_URL}/earning/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            amount: amt,
            earning_date: `${year}-${month}-01`,
          }),
        });
        const res = await response.json()
        console.log(idx, res);
        return res;
      });

      const results = await Promise.all(promises.filter(Boolean));
      await Promise.all(results.map(r => r));
      setSuccess("Earning saved successfully!");
    } catch (err) {
      console.error(err);
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (loading) return <Loader />;

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"} min-h-screen transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user.username}</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan your annual earning dynamically</p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <label className="block mb-2 font-semibold">Select Year:</label>
          <input
            type="number"
            min="2000"
            max={new Date().getFullYear() + 5}
            value={year}
            onChange={handleYearChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
            {months.map((month, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                <div className="text-lg font-semibold mb-2">{month}</div>
                <input
                  type="number"
                  min="0"
                  placeholder="₹ Amount"
                  value={monthlySalaries[idx] || ""}
                  onChange={(e) => handleMonthlyChange(idx, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>
            ))}
          </div>

          {error && <div className="text-red-500 mb-4 text-center font-semibold">{error}</div>}
          {success && <div className="text-green-500 mb-4 text-center font-semibold">{success}</div>}

          <div className="max-w-md mx-auto">
            <button type="submit" className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
              Save Annual arning
            </button>
          </div>
        </form>

        <div className="mt-12 max-w-2xl mx-auto text-center text-gray-500 dark:text-gray-400">
          <p>
            All empty months are dynamically filled using the nearest entered values. Change any month to adjust ranges automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Earning;
