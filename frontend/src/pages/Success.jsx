import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import { useUser } from "../context/UserContext";

const Success = () => {
    const { login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    

    useEffect(() => {
        const handleGoogleSuccess = async () => {
            try {
                // 🧩 Extract token from query string
                const params = new URLSearchParams(location.search);
                const token = params.get("token");

                if (!token) {
                    setError("No token provided in redirect URL.");
                    setLoading(false);
                    return;
                }

                // 🧠 Store JWT in localStorage
                localStorage.setItem("jwtToken", token);

                // ✅ Verify the token with backend
                const res = await fetch(`${API_URL}/auth/verify-token`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    setError(data.error || "Token verification failed.");
                    setLoading(false);
                    return;
                }

                // 🧍 Store verified user in localStorage
                login(data.user);

                // ✅ Redirect after 3 seconds
                setTimeout(() => navigate("/dashboard"), 3000);
            } catch (err) {
                console.error("Verification error:", err);
                setError("Something went wrong during verification.");
            } finally {
                setLoading(false);
            }
        };

        

        handleGoogleSuccess();
    }, [location, navigate]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700">
                <h1 className="text-2xl font-bold mb-3">Google Login Failed ❌</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300">
            {loading ? (
                <>
                    {/* Loader / verifying */}
                    <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                        Verifying your Google login...
                    </p>
                </>
            ) : (
                <>
                    {/* ✅ Success Animation */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-10 h-10 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="3"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-semibold mt-4 text-center">
                            Successfully Logged In with Google
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            Redirecting you to your dashboard...
                        </p>
                    </div>

                    {/* ✅ Loader Line */}
                    <div className="mt-8 w-40 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-[loading_3s_linear_forwards]" />
                    </div>

                    <style>{`
            @keyframes loading {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
                </>
            )}
        </div>
    );
};

export default Success;
