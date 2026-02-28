// src/agent/pages/AgentSettingsPage.jsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AgentSettingsPage() {
    const [me, setMe] = useState(null);
    const [saving, setSaving] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);

    const [pwd, setPwd] = useState({
        current: "",
        next: "",
        confirm: "",
    });

    async function load() {
        try {
            const res = await api.get("/agent/me");
            setMe(res.data);
        } catch (e) {
            alert("Failed to load profile");
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function saveProfile(e) {
        e.preventDefault();
        if (saving) return;

        setSaving(true);
        try {
            await api.patch("/agent/me", {
                fullName: me.fullName,
                phone: me.phone || null,
                languages: me.languages || [],
                bio: me.bio || null,
            });
            alert("Saved!");
            load();
        } catch (e2) {
            alert(e2?.response?.data?.error || e2.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function changePassword(e) {
        e.preventDefault();
        if (pwdSaving) return;

        if (!pwd.current || pwd.next.length < 6) {
            return alert("Password must be at least 6 characters");
        }
        if (pwd.next !== pwd.confirm) {
            return alert("Passwords do not match");
        }
        if (pwd.current === pwd.next) {
            return alert("New password must be different");
        }

        try {
            setPwdSaving(true);
            await api.post("/agent/change-password", {
                currentPassword: pwd.current,
                newPassword: pwd.next,
            });

            setPwd({ current: "", next: "", confirm: "" });
            alert("Password updated!");
        } catch (e2) {
            alert(e2?.response?.data?.error || e2.message || "Failed");
        } finally {
            setPwdSaving(false);
        }
    }

    if (!me) return <div className="agt-card">Loading…</div>;

    return (
        <div className="agt-grid">
            {/* PROFILE */}
            <div className="agt-span6">
                <div className="agt-card">
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Profile</div>

                    <form onSubmit={saveProfile} style={{ display: "grid", gap: 10 }}>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Full name</label>
                        <input
                            className="agt-input"
                            value={me.fullName || ""}
                            onChange={(e) =>
                                setMe((x) => ({ ...x, fullName: e.target.value }))
                            }
                            required
                        />

                        <label style={{ fontSize: 12, fontWeight: 700 }}>Phone</label>
                        <input
                            className="agt-input"
                            value={me.phone || ""}
                            onChange={(e) =>
                                setMe((x) => ({ ...x, phone: e.target.value }))
                            }
                            placeholder="+961..."
                        />

                        <label style={{ fontSize: 12, fontWeight: 700 }}>Bio</label>
                        <input
                            className="agt-input"
                            value={me.bio || ""}
                            onChange={(e) =>
                                setMe((x) => ({ ...x, bio: e.target.value }))
                            }
                            placeholder="Short intro..."
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                            <button className="agt-btn" disabled={saving} type="submit">
                                {saving ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="agt-span6">
                <div className="agt-card">
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Change Password</div>

                    <form onSubmit={changePassword} style={{ display: "grid", gap: 10 }}>
                        <input
                            className="agt-input"
                            type="password"
                            placeholder="Current password"
                            value={pwd.current}
                            onChange={(e) =>
                                setPwd((x) => ({ ...x, current: e.target.value }))
                            }
                            required
                        />

                        <input
                            className="agt-input"
                            type="password"
                            placeholder="New password (min 6 chars)"
                            value={pwd.next}
                            onChange={(e) =>
                                setPwd((x) => ({ ...x, next: e.target.value }))
                            }
                            required
                        />

                        <input
                            className="agt-input"
                            type="password"
                            placeholder="Confirm new password"
                            value={pwd.confirm}
                            onChange={(e) =>
                                setPwd((x) => ({ ...x, confirm: e.target.value }))
                            }
                            required
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button className="agt-btn" type="submit" disabled={pwdSaving}>
                                {pwdSaving ? "Updating…" : "Update"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}