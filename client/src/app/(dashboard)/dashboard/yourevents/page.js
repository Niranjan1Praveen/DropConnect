import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";
import EmptyState from "@/components/events/EmptyState";
import { requirePageUser } from "@/lib/auth/session";
import { listEvents } from "@/lib/services/events";

// Only the events created by the logged-in organisation
export default async function YourEventsPage() {
  const userId = await requirePageUser();
  const { data } = await listEvents({ userId, size: 100 });

  if (!data.length) {
    return <EmptyState title="You don't have any events yet" text="Create one so you can see it right here!" createHref="/dashboard/events/new" />;
  }

  return (
    <main className="flex flex-col gap-10 p-8">
      <Button size="lg" className="bg-indigo-600 text-white self-end" asChild>
        <Link href="/dashboard/events/new"><PlusIcon className="mr-2" /> Create a New Event</Link>
      </Button>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        {data.map((e) => (
          <EventCard key={e.id} event={e}>
            <Button size="lg" className="bg-indigo-600 text-white" asChild>
              <Link href={`/dashboard/events/update/${e.id}`}>Update Details</Link>
            </Button>
          </EventCard>
        ))}
      </div>
    </main>
  );
}
