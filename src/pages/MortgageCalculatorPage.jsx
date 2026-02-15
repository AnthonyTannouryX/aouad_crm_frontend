// src/pages/MortgageCalculatorPage.jsx
import { useMemo, useState } from "react";
import "./mortgageCalculatorPage.css";

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function fmtMoney(n, currency = "AED") {
    if (!Number.isFinite(n)) return "";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(n);
}

export default function MortgageCalculatorPage() {
    // Inputs
    const [currency] = useState("AED"); // keep same currency as header for now
    const [price, setPrice] = useState("");
    const [downPct, setDownPct] = useState(20);
    const [downAed, setDownAed] = useState("");
    const [years, setYears] = useState(25);
    const [rate, setRate] = useState(4.99);

    const parsedPrice = useMemo(() => {
        const v = Number(String(price).replace(/,/g, ""));
        return Number.isFinite(v) ? v : 0;
    }, [price]);

    // Keep percent + AED synced (user can type either)
    const effectiveDown = useMemo(() => {
        // If AED field has something, prefer it
        const v = Number(String(downAed).replace(/,/g, ""));
        if (Number.isFinite(v) && v > 0) {
            return clamp(v, 0, parsedPrice);
        }
        // else use percent
        return (clamp(Number(downPct) || 0, 0, 100) / 100) * parsedPrice;
    }, [downAed, downPct, parsedPrice]);

    const effectiveDownPct = useMemo(() => {
        if (!parsedPrice) return clamp(Number(downPct) || 0, 0, 100);
        return clamp((effectiveDown / parsedPrice) * 100, 0, 100);
    }, [effectiveDown, parsedPrice, downPct]);

    const loanAmount = useMemo(() => {
        return Math.max(0, parsedPrice - effectiveDown);
    }, [parsedPrice, effectiveDown]);

    const monthlyPayment = useMemo(() => {
        // Standard amortization formula
        const n = Math.max(1, Math.round(Number(years) * 12));
        const r = (Number(rate) / 100) / 12;
        const P = loanAmount;

        if (!P) return 0;
        if (!Number.isFinite(r) || r <= 0) return P / n;

        const pow = Math.pow(1 + r, n);
        return P * (r * pow) / (pow - 1);
    }, [loanAmount, years, rate]);

    const totalPaid = useMemo(() => monthlyPayment * Math.max(1, Math.round(Number(years) * 12)), [monthlyPayment, years]);
    const totalInterest = useMemo(() => Math.max(0, totalPaid - loanAmount), [totalPaid, loanAmount]);

    return (
        <section className="mc">
            <div className="mc-topbar">
                <div className="mc-inner">
                    <h1 className="mc-page-title">Mortgage Calculator</h1>
                    <div className="mc-underline" />
                </div>
            </div>

            <div className="mc-inner">
                <div className="mc-grid">
                    {/* LEFT */}
                    <div className="mc-left">
                        <div className="mc-kicker">MORTGAGE CALCULATOR</div>

                        <div className="mc-block">
                            <div className="mc-h">Mortgage Options for Residents</div>
                            <p className="mc-p">
                                UAE residents can access home loans with up to 80% financing on off-plan properties.
                                Loan terms usually range from 15 to 25 years, and banks offer flexible repayment plans,
                                making it easier for residents to budget for homeownership.
                            </p>
                        </div>

                        <div className="mc-block">
                            <div className="mc-h">Mortgages for Non-Residents</div>
                            <p className="mc-p">
                                Non-residents and expatriates can secure up to 75% financing, though stricter requirements may apply.
                                Larger down payments and proof of stable income are often necessary. With proper preparation,
                                owning property in Dubai is a feasible option for expats.
                            </p>
                        </div>

                        <div className="mc-block">
                            <div className="mc-h">Financing for UAE Nationals</div>
                            <p className="mc-p">
                                UAE nationals enjoy favorable terms, including up to 85% financing and lower interest rates.
                                Government-backed loan programs further support local buyers, making it easier for Emiratis
                                to invest in Dubai’s real estate market.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="mc-card">
                        <div className="mc-form">
                            <label className="mc-label">Property Price ({currency})</label>
                            <input
                                className="mc-input"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                inputMode="numeric"
                                placeholder="e.g. 1,500,000"
                            />

                            <label className="mc-label">Down Payment (%)</label>
                            <input
                                className="mc-input"
                                value={downPct}
                                onChange={(e) => {
                                    const v = clamp(Number(e.target.value) || 0, 0, 100);
                                    setDownPct(v);
                                    setDownAed(""); // switch to percent mode
                                }}
                                inputMode="numeric"
                                placeholder="20"
                            />
                            <div className="mc-help">Minimum 15% required</div>

                            <label className="mc-label">Down Payment ({currency})</label>
                            <input
                                className="mc-input"
                                value={downAed}
                                onChange={(e) => {
                                    setDownAed(e.target.value);
                                }}
                                inputMode="numeric"
                                placeholder="e.g. 300,000"
                            />

                            <label className="mc-label">Loan Duration (years)</label>
                            <input
                                className="mc-input"
                                value={years}
                                onChange={(e) => setYears(clamp(Number(e.target.value) || 1, 1, 40))}
                                inputMode="numeric"
                                placeholder="25"
                            />

                            <label className="mc-label">Interest Rate (%)</label>
                            <input
                                className="mc-input"
                                value={rate}
                                onChange={(e) => setRate(clamp(Number(e.target.value) || 0, 0, 20))}
                                inputMode="decimal"
                                placeholder="4.99"
                            />

                            <div className="mc-result">
                                <div className="mc-result-row">
                                    <span>Down payment</span>
                                    <strong>{fmtMoney(effectiveDown, currency)} ({effectiveDownPct.toFixed(1)}%)</strong>
                                </div>
                                <div className="mc-result-row">
                                    <span>Loan amount</span>
                                    <strong>{fmtMoney(loanAmount, currency)}</strong>
                                </div>
                                <div className="mc-result-row mc-result-row--big">
                                    <span>Estimated monthly payment</span>
                                    <strong>{fmtMoney(monthlyPayment, currency)}</strong>
                                </div>
                                <div className="mc-result-row">
                                    <span>Total interest (est.)</span>
                                    <strong>{fmtMoney(totalInterest, currency)}</strong>
                                </div>
                            </div>

                            <button
                                className="mc-btn"
                                type="button"
                                onClick={() => {
                                    // no-op, calculation is live; button just feels like the reference
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                            >
                                Calculate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
