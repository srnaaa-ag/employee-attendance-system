import "./Page.css";

export default function Employees() {
  const employees = [
    {
      name: "Ана Стојановска",
      dept: "Финансии",
      position: "Аналитичар",
      status: "Регистрирано",
      time: "08:00 / 16:00",
      check: "Навреме",
    },
    {
      name: "Марко Петровски",
      dept: "ИТ",
      position: "Програмер",
      status: "Ажурирај",
      time: "08:00 / 16:00",
      check: "Навреме",
    },
    {
      name: "Доне Донев",
      dept: "Менаџер",
      position: "Менаџер",
      status: "Регистрирано",
      time: "08:00 / 16:00",
      check: "Доцнење",
    },
  ];

  return (
    <div className="employees-container">
      <h2>Управување со вработени</h2>

      <div className="top-actions">
        <button className="primary-btn">+ Внеси нов вработен</button>
        <button className="secondary-btn">Импорт CSV/Excel</button>
      </div>

      <div className="card">
        <h3>Податоци за вработени</h3>

        <table>
          <thead>
            <tr>
              <th>Име и презиме</th>
              <th>Оддел</th>
              <th>Позиција</th>
              <th>Лице</th>
              <th>Работно време</th>
              <th>Check in денес</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {employees.map((e, i) => (
              <tr key={i}>
                <td>{e.name}</td>
                <td>{e.dept}</td>
                <td>{e.position}</td>

                <td>
                  <span className="status green">{e.status}</span>
                </td>

                <td>{e.time}</td>

                <td>
                  <span
                    className={
                      e.check === "Навреме"
                        ? "status green"
                        : "status orange"
                    }
                  >
                    {e.check}
                  </span>
                </td>

                <td>
                  <button className="edit-btn">Уреди</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}