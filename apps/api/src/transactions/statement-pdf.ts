import PDFDocument from "pdfkit";

export interface StatementRow {
  date: Date;
  title: string;
  party: string;
  debit: string | null;
  credit: string | null;
  balance: string | null;
}

export interface StatementData {
  holder: string;
  iban: string;
  accountName: string;
  currency: string;
  periodLabel: string;
  generatedAt: Date;
  opening: string;
  totalIn: string;
  totalOut: string;
  closing: string;
  rows: StatementRow[];
}

const TEAL = "#0f4c4a";
const INK = "#1d1a15";
const SOFT = "#5f574a";
const RULE = "#d6c9b0";
const ACCENT = "#c4512d";
const POSITIVE = "#2f6b3f";

const MARGIN = 48;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ROW_H = 30;

// Column layout (sums to CONTENT_W = 499.28)
const COL = {
  date: { x: MARGIN, w: 62 },
  details: { x: MARGIN + 66, w: 192 },
  debit: { x: MARGIN + 262, w: 80 },
  credit: { x: MARGIN + 346, w: 80 },
  balance: { x: MARGIN + 430, w: PAGE_W - MARGIN - (MARGIN + 430) },
};

/** "1234567.5" -> "1 234 567.500" */
export function fmt(value: string): string {
  const negative = value.startsWith("-");
  const [whole, fraction = "000"] = value.replace("-", "").split(".");
  return `${negative ? "-" : ""}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${fraction.padEnd(3, "0")}`;
}

const day = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);

function tanitMark(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(1.5).strokeColor(TEAL).lineJoin("round").lineCap("round");
  doc.circle(x + size * 0.5, y + size * 0.18, size * 0.09).stroke();
  doc.moveTo(x + size * 0.5, y + size * 0.27).lineTo(x + size * 0.5, y + size * 0.44).stroke();
  doc
    .moveTo(x + size * 0.19, y + size * 0.33)
    .lineTo(x + size * 0.19, y + size * 0.44)
    .lineTo(x + size * 0.81, y + size * 0.44)
    .lineTo(x + size * 0.81, y + size * 0.33)
    .stroke();
  doc
    .moveTo(x + size * 0.31, y + size * 0.88)
    .lineTo(x + size * 0.5, y + size * 0.44)
    .lineTo(x + size * 0.69, y + size * 0.88)
    .closePath()
    .stroke();
}

function tableHeader(doc: PDFKit.PDFDocument, y: number, currency: string) {
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(SOFT);
  const head = (text: string, col: { x: number; w: number }, align: "left" | "right" = "left") =>
    doc.text(text.toUpperCase(), col.x, y, { width: col.w, align, lineBreak: false, characterSpacing: 0.6 });
  head("Date", COL.date);
  head("Details", COL.details);
  head(`Out (${currency})`, COL.debit, "right");
  head(`In (${currency})`, COL.credit, "right");
  head("Balance", COL.balance, "right");
  doc.moveTo(MARGIN, y + 14).lineTo(PAGE_W - MARGIN, y + 14).lineWidth(1.2).strokeColor(INK).stroke();
  return y + 22;
}

