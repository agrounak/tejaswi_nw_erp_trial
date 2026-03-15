import React, { useState, useEffect, useRef, useCallback } from "react";
import { createDispatch, scanLoad, removeDispatchItem, finalizeDispatch, listDispatches, getDispatchSheet } from "../services/api";

function Dispatch() {
  const [clientName, setClientName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [activeDispatch, setActiveDispatch] = useState(null);
  const [loadedItems, setLoadedItems] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const scanRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Resume any existing Loading dispatch
  useEffect(() => {
    listDispatches({ status: "Loading" }).then((r) => {
      if (r.data.length > 0) {
        const d = r.data[0];
        setActiveDispatch(d);
        setLoadedItems(d.items || []);
        setClientName(d.client_name);
        setVehicleNumber(d.vehicle_number);
        setDriverPhone(d.driver_phone || "");
      }
    }).catch(console.error);
  }, []);

  // Auto-focus scan input
  useEffect(() => {
    if (activeDispatch && scanRef.current) scanRef.current.focus();
  }, [activeDispatch]);

  const ensureDispatch = useCallback(async () => {
    if (activeDispatch) return activeDispatch;
    if (!clientName.trim() || !vehicleNumber.trim()) return null;
    try {
      const res = await createDispatch({
        client_name: clientName.trim(),
        vehicle_number: vehicleNumber.trim(),
        driver_phone: driverPhone.trim(),
      });
      setActiveDispatch(res.data.dispatch);
      return res.data.dispatch;
    } catch (err) {
      setScanResult({ success: false, message: err.response?.data?.error || "Failed to create dispatch" });
      return null;
    }
  }, [activeDispatch, clientName, vehicleNumber, driverPhone]);

  const handleScan = useCallback(async (productNumber) => {
    const code = (productNumber || scanInput).trim();
    if (!code) return;
    if (!clientName.trim() || !vehicleNumber.trim()) {
      setScanResult({ success: false, message: "Please fill Client Name and Vehicle Number first" });
      return;
    }

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
  }, [scanInput, clientName, vehicleNumber, ensureDispatch]);

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

  const handleFinalize = async () => {
    if (!activeDispatch) return;
    if (!window.confirm("Finalize this dispatch? All products will be marked as DISPATCHED.")) return;
    try {
      await finalizeDispatch(activeDispatch.id);
      setActiveDispatch(null);
      setLoadedItems([]);
      setClientName("");
      setVehicleNumber("");
      setDriverPhone("");
      setScanInput("");
      setScanResult(null);
      alert("Dispatch finalized successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Finalize failed");
    }
  };

  const handleRoughDispatch = async () => {
    if (!activeDispatch) return;
    try {
      const res = await getDispatchSheet(activeDispatch.id);
      const sheet = res.data;
      // Generate printable rough dispatch
      const w = window.open("", "_blank", "width=800,height=600");
      w.document.write(`
        <html><head><title>Rough Dispatch - ${sheet.dispatch_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h2 { margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 8px 12px; border: 1px solid #ddd; font-size: 13px; text-align: left; }
          th { background: #f5f5f5; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
          .summary { margin-top: 16px; font-weight: bold; }
        </style></head><body>
        <h2>Rough Dispatch - ${sheet.dispatch_number}</h2>
        <div class="info">
          <div><strong>Client:</strong> ${sheet.client_name}</div>
          <div><strong>Vehicle:</strong> ${sheet.vehicle_number}</div>
          <div><strong>Driver:</strong> ${sheet.driver_phone || "-"}</div>
          <div><strong>Date:</strong> ${new Date(sheet.dispatch_date).toLocaleDateString("en-IN")}</div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Product No</th><th>Color</th><th>Quality</th><th>Type</th><th>GSM</th><th>Weight</th></tr></thead>
          <tbody>${sheet.products.map((p, i) => `
            <tr><td>${i + 1}</td><td>${p.product_number}</td><td>${p.colour}</td><td>${p.quality}</td><td>${p.product_type}</td><td>${p.gsm}</td><td>${p.net_weight} kg</td></tr>`).join("")}
          </tbody>
        </table>
        <p class="summary">Total Items: ${sheet.total_items} | Total Weight: ${sheet.total_weight} kg</p>
        </body></html>
      `);
      w.document.close();
      w.print();
    } catch (err) {
      alert("Failed to generate rough dispatch");
    }
  };

  // Camera QR scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      alert("Camera access denied or not available");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const totalItems = activeDispatch?.total_items || loadedItems.length;
  const totalWeight = activeDispatch?.total_weight || loadedItems.reduce((s, i) => s + i.weight, 0);

  return (
    <div>
      <div className="page-header"><h1>Dispatch Manager</h1></div>

      <div className="card">
        {/* Inline form row matching screenshot */}
        <div className="dispatch-form-row">
          <div className="form-group">
            <label>Client Name*</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter Client Name"
              disabled={!!activeDispatch}
            />
          </div>
          <div className="form-group">
            <label>Scan or Enter QR Code</label>
            <div className="scan-input-row">
              <form onSubmit={handleScanSubmit} style={{ display: "contents" }}>
                <input
                  ref={scanRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan or type product number..."
                />
              </form>
            </div>
          </div>
          <div className="form-group" style={{ justifyContent: "flex-end" }}>
            <label>&nbsp;</label>
            <button
              className="btn btn-camera btn-sm"
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? "Stop Camera" : "\uD83D\uDCF7 Scan With Camera"}
            </button>
          </div>
          <div className="form-group">
            <label>Vehicle Number*</label>
            <input
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="Enter Vehicle Number"
              disabled={!!activeDispatch}
            />
          </div>
          <div className="form-group">
            <label>Driver Contact Number*</label>
            <input
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="Enter Driver Contact Number"
              disabled={!!activeDispatch}
            />
          </div>
        </div>

        {/* Camera preview */}
        {cameraActive && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <video
              ref={videoRef}
              style={{ width: 320, height: 240, borderRadius: 8, border: "2px solid #e2e8f0" }}
            />
            <p style={{ fontSize: 12, color: "#7f8fa4", marginTop: 8 }}>
              Point camera at QR code. When scanned, the product number will auto-fill.
            </p>
          </div>
        )}

        {/* Scan result */}
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

      {/* Scanned Items */}
      <div className="card">
        <h3>Scanned Items</h3>
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
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#a0aec0" }}>No items scanned yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dispatch Summary */}
      <div className="card">
        <h3>Dispatch Summary</h3>
        <div className="dispatch-summary-bar">
          <span>Total Items: <strong>{totalItems}</strong></span>
          <span>Total Weight: <strong>{totalWeight.toFixed ? totalWeight.toFixed(2) : totalWeight} kg</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="btn-group" style={{ marginTop: 4 }}>
        <button
          className="btn btn-warning"
          onClick={handleRoughDispatch}
          disabled={loadedItems.length === 0}
        >
          Rough Dispatch (PDF)
        </button>
        <button
          className="btn btn-danger"
          onClick={handleFinalize}
          disabled={loadedItems.length === 0}
        >
          Finalize Dispatch
        </button>
      </div>
    </div>
  );
}

export default Dispatch;
