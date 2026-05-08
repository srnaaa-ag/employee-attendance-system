import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getMyDashboard } from "../services/attendanceService.js";
import { useMatchMedia } from "../hooks/useMatchMedia.js";
import "./Dashboard.css";

const STATUS_MAP = {
  WORK: { type: "work", label: "На работа" },
  COMPLETED: { type: "completed", label: "Завршено" },
  LATE: { type: "late", label: "Доцнење" },
  ABSENT: { type: "absent", label: "Отсуство" },
  LEAVE: { type: "leave", label: "Одобрено отсуство" },
};

function StatusBadge({ statusKey }) {
  const meta = STATUS_MAP[statusKey] ?? STATUS_MAP.WORK;
  let cls = "dashboard__badge dashboard__badge--ok";
  if (meta.type === "late") cls = "dashboard__badge dashboard__badge--warn";
  else if (meta.type === "absent") cls = "dashboard__badge dashboard__badge--absent";
  else if (meta.type === "leave") cls = "dashboard__badge dashboard__badge--leave";
  return <span className={cls}>{meta.label}</span>;
}

function parseDashboardDate(dateStr) {
  if (!dateStr || dateStr === "—") return null;
  const [day, month, year] = dateStr.split(".");
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export default function Dashboard() {
  const compactFilters = useMatchMedia("(max-width: 768px)");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [todayIn, setTodayIn] = useState("—");
  const [todayHours, setTodayHours] = useState("—");
  const [monthLate, setMonthLate] = useState("0");
  const [recent, setRecent] = useState(/** @type {Array<{ date: string; checkIn: string; checkOut: string; status: string }>} */ ([]));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getMyDashboard(90);
      setTodayIn(d.todayCheckIn ?? "—");
      setTodayHours(d.todayWorkedHours ?? "—");
      setMonthLate(d.monthLateTotal ?? "0");
      setRecent(Array.isArray(d.recent) ? d.recent : []);
    } catch (e) {
      setError(e?.message || "Неуспешно вчитување.");
      setTodayIn("—");
      setTodayHours("—");
      setMonthLate("0");
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRecent = useMemo(() => {
    return recent.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) {
        return false;
      }

      const rowDate = parseDashboardDate(row.date);

      if (fromDate && (!rowDate || rowDate < fromDate)) {
        return false;
      }

      if (toDate && (!rowDate || rowDate > toDate)) {
        return false;
      }

      return true;
    });
  }, [recent, statusFilter, fromDate, toDate]);

  const filtersActive =
      statusFilter !== "ALL" || Boolean(fromDate) || Boolean(toDate);

  const filterControls = (
      <>
        <label className="dashboard__filter">
          <span>Статус</span>
          <select
              className="dashboard__filter-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Сите</option>
            <option value="WORK">На работа</option>
            <option value="COMPLETED">Завршено</option>
            <option value="LATE">Доцнење</option>
            <option value="LEAVE">Одобрено отсуство</option>
            <option value="ABSENT">Отсуство</option>
          </select>
        </label>
        <label className="dashboard__filter">
          <span>Од</span>
          <input
              className="dashboard__filter-control"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label className="dashboard__filter">
          <span>До</span>
          <input
              className="dashboard__filter-control"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
          />
        </label>
        <button
            type="button"
            className="dashboard__filter-reset"
            onClick={() => {
              setStatusFilter("ALL");
              setFromDate("");
              setToDate("");
            }}
        >
          Ресетирај
        </button>
      </>
  );

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
                <h3 className="dashboard__stat-label">Број на доцнења (месец)</h3>
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
            <p className="dashboard__scroll-hint" role="note">
              На мал екран лизни табелата лево или десно за да ја видиш колоната со
              статус.
            </p>
            {compactFilters ? (
                <details className="dashboard__filters-details">
                  <summary className="dashboard__filters-summary">
                    <span className="dashboard__filters-summary-label">
                      Филтри и датуми
                      {filtersActive ? (
                          <span
                              className="dashboard__filters-active-dot"
                              role="status"
                              aria-label="Има активни филтри"
                          />
                      ) : null}
                    </span>
                  </summary>
                  <div className="dashboard__filters dashboard__filters--in-details">
                    {filterControls}
                  </div>
                </details>
            ) : (
                <div className="dashboard__filters">{filterControls}</div>
            )}
            <div className="dashboard__table-scroll">
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
                  {filteredRecent.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="dashboard__table-empty">
                        Нема записи за избраните филтри.
                      </td>
                    </tr>
                  ) : (
                    filteredRecent.map((row, i) => (
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
    </div>
  );
}
