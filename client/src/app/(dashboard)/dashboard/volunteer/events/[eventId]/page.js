import { notFound } from "next/navigation";
import EventDetails from "@/components/events/EventDetails";
import ApplyOpportunity from "@/components/dashboard/AppApplyOpportunity";
import { getEvent } from "@/lib/services/events";

// Event details on the left, the apply box on the right
export default async function VolunteerEventPage({ params }) {
  const event = await getEvent((await params).eventId);
  if (!event) notFound();
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EventDetails event={event} backHref="/dashboard/volunteer/events" />
      <ApplyOpportunity event={event} />
    </main>
  );
}
