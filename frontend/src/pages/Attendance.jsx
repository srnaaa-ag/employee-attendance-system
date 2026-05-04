import { useCallback, useEffect, useRef, useState } from "react";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";
import { IconCamera, IconLogout } from "../components/icons/NavIcons.jsx";
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

function MapPin() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" aria-hidden>
      <path
        d="M18 2C11.4 2 6 7.2 6 13.4c0 7.4 12 26.6 12 26.6S30 20.8 30 13.4C30 7.2 24.6 2 18 2z"
        fill="#c41e3a"
        stroke="#9a1830"
        strokeWidth="1"
      />
      <circle cx="18" cy="14" r="4.5" fill="#ffffff" />
    </svg>
  );
}

function CheckMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6l2.2 2.2L9.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** [x,y] topLeft / bottomRight → проценти во прегледот */
function faceBoxToPercent(face, videoEl) {
  const tl = face.topLeft;
  const br = face.bottomRight;
  if (!Array.isArray(tl) || !Array.isArray(br)) return null;
  const [x0, y0] = tl;
  const [x1, y1] = br;
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh) return null;
  const left = (Math.min(x0, x1) / vw) * 100;
  const top = (Math.min(y0, y1) / vh) * 100;
  const width = (Math.abs(x1 - x0) / vw) * 100;
  const height = (Math.abs(y1 - y0) / vh) * 100;
  return { left, top, width, height };
}

let blazefaceModelPromise = null;

async function loadFaceModel() {
  await tf.ready();
  if (!blazefaceModelPromise) {
    blazefaceModelPromise = blazeface.load({ scoreThreshold: 0.65, maxFaces: 2 });
  }
  return blazefaceModelPromise;
}

export default function Attendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const streakRef = useRef(0);
  const locationOkRef = useRef(false);
  const scanFinishedRef = useRef(false);

  const [streamActive, setStreamActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(/** @type {null | 'success' | 'error'} */ (null));
  const [faceBox, setFaceBox] = useState(/** @type {null | { left: number; top: number; width: number; height: number }} */ (null));
  const [locationInfo, setLocationInfo] = useState(
    /** @type {null | { lat: number; lng: number; accuracy: number; inZone: boolean }} */ (null)
  );
  const [scanError, setScanError] = useState(/** @type {null | string} */ (null));

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
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

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
      stopStream();
    },
    [stopStream]
  );

  const startScan = async () => {
    scanFinishedRef.current = false;
    setScanResult(null);
    setScanError(null);
    setLoadingModel(true);
    streakRef.current = 0;
    locationOkRef.current = false;
    setLocationInfo(null);

    try {
      const pos = await requestGeolocation();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const inZone = isWithinWorkplace(lat, lng);
      locationOkRef.current = inZone;
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
        if (c === 1) msg = "Локацијата е одбиена.";
        else if (c === 2) msg = "Позицијата не е достапна.";
        else if (c === 3) msg = "Истече времето за локација.";
      } else if (e instanceof Error) msg = e.message;
      setScanError(msg);
      setScanResult("error");
      return;
    }

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

    let model;
    try {
      model = await loadFaceModel();
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setLoadingModel(false);
      setScanError("Моделот за препознавање на лице не може да се вчита (провери интернет).");
      setScanResult("error");
      return;
    }

    setLoadingModel(false);
    setStreamActive(true);
    setScanning(true);

    timeoutRef.current = window.setTimeout(() => {
        finishScan(false);
        }, SCAN_TIMEOUT_MS);

    detectIntervalRef.current = window.setInterval(async () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      try {
        const faces = await model.estimateFaces(v, false, false);
        if (faces.length > 0) {
          const box = faceBoxToPercent(faces[0], v);
          setFaceBox(box);
          streakRef.current += 1;
          if (streakRef.current >= FACE_STREAK) {
              if (locationOkRef.current) finishScan(true);
              else finishScan(false);
          }
        } else {
          streakRef.current = 0;
          setFaceBox(null);
        }
      } catch {
        streakRef.current = 0;
      }
    }, 200);
  };

    const handleCheckout = () => {
    scanFinishedRef.current = false;
    stopStream();
    setScanResult(null);
    setScanError(null);
    setLocationInfo(null);
    locationOkRef.current = false;
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
            <div className="attendance__map" role="img" aria-label="Мапа на локација">
              <div className="attendance__map-pattern" aria-hidden />
              <div className="attendance__map-pin">
                <MapPin />
                <span className="attendance__map-label">Работно место</span>
              </div>
            </div>
            {locationInfo && (
              <p className="attendance__coords">
                {locationInfo.lat.toFixed(5)}, {locationInfo.lng.toFixed(5)}
                {locationInfo.accuracy ? ` (±${Math.round(locationInfo.accuracy)} m)` : ""}
              </p>
            )}
            <p className="attendance__zone-hint">
              Дозволена зона: ~{Math.round(radius / 1000)} km околу ({wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}) — прилагоди во{" "}
              <code className="attendance__code">.env</code> (VITE_WORKPLACE_LAT, VITE_WORKPLACE_LNG,
              VITE_WORKPLACE_RADIUS_M).
            </p>
            {locationInfo ? (
              <div className={locationInfo.inZone ? "attendance__loc-ok" : "attendance__loc-bad"}>
                <span className={locationInfo.inZone ? "attendance__loc-icon" : "attendance__loc-icon attendance__loc-icon--bad"}>
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
            {scanResult === "success" && <div className="attendance__pill attendance__pill--ok">{SUCCESS_MSG}</div>}
            {scanResult === "error" && (
              <div className="attendance__pill attendance__pill--error">{FAIL_MSG}</div>
            )}
            {scanResult === null && <div className="attendance__pill-hint">Скенирај лице и дозволи локација за статус.</div>}
            <p className="attendance__shift">Работно време: 08:00 - 16:00</p>
            <p className="attendance__hint">Имате 2 чекори за евиденција</p>
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
