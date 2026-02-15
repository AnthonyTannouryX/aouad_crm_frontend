import "./featuredOffPlanProjects.css";

import imgTrump from "../assets/OFF-PLAN/prop1.jpeg";
import imgDVillas from "../assets/OFF-PLAN/23.jpg.png";
import imgAlba from "../assets/OFF-PLAN/BATUMI, GEORGIA (5).jpg.png";

export default function FeaturedOffPlanProjects() {
    return (
        <section className="fop">
            <div className="fop-inner">
                <h2 className="fop-title">FEATURED OFF-PLAN PROJECTS</h2>

                <div className="fop-layout">
                    {/* LEFT BIG CARD */}
                    <article className="fop-card fop-card--big">
                        <img src={imgTrump} alt="" className="fop-img" />

                        <div className="fop-badges">
                            <span className="fop-badge light">From AED 2.6M</span>
                            <span className="fop-badge dark">Handover by 2031</span>
                        </div>

                        <div className="fop-overlay" />

                        <div className="fop-content">
                            <h3 className="fop-name">
                                Trump International Hotel & Tower Dubai
                            </h3>
                            <div className="fop-dev">| Darglobal</div>

                            <p className="fop-desc">
                                Trump International Hotel & Tower Dubai is the epitome of luxury
                                from DarGlobal.
                            </p>

                            <button className="fop-btn">View Details</button>
                        </div>
                    </article>

                    {/* RIGHT COLUMN */}
                    <div className="fop-right">
                        {/* TOP RIGHT */}
                        <article className="fop-card">
                            <img src={imgDVillas} alt="" className="fop-img" />

                            <div className="fop-badges">
                                <span className="fop-badge light">From AED 6.0M</span>
                                <span className="fop-badge dark">Handover by 2028</span>
                            </div>

                            <div className="fop-overlay" />

                            <div className="fop-content">
                                <h3 className="fop-name">
                                    D Villas <span>| Darglobal</span>
                                </h3>

                                <p className="fop-desc">
                                    D Villas is a unique complex of villas from the developer
                                    DarGlobal, which offers an unsurpassed combination of refined
                                    luxury and serene tranquility.
                                </p>

                                <button className="fop-btn">View Details</button>
                            </div>
                        </article>

                        {/* BOTTOM RIGHT */}
                        <article className="fop-card">
                            <img src={imgAlba} alt="" className="fop-img" />

                            <div className="fop-badges">
                                <span className="fop-badge light">From AED 18.0M</span>
                                <span className="fop-badge dark">Handover by 2028</span>
                            </div>

                            <div className="fop-overlay" />

                            <div className="fop-content">
                                <h3 className="fop-name">
                                    Alba Dorchester Collection <span>| Omniyat</span>
                                </h3>

                                <p className="fop-desc">
                                    Alba Dorchester Collection is a new standard of luxury, ideally
                                    located on Palm Jumeirah Island, offering spacious residences
                                    and penthouses.
                                </p>

                                <button className="fop-btn">View Details</button>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    );
}
