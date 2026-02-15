import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import "./ourTeamCarousel.css";

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

export default function OurTeamCarousel() {
    return (
        <section className="teamC">
            <div className="teamC-inner">
                <h2 className="teamC-title">OUR TEAM</h2>

                <Swiper
                    modules={[Navigation]}
                    className="teamC-swiper"
                    navigation
                    slidesPerView={4}
                    slidesPerGroup={1}         // ✅ swipe 1 by 1
                    spaceBetween={18}
                    speed={450}
                    breakpoints={{
                        0: { slidesPerView: 1.15, spaceBetween: 12 },
                        520: { slidesPerView: 2.15, spaceBetween: 14 },
                        860: { slidesPerView: 3, spaceBetween: 16 },
                        1100: { slidesPerView: 4, spaceBetween: 18 },
                    }}
                >
                    {TEAM.map((p, idx) => (
                        <SwiperSlide key={`${p.name}-${idx}`}>
                            <article className="teamC-card">
                                <div className="teamC-imgWrap">
                                    <img className="teamC-img" src={p.img} alt={p.name} />
                                </div>

                                <div className="teamC-meta">
                                    <div className="teamC-name">{p.name}</div>
                                    <div className="teamC-role">{p.role}</div>
                                </div>
                            </article>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
