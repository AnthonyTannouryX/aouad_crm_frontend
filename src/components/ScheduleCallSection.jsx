import "./scheduleCallSection.css";

export default function ScheduleCallSection() {
    return (
        <section className="sc">
            <div className="sc-inner">
                {/* LEFT */}
                <div className="sc-left">
                    <h2 className="sc-title">WHERE TO START YOUR PROPERTY INVESTMENT JOURNEY...</h2>

                    <p className="sc-p">
                        Request a consultation call with one of our real estate experts. Who will help you
                        navigate the vast amount of property options and the ever growing property market that
                        Dubai and the rest of UAE has to offer.
                    </p>

                    <p className="sc-p">
                        Whether you're buying your first home or looking for an investment property, we are
                        here to guide you every step of the way.
                    </p>

                    <ul className="sc-bullets">
                        <li>Not sure where to start your property search?</li>
                        <li>Want to understand how to buy a property in Dubai?</li>
                        <li>Need expert advice on how to choose the perfect property for you?</li>
                        <li>Want personalized Dubai property ROI options within your budget?</li>
                        <li>Want to know how much your off plan property is worth before handover?</li>
                    </ul>
                </div>

                {/* RIGHT */}
                <div className="sc-card">
                    <div className="sc-card-head">
                        <h3 className="sc-card-title">SCHEDULE A CALL</h3>
                        <p className="sc-card-sub">
                            Fill out the form below, and one of our experts will contact you shortly with more
                            details about our off-plan properties.
                        </p>
                    </div>

                    <div className="sc-divider" />

                    <form className="sc-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="sc-row-2">
                            <div className="sc-field">
                                <label className="sc-label">First Name *</label>
                                <input className="sc-input" type="text" />
                            </div>

                            <div className="sc-field">
                                <label className="sc-label">Last Name *</label>
                                <input className="sc-input" type="text" />
                            </div>
                        </div>

                        <div className="sc-field">
                            <label className="sc-label">Email *</label>
                            <input className="sc-input" type="email" />
                        </div>

                        <div className="sc-field">
                            <label className="sc-label">Phone *</label>

                            <div className="sc-phone">
                                <div className="sc-flag">
                                    <span className="sc-uae" aria-hidden="true">🇦🇪</span>
                                    <span className="sc-caret" aria-hidden="true">▾</span>
                                    <span className="sc-code">+971</span>
                                </div>

                                <input className="sc-input sc-input--phone" type="tel" />
                            </div>
                        </div>

                        <button className="sc-btn" type="submit">
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
