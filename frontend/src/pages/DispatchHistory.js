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

  const handlePrintSlip = (sheet) => {
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(`
      <html><head><title>Packing Slip - ${sheet.dispatch_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { color: #888; font-size: 13px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 20px; font-size: 14px; }
        .info-grid strong { color: #222; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 9px 12px; border: 1px solid #ddd; font-size: 13px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .summary-section { margin-bottom: 20px; }
        .summary-section h3 { font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .total { margin-top: 12px; font-size: 14px; font-weight: bold; }
      </style></head><body>
      <h1>Packing Slip</h1>
      <p class="subtitle">${sheet.dispatch_number}</p>
      <div class="info-grid">
        <div>Client: <strong>${sheet.client_name}</strong></div>
        <div>Vehicle: <strong>${sheet.vehicle_number}</strong></div>
        <div>Driver: <strong>${sheet.driver_name || "-"}</strong></div>
        <div>Contact: <strong>${sheet.driver_phone || "-"}</strong></div>
        <div>Date: <strong>${new Date(sheet.dispatch_date).toLocaleDateString("en-IN")}</strong></div>
        <div>Items: <strong>${sheet.total_items}</strong> | Weight: <strong>${sheet.total_weight} kg</strong></div>
      </div>
      ${sheet.summary && sheet.summary.length > 0 ? `
        <div class="summary-section">
          <h3>Summary (Grouped)</h3>
          <table>
            <thead><tr><th>Quality</th><th>Colour</th><th>Type</th><th>Pieces</th><th>Weight</th></tr></thead>
            <tbody>${sheet.summary.map((s) =>
              `<tr><td>${s.quality}</td><td>${s.colour}</td><td>${s.product_type}</td><td>${s.count}</td><td>${s.total_weight} kg</td></tr>`
            ).join("")}</tbody>
          </table>
        </div>` : ""}
      <h3 style="font-size:14px; margin-top:20px;">Detailed Items</h3>
      <table>
        <thead><tr><th>#</th><th>Product No</th><th>Color</th><th>Quality</th><th>Type</th><th>Gross Wt</th><th>Net Wt</th><th>GSM</th><th>Length</th><th>Width</th></tr></thead>
        <tbody>${sheet.products.map((p, i) =>
          `<tr><td>${i + 1}</td><td>${p.product_number}</td><td>${p.colour}</td><td>${p.quality}</td><td>${p.product_type}</td><td>${p.gross_weight}</td><td>${p.net_weight}</td><td>${p.gsm}</td><td>${p.length || "-"}</td><td>${p.width || "-"}</td></tr>`
        ).join("")}</tbody>
      </table>
      <p class="total">Total Items: ${sheet.total_items} | Total Weight: ${sheet.total_weight} kg</p>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      <div className="page-header"><h1>Dispatched History</h1></div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead>
            <tr><th>Dispatch No</th><th>Client</th><th>Date</th><th>Vehicle</th><th>Items</th><th>Total Weight</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {dispatches.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.dispatch_number}</strong></td>
                <td>{d.client_name}</td>
                <td>{fmtDate(d.dispatch_date)}</td>
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
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#a0aec0" }}>No dispatch history yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Packing Slip Modal */}
      {selectedSheet && (
        <div className="modal-overlay" onClick={() => setSelectedSheet(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
            <div className="modal-header">
              <h2>Packing Slip &mdash; {selectedSheet.dispatch_number}</h2>
              <button className="modal-close" onClick={() => setSelectedSheet(null)}>{"\u00D7"}</button>
            </div>

            {/* Dispatch Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 20, fontSize: 14 }}>
              <div>Client: <strong>{selectedSheet.client_name}</strong></div>
              <div>Vehicle: <strong>{selectedSheet.vehicle_number}</strong></div>
              <div>Driver: <strong>{selectedSheet.driver_name || "-"}</strong></div>
              <div>Contact: <strong>{selectedSheet.driver_phone || "-"}</strong></div>
              <div>Date: <strong>{fmtDate(selectedSheet.dispatch_date)}</strong></div>
              <div>Items: <strong>{selectedSheet.total_items}</strong> | Weight: <strong>{selectedSheet.total_weight} kg</strong></div>
            </div>

            {/* Grouped Summary */}
            {selectedSheet.summary && selectedSheet.summary.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #edf2f7" }}>Summary (Grouped by Quality / Colour / Type)</h3>
                <table>
                  <thead><tr><th>Quality</th><th>Colour</th><th>Type</th><th>Pieces</th><th>Weight</th></tr></thead>
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
            <h3 style={{ fontSize: 14, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #edf2f7" }}>Detailed Items</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Product No</th><th>Color</th><th>Quality</th><th>Type</th>
                    <th>Gross Wt</th><th>Net Wt</th><th>GSM</th><th>Length</th><th>Width</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSheet.products.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
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
            </div>

            <div className="btn-group" style={{ marginTop: 20, justifyContent: "center" }}>
              <button className="btn btn-primary btn-sm" onClick={() => handlePrintSlip(selectedSheet)}>
                Print Packing Slip
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadCSV(selectedSheet)}>
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DispatchHistory;
