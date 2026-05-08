import { fetchWithAuth } from "./api";

async function parseErrorMessage(response) {
  const text = await response.text();

  if (!text) {
    return `HTTP ${response.status}`;
  }

  try {
    const body = JSON.parse(text);
    return body.message || body.error || text;
  } catch {
    return text;
  }
}

/**
 * Dashboard за најавениот employee.
 *
 * Очекува backend response:
 * {
 *   todayCheckIn,
 *   todayCheckOut,
 *   todayWorkedHours,
 *   monthLateTotal, // број на доцнења во месецот (стринг)
 *   attendanceState,
 *   nextAction,
 *   workStartTime,
 *   workEndTime,
 *   workScheduleLabel,
 *   recent
 * }
 */
export async function getMyDashboard(recentLimit = 10) {
  const response = await fetchWithAuth(
      `/attendance/me/dashboard?recentLimit=${recentLimit}`
  );

  if (response.status === 404) {
    throw new Error("Нема поврзан запис за вработен.");
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}


export async function checkIn(latitude, longitude) {
  const response = await fetchWithAuth("/attendance/check-in", {
    method: "POST",
    body: JSON.stringify({
      latitude,
      longitude,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}

export async function checkOut(latitude, longitude) {
  const response = await fetchWithAuth("/attendance/check-out", {
    method: "POST",
    body: JSON.stringify({
      latitude,
      longitude,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}