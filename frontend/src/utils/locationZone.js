/** Работно место fallback, ако employee нема зачувана локација */
export function getWorkplace() {
  return {
    lat: Number(import.meta.env.VITE_WORKPLACE_LAT ?? 41.9965),
    lng: Number(import.meta.env.VITE_WORKPLACE_LNG ?? 21.4311),
  };
}

export function getMaxRadiusMeters() {
  return Number(import.meta.env.VITE_WORKPLACE_RADIUS_M ?? 5000);
}

export function getDefaultWorkplaceZone() {
  return {
    lat: getWorkplace().lat,
    lng: getWorkplace().lng,
    radiusM: getMaxRadiusMeters(),
  };
}

export function getEmployeeWorkplaceZone(profile) {
  const lat = Number(
      profile?.allowed_latitude ??
      profile?.allowedLatitude ??
      profile?.employee?.allowed_latitude ??
      profile?.employee?.allowedLatitude
  );

  const lng = Number(
      profile?.allowed_longitude ??
      profile?.allowedLongitude ??
      profile?.employee?.allowed_longitude ??
      profile?.employee?.allowedLongitude
  );

  const radiusM = Number(
      profile?.allowed_radius_meters ??
      profile?.allowedRadiusMeters ??
      profile?.employee?.allowed_radius_meters ??
      profile?.employee?.allowedRadiusMeters
  );

  if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radiusM) && radiusM > 0) {
    return { lat, lng, radiusM };
  }

  return getDefaultWorkplaceZone();
}

function toRad(d) {
  return (d * Math.PI) / 180;
}

/** Растојание во метри помеѓу две WGS84 точки */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isWithinWorkplace(lat, lng, workplaceZone = getDefaultWorkplaceZone()) {
  return (
      haversineMeters(lat, lng, workplaceZone.lat, workplaceZone.lng) <=
      workplaceZone.radiusM
  );
}

/**
 * Faster geolocation for attendance scanning.
 * maximumAge allows browser to reuse a recent location instead of waiting every time.
 */
export function requestGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Геолокацијата не е поддржана во овој прелистувач."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 7000,
      maximumAge: 60000,
    });
  });
}