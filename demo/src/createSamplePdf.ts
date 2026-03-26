/**
 * Creates a sample AcroForm PDF entirely in the browser via pdf-lib.
 * No external PDF file needed — the demo is fully self-contained.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export interface SamplePdfField {
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  multiline?: boolean;
}

const PAGE_WIDTH = 595;  // A4 pt
const PAGE_HEIGHT = 842;

// Field layout for a mock "Service Agreement" document
const FIELDS: SamplePdfField[] = [
  { name: "doc_number",     label: "Agreement No.",      x: 388, y: 778, width: 180, height: 16 },
  { name: "doc_date",       label: "Date",               x: 388, y: 752, width: 180, height: 16 },
  { name: "client_name",    label: "Client name",        x: 120, y: 680, width: 420, height: 18 },
  { name: "client_address", label: "Client address",     x: 120, y: 655, width: 420, height: 18 },
  { name: "client_phone",   label: "Phone",              x: 120, y: 630, width: 200, height: 18 },
  { name: "client_email",   label: "Email",              x: 360, y: 630, width: 180, height: 18 },
  { name: "service_desc",   label: "Service description",x: 40,  y: 555, width: 515, height: 18, multiline: true },
  { name: "service_desc_2", label: "",                   x: 40,  y: 533, width: 515, height: 18, multiline: true },
  { name: "service_desc_3", label: "",                   x: 40,  y: 511, width: 515, height: 18, multiline: true },
  { name: "amount",         label: "Amount",             x: 120, y: 460, width: 200, height: 18 },
  { name: "payment_terms",  label: "Payment terms",      x: 360, y: 460, width: 180, height: 18 },
  { name: "provider_name",  label: "Provider",           x: 40,  y: 120, width: 240, height: 18 },
  { name: "client_sign",    label: "Client",             x: 320, y: 120, width: 240, height: 18 },
];

export async function createSamplePdf(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const form = doc.getForm();

  const gray = rgb(0.45, 0.45, 0.45);
  const darkGray = rgb(0.15, 0.15, 0.15);
  const blue = rgb(0.15, 0.35, 0.65);
  const lightBlue = rgb(0.9, 0.94, 0.99);
  const lineGray = rgb(0.82, 0.82, 0.82);

  // ── Header bar ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 60, width: PAGE_WIDTH, height: 60, color: blue });
  page.drawText("SERVICE AGREEMENT", {
    x: 40, y: PAGE_HEIGHT - 38,
    size: 20, font: helveticaBold, color: rgb(1, 1, 1),
  });
  page.drawText("react-pdf-form-preview · demo", {
    x: 40, y: PAGE_HEIGHT - 54,
    size: 8, font: helvetica, color: rgb(0.75, 0.85, 1),
  });

  // ── Agreement number / date block ───────────────────────────────────────
  page.drawRectangle({ x: 380, y: 738, width: 207, height: 68, color: lightBlue, borderColor: lineGray, borderWidth: 0.5 });
  page.drawText("Agreement No.", { x: 388, y: 797, size: 7, font: helvetica, color: gray });
  page.drawText("Date", { x: 388, y: 771, size: 7, font: helvetica, color: gray });

  // ── Section: Parties ────────────────────────────────────────────────────
  _sectionHeader(page, helveticaBold, blue, "1. PARTIES", 40, 720);
  page.drawText("This agreement is made between the Service Provider and the Client identified below.", {
    x: 40, y: 700, size: 9, font: helvetica, color: darkGray,
  });

  _fieldLabel(page, helvetica, gray, "Client name:", 40, 692);
  _fieldLabel(page, helvetica, gray, "Address:", 40, 667);
  _fieldLabel(page, helvetica, gray, "Phone:", 40, 642);
  _fieldLabel(page, helvetica, gray, "Email:", 280, 642);

  // ── Section: Services ───────────────────────────────────────────────────
  _sectionHeader(page, helveticaBold, blue, "2. SERVICES", 40, 596);
  page.drawText("The Service Provider agrees to perform the following services:", {
    x: 40, y: 576, size: 9, font: helvetica, color: darkGray,
  });

  // ── Section: Payment ────────────────────────────────────────────────────
  _sectionHeader(page, helveticaBold, blue, "3. PAYMENT", 40, 496);
  _fieldLabel(page, helvetica, gray, "Total amount (USD):", 40, 472);
  _fieldLabel(page, helvetica, gray, "Payment terms:", 280, 472);

  // ── Terms block ─────────────────────────────────────────────────────────
  _sectionHeader(page, helveticaBold, blue, "4. TERMS", 40, 410);
  const terms = [
    "4.1  This agreement is effective upon signature by both parties.",
    "4.2  Either party may terminate this agreement with 30 days written notice.",
    "4.3  All work product created shall remain the property of the Client upon full payment.",
    "4.4  This agreement shall be governed by applicable local law.",
  ];
  terms.forEach((line, i) => {
    page.drawText(line, { x: 40, y: 390 - i * 16, size: 8.5, font: helvetica, color: darkGray });
  });

  // ── Signature block ──────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 165 }, end: { x: PAGE_WIDTH - 40, y: 165 }, thickness: 0.5, color: lineGray });
  _sectionHeader(page, helveticaBold, blue, "5. SIGNATURES", 40, 155);

  page.drawText("Service Provider", { x: 40, y: 132, size: 8, font: helveticaBold, color: darkGray });
  page.drawText("Client", { x: 320, y: 132, size: 8, font: helveticaBold, color: darkGray });
  page.drawText("Name / Signature:", { x: 40, y: 113, size: 7.5, font: helvetica, color: gray });
  page.drawText("Name / Signature:", { x: 320, y: 113, size: 7.5, font: helvetica, color: gray });

  // ── Footer ───────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 55 }, end: { x: PAGE_WIDTH - 40, y: 55 }, thickness: 0.5, color: lineGray });
  page.drawText("This document was rendered using react-pdf-form-preview · github.com/yago85/react-pdf-form-preview", {
    x: 40, y: 40, size: 7, font: helvetica, color: gray,
  });
  page.drawText("Page 1 of 1", { x: PAGE_WIDTH - 80, y: 40, size: 7, font: helvetica, color: gray });

  // ── AcroForm fields ──────────────────────────────────────────────────────
  for (const f of FIELDS) {
    const field = form.createTextField(f.name);
    field.addToPage(page, {
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      borderColor: rgb(0.75, 0.82, 0.92),
      backgroundColor: rgb(0.97, 0.98, 1),
      borderWidth: 0.75,
    });
    if (f.multiline) field.enableMultiline();
  }

  const bytes = await doc.save({ useObjectStreams: false });
  return bytes.buffer as ArrayBuffer;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function _sectionHeader(page: any, font: any, color: any, text: string, x: number, y: number) {
  page.drawText(text, { x, y, size: 10.5, font, color });
  page.drawLine({ start: { x, y: y - 4 }, end: { x: x + 515, y: y - 4 }, thickness: 0.75, color });
}

function _fieldLabel(page: any, font: any, color: any, text: string, x: number, y: number) {
  page.drawText(text, { x, y, size: 7.5, font, color });
}
