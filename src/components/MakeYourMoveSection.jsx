// src/components/MakeYourMoveSection.jsx
import "./makeYourMoveSection.css";
import { FaCheckCircle } from "react-icons/fa";

// team image
import teamPic from "../assets/ourteam/PHOTO-2026-02-07-13-25-44.jpg";

export default function MakeYourMoveSection() {
    return (
        <section className="mym">
            <div className="mym-inner">
                {/* LEFT */}
                <div className="mym-left">
                    <h2 className="mym-title">BUILD THE FUTURE</h2>

                    <p className="mym-intro">
                        At <strong>AOUAD</strong>, we are not building an agency.
                        <br />
                        We are building a <strong>platform</strong> for ambitious professionals
                        who want more — more growth, more impact, and more control over their future.
                    </p>

                    <ul className="mym-list">
                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                We believe in <strong>discipline, vision, and intelligent execution</strong>.
                                Our environment is designed to elevate talent through advanced training,
                                strategic mentorship, and a culture that rewards excellence.
                            </p>
                        </li>

                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                Driven by a <strong>technology-first mindset</strong>, AOUAD integrates
                                cutting-edge digital marketing, data-driven tools, and innovative systems
                                that give our agents a real competitive advantage.
                            </p>
                        </li>

                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                We invest in <strong>people before anything else</strong> — because when
                                our agents evolve, the brand evolves. Growth here is structured,
                                intentional, and measurable.
                            </p>
                        </li>

                        <li className="mym-item">
                            <FaCheckCircle className="mym-ic" />
                            <p>
                                If you’re ready to think bigger, move faster, and build something meaningful,
                                <strong> AOUAD is where your next chapter begins.</strong>
                            </p>
                        </li>
                    </ul>

                    <p className="mym-outro">
                        The future isn’t waited for. <strong>It’s built.</strong>
                        <br />
                        Are you ready to build yours?
                    </p>
                </div>

                {/* RIGHT */}
                <div className="mym-right">
                    <div className="mym-imgWrap">
                        <img
                            src={teamPic}
                            alt="AOUAD Team"
                            className="mym-img"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
