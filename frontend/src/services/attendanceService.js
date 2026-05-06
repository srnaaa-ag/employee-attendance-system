const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function fetchAttendanceSummary() {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/attendance/summary`);
  if (!res.ok) throw new Error("Failed to load attendance summary");
  return res.json();
}
