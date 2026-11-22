import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";
import EventsPager from "@/components/events/EventsPager";
import EmptyState, { DemoNotice } from "@/components/events/EmptyState";
import { AppSearchEvents } from "@/components/dashboard/AppSearchEvents";
import { requirePageUser } from "@/lib/auth/session";
import { listEvents, listLocations } from "@/lib/services/events";

// Volunteer view: searchable, filterable list of opportunities
export default async function VolunteerEventsPage({ searchParams }) {
  await requirePageUser();
  const q = (await searchParams) ?? {};
  const page = Number(q.page) || 1;
  const search = q.search || "";
  const location = q.location === "all" ? "" : q.location || "";

  const [{ data, totalPages }, locations] = await Promise.all([
    listEvents({ page, size: 9, search, location }),
    listLocations(),
  ]);

  return (
    <main className="flex flex-col gap-10 p-8">
      <DemoNotice />
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Match with events that suit you best</h2>
        <AppSearchEvents locations={locations} />
      </div>

      {!data.length ? (
        <EmptyState title="No events found" text="Try a different search or location." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12 items-stretch">
          {data.map((e) => (
            <EventCard key={e.id} event={e}>
              <Button size="lg" className="bg-indigo-600 text-white" asChild>
                <Link href={`/dashboard/volunteer/events/${e.id}`}><Send /> Apply Now</Link>
              </Button>
            </EventCard>
          ))}
        </div>
      )}
      <EventsPager page={page} totalPages={totalPages} query={{ search, location }} />
    </main>
  );
}
