import { useState, useEffect } from "react";
import "./Page.css";
import {
  createLeaveRequest,
  getRequestsForLoggedInEmployee,
} from "../services/leaveRequest";

export default function LeaveRequests() {
  const [form, setForm] = useState({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [requests, setRequests] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Fetch requests on load
  const loadRequests = async () => {
    try {
      const data = await getRequestsForLoggedInEmployee();
      setRequests(data);
    } catch (err) {
      console.error("Error loading requests:", err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // ✅ Submit form
  const handleSubmit = async () => {
    try {
      await createLeaveRequest(form);

      // refresh list after submit
      await loadRequests();

      // reset form
      setForm({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (err) {
      console.error("Error creating request:", err);
    }
  };

  // helper for formatting
  const formatPeriod = (start, end) => {
    if (!start || !end) return "";
    return `${start} - ${end}`;
  };

  function formatDate(dateStr) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  }

  return (
    <div className="leave-container">
      <h2>Барање за отсуство</h2>

      <div className="leave-grid">
        {/* LEFT - FORM */}
        <div className="card">
          <h3>Ново барање</h3>

          <label>Тип</label>
          <select
            name="leaveType"
            value={form.leaveType}
            onChange={handleChange}
          >
            <option value={"ANNUAL"}>Годишен одмор</option>
            <option value={"SICK_LEAVE"}>Боледување</option>
          </select>

          <div className="row">
            <div>
              <label>Од датум</label>
              <input type="date" name="startDate" onChange={handleChange} />
            </div>
            <div>
              <label>До датум</label>
              <input type="date" name="endDate" onChange={handleChange} />
            </div>
          </div>

          <label>Коментар</label>
          <textarea
            name="reason"
            placeholder="Приложи објаснување"
            onChange={handleChange}
          />

          <button className="primary-btn" onClick={handleSubmit}>
            Поднеси барање
          </button>
        </div>

        {/* RIGHT - TABLE */}
        <div className="card">
          <h3>Мои барања</h3>

          <table>
            <thead>
              <tr>
                <th>Период</th>
                <th>Тип</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={i}>
                  <td>
                    {formatDate(r.startDate)} : {formatDate(r.endDate)}
                  </td>
                  <td>{r.leaveType}</td>
                  <td>
                    <span
                      className={
                        r.status === "APPROVED"
                          ? "status approved"
                          : "status pending"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
