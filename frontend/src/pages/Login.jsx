import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loader from "../components/Loader";
import { API_URL, CLIENT_ID } from "../config";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const REDIRECT_URI = `${API_URL}/auth/google-callback`

  console.log(REDIRECT_URI)

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧩 Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // 🧩 Handle Email/Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      console.log("Login response:", result);

      if (res.ok) {
        login(result.user);
        navigate("/");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Handle Google Sign-In
  const handleGoogleLogin = async () => {
    try {

      let url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&access_type=offline&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email `

      console.log("URL", url)

      window.location.href = url;


    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google sign-in failed. Try again.");
    }
  };

  if (loading) return <Loader />;

  return (
    <div
      className={`flex justify-center items-center min-h-screen px-4 transition-colors 
      ${loading ? "overflow-hidden" : ""}
      ${"bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100"}`}
    >
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-xl transition 
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800 backdrop-blur-md`}
      >
        {/* Header */}
        <h2 className="text-3xl font-bold text-center mb-2 text-sky-600 dark:text-teal-400">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Log in to access your dashboard
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 text-center text-red-500 font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900
                border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100
                focus:ring-2 focus:ring-sky-500 dark:focus:ring-teal-500 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900
                border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100
                focus:ring-2 focus:ring-sky-500 dark:focus:ring-teal-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 rounded-xl text-white font-semibold
              bg-gradient-to-r from-sky-600 to-blue-700 
              hover:from-sky-500 hover:to-blue-600
              dark:from-teal-600 dark:to-emerald-700
              hover:shadow-md active:scale-95 transition-transform duration-200"
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
          <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">
            OR
          </span>
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 
            bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800
            transition shadow-sm hover:shadow-md active:scale-95"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        {/* Sign Up Redirect */}
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-sky-600 dark:text-teal-400 hover:underline font-medium no-underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
