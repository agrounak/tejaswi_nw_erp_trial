import React, { useState, useEffect, useCallback } from "react";
import { getDashboardSummary, getDashboardAnalytics } from "../services/api";

function Dashboard() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Analytics filters
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    date_from: thirtyDaysAgo,
    date_to: today,
    colour: "",
    quality: "",
    gsm: "",
    product_type: "",
  });
  const [filterOptions, setFilterOptions] = useState({ colours: [], qualities: [], gsm_values: [] });

  useEffect(() => {
    getDashboardSummary().then((r) => setData(r.data)).catch(console.error);
  }, []);

  const fetchAnalytics = useCallback(() => {
    const params = {};
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.colour) params.colour = filters.colour;
    if (filters.quality) params.quality = filters.quality;
    if (filters.gsm) params.gsm = filters.gsm;
    if (filters.product_type) params.product_type = filters.product_type;

    getDashboardAnalytics(params).then((r) => {
      setAnalytics(r.data);
      setFilterOptions(r.data.filters);
    }).catch(console.error);
  }, [filters]);

  useEffect(() => {
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#a0aec0" }}>Loading dashboard...</div>;

  const { production, inventory_total, inventory, dispatch, status_distribution, top_gsm, top_colour } = data;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Production Today */}
          <div className="card">
            <h3>Production Today</h3>
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
                <div className="stat-value">{production.total_weight.toLocaleString()}</div>
                <div className="stat-label">Total Weight (kg)</div>
              </div>
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="card">
            <h3>Inventory Summary</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{inventory_total.count}</div>
                <div className="stat-label">Total Rolls in Stock</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-value">{inventory_total.total_weight.toLocaleString()}</div>
                <div className="stat-label">Total Weight (kg)</div>
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
          </div>

          {/* Dispatch Today */}
          <div className="card">
            <h3>Dispatch Today</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{dispatch.vehicles}</div>
                <div className="stat-label">Vehicles</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dispatch.total_items}</div>
                <div className="stat-label">Items Dispatched</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-value">{dispatch.total_weight.toLocaleString()}</div>
                <div className="stat-label">Weight Dispatched (kg)</div>
              </div>
            </div>
          </div>

          {/* Inventory Breakdown */}
          {inventory.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 24px 0" }}>
                <h3 style={{ borderBottom: "none", paddingBottom: 0 }}>Inventory Breakdown</h3>
              </div>
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
        </>
      )}

      {activeTab === "analytics" && (
        <>
          {/* Filters */}
          <div className="card">
            <h3>Filters</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Date From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Date To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Colour</label>
                <select value={filters.colour} onChange={(e) => setFilters({ ...filters, colour: e.target.value })}>
                  <option value="">All Colours</option>
                  {filterOptions.colours.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quality</label>
                <select value={filters.quality} onChange={(e) => setFilters({ ...filters, quality: e.target.value })}>
                  <option value="">All Qualities</option>
                  {filterOptions.qualities.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>GSM</label>
                <select value={filters.gsm} onChange={(e) => setFilters({ ...filters, gsm: e.target.value })}>
                  <option value="">All GSM</option>
                  {filterOptions.gsm_values.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Product Type</label>
                <select value={filters.product_type} onChange={(e) => setFilters({ ...filters, product_type: e.target.value })}>
                  <option value="">All Types</option>
                  <option value="Roll">Roll</option>
                  <option value="Patti">Patti</option>
                </select>
              </div>
            </div>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={fetchAnalytics}>Apply Filters</button>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                setFilters({ date_from: thirtyDaysAgo, date_to: today, colour: "", quality: "", gsm: "", product_type: "" });
              }}>Reset</button>
            </div>
          </div>

          {analytics && (
            <>
              {/* Production Analytics */}
              <div className="card">
                <h3>Production Summary ({analytics.date_from} to {analytics.date_to})</h3>
                <div className="stats-grid">
                  <div className="stat-card highlight">
                    <div className="stat-value">{analytics.production.total_rolls}</div>
                    <div className="stat-label">Total Rolls</div>
                  </div>
                  <div className="stat-card highlight">
                    <div className="stat-value">{analytics.production.total_weight.toLocaleString()}</div>
                    <div className="stat-label">Total Weight (kg)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{analytics.dispatch.total_vehicles}</div>
                    <div className="stat-label">Dispatches</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{analytics.dispatch.total_weight.toLocaleString()}</div>
                    <div className="stat-label">Dispatched Weight (kg)</div>
                  </div>
                </div>
              </div>

              {/* Production by Colour */}
              {analytics.production.by_colour.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px 0" }}>
                    <h3 style={{ borderBottom: "none", paddingBottom: 0 }}>Production by Colour</h3>
                  </div>
                  <table>
                    <thead><tr><th>Colour</th><th>Rolls</th><th>Total Weight</th></tr></thead>
                    <tbody>
                      {analytics.production.by_colour.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.colour}</strong></td>
                          <td>{r.count}</td>
                          <td><strong>{r.total_weight.toLocaleString()} kg</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Production by Quality */}
              {analytics.production.by_quality.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px 0" }}>
                    <h3 style={{ borderBottom: "none", paddingBottom: 0 }}>Production by Quality</h3>
                  </div>
                  <table>
                    <thead><tr><th>Quality</th><th>Rolls</th><th>Total Weight</th></tr></thead>
                    <tbody>
                      {analytics.production.by_quality.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.quality}</strong></td>
                          <td>{r.count}</td>
                          <td><strong>{r.total_weight.toLocaleString()} kg</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Production by GSM */}
              {analytics.production.by_gsm.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px 0" }}>
                    <h3 style={{ borderBottom: "none", paddingBottom: 0 }}>Production by GSM</h3>
                  </div>
                  <table>
                    <thead><tr><th>GSM</th><th>Rolls</th><th>Total Weight</th></tr></thead>
                    <tbody>
                      {analytics.production.by_gsm.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.gsm}</strong></td>
                          <td>{r.count}</td>
                          <td><strong>{r.total_weight.toLocaleString()} kg</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Daily Production */}
              {analytics.production.daily.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px 0" }}>
                    <h3 style={{ borderBottom: "none", paddingBottom: 0 }}>Daily Production</h3>
                  </div>
                  <table>
                    <thead><tr><th>Date</th><th>Rolls</th><th>Total Weight</th></tr></thead>
                    <tbody>
                      {analytics.production.daily.map((r, i) => (
                        <tr key={i}>
                          <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                          <td>{r.count}</td>
                          <td><strong>{r.total_weight.toLocaleString()} kg</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Party-wise Dispatch Summary */}
              {analytics.dispatch.by_party.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px 0" }}>
                    <h3 style={{ borderBottom: "none", paddingBottom: 0 }}>Party-wise Dispatch Summary</h3>
                  </div>
                  <table>
                    <thead><tr><th>Party / Client</th><th>Dispatches</th><th>Items</th><th>Total Weight</th></tr></thead>
                    <tbody>
                      {analytics.dispatch.by_party.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.client_name}</strong></td>
                          <td>{r.dispatches}</td>
                          <td>{r.total_items}</td>
                          <td><strong>{r.total_weight.toLocaleString()} kg</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Daily Dispatch */}
              {analytics.dispatch.daily.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px 0" }}>
                    <h3 style={{ borderBottom: "none", paddingBottom: 0 }}>Daily Dispatch</h3>
                  </div>
                  <table>
                    <thead><tr><th>Date</th><th>Vehicles</th><th>Items</th><th>Total Weight</th></tr></thead>
                    <tbody>
                      {analytics.dispatch.daily.map((r, i) => (
                        <tr key={i}>
                          <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                          <td>{r.vehicles}</td>
                          <td>{r.total_items}</td>
                          <td><strong>{r.total_weight.toLocaleString()} kg</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
