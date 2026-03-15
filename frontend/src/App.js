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
            <div className="sidebar-logo">T</div>
            <div className="sidebar-header-text">
              <h2>Tejaswi NonWovens</h2>
            </div>
          </div>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end>
                <span className="nav-icon">{"\u2302"}</span>
                <span>DashBoard</span>
              </NavLink>
            </li>
            {isAdmin && (
              <li>
                <NavLink to="/register">
                  <span className="nav-icon">{"\u2630"}</span>
                  <span>Register User</span>
                </NavLink>
              </li>
            )}
            {isSticker && (
              <li>
                <NavLink to="/sticker">
                  <span className="nav-icon">{"\u2591"}</span>
                  <span>Sticker Generator</span>
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/inventory">
                <span className="nav-icon">{"\u2610"}</span>
                <span>Inventory</span>
              </NavLink>
            </li>
            {isDispatch && (
              <li>
                <NavLink to="/dispatch">
                  <span className="nav-icon">{"\u27F6"}</span>
                  <span>Dispatch</span>
                </NavLink>
              </li>
            )}
            {isDispatch && (
              <li>
                <NavLink to="/dispatch-history">
                  <span className="nav-icon">{"\u29D6"}</span>
                  <span>Dispatched History</span>
                </NavLink>
              </li>
            )}
            {isAdmin && (
              <li>
                <NavLink to="/admin-config">
                  <span className="nav-icon">{"\u2699"}</span>
                  <span>Admin Config</span>
                </NavLink>
              </li>
            )}
          </ul>
          <div className="sidebar-footer">
            <div className="user-info">
              <span className="user-role">{user.role}</span>
              <span className="user-name">{user.username}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
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
