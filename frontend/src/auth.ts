import api, { setAuthToken } from "./api";

export async function login(username: string, password: string) {
  const { data } = await api.post("/api/auth/token/", { username, password });
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  setAuthToken(data.access);
}

export async function register(username: string, password: string) {
  await api.post("/api/auth/register/", { username, password });
  await login(username, password);
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  setAuthToken(null);
}

export function isAuthed() {
  return !!localStorage.getItem("access");
}
