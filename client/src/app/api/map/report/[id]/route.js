import { route, ok, fail } from "@/lib/api/respond";
import { hasRole } from "@/lib/auth/roles";
import { logActivity } from "@/lib/services/activity";
import { getResult } from "@/lib/services/mapInsight";
import { saveReport } from "@/lib/services/reports";
import { buildPdf } from "@/lib/utils/pdf";
import { featureName } from "@/components/map/risk";

// Map pane -> "Save as PDF": render a saved ML result and store it in GridFS
export const POST = route(async (_req, { id }, userId) => {
  if (!(await hasRole(userId, "ORGANIZATION"))) return fail("Only NGOs can use the risk map", 403);
  const r = await getResult(id);
  if (!r) return fail("Result not found", 404);

  const pdf = await buildPdf({
    title: "DropConnect - Region Risk Report",
    subtitle: `${r.region} India · ${r.lat}, ${r.lon} · ${new Date(r.createdAt).toDateString()}`,
    rows: [["Risk level", r.risk_level], ["Confidence", `${Math.round(r.risk_confidence * 100)}%`],
      ["Suitability score", r.score], ["Elevation (m)", r.elevation]],
    sections: [
      { heading: "Class probabilities", items: Object.entries(r.risk_probabilities).map(([k, v]) => `${k}: ${Math.round(v * 100)}%`) },
      { heading: "Top drivers", items: r.drivers.map((d) => `${featureName(d.feature)} (${d.impact > 0 ? "raises" : "lowers"} risk)`) },
      { heading: "Why (Gemini)", items: r.explanation.match(/[^.]+\.?/g)?.map((s) => s.trim()).filter(Boolean) ?? [] },
      { heading: "Recommendation", items: [r.recommendation] },
    ],
  });

  const reportId = await saveReport(pdf, {
    filename: `risk-${id}.pdf`, kind: "ml-results", title: `Risk report (${r.lat}, ${r.lon})`,
    ownerId: userId, resultId: id, riskLevel: r.risk_level, tags: [r.region.toLowerCase(), r.risk_level.toLowerCase()],
  });
  await logActivity(userId, "report.ml_generated", { resultId: id, reportId });
  return ok({ report_id: reportId }, 201);
});
