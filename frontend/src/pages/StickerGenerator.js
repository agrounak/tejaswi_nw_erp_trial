import React, { useState, useEffect } from "react";
import { createProduct, getConfigs, getStickerPreviewUrl } from "../services/api";

function StickerGenerator() {
  const [configs, setConfigs] = useState({ quality: [], colour: [], product_type: [], location: [] });
  const [form, setForm] = useState({
    trading_name: "Bharat Green",
    shift: "A",
    production_date: new Date().toISOString().split("T")[0],
    quality: "",
    gsm: "",
    colour: "",
    product_type: "Roll",
    net_weight: "",
    gross_weight: "",
    length: "",
    width: "",
    location: "",
    laminated: false,
  });
  const [createdProduct, setCreatedProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getConfigs().then((r) => {
      const grouped = { quality: [], colour: [], product_type: [], location: [] };
      r.data.forEach((c) => {
        if (grouped[c.config_type]) grouped[c.config_type].push(c);
      });
      setConfigs(grouped);
      // Set defaults
      if (grouped.quality.length > 0) setForm((f) => ({ ...f, quality: f.quality || grouped.quality[0].value }));
      if (grouped.colour.length > 0) setForm((f) => ({ ...f, colour: f.colour || grouped.colour[0].value }));
      if (grouped.location.length > 0) setForm((f) => ({ ...f, location: f.location || grouped.location[0].value }));
    }).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCreatedProduct(null);
    try {
      const res = await createProduct(form);
      setCreatedProduct(res.data.product);
      // Reset form serial fields but keep common settings
      setForm((f) => ({
        ...f,
        net_weight: "",
        gross_weight: "",
        length: "",
        width: "",
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create product");
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Sticker Generator</h1></div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Row 1 */}
          <div className="form-grid">
            <div className="form-group">
              <label>Trading Name</label>
              <select name="trading_name" value={form.trading_name} onChange={handleChange}>
                <option>Bharat Green</option>
              </select>
            </div>
            <div className="form-group">
              <label>Shift</label>
              <select name="shift" value={form.shift} onChange={handleChange}>
                <option value="A">A (8AM - 8PM)</option>
                <option value="B">B (8PM - 8AM)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Production Date</label>
              <input type="date" name="production_date" value={form.production_date} onChange={handleChange} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Quality</label>
              <select name="quality" value={form.quality} onChange={handleChange} required>
                <option value="">Select...</option>
                {configs.quality.map((c) => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>GSM</label>
              <input type="number" name="gsm" value={form.gsm} onChange={handleChange} required placeholder="e.g. 90" />
            </div>
            <div className="form-group">
              <label>Colour</label>
              <select name="colour" value={form.colour} onChange={handleChange} required>
                <option value="">Select...</option>
                {configs.colour.map((c) => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Product Type</label>
              <select name="product_type" value={form.product_type} onChange={handleChange} required>
                {configs.product_type.length > 0
                  ? configs.product_type.map((c) => <option key={c.id} value={c.value}>{c.value}</option>)
                  : <><option value="Roll">Roll</option><option value="Patti">Patti</option></>
                }
              </select>
            </div>
            <div className="form-group">
              <label>Net Weight (kg)</label>
              <input type="number" step="0.1" name="net_weight" value={form.net_weight} onChange={handleChange} required placeholder="e.g. 85" />
            </div>
            <div className="form-group">
              <label>Gross Weight (kg)</label>
              <input type="number" step="0.1" name="gross_weight" value={form.gross_weight} onChange={handleChange} placeholder="e.g. 87" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Length (meters)</label>
              <input type="number" step="0.1" name="length" value={form.length} onChange={handleChange} placeholder="e.g. 150" />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input type="number" step="0.1" name="width" value={form.width} onChange={handleChange} placeholder="e.g. 40" />
            </div>
            <div className="form-group">
              <label>Storage Location</label>
              <select name="location" value={form.location} onChange={handleChange}>
                <option value="">Select...</option>
                {configs.location.map((c) => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
          </div>

          {/* Row 5 */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 24 }}>
            <div className="checkbox-group">
              <input type="checkbox" name="laminated" checked={form.laminated} onChange={handleChange} id="laminated" />
              <label htmlFor="laminated">Laminated</label>
            </div>
            <button className="btn btn-primary" type="submit">Generate Sticker</button>
          </div>

          {error && <p style={{ color: "#e74c3c", marginTop: 12 }}>{error}</p>}
        </form>
      </div>

      {/* Sticker Preview */}
      {createdProduct && (
        <div className="card">
          <h3>Sticker Generated — {createdProduct.product_number}</h3>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div className="sticker-preview">
              <img
                src={getStickerPreviewUrl(createdProduct.id)}
                alt={`Sticker for ${createdProduct.product_number}`}
              />
            </div>
            <div>
              <table>
                <tbody>
                  <tr><td><strong>Product No</strong></td><td>{createdProduct.product_number}</td></tr>
                  <tr><td><strong>Type</strong></td><td>{createdProduct.product_type}</td></tr>
                  <tr><td><strong>Quality</strong></td><td>{createdProduct.quality}</td></tr>
                  <tr><td><strong>GSM</strong></td><td>{createdProduct.gsm}</td></tr>
                  <tr><td><strong>Colour</strong></td><td>{createdProduct.colour}</td></tr>
                  <tr><td><strong>Net Weight</strong></td><td>{createdProduct.net_weight} kg</td></tr>
                  <tr><td><strong>Gross Weight</strong></td><td>{createdProduct.gross_weight} kg</td></tr>
                  <tr><td><strong>Length</strong></td><td>{createdProduct.length ? `${createdProduct.length} m` : "-"}</td></tr>
                  <tr><td><strong>Width</strong></td><td>{createdProduct.width ? `${createdProduct.width} inch` : "-"}</td></tr>
                </tbody>
              </table>
              <div className="btn-group" style={{ marginTop: 12 }}>
                <a href={`http://localhost:5000/api/sticker/${createdProduct.id}`} className="btn btn-primary btn-sm" download>
                  Download Sticker
                </a>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                  Print Sticker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StickerGenerator;
