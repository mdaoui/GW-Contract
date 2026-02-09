import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** ---------- Helpers ---------- **/

function formatCoverDate(input) {
  if (!input) return "";
  const [y, m, d] = String(input).split("-");
  if (!y || !m || !d) return String(input);
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const mm = months[Math.max(0, Math.min(11, Number(m) - 1))];
  return `${d} ${mm} ${y}`;
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = String(d).split("-");
  if (!y || !m || !day) return String(d);
  return `${day}/${m}/${y}`;
}

function wrapText(text, maxCharsPerLine = 95) {
  if (!text) return [""];
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxCharsPerLine) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function fetchAsUint8Array(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load asset: ${url}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function drawLabeledLine(
  page,
  {
    label,
    value,
    x,
    y,
    labelFont,
    valueFont,
    labelSize = 12,
    valueSize = 12,
    gap = 0,
  }
) {
  const labelW = labelFont.widthOfTextAtSize(label, labelSize);
  page.drawText(label, { x, y, size: labelSize, font: labelFont, color: rgb(0, 0, 0) });
  page.drawText(value || "", {
    x: x + labelW + gap,
    y,
    size: valueSize,
    font: valueFont,
    color: rgb(0, 0, 0),
  });
}

/** ---------- Cover Page ---------- **/

async function drawCoverPage(
  pdfDoc,
  {
    createdBy,
    fullName,
    idCard,
    projectNo,
    projectName,
    contractDate,
    dateStart,
    logoPath = "/assets/gw-logo.png",
  }
) {
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const { height } = page.getSize();

  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const x0 = 64;

  let y = height - 110;
  page.drawText("FREELANCER", { x: x0, y, size: 30, font: helv });
  y -= 44;
  page.drawText("WORK", { x: x0, y, size: 30, font: helv });
  y -= 44;
  page.drawText("CONTRACT", { x: x0, y, size: 30, font: helv });

  y = 360;

  page.drawText("CREATED BY:", { x: x0, y, size: 12, font: helvBold });
  y -= 18;
  page.drawText(createdBy || "Galaxy Way Adv", { x: x0, y, size: 14, font: helv });

  y -= 40;
  page.drawText("PREPARED FOR:", { x: x0, y, size: 12, font: helvBold });
  y -= 22;

  drawLabeledLine(page, {
    label: "Name: ",
    value: fullName || "",
    x: x0,
    y,
    labelFont: helv,
    valueFont: helvBold,
    labelSize: 12,
    valueSize: 12,
  });
  y -= 20;

  drawLabeledLine(page, {
    label: "ID: ",
    value: idCard || "",
    x: x0,
    y,
    labelFont: helv,
    valueFont: helvBold,
    labelSize: 12,
    valueSize: 12,
  });

  y -= 44;

  drawLabeledLine(page, {
    label: "Project No.- ",
    value: projectNo || "",
    x: x0,
    y,
    labelFont: helvBold,
    valueFont: helv,
    labelSize: 13,
    valueSize: 12,
  });

  y -= 36;

  drawLabeledLine(page, {
    label: "Project Name: ",
    value: projectName || "",
    x: x0,
    y,
    labelFont: helvBold,
    valueFont: helv,
    labelSize: 13,
    valueSize: 12,
  });

  const coverDate = formatCoverDate(contractDate || dateStart);
  if (coverDate) {
    page.drawText(coverDate, { x: x0, y: 190, size: 12, font: helvBold });
  }

  try {
    const logoBytes = await fetchAsUint8Array(logoPath);
    const logo = await pdfDoc.embedPng(logoBytes);

    const targetW = 150;
    const ratio = targetW / logo.width;
    const targetH = logo.height * ratio;

    page.drawImage(logo, {
      x: x0,
      y: 70,
      width: targetW,
      height: targetH,
    });
  } catch {
    // no logo: still generate PDF
  }

  return page;
}

/** ---------- Signature Block ---------- **/

async function drawSignatureBlock(
  pdfDoc,
  page,
  { width, margin, y, font, fontBold, signaturePngDataUrl }
) {
  y -= 16;
  page.drawText("Signature:", { x: margin, y, size: 12, font: fontBold });
  y -= 10;

  const boxW = 260;
  const boxH = 90;
  page.drawRectangle({
    x: margin,
    y: y - boxH,
    width: boxW,
    height: boxH,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 1,
  });

  if (signaturePngDataUrl && signaturePngDataUrl.startsWith("data:image/png")) {
    const pngBytes = Uint8Array.from(atob(signaturePngDataUrl.split(",")[1]), (c) =>
      c.charCodeAt(0)
    );
    const png = await pdfDoc.embedPng(pngBytes);

    const pad = 8;
    const targetW = boxW - pad * 2;
    const targetH = boxH - pad * 2;

    const dims = png.scale(1);
    const ratio = Math.min(targetW / dims.width, targetH / dims.height);

    const drawW = dims.width * ratio;
    const drawH = dims.height * ratio;

    const x = margin + pad + (targetW - drawW) / 2;
    const yy = y - boxH + pad + (targetH - drawH) / 2;

    page.drawImage(png, { x, y: yy, width: drawW, height: drawH });
  } else {
    page.drawText("(No signature provided)", {
      x: margin + 12,
      y: y - 40,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  y -= boxH + 18;

  page.drawText("Signed by:", { x: margin, y, size: 10, font: fontBold });
  page.drawText("__________________________", { x: margin + 70, y, size: 10, font });

  page.drawText("Date:", { x: width - margin - 170, y, size: 10, font: fontBold });
  page.drawText("________________", { x: width - margin - 130, y, size: 10, font });

  return y - 14;
}

/** ---------- Main Generator ---------- **/

export async function generateContractPdf({
  createdBy = "Galaxy Way Adv",
  fullName,
  idCard,
  projectNo,
  projectName,
  contractDate,
  projectBrief,
  dateStart,
  dateEnd,
  signaturePngDataUrl,
  logoPath = "/assets/gw-logo.png",
}) {
  const pdfDoc = await PDFDocument.create();

  await drawCoverPage(pdfDoc, {
    createdBy,
    fullName,
    idCard,
    projectNo,
    projectName,
    contractDate,
    dateStart,
    logoPath,
  });

  let page = pdfDoc.addPage([595.28, 841.89]);
  let { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const lineH = 14;
  let y = height - margin;

  const addPage = () => {
    page = pdfDoc.addPage([595.28, 841.89]);
    ({ width, height } = page.getSize());
    y = height - margin;
  };

  const ensureSpace = (needed) => {
    if (y - needed < margin) addPage();
  };

  const drawHeading = (text) => {
    ensureSpace(28);
    page.drawText(text, { x: margin, y, size: 12, font: fontBold });
    y -= 18;
  };

  const drawParagraph = (text, size = 11) => {
    const maxChars = Math.floor((width - margin * 2) / (size * 0.55));
    const lines = wrapText(text, maxChars);
    ensureSpace(lines.length * lineH + 14);

    for (const line of lines) {
      page.drawText(line, { x: margin, y, size, font });
      y -= lineH;
    }
    y -= 6;
  };

  const drawBullets = (items) => {
    for (const item of items) {
      const lines = wrapText(item, 95);
      ensureSpace(lines.length * lineH + 10);

      page.drawText("•", { x: margin, y, size: 11, font });
      page.drawText(lines[0], { x: margin + 14, y, size: 11, font });
      y -= lineH;

      for (let i = 1; i < lines.length; i++) {
        page.drawText(lines[i], { x: margin + 14, y, size: 11, font });
        y -= lineH;
      }
      y -= 2;
    }
    y -= 6;
  };

  drawHeading("CONTRACT DETAILS");
  drawParagraph(`Prepared for: ${fullName || ""} (ID: ${idCard || ""})`);
  drawParagraph(`Project No: ${projectNo || ""}`);
  drawParagraph(`Project Name: ${projectName || ""}`);
  drawParagraph(`Start: ${formatDate(dateStart)}    End: ${formatDate(dateEnd)}`);

  drawHeading("1. PROJECT BRIEF");
  drawParagraph(projectBrief || "__________________________");

  drawHeading("COMMUNICATION");
  drawBullets([
    "All the communication should be clear and documented.",
    "GW will communicate with the freelancer through company email.",
    "WhatsApp communication can be used for fast inquiries.",
    "If required freelancer should be available for online interaction with prior notice by online platforms like Zoom, Teams.",
    "GW or freelancer should reply/respond within 2-4 hours of receiving email/call.",
    "Freelancer will connect with the Head of production.",
  ]);

  drawHeading("CONFIDENTIALITY");
  drawBullets([
    "All the project materials are strictly confidential and should not be shared with any third party.",
    "At no time will the freelancer use any confidential information obtained through conducting this service contract either directly or indirectly, for personal benefit, or disclose or communicate such information in any manner to any third party.",
    "This provision shall continue to be effective after the termination of this Contract.",
  ]);

  drawHeading("OWNERSHIP OF RIGHTS");
  drawBullets([
    "The Client continues to own any and all proprietary information it shares with the designer during the term of this Contract. The freelancer has no rights to this proprietary information and may not use it except to complete the designing services. Upon completion of the Contract, the Client will own the final content Deliverables.",
    "Freelancer not allowed to publish any projects on social media platforms or any online platform.",
  ]);

  ensureSpace(200);
  y = await drawSignatureBlock(pdfDoc, page, {
    width,
    margin,
    y,
    font,
    fontBold,
    signaturePngDataUrl,
  });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

