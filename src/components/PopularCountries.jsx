import { Link } from "react-router-dom";
import "./popularCountries.css";

/* country images */
import DUBAI from "../assets/countries/dubai.jpg";
import LEBANON from "../assets/countries/lebanon.jpg";
import SAUDI from "../assets/countries/saudi.jpg";
import GREECE from "../assets/countries/greece.jpg";
import CYPRUS from "../assets/countries/cyprus.jpg";
import FRANCE from "../assets/countries/france.jpg";
import SPAIN from "../assets/countries/spain.jpg";
import ITALY from "../assets/countries/italy.jpg";

const COUNTRIES = [
  { name: "Dubai", slug: "dubai", img: DUBAI },
  { name: "Lebanon", slug: "lebanon", img: LEBANON },
  { name: "Saudi Arabia", slug: "saudi-arabia", img: SAUDI },
  { name: "Greece", slug: "greece", img: GREECE },
  { name: "Cyprus", slug: "cyprus", img: CYPRUS },
  { name: "France", slug: "france", img: FRANCE },
  { name: "Spain", slug: "spain", img: SPAIN },
  { name: "Italy", slug: "italy", img: ITALY },
];

export default function PopularCountries() {
  return (
    <section className="pc">
      <div className="pc-inner">
        <h2 className="pc-title">POPULAR COUNTRIES</h2>

        <div className="pc-grid">
          {COUNTRIES.map((c) => (
            <Link
              key={c.slug}
              to={`/listings?country=${encodeURIComponent(c.slug)}`}
              className="pc-card"
              onClick={() => window.scrollTo(0, 0)}
              aria-label={`View properties in ${c.name}`}
            >
              <div className="pc-imgWrap">
                <img src={c.img} alt={c.name} className="pc-img" />
              </div>

              <div className="pc-name">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
