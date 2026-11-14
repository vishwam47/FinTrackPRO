import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  FiUser,
  FiMail,
  FiDollarSign,
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiCreditCard,
  FiTarget,
  FiBell,
  FiLogOut,
} from "react-icons/fi";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getUserData = async () => {
    try {
      const { data } = await api.post("/api/user/getuser", {
        userId: user?._id,
      });
      setUserData(data?.user);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  const getTotalExpenses = () => {
    return userData?.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  };

  const getTotalIncome = () => {
    return userData?.income?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
  };

  const getExpenseByCategory = () => {
    const categories = {};
    userData?.expenses?.forEach((exp) => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });
    return categories;
  };

  const getRecentTransactions = (count = 5) => {
    const allTransactions = [
      ...(userData?.expenses?.map((exp) => ({ ...exp, type: "expense" })) ||
        []),
      ...(userData?.income?.map((inc) => ({ ...inc, type: "income" })) || []),
    ];
    return allTransactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, count);
  };

  const expenseData = {
    labels: Object.keys(getExpenseByCategory()),
    datasets: [
      {
        data: Object.values(getExpenseByCategory()),
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

  const incomeVsExpenseData = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        label: "Amount",
        data: [getTotalIncome(), getTotalExpenses()],
        backgroundColor: ["#10B981", "#EF4444"],
        borderRadius: 4,
      },
    ],
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        {/* Logout Button - Top Right Corner */}
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors"
          >
            <FiLogOut className="mr-2" />
            Logout
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : userData ? (
          <div className="max-w-7xl mx-auto">
            {/* User Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mr-6 mb-4 md:mb-0">
                  <FiUser className="text-blue-500 text-3xl" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userData.name}
                  </h1>
                  <div className="flex items-center text-gray-600 mt-1">
                    <FiMail className="mr-2" />
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center">
                      <FiCalendar className="text-gray-500 mr-2" />
                      <span className="text-gray-600">
                        Joined{" "}
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Total Income
                    </p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      ${getTotalIncome().toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <FiTrendingUp className="text-green-500 text-xl" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      ${getTotalExpenses().toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <FiTrendingDown className="text-red-500 text-xl" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Net Balance
                    </p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      ${(getTotalIncome() - getTotalExpenses()).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FiDollarSign className="text-blue-500 text-xl" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Expense Categories
                </h3>
                <div className="h-64">
                  <Pie
                    data={expenseData}
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Income vs Expenses
                </h3>
                <div className="h-64">
                  <Bar
                    data={incomeVsExpenseData}
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

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Transactions
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getRecentTransactions().map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.description || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {transaction.category || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`font-medium ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}$
                              {transaction.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.type === "income"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full mr-4">
                    <FiCreditCard className="text-purple-500 text-xl" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Total Expenses
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {userData.expenses?.length || 0}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
                    <FiTarget className="text-blue-500 text-xl" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Goals</p>
                    <p className="text-xl font-bold text-gray-800">
                      {userData.goal?.length || 0}
                    </p>
                  </div>
                </div>
              </motion.div>

              
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Failed to load user data</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