export function renderStatement(data: StatementData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      bufferPages: true,
      info: { Title: `Account statement ${data.iban}`, Author: "Tanit Bank", Subject: data.periodLabel },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Masthead
    tanitMark(doc, MARGIN, MARGIN - 2, 28);
    doc.font("Helvetica-Bold").fontSize(19).fillColor(TEAL).text("Tanit Bank", MARGIN + 36, MARGIN + 3, { lineBreak: false });
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(ACCENT)
      .text("ACCOUNT STATEMENT", MARGIN, MARGIN + 8, { width: CONTENT_W, align: "right", characterSpacing: 1.5, lineBreak: false });
    doc.moveTo(MARGIN, MARGIN + 38).lineTo(PAGE_W - MARGIN, MARGIN + 38).lineWidth(2).strokeColor(INK).stroke();

    // ── Account block
    let y = MARGIN + 54;
    const info = (label: string, value: string, x: number, width: number, mono = false) => {
      doc.font("Helvetica").fontSize(7.5).fillColor(SOFT).text(label.toUpperCase(), x, y, { width, lineBreak: false, characterSpacing: 0.6 });
      doc.font(mono ? "Courier" : "Helvetica-Bold").fontSize(10).fillColor(INK).text(value, x, y + 11, { width, lineBreak: false, ellipsis: true });
    };
    info("Account holder", data.holder, MARGIN, 230);
    info("IBAN", data.iban.replace(/(.{4})/g, "$1 ").trim(), MARGIN + 250, CONTENT_W - 250, true);
    y += 38;
    info("Account", data.accountName, MARGIN, 230);
    info("Period", data.periodLabel, MARGIN + 250, 130);
    info("Issued", day(data.generatedAt), MARGIN + 390, CONTENT_W - 390);
    y += 46;

    // ── Summary
    doc.rect(MARGIN, y, CONTENT_W, 56).lineWidth(1.2).strokeColor(INK).stroke();
    const cell = (label: string, value: string, index: number, color = INK) => {
      const w = CONTENT_W / 4;
      const x = MARGIN + index * w;
      if (index > 0) doc.moveTo(x, y + 8).lineTo(x, y + 48).lineWidth(0.6).strokeColor(RULE).stroke();
      doc.font("Helvetica").fontSize(7).fillColor(SOFT).text(label.toUpperCase(), x + 10, y + 11, { width: w - 16, lineBreak: false, characterSpacing: 0.6 });
      doc.font("Courier-Bold").fontSize(11).fillColor(color).text(fmt(value), x + 10, y + 27, { width: w - 16, lineBreak: false });
    };
    cell("Opening balance", data.opening, 0);
    cell("Total in", data.totalIn, 1, POSITIVE);
    cell("Total out", data.totalOut, 2);
    cell("Closing balance", data.closing, 3, TEAL);
    y += 78;

    // ── Table
    y = tableHeader(doc, y, data.currency);
    const bottom = PAGE_H - 78;

    if (data.rows.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(SOFT).text("No transactions in this period.", MARGIN, y + 6);
    }

    data.rows.forEach((row) => {
      if (y + ROW_H > bottom) {
        doc.addPage();
        y = tableHeader(doc, MARGIN, data.currency);
      }
      doc.font("Courier").fontSize(8).fillColor(SOFT).text(day(row.date), COL.date.x, y + 3, { width: COL.date.w + 2, lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(row.title, COL.details.x, y + 2, { width: COL.details.w, lineBreak: false, ellipsis: true });
      doc.font("Helvetica").fontSize(7.5).fillColor(SOFT).text(row.party, COL.details.x, y + 14, { width: COL.details.w, lineBreak: false, ellipsis: true });
      doc.font("Courier").fontSize(8.5).fillColor(INK);
      if (row.debit) doc.text(fmt(row.debit), COL.debit.x, y + 3, { width: COL.debit.w, align: "right", lineBreak: false });
      if (row.credit) doc.fillColor(POSITIVE).text(fmt(row.credit), COL.credit.x, y + 3, { width: COL.credit.w, align: "right", lineBreak: false });
      if (row.balance) doc.fillColor(INK).text(fmt(row.balance), COL.balance.x, y + 3, { width: COL.balance.w, align: "right", lineBreak: false });
      doc.moveTo(MARGIN, y + ROW_H - 3).lineTo(PAGE_W - MARGIN, y + ROW_H - 3).lineWidth(0.4).strokeColor(RULE).stroke();
      y += ROW_H;
    });

    // ── Footer on every page. The bottom margin is lifted so writing here never creates a page.
    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index++) {
      doc.switchToPage(range.start + index);
      doc.page.margins.bottom = 0;
      doc.moveTo(MARGIN, PAGE_H - 52).lineTo(PAGE_W - MARGIN, PAGE_H - 52).lineWidth(0.6).strokeColor(RULE).stroke();
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(SOFT)
        .text("Tanit Bank is a portfolio project. Not a licensed bank. All money shown is simulated.", MARGIN, PAGE_H - 42, {
          width: CONTENT_W - 80,
          lineBreak: false,
        });
      doc.text(`Page ${index + 1} of ${range.count}`, PAGE_W - MARGIN - 80, PAGE_H - 42, {
        width: 80,
        align: "right",
        lineBreak: false,
      });
    }

    doc.end();
  });
}