// Auth service — session-cookie login against the Spring Boot backend (§8).
// Login establishes the SESSION cookie; every later /api request sends it
// via credentials: "include" (see lib/api.js).
import { api, resetReferenceCache } from "@/lib/api";

export async function login(username, password) {
  const user = await api("/api/auth/login", { method: "POST", body: { username, password } });
  resetReferenceCache();
  return user; // { username }
}

export async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    resetReferenceCache();
  }
}

export async function me() {
  return api("/api/auth/me"); // 401 → ApiError
}
