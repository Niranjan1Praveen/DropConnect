"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import InsightPane from "@/components/map/InsightPane";
import { RISK_COLORS, RISK_LEVELS } from "@/components/map/risk";
import { fetchZones, analyzePoint } from "@/lib/api/mapClient";

// Leaflet touches `window`, so the map only renders in the browser
const RiskMap = dynamic(() => import("@/components/map/RiskMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" />,
});

export default function MapView() {
  const [zones, setZones] = useState([]);
  const [season, setSeason] = useState("");
  const [layers, setLayers] = useState({ heat: true, points: true });
  const [view, setView] = useState("All");          // "All" or one risk level
  const visible = Object.fromEntries(RISK_LEVELS.map((k) => [k, view === "All" || view === k]));
  const [picked, setPicked] = useState(null);       // [lat, lon] shown in the pane
  const [insight, setInsight] = useState(null);
  const [state, setState] = useState({ loading: false, error: "" });

  useEffect(() => {
    fetchZones().then((z) => { setZones(z.points); setSeason(z.season); }).catch(() => setState({ loading: false, error: "Map service is offline" }));
  }, []);

  // Pointer or map click -> run the full ML + Gemini analysis for that spot
  async function pick(lat, lon) {
    setPicked([lat, lon]);
    setInsight(null);
    setState({ loading: true, error: "" });
    try {
      setInsight(await analyzePoint(lat, lon));
      setState({ loading: false, error: "" });
    } catch (e) {
      setState({ loading: false, error: e.message });
    }
  }

  const counts = zones.reduce((a, z) => ({ ...a, [z.risk_level]: (a[z.risk_level] || 0) + 1 }), {});
  const paneOpen = picked !== null;

  return (
    <main className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Region Risk Map</h1>
          <p className="text-muted-foreground">ML flood-risk heatmap of India. Click a pointer to see why.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/reports?kind=ml-results"><FileText className="mr-2 h-4 w-4" /> Saved ML reports</Link>
        </Button>
      </div>

      {/* Switch between all zones or a single risk level; doubles as the legend */}
      <div className="inline-flex flex-wrap gap-1 rounded-lg border p-1">
        {["All", ...RISK_LEVELS].map((k) => (
          <Button key={k} size="sm" variant={view === k ? "secondary" : "ghost"} onClick={() => setView(k)}>
            {k !== "All" && <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: RISK_COLORS[k] }} />}
            {k} <span className="ml-1 text-muted-foreground">{k === "All" ? zones.length : counts[k] || 0}</span>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {[["heat", "Heatmap"], ["points", "Pointers"]].map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={layers[k]} onChange={() => setLayers((l) => ({ ...l, [k]: !l[k] }))} className="accent-indigo-600" />
            {label}
          </label>
        ))}
        <div className="flex items-center gap-2 text-muted-foreground">
          Lowest risk
          <span className="h-2 w-32 rounded-full" style={{ background: "linear-gradient(90deg,#22c55e,#eab308,#f97316,#ef4444)" }} />
          Highest risk
        </div>
      </div>

      <div className={`grid h-[75vh] gap-4 ${paneOpen ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
        <div className="relative h-[60vh] lg:h-full">
          <RiskMap zones={zones} visible={visible} selected={picked} onPick={pick} showHeat={layers.heat} showPoints={layers.points} />
          {!paneOpen && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-[400] flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm shadow">
              <MousePointerClick className="h-4 w-4 text-indigo-500" /> Click any pointer or place for an explanation
            </div>
          )}
        </div>
        {paneOpen && <InsightPane data={insight} loading={state.loading} error={state.error} onClose={() => setPicked(null)} />}
      </div>
      <Toaster />
    </main>
  );
}
