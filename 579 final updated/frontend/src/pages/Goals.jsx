import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiTarget,
  FiDollarSign,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiAward,
  FiTrendingUp,
  FiPieChart,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Header from "../components/Header";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGoal, setExpandedGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Default to 30 days from now
  });

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.post("/api/goal/get", { userId: user._id });
      setGoals(data.goals || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
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
      const endpoint = selectedGoal
        ? "/api/goal/update"
        : "/api/goal/create";

      const payload = selectedGoal
        ? { goalId: selectedGoal._id, ...formData }
        : { userId: user._id, ...formData };

      await api.post(endpoint, payload);

      setIsModalOpen(false);
      setSelectedGoal(null);
      setFormData({
        title: "",
        targetAmount: "",
        currentAmount: "0",
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
      fetchGoals();
    } catch (error) {
      console.error("Failed to save goal:", error);
      alert(`Failed to ${selectedGoal ? "update" : "add"} goal`);
    }
  };

  const handleDelete = async () => {
    try {
      await api.post("/api/goal/delete", {
        userId: user._id,
        goalId: selectedGoal._id,
      });

      setIsDeleteModalOpen(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const openEditModal = (goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: new Date(goal.targetDate).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  const toggleExpandGoal = (goalId) => {
    setExpandedGoal(expandedGoal === goalId ? null : goalId);
  };

  const calculateProgress = (goal) => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatus = (goal) => {
    const progress = calculateProgress(goal);
    const daysRemaining = getDaysRemaining(goal.targetDate);

    if (progress >= 100) return "Completed";
    if (daysRemaining <= 0) return "Overdue";
    return "In Progress";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Financial Goals
              </h1>
              <p className="text-gray-600">
                Track and achieve your financial objectives
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedGoal(null);
                setFormData({
                  title: "",
                  targetAmount: "",
                  currentAmount: "0",
                  targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                });
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              New Goal
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Active Goals
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {goals.filter((g) => getStatus(g) === "In Progress").length}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <FiTarget className="text-indigo-500 text-xl" />
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
                    Completed Goals
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {goals.filter((g) => getStatus(g) === "Completed").length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiAward className="text-green-500 text-xl" />
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
                    Total Target
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(
                      goals.reduce(
                        (sum, goal) => sum + parseFloat(goal.targetAmount),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiTrendingUp className="text-purple-500 text-xl" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Goals List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading goals...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  No goals found. Create your first financial goal!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {goals.map((goal) => {
                  const progress = calculateProgress(goal);
                  const status = getStatus(goal);
                  const daysRemaining = getDaysRemaining(goal.targetDate);

                  return (
                    <div
                      key={goal._id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-16 h-16">
                            <CircularProgressbar
                              value={progress > 100 ? 100 : progress}
                              text={`${Math.round(progress)}%`}
                              styles={{
                                path: {
                                  stroke:
                                    progress >= 100
                                      ? "#10B981"
                                      : progress > 75
                                      ? "#3B82F6"
                                      : progress > 50
                                      ? "#F59E0B"
                                      : "#EF4444",
                                },
                                text: {
                                  fill: "#1F2937",
                                  fontSize: "24px",
                                  fontWeight: "bold",
                                },
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {goal.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(goal.currentAmount)} of{" "}
                              {formatCurrency(goal.targetAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {status === "Overdue"
                              ? "Target date passed"
                              : `${daysRemaining} days remaining`}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleExpandGoal(goal._id)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                          >
                            {expandedGoal === goal._id ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(goal)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => openDeleteModal(goal)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Goal Details */}
                      <AnimatePresence>
                        {expandedGoal === goal._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pl-20"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">
                                  Target Amount
                                </h4>
                                <p className="font-semibold">
                                  {formatCurrency(goal.targetAmount)}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">
                                  Current Amount
                                </h4>
                                <p className="font-semibold">
                                  {formatCurrency(goal.currentAmount)}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">
                                  Target Date
                                </h4>
                                <p className="font-semibold">
                                  {formatDate(goal.targetDate)}
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    progress >= 100
                                      ? "bg-green-500"
                                      : progress > 75
                                      ? "bg-blue-500"
                                      : progress > 50
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${
                                      progress > 100 ? 100 : progress
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Update Progress Form */}
                            <div className="border-t pt-4">
                              <h4 className="text-sm font-medium text-gray-500 mb-3">
                                Update Progress
                              </h4>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  openEditModal(goal);
                                }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                              >
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Amount
                                  </label>
                                  <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <FiDollarSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                      type="number"
                                      value={goal.currentAmount}
                                      readOnly
                                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md bg-gray-100"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-end">
                                  <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Update Progress
                                  </button>
                                </div>
                              </form>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Goal Modal */}
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
                      {selectedGoal ? "Edit Goal" : "Create New Goal"}
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
                        Goal Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder="e.g., Vacation Fund, New Car"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="targetAmount"
                          value={formData.targetAmount}
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
                        Current Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="currentAmount"
                          value={formData.currentAmount}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max={formData.targetAmount || Infinity}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Date
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          name="targetDate"
                          value={formData.targetDate}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
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
                        {selectedGoal ? "Update Goal" : "Create Goal"}
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
                    Are you sure you want to delete the goal "
                    {selectedGoal?.title}"? This action cannot be undone.
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
                      Delete Goal
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

export default Goals;
