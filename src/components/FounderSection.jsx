// src/components/FounderSection.jsx
import "./founderSection.css";
import founderImg from "../assets/ourteam/andrew2.jpg";

export default function FounderSection() {
    return (
        <section className="founder">
            <div className="founder-inner">
                <div className="founder-grid">
                    {/* LEFT */}
                    <div className="founder-left">
                        <div className="founder-eyebrow">FROM OUR FOUNDER</div>

                        <h2 className="founder-title">
                            “WE DON’T JUST SELL PROPERTY —
                            <br />
                            WE POSITION YOU FOR THE NEXT LEVEL.”
                        </h2>

                        <div className="founder-bullets">
                            <div className="founder-bullet">
                                <span className="founder-check" aria-hidden="true">✓</span>
                                <p className="founder-text">
                                    Real estate isn’t about square meters or transactions.
                                    It’s about <strong>vision, timing, and making the right move at the right moment</strong>.
                                    Every decision we guide you through is strategic — never accidental.
                                </p>
                            </div>

                            <div className="founder-bullet">
                                <span className="founder-check" aria-hidden="true">✓</span>
                                <p className="founder-text">
                                    What sets us apart is <strong>precision</strong>.
                                    We don’t chase listings — we curate opportunities.
                                    We don’t push deals — we protect value.
                                    Every project we represent is positioned with intention,
                                    clarity, and a long-term perspective.
                                </p>
                            </div>

                            <div className="founder-bullet">
                                <span className="founder-check" aria-hidden="true">✓</span>
                                <p className="founder-text">
                                    At <strong>AOUAD</strong>, success isn’t measured by sales volume.
                                    It’s measured by the strength of the relationships we build
                                    and the futures we help secure.
                                    <strong> When you grow, we grow with you.</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="founder-right">
                        <div className="founder-photoWrap">
                            <img
                                className="founder-photo"
                                src={founderImg}
                                alt="Founder of AOUAD"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
