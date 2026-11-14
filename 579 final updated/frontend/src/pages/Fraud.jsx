import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
  FiTrendingUp,
  FiInfo,
  FiSend,
  FiX,
} from "react-icons/fi";
import Header from "../components/Header";
import { fraudDetectionAPI } from "../services/mlapi";

const Fraud = () => {
  const [formData, setFormData] = useState({
    amount: "",
    oldbalanceOrg: "",
    newbalanceOrig: "",
    oldbalanceDest: "",
    newbalanceDest: "",
    transaction_type: "TRANSFER",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const transactionTypes = [
    "TRANSFER",
    "CASH_OUT",
    "PAYMENT",
    "CASH_IN",
    "DEBIT",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fraudDetectionAPI.predict({
          ...formData,
          amount: parseFloat(formData.amount),
          oldbalanceOrg: parseFloat(formData.oldbalanceOrg),
          newbalanceOrig: parseFloat(formData.newbalanceOrig),
          oldbalanceDest: parseFloat(formData.oldbalanceDest),
          newbalanceDest: parseFloat(formData.newbalanceDest),
      });
      setResult(response.data);
      setIsModalOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while processing your request."
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Effect to handle escape key and body overflow
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Fraud Detection System
                  </h2>
                  <p className="text-gray-600">
                    Analyze transaction details to detect potential fraud
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FiAlertTriangle className="text-blue-600 text-2xl" />
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Type
                      </label>
                      <select
                        name="transaction_type"
                        value={formData.transaction_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        {transactionTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Origin Old Balance
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiTrendingUp className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="oldbalanceOrg"
                          value={formData.oldbalanceOrg}
                          onChange={handleChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Origin New Balance
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiTrendingUp className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="newbalanceOrig"
                          value={formData.newbalanceOrig}
                          onChange={handleChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination Old Balance
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiTrendingUp className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="oldbalanceDest"
                          value={formData.oldbalanceDest}
                          onChange={handleChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination New Balance
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiTrendingUp className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="newbalanceDest"
                          value={formData.newbalanceDest}
                          onChange={handleChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                  >
                    {loading ? (
                      "Analyzing..."
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        Analyze Transaction
                      </>
                    )}
                  </motion.button>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiAlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </motion.div>

          {/* Integrated Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed backdrop-blur-sm inset-0 z-50 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0  bg-opacity-50 transition-opacity"
                  onClick={closeModal}
                />

                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-headline"
                  >
                    <div className="p-6">
                      <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                          type="button"
                          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={closeModal}
                        >
                          <span className="sr-only">Close</span>
                          <FiX className="h-6 w-6" />
                        </button>
                      </div>

                      {result && (
                        <>
                          <div className="flex items-start">
                            <div
                              className={`flex-shrink-0 p-3 rounded-full ${
                                result.is_fraud ? "bg-red-100" : "bg-green-100"
                              }`}
                            >
                              {result.is_fraud ? (
                                <FiAlertTriangle className="text-red-600 text-2xl" />
                              ) : (
                                <FiCheckCircle className="text-green-600 text-2xl" />
                              )}
                            </div>
                            <div className="ml-4">
                              <h3
                                className="text-lg font-medium text-gray-900"
                                id="modal-headline"
                              >
                                {result.is_fraud
                                  ? "Potential Fraud Detected"
                                  : "No Fraud Detected"}
                              </h3>
                              <div className="mt-2 text-sm text-gray-500">
                                <p>
                                  Confidence:{" "}
                                  <span className="font-semibold">
                                    {result.confidence_level}
                                  </span>
                                </p>
                                <p>
                                  Probability:{" "}
                                  <span className="font-semibold">
                                    {(result.fraud_probability * 100).toFixed(
                                      2
                                    )}
                                    %
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {result.risk_factors &&
                            result.risk_factors.length > 0 && (
                              <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                  Risk Factors:
                                </h4>
                                <ul className="space-y-2">
                                  {result.risk_factors.map((factor, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start"
                                    >
                                      <div className="flex-shrink-0 mt-1">
                                        <FiInfo className="h-4 w-4 text-yellow-500" />
                                      </div>
                                      <p className="ml-2 text-sm text-gray-700">
                                        {factor}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          <div className="mt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={closeModal}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Close
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Fraud;
