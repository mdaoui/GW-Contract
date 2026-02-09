import React, { useMemo, useState } from "react";
import SignaturePad from "./ui/SignaturePad";

export default function App() {
  const [form, setForm] = useState({
    fullName: "",
    idCard: "",
    projectName: "",
    projectBrief: "",
    dateStart: "",
    dateEnd: "",
  });

  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);

  const fileName = useMemo(() => {
    const safe = (s) =>
      String(s || "")
        .trim()
        .replace(/[^\w\- ]+/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 40);

    const name = safe(form.fullName) || "Unknown";
    const proj = safe(form.projectName) || "Project";
    const start = form.dateStart || "Start";
    return `Contract - ${name} - ${proj} - ${start}.pdf`;
  }, [form.fullName, form.projectName, form.dateStart]);

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

  const onGenerate = async () => {
    setBusy(true);
    try {
      const { generateContractPdf } = await import("./pdf/generateContractPdf");
      const blob = await generateContractPdf({
        ...form,
        signaturePngDataUrl: signatureDataUrl,
      });
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
      <p style={{ marginTop: 0, color: "#666" }}>
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
            label="Project Name"
            value={form.projectName}
            onChange={update("projectName")}
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
          <SignaturePad onChange={setSignatureDataUrl} />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={busy}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {busy ? "Generating..." : "Generate PDF"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={onChange} style={inputStyle} />
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};
