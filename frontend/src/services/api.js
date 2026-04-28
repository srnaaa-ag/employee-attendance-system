import { getToken } from "./authService";

const BASE_URL = "http://localhost:8080/api";

export async function login(email, password) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error("Invalid credentials");
    }

    return response.json();
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