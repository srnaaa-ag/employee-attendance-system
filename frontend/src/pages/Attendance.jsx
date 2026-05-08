import { useCallback, useEffect, useRef, useState } from "react";
import AttendanceLocationMap from "../components/AttendanceLocationMap.jsx";
import { IconCamera, IconLogout } from "../components/icons/NavIcons.jsx";
import { getMyProfile } from "../services/profileService.js";
import {
  checkIn,
  checkOut,
  getMyDashboard,
} from "../services/attendanceService.js";
import {
  detectLiveRecognition,
  imageToFaceDescriptor,
  loadFaceApiModels,
  reportFaceRecognitionResult,
} from "../services/faceRecognitionService.js";
import {
  getDefaultWorkplaceZone,
  getEmployeeWorkplaceZone,
  isWithinWorkplace,
  requestGeolocation,
} from "../utils/locationZone.js";
import "./Attendance.css";

const SUCCESS_MSG = "Успешно евидентирано!";
const FAIL_MSG = "Лицето не е препознато или локацијата не е дозволена!";
const FACE_STREAK = 5;
const SCAN_TIMEOUT_MS = 22000;
const DETECT_INTERVAL_MS = 280;

function CheckMini() {
  return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
            d="M2.5 6l2.2 2.2L9.5 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
      </svg>
  );
}

function normalizePhotoSource(value) {
  if (!value || String(value).trim().length === 0) return null;

  const photo = String(value).trim();

  if (photo.startsWith("data:image/")) return photo;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;

  if (photo.startsWith("/")) {
    return `http://localhost:8080${photo}`;
  }

  return photo;
}

function getProfilePhoto(profile) {
  return normalizePhotoSource(
      profile?.user?.profilePicture ??
      profile?.profilePicture ??
      profile?.employee?.user?.profilePicture ??
      profile?.employee?.profilePicture ??
      null
  );
}

function getProfileEmployeeId(profile) {
  const rawId =
      profile?.id ??
      profile?.employeeId ??
      profile?.employee?.id ??
      profile?.user?.employeeId ??
      null;

  if (rawId == null) return null;

  const id = Number(rawId);
  return Number.isFinite(id) ? id : null;
}

async function startCamera(videoRef, streamRef) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: false,
  });

  streamRef.current = stream;

  const video = videoRef.current;

  if (!video) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("Видео елементот не е достапен.");
  }

  video.srcObject = stream;
  await video.play();

  await new Promise((resolve) => {
    if (video.videoWidth > 0) resolve();
    else video.addEventListener("loadeddata", () => resolve(), { once: true });
  });

  return stream;
}

function getActionMessage(nextAction) {
  if (nextAction === "CHECK_OUT") {
    return "Скенирањето ќе направи check-out.";
  }

  if (nextAction === "DONE") {
    return "Денешната евиденција е веќе завршена.";
  }

  return "Скенирањето ќе направи check-in.";
}

