"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReportUpload from "@/components/reports/ReportUpload";

const FILTERS = [["", "All"], ["volunteer-report", "Stakeholder"], ["ml-results", "ML results"], ["impact-summary", "Impact summary"]];
const kb = (n) => `${Math.max(1, Math.round(n / 1024))} KB`;

export default function ReportsPage() {
  // Start on the filter from the URL (e.g. ?kind=ml-results from the map page)
  const [kind, setKind] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("kind") || "");
  const [items, setItems] = useState([]);

  // Pull the list again whenever the filter changes or a report is added
  const load = useCallback(async () => {
    const res = await fetch(`/api/reports${kind ? `?kind=${kind}` : ""}`);
    setItems(res.ok ? await res.json() : []);
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    res.ok ? toast.success("Deleted") : toast.error("Only the uploader can delete this");
    load();
  }

  return (
    <main className="p-8 space-y-8 max-w-5xl">
      <h1 className="text-3xl font-bold">Reports</h1>
      <ReportUpload onDone={load} />

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(([v, l]) => (
          <Button key={v} size="sm" variant={kind === v ? "default" : "outline"} onClick={() => setKind(v)}>{l}</Button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No reports yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-4 p-4">
              <FileText className="text-indigo-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <a href={`/api/reports/${r.id}`} target="_blank" className="font-medium hover:underline">{r.title}</a>
                <p className="text-sm text-muted-foreground truncate">
                  {new Date(r.uploadDate).toLocaleString()} · {kb(r.size)} {r.notes && `· ${r.notes}`}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <Badge variant="secondary">{r.kind}</Badge>
                  {r.tags?.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              </div>
              <Button size="icon" variant="ghost" asChild title="Download PDF">
                <a href={`/api/reports/${r.id}?download=1`}><Download className="h-4 w-4" /></a>
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
      <Toaster />
    </main>
  );
}
