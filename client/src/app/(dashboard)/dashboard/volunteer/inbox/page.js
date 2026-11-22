import { InboxIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/events/EmptyState";
import { requirePageUser } from "@/lib/auth/session";
import { listInbox } from "@/lib/services/inbox";

const STATUS_COLOR = { pending: "bg-yellow-500", approved: "bg-green-500" };

// A volunteer's own applications and where each one stands
export default async function InboxPage() {
  const userId = await requirePageUser();
  const entries = await listInbox(userId);

  return (
    <div className="p-6">
      <Card className="bg-transparent">
        <CardHeader><CardTitle className="text-3xl font-bold">Inbox Applications</CardTitle></CardHeader>
        <CardContent>
          {!entries.length ? (
            <EmptyState icon={InboxIcon} title="Your inbox is empty" text="Apply to an event and its status will show up here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Event Name</TableHead><TableHead>Description</TableHead><TableHead>Organizer</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.eventName}</TableCell>
                    <TableCell className="max-w-xs truncate">{e.eventDescription}</TableCell>
                    <TableCell>{e.organizerName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-white ${STATUS_COLOR[e.status] ?? "bg-red-500"}`}>{e.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
