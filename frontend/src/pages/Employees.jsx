import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { isAdmin } from "../services/authService";
import EmployeeEditModal from "../components/EmployeeEditModal.jsx";
import "./Employees.css";

const faceBadgeClass = (kind) =>
    kind === "registered" ? "employees__badge employees__badge--ok" : "employees__badge employees__badge--warn";
const checkBadgeClass = (kind) =>
    kind === "ontime" ? "employees__badge employees__badge--ok" : "employees__badge employees__badge--warn";

function createDefaultWeek() {
    const work = { isOff: false, start: "08:00", end: "16:00" };
    const off = { isOff: true, start: "08:00", end: "16:00" };
    return {
        mon: { ...work },
        tue: { ...work },
        wed: { ...work },
        thu: { ...work },
        fri: { ...work },
        sat: { ...off },
        sun: { ...off },
    };
}
function cloneWeek(w) {
    const out = {};
    for (const k of Object.keys(w)) {
        out[k] = { ...w[k] };
    }
    return out;
}

function summarizeWeek(week) {
    const { mon, tue, wed, thu, fri, sat, sun } = week;
    const workingDays = [mon, tue, wed, thu, fri].filter((d) => !d.isOff);
    if (workingDays.length === 0) return "—";
    const { start, end } = workingDays[0];
    const same =
        workingDays.every((d) => d.start === start && d.end === end) &&
        [mon, tue, wed, thu, fri].every((d) => d.isOff || (d.start === start && d.end === end));
    const onlyWeekdaysOn =
        !mon.isOff &&
        !tue.isOff &&
        !wed.isOff &&
        !thu.isOff &&
        !fri.isOff &&
        sat.isOff &&
        sun.isOff;
    if (same && onlyWeekdaysOn) return `${start} – ${end} (Пон–Пет)`;
    if (same) return `${start} – ${end}`;
    return `${start} – ${end} (+други смени)`;
}
function buildDraft(emp) {
    return {
        id: emp.id,
        name: emp.name,
        dept: emp.dept,
        position: emp.position,
        week: cloneWeek(emp.week),
        photoFile: null,
        photoPreview: null,
        hadFacePhoto: emp.hasFacePhoto,
        photoCleared: false,
    };
}

const INITIAL = [
    {
        id: "1",
        name: "Ана Стојановска",
        dept: "Финансии",
        position: "Аналитичар",
        hasFacePhoto: true,
        checkLabel: "Навреме",
        checkKind: "ontime",
        week: createDefaultWeek(),
    },
    {
        id: "2",
        name: "Марко Петровски",
        dept: "ИТ",
        position: "Програмер",
        hasFacePhoto: false,
        checkLabel: "Навреме",
        checkKind: "ontime",
        week: createDefaultWeek(),
    },
    {
        id: "3",
        name: "Доне Донев",
        dept: "Менаџер",
        position: "Менаџер",
        hasFacePhoto: true,
        checkLabel: "Доцнење",
        checkKind: "late",
        week: createDefaultWeek(),
    },
];


export default function Employees() {
    if (!isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }
    const [employees, setEmployees] = useState(() =>
        INITIAL.map((e) => ({
            ...e,
            time: summarizeWeek(e.week),
        })),
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState(null);
    const openModal = useCallback((emp) => {
        setDraft(buildDraft(emp));
        setModalOpen(true);
    }, []);
    const closeModal = useCallback(() => {
        setDraft((d) => {
            if (d?.photoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(d.photoPreview);
            }
            return null;
        });
        setModalOpen(false);
    }, []);

    const saveModal = useCallback(() => {
        if (!draft) return;
        if (draft.photoPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(draft.photoPreview);
        }
        const hasFacePhoto = draft.photoFile || draft.photoPreview ? true : draft.photoCleared ? false : draft.hadFacePhoto;
        setEmployees((list) =>
            list.map((e) => {
                if (e.id !== draft.id) return e;
                return {
                    ...e,
                    dept: draft.dept.trim() || e.dept,
                    position: draft.position.trim() || e.position,
                    week: cloneWeek(draft.week),
                    time: summarizeWeek(draft.week),
                    hasFacePhoto,
                };
            }),
        );
        setDraft(null);
        setModalOpen(false);
    }, [draft]);

    return (
        <div className="employees-page">
            <section className="employees__shell" aria-labelledby="employees-main-title">
                <h2 id="employees-main-title" className="employees__titlebar">
                    Управување со вработени
                </h2>

                <div className="employees__body">
                    <div className="employees__toolbar">
                        <button type="button" className="employees__btn employees__btn--primary">
                            + Внеси нов вработен
                        </button>
                        <button type="button" className="employees__btn employees__btn--outline">
                            Импорт CSV/Excel
                        </button>
                    </div>

                    <div className="employees__table-card">
                        <h3 className="employees__table-head">Податоци за вработени</h3>
                        <div className="employees__table-scroll">
                            <table className="employees__table">
                                <thead>
                                <tr>
                                    <th scope="col">Име и презиме</th>
                                    <th scope="col">Оддел</th>
                                    <th scope="col">Позиција</th>
                                    <th scope="col">Лице</th>
                                    <th scope="col">Работно време</th>
                                    <th scope="col">Check in денес</th>
                                    <th scope="col" className="employees__th-actions">
                                        Акции
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {employees.map((e) => {
                                    const faceKind = e.hasFacePhoto ? "registered" : "update";
                                    const faceLabel = e.hasFacePhoto ? "Регистрирано" : "Ажурирај";
                                    return (
                                        <tr key={e.id}>
                                            <td className="employees__cell-strong">{e.name}</td>
                                            <td>{e.dept}</td>
                                            <td>{e.position}</td>
                                            <td>
                                                <span className={faceBadgeClass(faceKind)}>{faceLabel}</span>
                                            </td>
                                            <td className="employees__cell-mono">{e.time}</td>
                                            <td>
                                                <span className={checkBadgeClass(e.checkKind)}>{e.checkLabel}</span>
                                            </td>
                                            <td className="employees__cell-actions">
                                                <button type="button" className="employees__edit" onClick={() => openModal(e)}>
                                                    Уреди
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            <EmployeeEditModal
                open={modalOpen}
                draft={draft}
                onChange={setDraft}
                onClose={closeModal}
                onSave={saveModal}
            />
        </div>
    );
}