// src/components/ScheduleCallSection.jsx
import "./scheduleCallSection.css";

export default function ScheduleCallSection() {
    return (
        <section className="sc">
            <div className="sc-inner sc-inner--single">
                <div className="sc-left">
                    <h2 className="sc-title">
                        WHERE YOUR PROPERTY JOURNEY BEGINS — CURATED BY AOUAD
                    </h2>

                    <p className="sc-p">
                        Request a private consultation with one of AOUAD’s real estate advisors
                        and gain access to a carefully curated portfolio of premium opportunities
                        in Beirut, Dubai, and key international markets. We simplify complexity,
                        filter the noise, and connect you only with assets that meet our standards
                        of value, quality, and long-term potential.
                    </p>

                    <p className="sc-p">
                        Whether you are acquiring your first home or structuring a strategic
                        investment, AOUAD guides you with discretion, precision, and a
                        results-driven approach — every step of the way.
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
            </div>
        </section>
    );
}