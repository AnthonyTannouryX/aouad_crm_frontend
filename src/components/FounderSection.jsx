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
                            “QUITE SIMPLY, OUR SUCCESS IS
                            <br />
                            BUILT ON YOURS”
                        </h2>

                        <div className="founder-bullets">
                            <div className="founder-bullet">
                                <span className="founder-check" aria-hidden="true">✓</span>
                                <p className="founder-text">
                                    Real estate isn’t just about transactions it’s about relationships.
                                    We know that our success is built on yours, which is why we go beyond
                                    simply finding you a property.
                                </p>
                            </div>

                            <div className="founder-bullet">
                                <span className="founder-check" aria-hidden="true">✓</span>
                                <p className="founder-text">
                                    What sets us apart is our personalized approach. We understand your needs,
                                    anticipate what matters most, and provide a seamless, discreet experience.
                                    We're not just guiding you through the process—we're your partner, building a
                                    meaningful, long-term relationship for the future.
                                </p>
                            </div>

                            <div className="founder-bullet">
                                <span className="founder-check" aria-hidden="true">✓</span>
                                <p className="founder-text">
                                    Your satisfaction isn’t just a goal, it’s the foundation of everything we do.
                                    When you succeed, we do too.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="founder-right">
                        <div className="founder-photoWrap">
                            <img className="founder-photo" src={founderImg} alt="Founder" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
