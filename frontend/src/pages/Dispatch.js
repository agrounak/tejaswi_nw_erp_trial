import React, { useState, useEffect, useRef } from "react";
import { createDispatch, scanLoad, removeDispatchItem, finalizeDispatch, listDispatches } from "../services/api";

function Dispatch() {
  const [clientName, setClientName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [activeDispatch, setActiveDispatch] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loadedItems, setLoadedItems] = useState([]);
  const [error, setError] = useState("");
  const scanRef = useRef(null);

  // Load any existing Loading dispatch
  useEffect(() => {
    listDispatches({ status: "Loading" }).then((r) => {
      if (r.data.length > 0) {
        const d = r.data[0];
        setActiveDispatch(d);
        setLoadedItems(d.items);
        setClientName(d.client_name);
        setVehicleNumber(d.vehicle_number);
        setDriverPhone(d.driver_phone || "");
      }
    }).catch(console.error);
  }, []);

  const handleStartDispatch = async (e) => {
    e.preventDefault();
    setError("");
    if (!clientName || !vehicleNumber) {
      setError("Client name and vehicle number are required");
      return;
    }
    try {
      const res = await createDispatch({
        client_name: clientName,
        vehicle_number: vehicleNumber,
        driver_phone: driverPhone,
      });
      setActiveDispatch(res.data.dispatch);
      setLoadedItems([]);
      setTimeout(() => scanRef.current?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create dispatch");
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!activeDispatch || !scanInput.trim()) return;
    setScanResult(null);

    try {
      const res = await scanLoad(activeDispatch.id, { product_number: scanInput.trim() });
      setScanResult({ success: true, message: res.data.message, product: res.data.product });
      setLoadedItems(res.data.dispatch.items);
      setActiveDispatch(res.data.dispatch);
      setScanInput("");
    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.error || "Scan failed",
      });
      setScanInput("");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await removeDispatchItem(activeDispatch.id, itemId);
      setLoadedItems(res.data.dispatch.items);
      setActiveDispatch(res.data.dispatch);
    } catch (err) {
      alert(err.response?.data?.error || "Remove failed");
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Finalize this dispatch? Products will be marked as DISPATCHED.")) return;
    try {
      const res = await finalizeDispatch(activeDispatch.id);
      setActiveDispatch(null);
      setLoadedItems([]);
      setClientName("");
      setVehicleNumber("");
      setDriverPhone("");
      setScanResult(null);
      alert(`Dispatch ${res.data.dispatch.dispatch_number} finalized!`);
    } catch (err) {
      alert(err.response?.data?.error || "Finalize failed");
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Dispatch</h1></div>

      {/* Start Dispatch Form */}
      {!activeDispatch && (
        <div className="card">
          <h3>Start New Dispatch</h3>
          <form onSubmit={handleStartDispatch}>
            <div className="form-grid">
              <div className="form-group">
                <label>Client Name</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Shyam Traders" />
              </div>
              <div className="form-group">
                <label>Vehicle Number</label>
                <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required placeholder="e.g. BR09AB1234" />
              </div>
              <div className="form-group">
                <label>Driver Contact Number</label>
                <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="e.g. 9876543210" />
              </div>
            </div>
            {error && <p style={{ color: "#e74c3c", marginTop: 8 }}>{error}</p>}
            <button className="btn btn-primary" type="submit" style={{ marginTop: 14 }}>Start Dispatch</button>
          </form>
        </div>
      )}

      {/* Active Dispatch */}
      {activeDispatch && (
        <>
          <div className="card">
            <h3>Active Dispatch — {activeDispatch.dispatch_number}</h3>
            <div className="dispatch-summary">
              <span>Client: <strong>{activeDispatch.client_name}</strong></span>
              <span>Vehicle: <strong>{activeDispatch.vehicle_number}</strong></span>
              {activeDispatch.driver_phone && <span>Driver: <strong>{activeDispatch.driver_phone}</strong></span>}
            </div>
          </div>

          {/* QR Scanner */}
          <div className="card">
            <h3>Scan QR Code</h3>
            <div className="scan-area">
              <form onSubmit={handleScan}>
                <input
                  ref={scanRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan or type Product ID..."
                  autoFocus
                />
                <br /><br />
                <button className="btn btn-success" type="submit">Verify & Load</button>
              </form>
              {scanResult && (
                <div className={`scan-result ${scanResult.success ? "scan-success" : "scan-error"}`}>
                  <strong>{scanResult.success ? "VALID" : "INVALID"}</strong> — {scanResult.message}
                  {scanResult.product && (
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      {scanResult.product.product_number} | {scanResult.product.product_type} |
                      {scanResult.product.gsm} GSM | {scanResult.product.colour} | {scanResult.product.net_weight} kg
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Loaded Items */}
          <div className="card">
            <h3>Scanned Items</h3>
            <div className="dispatch-summary">
              <span>Items: <strong>{activeDispatch.total_items || loadedItems.length}</strong></span>
              <span>Total Weight: <strong>{activeDispatch.total_weight || 0} kg</strong></span>
            </div>
            <table>
              <thead>
                <tr><th>#</th><th>Product No</th><th>Color</th><th>Quality</th><th>Weight</th><th>Action</th></tr>
              </thead>
              <tbody>
                {loadedItems.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td><strong>{item.product_number}</strong></td>
                    <td>{item.colour}</td>
                    <td>{item.quality}</td>
                    <td>{item.weight} kg</td>
                    <td>
                      <button className="btn btn-danger btn-xs" onClick={() => handleRemoveItem(item.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {loadedItems.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 16 }}>No items scanned yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="btn-group">
            <button className="btn btn-success" onClick={handleFinalize} disabled={loadedItems.length === 0}>
              Finalize Dispatch
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Dispatch;
