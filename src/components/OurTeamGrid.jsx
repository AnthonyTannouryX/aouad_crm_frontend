import "./ourTeamGrid.css";

/* team images */
import ABDULLAH from "../assets/ourteam/ABDULLAH.jpg";
import ANDREW from "../assets/ourteam/ANDREW.jpg";
import CARL from "../assets/ourteam/CARL.jpg";
import CAYELLA from "../assets/ourteam/CAYELLA.jpg";
import GHADY from "../assets/ourteam/GHADY.jpg";
import JOYA from "../assets/ourteam/JOYA.jpg";
import KEVIN from "../assets/ourteam/KEVIN.jpg";

const TEAM = [
    { name: "Abdullah", role: "Property Consultant", img: ABDULLAH },
    { name: "Andrew", role: "Property Consultant", img: ANDREW },
    { name: "Carl", role: "Senior Consultant", img: CARL },
    { name: "Cayella", role: "Property Consultant", img: CAYELLA },
    { name: "Ghady", role: "Property Consultant", img: GHADY },
    { name: "Joya", role: "Property Consultant", img: JOYA },
    { name: "Kevin", role: "Property Consultant", img: KEVIN },
];

export default function OurTeamGrid() {
    return (
        <section className="teamGrid">
            <div className="teamGrid-inner">
                <h1 className="teamGrid-title">OUR TEAM</h1>

                <div className="teamGrid-grid">
                    {TEAM.map((p, idx) => (
                        <article className="teamGrid-card" key={`${p.name}-${idx}`}>
                            <div className="teamGrid-imgWrap">
                                <img className="teamGrid-img" src={p.img} alt={p.name} />
                            </div>

                            <div className="teamGrid-meta">
                                <div className="teamGrid-name">{p.name}</div>
                                <div className="teamGrid-role">{p.role}</div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
