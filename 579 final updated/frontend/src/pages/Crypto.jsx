import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowUp,
  FiArrowDown,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBarChart2,
  FiSearch,
  FiStar,
  FiExternalLink,
} from "react-icons/fi";
import {
  FaBitcoin,
  FaEthereum,
  FaRegChartBar,
  FaFire,
  FaCoins,
  FaExchangeAlt,
} from "react-icons/fa";
import {
  SiBinance,
  SiSolana,
  SiCardano,
  SiPolkadot,
  SiDogecoin,
  SiChainlink,
} from "react-icons/si";
import Header from "../components/Header";

const Crypto = () => {
  const [trendingData, setTrendingData] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch trending cryptocurrencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const trendingResponse = await fetch(
          "http://localhost:8000/cryptocurrency_analysis_and_trading/crypto/trending"
        );
        const marketResponse = await fetch(
          "http://localhost:8000/cryptocurrency_analysis_and_trading/crypto/market-overview"
        );

        if (!trendingResponse.ok || !marketResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const trendingJson = await trendingResponse.json();
        const marketJson = await marketResponse.json();

        setTrendingData(trendingJson.data);
        setMarketData(marketJson.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num?.toFixed(2) || 0}`;
  };

  // Get icon for cryptocurrency
  const getCryptoIcon = (symbol) => {
    const icons = {
      btc: <FaBitcoin className="text-orange-500" />,
      eth: <FaEthereum className="text-purple-500" />,
      sol: <SiSolana className="text-green-500" />,
      bnb: <SiBinance className="text-yellow-500" />,
      ada: <SiCardano className="text-blue-500" />,
      dot: <SiPolkadot className="text-pink-500" />,
      doge: <SiDogecoin className="text-amber-400" />,
      link: <SiChainlink className="text-blue-400" />,
    };

    return icons[symbol.toLowerCase()] || <FaCoins className="text-gray-500" />;
  };

  // Filter data based on search term
  const filteredTrending = trendingData.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTopCryptos =
    marketData?.top_cryptocurrencies.filter(
      (coin) =>
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <motion.h1
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2"
              >
                <FaCoins className="text-yellow-500" />
                Crypto Dashboard
              </motion.h1>
              <p className="text-gray-600 mt-1">
                Real-time cryptocurrency market data and trends
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative w-full md:w-64"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </motion.div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"
              />
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </motion.div>
          ) : (
            <>
              {/* Market Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-500 text-sm font-medium">
                        Total Market Cap
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatNumber(
                          marketData?.market_stats.total_market_cap
                        )}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FiDollarSign className="text-blue-600 text-xl" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-500 text-sm font-medium">
                        24h Volume
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatNumber(
                          marketData?.market_stats.total_volume_24h
                        )}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <FaRegChartBar className="text-green-600 text-xl" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-500 text-sm font-medium">
                        Cryptocurrencies
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {marketData?.market_stats.cryptocurrencies_tracked}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <FaExchangeAlt className="text-purple-600 text-xl" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "overview"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiBarChart2 />
                  Market Overview
                </button>
                <button
                  onClick={() => setActiveTab("trending")}
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "trending"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FaFire />
                  Trending
                </button>
                <button
                  onClick={() => setActiveTab("gainers")}
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "gainers"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiTrendingUp />
                  Top Gainers
                </button>
                <button
                  onClick={() => setActiveTab("losers")}
                  className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "losers"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiTrendingDown />
                  Top Losers
                </button>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "overview" && (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Coin
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
                                24h Change
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                24h Volume
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Market Cap
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTopCryptos.map((crypto, index) => (
                              <motion.tr
                                key={crypto.symbol}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ backgroundColor: "#f9fafb" }}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                      {getCryptoIcon(crypto.symbol)}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {crypto.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {crypto.symbol.toUpperCase()}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatNumber(crypto.current_price)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className={`text-sm ${
                                      crypto.price_change_percentage_24h >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    } flex items-center`}
                                  >
                                    {crypto.price_change_percentage_24h >= 0 ? (
                                      <FiArrowUp className="mr-1" />
                                    ) : (
                                      <FiArrowDown className="mr-1" />
                                    )}
                                    {Math.abs(
                                      crypto.price_change_percentage_24h
                                    ).toFixed(2)}
                                    %
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatNumber(crypto.volume_24h)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatNumber(crypto.market_cap)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <a
                                    href={`https://www.coingecko.com/en/coins/${crypto.symbol}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                  >
                                    View <FiExternalLink className="ml-1" />
                                  </a>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "trending" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                      {filteredTrending.map((coin, index) => (
                        <motion.div
                          key={coin.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -5 }}
                          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={coin.thumb}
                                  alt={coin.name}
                                  className="h-10 w-10 rounded-full"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/40";
                                  }}
                                />
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {coin.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {coin.symbol.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                #{coin.market_cap_rank}
                              </span>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Trending
                              </span>
                              <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href={`https://www.coingecko.com/en/coins/${coin.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Trade
                              </motion.a>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {(activeTab === "gainers" || activeTab === "losers") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(activeTab === "gainers"
                        ? marketData.top_gainers
                        : marketData.top_losers
                      )
                        .filter(
                          (coin) =>
                            coin.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            coin.symbol
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((coin, index) => (
                          <motion.div
                            key={coin.symbol}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className={`bg-white rounded-xl shadow-md overflow-hidden border-t-4 ${
                              activeTab === "gainers"
                                ? "border-green-500"
                                : "border-red-500"
                            }`}
                          >
                            <div className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="text-2xl">
                                    {getCryptoIcon(coin.symbol)}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900">
                                      {coin.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {coin.symbol.toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`text-lg font-semibold ${
                                    activeTab === "gainers"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {coin.price_change_percentage_24h >= 0
                                    ? "+"
                                    : ""}
                                  {coin.price_change_percentage_24h.toFixed(2)}%
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Price</p>
                                  <p className="font-medium">
                                    {formatNumber(coin.current_price)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Market Cap
                                  </p>
                                  <p className="font-medium">
                                    {formatNumber(coin.market_cap)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <motion.a
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  href={`https://www.coingecko.com/en/coins/${coin.symbol}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  View Details
                                </motion.a>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Crypto;
