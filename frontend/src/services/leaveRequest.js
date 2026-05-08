import { getToken } from "./authService";

const BASE_URL = "http://localhost:8080/api/leave-requests";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

async function parseErrorMessage(res) {
  const text = await res.text();

  if (!text) {
    return `HTTP ${res.status}`;
  }

  try {
    const body = JSON.parse(text);
    return body.message || body.error || text;
  } catch {
    return text;
  }
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  return res.json();
}

async function requestText(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  return res.text();
}

// CREATE
export async function createLeaveRequest(data) {
  return requestJson(BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
}

// GET ALL
export async function getAllLeaveRequests() {
  return requestJson(BASE_URL, {
    headers: getHeaders()
  });
}

// GET BY ID
export async function getLeaveRequestById(id) {
  return requestJson(`${BASE_URL}/${id}`, {
    headers: getHeaders()
  });
}

// GET BY EMPLOYEE
export async function getRequestsByEmployee(employeeId) {
  return requestJson(`${BASE_URL}/employee/${employeeId}`, {
    headers: getHeaders()
  });
}

// GET FOR LOGGED IN EMPLOYEE
export async function getRequestsForLoggedInEmployee() {
  return requestJson(`${BASE_URL}/employee/me`, {
    headers: getHeaders()
  });
}

// GET BY STATUS
export async function getRequestsByStatus(status) {
  return requestJson(`${BASE_URL}/status/${status}`, {
    headers: getHeaders()
  });
}

// GET BY DATE RANGE
export async function getRequestsByDateRange(startDate, endDate) {
  const params = new URLSearchParams({
    startDate,
    endDate
  });

  return requestJson(`${BASE_URL}/date-range?${params}`, {
    headers: getHeaders()
  });
}

// UPDATE
export async function updateLeaveRequest(id, data) {
  return requestJson(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
}

// APPROVE ( + опционален adminComment, макс. 500 на backend)
export async function approveLeaveRequest(id, adminComment) {
  const payload = {};
  if (adminComment != null && String(adminComment).trim() !== "") {
    payload.adminComment = String(adminComment).trim();
  }
  return requestJson(`${BASE_URL}/${id}/approve`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
}

// REJECT ( + опционален adminComment)
export async function rejectLeaveRequest(id, adminComment) {
  const payload = {};
  if (adminComment != null && String(adminComment).trim() !== "") {
    payload.adminComment = String(adminComment).trim();
  }
  return requestJson(`${BASE_URL}/${id}/reject`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
}

// CANCEL
export async function cancelLeaveRequest(id) {
  return requestJson(`${BASE_URL}/${id}/cancel`, {
    method: "PATCH",
    headers: getHeaders()
  });
}

// DELETE
export async function deleteLeaveRequest(id) {
  return requestText(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  });
}
