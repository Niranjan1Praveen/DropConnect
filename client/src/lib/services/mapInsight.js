import zonesFile from "../../../public/map-data/zones.json";
import { col } from "@/lib/db/mongo";
import { toId, toPlain } from "@/lib/db/serialize";
import { explainZone } from "@/lib/services/gemini";

const GUIDANCE = {
  Low: "Suitable for regular volunteer activity; routine monitoring is enough.",
  Moderate: "Plan activities with standard precautions and keep an eye on the weather.",
  High: "Prepare response teams and avoid low-lying sites during heavy rain.",
  Severe: "Prioritise relief readiness; avoid sending volunteers into flood-prone zones.",
};

// The baked ML pointer closest to where the user clicked
export function nearestZone(lat, lon) {
  return zonesFile.points.reduce((best, z) => {
    const d = (z.lat - lat) ** 2 + (z.lon - lon) ** 2;
    return d < best.d ? { z, d } : best;
  }, { z: null, d: Infinity }).z;
}

// Full insight for a spot: ML result + Gemini explanation, saved to Mongo for later PDFs
export async function analyzeSpot(lat, lon, userId) {
  const zone = nearestZone(lat, lon);
  const { explanation, source } = await explainZone(zone);
  const result = {
    ...zone, explanation, explanation_source: source, recommendation: GUIDANCE[zone.risk_level],
    issues: [], location: { type: "Point", coordinates: [zone.lon, zone.lat] }, clicked: { lat, lon }, userId, createdAt: new Date(),
  };
  const { insertedId } = await (await col("ml_results")).insertOne(result);
  return { ...result, result_id: String(insertedId) };
}

export async function getResult(id) {
  const _id = toId(id);
  return _id ? toPlain(await (await col("ml_results")).findOne({ _id })) : null;
}
