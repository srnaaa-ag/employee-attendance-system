const TOKEN_KEY = "attendance_token";
const ROLE_KEY = "attendance_role";

/** @typedef {"admin" | "employee"} UserRole */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/** @returns {UserRole | null} */
export function getRole() {
  const r = localStorage.getItem(ROLE_KEY);
  if (r === "admin" || r === "employee") return r;
  return null;
}

/** @param {UserRole | null} role */
export function setRole(role) {
  if (role === "admin" || role === "employee") localStorage.setItem(ROLE_KEY, role);
  else localStorage.removeItem(ROLE_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}
