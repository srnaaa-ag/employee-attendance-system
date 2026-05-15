import { useState, useMemo, useEffect, useCallback } from "react";
import { getEmployeeReportSummary } from "../services/reportService.js";
import { downloadReportPdf } from "../utils/reportPdfExport.js";
import { useMatchMedia } from "../hooks/useMatchMedia";
import "./Reports.css";

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
    const [employeeQuery, setEmployeeQuery] = useState("");
    const [warningFullMonthOfTo, setWarningFullMonthOfTo] = useState(false);

    const [rows, setRows] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [loading, setLoading] = useState(true);
    const mobileReports = useMatchMedia("(max-width: 768px)");
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const loadReport = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getEmployeeReportSummary(fromDate, toDate, warningFullMonthOfTo);
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setLoadError(e?.message || "Неуспешно вчитување на извештајот.");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, warningFullMonthOfTo]);

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
        const q = employeeQuery.trim().toLowerCase();
        return rows.filter((r) => {
            const deptOk = department === "all" || r.department === department;
            const employeeOk = !q || String(r.fullName ?? "").toLowerCase().includes(q);
            return deptOk && employeeOk;
        });
    }, [rows, department, employeeQuery]);

    const deptLabel = department === "all" ? "Сите" : department;

    function handleDownloadPdf() {
        downloadReportPdf({
            filename: `izvestai_${fromDate}_${toDate}.pdf`,
            rows: filteredRows,
            fromDate: formatDisplayDate(fromDate),
            toDate: formatDisplayDate(toDate),
            deptLabel,
            warningFullMonthOfTo,
        });
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

                    {mobileReports ? (
                        <button
                            type="button"
                            className="reports__filters-toggle"
                            onClick={() => setMobileFiltersOpen((prev) => !prev)}
                            aria-expanded={mobileFiltersOpen}
                            aria-controls="reports-mobile-filters"
                        >
                            {mobileFiltersOpen ? "Сокриј филтри" : "Прикажи филтри"}
                        </button>
                    ) : null}

                    <div
                        id="reports-mobile-filters"
                        className={`reports__filters${mobileReports ? " reports__filters--mobile" : ""}${
                            mobileReports && !mobileFiltersOpen ? " reports__filters--collapsed" : ""
                        }`}
                    >
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
                        <div className="reports__field reports__field--grow">
                            <label htmlFor="reports-employee">Вработен</label>
                            <div className="reports__search-wrap">
                                <span className="reports__search-icon" aria-hidden>
                                    🔍
                                </span>
                                <input
                                    id="reports-employee"
                                    type="search"
                                    placeholder="Пребарај вработен"
                                    value={employeeQuery}
                                    onChange={(e) => setEmployeeQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="reports__field reports__field--btn">
                            <span className="reports__label-spacer" aria-hidden>
                                &nbsp;
                            </span>
                            <button type="button" className="reports__btn-pdf" onClick={handleDownloadPdf} disabled={loading}>
                                Преземи PDF
                            </button>
                        </div>
                        <div
                            className="reports__warning-block"
                            role="group"
                            aria-labelledby="reports-warning-title"
                        >
                            <p id="reports-warning-title" className="reports__warning-title">
                                НАПОМЕНА за Колона „Предупредување“
                            </p>
                            <label className="reports__checkbox-label" htmlFor="reports-warning-full-month">
                                <input
                                    id="reports-warning-full-month"
                                    type="checkbox"
                                    checked={warningFullMonthOfTo}
                                    onChange={(e) => setWarningFullMonthOfTo(e.target.checked)}
                                />
                                <span>Пресметка на ниво на целиот месец</span>
                            </label>
                            <ul className="reports__warning-list">
                                <li>
                                    <span className="reports__warning-list-label">Без штик: </span>
                                    Колоната „Предупредување“ се однесува за избраниот период <strong>Од–До</strong>.
                                </li>
                                <li>
                                    <span className="reports__warning-list-label">Со штик: </span>
                                    Колоната „Предупредување“ го опфаќа {' '}
                                    <strong>целиот месец</strong> на датумот „До“ (од првиот до последниот ден
                                    во тој месец). Останатите колони ги прикажуваат податоците за периодот <strong>Од–До</strong>.
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="reports__table-card">
                        <h3 className="reports__table-head">Податоци за вработени</h3>
                        {mobileReports ? (
                            <div className="reports__cards">
                                {filteredRows.length === 0 ? (
                                    <p className="reports__empty reports__empty--card">
                                        Нема податоци за избраните филтри.
                                    </p>
                                ) : (
                                    filteredRows.map((r) => (
                                        <article key={r.employeeId} className="reports__card">
                                            <h4 className="reports__card-name">{r.fullName}</h4>
                                            <div className="reports__card-grid">
                                                <div className="reports__card-row">
                                                    <span className="reports__card-k">Денови присуство</span>
                                                    <span className="reports__card-v reports__cell-mono">
                                                        {r.presentDays}
                                                    </span>
                                                </div>
                                                <div className="reports__card-row">
                                                    <span className="reports__card-k">Одобрено отсуство</span>
                                                    <span className="reports__card-v reports__cell-mono">
                                                        {r.approvedLeaveDays}
                                                    </span>
                                                </div>
                                                <div className="reports__card-row">
                                                    <span className="reports__card-k">Работни часови</span>
                                                    <span className="reports__card-v reports__cell-mono">
                                                        {r.workedHoursFormatted}
                                                    </span>
                                                </div>
                                                <div className="reports__card-row">
                                                    <span className="reports__card-k">Доцнења</span>
                                                    <span className="reports__card-v reports__cell-mono">
                                                        {r.lateCount}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="reports__card-warning">
                                                <span className="reports__card-k">Предупредување</span>
                                                <span className="reports__card-v">{r.warning || "—"}</span>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="reports__table-scroll">
                                <table className="reports__table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Вработен</th>
                                            <th scope="col">Денови присуство</th>
                                            <th scope="col">Одобрено отс. (ден.)</th>
                                            <th scope="col">Работни часови</th>
                                            <th scope="col">Доцнења</th>
                                            <th scope="col">Предупредување</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="reports__empty">
                                                    Нема податоци за избраните филтри.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRows.map((r) => (
                                                <tr key={r.employeeId}>
                                                    <td className="reports__cell-name">{r.fullName}</td>
                                                    <td className="reports__cell-mono">{r.presentDays}</td>
                                                    <td className="reports__cell-mono">{r.approvedLeaveDays}</td>
                                                    <td className="reports__cell-mono">{r.workedHoursFormatted}</td>
                                                    <td>{r.lateCount}</td>
                                                    <td>{r.warning}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
