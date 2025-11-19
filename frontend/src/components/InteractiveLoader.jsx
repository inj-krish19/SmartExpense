import { useEffect, useState } from "react";

const messages = [
  "Analyzing your request...",
  "Fetching secure data...",
  "Optimizing the response...",
  "Preparing everything for you...",
  "Almost there..."
];

export default function InteractiveLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="
        w-full h-[60vh] flex flex-col justify-center items-center space-y-5
        bg-sky-50 dark:bg-gray-900
        transition-colors duration-300
      "
    >
      {/* Ripple Loader */}
      <div className="relative w-16 h-16">
        {/* Outer pulse */}
        <div
          className="
            absolute inset-0 rounded-full opacity-60 animate-ping
            bg-teal-300 dark:bg-sky-300
          "
        ></div>

        {/* Inner core */}
        <div
          className="
            absolute inset-0 rounded-full
            bg-teal-400 dark:bg-sky-400
          "
        ></div>
      </div>

      {/* Message */}
      <p
        className="
          text-lg font-medium animate-pulse
          text-teal-700 dark:text-sky-300
        "
      >
        {messages[index]}
      </p>
    </div>
  );
}
