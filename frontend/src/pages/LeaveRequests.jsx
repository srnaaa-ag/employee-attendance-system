import { useState, useEffect } from "react";

import "./Page.css";
import { createLeaveRequest, getRequestsForLoggedInEmployee } from "../services/leaveRequest";
import { isAdmin } from "../services/authService";

const STATUS_MK = {
  APPROVED: "Одобрено",
  REJECTED: "Одбиено",
  PENDING: "Во исчекување",
  CANCELLED: "Откажано",
};
const LEAVE_TYPE_MK = {
  ANNUAL: "Годишен одмор",
  SICK_LEAVE: "Боледување",
};
const MAX_ADMIN_COMMENT = 500;

/** За UI преглед (без база). */
const DEMO_PENDING_REQUESTS = [
  {
    id: "demo-1",
    employeeName: "Марија Петровска",
    startDate: "2026-05-12",
    endDate: "2026-05-16",
    leaveType: "ANNUAL",
    reason: "Годишен одмор, семејни обврски",
  },
  {
    id: "demo-2",
    employeeName: "Стојан Георгиевски",
    startDate: "2026-05-20",
    endDate: "2026-05-21",
    leaveType: "SICK_LEAVE",
    reason: "Преглед кај лекар",
  },
  {
    id: "demo-3",
    employeeName: "Ана Стојанова",
    startDate: "2026-06-02",
    endDate: "2026-06-13",
    leaveType: "ANNUAL",
    reason: "",
  },
];

export default function LeaveRequests() {
  const [form, setForm] = useState({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [requests, setRequests] = useState([]);
  const admin = isAdmin();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loadRequests = async () => {
    try {
      const data = await getRequestsForLoggedInEmployee();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading requests:", err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async () => {
    try {
      await createLeaveRequest(form);
      await loadRequests();
      setForm({
        leaveType: "ANNUAL",
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (err) {
      console.error("Error creating request:", err);
    }
  };

  function formatDate(dateStr) {
    if (!dateStr) return "";
    if (typeof dateStr === "string" && dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-");
      return `${day}.${month}.${year}`;
    }
    return String(dateStr);
  }

  function statusClass(status) {
    if (status === "APPROVED") return "status approved";
    if (status === "REJECTED") return "status rejected";
    if (status === "CANCELLED") return "status cancelled";
    return "status pending";
  }

  return (
    <div className="leave-container">
      <h2>Барање за отсуство</h2>

      <div className="leave-grid">
        <div className="card">
          <h3>Ново барање</h3>

          <label>Тип</label>
          <select name="leaveType" value={form.leaveType} onChange={handleChange}>
            <option value="ANNUAL">Годишен одмор</option>
            <option value="SICK_LEAVE">Боледување</option>
          </select>

          <div className="row">
            <div>
              <label>Од датум</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
            </div>
            <div>
              <label>До датум</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
            </div>
          </div>

          <label>Коментар</label>
          <textarea
            name="reason"
            value={form.reason}
            placeholder="Приложи објаснување"
            onChange={handleChange}
          />

          <button type="button" className="primary-btn" onClick={handleSubmit}>
            Поднеси барање
          </button>
        </div>

        <div className="card">
          <h3>Мои барања</h3>

          <table className="leave-table">
            <thead>
              <tr>
                <th>Период</th>
                <th>Тип</th>
                <th>Статус</th>
                <th>Коментар (од администратор)</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="leave-table__empty">
                    Нема поднесени барања.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {formatDate(r.startDate)} – {formatDate(r.endDate)}
                    </td>
                    <td>{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</td>
                    <td>
                      <span className={statusClass(r.status)}>{STATUS_MK[r.status] ?? r.status}</span>
                    </td>
                    <td className="leave-table__comment">{r.adminComment?.trim() ? r.adminComment : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {admin ? (
        <div className="card leave-admin-card leave-admin-card--demo">
          <h3>Барања во исчекување (администратор)</h3>
          <p className="leave-demo-banner">
            Демо преглед на интерфејс — пример податоци, без база. Копчињата се исклучени.
          </p>
          <p className="leave-admin-hint">
            При одобрување или одбивање можеш да додадеш незадолжителен коментар (макс. {MAX_ADMIN_COMMENT}{" "}
            знаци). Вработениот го гледа во табелата „Мои барања“ и во известувањата.
          </p>
          <table className="leave-table leave-table--wide">
            <thead>
              <tr>
                <th>Вработен</th>
                <th>Период</th>
                <th>Тип</th>
                <th>Коментар на вработен</th>
                <th>Коментар (администратор)</th>
                <th>Акции</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PENDING_REQUESTS.map((r) => (
                <tr key={r.id}>
                  <td>{r.employeeName}</td>
                  <td>
                    {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  </td>
                  <td>{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</td>
                  <td className="leave-table__comment">{r.reason?.trim() ? r.reason : "—"}</td>
                  <td>
                    <textarea
                      className="leave-admin-comment-input"
                      rows={2}
                      maxLength={MAX_ADMIN_COMMENT}
                      placeholder="Образложение за вработениот (опционално)"
                      defaultValue=""
                      aria-label={`Демо коментар за ${r.employeeName}`}
                    />
                  </td>
                  <td className="leave-admin-actions">
                    <button type="button" className="primary-btn leave-btn-approve" disabled title="Демо">
                      Одобри
                    </button>
                    <button type="button" className="secondary-btn leave-btn-reject" disabled title="Демо">
                      Одбиј
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
