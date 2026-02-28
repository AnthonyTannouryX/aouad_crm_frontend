import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// ✅ adjust if your token key is different
function getToken() {
  return localStorage.getItem("token");
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text };
  }
}

export default function SettingsPage() {
  const [open, setOpen] = useState(false);

  // form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmNewPassword) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmNewPassword) return false;
    if (newPassword === currentPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirmNewPassword]);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setSubmitting(false);
    setError("");
    setSuccess("");
  }

  function close() {
    setOpen(false);
    resetForm();
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (!open) return;
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // prevent background scroll on mobile
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError("Please fix the form errors before saving.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("You are not logged in. Please login again.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update password.");
      }

      setSuccess("Password updated successfully.");

      // clear inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // auto close after success
      setTimeout(() => close(), 850);
    } catch (err) {
      setError(err?.message || "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="adm-card">
        <div className="adm-cardHead">
          <div className="adm-cardTitle">Settings</div>

          <button className="adm-btn" type="button" onClick={() => setOpen(true)}>
            Change password
          </button>
        </div>

        <div className="adm-muted">
          Next: lead sources, statuses, pipelines, permissions.
        </div>
      </div>

      {open && (
        <div className="adm-modalOverlay" role="dialog" aria-modal="true">
          <div className="adm-modalBackdrop" onClick={close} />

          <div className="adm-modal">
            <div className="adm-modalHeader">
              <div className="adm-modalTitle">Change password</div>
              <button className="adm-iconBtn" type="button" onClick={close} aria-label="Close">
                ✕
              </button>
            </div>

            <form className="adm-modalBody" onSubmit={handleSubmit}>
              <label className="adm-label">
                <span>Current password</span>
                <div className="adm-inputRow">
                  <input
                    className="adm-input"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoFocus
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button
                    className="adm-ghostBtn"
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                  >
                    {showCurrent ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="adm-label">
                <span>New password</span>
                <div className="adm-inputRow">
                  <input
                    className="adm-input"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                  />
                  <button
                    className="adm-ghostBtn"
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                  >
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="adm-hint">
                  • At least 8 chars • Must match confirmation • Different from current
                </div>

                {newPassword && newPassword.length < 8 && (
                  <div className="adm-error">New password must be at least 8 characters.</div>
                )}
              </label>

              <label className="adm-label">
                <span>Confirm new password</span>
                <div className="adm-inputRow">
                  <input
                    className="adm-input"
                    type={showConfirm ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                  />
                  <button
                    className="adm-ghostBtn"
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>

                {confirmNewPassword && newPassword && confirmNewPassword !== newPassword && (
                  <div className="adm-error">Passwords do not match.</div>
                )}
              </label>

              {error && <div className="adm-errorBox">{error}</div>}
              {success && <div className="adm-successBox">{success}</div>}

              <div className="adm-modalFooter">
                <button
                  className="adm-btnSecondary"
                  type="button"
                  onClick={close}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button className="adm-btnPrimary" type="submit" disabled={!canSubmit || submitting}>
                  {submitting ? "Saving..." : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local styles (no external CSS required) */}
      <style>{`
        .adm-card {
          border-radius: 16px;
          padding: 18px;
          background: rgba(17, 24, 39, 0.65);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(10px);
          color: #fff;
          max-width: 920px;
        }

        .adm-cardHead{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          margin-bottom: 10px;
        }

        .adm-cardTitle {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .adm-muted {
          color: rgba(255,255,255,0.65);
          font-size: 14px;
          line-height: 1.5;
        }

        .adm-btn {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.08);
          color: #fff;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: transform .06s ease, background .15s ease;
        }
        .adm-btn:hover { background: rgba(255,255,255,0.12); }
        .adm-btn:active { transform: translateY(1px); }

        /* Modal overlay */
        .adm-modalOverlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 16px;
        }
        .adm-modalBackdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(2px);
        }

        .adm-modal {
          position: relative;
          width: min(560px, 100%);
          background: #0b1220;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.45);
          overflow: hidden;
        }

        /* Mobile: bottom sheet full-width */
        @media (max-width: 520px){
          .adm-modalOverlay { padding: 0; place-items: end center; }
          .adm-modal {
            width: 100%;
            border-radius: 18px 18px 0 0;
            max-height: 92vh;
          }
        }

        .adm-modalHeader{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding: 14px 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .adm-modalTitle{
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .adm-iconBtn{
          width: 36px;
          height: 36px;
          display:grid;
          place-items:center;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color:#fff;
          cursor:pointer;
        }

        .adm-modalBody{
          padding: 14px;
          display: grid;
          gap: 14px;
          overflow: auto;
          max-height: 70vh;
        }
        @media (max-width: 520px){
          .adm-modalBody{ max-height: calc(92vh - 58px); }
        }

        .adm-label{
          display:grid;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.85);
        }

        .adm-inputRow{
          display:flex;
          gap: 10px;
          align-items: stretch;
        }

        .adm-input{
          flex: 1;
          width: 100%;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #fff;
          outline: none;
          font-size: 14px;
        }
        .adm-input::placeholder{ color: rgba(255,255,255,0.35); }
        .adm-input:focus{
          border-color: rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.08);
        }

        .adm-ghostBtn{
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.9);
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
        }
        .adm-ghostBtn:hover{ background: rgba(255,255,255,0.08); }

        .adm-hint{
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          line-height: 1.4;
        }

        .adm-error{
          margin-top: 6px;
          font-size: 12px;
          color: rgba(255, 145, 145, 0.95);
        }

        .adm-errorBox{
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 99, 99, 0.35);
          background: rgba(255, 99, 99, 0.10);
          color: rgba(255,255,255,0.95);
          font-size: 13px;
        }
        .adm-successBox{
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(90, 255, 170, 0.30);
          background: rgba(90, 255, 170, 0.10);
          color: rgba(255,255,255,0.95);
          font-size: 13px;
        }

        .adm-modalFooter{
          display:flex;
          gap: 10px;
          justify-content:flex-end;
          padding-top: 4px;
        }

        .adm-btnSecondary, .adm-btnPrimary{
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          cursor:pointer;
          font-weight: 800;
          font-size: 14px;
        }

        .adm-btnSecondary{
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
        }
        .adm-btnPrimary{
          background: rgba(255,255,255,0.14);
          color: #fff;
        }

        .adm-btnSecondary:disabled, .adm-btnPrimary:disabled{
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}