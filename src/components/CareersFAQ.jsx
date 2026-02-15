import "./careersPageSections.css";

const FAQ = [
    {
        q: "Do I need experience to become an Real Estate Agent?",
        a: "While experience in sales or real estate is beneficial, it’s not mandatory. What matters most is your ability to learn, adapt, and connect with clients. If you are willing, we can teach you.",
    },
    {
        q: "How do I get clients?",
        a: "Successful agents use a mix of networking, social media, prospecting, and referrals to build a strong client base. Our in house marketing and technology teams also provide valuable support.",
    },
    {
        q: "Is this a full-time or part-time role?",
        a: "This is a full-time role, and your success depends on your ability to dedicate time and effort to your career.",
    },
    {
        q: "What kind of properties will I be selling?",
        a: "You will specialize in luxury residential and investment properties in Dubai’s most sought-after communities.",
    },
    {
        q: "How quickly can I start making money?",
        a: "Commissions are earned upon closing deals, so the timeline depends on your effort, network, and ability to close transactions. Most agents close their first deal within the first 3–6 months.",
    },
];

export default function CareersFAQ() {
    return (
        <section className="csec">
            <div className="csec-inner">
                <h2 className="csec-h2">Frequently Asked Questions</h2>

                <div className="faq">
                    {FAQ.map((f, idx) => (
                        <div className="faq-row" key={idx}>
                            <div className="faq-q">
                                <span className="faq-num">{idx + 1}.</span> {f.q}
                            </div>
                            <div className="faq-a">{f.a}</div>
                        </div>
                    ))}
                </div>

                <div className="csec-divider" />
            </div>
        </section>
    );
}
