import axios from "axios";
import { getToken, clearToken } from "./auth";

export const api = axios.create({
baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) clearToken();
    return Promise.reject(err);
  }
);
console.log("API BASE", import.meta.env.VITE_API_BASE_URL);

