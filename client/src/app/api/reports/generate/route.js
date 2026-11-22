import { route, ok } from "@/lib/api/respond";
import { col } from "@/lib/db/mongo";
import { listEvents } from "@/lib/services/events";
import { saveReport } from "@/lib/services/reports";
import { findUser } from "@/lib/services/users";
import { buildPdf } from "@/lib/utils/pdf";

// Builds an "impact summary" PDF from the organiser's own events + applications
export const POST = route(async (_req, _p, userId) => {
  const user = await findUser(userId);
  const { data: events } = await listEvents({ userId, size: 100 });
  const ids = events.map((e) => e.id);

  // Count applications per event with one aggregation
  const counts = await (await col("inbox"))
    .aggregate([{ $match: { eventId: { $in: ids } } }, { $group: { _id: "$eventId", n: { $sum: 1 } } }])
    .toArray();
  const byEvent = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  const total = counts.reduce((s, c) => s + c.n, 0);

  const pdf = await buildPdf({
    title: "Volunteering Impact Summary",
    subtitle: `${user?.firstName ?? ""} ${user?.lastName ?? ""} - ${new Date().toDateString()}`,
    rows: [["Events published", events.length], ["Volunteer applications", total],
      ["Total volunteer capacity", events.reduce((s, e) => s + (e.volunteerCapacity || 0), 0)]],
    sections: [{
      heading: "Events",
      items: events.map((e) => `${e.eventName} (${e.eventLocation}) - ${byEvent[e.id] ?? 0} applied / ${e.volunteerCapacity} seats`),
    }],
  });

  const id = await saveReport(pdf, {
    filename: `impact-summary-${Date.now()}.pdf`,
    kind: "impact-summary",
    title: "Volunteering Impact Summary",
    ownerId: userId,
    metrics: { events: events.length, applications: total },
  });
  return ok({ id }, 201);
});
