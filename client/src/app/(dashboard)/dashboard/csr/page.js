import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import CsrDashboard from "@/components/csr/CsrDashboard";
import { requireRole } from "@/lib/auth/roles";
import { csrOverview, PROGRAMMES } from "@/lib/services/csr";

// CSR investors' home: impact of every sponsored programme, straight from MongoDB
export default async function CsrPage() {
  await requireRole("CORPORATE");
  const data = JSON.parse(JSON.stringify(await csrOverview())); // plain objects for the client chart

  return (
    <main className="space-y-6 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">CSR Impact Dashboard</h1>
          <p className="text-muted-foreground">Water-resilience outcomes for every sponsored programme.</p>
        </div>
        <Button variant="outline" asChild><Link href="/dashboard/reports"><FileText className="mr-2 h-4 w-4" /> Reports</Link></Button>
      </div>
      <CsrDashboard data={data} programmes={PROGRAMMES} />
    </main>
  );
}
