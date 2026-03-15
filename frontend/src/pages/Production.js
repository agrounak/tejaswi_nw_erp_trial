import React, { useState, useEffect } from "react";
import { createProduct, listProducts, getStickerPreviewUrl } from "../services/api";

const INITIAL = {
  product_type: "Roll", gsm: "90", width: "40", colour: "White",
  weight: "", shift: "A", machine: "S1", quality: "Regular", production_date: new Date().toISOString().slice(0, 10),
};

function Production() {
  const [form, setForm] = useState(INITIAL);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  const loadProducts = () => {
    listProducts({ date: new Date().toISOString().slice(0, 10) })
      .then((r) => setProducts(r.data))
      .catch(console.error);
  };

  useEffect(loadProducts, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createProduct(form);
      setMsg(`Created: ${res.data.product.product_number}`);
      setForm({ ...INITIAL, weight: "" });
      loadProducts();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error creating product");
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div>
      <div className="page-header"><h1>Production Entry</h1></div>

      <div className="card">
        <h3>New Roll / Patti</h3>
        {msg && <p style={{ color: msg.startsWith("Created") ? "green" : "red", marginBottom: 12 }}>{msg}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Type</label>
              <select value={form.product_type} onChange={set("product_type")}>
                <option>Roll</option><option>Patti</option>
              </select>
            </div>
            <div className="form-group">
              <label>GSM</label>
              <input type="number" value={form.gsm} onChange={set("gsm")} required />
            </div>
            <div className="form-group">
              <label>Width (inch)</label>
              <input type="number" value={form.width} onChange={set("width")} required />
            </div>
            <div className="form-group">
              <label>Colour</label>
              <select value={form.colour} onChange={set("colour")}>
                {["White","Blue","Green","Yellow","Red"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={set("weight")} required />
            </div>
            <div className="form-group">
              <label>Shift</label>
              <select value={form.shift} onChange={set("shift")}>
                <option value="A">A</option><option value="B">B</option>
              </select>
            </div>
            <div className="form-group">
              <label>Machine</label>
              <select value={form.machine} onChange={set("machine")}>
                <option value="S1">S1</option><option value="S2">S2</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quality</label>
              <select value={form.quality} onChange={set("quality")}>
                <option>Regular</option><option>Premium</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.production_date} onChange={set("production_date")} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>Register Product</button>
        </form>
      </div>

      <div className="card">
        <h3>Today's Production ({products.length} items)</h3>
        <table>
          <thead>
            <tr>
              <th>Product ID</th><th>Type</th><th>GSM</th><th>Width</th>
              <th>Colour</th><th>Weight</th><th>Shift</th><th>Status</th><th>Sticker</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.product_number}</strong></td>
                <td>{p.product_type}</td>
                <td>{p.gsm}</td>
                <td>{p.width}"</td>
                <td>{p.colour}</td>
                <td>{p.weight} kg</td>
                <td>{p.shift}</td>
                <td><span className={`badge badge-${p.status.toLowerCase().replace(/\s/g, "")}`}>{p.status}</span></td>
                <td>
                  <a href={getStickerPreviewUrl(p.id)} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                    Print
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Production;
