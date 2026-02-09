import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function wrapText(text, maxCharsPerLine = 95) {
  if (!text) return [""];
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharsPerLine) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [y, m, d] = String(dateString).split("-");
  if (!y || !m || !d) return String(dateString);
  return `${d}/${m}/${y}`;
}

export async function generateContractPdf({
  fullName,
  idCard,
  projectName,
  projectBrief,
  dateStart,
  dateEnd,
  signaturePngDataUrl,
}) {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const lineH = 14;
  let y = height - margin;

  const drawText = (text, opts = {}) => {
    const {
      size = 11,
      bold = false,
      color = rgb(0, 0, 0),
      x = margin,
      maxWidth = width - margin * 2,
    } = opts;

    const usedFont = bold ? fontBold : font;
    const maxChars = Math.floor(maxWidth / (size * 0.55));
    const lines = wrapText(text, maxChars);

    for (const line of lines) {
      page.drawText(line, { x, y, size, font: usedFont, color });
      y -= lineH;
    }
  };

  const drawDivider = () => {
    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 14;
  };

  drawText("CONTRACT AGREEMENT", { size: 18, bold: true });
  drawText("This contract is generated digitally and signed below.", {
    size: 10,
    color: rgb(0.3, 0.3, 0.3),
  });
  drawDivider();

  drawText(`Full Name: ${fullName || "________________________"}`, {
    bold: true,
  });
  drawText(`ID Card: ${idCard || "________________________"}`, { bold: true });
  drawText(`Project Name: ${projectName || "________________________"}`, {
    bold: true,
  });
  drawText(
    `Project Start Date: ${formatDate(dateStart) || "________________________"}`,
    { bold: true }
  );
  drawText(
    `Project End Date: ${formatDate(dateEnd) || "________________________"}`,
    { bold: true }
  );
  y -= 6;
  drawDivider();

  drawText(
    "1) Scope of Work: The Contractor agrees to deliver the work as described in the Project Brief. " +
      "Any additional requests outside this scope may require a separate agreement or revised quotation."
  );
  y -= 6;

  drawText(
    "2) Payment Terms: Payment terms will be agreed upon separately (invoice/quotation), unless included in this contract. " +
      "Late payments may affect delivery timelines."
  );
  y -= 6;

  drawText(
    "3) Ownership & Usage: Final deliverables may be used by the Client for the agreed project usage. " +
      "Source files and editable project files are not included unless explicitly stated."
  );
  y -= 6;

  drawText(
    "4) Confidentiality: Both parties agree to keep any private or sensitive information confidential."
  );
  y -= 6;

  drawText(
    "5) Termination: Either party may terminate this agreement with written notice if the other party breaches the terms. " +
      "Work completed up to termination may be invoiced accordingly."
  );
  y -= 6;
  drawDivider();

  drawText("Project Brief:", { bold: true });
  const briefLines = wrapText(projectBrief || "", 95);
  if (briefLines.join("").trim().length === 0) {
    drawText("__________________________", { color: rgb(0.5, 0.5, 0.5) });
  } else {
    for (const line of briefLines) drawText(line);
  }

  const minSpaceForSignature = 140;
  if (y < margin + minSpaceForSignature) {
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    let y2 = page2.getSize().height - margin;
    page2.drawText("CONTRACT AGREEMENT (continued)", {
      x: margin,
      y: y2,
      size: 12,
      font: fontBold,
    });
    y2 -= 22;

    await drawSignatureBlock(pdfDoc, page2, {
      pageWidth: page2.getSize().width,
      margin,
      y: y2,
      font,
      fontBold,
      signaturePngDataUrl,
    });

    const bytes = await pdfDoc.save();
    return new Blob([bytes], { type: "application/pdf" });
  }

  await drawSignatureBlock(pdfDoc, page, {
    pageWidth: width,
    margin,
    y,
    font,
    fontBold,
    signaturePngDataUrl,
  });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

async function drawSignatureBlock(
  pdfDoc,
  page,
  { pageWidth, margin, y, font, fontBold, signaturePngDataUrl }
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
    const base64 = signaturePngDataUrl.split(",")[1] || "";
    const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const png = await pdfDoc.embedPng(pngBytes);

    const pad = 8;
    const targetW = boxW - pad * 2;
    const targetH = boxH - pad * 2;
    const imgDims = png.scale(1);
    const ratio = Math.min(targetW / imgDims.width, targetH / imgDims.height);

    const drawW = imgDims.width * ratio;
    const drawH = imgDims.height * ratio;

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
  page.drawText("__________________________", {
    x: margin + 70,
    y,
    size: 10,
    font,
  });

  page.drawText("Date:", { x: pageWidth - margin - 170, y, size: 10, font: fontBold });
  page.drawText("________________", {
    x: pageWidth - margin - 130,
    y,
    size: 10,
    font,
  });
}

