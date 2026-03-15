import React, { useState, useEffect } from "react";
import { listDispatches, scanLoad } from "../services/api";

function Loading() {
  const [dispatches, setDispatches] = useState([]);
  const [selectedDispatch, setSelectedDispatch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loadedItems, setLoadedItems] = useState([]);

  useEffect(() => {
    listDispatches({ status: "Loading" })
      .then((r) => setDispatches(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDispatch) {
      const d = dispatches.find((d) => d.id === parseInt(selectedDispatch));
      if (d) setLoadedItems(d.items);
    }
  }, [selectedDispatch, dispatches]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!selectedDispatch || !scanInput) return;

    try {
      const res = await scanLoad(selectedDispatch, { product_number: scanInput });
      setScanResult({ success: true, message: res.data.message, product: res.data.product });
      setLoadedItems(res.data.dispatch.items);
      setScanInput("");

      // Refresh dispatches
      listDispatches({ status: "Loading" }).then((r) => setDispatches(r.data));
    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.error || "Scan failed",
      });
    }
  };

  const currentDispatch = dispatches.find((d) => d.id === parseInt(selectedDispatch));

  return (
    <div>
      <div className="page-header"><h1>Loading Scanner</h1></div>

      {/* Select Dispatch */}
      <div className="card">
        <h3>Select Active Dispatch</h3>
        <select
          value={selectedDispatch}
          onChange={(e) => { setSelectedDispatch(e.target.value); setScanResult(null); }}
          style={{ padding: 10, fontSize: 16, width: "100%" }}
        >
          <option value="">Select dispatch...</option>
          {dispatches.map((d) => (
            <option key={d.id} value={d.id}>
              {d.dispatch_number} — {d.client_name} — {d.vehicle_number}
            </option>
          ))}
        </select>
      </div>

      {/* Scanner */}
      {selectedDispatch && (
        <div className="card">
          <h3>Scan QR Code</h3>
          <div className="scan-area">
            <form onSubmit={handleScan}>
              <input
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
                    {scanResult.product.gsm} GSM | {scanResult.product.colour} | {scanResult.product.weight} kg
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loaded Items */}
      {currentDispatch && (
        <div className="card">
          <h3>Loaded on {currentDispatch.vehicle_number}</h3>
          <p>Client: <strong>{currentDispatch.client_name}</strong> | Total: <strong>{currentDispatch.total_weight} kg</strong></p>
          <table>
            <thead>
              <tr><th>#</th><th>Product ID</th><th>Weight</th><th>Scanned At</th></tr>
            </thead>
            <tbody>
              {loadedItems.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td><strong>{item.product_number}</strong></td>
                  <td>{item.weight} kg</td>
                  <td>{new Date(item.scanned_at).toLocaleTimeString()}</td>
                </tr>
              ))}
              {loadedItems.length === 0 && <tr><td colSpan={4}>No items loaded yet. Start scanning!</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Loading;
