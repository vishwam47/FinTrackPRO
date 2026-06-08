import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiDollarSign,
  FiCalendar,
  FiBriefcase,
  FiTrendingUp,
  FiEdit2,
  FiTrash2,
  FiPieChart,
  FiBarChart2,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Header from "../components/Header";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
ChartJS.register(...registerables);

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIncome, setExpandedIncome] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const [formData, setFormData] = useState({
    amount: "",
    source: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch incomes on component mount
  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.post(
        "http://localhost:5000/api/income/get",
        {
          userId: user._id,
        }
      );
      setIncomes(data.income || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch incomes:", error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = selectedIncome
        ? "http://localhost:5000/api/income/update"
        : "http://localhost:5000/api/income/create";

      const payload = selectedIncome
        ? {
            incomeId: selectedIncome._id,
            ...formData,
          }
        : {
            userId: user._id,
            ...formData,
          };

      await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setIsModalOpen(false);
      setSelectedIncome(null);
      setFormData({
        amount: "",
        source: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchIncomes();
    } catch (error) {
      console.error("Failed to save income:", error);
      alert(`Failed to ${selectedIncome ? "update" : "add"} income record`);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/income/delete",
        {
          userId: user._id,
          incomeId: selectedIncome._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setIsDeleteModalOpen(false);
      setSelectedIncome(null);
      fetchIncomes();
    } catch (error) {
      console.error("Failed to delete income:", error);
    }
  };

  const openEditModal = (income) => {
    setSelectedIncome(income);
    setFormData({
      amount: income.amount,
      source: income.source,
      description: income.description,
      date: new Date(income.date).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (income) => {
    setSelectedIncome(income);
    setIsDeleteModalOpen(true);
  };

  const toggleExpandIncome = (incomeId) => {
    setExpandedIncome(expandedIncome === incomeId ? null : incomeId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total income
  const totalIncome = incomes.reduce(
    (sum, income) => sum + parseFloat(income.amount),
    0
  );

  // Prepare data for charts
  const getSourceDistributionData = () => {
    const sources = {};
    incomes.forEach((income) => {
      sources[income.source] = (sources[income.source] || 0) + income.amount;
    });

    return {
      labels: Object.keys(sources),
      datasets: [
        {
          label: "Income by Source",
          data: Object.values(sources),
          backgroundColor: [
            "#3B82F6",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#EC4899",
            "#6366F1",
            "#14B8A6",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getMonthlyTrendData = () => {
    const monthlyData = {};
    incomes.forEach((income) => {
      const date = new Date(income.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + income.amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort();

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: "Monthly Income",
          data: sortedMonths.map((month) => monthlyData[month]),
          backgroundColor: "#10B981",
          borderColor: "#059669",
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Income Tracker
              </h1>
              <p className="text-gray-600">
                Manage and analyze your income sources
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedIncome(null);
                setFormData({
                  amount: "",
                  source: "",
                  description: "",
                  date: new Date().toISOString().split("T")[0],
                });
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              Add Income
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiDollarSign className="text-blue-500 text-xl" />
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
                    Income Sources
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {new Set(incomes.map((i) => i.source)).size}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiBriefcase className="text-green-500 text-xl" />
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
                  <p className="text-gray-500 text-sm font-medium">Records</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {incomes.length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiTrendingUp className="text-purple-500 text-xl" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "list"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("list")}
            >
              Income List
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "analytics"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </button>
          </div>

          {activeTab === "analytics" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Income by Source
                </h3>
                <div className="h-64">
                  <Pie
                    data={getSourceDistributionData()}
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
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Monthly Income Trend
                </h3>
                <div className="h-64">
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
                </div>
              </motion.div>
            </div>
          ) : (
            /* Income List */
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Loading income records...</p>
                </div>
              ) : incomes.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">
                    No income records found. Add your first income!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {incomes.map((income) => (
                    <div
                      key={income._id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                            <FiBriefcase className="text-lg" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {income.source}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formatDate(income.date)}
                              {income.description && ` • ${income.description}`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-gray-800">
                            {formatCurrency(income.amount)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleExpandIncome(income._id)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                          >
                            {expandedIncome === income._id ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(income)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => openDeleteModal(income)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Income Details */}
                      <AnimatePresence>
                        {expandedIncome === income._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pl-16"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">
                                  Amount
                                </h4>
                                <p className="font-semibold">
                                  {formatCurrency(income.amount)}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">
                                  Date
                                </h4>
                                <p className="font-semibold">
                                  {formatDate(income.date)}
                                </p>
                              </div>
                              {income.description && (
                                <div className="md:col-span-2">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                                    Description
                                  </h4>
                                  <p className="font-semibold">
                                    {income.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Income Modal */}
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
                      {selectedIncome ? "Edit Income" : "Add New Income"}
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
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="source"
                          value={formData.source}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          placeholder="Salary, Freelance, etc."
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
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder="Additional details"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {selectedIncome ? "Update Income" : "Add Income"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsDeleteModalOpen(false)}
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
                      Confirm Deletion
                    </h2>
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this income record from{" "}
                    {selectedIncome?.source}? This action cannot be undone.
                  </p>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete Record
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Income;
