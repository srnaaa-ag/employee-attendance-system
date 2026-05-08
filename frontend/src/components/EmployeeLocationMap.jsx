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

export function zoomForRadiusMeters(radiusM) {
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

export default function EmployeeLocationMap({ position, radius, onLocationChange }) {
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
