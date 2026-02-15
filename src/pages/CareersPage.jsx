import CareersHero from "../components/CareersHero";
import MakeYourMoveSection from "../components/MakeYourMoveSection";
import CareersOpenPositions from "../components/CareersOpenPositions";
import CareersInfoSections from "../components/CareersInfoSections";
import CareersFAQ from "../components/CareersFAQ";
import CareersJoinCTA from "../components/CareersJoinCTA";

export default function CareersPage() {
    return (
        <>
            <CareersHero />
            <MakeYourMoveSection />

            <CareersOpenPositions />
            <CareersInfoSections />
            <CareersFAQ />
            <CareersJoinCTA />
        </>
    );
}
