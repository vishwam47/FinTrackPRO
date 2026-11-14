import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import Login from './pages/Login';
import Signup from './pages/Signup';
import Bills from './pages/Bills';
import Loan from './pages/Loan';
import Income from './pages/Income';
import Goals from './pages/Goals';
import News from './pages/News';
import Market from './pages/Market';
import Profile from './pages/Profile';
import Fraud from './pages/Fraud';
import Crypto from './pages/Crypto';
import AIAnalyst from './pages/AIAnalyst';
import NewsFraud from './pages/NewsFraud';
import StockSignals from './pages/StockSignals';
import FinanceAnalysis from './pages/FinanceAnalysis';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen" aria-label="Loading account" />;
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/bills" element={<RequireAuth><Bills /></RequireAuth>} />
          <Route path="/loans" element={<RequireAuth><Loan /></RequireAuth>} />
          <Route path="/income" element={<RequireAuth><Income /></RequireAuth>} />
          <Route path="/goals" element={<RequireAuth><Goals /></RequireAuth>} />
          <Route path="/news" element={<RequireAuth><News /></RequireAuth>} />
          <Route path="/crypto" element={<RequireAuth><Crypto /></RequireAuth>} />
          <Route path="/market" element={<RequireAuth><Market /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/fraud" element={<RequireAuth><Fraud /></RequireAuth>} />
          <Route path="/ai-analyst" element={<RequireAuth><AIAnalyst /></RequireAuth>} />
          <Route path="/news-fraud" element={<RequireAuth><NewsFraud /></RequireAuth>} />
          <Route path="/stock-signals" element={<RequireAuth><StockSignals /></RequireAuth>} />
          <Route path="/smart-invest" element={<RequireAuth><FinanceAnalysis /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App
