import { GridFSBucket } from "mongodb";
import { getDb } from "@/lib/db/mongo";
import { toId } from "@/lib/db/serialize";

// PDFs live in GridFS (reports.files + reports.chunks), so size isn't capped at 16MB
export const KINDS = ["volunteer-report", "ml-results", "impact-summary"];
const MAX_BYTES = 20 * 1024 * 1024;

const bucket = async () => new GridFSBucket(await getDb(), { bucketName: "reports" });

// Store a PDF buffer plus free-form metadata (title, notes, eventId, tags, metrics...)
export async function saveReport(buffer, { filename, ...meta }) {
  if (buffer.length > MAX_BYTES) throw new Error("PDF is larger than 20MB");
  if (buffer.subarray(0, 4).toString() !== "%PDF") throw new Error("File is not a PDF");

  const stream = (await bucket()).openUploadStream(filename, {
    contentType: "application/pdf",
    metadata: { ...meta, uploadedAt: new Date() },
  });
  await new Promise((done, fail) => stream.on("finish", done).on("error", fail).end(buffer));
  return String(stream.id);
}

// Lightweight listing (metadata only, no file bytes)
export async function listReports({ kind, ownerId } = {}) {
  const where = {};
  if (kind) where["metadata.kind"] = kind;
  if (ownerId) where["metadata.ownerId"] = ownerId;
  const files = await (await bucket()).find(where).sort({ uploadDate: -1 }).toArray();
  return files.map((f) => ({ id: String(f._id), filename: f.filename, size: f.length, uploadDate: f.uploadDate, ...f.metadata }));
}

// Read a whole report back into memory for download
export async function readReport(id) {
  const _id = toId(id);
  if (!_id) return null;
  const b = await bucket();
  const [file] = await b.find({ _id }).toArray();
  if (!file) return null;
  const chunks = [];
  for await (const c of b.openDownloadStream(_id)) chunks.push(c);
  return { file, data: Buffer.concat(chunks) };
}

// Only the uploader may delete their report
export async function removeReport(id, userId) {
  const found = await readReport(id);
  if (!found) return "missing";
  if (found.file.metadata?.ownerId !== userId) return "forbidden";
  await (await bucket()).delete(found.file._id);
  return { message: "Report deleted" };
}
