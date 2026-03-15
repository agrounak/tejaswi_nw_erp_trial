import React, { useState, useEffect } from "react";
import { createDispatch, listDispatches, listOrders, completeDispatch, getDispatchSheet } from "../services/api";

function Dispatch() {
  const [dispatches, setDispatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ order_id: "", vehicle_number: "", driver_name: "", driver_phone: "" });
  const [msg, setMsg] = useState("");
  const [sheet, setSheet] = useState(null);

  const load = () => {
    listDispatches().then((r) => setDispatches(r.data)).catch(console.error);
    listOrders({ status: "Allocated" }).then((r) => setOrders(r.data)).catch(console.error);
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDispatch(form);
      setMsg("Dispatch created — go to Loading page to scan items");
      setForm({ order_id: "", vehicle_number: "", driver_name: "", driver_phone: "" });
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeDispatch(id);
      setMsg("Dispatch completed");
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  };

  const viewSheet = async (id) => {
    try {
      const res = await getDispatchSheet(id);
      setSheet(res.data);
    } catch (err) {
      setMsg("Error loading sheet");
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Dispatch Management</h1></div>

      <div className="card">
        <h3>Create New Dispatch</h3>
        {msg && <p style={{ marginBottom: 8, color: msg.includes("Error") ? "red" : "green" }}>{msg}</p>}
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label>Order</label>
              <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} required>
                <option value="">Select Order</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.order_number} — {o.client_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Vehicle Number</label>
              <input value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} placeholder="BR09AB1234" required />
            </div>
            <div className="form-group">
              <label>Driver Name</label>
              <input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Driver Phone</label>
              <input value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>Create Dispatch</button>
        </form>
      </div>

      <div className="card">
        <h3>Dispatches ({dispatches.length})</h3>
        <table>
          <thead>
            <tr><th>Dispatch #</th><th>Client</th><th>Vehicle</th><th>Date</th><th>Items</th><th>Weight</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {dispatches.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.dispatch_number}</strong></td>
                <td>{d.client_name}</td>
                <td>{d.vehicle_number}</td>
                <td>{d.dispatch_date}</td>
                <td>{d.items.length}</td>
                <td className="weight-highlight">{d.total_weight} kg</td>
                <td><span className={`badge badge-${d.status.toLowerCase()}`}>{d.status}</span></td>
                <td>
                  {d.status === "Loading" && (
                    <button className="btn btn-sm btn-success" onClick={() => handleComplete(d.id)}>Complete</button>
                  )}
                  {" "}
                  <button className="btn btn-sm btn-primary" onClick={() => viewSheet(d.id)}>Sheet</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dispatch Sheet Modal */}
      {sheet && (
        <div className="card" style={{ border: "2px solid #0f3460" }}>
          <h3>Dispatch Sheet: {sheet.dispatch_number}</h3>
          <p><strong>Client:</strong> {sheet.client_name}</p>
          <p><strong>Vehicle:</strong> {sheet.vehicle_number}</p>
          <p><strong>Driver:</strong> {sheet.driver_name || "—"}</p>
          <p><strong>Date:</strong> {sheet.dispatch_date}</p>
          <table>
            <thead>
              <tr><th>Product ID</th><th>Type</th><th>GSM</th><th>Colour</th><th>Width</th><th>Weight</th></tr>
            </thead>
            <tbody>
              {sheet.products.map((p, i) => (
                <tr key={i}>
                  <td>{p.product_number}</td><td>{p.product_type}</td><td>{p.gsm}</td>
                  <td>{p.colour}</td><td>{p.width}"</td><td>{p.weight} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>
            Total: {sheet.total_items} items | {sheet.total_weight} kg
          </p>
          <button className="btn btn-sm btn-danger" onClick={() => setSheet(null)} style={{ marginTop: 8 }}>Close</button>
        </div>
      )}
    </div>
  );
}

export default Dispatch;
