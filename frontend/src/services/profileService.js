import { fetchWithAuth } from "./api";

export const getMyProfile = async () => {
    const response = await fetchWithAuth("/profile");
    return response.json();
};

export const updateMyProfile = async (data) => {
    const response = await fetchWithAuth("/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error("Update failed");
    }
    return response.json();
};