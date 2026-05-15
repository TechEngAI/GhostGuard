"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents, Circle, useMap } from "react-leaflet";
import { useEffect } from "react";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export default function GpsMapPicker({ lat, lng, radius, onChange }: { lat?: number; lng?: number; radius: number; onChange: (lat: number, lng: number) => void }) {
  const center: [number, number] = [lat || 6.5244, lng || 3.3792];
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[420px]">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onChange={onChange} />
        <Recenter lat={lat} lng={lng} />
        {lat && lng && (
          <>
            <Marker position={[lat, lng]} icon={icon} />
            <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: "#1D9E75", fillColor: "#1D9E75", fillOpacity: 0.12 }} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
