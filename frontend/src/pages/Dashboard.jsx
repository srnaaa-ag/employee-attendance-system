import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getMyDashboard } from "../services/attendanceService.js";
import "./Dashboard.css";

const STATUS_MAP = {
  WORK: { type: "work", label: "На работа" },
  LATE: { type: "late", label: "Доцнење" },
  ABSENT: { type: "absent", label: "Отсуство" },
};

function StatusBadge({ statusKey }) {
  const meta = STATUS_MAP[statusKey] ?? STATUS_MAP.WORK;
  const cls =
    meta.type === "work"
      ? "dashboard__badge dashboard__badge--ok"
      : meta.type === "late"
        ? "dashboard__badge dashboard__badge--warn"
        : "dashboard__badge dashboard__badge--absent";
  return <span className={cls}>{meta.label}</span>;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [todayIn, setTodayIn] = useState("—");
  const [todayHours, setTodayHours] = useState("—");
  const [monthLate, setMonthLate] = useState("00:00");
  const [recent, setRecent] = useState(/** @type {Array<{ date: string; checkIn: string; checkOut: string; status: string }>} */ ([]));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getMyDashboard(12);
      setTodayIn(d.todayCheckIn ?? "—");
      setTodayHours(d.todayWorkedHours ?? "—");
      setMonthLate(d.monthLateTotal ?? "00:00");
      setRecent(Array.isArray(d.recent) ? d.recent : []);
    } catch (e) {
      setError(e?.message || "Неуспешно вчитување.");
      setTodayIn("—");
      setTodayHours("—");
      setMonthLate("00:00");
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="dashboard">
      <div className="dashboard__card">
        <h2 className="dashboard__titlebar">Контролна табла</h2>

        <div className="dashboard__body">
          {error ? <p className="dashboard__error">{error}</p> : null}
          {loading ? <p className="dashboard__loading">Се вчитуваат податоци…</p> : null}

          <div className="dashboard__top">
            <div className="dashboard__stats">
              <article className="dashboard__stat">
                <h3 className="dashboard__stat-label">Денес - доаѓање</h3>
                <p className="dashboard__stat-value">{todayIn}</p>
              </article>
              <article className="dashboard__stat">
                <h3 className="dashboard__stat-label">Работни часови (денес)</h3>
                <p className="dashboard__stat-value">{todayHours}</p>
              </article>
              <article className="dashboard__stat">
                <h3 className="dashboard__stat-label">Доцнења (месец)</h3>
                <p className="dashboard__stat-value">{monthLate}</p>
              </article>
            </div>

            <div className="dashboard__actions">
              <Link to="/attendance" className="dashboard__btn dashboard__btn--primary">
                Евиденција (check-in/out)
              </Link>
              <Link to="/leave-requests" className="dashboard__btn dashboard__btn--outline">
                Ново барање за отсуство
              </Link>
            </div>
          </div>

          <div className="dashboard__table-block">
            <h3 className="dashboard__table-title">Последни записи за присуство</h3>
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Датум</th>
                  <th>Доаѓање</th>
                  <th>Заминување</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="dashboard__table-empty">
                      Нема евидентирани записи.
                    </td>
                  </tr>
                ) : (
                  recent.map((row, i) => (
                    <tr key={`${row.date}-${row.checkIn}-${i}`}>
                      <td>{row.date}</td>
                      <td>{row.checkIn}</td>
                      <td>{row.checkOut}</td>
                      <td>
                        <StatusBadge statusKey={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
