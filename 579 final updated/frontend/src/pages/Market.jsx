import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import Header from "../components/Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const Market = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    min_volume: 1000000,
    min_price: 5,
    max_rsi: 70,
  });
  const [totalFound, setTotalFound] = useState(0);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(
        `http://localhost:8000/algorithmic_trading/market-screener?${params}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch market data");
      }

      const data = await response.json();
      setStocks(data.screened_stocks);
      setTotalFound(data.total_found);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const applyFilters = () => {
    fetchMarketData();
  };

  const resetFilters = () => {
    setFilters({
      min_volume: 1000000,
      min_price: 5,
      max_rsi: 70,
    });
    fetchMarketData();
  };

  const getTrendIcon = (changePercent) => {
    return changePercent >= 0 ? (
      <FiTrendingUp className="text-green-500" />
    ) : (
      <FiTrendingDown className="text-red-500" />
    );
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Market Trends Screener
              </h1>
              <p className="text-gray-600">
                {loading
                  ? "Scanning markets..."
                  : `Found ${totalFound} stocks matching criteria`}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchMarketData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors mt-4 md:mt-0"
            >
              <FiRefreshCw className="mr-2" />
              Refresh Data
            </motion.button>
          </div>

          {/* Filter Controls */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-md mb-8"
          >
            <div className="flex items-center mb-4">
              <FiFilter className="text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Screening Criteria
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Volume
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="min_volume"
                    value={filters.min_volume}
                    onChange={handleFilterChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 py-2 border-gray-300 rounded-md"
                    placeholder="1000000"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">shares</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="min_price"
                    value={filters.min_price}
                    onChange={handleFilterChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 py-2 border-gray-300 rounded-md"
                    placeholder="5"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max RSI
                </label>
                <input
                  type="number"
                  name="max_rsi"
                  value={filters.max_rsi}
                  onChange={handleFilterChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm"
                  placeholder="70"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>

          {/* Data Visualization */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Price and Volume Bar Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-6 rounded-xl shadow-md mb-8"
              >
                <div className="flex items-center mb-4">
                  <FiBarChart2 className="text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Price & Volume Analysis
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stocks}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="symbol" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#3B82F6"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#10B981"
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="price"
                        name="Price ($)"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="volume"
                        name="Volume"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* RSI and Change % Line Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-6 rounded-xl shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    RSI Values
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={stocks}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="symbol" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="rsi"
                          name="RSI"
                          stroke="#8B5CF6"
                          fill="#8B5CF6"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-6 rounded-xl shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Daily Change (%)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={stocks}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="symbol" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="change_percent"
                          name="Change %"
                          stroke="#EF4444"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* Stock Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Symbol
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Price
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Volume
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          RSI
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Change %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stocks.map((stock) => (
                        <tr key={stock.symbol} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {stock.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${stock.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stock.volume.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                  stock.rsi > 70
                                    ? "bg-red-500"
                                    : stock.rsi < 30
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }`}
                              ></div>
                              {stock.rsi.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTrendIcon(stock.change_percent)}
                              <span
                                className={`ml-1 ${
                                  stock.change_percent >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {stock.change_percent.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Market;
