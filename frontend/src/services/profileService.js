import { fetchWithAuth } from "./api";

async function parseErrorMessage(response) {
    const text = await response.text();
    if (!text) return `HTTP ${response.status}`;
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

export const getMyProfile = async () => {
    const response = await fetchWithAuth("/profile");
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
    const data = await response.json();
    if (data == null) {
        throw new Error("Нема запис за вработен за овој корисник.");
    }
    return data;
};

export const updateMyProfile = async (data) => {
    const response = await fetchWithAuth("/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
    return response.json();
};