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
                        <h2 className="whyAouad-h2">WHY OUR CLIENTS WORK WITH US</h2>
                        <p className="whyAouad-lead">
                            Invest with certainty. Be guided by expertise and personalized care.
                        </p>

                        <div className="whyAouad-bullets">
                            <div className="whyAouad-bullet">
                                <span className="whyAouad-check" aria-hidden="true">✓</span>
                                <p className="whyAouad-bulletText">
                                    At Aouad Real Estate, we go beyond transactions. We build trust and
                                    relationships, offering a seamless journey tailored to each client.
                                    Our deep understanding of Dubai’s property market enables us to provide
                                    strategic guidance and ensure every decision is well-informed for
                                    long-term value.
                                </p>
                            </div>

                            <div className="whyAouad-bullet">
                                <span className="whyAouad-check" aria-hidden="true">✓</span>
                                <p className="whyAouad-bulletText">
                                    From the first conversation to handing over the keys, we make the process
                                    smooth and stress-free, offering unmatched service and insight. This
                                    dedication sets us apart from competitors, with lasting connections and
                                    a reputation built on results.
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
