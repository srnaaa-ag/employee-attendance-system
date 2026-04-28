import { useState } from "react";
import "./Page.css";

export default function LeaveRequests() {
  const [form, setForm] = useState({
    type: "",
    from: "",
    to: "",
    comment: "",
  });

  const requests = [
    {
      period: "01-08.04.2026",
      type: "Одмор",
      status: "Во обработка",
    },
    {
      period: "12.03.2026",
      type: "Боледување",
      status: "Одобрено",
    },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="leave-container">
      <h2>Барање за отсуство</h2>

      <div className="leave-grid">
        {/* LEFT - FORM */}
        <div className="card">
          <h3>Ново барање</h3>

          <label>Тип</label>
          <select name="type" onChange={handleChange}>
            <option>Годишен одмор</option>
            <option>Боледување</option>
          </select>

          <div className="row">
            <div>
              <label>Од датум</label>
              <input type="date" name="from" onChange={handleChange} />
            </div>
            <div>
              <label>До датум</label>
              <input type="date" name="to" onChange={handleChange} />
            </div>
          </div>

          <label>Коментар</label>
          <textarea
            name="comment"
            placeholder="Приложи објаснување"
            onChange={handleChange}
          />

          <button className="primary-btn">Поднеси барање</button>
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
                  <td>{r.period}</td>
                  <td>{r.type}</td>
                  <td>
                    <span
                      className={
                        r.status === "Одобрено"
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