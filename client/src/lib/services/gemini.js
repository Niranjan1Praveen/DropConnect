import { featureName } from "@/components/map/risk";

const KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(",").map((k) => k.trim()).filter(Boolean);
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// Plain template used whenever Gemini is unavailable
function fallback(zone) {
  const up = zone.drivers.filter((d) => d.impact > 0).slice(0, 3).map((d) => featureName(d.feature).toLowerCase());
  const down = zone.drivers.filter((d) => d.impact < 0).slice(0, 2).map((d) => featureName(d.feature).toLowerCase());
  let text = `The model rates this area ${zone.risk_level} risk (${Math.round(zone.risk_confidence * 100)}% confident).`;
  if (up.length) text += ` The main factors raising the risk are ${up.join(", ")}.`;
  if (down.length) text += ` ${down.join(", ")} help keep it lower.`;
  return text;
}

// Ask Gemini to explain the model's verdict in plain words; tries each key, never throws
export async function explainZone(zone) {
  const drivers = zone.drivers.map((d) => `- ${featureName(d.feature)} = ${d.value} (impact ${d.impact > 0 ? "+" : ""}${d.impact})`).join("\n");
  const prompt = `You explain a machine-learning flood-risk prediction to an NGO volunteer coordinator in India.

Prediction: ${zone.risk_level} risk, confidence ${Math.round(zone.risk_confidence * 100)}%.
Class probabilities: ${JSON.stringify(zone.risk_probabilities)}
Region: ${zone.region}, season: ${zone.season}
Top drivers (positive impact pushed TOWARDS this risk level, negative pushed away):
${drivers}

Write 3-4 short sentences in plain English:
1. What the risk level means for this place.
2. Why the model thinks so, citing the top 2-3 drivers in everyday words.
3. One practical suggestion for planning volunteer work here.
Do not change or second-guess the risk level. No markdown, no bullet points.`;

  for (const key of KEYS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (res.ok && text) return { explanation: text, source: "gemini" };
    } catch (err) {
      console.warn("Gemini key failed, trying next:", err.message);
    }
  }
  return { explanation: fallback(zone), source: "template" };
}
