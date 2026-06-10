import React, { useState, useEffect, useCallback } from "react";

// ─── Crypto helpers ──────────────────────────────────────────────────────────
async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Expected hash is computed once and cached — plaintext never stored in state
let _expectedHash = null;
async function getExpectedHash() {
  if (!_expectedHash) {
    // Split to avoid the full plaintext appearing as a single string literal
    _expectedHash = await sha256(["Production", "Team", "-", "26"].join(""));
  }
  return _expectedHash;
}

const SESSION_KEY = "gw_contract_token";

// ─── AuthGate ────────────────────────────────────────────────────────────────
export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Validate session on mount
  useEffect(() => {
    (async () => {
      const expected = await getExpectedHash();
      const stored = sessionStorage.getItem(SESSION_KEY);
      setAuthed(stored === expected);
      setReady(true);
    })();
  }, []);

  // Re-validate if sessionStorage is tampered externally
  useEffect(() => {
    const onStorage = async () => {
      const expected = await getExpectedHash();
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored !== expected) setAuthed(false);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const submit = useCallback(async () => {
    if (!input.trim()) return;
    setBusy(true);
    setError("");
    try {
      const expected = await getExpectedHash();
      const entered = await sha256(input.trim());
      if (entered === expected) {
        sessionStorage.setItem(SESSION_KEY, entered);
        setAuthed(true);
      } else {
        setError("Incorrect password. Please try again.");
        setInput("");
      }
    } finally {
      setBusy(false);
    }
  }, [input]);

  const onKey = (e) => {
    if (e.key === "Enter") submit();
  };

  if (!ready) return null;
  if (authed) return children;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo area */}
        <div style={styles.lockIcon}>🔒</div>
        <h1 style={styles.title}>Contract Generator</h1>
        <p style={styles.sub}>Enter the magic word to continue</p>

        <div style={styles.fieldWrap}>
          <div style={styles.inputRow}>
            <input
              type={showPw ? "text" : "password"}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(""); }}
              onKeyDown={onKey}
              placeholder="Password"
              autoFocus
              style={{
                ...styles.input,
                borderColor: error ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.14)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              style={styles.eyeBtn}
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPw ? "🙈" : "👁"}
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={busy || !input.trim()}
            style={{
              ...styles.btn,
              opacity: busy || !input.trim() ? 0.45 : 1,
              cursor: busy || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Verifying…" : "Enter"}
          </button>
        </div>

        <p style={styles.footer}>Galaxy Way</p>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#050505",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    fontFamily: "'Inter', system-ui, sans-serif",
    zIndex: 9999,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "40px 32px 32px",
    textAlign: "center",
    boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
  },
  lockIcon: {
    fontSize: 36,
    marginBottom: 16,
    lineHeight: 1,
  },
  title: {
    margin: "0 0 6px",
    fontSize: "1.5rem",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#ffffff",
  },
  sub: {
    margin: "0 0 28px",
    fontSize: 13,
    color: "#888888",
    lineHeight: 1.5,
  },
  fieldWrap: {
    display: "grid",
    gap: 10,
  },
  inputRow: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "12px 44px 12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#0a0a0a",
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    color: "#666",
    padding: 0,
    outline: "none",
  },
  error: {
    margin: 0,
    fontSize: 12,
    color: "rgba(255,100,100,0.9)",
    textAlign: "left",
    paddingLeft: 2,
  },
  btn: {
    width: "100%",
    padding: "13px 0",
    borderRadius: 12,
    border: "none",
    background: "#ffffff",
    color: "#000000",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    transition: "opacity 0.2s, transform 0.15s",
    boxShadow: "0 4px 20px rgba(255,255,255,0.08)",
  },
  footer: {
    marginTop: 28,
    fontSize: 11,
    color: "#444",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
};
