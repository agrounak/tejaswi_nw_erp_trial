import React, { useState, useEffect, useCallback } from "react";
import { getStock, updateProduct, deleteProduct, getStickerPreviewUrl, exportInventory } from "../services/api";

function StatusBadge({ status }) {
  const cls = {
    "Manufactured": "badge-manufactured",
    "Sticker Printed": "badge-sticker",
    "In Warehouse": "badge-warehouse",
    "Allocated": "badge-allocated",
    "Loaded": "badge-loaded",
    "Dispatched": "badge-dispatched",
  }[status] || "";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function Inventory() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);

  const fetchStock = useCallback(() => {
    getStock({ page, per_page: 25, search: search || undefined })
      .then((r) => {
        setProducts(r.data.products);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(console.error);
  }, [page, search]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  const handleEditSave = async () => {
    try {
      await updateProduct(editModal.id, editModal);
      setEditModal(null);
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    }
  };

  const renderPagination = () => {
    if (pages <= 1) return null;
    const btns = [];
    btns.push(
      <button key="prev" disabled={page <= 1} onClick={() => setPage(page - 1)}>{"\u2039"}</button>
    );
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    for (let i = start; i <= end; i++) {
      btns.push(
        <button key={i} className={i === page ? "active" : ""} onClick={() => setPage(i)}>{i}</button>
      );
    }
    if (end < pages) {
      btns.push(<span key="dots">...</span>);
      btns.push(<button key={pages} onClick={() => setPage(pages)}>{pages}</button>);
    }
    btns.push(
      <button key="next" disabled={page >= pages} onClick={() => setPage(page + 1)}>{"\u203A"}</button>
    );
    return <div className="pagination">{btns}</div>;
  };

  const fmtNum = (v) => v != null ? Number(v).toFixed(2) : "-";

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <div className="btn-group" style={{ alignItems: "center" }}>
          <div className="search-bar">
            <span className="search-icon">{"\u2315"}</span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <a href={exportInventory()} className="btn-export" download>
            Export Inventory
          </a>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Product No.</th>
                <th>Color</th>
                <th>Quality</th>
                <th>Type</th>
                <th>Length</th>
                <th>Width</th>
                <th>Gross Weight</th>
                <th>Net Weight</th>
                <th>GSM</th>
                <th>Laminated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.product_number}</strong></td>
                  <td>{p.colour}</td>
                  <td>{p.quality}</td>
                  <td>{p.product_type}</td>
                  <td>{fmtNum(p.length)}</td>
                  <td>{fmtNum(p.width)}</td>
                  <td>{fmtNum(p.gross_weight)}</td>
                  <td>{fmtNum(p.net_weight)}</td>
                  <td>{p.gsm}</td>
                  <td>{p.laminated ? "Yes" : "No"}</td>
                  <td>
                    <div className="action-icons">
                      <button className="icon-btn view" title="View Invoice" onClick={() => setViewModal(p)}>
                        {"\u25CE"}
                      </button>
                      <button className="icon-btn edit" title="Edit" onClick={() => setEditModal({ ...p })}>
                        {"\u270E"}
                      </button>
                      <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(p.id)}>
                        {"\u2717"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#a0aec0" }}>No inventory found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>

      {/* ── Inventory Invoice Modal (matches screenshot) ── */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Inventory Invoice</h2>
              <button className="modal-close" onClick={() => setViewModal(null)}>{"\u00D7"}</button>
            </div>

            {/* Header: Brand left, QR right */}
            <div className="invoice-header">
              <div className="invoice-brand">
                <h2>BHARAT</h2>
                <p>MADE IN INDIA</p>
                <p>Manufactured by</p>
                <p className="company">Tejaswi Nonwovens Pvt Ltd</p>
              </div>
              <div className="invoice-qr">
                <img
                  src={getStickerPreviewUrl(viewModal.id)}
                  alt="QR Code"
                  style={{ width: 140, height: 140, objectFit: "contain" }}
                />
              </div>
            </div>

            {/* 2-column detail table */}
            <table className="invoice-table">
              <tbody>
                <tr>
                  <td className="label">Product No</td>
                  <td className="value">: {viewModal.product_number}</td>
                  <td className="label">Colour</td>
                  <td className="value">: {viewModal.colour}</td>
                </tr>
                <tr>
                  <td className="label">Length</td>
                  <td className="value">: {fmtNum(viewModal.length)}</td>
                  <td className="label">Width</td>
                  <td className="value">: {fmtNum(viewModal.width)}</td>
                </tr>
                <tr>
                  <td className="label">Quality</td>
                  <td className="value">: {viewModal.quality}</td>
                  <td className="label">GSM</td>
                  <td className="value">: {viewModal.gsm}</td>
                </tr>
                <tr>
                  <td className="label">Gross Weight</td>
                  <td className="value">: {fmtNum(viewModal.gross_weight)}</td>
                  <td className="label">Net Weight</td>
                  <td className="value">: {fmtNum(viewModal.net_weight)}</td>
                </tr>
              </tbody>
            </table>

            <div className="invoice-actions">
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                {"\uD83D\uDDA8"} Print
              </button>
              <a
                href={`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/sticker/${viewModal.id}`}
                className="btn btn-secondary btn-sm"
                download
              >
                Download Sticker
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product &mdash; {editModal.product_number}</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>{"\u00D7"}</button>
            </div>
            <div className="form-grid">
              {[
                { label: "Product Type", key: "product_type", type: "select", options: ["Roll", "Patti"] },
                { label: "Colour", key: "colour" },
                { label: "Quality", key: "quality" },
                { label: "Length (m)", key: "length", type: "number" },
                { label: "Width (inch)", key: "width", type: "number" },
                { label: "Gross Weight", key: "gross_weight", type: "number" },
                { label: "Net Weight", key: "net_weight", type: "number" },
              ].map((f) => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      value={editModal[f.key] || ""}
                      onChange={(e) => setEditModal({ ...editModal, [f.key]: e.target.value })}
                    >
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      step={f.type === "number" ? "0.01" : undefined}
                      value={editModal[f.key] ?? ""}
                      onChange={(e) => setEditModal({ ...editModal, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <div className="form-group">
                <label>Laminated</label>
                <div className="checkbox-group" style={{ paddingTop: 6 }}>
                  <input
                    type="checkbox"
                    checked={editModal.laminated || false}
                    onChange={(e) => setEditModal({ ...editModal, laminated: e.target.checked })}
                  />
                  <span>Yes</span>
                </div>
              </div>
            </div>
            <div className="btn-group" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
