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

      <div className="card" style={{ maxWidth: 500 }}>
        <h3>Create New User</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>User Name</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              placeholder="Enter username"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="Enter password"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Admin">Admin</option>
              <option value="Sticker User">Sticker User</option>
              <option value="Dispatch User">Dispatch User</option>
            </select>
          </div>
          {message && <p style={{ color: "#27ae60", marginBottom: 8 }}>{message}</p>}
          {error && <p style={{ color: "#e74c3c", marginBottom: 8 }}>{error}</p>}
          <button className="btn btn-primary" type="submit">Sign Up</button>
        </form>
      </div>

      <div className="card">
        <h3>Existing Users</h3>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RegisterUser;
