import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Header from "../components/Header";

const Loan = () => {
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [formData, setFormData] = useState({
    lender: "",
    totalAmount: "",
    paidAmount: "0",
    emiAmount: "",
    dueDate: new Date().toISOString().split("T")[0],
    paymentHistory: [],
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch loans on component mount
  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.post("http://localhost:5000/api/loan/get", {
        userId: user._id,
      });
      setLoans(data.loans || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = selectedLoan
        ? "http://localhost:5000/api/loan/update"
        : "http://localhost:5000/api/loan/create";

      const payload = selectedLoan
        ? {
            loanId: selectedLoan._id,
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
      setSelectedLoan(null);
      setFormData({
        lender: "",
        totalAmount: "",
        paidAmount: "0",
        emiAmount: "",
        dueDate: new Date().toISOString().split("T")[0],
        paymentHistory: [],
      });
      fetchLoans();
    } catch (error) {
      console.error("Failed to save loan:", error);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!expandedLoan) return;
    console.log(expandedLoan);
    try {
      // Ensure paymentHistory is an array, default to empty array if undefined
      const currentPaymentHistory = Array.isArray(expandedLoan.paymentHistory)
        ? expandedLoan.paymentHistory
        : [];

      const newPayment = {
        amount: parseFloat(paymentForm.amount),
        date: paymentForm.date,
      };

      const updatedPaymentHistory = [...currentPaymentHistory, newPayment];
      const totalPaid = updatedPaymentHistory.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      await axios.post(
        "http://localhost:5000/api/loan/update",
        {
          loanId: expandedLoan,
          paidAmount: totalPaid,
          paymentHistory: updatedPaymentHistory,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setPaymentForm({
        amount: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchLoans();
    } catch (error) {
      console.error("Failed to add payment:", error);
      alert("Failed to add payment. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/loan/delete",
        {
          userId: user._id,
          loanId: selectedLoan._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setIsDeleteModalOpen(false);
      setSelectedLoan(null);
      fetchLoans();
    } catch (error) {
      console.error("Failed to delete loan:", error);
    }
  };

  const openEditModal = (loan) => {
    setSelectedLoan(loan);
    setFormData({
      lender: loan.lender,
      totalAmount: loan.totalAmount,
      paidAmount: loan.paidAmount,
      emiAmount: loan.emiAmount,
      dueDate: new Date(loan.dueDate).toISOString().split("T")[0],
      paymentHistory: loan.paymentHistory || [],
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (loan) => {
    setSelectedLoan(loan);
    setIsDeleteModalOpen(true);
  };

  const toggleExpandLoan = (loanId) => {
    setExpandedLoan(expandedLoan === loanId ? null : loanId);
  };

  const calculateRemainingAmount = (loan) => {
    return loan.totalAmount - loan.paidAmount;
  };

  const calculateProgress = (loan) => {
    return (loan.paidAmount / loan.totalAmount) * 100;
  };

  const getStatus = (loan) => {
    const remaining = calculateRemainingAmount(loan);
    if (remaining <= 0) return "Paid";
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    return dueDate < today ? "Overdue" : "Active";
  };

  const getStatusColor = (loan) => {
    const status = getStatus(loan);
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (loan) => {
    const status = getStatus(loan);
    switch (status) {
      case "Paid":
        return <FiCheckCircle className="text-green-500" />;
      case "Overdue":
        return <FiClock className="text-red-500" />;
      default:
        return <FiTrendingUp className="text-blue-500" />;
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
                Loan Management
              </h1>
              <p className="text-gray-600">
                Track and manage all your loans in one place
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedLoan(null);
                setFormData({
                  lender: "",
                  totalAmount: "",
                  paidAmount: "0",
                  emiAmount: "",
                  dueDate: new Date().toISOString().split("T")[0],
                  paymentHistory: [],
                });
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              Add New Loan
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
                    Total Loans
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {loans.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiCreditCard className="text-blue-500 text-xl" />
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
                    Total Borrowed
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(
                      loans.reduce(
                        (sum, loan) => sum + parseFloat(loan.totalAmount),
                        0
                      )
                    )}
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
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(
                      loans.reduce(
                        (sum, loan) => sum + parseFloat(loan.paidAmount),
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

          {/* Loans Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading loans...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  No loans found. Add your first loan!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {loans.map((loan) => (
                  <div
                    key={loan._id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-full ${getStatusColor(loan)}`}
                        >
                          {getStatusIcon(loan)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {loan.lender}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Due: {formatDate(loan.dueDate)} • {getStatus(loan)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-800">
                          {formatCurrency(calculateRemainingAmount(loan))}{" "}
                          remaining
                        </p>
                        <p className="text-sm text-gray-500">
                          of {formatCurrency(loan.totalAmount)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleExpandLoan(loan._id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        >
                          {expandedLoan === loan._id ? (
                            <FiChevronUp />
                          ) : (
                            <FiChevronDown />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(loan)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => openDeleteModal(loan)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Loan Details */}
                    <AnimatePresence>
                      {expandedLoan === loan._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pl-16"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                Total Amount
                              </h4>
                              <p className="font-semibold">
                                {formatCurrency(loan.totalAmount)}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                Amount Paid
                              </h4>
                              <p className="font-semibold">
                                {formatCurrency(loan.paidAmount)}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                EMI Amount
                              </h4>
                              <p className="font-semibold">
                                {formatCurrency(loan.emiAmount)}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Payment Progress</span>
                              <span>
                                {Math.round(calculateProgress(loan))}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${calculateProgress(loan)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Payment History */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                              Payment History
                            </h4>
                            {loan.paymentHistory?.length > 0 ? (
                              <div className="space-y-2">
                                {loan.paymentHistory.map((payment, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {formatCurrency(payment.amount)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(payment.date)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">
                                No payment history
                              </p>
                            )}
                          </div>

                          {/* Add Payment Form */}
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">
                              Record New Payment
                            </h4>
                            <form
                              onSubmit={handleAddPayment}
                              className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
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
                                    value={paymentForm.amount}
                                    onChange={handlePaymentInputChange}
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0.01"
                                    max={calculateRemainingAmount(loan)}
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
                                    value={paymentForm.date}
                                    onChange={handlePaymentInputChange}
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="submit"
                                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Add Payment
                                </button>
                              </div>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Loan Modal */}
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
                      {selectedLoan ? "Edit Loan" : "Add New Loan"}
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
                        Lender Name
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="lender"
                          value={formData.lender}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
                          placeholder="Bank or Lender Name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="totalAmount"
                          value={formData.totalAmount}
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
                        EMI Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="emiAmount"
                          value={formData.emiAmount}
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
                        Due Date
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
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
                        {selectedLoan ? "Update Loan" : "Add Loan"}
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
                    Are you sure you want to delete the loan from{" "}
                    {selectedLoan?.lender}? This action cannot be undone.
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
                      Delete Loan
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

export default Loan;
