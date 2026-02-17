import "./whyAouadPage.css";

import heroBg from "../assets/carousel2.jpg";
import logoBlack from "../assets/logoblack.png";

import FounderSection from "../components/FounderSection";
import OurTeam from "../components/OurTeam";

export default function WhyAouadPage() {
    return (
        <main className="whyAouad">

            {/* ================= HERO ================= */}
            <section
                className="whyAouad-hero"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                <div className="whyAouad-heroOverlay" />

                <div className="whyAouad-heroInner">
                    <div className="whyAouad-heroContent">
                        <div className="whyAouad-eyebrow">AOUAD.CO
                        </div>
                        <h1 className="whyAouad-titleSingle">WHY AOUAD</h1>
                        <p className="whyAouad-sub">
                            Your trusted partner in property investment.
                            <br />
                            Precision. Positioning. Performance.
                        </p>
                    </div>
                </div>
            </section>

            { }
            <section className="whyAouad-twoCol">
                <div className="whyAouad-inner whyAouad-twoColGrid">

                    {/* LEFT */}
                    <div className="whyAouad-left">
                        <h2 className="whyAouad-h2">WHY CLIENTS CHOOSE AOUAD</h2>
                        <p className="whyAouad-lead">
                            Invest with confidence. Guided by strategy, expertise, and a client-first approach.
                        </p>

                        <div className="whyAouad-bullets">
                            <div className="whyAouad-bullet">
                                <span className="whyAouad-check" aria-hidden="true">✓</span>
                                <p className="whyAouad-bulletText">
                                    At AOUAD, we operate beyond transactions. We build long-term partnerships founded
                                    on trust, discretion, and performance. Our in-depth understanding of local and
                                    international property markets allows us to deliver strategic advice and position
                                    every client for sustainable long-term value.
                                </p>
                            </div>

                            <div className="whyAouad-bullet">
                                <span className="whyAouad-check" aria-hidden="true">✓</span>
                                <p className="whyAouad-bulletText">
                                    From initial consultation to final handover, we manage every detail with precision.
                                    Our streamlined process, market insight, and commitment to excellence create a
                                    seamless experience that consistently delivers results.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT (LOGO) */}
                    <div className="whyAouad-right">
                        <div className="whyAouad-logoWrap">
                            <img
                                className="whyAouad-logo"
                                src={logoBlack}
                                alt="Aouad Real Estate"
                            />
                        </div>
                    </div>

                </div>
            </section>

            {/* ================= OUR TEAM ================= */}
            <section className="whyAouad-team">
                <OurTeam />
            </section>

            {/* ================= FROM OUR FOUNDER ================= */}
            <FounderSection />

        </main>
    );
}
