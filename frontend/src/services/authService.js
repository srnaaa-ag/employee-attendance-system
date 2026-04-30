const TOKEN_KEY = "attendance_token";
const ROLE_KEY = "attendance_role";
const NAME_KEY = "attendance_name";

/** @typedef {"SUPER_ADMIN" | "ADMIN" | "EMPLOYEE"} UserRole */

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
  if (r === "SUPER_ADMIN" || r === "ADMIN" || r === "EMPLOYEE") return r;
  return null;
}

/** @param {UserRole | null} role */
export function setRole(role) {
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "EMPLOYEE") {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }
}

export function getName() {
  return localStorage.getItem(NAME_KEY);
}

export function setName(name) {
  if (name && name.trim().length > 0) {
    localStorage.setItem(NAME_KEY, name);
  } else {
    localStorage.removeItem(NAME_KEY);
  }
}

export function isAdmin() {
  const role = getRole();
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin() {
  return getRole() === "SUPER_ADMIN";
}

export function isEmployee() {
  return getRole() === "EMPLOYEE";
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
}