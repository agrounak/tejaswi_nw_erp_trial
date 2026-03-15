import React, { useState, useEffect } from "react";
import { getDashboardSummary } from "../services/api";

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboardSummary().then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  const { production, inventory_total, inventory, dispatch, status_distribution, top_gsm, top_colour } = data;

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

      {/* Production Today */}
      <h3 style={{ marginBottom: 12 }}>Production Today</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{production.rolls}</div>
          <div className="stat-label">Rolls Created</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{production.pattis}</div>
          <div className="stat-label">Pattis Created</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">{production.total_weight.toLocaleString()} kg</div>
          <div className="stat-label">Total Weight Produced</div>
        </div>
      </div>

      {/* Inventory Summary */}
      <h3 style={{ marginBottom: 12 }}>Inventory Summary</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{inventory_total.count}</div>
          <div className="stat-label">Total Rolls in Stock</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">{inventory_total.total_weight.toLocaleString()} kg</div>
          <div className="stat-label">Total Inventory Weight</div>
        </div>
        {top_gsm && (
          <div className="stat-card">
            <div className="stat-value">{top_gsm}</div>
            <div className="stat-label">Top GSM in Stock</div>
          </div>
        )}
        {top_colour && (
          <div className="stat-card">
            <div className="stat-value">{top_colour}</div>
            <div className="stat-label">Top Colour in Stock</div>
          </div>
        )}
      </div>

      {/* Dispatch Today */}
      <h3 style={{ marginBottom: 12 }}>Dispatch Today</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{dispatch.vehicles}</div>
          <div className="stat-label">Vehicles Dispatched</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{dispatch.total_items}</div>
          <div className="stat-label">Items Dispatched</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">{dispatch.total_weight.toLocaleString()} kg</div>
          <div className="stat-label">Weight Dispatched</div>
        </div>
      </div>

      {/* Inventory Breakdown */}
      {inventory.length > 0 && (
        <div className="card">
          <h3>Inventory Breakdown</h3>
          <table>
            <thead>
              <tr><th>Colour</th><th>GSM</th><th>Units</th><th>Total Weight</th></tr>
            </thead>
            <tbody>
              {inventory.map((item, i) => (
                <tr key={i}>
                  <td>{item.colour}</td>
                  <td>{item.gsm}</td>
                  <td>{item.count}</td>
                  <td><strong>{item.total_weight.toLocaleString()} kg</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Distribution */}
      {Object.keys(status_distribution).length > 0 && (
        <div className="card">
          <h3>Status Distribution</h3>
          <div className="stats-grid">
            {Object.entries(status_distribution).map(([status, count]) => (
              <div className="stat-card" key={status}>
                <div className="stat-value">{count}</div>
                <div className="stat-label">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
