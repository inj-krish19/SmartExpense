# SmartExpense 💸

SmartExpense is a full-stack **AI-powered Personal Expense Management System** designed to help users track, analyze, predict, and optimize their financial spending. The system combines intuitive data visualization with machine learning insights to provide actionable financial intelligence.

---

## 🚀 Project Overview

SmartExpense allows users to:
- Track earnings and expenses efficiently
- Categorize spending
- Upload bulk data using CSV files
- Visualize financial trends through charts
- Receive AI-based expense reduction recommendations
- Predict future expenses using Machine Learning
- Generate and email detailed PDF reports

This project is developed as a **college major project** with a strong focus on **scalability, clean architecture, and real-world use cases**.

---

## 🧩 System Architecture

The application follows a **modular layered architecture**:

- Frontend (React + Tailwind)
- Backend API (Flask)
- Business Logic Layer
- Data Access Layer
- AI / ML Engine
- Report Engine
- Integration Services (OAuth, Email)

---

## 🎨 Frontend (React + Tailwind CSS)

### 🔹 Technologies Used
- React.js
- Tailwind CSS
- ReCharts
- Axios

### 🔹 Frontend Features

#### ✅ Authentication
- Google OAuth Login
- Classic Email & Password Login

#### ✅ Expense Management
- Add expense by date and category
- View expenses with pagination
- View latest expense records

#### ✅ Earnings Management
- Add monthly and yearly earnings
- Bulk earning upload via CSV

#### ✅ Data Visualization
- Line Chart: Last 30 expense entries
- Pie Chart: Current month category-wise expense
- Bar Chart: Category-wise total expenses
- Trend Chart: Earnings vs Expenses
- Comparison Bar Chart: Monthly earning vs expense

#### ✅ Reports
- Interactive summary dashboards
- Downloadable PDF reports

---

## ⚙️ Backend (Flask)

### 🔹 Technologies Used
- Python
- Flask
- JWT / Token Authentication
- SQL Database
- Pandas
- Scikit-learn

### 🔹 Backend Features

#### ✅ User Management
- Register / Login
- Token-based authentication
- Google OAuth integration

#### ✅ Expense & Earning APIs
- Add, delete monthly/yearly expenses
- Add earnings (single & bulk)
- Category-based expense tracking

#### ✅ CSV Upload Module
- Upload earnings and expenses via CSV
- Automatic validation and preprocessing

---

## 🤖 AI & Machine Learning Features

### 🔹 Expense Prediction (Linear Regression)

- **Independent Variables**
  - Current earning
  - Past earnings
- **Dependent Variable**
  - Cumulative past expenses

Predicts upcoming month’s total expense using **Linear Regression**.

---

### 🔹 AI Expense Recommendation Engine

Uses priority-based category analysis:
- Last Month → 65% weight
- 2nd Last Month → 25% weight
- 3rd Last Month → 10% weight

Identifies high-spending categories and recommends areas to reduce expenses.

---

## 📊 Analytics & Insights

- Monthly expense summary by category
- Yearly cumulative expense analysis
- Latest expense records with pagination
- Category-wise spending insights

---

## 📄 Report Generation

- Generates PDF reports containing:
  - Charts
  - Expense summaries
  - Earnings trends
  - AI insights
- Automatically emails the generated report to the user

---

## 🗂️ Core Entities

- Person
- Category
- Expense
- Earning

Each entity is designed with clean relationships and modular service handling.

---

## 🔐 Security

- Password hashing
- Token-based authentication
- Secure OAuth integration

---

## 🧪 Future Enhancements

- Budget limit alerts
- Mobile application
- Advanced ML models (LSTM)
- Multi-currency support
- Export to Excel

---

## 👨‍💻 Contributors

Developed by **SmartExpense Team** as a college project.

---

## 📌 Conclusion

SmartExpense is not just a tracker — it’s a **smart financial assistant** that helps users understand, predict, and control their spending using **data visualization and AI**.

---

✨ *Track smart. Spend smarter.*AI / ML Engine

Report Engine

Integration Services (OAuth, Email)



---

🎨 Frontend (React + Tailwind CSS)

🔹 Technologies Used

React.js

Tailwind CSS

ReCharts

Axios


🔹 Frontend Features

✅ Authentication

Google OAuth Login

Classic Email & Password Login


✅ Expense Management

Add expense by date and category

View expenses with pagination

View latest expense records


✅ Earnings Management

Add monthly and yearly earnings

Bulk earning upload via CSV


✅ Data Visualization

Line Chart: Last 30 expense entries

Pie Chart: Current month category‑wise expense

Bar Chart: Category‑wise total expenses

Trend Chart: Earnings vs Expenses

Comparison Bar Chart: Monthly earning vs expense


✅ Reports

Interactive summary dashboards

Downloadable PDF reports



---

⚙️ Backend (Flask)

🔹 Technologies Used

Python

Flask

Flask‑JWT / Token Authentication

SQL Database

Pandas

Scikit‑learn


🔹 Backend Features

✅ User Management

Register / Login

Token‑based authentication

Google OAuth integration


✅ Expense & Earning APIs

Add, delete monthly/yearly expenses

Add earnings (single & bulk)

Category‑based expense tracking


✅ CSV Upload Module

Upload earnings and expenses via CSV

Automatic validation and preprocessing



---

🤖 AI & Machine Learning Features

🔹 Expense Prediction (Linear Regression)

Independent Variables:

Current earning

Past earnings


Dependent Variable:

Cumulative past expenses



Predicts upcoming month’s total expense using Linear Regression.


---

🔹 AI Expense Recommendation Engine

Uses priority‑based category analysis:

Last Month → 65% weight

2nd Last Month → 25% weight

3rd Last Month → 10% weight


Identifies high‑spending categories and recommends areas to reduce expenses.


---

📊 Analytics & Insights

Monthly expense summary by category

Yearly cumulative expense analysis

Latest expense records with pagination

Category‑wise spending insights



---

📄 Report Generation

Generates PDF reports containing:

Charts

Expense summaries

Earnings trends

AI insights


Automatically emails the generated report to the user



---

🗂️ Core Entities

Person

Category

Expense

Earning


Each entity is designed with clean relationships and modular service handling.


---

🔐 Security

Password hashing

Token‑based authentication

Secure OAuth integration



---

🧪 Future Enhancements

Budget limit alerts

Mobile application

Advanced ML models (LSTM)

Multi‑currency support

Export to Excel



---

👨‍💻 Contributors

Developed by SmartExpense Team as a college project.


---

📌 Conclusion

SmartExpense is not just a tracker — it’s a smart financial assistant that helps users understand, predict, and control their spending using data visualization and AI.


---

✨ Track smart. Spend smarter.
