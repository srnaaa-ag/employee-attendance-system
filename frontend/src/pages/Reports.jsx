import { useState, useMemo, useEffect, useCallback } from "react";
import { getEmployeeReportSummary } from "../services/reportService.js";
import "./Reports.css";

function downloadCsv(filename, rows, fromDate, toDate, deptLabel) {
    const header = ["Период", `${fromDate} – ${toDate}`, "Оддел", deptLabel];
    const cols = ["Вработен", "Денови присуство", "Одобрено отсуство (ден.)", "Работни часови", "Доцнења", "Предупредување"];
    const lines = [header.join(";"), cols.join(";")];
    for (const r of rows) {
        lines.push(
            [r.fullName, r.presentDays, r.approvedLeaveDays, r.workedHoursFormatted, r.lateCount, r.warning].join(";"),
        );
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function formatDisplayDate(iso) {
    if (!iso || !iso.includes("-")) return iso;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

export default function Reports() {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const toIso = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const [fromDate, setFromDate] = useState(toIso(defaultFrom));
    const [toDate, setToDate] = useState(toIso(today));
    const [department, setDepartment] = useState("all");

    const [rows, setRows] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadReport = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getEmployeeReportSummary(fromDate, toDate);
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setLoadError(e?.message || "Неуспешно вчитување на извештајот.");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const departmentOptions = useMemo(() => {
        const set = new Set();
        for (const r of rows) {
            if (r.department && String(r.department).trim() && r.department !== "—") {
                set.add(String(r.department).trim());
            }
        }
        return [...set].sort((a, b) => a.localeCompare(b, "mk"));
    }, [rows]);

    const filteredRows = useMemo(() => {
        if (department === "all") return rows;
        return rows.filter((r) => r.department === department);
    }, [rows, department]);

    const deptLabel = department === "all" ? "Сите" : department;

    function handleDownloadCsv() {
        downloadCsv(
            `izvestai_${fromDate}_${toDate}.csv`,
            filteredRows,
            formatDisplayDate(fromDate),
            formatDisplayDate(toDate),
            deptLabel,
        );
    }

    function formatDaysCell(r) {
        const leave = r.approvedLeaveDays > 0 ? ` (+${r.approvedLeaveDays} отс.)` : "";
        return `${r.presentDays}${leave}`;
    }

    return (
        <div className="reports-page">
            <section className="reports__shell" aria-labelledby="reports-main-title">
                <h2 id="reports-main-title" className="reports__titlebar">
                    Извештаи и статистики
                </h2>
                <div className="reports__body">
                    {loadError ? <p className="reports__error">{loadError}</p> : null}
                    {loading ? <p className="reports__loading">Се вчитуваат податоци…</p> : null}

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
                            <input id="reports-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                        </div>
                        <div className="reports__field reports__field--grow">
                            <label htmlFor="reports-dept">Оддел</label>
                            <select id="reports-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <option value="all">Сите</option>
                                {departmentOptions.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="reports__field reports__field--btn">
                            <span className="reports__label-spacer" aria-hidden>
                                &nbsp;
                            </span>
                            <button type="button" className="reports__btn-csv" onClick={handleDownloadCsv} disabled={loading}>
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
                                            <tr key={r.employeeId}>
                                                <td className="reports__cell-name">{r.fullName}</td>
                                                <td>{formatDaysCell(r)}</td>
                                                <td className="reports__cell-mono">{r.workedHoursFormatted}</td>
                                                <td>{r.lateCount}</td>
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
