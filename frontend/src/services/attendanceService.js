import { fetchWithAuth } from "./api";

/**
 * @param {number} [recentLimit=10]
 * @returns {Promise<{
 *   todayCheckIn: string | null;
 *   todayWorkedHours: string | null;
 *   monthLateTotal: string;
 *   recent: Array<{ date: string; checkIn: string; checkOut: string; status: string }>;
 * }>}
 */
export async function getMyDashboard(recentLimit = 10) {
  const res = await fetchWithAuth(`/attendance/me/dashboard?recentLimit=${recentLimit}`);
  if (res.status === 404) {
    const t = await res.text();
    throw new Error(t || "Нема поврзан запис за вработен.");
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}
