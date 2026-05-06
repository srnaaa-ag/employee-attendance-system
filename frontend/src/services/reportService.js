import { fetchWithAuth } from "./api.js";

/**
 * @param {string} fromIso yyyy-MM-dd
 * @param {string} toIso yyyy-MM-dd
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
export async function getEmployeeReportSummary(fromIso, toIso) {
    const params = new URLSearchParams({ from: fromIso, to: toIso });
    const res = await fetchWithAuth(`/reports/employee-summary?${params}`);
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
    }
    return res.json();
}
