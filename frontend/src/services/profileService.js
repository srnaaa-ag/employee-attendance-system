import { fetchWithAuth } from "./api";

let cachedProfile = null;
let cachedProfilePromise = null;

async function parseErrorMessage(response) {
    const text = await response.text();

    if (!text) {
        return `HTTP ${response.status}`;
    }

    try {
        const body = JSON.parse(text);

        return (
            body.message ||
            body.error ||
            (Array.isArray(body.errors) ? body.errors.join(", ") : null) ||
            text
        );
    } catch {
        return text;
    }
}

export const getMyProfile = async (forceRefresh = false) => {
    if (!forceRefresh && cachedProfile) {
        return cachedProfile;
    }

    if (!forceRefresh && cachedProfilePromise) {
        return cachedProfilePromise;
    }

    cachedProfilePromise = (async () => {
        const response = await fetchWithAuth("/profile");

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        const data = await response.json();

        if (data == null) {
            throw new Error("Нема запис за вработен за овој корисник.");
        }

        cachedProfile = data;
        return data;
    })();

    try {
        return await cachedProfilePromise;
    } finally {
        cachedProfilePromise = null;
    }
};

export const updateMyProfile = async (data) => {
    const response = await fetchWithAuth("/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }

    const updated = await response.json();

    cachedProfile = updated;

    return updated;
};

export const clearProfileCache = () => {
    cachedProfile = null;
    cachedProfilePromise = null;
};