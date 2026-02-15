// src/data/listings.js
import { OFFPLAN_LISTINGS } from "./offPlanListings";

export function getListingById(id) {
    const numId = Number(id);
    const base = OFFPLAN_LISTINGS.find((x) => x.id === numId);
    if (!base) return null;

    // Build the object your ListingDetailsPage expects
    return {
        id: base.id,
        title: base.title,
        developer: base.developer,
        paymentPlan: base.paymentPlan,
        community: base.location,
        startingPrice: base.price,
        completionYear: (base.handover || "").replace("Handover by ", ""), // "2027" etc
        typeBadge: "Off-Plan",
        brochureUrl: "#",
        mapEmbedUrl: "https://www.google.com/maps?q=Dubai&output=embed",

        // Your UI expects an images array
        images: [base.image, base.image, base.image],

        // Your UI expects about paragraphs
        about: [
            "Premium off-plan opportunity in Dubai, crafted for modern living and strong investment potential.",
            "Flexible payment terms and high-quality finishing with curated amenities.",
        ],

        // Your UI expects agent fields
        agent: {
            name: "Aouad Real Estate",
            role: "Property Consultant",
            photo: base.image,
        },
    };
}
