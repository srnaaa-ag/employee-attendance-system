import { useEffect, useRef } from "react";

const WEEK_ROWS = [
    { key: "mon", label: "Понеделник" },
    { key: "tue", label: "Вторник" },
    { key: "wed", label: "Среда" },
    { key: "thu", label: "Четврток" },
    { key: "fri", label: "Петок" },
    { key: "sat", label: "Сабота" },
    { key: "sun", label: "Недела" },
];

export default function EmployeeEditModal({
                                              open,
                                              draft,
                                              onChange,
                                              onClose,
                                              onSave,
                                          }) {
    const panelRef = useRef(null);
    const closeBtnRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        closeBtnRef.current?.focus();

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKey);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open || !draft) return null;

    function updateWeekDay(dayKey, field, value) {
        onChange({
            ...draft,
            week: {
                ...draft.week,
                [dayKey]: { ...draft.week[dayKey], [field]: value },
            },
        });
    }

    function applySameHoursToWeekdays() {
        const mon = draft.week.mon;
        const next = { ...draft.week };

        ["mon", "tue", "wed", "thu", "fri"].forEach((k) => {
            next[k] = {
                ...next[k],
                isOff: mon.isOff,
                start: mon.start,
                end: mon.end,
            };
        });

        onChange({ ...draft, week: next });
    }

    function onPhotoPick(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Избери валидна слика: JPG, PNG или WebP.");
            e.target.value = "";
            return;
        }

        if (draft.photoPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(draft.photoPreview);
        }

        onChange({
            ...draft,
            photoFile: file,
            photoPreview: URL.createObjectURL(file),
            photoCleared: false,
        });
    }

    function clearPhoto() {
        if (draft.photoPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(draft.photoPreview);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        onChange({
            ...draft,
            photoFile: null,
            photoPreview: null,
            photoCleared: true,
        });
    }

    function restoreOriginalPhoto() {
        if (draft.photoPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(draft.photoPreview);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        onChange({
            ...draft,
            photoFile: null,
            photoPreview: draft.originalProfilePicture || null,
            photoCleared: false,
        });
    }

    const hasVisiblePhoto = Boolean(draft.photoPreview);
    const hasOriginalPhoto = Boolean(draft.originalProfilePicture);

    return (
        <div
            className="emp-modal"
            role="presentation"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="emp-modal__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="emp-modal-title"
                ref={panelRef}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="emp-modal__header">
                    <h2 id="emp-modal-title" className="emp-modal__title">
                        Уреди вработен
                    </h2>

                    <button
                        type="button"
                        ref={closeBtnRef}
                        className="emp-modal__x"
                        onClick={onClose}
                        aria-label="Затвори"
                    >
                        ×
                    </button>
                </div>

                <p className="emp-modal__subtitle">
                    <strong>{draft.name}</strong>
                </p>

                <div className="emp-modal__body">
                    <div className="emp-modal__grid2">
                        <div className="emp-modal__field">
                            <label htmlFor="emp-dept">Оддел</label>
                            <input
                                id="emp-dept"
                                type="text"
                                value={draft.dept}
                                onChange={(e) =>
                                    onChange({ ...draft, dept: e.target.value })
                                }
                                autoComplete="organization"
                            />
                        </div>

                        <div className="emp-modal__field">
                            <label htmlFor="emp-position">Позиција</label>
                            <input
                                id="emp-position"
                                type="text"
                                value={draft.position}
                                onChange={(e) =>
                                    onChange({ ...draft, position: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <fieldset className="emp-modal__fieldset">
                        <legend>Работна смена за неделата</legend>

                        <p className="emp-modal__hint">
                            За секој ден одреди почеток и крај или означи дека е слободен.
                        </p>

                        <button
                            type="button"
                            className="emp-modal__linkish"
                            onClick={applySameHoursToWeekdays}
                        >
                            Примени ги часовите од понеделник на сите работни денови (Пон–Пет)
                        </button>

                        <div className="emp-modal__week">
                            <div className="emp-modal__week-head" aria-hidden>
                                <span>Ден</span>
                                <span>Слободен</span>
                                <span>Од</span>
                                <span>До</span>
                            </div>

                            {WEEK_ROWS.map(({ key, label }) => {
                                const row = draft.week[key];

                                return (
                                    <div key={key} className="emp-modal__week-row">
                                        <span className="emp-modal__week-day">{label}</span>

                                        <label className="emp-modal__week-off">
                                            <input
                                                type="checkbox"
                                                checked={row.isOff}
                                                onChange={(e) =>
                                                    updateWeekDay(key, "isOff", e.target.checked)
                                                }
                                            />
                                            <span>слободен</span>
                                        </label>

                                        <input
                                            type="time"
                                            className="emp-modal__week-time"
                                            value={row.start}
                                            disabled={row.isOff}
                                            onChange={(e) =>
                                                updateWeekDay(key, "start", e.target.value)
                                            }
                                        />

                                        <input
                                            type="time"
                                            className="emp-modal__week-time"
                                            value={row.end}
                                            disabled={row.isOff}
                                            onChange={(e) =>
                                                updateWeekDay(key, "end", e.target.value)
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </fieldset>

                    <fieldset className="emp-modal__fieldset">
                        <legend>Фотографија за препознавање на лице</legend>

                        <p className="emp-modal__hint">
                            Поддржани се JPG, PNG или WebP. Сликата се користи како референтна
                            фотографија при check-in/check-out со камера.
                        </p>

                        {hasOriginalPhoto && !draft.photoCleared ? (
                            <p className="emp-modal__hint emp-modal__hint--info">
                                За овој вработен веќе постои регистрирана слика. Избери нова
                                фотографија за да ја замениш.
                            </p>
                        ) : null}

                        {draft.photoCleared ? (
                            <p className="emp-modal__hint emp-modal__hint--info">
                                Сликата ќе биде отстранета кога ќе кликнеш „Зачувај“.
                            </p>
                        ) : null}

                        <div className="emp-modal__photo">
                            <div className="emp-modal__photo-preview">
                                {hasVisiblePhoto ? (
                                    <img
                                        src={draft.photoPreview}
                                        alt="Фотографија за препознавање лице"
                                        className="emp-modal__photo-img"
                                    />
                                ) : (
                                    <span className="emp-modal__photo-placeholder">
                    Нема избрана фотографија
                  </span>
                                )}
                            </div>

                            <div className="emp-modal__photo-actions">
                                <label className="employees__btn employees__btn--outline emp-modal__file-label">
                                    Избери фајл
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="emp-modal__file"
                                        onChange={onPhotoPick}
                                    />
                                </label>

                                {hasVisiblePhoto ? (
                                    <button
                                        type="button"
                                        className="emp-modal__linkish"
                                        onClick={clearPhoto}
                                    >
                                        Отстрани слика
                                    </button>
                                ) : null}

                                {draft.photoCleared && hasOriginalPhoto ? (
                                    <button
                                        type="button"
                                        className="emp-modal__linkish"
                                        onClick={restoreOriginalPhoto}
                                    >
                                        Врати ја постоечката слика
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </fieldset>
                </div>

                <div className="emp-modal__footer">
                    <button
                        type="button"
                        className="employees__btn employees__btn--outline"
                        onClick={onClose}
                    >
                        Откажи
                    </button>

                    <button
                        type="button"
                        className="employees__btn employees__btn--primary"
                        onClick={onSave}
                    >
                        Зачувај
                    </button>
                </div>
            </div>
        </div>
    );
}