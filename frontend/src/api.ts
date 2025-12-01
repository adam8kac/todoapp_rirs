import axios, { AxiosError, AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE || "http://localhost:8000",
});

// --- helper za nastavit/počistit Authorization header ---
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// ob zagonu preberi access iz localStorage (če obstaja)
setAuthToken(localStorage.getItem("access"));

// request interceptor (varovalka, če je kdo pobrisal defaults)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- auto-refresh access tokena na 401 ---
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => queue.push(resolve));
  }
  isRefreshing = true;
  try {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) throw new Error("no refresh token");

    const { data } = await axios.post(
      ((import.meta as any).env.VITE_API_BASE || "http://localhost:8000") + "/api/auth/refresh/",
      { refresh }
    );
    const newAccess = data.access as string;
    localStorage.setItem("access", newAccess);
    setAuthToken(newAccess);
    queue.forEach((res) => res(newAccess));
    queue = [];
    return newAccess;
  } catch (e) {
    queue.forEach((res) => res(null));
    queue = [];
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAuthToken(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean });
    const status = error.response?.status;

    // samo za 401 in samo en retry
    if (status === 401 && !original?._retry) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = original.headers || {};
        (original.headers as any).Authorization = `Bearer ${token}`;
        return api(original); // retry original request
      }
    }
    return Promise.reject(error);
  }
);

export default api;
