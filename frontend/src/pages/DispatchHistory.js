import React, { useState, useEffect } from "react";
import { getDispatchHistory, getDispatchSheet } from "../services/api";

function DispatchHistory() {
  const [dispatches, setDispatches] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);

  useEffect(() => {
    getDispatchHistory().then((r) => setDispatches(r.data)).catch(console.error);
  }, []);

  const handleShowDetails = async (id) => {
    try {
      const res = await getDispatchSheet(id);
      setSelectedSheet(res.data);
    } catch (err) {
      alert("Failed to load dispatch details");
    }
  };

  const handleDownloadCSV = (sheet) => {
    const headers = ["Product No", "Color", "Quality", "Type", "Gross Weight", "Net Weight", "GSM", "Length", "Width"];
    const rows = sheet.products.map((p) => [
      p.product_number, p.colour, p.quality, p.product_type,
      p.gross_weight, p.net_weight, p.gsm, p.length || "", p.width || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispatch_${sheet.dispatch_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header"><h1>Dispatched History</h1></div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Dispatch No</th><th>Client</th><th>Date</th><th>Vehicle</th><th>Items</th><th>Total Weight</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {dispatches.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.dispatch_number}</strong></td>
                <td>{d.client_name}</td>
                <td>{new Date(d.dispatch_date).toLocaleDateString("en-IN")}</td>
                <td>{d.vehicle_number}</td>
                <td>{d.total_items}</td>
                <td><strong>{d.total_weight} kg</strong></td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-primary btn-xs" onClick={() => handleShowDetails(d.id)}>
                      Show Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {dispatches.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 20 }}>No dispatch history</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Packing Slip Modal */}
      {selectedSheet && (
        <div className="modal-overlay" onClick={() => setSelectedSheet(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>Packing Slip — {selectedSheet.dispatch_number}</h2>
              <button className="modal-close" onClick={() => setSelectedSheet(null)}>&times;</button>
            </div>

            {/* Dispatch Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16, fontSize: 14 }}>
              <div><strong>Client:</strong> {selectedSheet.client_name}</div>
              <div><strong>Vehicle:</strong> {selectedSheet.vehicle_number}</div>
              <div><strong>Driver:</strong> {selectedSheet.driver_name || "-"}</div>
              <div><strong>Contact:</strong> {selectedSheet.driver_phone || "-"}</div>
              <div><strong>Date:</strong> {new Date(selectedSheet.dispatch_date).toLocaleDateString("en-IN")}</div>
              <div><strong>Items:</strong> {selectedSheet.total_items} | <strong>Weight:</strong> {selectedSheet.total_weight} kg</div>
            </div>

            {/* Grouped Summary */}
            {selectedSheet.summary && selectedSheet.summary.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, marginBottom: 8 }}>Summary</h3>
                <table>
                  <thead>
                    <tr><th>Quality</th><th>Colour</th><th>Type</th><th>Pieces</th><th>Weight</th></tr>
                  </thead>
                  <tbody>
                    {selectedSheet.summary.map((s, i) => (
                      <tr key={i}>
                        <td>{s.quality}</td>
                        <td>{s.colour}</td>
                        <td>{s.product_type}</td>
                        <td>{s.count}</td>
                        <td><strong>{s.total_weight} kg</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Detailed Table */}
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>Detailed Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product No</th><th>Color</th><th>Quality</th><th>Type</th>
                  <th>Gross Wt</th><th>Net Wt</th><th>GSM</th><th>Length</th><th>Width</th>
                </tr>
              </thead>
              <tbody>
                {selectedSheet.products.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.product_number}</strong></td>
                    <td>{p.colour}</td>
                    <td>{p.quality}</td>
                    <td>{p.product_type}</td>
                    <td>{p.gross_weight}</td>
                    <td><strong>{p.net_weight}</strong></td>
                    <td>{p.gsm}</td>
                    <td>{p.length || "-"}</td>
                    <td>{p.width || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="btn-group" style={{ marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Print Packing Slip</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadCSV(selectedSheet)}>Download CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DispatchHistory;
