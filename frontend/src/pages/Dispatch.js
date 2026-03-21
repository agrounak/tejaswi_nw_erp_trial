import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  startDispatch, scanLoad, removeDispatchItem,
  updateDispatchDetails, getRoughSlip, getFinalSlip,
  listDispatches, getDispatchSheet
} from "../services/api";

function Dispatch() {
  // Scan-first: dispatch starts when first QR is scanned
  const [activeDispatch, setActiveDispatch] = useState(null);
  const [loadedItems, setLoadedItems] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);

  // Party details — filled AFTER scanning
  const [clientName, setClientName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Packing slip modal
  const [packingSlip, setPackingSlip] = useState(null);

  const scanRef = useRef(null);

  // Resume any existing Loading dispatch
  useEffect(() => {
    listDispatches({ status: "Loading" }).then((r) => {
      if (r.data.length > 0) {
        const d = r.data[0];
        setActiveDispatch(d);
        setLoadedItems(d.items || []);
        if (d.client_name) setClientName(d.client_name);
        if (d.vehicle_number) setVehicleNumber(d.vehicle_number);
        if (d.driver_name) setDriverName(d.driver_name);
        if (d.driver_phone) setDriverPhone(d.driver_phone);
        if (d.client_name && d.vehicle_number) setDetailsSaved(true);
      }
    }).catch(console.error);
  }, []);

  // Auto-focus scan input
  useEffect(() => {
    if (scanRef.current) scanRef.current.focus();
  }, [activeDispatch]);

  const ensureDispatch = useCallback(async () => {
    if (activeDispatch) return activeDispatch;
    try {
      const res = await startDispatch({});
      setActiveDispatch(res.data.dispatch);
      return res.data.dispatch;
    } catch (err) {
      setScanResult({ success: false, message: err.response?.data?.error || "Failed to start dispatch" });
      return null;
    }
  }, [activeDispatch]);

  const handleScan = useCallback(async (productNumber) => {
    const code = (productNumber || scanInput).trim();
    if (!code) return;

    setScanResult(null);
    const dispatch = await ensureDispatch();
    if (!dispatch) return;

    try {
      const res = await scanLoad(dispatch.id, { product_number: code });
      setScanResult({ success: true, message: res.data.message, product: res.data.product });
      setLoadedItems(res.data.dispatch.items || []);
      setActiveDispatch(res.data.dispatch);
      setScanInput("");
    } catch (err) {
      setScanResult({ success: false, message: err.response?.data?.error || "Scan failed" });
      setScanInput("");
    }
    scanRef.current?.focus();
  }, [scanInput, ensureDispatch]);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    handleScan();
  };

  const handleRemoveItem = async (itemId) => {
    if (!activeDispatch) return;
    try {
      const res = await removeDispatchItem(activeDispatch.id, itemId);
      setLoadedItems(res.data.dispatch.items || []);
      setActiveDispatch(res.data.dispatch);
    } catch (err) {
      alert(err.response?.data?.error || "Remove failed");
    }
  };

  const handleSaveDetails = async () => {
    if (!activeDispatch) return;
    if (!clientName.trim() || !vehicleNumber.trim()) {
      alert("Client Name and Vehicle Number are required");
      return;
    }
    try {
      const res = await updateDispatchDetails(activeDispatch.id, {
        client_name: clientName.trim(),
        vehicle_number: vehicleNumber.trim(),
        driver_name: driverName.trim(),
        driver_phone: driverPhone.trim(),
      });
      setActiveDispatch(res.data.dispatch);
      setDetailsSaved(true);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save details");
    }
  };

  const handleRoughSlip = async () => {
    if (!activeDispatch) return;
    try {
      const res = await getRoughSlip(activeDispatch.id);
      setPackingSlip({ ...res.data, is_rough: true });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate rough slip");
    }
  };

  const handleFinalSlip = async () => {
    if (!activeDispatch) return;
    if (!detailsSaved) {
      alert("Please save party details before generating final packing slip");
      return;
    }
    if (!window.confirm("Generate Final Packing Slip? This will remove all scanned rolls from inventory.")) return;
    try {
      const res = await getFinalSlip(activeDispatch.id);
      setPackingSlip({ ...res.data, is_rough: false });
      // Reset dispatch
      setActiveDispatch(null);
      setLoadedItems([]);
      setClientName("");
      setVehicleNumber("");
      setDriverName("");
      setDriverPhone("");
      setDetailsSaved(false);
      setScanInput("");
      setScanResult(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate final slip");
    }
  };

  const handlePrintSlip = (sheet) => {
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(`
      <html><head><title>${sheet.is_rough ? "Rough" : "Final"} Packing Slip - ${sheet.dispatch_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 10px; }
        .rough { background: #fef3cd; color: #856404; }
        .final { background: #d1fae5; color: #065f46; }
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
      <h1>${sheet.is_rough ? "Rough" : "Final"} Packing Slip
        <span class="type-badge ${sheet.is_rough ? "rough" : "final"}">${sheet.is_rough ? "ROUGH" : "FINAL"}</span>
      </h1>
      <p class="subtitle">${sheet.dispatch_number}</p>
      <div class="info-grid">
        <div>Client: <strong>${sheet.client_name || "-"}</strong></div>
        <div>Vehicle: <strong>${sheet.vehicle_number || "-"}</strong></div>
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

  const totalItems = activeDispatch?.total_items || loadedItems.length;
  const totalWeight = activeDispatch?.total_weight || loadedItems.reduce((s, i) => s + i.weight, 0);

  return (
    <div>
      <div className="page-header"><h1>Dispatch Manager</h1></div>

      {/* Step 1: Scan QR Codes */}
      <div className="card">
        <h3>Step 1: Scan Rolls</h3>
        <p style={{ fontSize: 13, color: "#7f8fa4", marginTop: -8, marginBottom: 16 }}>
          Use the QR scanner machine or type the product number. Rolls are added as you scan.
        </p>
        <form onSubmit={handleScanSubmit}>
          <div className="dispatch-form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Scan or Enter Product Number</label>
              <input
                ref={scanRef}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan QR code or type product number..."
                autoFocus
              />
            </div>
            <div className="form-group" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit">Add</button>
            </div>
          </div>
        </form>

        {scanResult && (
          <div className={`scan-result ${scanResult.success ? "scan-success" : "scan-error"}`} style={{ marginTop: 12 }}>
            <strong>{scanResult.success ? "VALID" : "ERROR"}</strong> &mdash; {scanResult.message}
            {scanResult.product && (
              <span style={{ marginLeft: 12, fontSize: 12 }}>
                ({scanResult.product.product_number} | {scanResult.product.colour} | {scanResult.product.quality} | {scanResult.product.net_weight} kg)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scanned Items Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px 0" }}>
          <h3 style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
            Scanned Items
            {loadedItems.length > 0 && (
              <span style={{ fontSize: 13, fontWeight: 400, color: "#7f8fa4", marginLeft: 12 }}>
                {totalItems} items | {typeof totalWeight === "number" ? totalWeight.toFixed(2) : totalWeight} kg
              </span>
            )}
          </h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product No</th>
              <th>Color</th>
              <th>Quality</th>
              <th>Type</th>
              <th>GSM</th>
              <th>Weight</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loadedItems.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td>
                <td><strong>{item.product_number}</strong></td>
                <td>{item.colour}</td>
                <td>{item.quality}</td>
                <td>{item.product_type}</td>
                <td>{item.gsm}</td>
                <td>{item.weight} kg</td>
                <td>
                  <button className="btn btn-danger btn-xs" onClick={() => handleRemoveItem(item.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {loadedItems.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#a0aec0" }}>
                No items scanned yet. Use the scanner above to add rolls.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Step 2: Party Details — shown after items are scanned */}
      {loadedItems.length > 0 && (
        <div className="card">
          <h3>Step 2: Party Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Client Name *</label>
              <input
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setDetailsSaved(false); }}
                placeholder="Enter client / party name"
                disabled={detailsSaved}
              />
            </div>
            <div className="form-group">
              <label>Vehicle Number *</label>
              <input
                value={vehicleNumber}
                onChange={(e) => { setVehicleNumber(e.target.value); setDetailsSaved(false); }}
                placeholder="Enter vehicle number"
                disabled={detailsSaved}
              />
            </div>
            <div className="form-group">
              <label>Driver Name</label>
              <input
                value={driverName}
                onChange={(e) => { setDriverName(e.target.value); setDetailsSaved(false); }}
                placeholder="Enter driver name"
                disabled={detailsSaved}
              />
            </div>
            <div className="form-group">
              <label>Driver Contact</label>
              <input
                value={driverPhone}
                onChange={(e) => { setDriverPhone(e.target.value); setDetailsSaved(false); }}
                placeholder="Enter driver phone"
                disabled={detailsSaved}
              />
            </div>
          </div>
          <div className="btn-group" style={{ marginTop: 16 }}>
            {!detailsSaved ? (
              <button className="btn btn-primary btn-sm" onClick={handleSaveDetails}>
                Save Party Details
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setDetailsSaved(false)}>
                Edit Details
              </button>
            )}
          </div>
          {detailsSaved && (
            <div className="scan-result scan-success" style={{ marginTop: 12 }}>
              Party details saved successfully.
            </div>
          )}
        </div>
      )}

      {/* Step 3: Generate Packing Slip */}
      {loadedItems.length > 0 && (
        <div className="card">
          <h3>Step 3: Generate Packing Slip</h3>
          <div className="dispatch-summary-bar">
            <span>Total Items: <strong>{totalItems}</strong></span>
            <span>Total Weight: <strong>{typeof totalWeight === "number" ? totalWeight.toFixed(2) : totalWeight} kg</strong></span>
          </div>
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button
              className="btn btn-warning"
              onClick={handleRoughSlip}
            >
              Rough Packing Slip
            </button>
            <button
              className="btn btn-success"
              onClick={handleFinalSlip}
              disabled={!detailsSaved}
              title={!detailsSaved ? "Save party details first" : ""}
            >
              Final Packing Slip
            </button>
          </div>
          {!detailsSaved && (
            <p style={{ fontSize: 12, color: "#7f8fa4", marginTop: 8 }}>
              Save party details to enable Final Packing Slip. Rough slip is available without party details.
            </p>
          )}
        </div>
      )}

      {/* Packing Slip Modal */}
      {packingSlip && (
        <div className="modal-overlay" onClick={() => setPackingSlip(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
            <div className="modal-header">
              <h2>
                {packingSlip.is_rough ? "Rough" : "Final"} Packing Slip &mdash; {packingSlip.dispatch_number}
                <span className={`slip-badge ${packingSlip.is_rough ? "slip-rough" : "slip-final"}`}>
                  {packingSlip.is_rough ? "ROUGH" : "FINAL"}
                </span>
              </h2>
              <button className="modal-close" onClick={() => setPackingSlip(null)}>{"\u00D7"}</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 20, fontSize: 14 }}>
              <div>Client: <strong>{packingSlip.client_name || "-"}</strong></div>
              <div>Vehicle: <strong>{packingSlip.vehicle_number || "-"}</strong></div>
              <div>Driver: <strong>{packingSlip.driver_name || "-"}</strong></div>
              <div>Contact: <strong>{packingSlip.driver_phone || "-"}</strong></div>
              <div>Date: <strong>{new Date(packingSlip.dispatch_date).toLocaleDateString("en-IN")}</strong></div>
              <div>Items: <strong>{packingSlip.total_items}</strong> | Weight: <strong>{packingSlip.total_weight} kg</strong></div>
            </div>

            {/* Grouped Summary */}
            {packingSlip.summary && packingSlip.summary.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #edf2f7" }}>Summary (Grouped)</h3>
                <table>
                  <thead><tr><th>Quality</th><th>Colour</th><th>Type</th><th>Pieces</th><th>Weight</th></tr></thead>
                  <tbody>
                    {packingSlip.summary.map((s, i) => (
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
                  {packingSlip.products.map((p, i) => (
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
              <button className="btn btn-primary btn-sm" onClick={() => handlePrintSlip(packingSlip)}>
                Print Packing Slip
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadCSV(packingSlip)}>
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dispatch;
