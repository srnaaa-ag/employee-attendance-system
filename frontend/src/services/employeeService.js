import { getToken } from "./authService";

const EMPLOYEES_URL = "http://localhost:8080/api/employees";
const AUTH_URL = "http://localhost:8080/api/auth";

function getHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(response) {
  const text = await response.text();

  if (!text) {
    return `HTTP ${response.status}`;
  }

  try {
    const body = JSON.parse(text);
    return body.message || body.error || text;
  } catch {
    return text;
  }
}

// GET all employees - ADMIN / SUPER_ADMIN
export async function getAllEmployees() {
  const res = await fetch(EMPLOYEES_URL, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

// GET one employee
export async function getEmployeeById(id) {
  const res = await fetch(`${EMPLOYEES_URL}/${id}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

// REGISTER new employee - creates both User and Employee
export async function registerEmployee(data) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

// UPDATE employee - also supports user.profilePicture for face recognition
export async function updateEmployee(id, data) {
  const res = await fetch(`${EMPLOYEES_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

// DELETE employee
export async function deleteEmployee(id) {
  const res = await fetch(`${EMPLOYEES_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}