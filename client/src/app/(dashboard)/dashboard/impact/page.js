import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import CsrDashboard from "@/components/csr/CsrDashboard";
import { requireRole } from "@/lib/auth/roles";
import { csrOverview, PROGRAMMES } from "@/lib/services/csr";

// NGO home for impact: the same field data as CSR, seen from the NGO partner's side
export default async function ImpactPage() {
  await requireRole("ORGANIZATION");
  const data = JSON.parse(JSON.stringify(await csrOverview()));

  return (
    <main className="space-y-6 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">NGO Impact Dashboard</h1>
          <p className="text-muted-foreground">On-ground results of every programme your NGO partners delivered.</p>
        </div>
        <Button variant="outline" asChild><Link href="/dashboard/reports"><FileText className="mr-2 h-4 w-4" /> Reports</Link></Button>
      </div>
      <CsrDashboard data={data} programmes={PROGRAMMES} view="ngo" />
    </main>
  );
}
