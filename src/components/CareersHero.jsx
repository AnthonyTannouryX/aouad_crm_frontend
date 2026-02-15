// src/components/CareersHero.jsx
import "./careersHero.css";
import bg from "../assets/Colleyville-real-estate.jpg";

export default function CareersHero() {
    return (
        <section
            className="careers-hero"
            style={{ backgroundImage: `url(${bg})` }}
        >
            <div className="careers-overlay" />

            <div className="careers-content">
                <span className="careers-eyebrow">Careers</span>

                <h1>
                    BEGIN YOUR CAREER
                    <br />
                    WITH US!
                </h1>

                <p>
                    If you’re ready for a transformative opportunity, we’re ready to
                    welcome you to our team.
                </p>
            </div>
        </section>
    );
}
