import { useEffect, useMemo, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function zoomForRadiusMeters(radiusM) {
  if (radiusM >= 15000) return 10;
  if (radiusM >= 8000) return 11;
  if (radiusM >= 4000) return 12;
  if (radiusM >= 1500) return 13;
  return 14;
}

/**
 * @param {{ lat: number; lng: number }} workplace
 * @param {number} radiusM
 * @param {{ lat: number; lng: number; inZone: boolean } | null} userLocation
 */
function MapViewController({ workplace, radiusM, userLocation }) {
  const map = useMap();

  useEffect(() => {
    const center = L.latLng(workplace.lat, workplace.lng);
    if (userLocation) {
      const user = L.latLng(userLocation.lat, userLocation.lng);
      const bounds = L.latLngBounds(user, center);
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16, animate: true });
    } else {
      map.setView(center, zoomForRadiusMeters(radiusM), { animate: false });
    }
  }, [map, workplace.lat, workplace.lng, radiusM, userLocation?.lat, userLocation?.lng]);

  return null;
}

function AttendanceLocationMapInner({ workplace, radiusM, userLocation }) {
  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: "attendance-map-user-marker",
        html: `<div class="attendance-map-user-dot" aria-hidden="true"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    []
  );

  return (
    <MapContainer
      center={[workplace.lat, workplace.lng]}
      zoom={zoomForRadiusMeters(radiusM)}
      className="attendance__map-leaflet"
      scrollWheelZoom={false}
      aria-label="Мапа — работно место и твоја позиција"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={[workplace.lat, workplace.lng]}
        radius={radiusM}
        pathOptions={{
          color: "#243c7c",
          fillColor: "#243c7c",
          fillOpacity: 0.12,
          weight: 2,
        }}
      />
      <Marker position={[workplace.lat, workplace.lng]}>
        <Popup>
          Работно место
          <br />
          <span className="attendance-map-popup-muted">Центар на дозволената зона</span>
        </Popup>
      </Marker>
      {userLocation ? (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            Твоја позиција
            <br />
            <span className="attendance-map-popup-muted">
              {userLocation.inZone ? "Во дозволената зона" : "Надвор од зоната"}
            </span>
          </Popup>
        </Marker>
      ) : null}
      <MapViewController workplace={workplace} radiusM={radiusM} userLocation={userLocation} />
    </MapContainer>
  );
}

/**
 * @param {{
 *   workplace: { lat: number; lng: number };
 *   radiusM: number;
 *   userLocation: { lat: number; lng: number; inZone: boolean } | null;
 * }} props
 */
export default function AttendanceLocationMap({ workplace, radiusM, userLocation }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="attendance__map attendance__map--leaflet-loading" aria-hidden />;
  }

  return (
    <AttendanceLocationMapInner workplace={workplace} radiusM={radiusM} userLocation={userLocation} />
  );
}
