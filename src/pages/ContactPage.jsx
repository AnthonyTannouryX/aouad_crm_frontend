import "./contactPage.css";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

export default function ContactPage() {
    return (
        <main className="contact">
            <div className="contact-inner">
                {/* breadcrumb */}
                <div className="contact-crumbs">
                    <span className="contact-crumbs__main">Aouad Real Estate</span>
                    <span className="contact-crumbs__sep">›</span>
                    <span className="contact-crumbs__sub">Contact</span>
                </div>

                <div className="contact-grid">
                    {/* LEFT */}
                    <section className="contact-left">
                        <h2 className="contact-h2">Contact Information</h2>

                        <div className="contact-kv">
                            <div className="contact-kv__row">
                                <div className="contact-kv__label">Address:</div>
                                <div className="contact-kv__value">
                                    <a
                                        className="contact-kv__link"
                                        href="https://maps.app.goo.gl/nE2pywZMB6reQ6Zi7"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Floor 11, Tower 44, Dekwaneh, Beirut
                                    </a>
                                </div>
                            </div>

                            <div className="contact-kv__row">
                                <div className="contact-kv__label">Phone:</div>
                                <a className="contact-kv__link" href="tel:+9613070383">
                                    +961 3 07 03 83
                                </a>
                            </div>

                            <div className="contact-kv__row">
                                <div className="contact-kv__label">WhatsApp:</div>
                                <a
                                    className="contact-kv__link"
                                    href={
                                        "https://wa.me/9613070383?text=" +
                                        encodeURIComponent("Hello, I’m interested in your real estate services.")
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    +961 3 07 03 83
                                </a>
                            </div>

                            <div className="contact-kv__row">
                                <div className="contact-kv__label">Email:</div>
                                <a className="contact-kv__link" href="mailto:info@aouad.co">
                                    info@aouad.co
                                </a>
                            </div>
                        </div>

                        <h3 className="contact-h3">Office Hours</h3>
                        <div className="contact-hours">
                            <div>Monday - Friday: 9:00 AM - 7:00 PM</div>
                            <div>Saturday: 10:00 AM - 4:00 PM</div>
                            <div>Sunday: Closed</div>
                        </div>

                        <h3 className="contact-h3">Follow Us</h3>
                        <div className="contact-social">
                            <a className="contact-social__btn" href="#" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                            <a className="contact-social__btn" href="#" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                            <a className="contact-social__btn" href="#" aria-label="LinkedIn">
                                <FaLinkedinIn />
                            </a>
                            <a
                                className="contact-social__btn"
                                href={
                                    "https://wa.me/9613070383?text=" +
                                    encodeURIComponent("Hello, I’m interested in your real estate services.")
                                }
                                target="_blank"
                                rel="noreferrer"
                                aria-label="WhatsApp"
                            >
                                <FaWhatsapp />
                            </a>
                        </div>
                    </section>

                    {/* RIGHT */}
                    <aside className="contact-card">
                        <div className="contact-card__inner">
                            <div className="contact-card__title">SCHEDULE A CALL</div>
                            <div className="contact-card__sub">
                                Fill out the form below, and one of our experts will contact you shortly with more details about our off-plan properties.
                            </div>

                            <div className="contact-card__hr" />

                            <form
                                className="contact-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    // TODO: wire to backend/email
                                    alert("Submitted ✅");
                                }}
                            >
                                <div className="contact-form__row2">
                                    <div className="contact-field">
                                        <label className="contact-label">First Name *</label>
                                        <input className="contact-input" required />
                                    </div>

                                    <div className="contact-field">
                                        <label className="contact-label">Last Name *</label>
                                        <input className="contact-input" required />
                                    </div>
                                </div>

                                <div className="contact-field">
                                    <label className="contact-label">Email *</label>
                                    <input className="contact-input" type="email" required />
                                </div>

                                <div className="contact-field">
                                    <label className="contact-label">Phone *</label>
                                    <div className="contact-phone">
                                        <div className="contact-phone__prefix">
                                            <span className="contact-flag" aria-hidden="true" />
                                            <span>+961</span>
                                            <span className="contact-phone__caret">▾</span>
                                        </div>
                                        <input className="contact-input contact-phone__input" required />
                                    </div>
                                </div>

                                <button className="contact-submit" type="submit">
                                    Submit
                                </button>

                                <div className="contact-mini">
                                    <span><FaEnvelope /> info@aouad.co</span>
                                    <span><FaPhoneAlt /> +961 3 07 03 83</span>
                                    <span><FaMapMarkerAlt /> Dekwaneh, Beirut</span>
                                </div>
                            </form>
                        </div>
                    </aside>
                </div>

                {/* MAP */}
                <section className="contact-map">
                    <h3 className="contact-h3 contact-h3--map">Our Location</h3>

                    <div className="contact-map__frame">
                        <iframe
                            title="Aouad Office Location"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src="https://www.google.com/maps?q=Tower%2044%20Dekwaneh%20Beirut&output=embed"
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}
