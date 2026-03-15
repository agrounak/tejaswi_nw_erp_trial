import React, { useState, useEffect } from "react";
import { getStock, getInventorySummary, receiveToWarehouse, getWarehouseLocations } from "../services/api";

function Inventory() {
  const [stock, setStock] = useState([]);
  const [summary, setSummary] = useState([]);
  const [locations, setLocations] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [msg, setMsg] = useState("");
  const [filters, setFilters] = useState({ gsm: "", colour: "", product_type: "" });

  const load = () => {
    const params = {};
    if (filters.gsm) params.gsm = filters.gsm;
    if (filters.colour) params.colour = filters.colour;
    if (filters.product_type) params.product_type = filters.product_type;
    getStock(params).then((r) => setStock(r.data)).catch(console.error);
    getInventorySummary().then((r) => setSummary(r.data)).catch(console.error);
    getWarehouseLocations().then((r) => setLocations(r.data)).catch(console.error);
  };

  useEffect(load, [filters]);

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      const res = await receiveToWarehouse({ product_number: scanInput, location: locationInput });
      setMsg(`Received: ${res.data.product.product_number} at ${res.data.product.location}`);
      setScanInput(""); setLocationInput("");
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Inventory</h1></div>

      {/* Receive to Warehouse */}
      <div className="card">
        <h3>Scan to Warehouse</h3>
        {msg && <p style={{ color: msg.startsWith("Received") ? "green" : "red", marginBottom: 8 }}>{msg}</p>}
        <form onSubmit={handleReceive} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div className="form-group">
            <label>Product Number (QR)</label>
            <input value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="A-15MR-001" required />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} placeholder="A-01" required />
          </div>
          <button className="btn btn-success" type="submit">Receive</button>
        </form>
      </div>

      {/* Summary */}
      <div className="card">
        <h3>Inventory Summary</h3>
        <table>
          <thead><tr><th>Type</th><th>GSM</th><th>Colour</th><th>Units</th><th>Total Weight</th></tr></thead>
          <tbody>
            {summary.map((s, i) => (
              <tr key={i}>
                <td>{s.product_type}</td><td>{s.gsm}</td><td>{s.colour}</td>
                <td>{s.count}</td><td className="weight-highlight">{s.total_weight} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warehouse Map */}
      <div className="card">
        <h3>Warehouse Locations</h3>
        <div className="stats-grid">
          {locations.map((l) => (
            <div className="stat-card" key={l.location}>
              <div className="stat-value">{l.count}</div>
              <div className="stat-label">{l.location} ({l.total_weight} kg)</div>
            </div>
          ))}
          {locations.length === 0 && <p>No products in warehouse</p>}
        </div>
      </div>

      {/* Stock Details */}
      <div className="card">
        <h3>Stock Detail</h3>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <select value={filters.product_type} onChange={(e) => setFilters({ ...filters, product_type: e.target.value })}>
            <option value="">All Types</option><option>Roll</option><option>Patti</option>
          </select>
          <input placeholder="GSM" type="number" value={filters.gsm}
            onChange={(e) => setFilters({ ...filters, gsm: e.target.value })} style={{ width: 80 }} />
          <select value={filters.colour} onChange={(e) => setFilters({ ...filters, colour: e.target.value })}>
            <option value="">All Colours</option>
            {["White","Blue","Green","Yellow","Red"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <table>
          <thead>
            <tr><th>Product ID</th><th>Type</th><th>GSM</th><th>Colour</th><th>Width</th><th>Weight</th><th>Location</th></tr>
          </thead>
          <tbody>
            {stock.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.product_number}</strong></td>
                <td>{p.product_type}</td><td>{p.gsm}</td><td>{p.colour}</td>
                <td>{p.width}"</td><td>{p.weight} kg</td><td>{p.location}</td>
              </tr>
            ))}
            {stock.length === 0 && <tr><td colSpan={7}>No stock found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Inventory;
