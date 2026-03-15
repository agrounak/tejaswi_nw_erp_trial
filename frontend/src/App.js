import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Production from "./pages/Production";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Dispatch from "./pages/Dispatch";
import Loading from "./pages/Loading";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>Tejaswi NW</h2>
            <span className="subtitle">Factory ERP</span>
          </div>
          <ul className="nav-links">
            <li><NavLink to="/">Dashboard</NavLink></li>
            <li><NavLink to="/production">Production</NavLink></li>
            <li><NavLink to="/inventory">Inventory</NavLink></li>
            <li><NavLink to="/orders">Orders</NavLink></li>
            <li><NavLink to="/dispatch">Dispatch</NavLink></li>
            <li><NavLink to="/loading">Loading</NavLink></li>
          </ul>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/production" element={<Production />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/dispatch" element={<Dispatch />} />
            <Route path="/loading" element={<Loading />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
