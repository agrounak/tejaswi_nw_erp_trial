import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import StickerGenerator from "./pages/StickerGenerator";
import Inventory from "./pages/Inventory";
import Dispatch from "./pages/Dispatch";
import DispatchHistory from "./pages/DispatchHistory";
import RegisterUser from "./pages/RegisterUser";
import AdminConfig from "./pages/AdminConfig";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("erp_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("erp_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("erp_user");
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user.role === "Admin";
  const isSticker = user.role === "Sticker User" || isAdmin;
  const isDispatch = user.role === "Dispatch User" || isAdmin;

  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>Tejaswi NW</h2>
            <span className="subtitle">Factory ERP</span>
          </div>
          <ul className="nav-links">
            <li><NavLink to="/" end>Dashboard</NavLink></li>
            {isAdmin && <li><NavLink to="/register">Register User</NavLink></li>}
            {isSticker && <li><NavLink to="/sticker">Sticker Generator</NavLink></li>}
            <li><NavLink to="/inventory">Inventory</NavLink></li>
            {isDispatch && <li><NavLink to="/dispatch">Dispatch</NavLink></li>}
            {isDispatch && <li><NavLink to="/dispatch-history">Dispatched History</NavLink></li>}
            {isAdmin && <li><NavLink to="/admin-config">Admin Config</NavLink></li>}
          </ul>
          <div className="sidebar-footer">
            <div className="user-info">
              <span className="user-role">{user.role}</span>
              <span className="user-name">{user.username}</span>
            </div>
            <button className="btn btn-sm btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {isAdmin && <Route path="/register" element={<RegisterUser />} />}
            {isSticker && <Route path="/sticker" element={<StickerGenerator />} />}
            <Route path="/inventory" element={<Inventory />} />
            {isDispatch && <Route path="/dispatch" element={<Dispatch />} />}
            {isDispatch && <Route path="/dispatch-history" element={<DispatchHistory />} />}
            {isAdmin && <Route path="/admin-config" element={<AdminConfig />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
