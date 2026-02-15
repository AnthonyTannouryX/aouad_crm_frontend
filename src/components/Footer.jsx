import "./footer.css";
import logo from "../assets/logo_real_state_gold.png";

import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaWhatsapp,
} from "react-icons/fa";
import { HiOutlineMail, HiOutlinePhone } from "react-icons/hi";

export default function Footer() {
    return (
        <footer className="ft">
            {/* TOP LINE */}
            <div className="ft-line" />

            <div className="ft-inner">
                {/* LOGO */}
                <img src={logo} alt="Aouad Real Estate" className="ft-logo" />

                {/* CONTACT */}
                <div className="ft-contact">
                    <a href="mailto:info@aouadrealestate.com" className="ft-link">
                        <HiOutlineMail />
                        info@aouadrealestate.com
                    </a>

                    <a href="tel:+96100000000" className="ft-link">
                        <HiOutlinePhone />
                        +961 00 000 000
                    </a>
                </div>

                {/* SOCIAL */}
                <div className="ft-social">
                    <a href="#" className="ft-soc" aria-label="Facebook">
                        <FaFacebookF />
                    </a>
                    <a href="#" className="ft-soc" aria-label="Instagram">
                        <FaInstagram />
                    </a>
                    <a href="#" className="ft-soc" aria-label="LinkedIn">
                        <FaLinkedinIn />
                    </a>
                    <a href="#" className="ft-soc" aria-label="WhatsApp">
                        <FaWhatsapp />
                    </a>
                </div>

                {/* COPYRIGHT */}
                <div className="ft-copy">
                    © All rights reserved. Made by{" "}
                    <span className="ft-brand">Aouad Real Estate</span>
                </div>
            </div>
        </footer>
    );
}
