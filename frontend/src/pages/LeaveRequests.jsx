import { useState, useEffect, useCallback, useMemo } from "react";
import "./Page.css";
import { useMatchMedia } from "../hooks/useMatchMedia";

import {
  createLeaveRequest,
  getRequestsForLoggedInEmployee,
  getRequestsByStatus,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
} from "../services/leaveRequest";

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

function datesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

export default function LeaveRequests() {
  const admin = isAdmin();
  const mobileLeave = useMatchMedia("(max-width: 768px)");

  const [form, setForm] = useState({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [requests, setRequests] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [adminComments, setAdminComments] = useState({});
  const [pendingLoadError, setPendingLoadError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

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

  const loadPending = useCallback(async () => {
    if (!admin) return;

    setPendingLoadError(null);

    try {
      const data = await getRequestsByStatus("PENDING");
      setPendingList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading pending:", err);
      setPendingList([]);
      setPendingLoadError("Не можам да ја вчитам листата.");
    }
  }, [admin]);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

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

  const handleAdminCommentChange = (id, value) => {
    setAdminComments((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleApprove = async (id) => {
    try {
      await approveLeaveRequest(id, adminComments[id]);
      await loadPending();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectLeaveRequest(id, adminComments[id]);
      await loadPending();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const handleCancel = async (id) => {
    try {
      setCancellingId(id);
      await cancelLeaveRequest(id);
      await loadRequests();
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setCancellingId(null);
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

  const overlapDetected = useMemo(() => {
    if (!form.startDate || !form.endDate) return false;
    if (form.startDate > form.endDate) return false;

    return requests
      .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
      .some((r) => {
        if (!r.startDate || !r.endDate) return false;
        return datesOverlap(form.startDate, form.endDate, r.startDate, r.endDate);
      });
  }, [form.startDate, form.endDate, requests]);

  const invalidRange = Boolean(form.startDate && form.endDate && form.startDate > form.endDate);
  const disableSubmit = invalidRange || overlapDetected;
  const submitDisabledTitle = invalidRange
    ? "Почетниот датум не смее да е после крајниот."
    : overlapDetected
      ? "Имате постоечко барање што се преклопува во овој период."
      : "";

  return (
    <div className="leave-container">
      <h2>Барање за отсуство</h2>

      <div className="leave-grid">
        {/* CREATE REQUEST */}
        <div className={`card${mobileLeave ? " leave-card leave-card--form" : ""}`}>
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
            onChange={handleChange}
            placeholder="Приложи објаснување"
          />

          <button
            type="button"
            className="primary-btn"
            onClick={handleSubmit}
            disabled={disableSubmit}
            title={submitDisabledTitle}
          >
            Поднеси барање
          </button>
          {disableSubmit && (
            <p className="leave-form-hint leave-form-hint--warn">{submitDisabledTitle}</p>
          )}
        </div>

        {/* EMPLOYEE REQUESTS */}
        <div className={`card${mobileLeave ? " leave-card leave-card--list" : ""}`}>
          <h3>Мои барања</h3>

          {mobileLeave ? (
            <div className="leave-mycards">
              {requests.length === 0 ? (
                <div className="leave-mycards__empty">
                  <p className="leave-mycards__empty-title">Нема барања</p>
                  <p className="leave-mycards__empty-text">Поднесете барање погоре — секое ќе се појави овде како картичка.</p>
                </div>
              ) : (
                requests.map((r) => (
                  <article key={r.id} className="leave-mycard">
                    <div className="leave-mycard__top">
                      <p className="leave-mycard__period">
                        {formatDate(r.startDate)} – {formatDate(r.endDate)}
                      </p>
                      <span className={statusClass(r.status)}>
                        {STATUS_MK[r.status] ?? r.status}
                      </span>
                    </div>
                    <p className="leave-mycard__type">{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</p>
                    <div className="leave-mycard__block">
                      <span className="leave-mycard__k">Коментар</span>
                      <p className="leave-mycard__v">{r.reason?.trim() ? r.reason : "—"}</p>
                    </div>
                    <div className="leave-mycard__block">
                      <span className="leave-mycard__k">Одговор</span>
                      <p className="leave-mycard__v">{r.adminComment?.trim() ? r.adminComment : "—"}</p>
                    </div>
                    {r.status === "PENDING" ? (
                      <button
                        type="button"
                        className="leave-mycard__btn-cancel"
                        onClick={() => handleCancel(r.id)}
                        disabled={cancellingId === r.id}
                      >
                        {cancellingId === r.id ? "Откажување..." : "Откажи барање"}
                      </button>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="leave-table-scroll">
                <table className="leave-table leave-table--employee">
                  <thead>
                    <tr>
                      <th>Период</th>
                      <th>Тип</th>
                      <th>Статус</th>
                      <th>Коментар</th>
                      <th>Акција</th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="leave-table__empty">
                          Нема поднесени барања.
                        </td>
                      </tr>
                    ) : (
                      requests.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <span className="leave-table__period">
                              {formatDate(r.startDate)} – {formatDate(r.endDate)}
                            </span>
                          </td>
                          <td className="leave-table__type-cell">{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</td>
                          <td className="leave-table__status-cell">
                            <span className={statusClass(r.status)}>
                              {STATUS_MK[r.status] ?? r.status}
                            </span>
                          </td>
                          <td className="leave-table__comment">
                            {r.adminComment?.trim() ? r.adminComment : "—"}
                          </td>
                          <td className="leave-table__action-cell">
                            {r.status === "PENDING" ? (
                              <button
                                type="button"
                                className="leave-btn-cancel"
                                onClick={() => handleCancel(r.id)}
                                disabled={cancellingId === r.id}
                              >
                                {cancellingId === r.id ? "Откажување..." : "Откажи"}
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ADMIN */}
      {admin && (
        <div className={`card leave-admin-card${mobileLeave ? " leave-card leave-card--admin" : ""}`}>
          <h3>Барања во исчекување</h3>

          {pendingLoadError && <p className="leave-error">{pendingLoadError}</p>}

          {mobileLeave ? (
            pendingList.length === 0 ? (
              <p className="leave-pending-empty">Нема барања во исчекување.</p>
            ) : (
              <ul className="leave-pending-stack">
                {pendingList.map((r) => (
                  <li key={r.id} className="leave-pending-card">
                    <p className="leave-pending-card__title">{r.employeeName}</p>
                    <p className="leave-pending-card__period">
                      {formatDate(r.startDate)} – {formatDate(r.endDate)}
                    </p>
                    <div className="leave-pending-card__row">
                      <span className="leave-pending-card__k">Тип</span>
                      <span>{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</span>
                    </div>
                    <div className="leave-pending-card__row">
                      <span className="leave-pending-card__k">Коментар од вработен</span>
                      <span>{r.reason?.trim() ? r.reason : "—"}</span>
                    </div>
                    <label className="leave-pending-card__label" htmlFor={`admin-cmt-${r.id}`}>
                      Админ коментар
                    </label>
                    <textarea
                      id={`admin-cmt-${r.id}`}
                      className="leave-admin-comment-input leave-pending-card__textarea"
                      maxLength={MAX_ADMIN_COMMENT}
                      value={adminComments[r.id] || ""}
                      onChange={(e) => handleAdminCommentChange(r.id, e.target.value)}
                      rows={3}
                    />
                    <div className="leave-pending-card__actions">
                      <button
                        type="button"
                        className="leave-btn-approve"
                        onClick={() => handleApprove(r.id)}
                      >
                        Одобри
                      </button>
                      <button
                        type="button"
                        className="leave-btn-reject"
                        onClick={() => handleReject(r.id)}
                      >
                        Одбиј
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="leave-table-scroll leave-table-scroll--admin">
              <table className="leave-table leave-table--wide">
                  <thead>
                    <tr>
                      <th>Вработен</th>
                      <th>Период</th>
                      <th>Тип</th>
                      <th>Коментар</th>
                      <th>Админ коментар</th>
                      <th>Акции</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pendingList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="leave-table__empty">
                          Нема барања во исчекување.
                        </td>
                      </tr>
                    ) : (
                      pendingList.map((r) => (
                        <tr key={r.id}>
                          <td className="leave-table__type-cell">{r.employeeName}</td>
                          <td>
                            <span className="leave-table__period">
                              {formatDate(r.startDate)} – {formatDate(r.endDate)}
                            </span>
                          </td>
                          <td className="leave-table__type-cell">{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</td>
                          <td className="leave-table__comment">{r.reason?.trim() ? r.reason : "—"}</td>
                          <td>
                            <textarea
                              className="leave-admin-comment-input"
                              maxLength={MAX_ADMIN_COMMENT}
                              value={adminComments[r.id] || ""}
                              onChange={(e) =>
                                handleAdminCommentChange(r.id, e.target.value)
                              }
                            />
                          </td>
                          <td className="leave-admin-actions">
                            <button
                              type="button"
                              className="leave-btn-approve"
                              onClick={() => handleApprove(r.id)}
                            >
                              Одобри
                            </button>
                            <button
                              type="button"
                              className="leave-btn-reject"
                              onClick={() => handleReject(r.id)}
                            >
                              Одбиј
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}