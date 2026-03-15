import React, { useEffect, useState } from "react";
import { getDashboardSummary } from "../services/api";

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboardSummary().then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  const { production, inventory, dispatch, status_distribution } = data;

  return (
    <div>
      <div className="page-header"><h1>Factory Dashboard</h1></div>

      {/* Production Today */}
      <h3 style={{ marginBottom: 12 }}>Production Today</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{production.rolls}</div>
          <div className="stat-label">Rolls</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{production.pattis}</div>
          <div className="stat-label">Pattis</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{production.total_weight.toLocaleString()} kg</div>
          <div className="stat-label">Total Weight</div>
        </div>
      </div>

      {/* Dispatch Today */}
      <h3 style={{ marginBottom: 12 }}>Dispatch Today</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{dispatch.vehicles}</div>
          <div className="stat-label">Vehicles</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{dispatch.total_weight.toLocaleString()} kg</div>
          <div className="stat-label">Dispatched Weight</div>
        </div>
      </div>

      {/* Inventory */}
      <div className="card">
        <h3>Current Inventory (In Warehouse)</h3>
        <table>
          <thead>
            <tr><th>Colour</th><th>GSM</th><th>Units</th><th>Total Weight</th></tr>
          </thead>
          <tbody>
            {inventory.map((row, i) => (
              <tr key={i}>
                <td>{row.colour}</td>
                <td>{row.gsm}</td>
                <td>{row.count}</td>
                <td className="weight-highlight">{row.total_weight.toLocaleString()} kg</td>
              </tr>
            ))}
            {inventory.length === 0 && <tr><td colSpan={4}>No stock in warehouse</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Status Distribution */}
      <div className="card">
        <h3>Product Status Distribution</h3>
        <div className="stats-grid">
          {Object.entries(status_distribution).map(([status, count]) => (
            <div className="stat-card" key={status}>
              <div className="stat-value">{count}</div>
              <div className="stat-label">{status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
