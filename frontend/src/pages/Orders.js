import React, { useState, useEffect } from "react";
import { createOrder, listOrders, allocateOrder } from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    client_name: "", client_phone: "", client_address: "", notes: "",
    items: [{ product_type: "Roll", gsm: "90", colour: "White", width: "", quantity_kg: "" }],
  });

  const loadOrders = () => listOrders().then((r) => setOrders(r.data)).catch(console.error);
  useEffect(loadOrders, []);

  const addItem = () => setForm({
    ...form,
    items: [...form.items, { product_type: "Roll", gsm: "90", colour: "White", width: "", quantity_kg: "" }],
  });

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createOrder(form);
      setMsg("Order created");
      setForm({ client_name: "", client_phone: "", client_address: "", notes: "",
        items: [{ product_type: "Roll", gsm: "90", colour: "White", width: "", quantity_kg: "" }] });
      loadOrders();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  };

  const handleAllocate = async (orderId) => {
    try {
      const res = await allocateOrder(orderId);
      setMsg(`Allocated: ${res.data.allocation.map(a => `${a.allocated_kg}kg of ${a.colour} ${a.gsm}GSM`).join(", ")}`);
      loadOrders();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error allocating");
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Sales Orders</h1></div>

      <div className="card">
        <h3>New Order</h3>
        {msg && <p style={{ marginBottom: 8, color: msg.startsWith("Error") ? "red" : "green" }}>{msg}</p>}
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label>Client Name</label>
              <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 8px" }}>Order Items</h4>
          {form.items.map((item, i) => (
            <div key={i} className="form-grid" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #eee" }}>
              <div className="form-group">
                <label>Type</label>
                <select value={item.product_type} onChange={(e) => updateItem(i, "product_type", e.target.value)}>
                  <option>Roll</option><option>Patti</option>
                </select>
              </div>
              <div className="form-group">
                <label>GSM</label>
                <input type="number" value={item.gsm} onChange={(e) => updateItem(i, "gsm", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Colour</label>
                <select value={item.colour} onChange={(e) => updateItem(i, "colour", e.target.value)}>
                  {["White","Blue","Green","Yellow","Red"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Width (inch)</label>
                <input type="number" value={item.width} onChange={(e) => updateItem(i, "width", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Quantity (kg)</label>
                <input type="number" value={item.quantity_kg} onChange={(e) => updateItem(i, "quantity_kg", e.target.value)} required />
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-warning" onClick={addItem} style={{ marginRight: 8 }}>+ Add Item</button>
          <button type="submit" className="btn btn-primary">Create Order</button>
        </form>
      </div>

      <div className="card">
        <h3>Orders ({orders.length})</h3>
        <table>
          <thead>
            <tr><th>Order #</th><th>Client</th><th>Date</th><th>Items</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.order_number}</strong></td>
                <td>{o.client_name}</td>
                <td>{o.order_date}</td>
                <td>{o.items.map(it => `${it.colour} ${it.gsm}GSM ${it.quantity_kg}kg`).join("; ")}</td>
                <td><span className="badge">{o.status}</span></td>
                <td>
                  {o.status === "Pending" && (
                    <button className="btn btn-sm btn-success" onClick={() => handleAllocate(o.id)}>Allocate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;
