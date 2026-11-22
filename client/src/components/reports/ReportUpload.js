"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KIND_LABELS = { "volunteer-report": "Stakeholder volunteering report", "ml-results": "ML results (NGO)" };

// Small form: pick a PDF, label it, send it to /api/reports
export default function ReportUpload({ onDone }) {
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/reports", { method: "POST", body: new FormData(e.target) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(body.error || "Upload failed");
    toast.success("Report saved");
    e.target.reset();
    onDone?.();
  }

  async function generate() {
    setBusy(true);
    const res = await fetch("/api/reports/generate", { method: "POST" });
    setBusy(false);
    res.ok ? toast.success("Impact summary generated") : toast.error("Could not generate summary");
    onDone?.();
  }

  return (
    <Card className="bg-transparent">
      <CardHeader><CardTitle>Upload a report (PDF)</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Title</Label><Input name="title" placeholder="Q3 river clean-up report" /></div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select name="kind" className="w-full rounded-md border bg-transparent p-2">
              {Object.entries(KIND_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Tags</Label><Input name="tags" placeholder="water, pune, csr" /></div>
          <div className="space-y-2"><Label>PDF file</Label><Input name="file" type="file" accept="application/pdf" required /></div>
          <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea name="notes" placeholder="Anything worth remembering" /></div>
          <div className="flex gap-3 md:col-span-2">
            <Button disabled={busy} className="bg-indigo-600 text-white">{busy ? "Working..." : "Upload"}</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={generate}>Generate impact summary</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
