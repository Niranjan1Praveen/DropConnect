import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Build a simple, readable PDF from a title + list of [label, value] rows + bullet sections
export async function buildPdf({ title, subtitle, rows = [], sections = [] }) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]); // A4
  let y = 790;

  // Write one line, starting a fresh page when we run out of room
  const line = (text, { size = 11, f = font, x = 50, color = rgb(0.1, 0.1, 0.1) } = {}) => {
    if (y < 60) { page = doc.addPage([595, 842]); y = 790; }
    page.drawText(String(text ?? "").replace(/[^\x20-\x7E]/g, "").slice(0, 95), { x, y, size, font: f, color });
    y -= size + 8;
  };

  line(title, { size: 20, f: bold, color: rgb(0.27, 0.22, 0.8) });
  if (subtitle) line(subtitle, { size: 10, color: rgb(0.4, 0.4, 0.4) });
  y -= 10;
  rows.forEach(([k, v]) => line(`${k}: ${v}`));
  sections.forEach(({ heading, items }) => {
    y -= 8;
    line(heading, { size: 14, f: bold });
    (items.length ? items : ["(nothing yet)"]).forEach((it) => line(`- ${it}`, { x: 60 }));
  });

  return Buffer.from(await doc.save());
}
