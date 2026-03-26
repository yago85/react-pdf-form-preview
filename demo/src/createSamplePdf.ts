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

// ── Multi-page PDF ──────────────────────────────────────────────────────────

export interface MultiPageField {
  name: string;
  label: string;
  page: number; // 1-based
  x: number;
  y: number;
  width: number;
  height: number;
}

const MP_FIELDS: MultiPageField[] = [
  // Page 1 — General info
  { name: "contract_no",    label: "Contract No.",  page: 1, x: 388, y: 778, width: 180, height: 16 },
  { name: "contract_date",  label: "Date",          page: 1, x: 388, y: 752, width: 180, height: 16 },
  { name: "party_a",        label: "Party A",       page: 1, x: 120, y: 680, width: 420, height: 18 },
  { name: "party_b",        label: "Party B",       page: 1, x: 120, y: 650, width: 420, height: 18 },
  { name: "subject",        label: "Subject",       page: 1, x: 40,  y: 570, width: 515, height: 18 },
  // Page 2 — Terms & Conditions
  { name: "payment_amount", label: "Amount",        page: 2, x: 120, y: 710, width: 200, height: 18 },
  { name: "payment_method", label: "Method",        page: 2, x: 360, y: 710, width: 180, height: 18 },
  { name: "deadline",       label: "Deadline",      page: 2, x: 120, y: 650, width: 200, height: 18 },
  { name: "penalty",        label: "Penalty (%)",   page: 2, x: 360, y: 650, width: 180, height: 18 },
  // Page 3 — Signatures
  { name: "sign_a",         label: "Party A sign",  page: 3, x: 40,  y: 500, width: 240, height: 18 },
  { name: "sign_b",         label: "Party B sign",  page: 3, x: 320, y: 500, width: 240, height: 18 },
  { name: "sign_date",      label: "Sign date",     page: 3, x: 200, y: 440, width: 200, height: 18 },
];

