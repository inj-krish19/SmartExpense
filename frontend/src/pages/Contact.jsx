import React, { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen px-6 py-12 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-sky-600 dark:text-sky-400">
          Contact Us
        </h1>

        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Have questions, issues, or want to reach the owner? Send us a message.
        </p>

        <div className="space-y-5">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Your Name"
            className="w-full p-3 rounded-lg bg-gray-200 dark:bg-gray-700 focus:ring-2 ring-sky-500 outline-none"
          />
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-gray-200 dark:bg-gray-700 focus:ring-2 ring-sky-500 outline-none"
          />
          <textarea
            name="message"
            value={form.message}
            onChange={onChange}
            rows="5"
            placeholder="Your Message"
            className="w-full p-3 rounded-lg bg-gray-200 dark:bg-gray-700 focus:ring-2 ring-sky-500 outline-none"
          ></textarea>

          <button className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
