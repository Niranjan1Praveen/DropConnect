// Browser-side helpers for the risk map. Map data is baked into /public/map-data;
// clicking a spot asks our own API for the ML verdict + Gemini explanation.
const DATA = "/map-data";

const json = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Map service error");
  return body;
};

// Pre-rendered heatmap image and the lat/lon box it covers
export const HEATMAP_URL = `${DATA}/heatmap.png`;
export const HEATMAP_BOUNDS = [[6.5, 67.5], [37.5, 97.5]];

export const fetchZones = () => fetch(`${DATA}/zones.json`).then(json);
export const fetchBoundary = () => fetch(`${DATA}/india.geojson`).then(json);

// Full analysis for one spot: ML risk, top drivers and Gemini's explanation
export const analyzePoint = (lat, lon) =>
  fetch("/api/map/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude: lat, longitude: lon }),
  }).then(json);

// Turn a saved prediction into a PDF in MongoDB, tagged with the logged-in user
export const saveMlReport = (resultId) => fetch(`/api/map/report/${resultId}`, { method: "POST" }).then(json);
