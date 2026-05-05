import { getToken } from "./authService";

const BASE_URL = "http://localhost:8080/api/correction-requests";

function getHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
    };
}

export async function createCorrectionRequest(data) {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function getMyCorrectionRequests() {
    const res = await fetch(`${BASE_URL}/employee/me`, {
        headers: getHeaders()
    });
    return res.json();
}

export async function getAllCorrectionRequests() {
    const res = await fetch(BASE_URL, {
        headers: getHeaders()
    });
    return res.json();
}

export async function approveCorrectionRequest(id, adminComment) {
    const payload = {};
    if (adminComment != null && String(adminComment).trim() !== "") {
        payload.adminComment = String(adminComment).trim();
    }
    const res = await fetch(`${BASE_URL}/${id}/approve`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return res.json();
}

export async function rejectCorrectionRequest(id, adminComment) {
    const payload = {};
    if (adminComment != null && String(adminComment).trim() !== "") {
        payload.adminComment = String(adminComment).trim();
    }
    const res = await fetch(`${BASE_URL}/${id}/reject`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return res.json();
}

export async function cancelCorrectionRequest(id) {
    const res = await fetch(`${BASE_URL}/${id}/cancel`, {
        method: "PATCH",
        headers: getHeaders()
    });
    return res.json();
}