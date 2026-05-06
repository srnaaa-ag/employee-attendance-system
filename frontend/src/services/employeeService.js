import { getToken } from "./authService";

const BASE_URL = "http://localhost:8080/api/employees";

function getHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
    };
}

// GET all employees (ADMIN / SUPER_ADMIN)
export async function getAllEmployees() {
  const res = await fetch(BASE_URL, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch employees");
  }

  return res.json();
}

// GET one employee
export async function getEmployeeById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch employee");

  return res.json();
}

// CREATE employee
export async function createEmployee(data) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create employee");

  return res.json();
}

// UPDATE employee
export async function updateEmployee(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update employee");

  return res.json();
}

// DELETE employee
export async function deleteEmployee(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Failed to delete employee");
}