export async function createMultiPageSamplePdf(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const form = doc.getForm();

  const gray = rgb(0.45, 0.45, 0.45);
  const darkGray = rgb(0.15, 0.15, 0.15);
  const blue = rgb(0.15, 0.35, 0.65);
  const lightBlue = rgb(0.9, 0.94, 0.99);
  const lineGray = rgb(0.82, 0.82, 0.82);

  const pages: ReturnType<typeof doc.addPage>[] = [];

  // ── Page 1: General Information ─────────────────────────────────────────
  const p1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pages.push(p1);

  p1.drawRectangle({ x: 0, y: PAGE_HEIGHT - 60, width: PAGE_WIDTH, height: 60, color: blue });
  p1.drawText("MULTI-PAGE CONTRACT", { x: 40, y: PAGE_HEIGHT - 38, size: 20, font: helveticaBold, color: rgb(1, 1, 1) });
  p1.drawText("react-pdf-form-preview · multi-page demo", { x: 40, y: PAGE_HEIGHT - 54, size: 8, font: helvetica, color: rgb(0.75, 0.85, 1) });

  p1.drawRectangle({ x: 380, y: 738, width: 207, height: 68, color: lightBlue, borderColor: lineGray, borderWidth: 0.5 });
  p1.drawText("Contract No.", { x: 388, y: 797, size: 7, font: helvetica, color: gray });
  p1.drawText("Date", { x: 388, y: 771, size: 7, font: helvetica, color: gray });

  _sectionHeader(p1, helveticaBold, blue, "1. PARTIES", 40, 720);
  _fieldLabel(p1, helvetica, gray, "Party A (Provider):", 40, 692);
  _fieldLabel(p1, helvetica, gray, "Party B (Client):", 40, 662);

  _sectionHeader(p1, helveticaBold, blue, "2. SUBJECT", 40, 610);
  p1.drawText("The parties agree on the following scope of work:", { x: 40, y: 590, size: 9, font: helvetica, color: darkGray });

  _pageFooter(p1, helvetica, gray, lineGray, 1, 3);

  // ── Page 2: Terms & Conditions ──────────────────────────────────────────
  const p2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pages.push(p2);

  p2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 50, width: PAGE_WIDTH, height: 50, color: blue });
  p2.drawText("TERMS & CONDITIONS", { x: 40, y: PAGE_HEIGHT - 34, size: 16, font: helveticaBold, color: rgb(1, 1, 1) });

  _sectionHeader(p2, helveticaBold, blue, "3. PAYMENT", 40, 750);
  _fieldLabel(p2, helvetica, gray, "Total amount:", 40, 722);
  _fieldLabel(p2, helvetica, gray, "Payment method:", 280, 722);

  _sectionHeader(p2, helveticaBold, blue, "4. DEADLINES", 40, 690);
  _fieldLabel(p2, helvetica, gray, "Completion deadline:", 40, 662);
  _fieldLabel(p2, helvetica, gray, "Late penalty (%):", 280, 662);

  _sectionHeader(p2, helveticaBold, blue, "5. LIABILITY", 40, 610);
  const liabilityTerms = [
    "5.1  Each party shall be liable for damages caused by breach of this agreement.",
    "5.2  Force majeure events shall relieve parties from liability.",
    "5.3  Maximum liability shall not exceed the total contract amount.",
    "5.4  Disputes shall be resolved through arbitration.",
  ];
  liabilityTerms.forEach((line, i) => {
    p2.drawText(line, { x: 40, y: 590 - i * 16, size: 8.5, font: helvetica, color: darkGray });
  });

  _pageFooter(p2, helvetica, gray, lineGray, 2, 3);

  // ── Page 3: Signatures ──────────────────────────────────────────────────
  const p3 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pages.push(p3);

  p3.drawRectangle({ x: 0, y: PAGE_HEIGHT - 50, width: PAGE_WIDTH, height: 50, color: blue });
  p3.drawText("SIGNATURES", { x: 40, y: PAGE_HEIGHT - 34, size: 16, font: helveticaBold, color: rgb(1, 1, 1) });

  _sectionHeader(p3, helveticaBold, blue, "6. AGREEMENT", 40, 750);
  p3.drawText("By signing below, both parties agree to all terms and conditions outlined in this contract.", {
    x: 40, y: 730, size: 9, font: helvetica, color: darkGray,
  });

  p3.drawLine({ start: { x: 40, y: 540 }, end: { x: PAGE_WIDTH - 40, y: 540 }, thickness: 0.5, color: lineGray });

  p3.drawText("Party A (Provider)", { x: 40, y: 520, size: 8, font: helveticaBold, color: darkGray });
  p3.drawText("Party B (Client)", { x: 320, y: 520, size: 8, font: helveticaBold, color: darkGray });
  p3.drawText("Name / Signature:", { x: 40, y: 495, size: 7.5, font: helvetica, color: gray });
  p3.drawText("Name / Signature:", { x: 320, y: 495, size: 7.5, font: helvetica, color: gray });

  _fieldLabel(p3, helvetica, gray, "Date of signing:", 120, 435);

  _pageFooter(p3, helvetica, gray, lineGray, 3, 3);

  // ── AcroForm fields ─────────────────────────────────────────────────────
  for (const f of MP_FIELDS) {
    const page = pages[f.page - 1];
    const field = form.createTextField(f.name);
    field.addToPage(page, {
      x: f.x, y: f.y, width: f.width, height: f.height,
      borderColor: rgb(0.75, 0.82, 0.92),
      backgroundColor: rgb(0.97, 0.98, 1),
      borderWidth: 0.75,
    });
  }

  const bytes = await doc.save({ useObjectStreams: false });
  return bytes.buffer as ArrayBuffer;
}

function _pageFooter(page: any, font: any, color: any, lineColor: any, current: number, total: number) {
  page.drawLine({ start: { x: 40, y: 55 }, end: { x: PAGE_WIDTH - 40, y: 55 }, thickness: 0.5, color: lineColor });
  page.drawText("react-pdf-form-preview · multi-page demo", { x: 40, y: 40, size: 7, font, color });
  page.drawText(`Page ${current} of ${total}`, { x: PAGE_WIDTH - 80, y: 40, size: 7, font, color });
}
