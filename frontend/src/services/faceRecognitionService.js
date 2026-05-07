import * as faceapi from "face-api.js";
import { fetchWithAuth } from "./api.js";

/**
 * CDN weights by default.
 * For faster local loading, later you can put the models in frontend/public/models
 * and set VITE_FACE_API_MODELS_URL=/models
 */
const MODEL_BASE =
    import.meta.env.VITE_FACE_API_MODELS_URL ??
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

/**
 * Smaller inputSize = faster detection.
 * 416 is more accurate but slower.
 * 320 is usually good enough and faster for webcam use.
 */
const DETECTOR_INPUT_SIZE = Number(import.meta.env.VITE_FACE_DETECTOR_INPUT_SIZE) || 320;
const DETECTOR_SCORE_THRESHOLD = Number(import.meta.env.VITE_FACE_DETECTOR_SCORE_THRESHOLD) || 0.5;

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  scoreThreshold: DETECTOR_SCORE_THRESHOLD,
  inputSize: DETECTOR_INPUT_SIZE,
});

let modelsLoadPromise = null;

/**
 * Cache descriptors for reference images.
 * This prevents recalculating the employee face descriptor every time scan starts.
 */
const referenceDescriptorCache = new Map();

export function getMatchThreshold() {
  const threshold = Number(import.meta.env.VITE_FACE_MATCH_THRESHOLD);
  return Number.isFinite(threshold) && threshold > 0 && threshold < 1.5
      ? threshold
      : 0.55;
}

export async function loadFaceApiModels() {
  if (!modelsLoadPromise) {
    modelsLoadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE),
    ]);
  }

  await modelsLoadPromise;
}

/**
 * @param {string} imageSrc data URL, http(s) URL, or path fetchable by face-api
 * @returns {Promise<Float32Array>}
 */
export async function imageToFaceDescriptor(imageSrc) {
  if (!imageSrc || String(imageSrc).trim().length === 0) {
    throw new Error("NO_REFERENCE_IMAGE");
  }

  const cacheKey = String(imageSrc);

  if (referenceDescriptorCache.has(cacheKey)) {
    return referenceDescriptorCache.get(cacheKey);
  }

  await loadFaceApiModels();

  const img = await faceapi.fetchImage(imageSrc);

  const detection = await faceapi
      .detectSingleFace(img, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

  if (!detection) {
    throw new Error("NO_FACE_IN_REFERENCE");
  }

  referenceDescriptorCache.set(cacheKey, detection.descriptor);

  return detection.descriptor;
}

/**
 * @param {faceapi.Box} box
 * @param {HTMLVideoElement} videoEl
 */
export function boxToPercent(box, videoEl) {
  const videoWidth = videoEl.videoWidth;
  const videoHeight = videoEl.videoHeight;

  if (!videoWidth || !videoHeight) return null;

  return {
    left: (box.x / videoWidth) * 100,
    top: (box.y / videoHeight) * 100,
    width: (box.width / videoWidth) * 100,
    height: (box.height / videoHeight) * 100,
  };
}

/**
 * @param {HTMLVideoElement} videoEl
 * @param {Float32Array} referenceDescriptor
 */
export async function detectLiveRecognition(videoEl, referenceDescriptor) {
  const threshold = getMatchThreshold();

  const detections = await faceapi
      .detectAllFaces(videoEl, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptors();

  if (detections.length === 0) {
    return { kind: "no_face" };
  }

  if (detections.length > 1) {
    const box = boxToPercent(detections[0].detection.box, videoEl);

    return {
      kind: "multiple_faces",
      count: detections.length,
      box,
    };
  }

  const detection = detections[0];

  const distance = faceapi.euclideanDistance(
      referenceDescriptor,
      detection.descriptor
  );

  const box = boxToPercent(detection.detection.box, videoEl);
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
 * Optional helper if you ever need to clear cached face descriptors,
 * for example after changing an employee image.
 */
export function clearFaceDescriptorCache() {
  referenceDescriptorCache.clear();
}

/**
 * JSON body.
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