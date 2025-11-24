import React, { useState, useEffect } from "react";

const Notification = ({ message, type = "success", onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const typeStyles = {
    success:
      "bg-teal-600 text-white dark:bg-teal-500 dark:text-gray-900 border-green-700 dark:border-green-400",
    error:
      "bg-red-600 text-white dark:bg-red-500 dark:text-gray-900 border-red-700 dark:border-red-400",
    warning:
      "bg-yellow-500 text-gray-900 dark:bg-yellow-400 dark:text-gray-900 border-yellow-600 dark:border-yellow-500",
    info:
      "bg-blue-600 text-white dark:bg-blue-500 dark:text-gray-900 border-blue-700 dark:border-blue-400",
  };

  return (
    <div
      className={`fixed top-6 right-6 z-[999] transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
    >
      <div
        className={`px-5 py-3 rounded-xl shadow-lg border backdrop-blur-sm 
        dark:shadow-none dark:border-gray-600
        ${typeStyles[type]}`}
      >
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Notification;
