import React from "react";
import {
  FiHome,
  FiDollarSign,
  FiCreditCard,
  FiTarget,
  FiLogIn,
  FiShield,
} from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";
import { Link } from "react-router-dom";
import { GiMoneyStack } from "react-icons/gi";
import { BsGraphDown } from "react-icons/bs";
import { FaBitcoin, FaRegNewspaper } from "react-icons/fa";
import { CiCreditCardOff } from "react-icons/ci";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const appName = "FinTrack Pro";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <FiDollarSign className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                {appName}
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {user ? (
              <>
                <Link to="/" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <FiHome className="mr-1" /> Home
                </Link>
                <Link to="/income" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <GiMoneyStack className="mr-1" /> Income
                </Link>
                <Link to="/bills" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <FiCreditCard className="mr-1" /> Bills
                </Link>
                <Link to="/loans" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <FiDollarSign className="mr-1" /> Loans
                </Link>
                <Link to="/goals" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <FiTarget className="mr-1" /> Goals
                </Link>
                <Link to="/news" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <FaRegNewspaper className="mr-1" /> News
                </Link>
                <Link to="/crypto" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <FaBitcoin className="mr-1" /> Crypto
                </Link>
                <Link to="/market" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <BsGraphDown className="mr-1" /> Market
                </Link>
                <Link to="/fraud" className="text-gray-700 hover:text-green-600 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                  <CiCreditCardOff className="mr-1" /> Fraud
                </Link>

                {/* ── New AI Features ── */}
                <Link
                  to="/ai-analyst"
                  className="text-indigo-600 hover:text-indigo-800 px-2 py-2 rounded-md text-sm font-semibold flex items-center"
                  title="Gemini AI Stock Analyst"
                >
                  <RiRobot2Line className="mr-1" /> AI
                </Link>
                <Link
                  to="/news-fraud"
                  className="text-red-600 hover:text-red-800 px-2 py-2 rounded-md text-sm font-semibold flex items-center"
                  title="News Fraud Detector"
                >
                  <FiShield className="mr-1" /> Fraud
                </Link>
                <Link
                  to="/smart-invest"
                  className="text-green-600 hover:text-green-800 px-2 py-2 rounded-md text-sm font-semibold flex items-center"
                  title="Smart Invest Hub"
                >
                  <GiMoneyStack className="mr-1" /> Smart Invest
                </Link>

                {/* Stock Signal Notification Bell */}
                <div className="ml-1">
                  <NotificationBell />
                </div>

                <Link to="/profile" className="ml-2 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <FiLogIn className="mr-1" /> Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
