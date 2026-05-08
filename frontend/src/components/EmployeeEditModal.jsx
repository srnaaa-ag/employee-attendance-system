import { useEffect, useRef, useState } from "react";
import EmployeeLocationMap from "./EmployeeLocationMap.jsx";

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
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        if (open) {
            setMapReady(true);
        } else {
            setMapReady(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

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

    const handleLocationChange = (lat, lng) => {
        onChange({
            ...draft,
            allowedLatitude: lat,
            allowedLongitude: lng,
        });
    };

    const position = [
        Number(draft.allowedLatitude) || 41.9981,
        Number(draft.allowedLongitude) || 21.4254,
    ];

    return (
        <div
            className="emp-modal"
            role="presentation"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="emp-modal__panel emp-modal__panel--wide"
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
                    <fieldset className="emp-modal__fieldset">
                        <legend>Основни податоци</legend>

                        <div className="emp-modal__grid2">
                            <div className="emp-modal__field">
                                <label htmlFor="emp-first-name">Име</label>
                                <input
                                    id="emp-first-name"
                                    type="text"
                                    value={draft.firstName}
                                    onChange={(e) =>
                                        onChange({ ...draft, firstName: e.target.value })
                                    }
                                />
                            </div>

                            <div className="emp-modal__field">
                                <label htmlFor="emp-last-name">Презиме</label>
                                <input
                                    id="emp-last-name"
                                    type="text"
                                    value={draft.lastName}
                                    onChange={(e) =>
                                        onChange({ ...draft, lastName: e.target.value })
                                    }
                                />
                            </div>
                        </div>

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

                        <div className="emp-modal__field">
                            <label htmlFor="emp-employment-date">Датум на вработување</label>
                            <input
                                id="emp-employment-date"
                                type="date"
                                value={draft.employmentDate}
                                onChange={(e) =>
                                    onChange({ ...draft, employmentDate: e.target.value })
                                }
                            />
                        </div>
                    </fieldset>

                    <fieldset className="emp-modal__fieldset">
                        <legend>Работно време</legend>

                        <p className="emp-modal__hint">
                            Ова работно време ќе се прикажува во евиденцијата и ќе се користи
                            за проверка на доцнење.
                        </p>

                        <div className="emp-modal__grid2">
                            <div className="emp-modal__field">
                                <label htmlFor="emp-work-start">Почеток</label>
                                <input
                                    id="emp-work-start"
                                    type="time"
                                    value={draft.workStartTime || "08:00"}
                                    onChange={(e) =>
                                        onChange({ ...draft, workStartTime: e.target.value })
                                    }
                                />
                            </div>

                            <div className="emp-modal__field">
                                <label htmlFor="emp-work-end">Крај</label>
                                <input
                                    id="emp-work-end"
                                    type="time"
                                    value={draft.workEndTime || "16:00"}
                                    onChange={(e) =>
                                        onChange({ ...draft, workEndTime: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="emp-modal__fieldset">
                        <legend>Локација за евиденција на присуство</legend>

                        <p className="emp-modal__hint">
                            Кликни на мапата или влечи го маркерот за да ја одредиш
                            дозволената локација за овој вработен.
                        </p>

                        {mapReady ? (
                            <div style={{ marginBottom: "1rem" }}>
                                <EmployeeLocationMap
                                    position={position}
                                    radius={Number(draft.allowedRadiusMeters) || 100}
                                    onLocationChange={handleLocationChange}
                                />
                            </div>
                        ) : null}

                        <div className="emp-modal__field">
                            <label htmlFor="edit-emp-radius">Дозволен радиус (во метри)</label>
                            <input
                                id="edit-emp-radius"
                                type="number"
                                step="10"
                                min="10"
                                value={draft.allowedRadiusMeters}
                                onChange={(e) =>
                                    onChange({
                                        ...draft,
                                        allowedRadiusMeters:
                                            parseFloat(e.target.value) || 100,
                                    })
                                }
                            />
                        </div>

                        <div className="emp-modal__grid2">
                            <div className="emp-modal__field">
                                <label htmlFor="edit-emp-lat">Latitude</label>
                                <input
                                    id="edit-emp-lat"
                                    type="text"
                                    readOnly
                                    style={{ backgroundColor: "#f5f5f5" }}
                                    value={
                                        Number.isFinite(Number(draft.allowedLatitude))
                                            ? Number(draft.allowedLatitude).toFixed(6)
                                            : ""
                                    }
                                />
                            </div>

                            <div className="emp-modal__field">
                                <label htmlFor="edit-emp-lng">Longitude</label>
                                <input
                                    id="edit-emp-lng"
                                    type="text"
                                    readOnly
                                    style={{ backgroundColor: "#f5f5f5" }}
                                    value={
                                        Number.isFinite(Number(draft.allowedLongitude))
                                            ? Number(draft.allowedLongitude).toFixed(6)
                                            : ""
                                    }
                                />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="emp-modal__fieldset">
                        <legend>Фотографија за препознавање на лице</legend>

                        <p className="emp-modal__hint">
                            Поддржани се JPG, PNG или WebP. Сликата се користи како
                            референтна фотографија при check-in/check-out со камера.
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