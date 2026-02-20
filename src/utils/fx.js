const FX_URL = "https://api.exchangerate.host/latest?base=USD";

export async function loadFxRates() {
    const cached = localStorage.getItem("fx_rates");
    const ts = localStorage.getItem("fx_rates_ts");

    // cache for 24h
    if (cached && ts && Date.now() - Number(ts) < 24 * 60 * 60 * 1000) {
        return JSON.parse(cached);
    }

    const res = await fetch(FX_URL);
    const data = await res.json();

    localStorage.setItem("fx_rates", JSON.stringify(data.rates));
    localStorage.setItem("fx_rates_ts", Date.now());

    return data.rates;
}
