import { getToken } from "./authService";

const BASE_URL = "http://localhost:8080/api/leave-requests";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

// CREATE
export async function createLeaveRequest(data) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

// GET ALL
export async function getAllLeaveRequests() {
  const res = await fetch(BASE_URL, {
    headers: getHeaders()
  });
  return res.json();
}

// GET BY ID
export async function getLeaveRequestById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: getHeaders()
  });
  return res.json();
}

// GET BY EMPLOYEE
export async function getRequestsByEmployee(employeeId) {
  const res = await fetch(`${BASE_URL}/employee/${employeeId}`, {
    headers: getHeaders()
  });
  return res.json();
}

// GET FOR LOGGED IN EMPLOYEE
export async function getRequestsForLoggedInEmployee(employeeId) {
  const res = await fetch(`${BASE_URL}/employee/me`, {
    headers: getHeaders()
  });
  return res.json();
}

// GET BY STATUS
export async function getRequestsByStatus(status) {
  const res = await fetch(`${BASE_URL}/status/${status}`, {
    headers: getHeaders()
  });
  return res.json();
}

// GET BY DATE RANGE
export async function getRequestsByDateRange(startDate, endDate) {
  const params = new URLSearchParams({
    startDate,
    endDate
  });

  const res = await fetch(`${BASE_URL}/date-range?${params}`, {
    headers: getHeaders()
  });
  return res.json();
}

// UPDATE
export async function updateLeaveRequest(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

// APPROVE ( + опционален adminComment, макс. 500 на backend)
export async function approveLeaveRequest(id, adminComment) {
  const payload = {};
  if (adminComment != null && String(adminComment).trim() !== "") {
    payload.adminComment = String(adminComment).trim();
  }
  const res = await fetch(`${BASE_URL}/${id}/approve`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// REJECT ( + опционален adminComment)
export async function rejectLeaveRequest(id, adminComment) {
  const payload = {};
  if (adminComment != null && String(adminComment).trim() !== "") {
    payload.adminComment = String(adminComment).trim();
  }
  const res = await fetch(`${BASE_URL}/${id}/reject`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// CANCEL
export async function cancelLeaveRequest(id) {
  const res = await fetch(`${BASE_URL}/${id}/cancel`, {
    method: "PATCH",
    headers: getHeaders()
  });
  return res.json();
}

// DELETE
export async function deleteLeaveRequest(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  return res.text(); // usually delete returns empty
}
