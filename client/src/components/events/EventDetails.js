import Image from "next/image";
import Link from "next/link";
import { MailIcon, PhoneIcon, MapPinIcon, UsersIcon, ExternalLinkIcon, ArrowLeftIcon } from "lucide-react";
import { eventImage } from "@/lib/utils/eventImage";

// Full event view shared by the NGO and volunteer detail pages
export default function EventDetails({ event, backHref }) {
  const facts = [
    [MailIcon, event.email], [PhoneIcon, event.contact],
    [MapPinIcon, event.eventLocation], [UsersIcon, `${event.volunteerCapacity} Volunteers`],
  ];

  return (
    <div className="p-8 space-y-4 max-w-3xl">
      <Link href={backHref} className="text-indigo-600 flex items-center gap-1 hover:underline"><ArrowLeftIcon /> Go Back</Link>
      <Image src={eventImage(event.organizerName)} alt={event.eventName} width={700} height={400} className="rounded-md" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{event.eventName}</h1>
          {event.eventDescription && <p className="text-muted-foreground">{event.eventDescription}</p>}
          <p className="text-lg font-medium">Organized by {event.organizerName}</p>
          {event.skillTags?.length > 0 && <p className="text-sm">Skills: {event.skillTags.join(", ")}</p>}
        </div>

        <div className="space-y-3">
          {facts.map(([Icon, text], i) => (
            <div key={i} className="flex items-center gap-2"><Icon className="h-4 w-4" /><span>{text}</span></div>
          ))}
          {event.registrationLink && (
            <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
              <ExternalLinkIcon className="h-4 w-4" /> Registration Link
            </a>
          )}
          <p className="text-sm text-gray-500 italic">Created: {new Date(event.createdAt).toLocaleString()}</p>
          <p className="text-sm text-gray-500 italic">Updated: {new Date(event.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
