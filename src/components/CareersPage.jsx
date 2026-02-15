import { useEffect, useMemo, useState } from "react";
import "./careersPublic.css";

const STORAGE_KEY = "aouad_jobs_v1";

function loadJobs() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function CareersPage() {
    const [jobs, setJobs] = useState([]);
    const [selected, setSelected] = useState(null);

    // application form
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [cvFile, setCvFile] = useState(null);

    useEffect(() => {
        const all = loadJobs();
        setJobs(all.filter((x) => x?.isActive));
    }, []);

    const mailto = useMemo(() => {
        if (!selected) return "mailto:hr@aouad.com";
        const to = selected.applyEmail || "hr@aouad.com";
        const subject = `Application - ${selected.title}`;
        const body =
            `Hello Aouad HR,%0D%0A%0D%0A` +
            `I would like to apply for: ${selected.title}%0D%0A` +
            `Type: ${selected.type} | ${selected.workMode}%0D%0A` +
            `Location: ${selected.location}%0D%0A` +
            `Department: ${selected.dept}%0D%0A%0D%0A` +
            `Candidate:%0D%0A` +
            `Name: ${fullName || "-"}%0D%0A` +
            `Email: ${email || "-"}%0D%0A` +
            `Phone: ${phone || "-"}%0D%0A%0D%0A` +
            `Cover letter:%0D%0A${encodeURIComponent(coverLetter || "-")}%0D%0A%0D%0A` +
            `CV: Please find attached.%0D%0A`;

        return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${body}`;
    }, [selected, fullName, email, phone, coverLetter]);

    const onPick = (job) => {
        setSelected(job);
        setFullName("");
        setEmail("");
        setPhone("");
        setCoverLetter("");
        setCvFile(null);
    };

    const onClose = () => setSelected(null);

    const canApply = useMemo(() => {
        return selected && fullName.trim().length >= 2 && email.includes("@");
    }, [selected, fullName, email]);

    return (
        <main className="cp">
            <div className="cp-inner">
                <h1 className="cp-title">Careers</h1>
                <p className="cp-sub">Explore our current opportunities and apply in minutes.</p>

                <div className="cp-grid">
                    {jobs.length === 0 ? (
                        <div className="cp-empty">No open positions at the moment.</div>
                    ) : (
                        jobs.map((j) => (
                            <button key={j.id} className="cp-card" type="button" onClick={() => onPick(j)}>
                                <div className="cp-cardTop">
                                    <div className="cp-cardTitle">{j.title}</div>
                                    <span className="cp-badge">{j.type}</span>
                                </div>
                                <div className="cp-meta">
                                    <span>{j.workMode}</span>
                                    <span>•</span>
                                    <span>{j.location}</span>
                                    <span>•</span>
                                    <span>{j.dept}</span>
                                </div>
                                {j.summary ? <div className="cp-summary">{j.summary}</div> : null}
                                <div className="cp-cta">View & Apply →</div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* APPLY MODAL */}
            {selected && (
                <div className="cp-modalOverlay" onClick={onClose} role="presentation">
                    <div className="cp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="cp-modalTop">
                            <div>
                                <div className="cp-modalTitle">{selected.title}</div>
                                <div className="cp-modalMeta">
                                    {selected.type} · {selected.workMode} · {selected.location} · {selected.dept}
                                </div>
                            </div>
                            <button className="cp-x" type="button" onClick={onClose} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        <div className="cp-modalBody">
                            <div className="cp-sections">
                                <Section title="Responsibilities" text={selected.responsibilities} />
                                <Section title="Requirements" text={selected.requirements} />
                                <Section title="Benefits" text={selected.benefits} />
                            </div>

                            <div className="cp-apply">
                                <div className="cp-applyTitle">Apply now</div>

                                <div className="cp-formGrid">
                                    <div>
                                        <label className="cp-lbl">Full name *</label>
                                        <input className="cp-in" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                    </div>

                                    <div>
                                        <label className="cp-lbl">Email *</label>
                                        <input className="cp-in" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>

                                    <div className="cp-span2">
                                        <label className="cp-lbl">Phone</label>
                                        <input className="cp-in" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </div>

                                    <div className="cp-span2">
                                        <label className="cp-lbl">Cover letter</label>
                                        <textarea
                                            className="cp-ta"
                                            rows={6}
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            placeholder="Write a short cover letter..."
                                        />
                                    </div>

                                    <div className="cp-span2">
                                        <label className="cp-lbl">CV (PDF/DOC/DOCX)</label>
                                        <input
                                            className="cp-file"
                                            type="file"
                                            accept=".pdf,.doc,.docx,application/pdf"
                                            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                                        />
                                        {cvFile ? <div className="cp-fileHint">Selected: {cvFile.name}</div> : null}
                                        <div className="cp-hint">
                                            For now, clicking “Send Application” opens your email app. You’ll attach the CV manually.
                                            Next step: we’ll upload the CV directly to your server (R2) and submit in one click.
                                        </div>
                                    </div>
                                </div>

                                <div className="cp-actions">
                                    <button className="cp-btnGhost" type="button" onClick={onClose}>
                                        Cancel
                                    </button>
                                    <a
                                        className={"cp-btnPrimary " + (!canApply ? "is-disabled" : "")}
                                        href={canApply ? mailto : undefined}
                                        onClick={(e) => {
                                            if (!canApply) e.preventDefault();
                                        }}
                                    >
                                        Send Application →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function Section({ title, text }) {
    return (
        <div className="cp-sec">
            <div className="cp-secTitle">{title}</div>
            <pre className="cp-pre">{text?.trim() ? text : "—"}</pre>
        </div>
    );
}
