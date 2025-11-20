import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-10">

        {/* === Top Section === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <span className="text-2xl font-bold text-sky-600 dark:text-teal-400">
                SmartExpense
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              SmartExpense helps you manage your income and spending with simplicity
              and clarity. Visualize your finances, plan savings, and make smarter decisions.
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/contact" className="no-underline">
                <i className="bi bi-envelope mr-1"></i>Contact
              </Link>
              <Link to="/about" className="no-underline">
                About
              </Link>
              <a href="#features" className="no-underline">
                Features
              </a>
            </div>
          </div>

          {/* Quick Start */}
          <div>
            <h6 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Quick Start
            </h6>
            <ul className="space-y-2 text-sm">
              <li><Link to="/earning" className="no-underline">Add Earning</Link></li>
              <li><Link to="/expenses" className="no-underline">Upload Expenses</Link></li>
              <li><Link to="/dashboard" className="no-underline">View Dashboard</Link></li>
              <li><Link to="/profile" className="no-underline">My Profile</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h6 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Resources
            </h6>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="no-underline">About SmartExpense</Link></li>
              <li><a href="#how-it-works" className="no-underline">How It Works</a></li>
              <li>
                <a
                  href="https://github.com/Rvbaghel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  Source Code
                </a>
              </li>
              <li>
                <a href="mailto:baghelvishal264@gmail.com" className="no-underline">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section (NEW) */}
          <div>
            <h6 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Legal
            </h6>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="no-underline">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="no-underline">Refund Policy</Link></li>
              <li><Link to="/cookie-policy" className="no-underline">Cookie Policy</Link></li>
              <li><Link to="/terms-conditions" className="no-underline">Terms & Conditions</Link></li>
              <li><Link to="/disclaimer" className="no-underline">Disclaimer</Link></li>
              <li><Link to="/contact" className="no-underline">Contact</Link></li>
            </ul>
          </div>

        </div>

        {/* === Divider === */}
        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        {/* === Bottom Section === */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">

          {/* Copyright */}
          <p className="text-gray-600 dark:text-gray-400 text-center md:text-left">
            © {currentYear}{" "}
            <strong className="text-sky-600 dark:text-teal-400">SmartExpense</strong>.
            All rights reserved. Developed by{" "}
            <strong className="text-sky-600 dark:text-teal-400">Vishal Baghel</strong> and{" "}
            <strong className="text-teal-600 dark:text-sky-400">Krish Shah</strong>.
          </p>

          {/* Social Icons */}
          <div className="flex gap-3">
            {[
              { href: "https://github.com/Rvbaghel", icon: "bi-github", bg: "bg-gray-900" },
              { href: "https://in.linkedin.com/in/vishal-baghel-a055b5249", icon: "bi-linkedin", bg: "bg-[#0A66C2]" },
              { href: "mailto:baghelvishal264@gmail.com", icon: "bi-envelope", bg: "bg-red-600" },
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${item.bg} shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
              >
                <i className={`bi ${item.icon}`} />
              </a>
            ))}
          </div>
        </div>

        {/* === Disclaimer === */}
        <div className="mt-6 text-xs text-center text-gray-500 dark:text-gray-500 leading-relaxed max-w-3xl mx-auto">
          SmartExpense is a personal project and not affiliated with any financial
          institution. Use responsibly. All analytics and financial data remain
          securely stored and private to your account.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
