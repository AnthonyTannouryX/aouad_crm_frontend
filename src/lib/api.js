// src/lib/api.js
import axios from "axios";
import { getToken, clearToken } from "./auth";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE,
});

// ✅ Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Optional: auto logout if token is invalid/expired
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken();
      // optional redirect:
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
