import React, { useMemo, useRef, useState } from "react";
import SignaturePad from "./ui/SignaturePad";
import gwLogoUrl from "./assets/gw-logo.png";
import gwLogoBlackUrl from "./assets/GW Logo Black version.jpg";
import { projectBriefPresets, projectBriefRoleOptions } from "./data/projectBriefPresets";
import { personPresetMap, personPresetOptions } from "./data/personPresets";

export default function App() {
  const [form, setForm] = useState({
    createdBy: "Galaxy Way Adv",
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
  const applyFullName = (fullName) => {
    const preset = personPresetMap[fullName];

    setForm((p) => ({
      ...p,
      fullName,
      ...(preset
        ? {
            idCard: preset.idCard,
            bankName: preset.bankName || p.bankName,
            bankAccount: preset.bankAccount,
          }
        : null),
    }));
  };
  const onBriefRoleChange = (e) => {
    const role = e.target.value;
    setBriefRole(role);
    if (!role) return;
    setForm((p) => ({
      ...p,
      projectBrief: projectBriefPresets[role] ?? "",
    }));
  };
  const onFullNameChange = (e) => {
    applyFullName(e.target.value);
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
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h1 style={{ marginBottom: 6 }}>Contract PDF Generator V1.0</h1>
        <p style={{ marginTop: 0, color: "#94a3b8" }}>
          Contract creator made by (MD for GW Production Team)
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <PresetNameField
            label="Full Name"
            value={form.fullName}
            onChangeValue={applyFullName}
            options={personPresetOptions}
            placeholder="Type name or select preset"
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
          <h3 style={sectionHeadingStyle}>Freelancer / Candidate</h3>
          <div style={{ marginBottom: 18 }}>
            <PresetNameField
              label="By:"
              value={form.fullName}
              onChangeValue={applyFullName}
              options={personPresetOptions}
              placeholder="Freelancer name"
            />
          </div>

          <h3 style={sectionHeadingStyle}>Employer Signature</h3>
          <div style={{ marginBottom: 20 }}>
            <Field
              label="Signed by"
              value={form.employerName}
              onChange={update("employerName")}
              placeholder="Employer name"
            />
            <Field
              label="Contract creator name"
              value={form.createdBy}
              onChange={update("createdBy")}
              placeholder="Who created this contract"
              labelStyleOverride={sectionLabelStyle}
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

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  labelStyleOverride,
  list,
}) {
  return (
    <div>
      <label style={{ ...labelStyle, ...labelStyleOverride }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        list={list}
        style={inputStyle}
      />
    </div>
  );
}

function PresetNameField({ label, value, onChangeValue, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);

  const normalizedValue = String(value || "").trim().toLowerCase();
  const filteredOptions = normalizedValue
    ? options.filter((option) => option.toLowerCase().includes(normalizedValue))
    : options;

  return (
    <div
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false);
      }}
      style={{ position: "relative" }}
    >
      <label style={labelStyle}>{label}</label>
      <div style={comboFieldStyle}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder={placeholder}
          style={comboInputStyle}
        />
        <button
          type="button"
          aria-label={`Show presets for ${label}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          style={comboButtonStyle}
        >
          ▾
        </button>
      </div>
      {isOpen ? (
        <div style={comboMenuStyle}>
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChangeValue(option);
                  setIsOpen(false);
                }}
                style={comboOptionStyle}
              >
                {option}
              </button>
            ))
          ) : (
            <div style={comboEmptyStyle}>No matching preset</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={onChange} style={selectStyle}>
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span aria-hidden="true" style={selectArrowStyle}>
          ▾
        </span>
      </div>
    </div>
  );
}

const sectionHeadingStyle = {
  marginBottom: 8,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 6,
};

const sectionLabelStyle = {
  fontSize: "1.17em",
  fontWeight: "bold",
  color: "inherit",
  marginBottom: 8,
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

const comboFieldStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 44px",
  gap: 8,
};

const comboInputStyle = {
  ...inputStyle,
};

const comboButtonStyle = {
  borderRadius: 10,
  border: "1px solid #444444ff",
  background: "#1b1b1b",
  color: "#f8fafc",
  boxShadow: "0 0 0 1px rgba(148, 163, 184, 0.12) inset",
  fontSize: 18,
  cursor: "pointer",
};

const comboMenuStyle = {
  position: "absolute",
  zIndex: 20,
  top: "100%",
  left: 0,
  right: 0,
  marginTop: 6,
  padding: 6,
  borderRadius: 10,
  border: "1px solid #444444ff",
  background: "#111111",
  maxHeight: 220,
  overflowY: "auto",
  boxShadow: "0 14px 28px rgba(0, 0, 0, 0.35)",
};

const comboOptionStyle = {
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  border: 0,
  borderRadius: 8,
  background: "transparent",
  color: "#f8fafc",
  cursor: "pointer",
};

const comboEmptyStyle = {
  padding: "10px 12px",
  color: "#94a3b8",
  fontSize: 13,
};

const selectStyle = {
  ...inputStyle,
  paddingRight: 38,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
};

const selectArrowStyle = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#f8fafc",
  pointerEvents: "none",
  fontSize: 16,
};
