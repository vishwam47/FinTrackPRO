import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/loans" element={<Loan />} />
          <Route path="/income" element={<Income />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/news" element={<News />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/market" element={<Market />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/fraud" element={<Fraud />} />
          <Route path="/ai-analyst" element={<AIAnalyst />} />
          <Route path="/news-fraud" element={<NewsFraud />} />
          <Route path="/stock-signals" element={<StockSignals />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App