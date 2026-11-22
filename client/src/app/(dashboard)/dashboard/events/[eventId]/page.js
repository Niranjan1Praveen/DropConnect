import { notFound } from "next/navigation";
import EventDetails from "@/components/events/EventDetails";
import { getEvent } from "@/lib/services/events";

export default async function EventPage({ params }) {
  const event = await getEvent((await params).eventId);
  if (!event) notFound();
  return <EventDetails event={event} backHref="/dashboard/events" />;
}
