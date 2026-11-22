"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (n) => Intl.NumberFormat("en-IN", { notation: n > 99999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
const ACCENT = "#6366f1";

const Kpi = ({ label, value, unit }) => (
  <Card className="bg-transparent">
    <CardHeader className="pb-2"><CardDescription>{label}</CardDescription></CardHeader>
    <CardContent><p className="text-2xl font-bold text-indigo-400">{fmt(value)}{unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}</p></CardContent>
  </Card>
);

// Shared dark chart styling so every chart looks like it belongs to the site
const axis = { stroke: "#71717a", fontSize: 11, tickLine: false, axisLine: false };
const tip = { contentStyle: { background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }, labelStyle: { color: "#a1a1aa" } };

function TrendChart({ rows, metric, title }) {
  return (
    <Card className="bg-transparent">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer>
          <AreaChart data={rows}>
            <defs>
              <linearGradient id={metric} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} /><stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" {...axis} minTickGap={30} />
            <YAxis {...axis} tickFormatter={fmt} width={48} />
            <Tooltip {...tip} formatter={(v) => fmt(v)} />
            <Area type="monotone" dataKey={metric} stroke={ACCENT} fill={`url(#${metric})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Tabs per sponsor programme: KPIs, two impact trends and budget use
// view="ngo" labels programmes by their NGO partner instead of the sponsor
export default function CsrDashboard({ data, programmes, view = "csr" }) {
  const names = Object.keys(programmes);
  const [active, setActive] = useState(names[0]);
  const rows = data[active] ?? [];
  const p = programmes[active];
  const ngoOf = (n) => data[n]?.[0]?.ngo ?? "NGO partner";
  const label = (n) => (view === "ngo" ? `${ngoOf(n)} · ${n.split(" ")[0]}` : n);
  const used = sum(rows, "utilized"), given = sum(rows, "allocated");

  return (
    <div className="space-y-6">
      {/* Pick which sponsor organisation to look at */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{view === "ngo" ? ngoOf(active) : active}</h2>
          <p className="text-muted-foreground">{p.focus} · {rows.length} drives · {view === "ngo" ? `Sponsor: ${active}` : `NGO partner: ${ngoOf(active)}`}</p>
        </div>
        <Select value={active} onValueChange={setActive}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Choose programme" /></SelectTrigger>
          <SelectContent>
            {names.map((n) => <SelectItem key={n} value={n}>{label(n)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {p.kpis.map(([k, label, unit]) => <Kpi key={k} label={label} value={sum(rows, k)} unit={unit} />)}
        <Kpi label="Volunteer hours" value={sum(rows, "hours")} />
        <Kpi label="People benefited" value={sum(rows, "beneficiaries")} />
        <Kpi label="Budget used" value={given ? (used / given) * 100 : 0} unit="%" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {p.charts.map(([k, title]) => <TrendChart key={k} rows={rows} metric={k} title={title} />)}
      </div>

      <Card className="bg-transparent">
        <CardHeader><CardTitle className="text-base">CSR budget: allocated vs utilised (₹)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <BarChart data={rows}>
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" {...axis} minTickGap={30} />
              <YAxis {...axis} tickFormatter={fmt} width={48} />
              <Tooltip {...tip} formatter={(v) => `₹${fmt(v)}`} />
              <Bar dataKey="allocated" fill="#3f3f46" radius={[3, 3, 0, 0]} />
              <Bar dataKey="utilized" fill={ACCENT} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
