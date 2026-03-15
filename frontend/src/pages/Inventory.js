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
      <button key="prev" disabled={page <= 1} onClick={() => setPage(page - 1)}>&laquo;</button>
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
      <button key="next" disabled={page >= pages} onClick={() => setPage(page + 1)}>&raquo;</button>
    );
    return <div className="pagination">{btns}</div>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Inventory ({total})</h1>
        <div className="btn-group">
          <input
            type="text"
            placeholder="Search product no..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          />
          <a href={exportInventory()} className="btn btn-secondary btn-sm" download>
            Export CSV
          </a>
        </div>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Product No</th>
              <th>Color</th>
              <th>Quality</th>
              <th>Type</th>
              <th>Length</th>
              <th>Width</th>
              <th>Gross Wt</th>
              <th>Net Wt</th>
              <th>GSM</th>
              <th>Laminated</th>
              <th>Status</th>
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
                <td>{p.length || "-"}</td>
                <td>{p.width || "-"}</td>
                <td>{p.gross_weight}</td>
                <td><strong>{p.net_weight}</strong></td>
                <td>{p.gsm}</td>
                <td>{p.laminated ? "Yes" : "No"}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>
                  <div className="action-icons">
                    <button className="icon-btn" title="View Sticker" onClick={() => setViewModal(p)}>
                      &#128065;
                    </button>
                    <button className="icon-btn" title="Edit" onClick={() => setEditModal({ ...p })}>
                      &#9998;
                    </button>
                    <button className="icon-btn" title="Delete" onClick={() => handleDelete(p.id)}>
                      &#128465;
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={12} style={{ textAlign: "center", padding: 20 }}>No inventory found</td></tr>
            )}
          </tbody>
        </table>
        {renderPagination()}
      </div>

      {/* View Sticker Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sticker — {viewModal.product_number}</h2>
              <button className="modal-close" onClick={() => setViewModal(null)}>&times;</button>
            </div>
            <div className="sticker-preview">
              <img
                src={getStickerPreviewUrl(viewModal.id)}
                alt={`Sticker ${viewModal.product_number}`}
                style={{ maxWidth: "100%" }}
              />
            </div>
            <div className="btn-group" style={{ marginTop: 16, justifyContent: "center" }}>
              <a href={`http://localhost:5000/api/sticker/${viewModal.id}`} className="btn btn-primary btn-sm" download>
                Download
              </a>
              <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Print</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit — {editModal.product_number}</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>&times;</button>
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
                      step={f.type === "number" ? "0.1" : undefined}
                      value={editModal[f.key] ?? ""}
                      onChange={(e) => setEditModal({ ...editModal, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <div className="form-group">
                <label>Laminated</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={editModal.laminated || false}
                    onChange={(e) => setEditModal({ ...editModal, laminated: e.target.checked })}
                  />
                  <span>Yes</span>
                </div>
              </div>
            </div>
            <div className="btn-group" style={{ marginTop: 16 }}>
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
