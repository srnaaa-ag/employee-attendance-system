import { useState, useEffect } from "react";
import "./Page.css";
import { useMatchMedia } from "../hooks/useMatchMedia";
import {
    createCorrectionRequest,
    getMyCorrectionRequests,
    getAllCorrectionRequests,
    approveCorrectionRequest,
    rejectCorrectionRequest,
    cancelCorrectionRequest,
} from "../services/correctionRequest";
import { isAdmin } from "../services/authService";

const STATUS_MK = {
    APPROVED: "Одобрено",
    REJECTED: "Одбиено",
    PENDING: "Во исчекување",
    CANCELLED: "Откажано",
};

const CORRECTION_TYPE_MK = {
    CHECK_IN_TIME: "Корекција на пријава",
    CHECK_OUT_TIME: "Корекција на одјава",
    ABSENCE_TYPE: "Корекција на отсуство",
};

const MAX_ADMIN_COMMENT = 500;

export default function CorrectionRequests() {
    const [form, setForm] = useState({
        correctionType: "CHECK_IN_TIME",
        targetDate: "",
        requestedCheckIn: "",
        requestedCheckOut: "",
        requestedAbsenceType: "",
        reason: "",
    });

    const [requests, setRequests] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [reviewNotes, setReviewNotes] = useState({});
    const [cancellingId, setCancellingId] = useState(null);
    const admin = isAdmin();
    const mobileCorrection = useMatchMedia("(max-width: 768px)");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const loadRequests = async () => {
        try {
            const data = await getMyCorrectionRequests();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading requests:", err);
        }
    };

    const loadPending = async () => {
        if (!admin) return;
        try {
            const data = await getAllCorrectionRequests();
            const pending = Array.isArray(data)
                ? data.filter((r) => r.status === "PENDING")
                : [];
            setPendingList(pending);
        } catch (err) {
            console.error("Error loading pending:", err);
        }
    };

    useEffect(() => {
        loadRequests();
        loadPending();
    }, []);

    const handleSubmit = async () => {
        try {
            const payload = {
                correctionType: form.correctionType,
                targetDate: form.targetDate,
                reason: form.reason,
            };

            if (form.correctionType === "CHECK_IN_TIME" && form.requestedCheckIn) {
                payload.requestedCheckIn = form.requestedCheckIn;
            }
            if (form.correctionType === "CHECK_OUT_TIME" && form.requestedCheckOut) {
                payload.requestedCheckOut = form.requestedCheckOut;
            }
            if (form.correctionType === "ABSENCE_TYPE" && form.requestedAbsenceType) {
                payload.requestedAbsenceType = form.requestedAbsenceType;
            }

            await createCorrectionRequest(payload);
            await loadRequests();
            setForm({
                correctionType: "CHECK_IN_TIME",
                targetDate: "",
                requestedCheckIn: "",
                requestedCheckOut: "",
                requestedAbsenceType: "",
                reason: "",
            });
        } catch (err) {
            console.error("Error creating request:", err);
        }
    };

    const setReviewNote = (id, value) => {
        if (value.length > MAX_ADMIN_COMMENT) return;
        setReviewNotes((prev) => ({ ...prev, [String(id)]: value }));
    };

    const handleApprove = async (id) => {
        try {
            await approveCorrectionRequest(id, reviewNotes[String(id)]);
            await loadPending();
            await loadRequests();
            setReviewNotes((prev) => {
                const next = { ...prev };
                delete next[String(id)];
                return next;
            });
        } catch (err) {
            console.error("Approve failed:", err);
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectCorrectionRequest(id, reviewNotes[String(id)]);
            await loadPending();
            await loadRequests();
            setReviewNotes((prev) => {
                const next = { ...prev };
                delete next[String(id)];
                return next;
            });
        } catch (err) {
            console.error("Reject failed:", err);
        }
    };

    const handleCancel = async (id) => {
        try {
            setCancellingId(id);
            await cancelCorrectionRequest(id);
            await loadRequests();
        } catch (err) {
            console.error("Cancel failed:", err);
        } finally {
            setCancellingId(null);
        }
    };

    function statusClass(status) {
        if (status === "APPROVED") return "status approved";
        if (status === "REJECTED") return "status rejected";
        if (status === "CANCELLED") return "status cancelled";
        return "status pending";
    }

    function formatDate(dateStr) {
        if (!dateStr) return "";
        if (typeof dateStr === "string" && dateStr.includes("-")) {
            const [year, month, day] = dateStr.split("-");
            return `${day}.${month}.${year}`;
        }
        return String(dateStr);
    }

    return (
        <div className="leave-container">
            <h2>Барање за корекција</h2>

            <div className="leave-grid">
                {/* ФОРМА */}
                <div className={`card${mobileCorrection ? " leave-card leave-card--form" : ""}`}>
                    <h3>Ново барање</h3>

                    <label>Тип на корекција</label>
                    <select name="correctionType" value={form.correctionType} onChange={handleChange}>
                        <option value="CHECK_IN_TIME">Корекција на пријава</option>
                        <option value="CHECK_OUT_TIME">Корекција на одјава</option>
                        <option value="ABSENCE_TYPE">Корекција на отсуство</option>
                    </select>

                    <label>Датум</label>
                    <input
                        type="date"
                        name="targetDate"
                        value={form.targetDate}
                        onChange={handleChange}
                    />

                    {form.correctionType === "CHECK_IN_TIME" && (
                        <>
                            <label>Точно време на пријава</label>
                            <input
                                type="time"
                                name="requestedCheckIn"
                                value={form.requestedCheckIn}
                                onChange={handleChange}
                            />
                        </>
                    )}

                    {form.correctionType === "CHECK_OUT_TIME" && (
                        <>
                            <label>Точно време на одјава</label>
                            <input
                                type="time"
                                name="requestedCheckOut"
                                value={form.requestedCheckOut}
                                onChange={handleChange}
                            />
                        </>
                    )}

                    {form.correctionType === "ABSENCE_TYPE" && (
                        <>
                            <label>Точен тип на отсуство</label>
                            <select
                                name="requestedAbsenceType"
                                value={form.requestedAbsenceType}
                                onChange={handleChange}
                            >
                                <option value="">Избери</option>
                                <option value="ANNUAL">Годишен одмор</option>
                                <option value="SICK_LEAVE">Боледување</option>
                            </select>
                        </>
                    )}

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

                {/* МОИ БАРАЊА */}
                <div className={`card${mobileCorrection ? " leave-card leave-card--list" : ""}`}>
                    <h3>Мои барања</h3>
                    {mobileCorrection ? (
                        <div className="leave-mycards">
                            {requests.length === 0 ? (
                                <div className="leave-mycards__empty">
                                    <p className="leave-mycards__empty-title">Нема барања</p>
                                    <p className="leave-mycards__empty-text">
                                        Поднесете барање погоре - секое ќе се појави овде како картичка.
                                    </p>
                                </div>
                            ) : (
                                requests.map((r) => (
                                    <article key={r.id} className="leave-mycard">
                                        <div className="leave-mycard__top">
                                            <p className="leave-mycard__period">{formatDate(r.targetDate)}</p>
                                            <span className={statusClass(r.status)}>
                                                {STATUS_MK[r.status] ?? r.status}
                                            </span>
                                        </div>
                                        <p className="leave-mycard__type">
                                            {CORRECTION_TYPE_MK[r.correctionType] ?? r.correctionType}
                                        </p>
                                        <div className="leave-mycard__block">
                                            <span className="leave-mycard__k">Барање</span>
                                            <p className="leave-mycard__v">{r.reason?.trim() ? r.reason : "—"}</p>
                                        </div>
                                        <div className="leave-mycard__block">
                                            <span className="leave-mycard__k">Одговор</span>
                                            <p className="leave-mycard__v">
                                                {r.adminComment?.trim() ? r.adminComment : "—"}
                                            </p>
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
                        <div className="leave-table-scroll">
                            <table className="leave-table leave-table--employee">
                                <thead>
                                    <tr>
                                        <th>Датум</th>
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
                                                        {formatDate(r.targetDate)}
                                                    </span>
                                                </td>
                                                <td className="leave-table__type-cell">
                                                    {CORRECTION_TYPE_MK[r.correctionType] ?? r.correctionType}
                                                </td>
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
                    )}
                </div>
            </div>

            {/* ADMIN ПАНЕЛ */}
            {admin && (
                <div
                    className={`card leave-admin-card${mobileCorrection ? " leave-card leave-card--admin" : ""}`}
                >
                    <h3>Барања за корекција во исчекување (администратор)</h3>
                    {mobileCorrection ? (
                        pendingList.length === 0 ? (
                            <p className="leave-pending-empty">Нема барања во исчекување.</p>
                        ) : (
                            <ul className="leave-pending-stack">
                                {pendingList.map((r) => (
                                    <li key={r.id} className="leave-pending-card">
                                        <p className="leave-pending-card__title">{r.employeeName}</p>
                                        <p className="leave-pending-card__period">{formatDate(r.targetDate)}</p>
                                        <div className="leave-pending-card__row">
                                            <span className="leave-pending-card__k">Тип</span>
                                            <span>
                                                {CORRECTION_TYPE_MK[r.correctionType] ?? r.correctionType}
                                            </span>
                                        </div>
                                        <div className="leave-pending-card__row">
                                            <span className="leave-pending-card__k">Коментар на вработен</span>
                                            <span>{r.reason?.trim() ? r.reason : "—"}</span>
                                        </div>
                                        <label
                                            className="leave-pending-card__label"
                                            htmlFor={`correction-admin-cmt-${r.id}`}
                                        >
                                            Коментар (администратор)
                                        </label>
                                        <textarea
                                            id={`correction-admin-cmt-${r.id}`}
                                            className="leave-admin-comment-input leave-pending-card__textarea"
                                            rows={3}
                                            maxLength={MAX_ADMIN_COMMENT}
                                            placeholder="Образложение (опционално)"
                                            value={reviewNotes[String(r.id)] ?? ""}
                                            onChange={(e) => setReviewNote(r.id, e.target.value)}
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
                                        <th>Датум</th>
                                        <th>Тип</th>
                                        <th>Коментар на вработен</th>
                                        <th>Коментар (администратор)</th>
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
                                                        {formatDate(r.targetDate)}
                                                    </span>
                                                </td>
                                                <td className="leave-table__type-cell">
                                                    {CORRECTION_TYPE_MK[r.correctionType] ?? r.correctionType}
                                                </td>
                                                <td className="leave-table__comment">
                                                    {r.reason?.trim() ? r.reason : "—"}
                                                </td>
                                                <td>
                                                    <textarea
                                                        className="leave-admin-comment-input"
                                                        rows={2}
                                                        maxLength={MAX_ADMIN_COMMENT}
                                                        placeholder="Образложение (опционално)"
                                                        value={reviewNotes[String(r.id)] ?? ""}
                                                        onChange={(e) => setReviewNote(r.id, e.target.value)}
                                                    />
                                                </td>
                                                <td className="leave-admin-actions">
                                                    <button
                                                        type="button"
                                                        className="primary-btn leave-btn-approve"
                                                        onClick={() => handleApprove(r.id)}
                                                    >
                                                        Одобри
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="secondary-btn leave-btn-reject"
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