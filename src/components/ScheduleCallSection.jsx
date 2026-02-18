import { useState } from "react";
import "./scheduleCallSection.css";

export default function ScheduleCallSection() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        const subject = encodeURIComponent("New Schedule Call Request");
        const body = encodeURIComponent(
            `New consultation request:\n\n` +
            `First Name: ${firstName}\n` +
            `Last Name: ${lastName}\n` +
            `Email: ${email}\n` +
            `Phone: +961 ${phone}\n\n` +
            `— Sent from AOUAD website`
        );

        window.location.href = `mailto:info@aouad.co?subject=${subject}&body=${body}`;
    }

    return (
        <section className="sc">
            <div className="sc-inner">
                {/* LEFT */}
                <div className="sc-left">
                    <h2 className="sc-title">
                        WHERE YOUR PROPERTY JOURNEY BEGINS — CURATED BY AOUAD
                    </h2>

                    <p className="sc-p">
                        Request a private consultation with one of AOUAD’s real estate advisors and gain access
                        to a carefully curated portfolio of premium opportunities in Beirut, Dubai, and key
                        international markets. We simplify complexity, filter the noise, and connect you only
                        with assets that meet our standards of value, quality, and long-term potential.
                    </p>

                    <p className="sc-p">
                        Whether you are acquiring your first home or structuring a strategic investment, AOUAD
                        guides you with discretion, precision, and a results-driven approach — every step of
                        the way.
                    </p>

                    <ul className="sc-bullets">
                        <li>Unsure where to begin your property search?</li>
                        <li>Want a clear, professional roadmap to buying real estate?</li>
                        <li>Looking for expert guidance to select the right asset for your goals?</li>
                        <li>Interested in personalized ROI-driven opportunities within your budget?</li>
                        <li>Want to know the future value of an off-plan property before handover?</li>
                    </ul>

                    <p className="sc-signature">
                        <strong>AOUAD</strong> — Your confidence. Our greatest success.
                    </p>
                </div>

                {/* RIGHT */}
                <div className="sc-card">
                    <div className="sc-card-head">
                        <h3 className="sc-card-title">SCHEDULE A CALL</h3>
                        <p className="sc-card-sub">
                            Fill out the form below, and one of our experts will contact you shortly.
                        </p>
                    </div>

                    <div className="sc-divider" />

                    <form className="sc-form" onSubmit={handleSubmit}>
                        <div className="sc-row-2">
                            <div className="sc-field">
                                <label className="sc-label">First Name *</label>
                                <input
                                    className="sc-input"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="sc-field">
                                <label className="sc-label">Last Name *</label>
                                <input
                                    className="sc-input"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="sc-field">
                            <label className="sc-label">Email *</label>
                            <input
                                className="sc-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="sc-field">
                            <label className="sc-label">Phone *</label>

                            <div className="sc-phone">
                                <div className="sc-flag">
                                    <span aria-hidden>🇱🇧</span>
                                    <span className="sc-code">+961</span>
                                </div>

                                <input
                                    className="sc-input sc-input--phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="70 123 456"
                                    required
                                />
                            </div>
                        </div>

                        <button className="sc-btn" type="submit">
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
