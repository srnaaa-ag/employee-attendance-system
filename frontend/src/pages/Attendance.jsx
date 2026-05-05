import { useCallback, useEffect, useRef, useState } from "react";
import AttendanceLocationMap from "../components/AttendanceLocationMap.jsx";
import { IconCamera, IconLogout } from "../components/icons/NavIcons.jsx";
import { getMyProfile } from "../services/profileService.js";
import {
  detectLiveRecognition,
  imageToFaceDescriptor,
  loadFaceApiModels,
  reportFaceRecognitionResult,
} from "../services/faceRecognitionService.js";
import {
  getMaxRadiusMeters,
  getWorkplace,
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

export default function Attendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const streakRef = useRef(0);
  const locationOkRef = useRef(false);
  const scanFinishedRef = useRef(false);
  const locationCoordsRef = useRef(/** @type {{ lat: number; lng: number } | null} */ (null));
  const employeeIdRef = useRef(/** @type {number | null} */ (null));
  const referenceDescriptorRef = useRef(/** @type {Float32Array | null} */ (null));
  const lastMetricsRef = useRef(/** @type {{ distance: number; confidence: number } | null} */ (null));
  const detectBusyRef = useRef(false);

  const [streamActive, setStreamActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(/** @type {null | "success" | "error"} */ (null));
  const [faceBox, setFaceBox] = useState(
    /** @type {null | { left: number; top: number; width: number; height: number }} */ (null)
  );
  const [locationInfo, setLocationInfo] = useState(
    /** @type {null | { lat: number; lng: number; accuracy: number; inZone: boolean }} */ (null)
  );
  const [scanError, setScanError] = useState(/** @type {null | string} */ (null));
  const [liveHint, setLiveHint] = useState(/** @type {null | string} */ (null));

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
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
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

  useEffect(() => () => stopStream(), [stopStream]);

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
        console.warn("Face recognition report rejected:", res.status, await res.text().catch(() => ""));
      }
    } catch (e) {
      console.warn("Face recognition report failed:", e);
    }
  }, []);

  const finishScan = useCallback(
    (ok) => {
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
      if (ok) setScanError(null);
      void sendRecognitionReport(ok);
      stopStream();
    },
    [sendRecognitionReport, stopStream]
  );

  const startScan = async () => {
    scanFinishedRef.current = false;
    setScanResult(null);
    setScanError(null);
    setLiveHint(null);
    setLoadingModel(true);
    streakRef.current = 0;
    locationOkRef.current = false;
    locationCoordsRef.current = null;
    employeeIdRef.current = null;
    referenceDescriptorRef.current = null;
    lastMetricsRef.current = null;
    setLocationInfo(null);

    try {
      const pos = await requestGeolocation();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const inZone = isWithinWorkplace(lat, lng);
      locationOkRef.current = inZone;
      locationCoordsRef.current = { lat, lng };
      setLocationInfo({
        lat,
        lng,
        accuracy: pos.coords.accuracy ?? 0,
        inZone,
      });
    } catch (e) {
      setLoadingModel(false);
      let msg = "Грешка при читање на локација.";
      if (typeof e === "object" && e !== null && "code" in e) {
        const c = /** @type {GeolocationPositionError} */ (e).code;
        if (c === 1) msg = "Вклучете локација.";
        else if (c === 2) msg = "Позицијата не е достапна.";
        else if (c === 3) msg = "Истече времето за локација.";
      } else if (e instanceof Error) msg = e.message;
      setScanError(msg);
      setScanResult("error");
      return;
    }

    let profile;
    try {
      profile = await getMyProfile();
    } catch {
      setLoadingModel(false);
      setScanError("Не можам да го вчитам профилот. Провери дали си најавен.");
      setScanResult("error");
      return;
    }

    const photo = profile?.user?.profilePicture;
    if (!photo || String(photo).trim().length === 0) {
      setLoadingModel(false);
      setScanError('Нема профилна слика. Прво додај слика во „Мој профил“.');
      setScanResult("error");
      return;
    }

    const empId = profile?.id;
    employeeIdRef.current = typeof empId === "number" ? empId : empId != null ? Number(empId) : null;

    let refDescriptor;
    try {
      await loadFaceApiModels();
      refDescriptor = await imageToFaceDescriptor(photo);
    } catch (e) {
      setLoadingModel(false);
      if (e instanceof Error && e.message === "NO_FACE_IN_REFERENCE") {
        setScanError("На профилната слика не е детектирано лице. Прикачи појасна фотографија.");
      } else {
        setScanError("Моделите или профилната слика не можат да се обработат (провери интернет).");
      }
      setScanResult("error");
      return;
    }
    referenceDescriptorRef.current = refDescriptor;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch {
      setLoadingModel(false);
      setScanError("Камерата не е достапна или пристапот е одбиен.");
      setScanResult("error");
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      setLoadingModel(false);
      setScanResult("error");
      return;
    }
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setLoadingModel(false);
      setScanResult("error");
      return;
    }

    await new Promise((resolve) => {
      if (video.videoWidth > 0) resolve(undefined);
      else video.addEventListener("loadeddata", () => resolve(undefined), { once: true });
    });

    setLoadingModel(false);
    setStreamActive(true);
    setScanning(true);

    timeoutRef.current = window.setTimeout(() => {
      finishScan(false);
    }, SCAN_TIMEOUT_MS);

    detectIntervalRef.current = window.setInterval(async () => {
      const v = videoRef.current;
      const refDesc = referenceDescriptorRef.current;
      if (!v || v.readyState < 2 || !refDesc || detectBusyRef.current) return;
      detectBusyRef.current = true;
      try {
        const result = await detectLiveRecognition(v, refDesc);
        if (result.kind === "no_face") {
          streakRef.current = 0;
          setFaceBox(null);
          setLiveHint(null);
          return;
        }
        if (result.kind === "multiple_faces") {
          streakRef.current = 0;
          setFaceBox(result.box ?? null);
          setLiveHint("Повеќе лица во кадар, потребно е едно лице пред камера.");
          return;
        }
        setLiveHint(null);
        setFaceBox(result.box);
        lastMetricsRef.current = { distance: result.distance, confidence: result.confidence };
        if (result.match) {
          streakRef.current += 1;
          if (streakRef.current >= FACE_STREAK) {
            if (locationOkRef.current) finishScan(true);
            else finishScan(false);
          }
        } else {
          streakRef.current = 0;
        }
      } catch {
        streakRef.current = 0;
      } finally {
        detectBusyRef.current = false;
      }
    }, DETECT_INTERVAL_MS);
  };

  const handleCheckout = () => {
    scanFinishedRef.current = false;
    stopStream();
    setScanResult(null);
    setScanError(null);
    setLocationInfo(null);
    locationOkRef.current = false;
    locationCoordsRef.current = null;
  };

  const wp = getWorkplace();
  const radius = getMaxRadiusMeters();

  return (
    <div className="attendance">
      <div className="attendance__card">
        <h1 className="attendance__titlebar">Евиденција</h1>

        <div className="attendance__grid">
          <section className="attendance__col" aria-labelledby="att-scan-title">
            <h2 id="att-scan-title" className="attendance__col-title">
              Скенирај лице
            </h2>
            <div className={`attendance__preview ${streamActive ? "attendance__preview--live" : ""}`}>
              <video ref={videoRef} className="attendance__video" playsInline muted autoPlay />
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
            <button
              type="button"
              className="attendance__btn-scan"
              onClick={startScan}
              disabled={loadingModel || scanning}
            >
              <IconCamera size={20} />
              {loadingModel ? "Подготовка…" : scanning ? "Скенирање…" : "Почни со скенирање"}
            </button>
            {liveHint && scanning && <p className="attendance__hint-live">{liveHint}</p>}
            {scanError && !scanning && scanResult === "error" && (
              <p className="attendance__scan-err" role="alert">
                {scanError}
              </p>
            )}
          </section>

          <section className="attendance__col" aria-labelledby="att-map-title">
            <h2 id="att-map-title" className="attendance__col-title">
              Детекција на локација
            </h2>
            <div className="attendance__map-wrap">
              <AttendanceLocationMap
                workplace={wp}
                radiusM={radius}
                userLocation={
                  locationInfo
                    ? { lat: locationInfo.lat, lng: locationInfo.lng, inZone: locationInfo.inZone }
                    : null
                }
              />
            </div>
            {locationInfo && (
              <p className="attendance__coords">
                {locationInfo.lat.toFixed(5)}, {locationInfo.lng.toFixed(5)}
                {locationInfo.accuracy ? ` (±${Math.round(locationInfo.accuracy)} m)` : ""}
              </p>
            )}
            <p className="attendance__zone-hint">
              Дозволена зона: ~{Math.round(radius / 1000)} km околу Скопје
            </p>
            {locationInfo ? (
              <div className={locationInfo.inZone ? "attendance__loc-ok" : "attendance__loc-bad"}>
                <span
                  className={
                    locationInfo.inZone ? "attendance__loc-icon" : "attendance__loc-icon attendance__loc-icon--bad"
                  }
                >
                  {locationInfo.inZone ? <CheckMini /> : "!"}
                </span>
                {locationInfo.inZone ? "Локацијата е во зоната" : "Надвор од дозволената зона"}
              </div>
            ) : (
              <div className="attendance__loc-pending">Локацијата се бара при скенирање…</div>
            )}
          </section>

          <section className="attendance__col" aria-labelledby="att-status-title">
            <h2 id="att-status-title" className="visually-hidden">
              Статус и акција
            </h2>
            <p className="attendance__shift">Работно време: 08:00 - 16:00</p>
            <p className="attendance__hint">Имате 2 чекори за евиденција</p>
            {scanResult === null && (
              <div className="attendance__pill-hint">Скенирај лице и дозволи локација за статус.</div>
            )}
            {scanResult === "success" && <div className="attendance__pill attendance__pill--ok">{SUCCESS_MSG}</div>}
            {scanResult === "error" && (
              <div className="attendance__pill attendance__pill--error">{FAIL_MSG}</div>
            )}
            <button type="button" className="attendance__btn-checkout" onClick={handleCheckout}>
              <IconLogout size={20} />
              CHECK OUT
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
