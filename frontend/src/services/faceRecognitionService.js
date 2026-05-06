import * as faceapi from "face-api.js";
import { fetchWithAuth } from "./api.js";

/** CDN weights (no backend / no extra public files required). Override with VITE_FACE_API_MODELS_URL if needed. */
const MODEL_BASE =
  import.meta.env.VITE_FACE_API_MODELS_URL ??
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

let modelsLoadPromise = null;

export function getMatchThreshold() {
  const t = Number(import.meta.env.VITE_FACE_MATCH_THRESHOLD);
  return Number.isFinite(t) && t > 0 && t < 1.5 ? t : 0.55;
}

export async function loadFaceApiModels() {
  if (!modelsLoadPromise) {
    modelsLoadPromise = (async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE);
    })();
  }
  await modelsLoadPromise;
}

/**
 * @param {string} imageSrc data URL, http(s) URL, or path fetchable by face-api
 * @returns {Promise<Float32Array>}
 */
export async function imageToFaceDescriptor(imageSrc) {
  const img = await faceapi.fetchImage(imageSrc);
  const det = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5, inputSize: 416 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!det) {
    throw new Error("NO_FACE_IN_REFERENCE");
  }
  return det.descriptor;
}

/**
 * @param {faceapi.Box} box
 * @param {HTMLVideoElement} videoEl
 */
export function boxToPercent(box, videoEl) {
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh) return null;
  return {
    left: (box.x / vw) * 100,
    top: (box.y / vh) * 100,
    width: (box.width / vw) * 100,
    height: (box.height / vh) * 100,
  };
}

const detectorOptions = () =>
  new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5, inputSize: 416 });

/**
 * @param {HTMLVideoElement} videoEl
 * @param {Float32Array} referenceDescriptor
 */
export async function detectLiveRecognition(videoEl, referenceDescriptor) {
  const threshold = getMatchThreshold();
  const detections = await faceapi
    .detectAllFaces(videoEl, detectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    return { kind: "no_face" };
  }
  if (detections.length > 1) {
    const box = boxToPercent(detections[0].detection.box, videoEl);
    return { kind: "multiple_faces", count: detections.length, box };
  }

  const d = detections[0];
  const distance = faceapi.euclideanDistance(referenceDescriptor, d.descriptor);
  const box = boxToPercent(d.detection.box, videoEl);
  const match = distance < threshold;
  const confidence = Math.max(0, Math.min(1, 1 - distance / 1.2));

  return {
    kind: "single",
    match,
    distance,
    confidence,
    box,
  };
}

/**
 * JSON body (avoid long query strings). Backend contract is expected to match this shape.
 * @param {{
 *   recognitionSuccessful: boolean;
 *   latitude: number;
 *   longitude: number;
 *   distance: number | null;
 *   confidence: number | null;
 *   timestamp: string;
 *   employeeId: number | null;
 * }} body
 */
export async function reportFaceRecognitionResult(body) {
  return fetchWithAuth("/suspicious-activity/check-face-recognition", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
