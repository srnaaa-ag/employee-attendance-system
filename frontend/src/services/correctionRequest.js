import { getToken } from "./authService";

const BASE_URL = "http://localhost:8080/api/correction-requests";

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

export async function createCorrectionRequest(data) {
    return requestJson(BASE_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
}

export async function getMyCorrectionRequests() {
    return requestJson(`${BASE_URL}/employee/me`, {
        headers: getHeaders()
    });
}

export async function getAllCorrectionRequests() {
    return requestJson(BASE_URL, {
        headers: getHeaders()
    });
}

export async function approveCorrectionRequest(id, adminComment) {
    const payload = {};
    if (adminComment != null && String(adminComment).trim() !== "") {
        payload.adminComment = String(adminComment).trim();
    }
    return requestJson(`${BASE_URL}/${id}/approve`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
}

export async function rejectCorrectionRequest(id, adminComment) {
    const payload = {};
    if (adminComment != null && String(adminComment).trim() !== "") {
        payload.adminComment = String(adminComment).trim();
    }
    return requestJson(`${BASE_URL}/${id}/reject`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
}

export async function cancelCorrectionRequest(id) {
    return requestJson(`${BASE_URL}/${id}/cancel`, {
        method: "PATCH",
        headers: getHeaders()
    });
}