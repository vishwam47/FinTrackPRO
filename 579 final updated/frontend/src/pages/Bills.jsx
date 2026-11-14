import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiUpload,
  FiX,
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiTrash2,
  FiEdit,
  FiPieChart,
  FiFilter,
  FiTrendingUp,
  FiAlertTriangle,
  FiTrendingDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Header from "../components/Header";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
ChartJS.register(...registerables);

const Bills = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "food",
    description: "",
    receiptImage: null,
    userId: user?._id,
  });

  const categories = [
    { value: "food", label: "Food & Dining", color: "bg-blue-500" },
    { value: "transport", label: "Transportation", color: "bg-green-500" },
    { value: "housing", label: "Housing", color: "bg-yellow-500" },
    { value: "utilities", label: "Utilities", color: "bg-red-500" },
    { value: "entertainment", label: "Entertainment", color: "bg-purple-500" },
    { value: "shopping", label: "Shopping", color: "bg-pink-500" },
    { value: "health", label: "Health", color: "bg-indigo-500" },
    { value: "education", label: "Education", color: "bg-teal-500" },
    { value: "other", label: "Other", color: "bg-gray-500" },
  ];

  const getUserData = async () => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/user/getuser", {
        userId: user?._id,
      });
      setUserData(data?.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkExpenseThreshold = async () => {
    try {
      if (!userData?.income || !userData?.expenses) return;

      const alertSent = sessionStorage.getItem("budgetAlertSent");
      if (alertSent) return;

      const totalIncome = userData.income.reduce(
        (sum, inc) => sum + inc.amount,
        0
      );
      const totalExpenses = getTotalExpenses();

      if (totalIncome > 0 && totalExpenses / totalIncome > 0.5) {
        const percentage = Math.round((totalExpenses / totalIncome) * 100);

        sessionStorage.setItem("budgetAlertSent", "true");

        setAlertMessage(
          `Warning: Your expenses (${percentage}%) exceed 50% of your income. Review your budget and recent spending.`
        );
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error checking expense threshold:", error);
    }
  };

  useEffect(() => {
    if (userData?.expenses) {
      checkExpenseThreshold();
    }
  }, [userData?.expenses]);

  const resetForm = () => {
    setFormData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "food",
      description: "",
      receiptImage: null,
      userId: user?._id,
    });
    setReceiptPreview(null);
    setEditingExpense(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingExpense) {
        await api.post("/api/expense/update", {
          expenseId: editingExpense._id,
          amount: Number(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          isRecurring: false,
          receiptImage: formData.receiptImage,
        });
        alert("Expense updated successfully!");
      } else {
        await api.post("/api/expense/create", {
          userId: user?._id,
          amount: Number(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          isRecurring: false,
          receiptImage: formData.receiptImage,
        });
        alert("Expense added successfully!");
      }

      setIsModalOpen(false);
      resetForm();
      getUserData();
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert(`Failed to ${editingExpense ? "update" : "add"} expense`);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split("T")[0],
      category: expense.category,
      description: expense.description || "",
      receiptImage: expense.receiptImage || null,
      userId: user?._id,
    });
    if (expense.receiptImage) {
      setReceiptPreview(expense.receiptImage);
    }
    setIsModalOpen(true);
  };

  const getTotalIncome = () => {
    return (userData?.income || []).reduce(
      (sum, income) => sum + income.amount,
      0
    );
  };

  const getExpensePercentage = () => {
    const income = getTotalIncome();
    const expenses = getTotalExpenses();
    return income > 0 ? Math.round((expenses / income) * 100) : 0;
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await api.post("/api/expense/delete", {
          userId: user?._id,
          expenseId,
        });
        getUserData();
        alert("Expense deleted successfully!");
      } catch (error) {
        console.error("Failed to delete expense:", error);
        alert("Failed to delete expense");
      }
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const filteredExpenses = () => {
    let expenses = userData?.expenses || [];

    if (filter !== "all") {
      expenses = expenses.filter((exp) => exp.category === filter);
    }

    expenses = [...expenses].sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      } else if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      return 0;
    });

    return expenses;
  };

  const getCategoryTotal = (category) => {
    return (userData?.expenses || [])
      .filter((exp) => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getTotalExpenses = () => {
    return (userData?.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getChartData = () => {
    const categoryTotals = categories
      .map((cat) => ({
        name: cat.label,
        value: getCategoryTotal(cat.value),
      }))
      .filter((cat) => cat.value > 0);

    return {
      labels: categoryTotals.map((cat) => cat.name),
      datasets: [
        {
          label: "Expenses by Category",
          data: categoryTotals.map((cat) => cat.value),
          backgroundColor: [
            "#3B82F6",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#EC4899",
            "#6366F1",
            "#14B8A6",
            "#64748B",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getMonthlyTrendData = () => {
    const monthlyData = {};

    (userData?.expenses || []).forEach((exp) => {
      const date = new Date(exp.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear] += exp.amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort();

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: "Monthly Expenses",
          data: sortedMonths.map((month) => monthlyData[month]),
          backgroundColor: "#10B981",
          borderColor: "#059669",
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };
  };

  useEffect(() => {
    if (user?._id) {
      getUserData();
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please Login
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to view expenses
          </p>
          <a
            href="/login"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              >
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <FiAlertTriangle className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Budget Alert
                      </h3>
                      <p className="mt-1 text-gray-600">{alertMessage}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowAlert(false)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Expense Dashboard
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Add New Expense
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  ${getTotalIncome().toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FiTrendingUp className="text-blue-500 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  ${getTotalExpenses().toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FiTrendingDown className="text-green-500 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Expense Ratio
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {getExpensePercentage()}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FiPieChart className="text-purple-500 text-xl" />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  getExpensePercentage() > 50 ? "bg-red-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(getExpensePercentage(), 100)}%` }}
              ></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Remaining Balance
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  ${(getTotalIncome() - getTotalExpenses()).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FiDollarSign className="text-yellow-500 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Expenses by Category
            </h3>
            <div className="h-64">
              {getTotalExpenses() > 0 ? (
                <Pie
                  data={getChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No expenses to display
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Spending Trend
            </h3>
            <div className="h-64">
              {getTotalExpenses() > 0 ? (
                <Bar
                  data={getMonthlyTrendData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No expenses to display
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FiFilter className="text-gray-500 mr-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-gray-500 text-sm mr-2">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="ml-2 p-2 bg-gray-100 rounded-md"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredExpenses().length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-8 rounded-xl shadow-md text-center"
            >
              <p className="text-gray-500">
                No expenses found. Add your first expense!
              </p>
            </motion.div>
          ) : (
            filteredExpenses().map((expense, index) => (
              <motion.div
                key={expense._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-full ${
                        categories.find((c) => c.value === expense.category)
                          ?.color || "bg-gray-500"
                      } text-white`}
                    >
                      <FiTag className="text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {categories.find((c) => c.value === expense.category)
                          ?.label || "Other"}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                      {expense.description && (
                        <p className="text-gray-600 mt-1">
                          {expense.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-red-500">
                      -${expense.amount.toFixed(2)}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
                {expense.receiptImage && (
                  <div className="mt-4">
                    <a
                      href={expense.receiptImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center"
                    >
                      <FiUpload className="mr-1" /> View Receipt
                    </a>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {editingExpense ? "Edit Expense" : "Add New Expense"}
                    </h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiTag className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md appearance-none bg-white"
                          required
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="focus:ring-green-500 focus:border-green-500 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder="Optional description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {receiptPreview ? (
                            <div className="relative">
                              <img
                                src={receiptPreview}
                                alt="Receipt preview"
                                className="mx-auto h-32 object-contain"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex text-sm text-gray-600 justify-center">
                                <span className="font-medium text-gray-500">Receipt uploads are disabled in this demo</span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Do not upload real financial documents.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {editingExpense
                          ? "Update Expense"
                          : "Add Expense"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Bills;
