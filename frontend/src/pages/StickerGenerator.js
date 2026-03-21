import React, { useState, useEffect } from "react";
import { createProduct, getConfigs, getStickerPreviewUrl } from "../services/api";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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
  const [stickerModal, setStickerModal] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getConfigs().then((r) => {
      const grouped = { quality: [], colour: [], product_type: [], location: [] };
      r.data.forEach((c) => {
        if (grouped[c.config_type]) grouped[c.config_type].push(c);
      });
      setConfigs(grouped);
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
    setStickerModal(null);
    setSubmitting(true);
    try {
      const res = await createProduct(form);
      setStickerModal(res.data.product);
      setForm((f) => ({ ...f, net_weight: "", gross_weight: "", length: "", width: "" }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSticker = () => {
    if (!stickerModal) return;
    const w = window.open("", "_blank", "width=500,height=700");
    w.document.write(`
      <html><head><title>Sticker - ${stickerModal.product_number}</title>
      <style>
        body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        img { max-width: 100%; height: auto; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <img src="${API_BASE}/sticker/${stickerModal.id}" />
      </body></html>
    `);
    w.document.close();
    w.onload = () => w.print();
  };

  const fmtNum = (v) => v != null && v !== "" ? Number(v).toFixed(2) : "-";

  return (
    <div>
      <div className="page-header"><h1>Sticker Generator</h1></div>

      <div className="card">
        <form onSubmit={handleSubmit}>
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

          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Serial Number</label>
              <input type="text" value="Auto-generated" disabled style={{ background: "#f7fafc", color: "#a0aec0" }} />
            </div>
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
          </div>

          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Colour</label>
              <select name="colour" value={form.colour} onChange={handleChange} required>
                <option value="">Select...</option>
                {configs.colour.map((c) => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
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
              <input type="number" step="0.01" name="net_weight" value={form.net_weight} onChange={handleChange} required placeholder="e.g. 62.70" />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Gross Weight (kg)</label>
              <input type="number" step="0.01" name="gross_weight" value={form.gross_weight} onChange={handleChange} placeholder="e.g. 63.10" />
            </div>
            <div className="form-group">
              <label>Length (meters)</label>
              <input type="number" step="0.01" name="length" value={form.length} onChange={handleChange} placeholder="e.g. 1000.00" />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input type="number" step="0.01" name="width" value={form.width} onChange={handleChange} placeholder="e.g. 34.00" />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Storage Location</label>
              <select name="location" value={form.location} onChange={handleChange}>
                <option value="">Select...</option>
                {configs.location.map((c) => <option key={c.id} value={c.value}>{c.value}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Laminated</label>
              <div className="checkbox-group" style={{ paddingTop: 6 }}>
                <input type="checkbox" name="laminated" checked={form.laminated} onChange={handleChange} id="laminated" />
                <label htmlFor="laminated" style={{ fontSize: 14, fontWeight: 400, textTransform: "none" }}>Yes</label>
              </div>
            </div>
            <div className="form-group" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Generating..." : "Generate Sticker"}
              </button>
            </div>
          </div>

          {error && <p style={{ color: "#e74c3c", marginTop: 12, fontSize: 13 }}>{error}</p>}
        </form>
      </div>

      {/* Sticker Modal — auto pops up after generation */}
      {stickerModal && (
        <div className="modal-overlay" onClick={() => setStickerModal(null)}>
          <div className="modal invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sticker Generated &mdash; {stickerModal.product_number}</h2>
              <button className="modal-close" onClick={() => setStickerModal(null)}>{"\u00D7"}</button>
            </div>

            <div className="sticker-success-badge">
              Added to Inventory
            </div>

            {/* Invoice-style sticker preview */}
            <div className="invoice-header">
              <div className="invoice-brand">
                <h2>BHARAT</h2>
                <p>MADE IN INDIA</p>
                <p>Manufactured by</p>
                <p className="company">Tejaswi Nonwovens Pvt Ltd</p>
              </div>
              <div className="invoice-qr">
                <img src={getStickerPreviewUrl(stickerModal.id)} alt="QR" style={{ width: 140, height: 140 }} />
              </div>
            </div>

            <table className="invoice-table">
              <tbody>
                <tr>
                  <td className="label">Product No</td>
                  <td className="value">: {stickerModal.product_number}</td>
                  <td className="label">Colour</td>
                  <td className="value">: {stickerModal.colour}</td>
                </tr>
                <tr>
                  <td className="label">Length</td>
                  <td className="value">: {fmtNum(stickerModal.length)}</td>
                  <td className="label">Width</td>
                  <td className="value">: {fmtNum(stickerModal.width)}</td>
                </tr>
                <tr>
                  <td className="label">Quality</td>
                  <td className="value">: {stickerModal.quality}</td>
                  <td className="label">GSM</td>
                  <td className="value">: {stickerModal.gsm}</td>
                </tr>
                <tr>
                  <td className="label">Gross Weight</td>
                  <td className="value">: {fmtNum(stickerModal.gross_weight)}</td>
                  <td className="label">Net Weight</td>
                  <td className="value">: {fmtNum(stickerModal.net_weight)}</td>
                </tr>
              </tbody>
            </table>

            <div className="invoice-actions">
              <button className="btn btn-primary btn-sm" onClick={handlePrintSticker}>
                Print Sticker
              </button>
              <a
                href={`${API_BASE}/sticker/${stickerModal.id}`}
                className="btn btn-secondary btn-sm"
                download
              >
                Download PNG
              </a>
              <button className="btn btn-secondary btn-sm" onClick={() => setStickerModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StickerGenerator;