export default function Attendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const streakRef = useRef(0);
  const locationOkRef = useRef(false);
  const scanFinishedRef = useRef(false);
  const locationCoordsRef = useRef(null);
  const employeeIdRef = useRef(null);
  const referenceDescriptorRef = useRef(null);
  const cachedPhotoRef = useRef(null);
  const lastMetricsRef = useRef(null);
  const detectBusyRef = useRef(false);
  const actionSubmittingRef = useRef(false);

  const dashboardRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [faceBox, setFaceBox] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [liveHint, setLiveHint] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [activeWorkplace, setActiveWorkplace] = useState(getDefaultWorkplaceZone());

  const nextAction = dashboard?.nextAction ?? "CHECK_IN";
  const isDoneToday = nextAction === "DONE";
  const workScheduleLabel =
      dashboard?.workScheduleLabel ??
      (dashboard?.workStartTime && dashboard?.workEndTime
          ? `${dashboard.workStartTime} - ${dashboard.workEndTime}`
          : "Се вчитува...");

  const stopStream = useCallback(() => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    streakRef.current = 0;
    detectBusyRef.current = false;
    actionSubmittingRef.current = false;

    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStreamActive(false);
    setScanning(false);
    setFaceBox(null);
    setLiveHint(null);
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboardLoading(true);
      const data = await getMyDashboard(10);
      dashboardRef.current = data;
      setDashboard(data);
    } catch (error) {
      console.error("Dashboard loading failed:", error);
      setScanError(error.message || "Не може да се вчита attendance status.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    loadFaceApiModels().catch((error) => {
      console.warn("Face API models preload failed:", error);
    });

    return () => stopStream();
  }, [loadDashboard, stopStream]);

  const sendRecognitionReport = useCallback(async (recognitionSuccessful) => {
    const coords = locationCoordsRef.current;
    const metrics = lastMetricsRef.current;
    const employeeId = employeeIdRef.current;

    if (!coords) return;

    const body = {
      recognitionSuccessful,
      latitude: coords.lat,
      longitude: coords.lng,
      distance: metrics?.distance ?? null,
      confidence: metrics?.confidence ?? null,
      timestamp: new Date().toISOString(),
      employeeId,
    };

    try {
      const res = await reportFaceRecognitionResult(body);

      if (!res.ok) {
        console.warn(
            "Face recognition report rejected:",
            res.status,
            await res.text().catch(() => "")
        );
      }
    } catch (error) {
      console.warn("Face recognition report failed:", error);
    }
  }, []);

  const finishScan = useCallback(
      (ok, customErrorMessage = null) => {
        if (scanFinishedRef.current) return;

        scanFinishedRef.current = true;

        if (detectIntervalRef.current) {
          clearInterval(detectIntervalRef.current);
          detectIntervalRef.current = null;
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setScanning(false);
        setScanResult(ok ? "success" : "error");

        if (ok) {
          setScanError(null);
        } else if (customErrorMessage) {
          setScanError(customErrorMessage);
        }

        void sendRecognitionReport(ok);
        stopStream();
      },
      [sendRecognitionReport, stopStream]
  );

  const prepareLocation = async (profilePromise) => {
    const [profile, position] = await Promise.all([
      profilePromise,
      requestGeolocation(),
    ]);

    const employeeWorkplace = getEmployeeWorkplaceZone(profile);
    setActiveWorkplace(employeeWorkplace);

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const inZone = isWithinWorkplace(lat, lng, employeeWorkplace);

    locationOkRef.current = inZone;
    locationCoordsRef.current = { lat, lng };

    setLocationInfo({
      lat,
      lng,
      accuracy: position.coords.accuracy ?? 0,
      inZone,
    });
  };

  const prepareReferenceDescriptor = async (profilePromise) => {
    const profile = await profilePromise;

    const employeeWorkplace = getEmployeeWorkplaceZone(profile);
    setActiveWorkplace(employeeWorkplace);

    const photo = getProfilePhoto(profile);

    if (!photo) {
      throw new Error(
          "Нема зачувана слика за препознавање лице. Администратор треба да додаде слика преку „Вработени“ → „Уреди“ → „Фотографија за препознавање на лице“."
      );
    }

    employeeIdRef.current = getProfileEmployeeId(profile);

    if (cachedPhotoRef.current === photo && referenceDescriptorRef.current) {
      return referenceDescriptorRef.current;
    }

    await loadFaceApiModels();

    const descriptor = await imageToFaceDescriptor(photo);

    cachedPhotoRef.current = photo;
    referenceDescriptorRef.current = descriptor;

    return descriptor;
  };

  const submitAttendanceAction = useCallback(async () => {
    const coords = locationCoordsRef.current;

    if (!coords) {
      throw new Error("Нема прочитана локација за евиденција.");
    }

    const action = dashboardRef.current?.nextAction ?? "CHECK_IN";

    if (action === "DONE") {
      throw new Error("Денешната евиденција е веќе завршена.");
    }

    if (action === "CHECK_OUT") {
      setLiveHint("Лицето и локацијата се потврдени. Се прави CHECK OUT...");
      const updatedDashboard = await checkOut(coords.lat, coords.lng);
      dashboardRef.current = updatedDashboard;
      setDashboard(updatedDashboard);
      return;
    }

    setLiveHint("Лицето и локацијата се потврдени. Се прави CHECK IN...");
    const updatedDashboard = await checkIn(coords.lat, coords.lng);
    dashboardRef.current = updatedDashboard;
    setDashboard(updatedDashboard);
  }, []);

  const beginDetectionLoop = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      finishScan(
          false,
          "Истече времето за скенирање. Обиди се повторно со подобро осветлување."
      );
    }, SCAN_TIMEOUT_MS);

    detectIntervalRef.current = window.setInterval(async () => {
      const videoElement = videoRef.current;
      const reference = referenceDescriptorRef.current;

      if (
          !videoElement ||
          videoElement.readyState < 2 ||
          !reference ||
          detectBusyRef.current ||
          actionSubmittingRef.current
      ) {
        return;
      }

      detectBusyRef.current = true;

      try {
        const result = await detectLiveRecognition(videoElement, reference);

        if (result.kind === "no_face") {
          streakRef.current = 0;
          setFaceBox(null);
          setLiveHint("Постави го лицето пред камера.");
          return;
        }

        if (result.kind === "multiple_faces") {
          streakRef.current = 0;
          setFaceBox(result.box ?? null);
          setLiveHint("Повеќе лица во кадар. Потребно е само едно лице пред камера.");
          return;
        }

        setFaceBox(result.box);
        lastMetricsRef.current = {
          distance: result.distance,
          confidence: result.confidence,
        };

        if (result.match) {
          streakRef.current += 1;
          setLiveHint("Лицето се препознава, остани мирно...");

          if (streakRef.current >= FACE_STREAK) {
            if (!locationOkRef.current) {
              finishScan(
                  false,
                  "Лицето е препознаено, но моменталната локација не е во дозволената зона на овој вработен."
              );
              return;
            }

            actionSubmittingRef.current = true;

            try {
              await submitAttendanceAction();
              finishScan(true);
            } catch (error) {
              finishScan(
                  false,
                  error instanceof Error
                      ? error.message
                      : "Неуспешно зачувување на attendance евиденција."
              );
            }
          }
        } else {
          streakRef.current = 0;
          setLiveHint("Лицето не се совпаѓа со зачуваната слика.");
        }
      } catch (error) {
        streakRef.current = 0;
        console.warn("Live face detection failed:", error);
      } finally {
        detectBusyRef.current = false;
      }
    }, DETECT_INTERVAL_MS);
  }, [finishScan, submitAttendanceAction]);

  const startScan = async () => {
    if (isDoneToday) {
      setScanResult("error");
      setScanError("Денешната евиденција е веќе завршена.");
      return;
    }

    scanFinishedRef.current = false;

    setScanResult(null);
    setScanError(null);
    setLiveHint("Се стартува камерата...");
    setLoadingModel(true);
    setLocationInfo(null);

    streakRef.current = 0;
    locationOkRef.current = false;
    locationCoordsRef.current = null;
    employeeIdRef.current = null;
    lastMetricsRef.current = null;
    actionSubmittingRef.current = false;

    try {
      await startCamera(videoRef, streamRef);
      setStreamActive(true);
      setLiveHint("Камерата е активна. Се подготвува препознавање и локација...");

      const profilePromise = getMyProfile(true);

      const locationPromise = prepareLocation(profilePromise).catch((error) => {
        let message = "Грешка при читање на локација.";

        if (typeof error === "object" && error !== null && "code" in error) {
          const code = error.code;

          if (code === 1) message = "Вклучете дозвола за локација во browser.";
          else if (code === 2) message = "Позицијата не е достапна.";
          else if (code === 3) message = "Истече времето за читање на локација.";
        } else if (error instanceof Error) {
          message = error.message;
        }

        throw new Error(message);
      });

      const descriptorPromise = prepareReferenceDescriptor(profilePromise).catch(
          (error) => {
            if (error instanceof Error && error.message === "NO_FACE_IN_REFERENCE") {
              throw new Error(
                  "На зачуваната слика не е детектирано лице. Администратор треба да прикачи појасна фотографија каде лицето е добро видливо."
              );
            }

            if (error instanceof Error) {
              throw error;
            }

            throw new Error(
                "Моделите или зачуваната слика не можат да се обработат. Провери интернет конекција и дали сликата е валидна."
            );
          }
      );

      await Promise.all([locationPromise, descriptorPromise]);

      if (scanFinishedRef.current) return;

      setLoadingModel(false);
      setScanning(true);
      setLiveHint("Скенирањето е активно. Постави го лицето пред камера.");

      beginDetectionLoop();
    } catch (error) {
      setLoadingModel(false);
      setScanning(false);
      setScanResult("error");

      const message =
          error instanceof Error
              ? error.message
              : "Камерата, локацијата или моделите не може да се стартуваат.";

      setScanError(message);
      stopStream();
    }
  };

  const resetScanState = () => {
    scanFinishedRef.current = false;
    stopStream();
    setScanResult(null);
    setScanError(null);
    setLocationInfo(null);
    locationOkRef.current = false;
    locationCoordsRef.current = null;
  };

  return (
      <div className="attendance">
        <div className="attendance__card">
          <h1 className="attendance__titlebar">Евиденција</h1>

          <div className="attendance__grid">
            <section className="attendance__col attendance__col--scan" aria-labelledby="att-scan-title">
              <h2 id="att-scan-title" className="attendance__col-title">
                Скенирај лице
              </h2>

              <div className={`attendance__preview ${streamActive ? "attendance__preview--live" : ""}`}>
                <video
                    ref={videoRef}
                    className="attendance__video"
                    playsInline
                    muted
                    autoPlay
                />

                {!streamActive && (
                    <>
                      <div className="attendance__preview-face" aria-hidden />
                      <div className="attendance__preview-frame" aria-hidden />
                    </>
                )}

                {streamActive && faceBox && (
                    <div
                        className="attendance__face-box"
                        style={{
                          left: `${faceBox.left}%`,
                          top: `${faceBox.top}%`,
                          width: `${faceBox.width}%`,
                          height: `${faceBox.height}%`,
                        }}
                    />
                )}

                {streamActive && <span className="attendance__live">LIVE</span>}
              </div>

              <div className="attendance__scan-bottom">
                {liveHint ? (
                    <p className="attendance__hint-live">{liveHint}</p>
                ) : (
                    <p className="attendance__scan-tip">
                        Стартувајте го скенирањето со <strong>CHECK IN</strong> или{' '}
                        <strong>CHECK OUT</strong> во колоната „Статус“{' '}
                        (дозволи камера и локација во прелистувачот).
                    </p>
                )}
              </div>
            </section>

            <section className="attendance__col attendance__col--map" aria-labelledby="att-map-title">
              <h2 id="att-map-title" className="attendance__col-title">
                Детекција на локација
              </h2>

              <div className="attendance__map-wrap">
                <AttendanceLocationMap
                    workplace={{
                      lat: activeWorkplace.lat,
                      lng: activeWorkplace.lng,
                    }}
                    radiusM={activeWorkplace.radiusM}
                    userLocation={
                      locationInfo
                          ? {
                            lat: locationInfo.lat,
                            lng: locationInfo.lng,
                            inZone: locationInfo.inZone,
                          }
                          : null
                    }
                />
              </div>

              {locationInfo && (
                  <p className="attendance__coords">
                    {locationInfo.lat.toFixed(5)}, {locationInfo.lng.toFixed(5)}
                    {locationInfo.accuracy
                        ? ` (±${Math.round(locationInfo.accuracy)} m)`
                        : ""}
                  </p>
              )}

              <p className="attendance__zone-hint">
                Дозволена зона: ~{Math.round(activeWorkplace.radiusM)} m околу локацијата на вработениот
              </p>

              {locationInfo ? (
                  <div
                      className={
                        locationInfo.inZone
                            ? "attendance__loc-ok"
                            : "attendance__loc-bad"
                      }
                  >
                <span
                    className={
                      locationInfo.inZone
                          ? "attendance__loc-icon"
                          : "attendance__loc-icon attendance__loc-icon--bad"
                    }
                >
                  {locationInfo.inZone ? <CheckMini /> : "!"}
                </span>
                    {locationInfo.inZone
                        ? "Локацијата е во дозволената зона за овој вработен"
                        : "Надвор од дозволената зона за овој вработен"}
                  </div>
              ) : (
                  <div className="attendance__loc-pending">
                    Локацијата се бара при скенирање…
                  </div>
              )}
            </section>

            <section className="attendance__col attendance__col--status" aria-labelledby="att-status-title">
              <h2 id="att-status-title" className="attendance__col-title">
                Статус
              </h2>

              <div className="attendance__status-panel">
                <p className="attendance__shift">
                  <span className="attendance__shift-label">Работно време</span>
                  <span className="attendance__shift-value">{workScheduleLabel}</span>
                </p>

                <ul className="attendance__status-list">
                  <li>
                      {dashboard?.todayCheckIn ? (
                          <>
                              <span className="attendance__status-k">Check-in денес</span>
                              <span className="attendance__status-v">{dashboard.todayCheckIn}</span>
                          </>
                      ) : (
                          <span className="attendance__status-muted">Нема check-in за денес.</span>
                      )}
                  </li>
                  {dashboard?.todayCheckOut ? (
                      <li>
                          <span className="attendance__status-k">Check-out денес</span>
                          <span className="attendance__status-v">{dashboard.todayCheckOut}</span>
                      </li>
                  ) : null}
                  {dashboard?.todayWorkedHours ? (
                      <li>
                          <span className="attendance__status-k">Работни часови</span>
                          <span className="attendance__status-v">{dashboard.todayWorkedHours}</span>
                      </li>
                  ) : null}
                </ul>
              </div>

              {scanResult === null && (
                  <div className="attendance__pill-hint">
                    {getActionMessage(nextAction)}
                  </div>
              )}

              {scanResult === "success" && (
                  <div className="attendance__alert attendance__alert--success" role="status">
                    {SUCCESS_MSG}
                  </div>
              )}

              {scanResult === "error" && (
                  <div className="attendance__alert attendance__alert--error" role="alert">
                      {scanError?.trim() ? scanError : FAIL_MSG}
                  </div>
              )}

              <div className="attendance__actions">
                <button
                    type="button"
                    className="attendance__btn-scan"
                    onClick={startScan}
                    disabled={
                        dashboardLoading ||
                        loadingModel ||
                        scanning ||
                        nextAction !== "CHECK_IN"
                    }
                >
                  <IconCamera size={20} />
                  CHECK IN
                </button>

                <button
                    type="button"
                    className="attendance__btn-checkout"
                    onClick={startScan}
                    disabled={
                        dashboardLoading ||
                        loadingModel ||
                        scanning ||
                        nextAction !== "CHECK_OUT"
                    }
                >
                  <IconLogout size={20} />
                  CHECK OUT
                </button>

                <button
                    type="button"
                    className="attendance__btn-reset"
                    onClick={resetScanState}
                    disabled={loadingModel || scanning}
                >
                  Ресетирај скенирање
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
  );
}