import { useState, useEffect, useCallback } from "react";
import "./Page.css";

import {
  createLeaveRequest,
  getRequestsForLoggedInEmployee,
  getRequestsByStatus,
  approveLeaveRequest,
  rejectLeaveRequest,
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

export default function LeaveRequests() {
  const admin = isAdmin();

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
        {/* CREATE REQUEST */}
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
            onChange={handleChange}
            placeholder="Приложи објаснување"
          />

          <button className="primary-btn" onClick={handleSubmit}>
            Поднеси барање
          </button>
        </div>

        {/* EMPLOYEE REQUESTS */}
        <div className="card">
          <h3>Мои барања</h3>

          <table className="leave-table">
            <thead>
              <tr>
                <th>Период</th>
                <th>Тип</th>
                <th>Статус</th>
                <th>Коментар</th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={4}>Нема поднесени барања.</td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {formatDate(r.startDate)} – {formatDate(r.endDate)}
                    </td>
                    <td>{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</td>
                    <td>
                      <span className={statusClass(r.status)}>
                        {STATUS_MK[r.status] ?? r.status}
                      </span>
                    </td>
                    <td>{r.adminComment?.trim() ? r.adminComment : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN */}
      {admin && (
        <div className="card">
          <h3>Барања во исчекување</h3>

          {pendingLoadError && <p className="leave-error">{pendingLoadError}</p>}

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
                  <td colSpan={6}>Нема барања во исчекување.</td>
                </tr>
              ) : (
                pendingList.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employeeName}</td>
                    <td>
                      {formatDate(r.startDate)} – {formatDate(r.endDate)}
                    </td>
                    <td>{LEAVE_TYPE_MK[r.leaveType] ?? r.leaveType}</td>
                    <td>{r.reason?.trim() ? r.reason : "—"}</td>
                    <td>
                      <textarea
                        maxLength={MAX_ADMIN_COMMENT}
                        value={adminComments[r.id] || ""}
                        onChange={(e) =>
                          handleAdminCommentChange(r.id, e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button onClick={() => handleApprove(r.id)}>Одобри</button>
                      <button onClick={() => handleReject(r.id)}>Одбиј</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}