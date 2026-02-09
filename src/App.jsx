import React, { useMemo, useRef, useState } from "react";
import SignaturePad from "./ui/SignaturePad";
import gwLogoUrl from "./assets/gw-logo.png";

export default function App() {
  const [form, setForm] = useState({
    fullName: "",
    idCard: "",
    projectNo: "",
    projectName: "",
    contractDate: "",
    projectBrief: "",
    dateStart: "",
    dateEnd: "",
    costOmr: "",
    bankAccount: "",
  });

  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const signatureApiRef = useRef(null);

  const fileName = useMemo(() => {
    const safe = (s) =>
      String(s || "")
        .trim()
        .replace(/[^\w\- ]+/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 40);

    const name = safe(form.fullName) || "Unknown";
    const proj = safe(form.projectName) || "Project";
    const projNo = safe(form.projectNo) || "";
    const start = form.dateStart || "Start";
    return `Contract - ${name} - ${proj}${projNo ? ` (${projNo})` : ""} - ${start}.pdf`;
  }, [form.fullName, form.projectName, form.projectNo, form.dateStart]);

  const update = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildPdfBlob = async () => {
    const sig = signatureApiRef.current?.getDataUrl?.() ?? signatureDataUrl ?? null;
    if (sig !== signatureDataUrl) setSignatureDataUrl(sig);

    const { generateContractPdf } = await import("./pdf/generateContractPdf");
    return generateContractPdf({
      ...form,
      signaturePngDataUrl: sig,
      logoPath: gwLogoUrl,
    });
  };

  const onDownload = async () => {
    setBusy(true);
    try {
      const blob = await buildPdfBlob();
      downloadBlob(blob, fileName);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Contract PDF Generator</h1>
      <p style={{ marginTop: 0, color: "#94a3b8" }}>
        Fill details, sign, export a PDF. (All client-side)
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field
            label="Full Name"
            value={form.fullName}
            onChange={update("fullName")}
          />
          <Field label="ID Card" value={form.idCard} onChange={update("idCard")} />
          <Field
            label="Project No."
            value={form.projectNo}
            onChange={update("projectNo")}
          />
          <Field
            label="Project Name"
            value={form.projectName}
            onChange={update("projectName")}
          />
          <Field
            label="Contract Date (optional)"
            type="date"
            value={form.contractDate}
            onChange={update("contractDate")}
          />
          <Field
            label="Start Date"
            type="date"
            value={form.dateStart}
            onChange={update("dateStart")}
          />
          <Field
            label="End Date"
            type="date"
            value={form.dateEnd}
            onChange={update("dateEnd")}
          />
          <Field
            label="Cost (OMR)"
            value={form.costOmr}
            onChange={update("costOmr")}
            placeholder="e.g. 80"
          />
          <Field
            label="Bank Account Number"
            value={form.bankAccount}
            onChange={update("bankAccount")}
            placeholder="e.g. 0311056779010014"
          />
        </div>

        <div>
          <label style={labelStyle}>Project Brief</label>
          <textarea
            value={form.projectBrief}
            onChange={update("projectBrief")}
            rows={6}
            style={inputStyle}
            placeholder="Write a short brief..."
          />
        </div>

        <div>
          <h3 style={{ marginBottom: 8 }}>Signature</h3>
          <SignaturePad apiRef={signatureApiRef} onChange={setSignatureDataUrl} />
          {signatureDataUrl ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                Preview (what will be embedded)
              </div>
              <img
                alt="Signature preview"
                src={signatureDataUrl}
                style={{
                  maxWidth: 320,
                  height: 90,
                  objectFit: "contain",
                  border: "1px solid #2b2b2b",
                  borderRadius: 8,
                  background: "#fff",
                  padding: 6,
                }}
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #2b2b2b",
            background: "#111827",
            color: "#e5e7eb",
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {busy ? "Generating..." : "Download PDF"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid #2b2b2b",
  background: "#0b0b0b",
  color: "#e5e7eb",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};
