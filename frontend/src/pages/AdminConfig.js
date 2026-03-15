import React, { useState, useEffect, useCallback } from "react";
import { getConfigs, addConfig, deleteConfig, seedConfigs } from "../services/api";

const CONFIG_TYPES = [
  { value: "quality", label: "Quality" },
  { value: "colour", label: "Colour" },
  { value: "product_type", label: "Product Type" },
  { value: "location", label: "Storage Location" },
];

function AdminConfig() {
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({ config_type: "quality", value: "", is_white: false });
  const [error, setError] = useState("");

  const fetchConfigs = useCallback(() => {
    getConfigs().then((r) => setConfigs(r.data)).catch(console.error);
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const grouped = {};
  CONFIG_TYPES.forEach((t) => { grouped[t.value] = []; });
  configs.forEach((c) => {
    if (grouped[c.config_type]) grouped[c.config_type].push(c);
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.value.trim()) return;
    try {
      await addConfig(form);
      setForm({ ...form, value: "", is_white: false });
      fetchConfigs();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteConfig(id);
      fetchConfigs();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seedConfigs();
      fetchConfigs();
    } catch (err) {
      alert(err.response?.data?.message || "Seed failed");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Admin Config</h1>
        {configs.length === 0 && (
          <button className="btn btn-warning btn-sm" onClick={handleSeedDefaults}>
            Seed Default Options
          </button>
        )}
      </div>

      {/* Add New */}
      <div className="card">
        <h3>Add New Field</h3>
        <form onSubmit={handleAdd}>
          <div className="dispatch-form-row" style={{ alignItems: "flex-end" }}>
            <div className="form-group">
              <label>Select Type</label>
              <select
                value={form.config_type}
                onChange={(e) => setForm({ ...form, config_type: e.target.value })}
              >
                {CONFIG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Enter Name</label>
              <input
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="Enter name"
                required
              />
            </div>
            {form.config_type === "colour" && (
              <div className="form-group">
                <label>Is White?</label>
                <div className="checkbox-group" style={{ paddingTop: 6 }}>
                  <input
                    type="checkbox"
                    checked={form.is_white}
                    onChange={(e) => setForm({ ...form, is_white: e.target.checked })}
                  />
                  <span style={{ fontSize: 13 }}>Yes (billing flag)</span>
                </div>
              </div>
            )}
            <div className="form-group" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit">Add</button>
            </div>
          </div>
          {error && <p style={{ color: "#e74c3c", marginTop: 10, fontSize: 13 }}>{error}</p>}
        </form>
      </div>

      {/* Config Sections */}
      {CONFIG_TYPES.map((type) => (
        <div className="card config-section" key={type.value}>
          <h3>{type.label}</h3>
          <div className="config-list">
            {grouped[type.value].map((c) => (
              <div className="config-item" key={c.id}>
                <span>{c.value}</span>
                {type.value === "colour" && c.is_white && (
                  <span style={{ fontSize: 10, color: "#a0aec0", fontStyle: "italic" }}>(white)</span>
                )}
                <button className="delete-btn" onClick={() => handleDelete(c.id)} title="Delete">
                  {"\u00D7"}
                </button>
              </div>
            ))}
            {grouped[type.value].length === 0 && (
              <span style={{ color: "#a0aec0", fontSize: 13 }}>No options configured</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminConfig;
