// One colour per ML risk class, shared by markers, legend and the insight pane
export const RISK_COLORS = { Low: "#22c55e", Moderate: "#eab308", High: "#f97316", Severe: "#ef4444" };
export const RISK_LEVELS = Object.keys(RISK_COLORS);

// Friendly names for the model's raw feature columns
const LABELS = {
  rainfall_24h_mm: "Rain (24h)", rainfall_72h_mm: "Rain (3 days)", rainfall_7d_mm: "Rain (7 days)",
  river_level_m: "River level", distance_to_river_km: "Distance to river", drainage_capacity: "Drainage",
  soil_moisture_percent: "Soil moisture", historical_flood_frequency: "Past floods", population_density: "Population",
  river_x_terrain: "High river on low ground", exposure: "People exposed", river_hazard: "River hazard",
  terrain_pond: "Water-pooling terrain",
};
export const featureName = (f) => LABELS[f] ?? f.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
