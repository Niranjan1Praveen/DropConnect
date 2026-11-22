import { route, ok, fail } from "@/lib/api/respond";
import { KINDS, listReports, saveReport } from "@/lib/services/reports";
import { logActivity } from "@/lib/services/activity";

// GET /api/reports?kind=ml-results&mine=1
export const GET = route(async (req, _p, userId) => {
  const q = new URL(req.url).searchParams;
  return ok(await listReports({ kind: q.get("kind") || undefined, ownerId: q.get("mine") ? userId : undefined }));
});

// POST multipart/form-data: file (PDF), title, kind, notes?, eventId?, tags? (comma list)
export const POST = route(async (req, _p, userId) => {
  const form = await req.formData();
  const file = form.get("file");
  const kind = form.get("kind");
  if (!file || typeof file === "string") return fail("Please attach a PDF file");
  if (!KINDS.includes(kind)) return fail(`kind must be one of: ${KINDS.join(", ")}`);

  const tags = String(form.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean);
  try {
    const id = await saveReport(Buffer.from(await file.arrayBuffer()), {
      filename: file.name,
      kind,
      title: form.get("title") || file.name,
      notes: form.get("notes") || "",
      eventId: form.get("eventId") || null,
      tags,
      ownerId: userId,
    });
    await logActivity(userId, "report.uploaded", { reportId: id, kind });
    return ok({ id }, 201);
  } catch (err) {
    return fail(err.message); // bad file type / too large
  }
});
