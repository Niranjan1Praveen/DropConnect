import { route, fail, fromStatus } from "@/lib/api/respond";
import { readReport, removeReport } from "@/lib/services/reports";

// Stream the PDF back so the browser can preview or download it
export const GET = route(async (req, { id }) => {
  const found = await readReport(id);
  if (!found) return fail("Report not found", 404);
  return new Response(found.data, {
    headers: {
      "Content-Type": "application/pdf",
      // ?download=1 saves the file; otherwise the browser previews it
      "Content-Disposition": `${new URL(req.url).searchParams.get("download") ? "attachment" : "inline"}; filename="${found.file.filename.replace(/"/g, "")}"`,
    },
  });
});

export const DELETE = route(async (_req, { id }, userId) => fromStatus(await removeReport(id, userId)));
