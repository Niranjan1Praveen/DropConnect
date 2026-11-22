import Link from "next/link";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";
import EventsPager from "@/components/events/EventsPager";
import EmptyState, { DemoNotice } from "@/components/events/EmptyState";
import { requirePageUser } from "@/lib/auth/session";
import { listEvents } from "@/lib/services/events";

// NGO view: every event on the platform, with edit buttons on your own ones
export default async function EventsPage({ searchParams }) {
  const userId = await requirePageUser();
  const page = Number((await searchParams)?.page) || 1;
  const { data, totalPages } = await listEvents({ page, size: 10 });

  if (!data.length) {
    return <EmptyState title="There are no events at the moment!" text="Create one and it will show up right here." createHref="/dashboard/events/new" />;
  }

  return (
    <main className="flex flex-col gap-10 p-8">
      <DemoNotice />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12 items-stretch">
        {data.map((e) => (
          <EventCard key={e.id} event={e}>
            <Button size="lg" className="bg-indigo-600 text-white" asChild>
              <Link href={`/dashboard/events/${e.id}`}>View Entire Details</Link>
            </Button>
            {e.userId === userId && (
              <Button size="lg" className="bg-indigo-600 text-white" asChild>
                <Link href={`/dashboard/events/update/${e.id}`}>Update Details</Link>
              </Button>
            )}
          </EventCard>
        ))}
      </div>
      <EventsPager page={page} totalPages={totalPages} />
    </main>
  );
}
