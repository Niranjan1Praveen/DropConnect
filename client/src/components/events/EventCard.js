import Image from "next/image";
import { MapPinIcon, UsersIcon, ExternalLinkIcon, GraduationCap, Briefcase, Handshake } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { eventImage } from "@/lib/utils/eventImage";

// Optional extra info blocks shown only when the event has them
const EXTRAS = [
  ["SkillsRequired", "Skills Required", GraduationCap],
  ["InternshipRoles", "Internship Roles", Briefcase],
  ["VolunteerExperience", "Volunteer Experience", Handshake],
];

// One event tile; the caller decides which buttons go in the footer
export default function EventCard({ event, children }) {
  return (
    <Card className="p-0 pb-5 flex flex-col h-full">
      <Image src={eventImage(event.organizerName)} width={800} height={200} alt={event.eventName}
        className="rounded-t-lg object-cover w-full h-[300px]" />
      <CardHeader>
        <CardTitle className="text-2xl">{event.eventName}</CardTitle>
        <CardDescription>{event.eventDescription}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        <div className="flex items-center gap-2"><strong>Organized by:</strong> {event.organizerName}</div>
        <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4" /><span>{event.eventLocation}</span></div>
        <div className="flex items-center gap-2"><UsersIcon className="h-4 w-4" /><span>{event.volunteerCapacity} Volunteers</span></div>
        {event.registrationLink && (
          <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600">
            <ExternalLinkIcon className="h-4 w-4" /> Registration Link
          </a>
        )}
        {EXTRAS.filter(([key]) => event[key]).map(([key, label, Icon]) => (
          <div key={key} className="mt-3">
            <p className="flex gap-2 font-semibold text-sm"><Icon className="h-4 w-4" />{label}</p>
            <p className="text-sm text-muted-foreground ml-6">{event[key]}</p>
          </div>
        ))}
      </CardContent>

      <CardFooter><div className="flex w-full justify-between flex-wrap gap-4">{children}</div></CardFooter>
    </Card>
  );
}
