import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4001";

export const axiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// Request interceptor — attach the bypass token so API accepts requests
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — personal mode: no refresh, no redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
