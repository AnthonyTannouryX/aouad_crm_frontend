import "./makeYourMoveSection.css";
import { FaCheckCircle } from "react-icons/fa";

// ✅ FIX: this file exists in your folder
import teamPic from "../assets/ourteam/PHOTO-2026-02-07-13-25-44.jpg";

export default function MakeYourMoveSection() {
    return (
        <section className="mym">
            <div className="mym-inner">
                {/* LEFT */}
                <div className="mym-left">
                    <h2 className="mym-title">MAKE YOUR MOVE</h2>

                    <ul className="mym-list">
                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                At Aouad Lifestyle Properties, we’re more than just a team, we’re a
                                community.
                            </p>
                        </li>

                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                We believe in working hard, celebrating successes, and growing together.
                                With a dynamic and supportive work environment, we invest in our people
                                through training, mentorship, and shared achievements. We ensure that you
                                have the very best industry tools available, and trusted guidance at your
                                disposal.
                            </p>
                        </li>

                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                Our founder comes from a technology background, bringing cutting-edge
                                digital marketing and innovative tools to give our agents a competitive
                                edge. We invest in the best resources to ensure your success, after all,
                                your success is key.
                            </p>
                        </li>

                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                If you&apos;re ready to take your career and earnings to the next level,
                                then Aouad Lifestyle Properties is the place to be. Are you ready to make
                                your move?
                            </p>
                        </li>
                    </ul>
                </div>

                {/* RIGHT */}
                <div className="mym-right">
                    <div className="mym-imgWrap">
                        <img src={teamPic} alt="Team" className="mym-img" />
                    </div>
                </div>
            </div>
        </section>
    );
}
