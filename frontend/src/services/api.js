import { getToken } from "./authService";

const BASE_URL = "http://localhost:8080/api";

function getHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
    };
}

async function parseAuthError(response) {
    const text = await response.text();
    if (!text?.trim()) {
        return `HTTP ${response.status}`;
    }
    try {
        const body = JSON.parse(text);
        return body.message || body.error || text;
    } catch {
        return text;
    }
}

export async function login(email, password) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error(await parseAuthError(response));
    }

    return response.json();
}

export async function verifyTwoFactor(pendingToken, code) {
    const response = await fetch(`${BASE_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code }),
    });

    if (!response.ok) {
        throw new Error(await parseAuthError(response));
    }

    return response.json();
}

export async function createEmployee(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create employee");

  return res.json();
}

export async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    return fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
}