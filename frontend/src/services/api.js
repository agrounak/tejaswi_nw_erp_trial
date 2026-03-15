import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE });

// ── Auth ──
export const login = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const listUsers = () => api.get("/auth/users");
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);

// ── Production / Sticker Generator ──
export const createProduct = (data) => api.post("/production/entry", data);
export const listProducts = (params) => api.get("/production/products", { params });
export const getProduct = (id) => api.get(`/production/products/${id}`);
export const updateProduct = (id, data) => api.put(`/production/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/production/products/${id}`);
export const scanProduct = (productNumber) => api.get(`/production/scan/${productNumber}`);

// ── Inventory ──
export const receiveToWarehouse = (data) => api.post("/inventory/receive", data);
export const getStock = (params) => api.get("/inventory/stock", { params });
export const getInventorySummary = () => api.get("/inventory/summary");
export const getWarehouseLocations = () => api.get("/inventory/locations");
export const exportInventory = () => `${API_BASE}/inventory/export`;

// ── Orders ──
export const createOrder = (data) => api.post("/orders/", data);
export const listOrders = (params) => api.get("/orders/", { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const allocateOrder = (id) => api.post(`/orders/${id}/allocate`);

// ── Dispatch ──
export const createDispatch = (data) => api.post("/dispatch/create", data);
export const scanLoad = (dispatchId, data) => api.post(`/dispatch/${dispatchId}/scan`, data);
export const removeDispatchItem = (dispatchId, itemId) => api.delete(`/dispatch/${dispatchId}/remove/${itemId}`);
export const finalizeDispatch = (id) => api.post(`/dispatch/${id}/finalize`);
export const listDispatches = (params) => api.get("/dispatch/", { params });
export const getDispatchHistory = () => api.get("/dispatch/history");
export const getDispatch = (id) => api.get(`/dispatch/${id}`);
export const getDispatchSheet = (id) => api.get(`/dispatch/${id}/sheet`);

// ── Sticker ──
export const getStickerUrl = (productId) => `${API_BASE}/sticker/${productId}`;
export const getStickerPreviewUrl = (productId) => `${API_BASE}/sticker/${productId}/preview`;

// ── Dashboard ──
export const getDashboardSummary = () => api.get("/dashboard/summary");

// ── Admin Config ──
export const getConfigs = (type) => api.get("/config/", { params: type ? { type } : {} });
export const addConfig = (data) => api.post("/config/", data);
export const deleteConfig = (id) => api.delete(`/config/${id}`);
export const seedConfigs = () => api.post("/config/seed");

export default api;
