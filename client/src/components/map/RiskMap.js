"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, ImageOverlay, useMapEvents } from "react-leaflet";
import { fetchBoundary, HEATMAP_URL, HEATMAP_BOUNDS } from "@/lib/api/mapClient";
import { RISK_COLORS } from "./risk";

// Clicking empty map space analyses that exact spot
function ClickToAnalyse({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// India map with one coloured pointer per ML-scored zone
export default function RiskMap({ zones, visible, selected, onPick, showHeat = true, showPoints = true }) {
  const [boundary, setBoundary] = useState(null);
  useEffect(() => { fetchBoundary().then(setBoundary).catch(() => {}); }, []);

  return (
    <MapContainer center={[22.5, 80]} zoom={5} minZoom={4} className="h-full w-full rounded-xl z-0">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {boundary && <GeoJSON data={boundary} style={{ color: "#4f46e5", weight: 1.5, fillOpacity: 0 }} />}
      {/* Smooth ML risk surface (green = low, red = severe) */}
      {showHeat && <ImageOverlay url={HEATMAP_URL} bounds={HEATMAP_BOUNDS} opacity={0.85} />}
      <ClickToAnalyse onPick={onPick} />

      {showPoints && zones.filter((z) => visible[z.risk_level]).map((z) => (
        <CircleMarker
          key={`${z.lat},${z.lon}`}
          center={[z.lat, z.lon]}
          radius={5}
          pathOptions={{ color: "#fff", weight: 1, fillColor: RISK_COLORS[z.risk_level], fillOpacity: 0.85 }}
          eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); onPick(z.lat, z.lon); } }}
        >
          <Tooltip>{z.risk_level} risk · {(z.risk_confidence * 100).toFixed(0)}%</Tooltip>
        </CircleMarker>
      ))}

      {/* Ring around whatever is open in the side pane */}
      {selected && (
        <CircleMarker center={selected} radius={12} pathOptions={{ color: "#4f46e5", weight: 3, fillOpacity: 0 }} />
      )}
    </MapContainer>
  );
}
