import React, { useMemo, useRef, useState } from "react";
import SignaturePad from "./ui/SignaturePad";
import gwLogoUrl from "./assets/gw-logo.png";
import gwLogoBlackUrl from "./assets/GW Logo Black version.jpg";
import { projectBriefPresets, projectBriefRoleOptions } from "./data/projectBriefPresets";

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
    bankName: "Bank Muscat",
    bankAccount: "",
    employerName: "",
  });

  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [briefRole, setBriefRole] = useState("");
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
  const onBriefRoleChange = (e) => {
    const role = e.target.value;
    setBriefRole(role);
    if (!role) return;
    setForm((p) => ({
      ...p,
      projectBrief: projectBriefPresets[role] ?? "",
    }));
  };

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
      <header
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={gwLogoBlackUrl}
          alt="GW"
          style={{ height: 100, width: "auto", objectFit: "contain" }}
        />
      </header>
      <h1 style={{ marginBottom: 6 }}>Contract PDF Generator</h1>
      <p style={{ marginTop: 0, color: "#94a3b8" }}>
        Contract creator made by (MD for GW Production Team)
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field
            label="Full Name"
            value={form.fullName}
            onChange={update("fullName")}
          />
          <Field label="National ID Card" value={form.idCard} onChange={update("idCard")} />
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
            placeholder="e.g. 150"
          />
          <SelectField
            label="Bank Name"
            value={form.bankName}
            onChange={update("bankName")}
            options={[
              "Bank Muscat",
              "NBO",
              "Oman Arab Bank",
              "Sohar International",
              "Nizwa Bank",
              "Dhofar Bank",
            ]}
            placeholder="Select bank"
          />
          <Field
            label="Bank Account Number"
            value={form.bankAccount}
            onChange={update("bankAccount")}
            placeholder="e.g. 0311056779010014"
          />
        </div>

        <div>
          <SelectField
            label="Brief Preset"
            value={briefRole}
            onChange={onBriefRoleChange}
            options={projectBriefRoleOptions}
            placeholder="Select role preset"
          />
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
          <h3 style={{ marginBottom: 8 }}>Freelancer / Candidate</h3>
          <div style={{ marginBottom: 18 }}>
            <Field
              label="By:"
              value={form.fullName}
              onChange={update("fullName")}
              placeholder="Freelancer name"
            />
          </div>

          <h3 style={{ marginBottom: 8 }}>Employer Signature</h3>
          <div style={{ marginBottom: 20 }}>
            <Field
              label="Signed by"
              value={form.employerName}
              onChange={update("employerName")}
              placeholder="Employer name"
            />
          </div>

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
            background: "#333333ff",
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

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={onChange} style={inputStyle}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
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
  border: "1px solid #444444ff",
  background: "#0d0d0dff",
  color: "#f8fafc",
  boxShadow: "0 0 0 1px rgba(148, 163, 184, 0.12) inset",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};
