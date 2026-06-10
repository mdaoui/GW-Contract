import React, { useMemo, useRef, useState } from "react";
import SignaturePad from "./ui/SignaturePad";
import gwLogoUrl from "./assets/gw-logo.png";
import gwLogoBlackUrl from "./assets/GW Logo Black version.jpg";
import { projectBriefPresets, projectBriefRoleOptions } from "./data/projectBriefPresets";
import { personPresetMap, personPresetOptions } from "./data/personPresets";
import "./App.css";

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
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="app-header">
        <img src={gwLogoBlackUrl} alt="Galaxy Way" className="app-logo" />
        <div>
          <h1 className="app-title">Contract PDF Generator</h1>
          <p className="app-subtitle">Contract creator made by MD · GW Production Team</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <span className="version-badge">V 1.0</span>
          </div>
        </div>
      </header>

      <div className="form-grid">

        {/* ── Section 1: Contractor Info ── */}
        <div className="section-card">
          <h2 className="section-heading">Contractor Info</h2>
          <div className="fields-grid">
            <PresetNameField
              label="Full Name"
              value={form.fullName}
              onChangeValue={applyFullName}
              options={personPresetOptions}
              placeholder="Type name or select preset"
            />
            <Field label="National ID Card" value={form.idCard} onChange={update("idCard")} />
            <Field label="Bank Account Number" value={form.bankAccount} onChange={update("bankAccount")} placeholder="e.g. 0311056779010014" />
            <SelectField
              label="Bank Name"
              value={form.bankName}
              onChange={update("bankName")}
              options={["Bank Muscat","NBO","Oman Arab Bank","Sohar International","Nizwa Bank","Dhofar Bank"]}
              placeholder="Select bank"
            />
          </div>
        </div>

        {/* ── Section 2: Project Details ── */}
        <div className="section-card">
          <h2 className="section-heading">Project Details</h2>
          <div className="fields-grid">
            <Field label="Project No." value={form.projectNo} onChange={update("projectNo")} />
            <Field label="Project Name" value={form.projectName} onChange={update("projectName")} />
            <Field label="Contract Date (optional)" type="date" value={form.contractDate} onChange={update("contractDate")} />
            <Field label="Cost (OMR)" value={form.costOmr} onChange={update("costOmr")} placeholder="e.g. 150" />
            <Field label="Start Date" type="date" value={form.dateStart} onChange={update("dateStart")} />
            <Field label="End Date" type="date" value={form.dateEnd} onChange={update("dateEnd")} />
          </div>
        </div>

        {/* ── Section 3: Project Brief ── */}
        <div className="section-card">
          <h2 className="section-heading">Project Brief</h2>
          <div style={{ marginBottom: 14 }}>
            <SelectField
              label="Brief Preset"
              value={briefRole}
              onChange={onBriefRoleChange}
              options={projectBriefRoleOptions}
              placeholder="Select role preset"
            />
          </div>
          <div className="field-wrap">
            <label className="field-label">Brief Content</label>
            <textarea
              value={form.projectBrief}
              onChange={update("projectBrief")}
              rows={6}
              className="field-textarea"
              placeholder="Write a short brief..."
            />
          </div>
        </div>

        {/* ── Section 4: Signatures ── */}
        <div className="section-card">
          <h2 className="section-heading">Signatures</h2>

          {/* Freelancer */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10, marginTop: 0 }}>Freelancer / Candidate</p>
          <div style={{ marginBottom: 20 }}>
            <PresetNameField
              label="By"
              value={form.fullName}
              onChangeValue={applyFullName}
              options={personPresetOptions}
              placeholder="Freelancer name"
            />
          </div>

          <div className="divider" />

          {/* Employer */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Employer</p>
          <div className="fields-grid" style={{ marginBottom: 20 }}>
            <Field label="Signed by" value={form.employerName} onChange={update("employerName")} placeholder="Employer name" />
            <Field label="Contract creator" value={form.createdBy} onChange={update("createdBy")} placeholder="Who created this contract" />
          </div>

          <div className="divider" />

          {/* Signature pad */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Draw Signature</p>
          <SignaturePad apiRef={signatureApiRef} onChange={setSignatureDataUrl} />
          {signatureDataUrl ? (
            <div className="sig-preview">
              <p className="sig-preview-label">Signature Preview</p>
              <img alt="Signature preview" src={signatureDataUrl} className="sig-preview-img" />
            </div>
          ) : null}
        </div>

        {/* ── Download button ── */}
        <button type="button" onClick={onDownload} disabled={busy} className="btn btn-primary">
          {busy ? (
            <>
              <span className="btn-spinner" />
              Generating PDF…
            </>
          ) : (
            <>
              <span style={{ fontSize: 16 }}>⬇</span>
              Download PDF
            </>
          )}
        </button>

      </div>
    </div>
  );
}

/* ── Field ─────────────────────────────────────────────────────────── */
function Field({ label, type = "text", value, onChange, placeholder, list }) {
  return (
    <div className="field-wrap">
      <label className="field-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        list={list}
        className="field-input"
      />
    </div>
  );
}

/* ── PresetNameField ─────────────────────────────────────────────────── */
function PresetNameField({ label, value, onChangeValue, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);

  const normalizedValue = String(value || "").trim().toLowerCase();
  const filteredOptions = normalizedValue
    ? options.filter((option) => option.toLowerCase().includes(normalizedValue))
    : options;

  return (
    <div
      className="combo-wrap field-wrap"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false);
      }}
    >
      <label className="field-label">{label}</label>
      <div className="combo-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder={placeholder}
          className="field-input"
        />
        <button
          type="button"
          aria-label={`Show presets for ${label}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="combo-toggle"
        >
          ▾
        </button>
      </div>
      {isOpen ? (
        <div className="combo-menu">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChangeValue(option);
                  setIsOpen(false);
                }}
                className="combo-option"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="combo-empty">No matching preset</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ── SelectField ────────────────────────────────────────────────────── */
function SelectField({ label, value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  return (
    <div
      className="combo-wrap field-wrap"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false);
      }}
    >
      <label className="field-label">{label}</label>
      <div className="combo-row">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          className="field-input combo-display-btn"
          style={{ textAlign: "left", color: isPlaceholder ? "var(--text-muted)" : "var(--text)" }}
        >
          {displayValue}
        </button>
        <button
          type="button"
          aria-label={`Toggle ${label}`}
          onClick={() => setIsOpen((o) => !o)}
          className="combo-toggle"
        >
          ▾
        </button>
      </div>
      {isOpen ? (
        <div className="combo-menu">
          {placeholder && (
            <button
              type="button"
              onClick={() => {
                onChange({ target: { value: "" } });
                setIsOpen(false);
              }}
              className="combo-option"
              style={{ color: "var(--text-muted)" }}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange({ target: { value: opt } });
                setIsOpen(false);
              }}
              className={`combo-option${value === opt ? " combo-option--active" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
