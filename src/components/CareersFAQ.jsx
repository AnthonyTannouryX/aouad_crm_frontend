import "./careersPageSections.css";

const FAQ = [
    {
        q: "Do I need experience to join AOUAD?",
        a: "Experience in sales or real estate is an advantage, but it is not mandatory. What matters most is mindset, discipline, and the willingness to learn. We provide the structure, guidance, and systems — you bring the ambition.",
    },
    {
        q: "How do I build a client base?",
        a: "Top-performing advisors combine networking, personal branding, referrals, and consistent prospecting. At AOUAD, we support you with strategic marketing, digital exposure, and advanced tools to accelerate your growth.",
    },
    {
        q: "Is this a full-time commitment?",
        a: "Yes. Real estate at AOUAD is treated as a serious career, not a side activity. Success requires focus, consistency, and a professional, long-term approach.",
    },
    {
        q: "What type of properties will I handle?",
        a: "You will represent high-quality residential and investment properties across Beirut and key Lebanese markets, with a focus on strategic positioning and long-term value.",
    },
    {
        q: "When can I start generating income?",
        a: "Commissions are earned upon closing transactions. Timelines vary based on effort, consistency, and market activity. Motivated agents who stay disciplined can begin closing deals within their first few months.",
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
