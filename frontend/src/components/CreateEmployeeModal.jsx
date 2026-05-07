import { useEffect, useRef, useState, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function zoomForRadiusMeters(radiusM) {
  if (radiusM >= 15000) return 10;
  if (radiusM >= 8000) return 11;
  if (radiusM >= 4000) return 12;
  if (radiusM >= 1500) return 13;
  return 14;
}

function LocationPicker({ position, onLocationChange }) {
  const [markerPosition, setMarkerPosition] = useState(position);
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setMarkerPosition(newPos);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setMarkerPosition([lat, lng]);
            onLocationChange(lat, lng);
          }
        },
      }),
      [onLocationChange]
  );

  return (
      <Marker
          position={markerPosition}
          draggable={true}
          ref={markerRef}
          eventHandlers={eventHandlers}
      />
  );
}

function LocationMapInner({ position, radius, onLocationChange }) {
  return (
      <MapContainer
          center={position}
          zoom={zoomForRadiusMeters(radius)}
          className="emp-modal__map-leaflet"
          scrollWheelZoom={true}
          style={{ height: "400px", width: "100%", borderRadius: "8px" }}
      >
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
            center={position}
            radius={radius}
            pathOptions={{
              color: "#243c7c",
              fillColor: "#243c7c",
              fillOpacity: 0.12,
              weight: 2,
            }}
        />

        <LocationPicker position={position} onLocationChange={onLocationChange} />
      </MapContainer>
  );
}

export default function CreateEmployeeModal({
                                              open,
                                              draft,
                                              onChange,
                                              onClose,
                                              onSave,
                                            }) {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
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

  const handleLocationChange = (lat, lng) => {
    onChange({
      ...draft,
      employee: {
        ...draft.employee,
        allowed_latitude: lat,
        allowed_longitude: lng,
      },
    });
  };

  const position = [
    draft.employee.allowed_latitude || 41.9981,
    draft.employee.allowed_longitude || 21.4254,
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
            aria-labelledby="create-emp-modal-title"
            ref={panelRef}
            onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="emp-modal__header">
            <h2 id="create-emp-modal-title" className="emp-modal__title">
              Додај нов вработен
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

          <div className="emp-modal__body">
            <fieldset className="emp-modal__fieldset">
              <legend>Кориснички податоци</legend>

              <div className="emp-modal__field">
                <label htmlFor="user-email">Email</label>
                <input
                    id="user-email"
                    type="email"
                    value={draft.user.email}
                    onChange={(e) =>
                        onChange({
                          ...draft,
                          user: { ...draft.user, email: e.target.value },
                        })
                    }
                    autoComplete="email"
                />
              </div>

              <div className="emp-modal__field">
                <label htmlFor="user-password">Лозинка</label>
                <input
                    id="user-password"
                    type="password"
                    value={draft.user.password}
                    onChange={(e) =>
                        onChange({
                          ...draft,
                          user: { ...draft.user, password: e.target.value },
                        })
                    }
                    autoComplete="new-password"
                />
              </div>
            </fieldset>

            <fieldset className="emp-modal__fieldset">
              <legend>Лични податоци</legend>

              <div className="emp-modal__grid2">
                <div className="emp-modal__field">
                  <label htmlFor="emp-firstname">Име</label>
                  <input
                      id="emp-firstname"
                      type="text"
                      value={draft.employee.first_name}
                      onChange={(e) =>
                          onChange({
                            ...draft,
                            employee: {
                              ...draft.employee,
                              first_name: e.target.value,
                            },
                          })
                      }
                  />
                </div>

                <div className="emp-modal__field">
                  <label htmlFor="emp-lastname">Презиме</label>
                  <input
                      id="emp-lastname"
                      type="text"
                      value={draft.employee.last_name}
                      onChange={(e) =>
                          onChange({
                            ...draft,
                            employee: {
                              ...draft.employee,
                              last_name: e.target.value,
                            },
                          })
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
                      value={draft.employee.department}
                      onChange={(e) =>
                          onChange({
                            ...draft,
                            employee: {
                              ...draft.employee,
                              department: e.target.value,
                            },
                          })
                      }
                  />
                </div>

                <div className="emp-modal__field">
                  <label htmlFor="emp-position">Позиција</label>
                  <input
                      id="emp-position"
                      type="text"
                      value={draft.employee.position}
                      onChange={(e) =>
                          onChange({
                            ...draft,
                            employee: {
                              ...draft.employee,
                              position: e.target.value,
                            },
                          })
                      }
                  />
                </div>
              </div>

              <div className="emp-modal__field">
                <label htmlFor="emp-employment-date">Датум на вработување</label>
                <input
                    id="emp-employment-date"
                    type="date"
                    value={draft.employee.employment_date}
                    onChange={(e) =>
                        onChange({
                          ...draft,
                          employee: {
                            ...draft.employee,
                            employment_date: e.target.value,
                          },
                        })
                    }
                />
              </div>
            </fieldset>

            <fieldset className="emp-modal__fieldset">
              <legend>Работно време</legend>

              <p className="emp-modal__hint">
                Ова работно време ќе се користи за attendance dashboard и за
                пресметка дали вработениот е задоцнет.
              </p>

              <div className="emp-modal__grid2">
                <div className="emp-modal__field">
                  <label htmlFor="emp-work-start">Почеток</label>
                  <input
                      id="emp-work-start"
                      type="time"
                      value={draft.employee.work_start_time || "08:00"}
                      onChange={(e) =>
                          onChange({
                            ...draft,
                            employee: {
                              ...draft.employee,
                              work_start_time: e.target.value,
                            },
                          })
                      }
                  />
                </div>

                <div className="emp-modal__field">
                  <label htmlFor="emp-work-end">Крај</label>
                  <input
                      id="emp-work-end"
                      type="time"
                      value={draft.employee.work_end_time || "16:00"}
                      onChange={(e) =>
                          onChange({
                            ...draft,
                            employee: {
                              ...draft.employee,
                              work_end_time: e.target.value,
                            },
                          })
                      }
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="emp-modal__fieldset">
              <legend>Локација за евиденција на присуство</legend>

              <p className="emp-modal__hint">
                Кликни на мапата или влечи го маркерот за да ја одредиш
                дозволената локација.
              </p>

              {mapReady && (
                  <div style={{ marginBottom: "1rem" }}>
                    <LocationMapInner
                        position={position}
                        radius={draft.employee.allowed_radius_meters || 100}
                        onLocationChange={handleLocationChange}
                    />
                  </div>
              )}

              <div className="emp-modal__field">
                <label htmlFor="emp-radius">Дозволен радиус (во метри)</label>
                <input
                    id="emp-radius"
                    type="number"
                    step="10"
                    min="10"
                    value={draft.employee.allowed_radius_meters}
                    onChange={(e) =>
                        onChange({
                          ...draft,
                          employee: {
                            ...draft.employee,
                            allowed_radius_meters:
                                parseFloat(e.target.value) || 100,
                          },
                        })
                    }
                />
              </div>

              <div className="emp-modal__grid2">
                <div className="emp-modal__field">
                  <label>Latitude</label>
                  <input
                      type="text"
                      value={draft.employee.allowed_latitude?.toFixed(6) || ""}
                      readOnly
                      style={{ backgroundColor: "#f5f5f5" }}
                  />
                </div>

                <div className="emp-modal__field">
                  <label>Longitude</label>
                  <input
                      type="text"
                      value={draft.employee.allowed_longitude?.toFixed(6) || ""}
                      readOnly
                      style={{ backgroundColor: "#f5f5f5" }}
                  />
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