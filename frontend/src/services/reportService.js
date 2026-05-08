import { fetchWithAuth } from "./api.js";

async function errorTextForUi(response) {
    const raw = await response.text();
    if (!raw?.trim()) {
        return `HTTP ${response.status}`;
    }
    try {
        const body = JSON.parse(raw);
        if (body && typeof body.message === "string" && body.message.trim()) {
            return body.message.trim();
        }
        if (body && typeof body.error === "string" && body.error.trim()) {
            return body.error.trim();
        }
    } catch {
        /* not JSON */
    }
    return raw.trim();
}

/**
 * @param {string} fromIso yyyy-MM-dd
 * @param {string} toIso yyyy-MM-dd
 * @param {boolean} warningFullMonthOfTo колона „Предупредување“ според доцнења во целиот месец на toIso
 * @returns {Promise<Array<{
 *   employeeId: number;
 *   fullName: string;
 *   department: string;
 *   presentDays: number;
 *   approvedLeaveDays: number;
 *   workedHoursFormatted: string;
 *   lateCount: number;
 *   warning: string;
 * }>>}
 */
export async function getEmployeeReportSummary(fromIso, toIso, warningFullMonthOfTo = false) {
    const params = new URLSearchParams({ from: fromIso, to: toIso });
    if (warningFullMonthOfTo) {
        params.set("warningFullMonthOfTo", "true");
    }
    const res = await fetchWithAuth(`/reports/employee-summary?${params}`);
    if (!res.ok) {
        throw new Error(await errorTextForUi(res));
    }
    return res.json();
}
