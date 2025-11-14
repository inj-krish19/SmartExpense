import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"

const Navbar = () => {
  const { user, logout } = useUser()
  const { isDarkMode, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate("/login")
    setIsOpen(false)
  }

  // Common navigation links
  const commonLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
  ]

  // Auth-dependent links
  const authLinks = !user
    ? [
      { path: "/signup", label: "Sign Up" },
      { path: "/login", label: "Login" },
    ]
    : [

      { path: "/earning", label: "Earning" },
      { path: "/expenses", label: "Expenses" },
      { path: "/dashboard", label: "Dashboard" },
      { path: "/summary", label: "Summary" },
      { path: "/track-info", label: "Information" },
      { path: "/profile", label: "Profile" },
      { path: "/logout", label: "Logout", action: handleLogout },
    ]

  return (
    <header className="shadow-md bg-white dark:bg-gray-900 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl font-bold no-underline flex flex-row gap-2 items-center gap-1"
        >
          <img src="logo.png" className="size-12" />
          <span className="text-teal-400 dark:text-sky-500">
            <span className="text-sky-500 dark:text-teal-400">Smart</span>Expense
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-2xl focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          {isOpen ? "✕" : "☰"}
        </button>

        {/* Links */}
        <div
          className={`flex flex-col lg:flex-row lg:items-center gap-2
    absolute lg:static left-0 w-full lg:w-auto
    bg-white dark:bg-gray-900 lg:bg-transparent lg:dark:bg-transparent
    shadow-md lg:shadow-none
    p-4 lg:p-0
    transition-all duration-300
    z-50
    ${isOpen ? "top-14 opacity-100" : "top-[-500px] opacity-0 lg:opacity-100"}
  `}
        >
          {[...commonLinks, ...authLinks].map((link, idx) =>
            link.label === "Logout" ? (
              <button
                key={idx}
                onClick={link.action}
                className="px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 dark:font-medium transition hover:bg-red-200 dark:hover:bg-red-700"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={idx}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition no-underline ${isActive(link.path)
                  ? "bg-sky-500 text-white dark:bg-teal-500"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                {link.label}
              </Link>
            )
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="ml-2 px-3 py-2 rounded-md text-sm font-medium transition hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            <span className={`text-black! dark:text-white! ${isDarkMode ? "bi bi-sun" : "bi bi-moon"}`} />
          </button>
        </div>

      </nav>
    </header>
  )
}

export default Navbar
