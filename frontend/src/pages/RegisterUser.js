import React, { useState, useEffect } from "react";
import { register, listUsers, deleteUser } from "../services/api";

function RegisterUser() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "Sticker User" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = () => {
    listUsers().then((r) => setUsers(r.data)).catch(console.error);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await register(form);
      setMessage(`User "${form.username}" created successfully`);
      setForm({ username: "", password: "", role: "Sticker User" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"?`)) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Register User</h1></div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h3>Create New User</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>User Name</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              placeholder="Enter username"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="Enter password"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Admin">Admin</option>
              <option value="Sticker User">Sticker User</option>
              <option value="Dispatch User">Dispatch User</option>
            </select>
          </div>
          {message && <div className="scan-result scan-success" style={{ marginBottom: 12 }}>{message}</div>}
          {error && <div className="scan-result scan-error" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" type="submit">Sign Up</button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px 0" }}>
          <h3 style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>Existing Users</h3>
        </div>
        <table>
          <thead>
            <tr><th>Username</th><th>Role</th><th>Created</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td><span className="badge badge-warehouse">{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                <td>
                  <button className="btn btn-danger btn-xs" onClick={() => handleDelete(u.id, u.username)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "#a0aec0" }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RegisterUser;
