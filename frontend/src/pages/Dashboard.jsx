import { Link } from "react-router-dom";
import "./Dashboard.css";

const recentRows = [
  { date: "28.03.2026", arrival: "08:00", departure: "—", status: "work", label: "На работа" },
  { date: "27.03.2026", arrival: "08:25", departure: "16:00", status: "late", label: "Доцнење" },
  { date: "26.03.2026", arrival: "—", departure: "—", status: "absent", label: "Отсуство" },
];

function StatusBadge({ type, children }) {
  const cls =
    type === "work"
      ? "dashboard__badge dashboard__badge--ok"
      : type === "late"
        ? "dashboard__badge dashboard__badge--warn"
        : "dashboard__badge dashboard__badge--absent";
  return <span className={cls}>{children}</span>;
}

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard__card">
        <h2 className="dashboard__titlebar">Контролна табла</h2>

        <div className="dashboard__body">
          <div className="dashboard__top">
            <div className="dashboard__stats">
              <article className="dashboard__stat">
                <h3 className="dashboard__stat-label">Денес - доаѓање</h3>
                <p className="dashboard__stat-value">08:02</p>
              </article>
              <article className="dashboard__stat">
                <h3 className="dashboard__stat-label">Работни часови (денес)</h3>
                <p className="dashboard__stat-value">06:45</p>
              </article>
              <article className="dashboard__stat">
                <h3 className="dashboard__stat-label">Доцнења (месец)</h3>
                <p className="dashboard__stat-value">00:25</p>
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
                {recentRows.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{row.arrival}</td>
                    <td>{row.departure}</td>
                    <td>
                      <StatusBadge type={row.status}>{row.label}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
