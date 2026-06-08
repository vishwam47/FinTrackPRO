import React from "react";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiDollarSign,
  FiPieChart,
  FiTarget,
  FiBell,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiBarChart2,
  FiCalendar,
  FiUpload,
  FiPocket,
  FiDollarSign as FiDollar,
  FiCheckCircle,
} from "react-icons/fi";
import { FaMoneyBillWave, FaPiggyBank, FaChartLine } from "react-icons/fa";
import Header from "../components/Header";

const Home = () => {
  const features = [
    {
      icon: <FiDollarSign className="w-8 h-8" />,
      title: "Expense & Income",
      description:
        "Track every transaction with detailed categorization and receipt attachments",
    },
    {
      icon: <FiPieChart className="w-8 h-8" />,
      title: "Budget Management",
      description:
        "Set budgets by category and get real-time tracking with alerts",
    },
    {
      icon: <FaChartLine className="w-8 h-8" />,
      title: "Reports & Analytics",
      description:
        "Beautiful charts and downloadable reports for your financial insights",
    },
    {
      icon: <FaPiggyBank className="w-8 h-8" />,
      title: "Savings Tracker",
      description: "Set goals and track your progress with visual indicators",
    },
    {
      icon: <FiCreditCard className="w-8 h-8" />,
      title: "Debt Management",
      description:
        "Track loans and debts with payment history and EMI tracking",
    },
    {
      icon: <FiBell className="w-8 h-8" />,
      title: "Smart Reminders",
      description: "Never miss a bill payment with our notification system",
    },
  ];

  const stats = [
    { value: "90%", label: "Users improve savings" },
    { value: "75%", label: "Reduction in overspending" },
    { value: "10x", label: "Better financial awareness" },
    { value: "24/7", label: "Access anywhere" },
  ];

  return (
    <>
      <Header />
      <div className="bg-gradient-to-b from-gray-50 to-white overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center -mx-4">
              <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="inline-block py-px px-2 mb-4 text-xs leading-5 text-green-500 bg-green-100 font-medium uppercase rounded-full">
                    Smart Finance Management
                  </span>
                  <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl leading-tight font-bold tracking-tight">
                    Take Control of Your{" "}
                    <span className="text-green-500">Financial Future</span>
                  </h1>
                  <p className="mb-8 text-lg md:text-xl text-gray-500 font-medium">
                    The most comprehensive personal finance tracker that helps
                    you manage expenses, budgets, savings, and debts - all in
                    one place.
                  </p>
                  <div className="flex flex-wrap">
                    <div className="w-full md:w-auto py-1 md:py-0 md:mr-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block py-4 px-6 w-full text-lg leading-6 text-white font-medium text-center bg-green-500 hover:bg-green-600 rounded-lg shadow-md transition duration-200"
                      >
                        Get Started - It's Free
                      </motion.button>
                    </div>
                    <div className="w-full md:w-auto py-1 md:py-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center py-4 px-6 w-full text-lg leading-6 text-gray-900 font-medium text-center bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition duration-200"
                      >
                        See How It Works
                        <FiArrowRight className="ml-2" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="w-full lg:w-1/2 px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative mx-auto max-w-max"
                >
                  <div className="absolute -top-6 -left-6 w-64 h-64 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                  <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                  <div className="absolute top-20 -right-20 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                  <div className="relative">
                    <img
                      className="w-full rounded-lg shadow-2xl"
                      src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                      alt="Finance Dashboard"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center">
              <div className="w-full md:w-auto px-6 py-4">
                <p className="text-sm text-gray-500 font-medium text-center md:text-left">
                  Trusted by financial enthusiasts worldwide
                </p>
              </div>
              <div className="w-full md:w-auto px-6 py-4">
                <div className="flex flex-wrap justify-center -mx-4">
                  <div className="px-4 py-2">
                    <div className="text-2xl font-bold text-gray-700">
                      10,000+
                    </div>
                    <div className="text-sm text-gray-500">Active Users</div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-2xl font-bold text-gray-700">
                      4.9/5
                    </div>
                    <div className="text-sm text-gray-500">Average Rating</div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-2xl font-bold text-gray-700">50+</div>
                    <div className="text-sm text-gray-500">Countries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto mb-16 text-center">
              <span className="inline-block py-px px-2 mb-4 text-xs leading-5 text-green-500 bg-green-100 font-medium uppercase rounded-full">
                Powerful Features
              </span>
              <h2 className="mb-4 text-3xl md:text-4xl leading-tight font-bold tracking-tight">
                Everything You Need to{" "}
                <span className="text-green-500">Master Your Money</span>
              </h2>
              <p className="text-lg text-gray-500 font-medium">
                Our comprehensive toolkit helps you track, analyze, and optimize
                your personal finances.
              </p>
            </div>
            <div className="flex flex-wrap -mx-4 -mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-full md:w-1/2 lg:w-1/3 px-4 mb-8"
                >
                  <div className="h-full p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200">
                    <div className="mb-6 text-green-500">{feature.icon}</div>
                    <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                    <p className="text-gray-500">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center -mx-4">
              <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="inline-block py-px px-2 mb-4 text-xs leading-5 text-green-500 bg-green-100 font-medium uppercase rounded-full">
                    Detailed Tracking
                  </span>
                  <h2 className="mb-6 text-3xl md:text-4xl leading-tight font-bold tracking-tight">
                    Comprehensive{" "}
                    <span className="text-green-500">Expense Management</span>
                  </h2>
                  <p className="mb-8 text-lg text-gray-500 font-medium">
                    Categorize every transaction, set budgets, and get insights
                    into your spending patterns.
                  </p>
                  <ul className="mb-10">
                    <li className="flex items-center mb-4">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        Custom expense categories
                      </span>
                    </li>
                    <li className="flex items-center mb-4">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        Recurring transaction tracking
                      </span>
                    </li>
                    <li className="flex items-center mb-4">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        Receipt image attachments
                      </span>
                    </li>
                    <li className="flex items-center">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        Multi-currency support
                      </span>
                    </li>
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center py-4 px-6 text-lg leading-6 text-white font-medium text-center bg-green-500 hover:bg-green-600 rounded-lg shadow-md transition duration-200"
                  >
                    Explore All Features
                    <FiArrowRight className="ml-2" />
                  </motion.button>
                </motion.div>
              </div>
              <div className="w-full lg:w-1/2 px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative bg-white p-6 rounded-xl shadow-lg"
                >
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <FiDollar className="text-green-500 w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold">Recent Transactions</h3>
                      <p className="text-gray-500 text-sm">June 2023</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Grocery Store",
                        amount: "$86.40",
                        category: "Food",
                        type: "expense",
                      },
                      {
                        name: "Freelance Payment",
                        amount: "$1,200.00",
                        category: "Income",
                        type: "income",
                      },
                      {
                        name: "Electric Bill",
                        amount: "$75.30",
                        category: "Utilities",
                        type: "expense",
                      },
                      {
                        name: "Netflix Subscription",
                        amount: "$14.99",
                        category: "Entertainment",
                        type: "expense",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition duration-150"
                      >
                        <div className="flex items-center">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full ${
                              item.type === "income"
                                ? "bg-blue-100"
                                : "bg-red-100"
                            } flex items-center justify-center`}
                          >
                            {item.type === "income" ? (
                              <FiTrendingUp
                                className={`${
                                  item.type === "income"
                                    ? "text-blue-500"
                                    : "text-red-500"
                                } w-5 h-5`}
                              />
                            ) : (
                              <FiPocket
                                className={`${
                                  item.type === "income"
                                    ? "text-blue-500"
                                    : "text-red-500"
                                } w-5 h-5`}
                              />
                            )}
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {item.category}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            item.type === "income"
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">
                        Total Balance
                      </span>
                      <span className="text-lg font-bold text-green-500">
                        $2,345.67
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center -mx-4">
              <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0 order-last lg:order-first">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative bg-white p-8 rounded-xl shadow-lg"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Monthly Spending</h3>
                    <div className="text-sm text-gray-500">June 2023</div>
                  </div>
                  <div className="h-64 mb-6">
                    {/* Placeholder for chart */}
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <FiBarChart2 className="w-16 h-16 text-gray-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-500 mb-1">Income</div>
                      <div className="text-lg font-bold">$4,200.00</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-xs text-red-500 mb-1">Expenses</div>
                      <div className="text-lg font-bold">$1,854.33</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="w-full lg:w-1/2 px-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="inline-block py-px px-2 mb-4 text-xs leading-5 text-green-500 bg-green-100 font-medium uppercase rounded-full">
                    Data Visualization
                  </span>
                  <h2 className="mb-6 text-3xl md:text-4xl leading-tight font-bold tracking-tight">
                    Beautiful{" "}
                    <span className="text-green-500">Analytics & Reports</span>
                  </h2>
                  <p className="mb-8 text-lg text-gray-500 font-medium">
                    Visualize your financial data with interactive charts and
                    comprehensive reports.
                  </p>
                  <ul className="mb-10">
                    <li className="flex items-center mb-4">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        Expense distribution pie charts
                      </span>
                    </li>
                    <li className="flex items-center mb-4">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        Income vs expense trends
                      </span>
                    </li>
                    <li className="flex items-center mb-4">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        Custom date range reports
                      </span>
                    </li>
                    <li className="flex items-center">
                      <FiCheckCircle className="mr-3 text-green-500" />
                      <span className="text-gray-700">
                        PDF/CSV export options
                      </span>
                    </li>
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center py-4 px-6 text-lg leading-6 text-white font-medium text-center bg-green-500 hover:bg-green-600 rounded-lg shadow-md transition duration-200"
                  >
                    See Sample Reports
                    <FiArrowRight className="ml-2" />
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Goals Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center -mx-4">
              <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="inline-block py-px px-2 mb-4 text-xs leading-5 text-green-500 bg-green-100 font-medium uppercase rounded-full">
                    Goal Tracking
                  </span>
                  <h2 className="mb-6 text-3xl md:text-4xl leading-tight font-bold tracking-tight">
                    Achieve Your{" "}
                    <span className="text-green-500">Financial Goals</span>
                  </h2>
                  <p className="mb-8 text-lg text-gray-500 font-medium">
                    Set targets for savings, debt repayment, or major purchases
                    and track your progress.
                  </p>
                  <div className="mb-10">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Vacation Fund
                        </span>
                        <span className="text-sm font-medium text-green-500">
                          $1,200/$2,000
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Emergency Fund
                        </span>
                        <span className="text-sm font-medium text-blue-500">
                          $3,500/$5,000
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: "70%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Student Loan
                        </span>
                        <span className="text-sm font-medium text-purple-500">
                          $8,200/$10,000
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-500 h-2.5 rounded-full"
                          style={{ width: "82%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center py-4 px-6 text-lg leading-6 text-white font-medium text-center bg-green-500 hover:bg-green-600 rounded-lg shadow-md transition duration-200"
                  >
                    Start Setting Goals
                    <FiArrowRight className="ml-2" />
                  </motion.button>
                </motion.div>
              </div>
              <div className="w-full lg:w-1/2 px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="absolute -top-6 -left-6 w-64 h-64 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                  <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                  <div className="relative bg-white p-8 rounded-xl shadow-lg">
                    <div className="flex items-center mb-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <FiTarget className="text-purple-500 w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold">
                          New Goal: Vacation Fund
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Target: $2,000 by December 2023
                        </p>
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progress
                        </span>
                        <span className="text-sm font-medium text-green-500">
                          60% completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-500 h-4 rounded-full"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">Saved</div>
                        <div className="text-lg font-bold text-green-500">
                          $1,200
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">
                          Remaining
                        </div>
                        <div className="text-lg font-bold">$800</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">
                          Months Left
                        </div>
                        <div className="text-lg font-bold">6</div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <FiBell className="text-blue-500 mr-3" />
                        <span className="text-sm text-blue-700">
                          You're on track! Keep saving $133/month to reach your
                          goal.
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <span className="inline-block py-px px-2 mb-4 text-xs leading-5 text-green-500 bg-green-100 font-medium uppercase rounded-full">
                Why Choose Us
              </span>
              <h2 className="mb-4 text-3xl md:text-4xl leading-tight font-bold tracking-tight">
                Transform Your{" "}
                <span className="text-green-500">Financial Habits</span>
              </h2>
              <p className="text-lg text-gray-500 font-medium">
                Join thousands of users who have taken control of their finances
                with our powerful tools.
              </p>
            </div>
            <div className="flex flex-wrap -mx-4 -mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-full md:w-1/2 lg:w-1/4 px-4 mb-8"
                >
                  <div className="h-full p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200 text-center">
                    <div className="mb-4 text-4xl font-bold text-green-500">
                      {stat.value}
                    </div>
                    <p className="text-gray-700">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-green-500">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="mb-6 text-3xl md:text-4xl leading-tight font-bold tracking-tight text-white">
                Ready to Transform Your Finances?
              </h2>
              <p className="mb-8 text-xl text-green-100 font-medium">
                Join thousands of users who are already mastering their money
                with our powerful tools.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center py-4 px-8 text-lg leading-6 text-green-500 font-medium text-center bg-white hover:bg-gray-50 rounded-lg shadow-lg transition duration-200"
              >
                Sign Up Now - It's Free
                <FiArrowRight className="ml-2" />
              </motion.button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
              <div className="w-full lg:w-1/3 px-4 mb-8 lg:mb-0">
                <h3 className="mb-4 text-xl font-bold text-white">
                  Finance Tracker
                </h3>
                <p className="text-gray-400">
                  The most comprehensive personal finance tracker that helps you
                  manage expenses, budgets, savings, and debts.
                </p>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-8 lg:mb-0">
                <h4 className="mb-4 text-lg font-bold text-white">Features</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Expense Tracking
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Budget Management
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Savings Goals
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Debt Tracking
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Reports & Analytics
                    </a>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/3 px-4">
                <h4 className="mb-4 text-lg font-bold text-white">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition duration-150"
                    >
                      Blog
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-800 text-center">
              <p className="text-gray-400">
                © 2023 Finance Tracker. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
