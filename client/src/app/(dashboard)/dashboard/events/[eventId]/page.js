import prisma from "@/app/utils/db";
import Image from "next/image";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  UsersIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EventIdRoute({ params }) {
  const { eventId } = params;

  if (!eventId) return notFound();

  const event = await prisma.Event.findUnique({
    where: {
      id: eventId,
    },
  });
  console.log(event);

  if (!event) return notFound();

  return (
    <div className="p-8 space-y-4 max-w-3xl">
      <Link href="/dashboard/events" className="text-indigo-600 flex items-center gap-1 hover:underline">
        <ArrowLeftIcon />
        Go Back
      </Link>
      <Image
        src={event.eventImg ?? "/assets/images/ngo.png"}
        alt={event.eventName}
        width={700}
        height={600}
        className="rounded-md"
      />
      <h1 className="text-4xl font-bold">{event.eventName}</h1>

      {event.eventDescription && (
        <p className="text-xl text-muted-foreground">
          {event.eventDescription}
        </p>
      )}

      <p className="text-lg">Organized by {event.organizerName}</p>
      <div className="flex items-center gap-2">
        <MailIcon className="h-4 w-4" />
        <span>{event.email}</span>
      </div>

      <div className="flex items-center gap-2">
        <PhoneIcon className="h-4 w-4" />
        <span>{event.contact}</span>
      </div>

      <div className="flex items-center gap-2">
        <MapPinIcon className="h-4 w-4" />
        <span>{event.eventLocation}</span>
      </div>

      <div className="flex items-center gap-2">
        <UsersIcon className="h-4 w-4" />
        <span>{event.volunteerCapacity} Volunteers</span>
      </div>

      {event.registrationLink && (
        <div className="flex items-center gap-2">
          <ExternalLinkIcon className="h-4 w-4 text-blue-600" />
          <a
            href={event.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600"
          >
            Registration Link
          </a>
        </div>
      )}

      <p className="text-sm text-gray-500 italic">
        Created at: {new Date(event.createdAt).toLocaleString()}
      </p>

      <p className="text-sm text-gray-500 italic">
        Updated at: {new Date(event.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
