import {useState, useMemo} from "react";
import "./Reports.css";

const MOCK_ROWS = [
    {name: "Ана Стојановска", department: "Финансии", days: 20, hours: "158:20", late: 0, warning: "Нема"},
    {name: "Марко Петровски", department: "ИТ", days: 19, hours: "152:05", late: 1, warning: "Нема"},
    {name: "Доне Донев", department: "Менаџер", days: 30, hours: "240:00", late: 1, warning: "Нема"},
];

function downloadCsv(filename, rows, fromDate, toDate, deptLabel) {
    const header = ["Период", `${fromDate} – ${toDate}`, "Оддел", deptLabel];
    const cols = ["Вработен", "Денови", "Работни часови", "Доцнења", "Предупредување"];
    const lines = [header.join(";"), cols.join(";")];
    for (const r of rows) {
        lines.push([r.name, r.days, r.hours, r.late, r.warning].join(";"));
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], {type: "text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Reports() {
    const [fromDate, setFromDate] = useState("2026-04-01");
    const [toDate, setToDate] = useState("2026-04-08");
    const [department, setDepartment] = useState("all");
    const filteredRows = useMemo(() => {
        if (department === "all") return MOCK_ROWS;
        const map = {finance: "Финансии", it: "ИТ", management: "Менаџер"};
        const label = map[department];
        return MOCK_ROWS.filter((r) => r.department === label);
    }, [department]);
    const deptLabel =
        department === "all"
            ? "Сите"
            : department === "finance"
                ? "Финансии"
                : department === "it"
                    ? "ИТ"
                    : "Менаџер";

    function handleDownloadCsv() {
        downloadCsv(
            `izvestai_${fromDate}_${toDate}.csv`,
            filteredRows,
            formatDisplayDate(fromDate),
            formatDisplayDate(toDate),
            deptLabel,
        );
    }

    return (
        <div className="reports-page">
            <section className="reports__shell" aria-labelledby="reports-main-title">
                <h2 id="reports-main-title" className="reports__titlebar">
                    Извештаи и статистики
                </h2>
                <div className="reports__body">
                    <div className="reports__filters">
                        <div className="reports__field">
                            <label htmlFor="reports-from">Од датум</label>
                            <input
                                id="reports-from"
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="reports__field">
                            <label htmlFor="reports-to">До датум</label>
                            <input id="reports-to" type="date" value={toDate}
                                   onChange={(e) => setToDate(e.target.value)}/>
                        </div>
                        <div className="reports__field reports__field--grow">
                            <label htmlFor="reports-dept">Оддел</label>
                            <select id="reports-dept" value={department}
                                    onChange={(e) => setDepartment(e.target.value)}>
                                <option value="all">Сите</option>
                                <option value="finance">Финансии</option>
                                <option value="it">ИТ</option>
                                <option value="management">Менаџер</option>
                            </select>
                        </div>
                        <div className="reports__field reports__field--btn">
              <span className="reports__label-spacer" aria-hidden>
                &nbsp;
              </span>
                            <button type="button" className="reports__btn-csv" onClick={handleDownloadCsv}>
                                Преземи CSV
                            </button>
                        </div>
                    </div>
                    <div className="reports__table-card">
                        <h3 className="reports__table-head">Податоци за вработени</h3>
                        <div className="reports__table-scroll">
                            <table className="reports__table">
                                <thead>
                                <tr>
                                    <th scope="col">Вработен</th>
                                    <th scope="col">Денови</th>
                                    <th scope="col">Работни часови</th>
                                    <th scope="col">Доцнења</th>
                                    <th scope="col">Предупредување</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="reports__empty">
                                            Нема податоци за избраните филтри.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((r) => (
                                        <tr key={r.name}>
                                            <td className="reports__cell-name">{r.name}</td>
                                            <td>{r.days}</td>
                                            <td className="reports__cell-mono">{r.hours}</td>
                                            <td>{r.late}</td>
                                            <td>{r.warning}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function formatDisplayDate(iso) {
    if (!iso || !iso.includes("-")) return iso;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

