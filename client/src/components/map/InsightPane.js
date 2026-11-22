"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Sparkles, X, TrendingUp, TrendingDown, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { saveMlReport } from "@/lib/api/mapClient";
import { RISK_COLORS, RISK_LEVELS, featureName } from "./risk";

// One probability bar per risk class
const ProbBars = ({ probs }) => (
  <div className="space-y-1.5">
    {RISK_LEVELS.map((k) => [k, probs[k] ?? 0]).map(([k, v]) => (
      <div key={k} className="flex items-center gap-2 text-sm">
        <span className="w-20 text-muted-foreground">{k}</span>
        <div className="h-2 flex-1 rounded-full bg-muted">
          <div className="h-2 rounded-full" style={{ width: `${v * 100}%`, background: RISK_COLORS[k] }} />
        </div>
        <span className="w-10 text-right tabular-nums">{Math.round(v * 100)}%</span>
      </div>
    ))}
  </div>
);

// Right-hand pane: ML verdict, why (drivers + Gemini), and a save-as-PDF action
export default function InsightPane({ data, loading, error, onClose }) {
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await saveMlReport(data.result_id);
      toast.success("Saved as PDF in Reports");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="h-full overflow-y-auto bg-transparent">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-xl">Zone insight</CardTitle>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading && <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {data && !loading && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: RISK_COLORS[data.risk_level] }}>
                  {data.risk_level} risk
                </span>
                <span className="text-sm text-muted-foreground">{Math.round(data.risk_confidence * 100)}% confident</span>
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {data.region} India · {data.season}
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="font-semibold">Model probabilities</h3>
              <ProbBars probs={data.risk_probabilities} />
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-indigo-500" /> Why this rating</h3>
              <p className="text-sm leading-relaxed">{data.explanation}</p>
              <Badge variant="outline">{data.explanation_source === "gemini" ? "Explained by Gemini" : "Auto summary"}</Badge>
            </section>

            {data.drivers?.length > 0 && (
              <section className="space-y-2">
                <h3 className="font-semibold">Top drivers</h3>
                <ul className="space-y-1.5">
                  {data.drivers.map((d) => (
                    <li key={d.feature} className="flex items-center gap-2 text-sm">
                      {d.impact > 0 ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-green-500" />}
                      <span className="flex-1">{featureName(d.feature)}</span>
                      {d.value !== null && <span className="tabular-nums text-muted-foreground">{d.value}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.issues?.length > 0 && (
              <section className="space-y-1">
                <h3 className="font-semibold">Local concerns</h3>
                <div className="flex flex-wrap gap-1">{data.issues.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}</div>
              </section>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              {[["Suitability", data.score.toFixed(2)], ["Elevation", `${data.elevation} m`],
                ["Vegetation", data.vegetation_index], ["Water index", data.water_index]].map(([k, v]) => (
                <div key={k} className="rounded-md bg-muted/50 p-2"><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>

            {data.result_id && (
              <Button onClick={save} disabled={saving} className="w-full bg-indigo-600 text-white">
                <FileDown className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save as PDF report"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
