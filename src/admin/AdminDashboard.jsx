// src/admin/pages/AdminDashboard.jsx
import { useMemo } from "react";

const MOCK_LEADS = [
  {
    id: "1",
    name: "John Doe",
    phone: "+96170123456",
    source: "INSTAGRAM",
    urgency: "HOT",
    status: "OPEN",
    area: "Dubai Marina",
    budgetMin: 600000,
    budgetMax: 850000,
    createdAt: "2026-02-10",
    nextFollowUpAt: "2026-02-11",
    agent: "Andrew",
  },
  {
    id: "2",
    name: "Maya N.",
    phone: "+971505001122",
    source: "WEBSITE",
    urgency: "WARM",
    status: "FOLLOW_UP",
    area: "Business Bay",
    budgetMin: 350000,
    budgetMax: 450000,
    createdAt: "2026-02-09",
    nextFollowUpAt: "2026-02-10",
    agent: "Abdullah",
  },
  {
    id: "3",
    name: "Karim S.",
    phone: "+96103000000",
    source: "REFERRAL",
    urgency: "COLD",
    status: "OPEN",
    area: "Downtown",
    budgetMin: 1200000,
    budgetMax: 1500000,
    createdAt: "2026-02-08",
    nextFollowUpAt: null,
    agent: "Kevin",
  },
  {
    id: "4",
    name: "Sarah A.",
    phone: "+971552223344",
    source: "INSTAGRAM",
    urgency: "HOT",
    status: "CLOSED",
    area: "Palm Jumeirah",
    budgetMin: 2000000,
    budgetMax: 2600000,
    createdAt: "2026-02-05",
    nextFollowUpAt: null,
    agent: "Andrew",
  },
];

function money(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

function chip(u) {
  return <span className="adm-chip">{u}</span>;
}

export default function AdminDashboard() {
  const today = "2026-02-10"; // swap with real date if you want

  const stats = useMemo(() => {
    const open = MOCK_LEADS.filter((l) => l.status === "OPEN").length;
    const follow = MOCK_LEADS.filter((l) => l.status === "FOLLOW_UP").length;
    const hot = MOCK_LEADS.filter((l) => l.urgency === "HOT").length;
    const closed = MOCK_LEADS.filter((l) => l.status === "CLOSED").length;

    return { open, follow, hot, closed };
  }, []);

  const followUpsDue = useMemo(() => {
    return MOCK_LEADS.filter(
      (l) => l.nextFollowUpAt && l.nextFollowUpAt <= today && l.status !== "CLOSED"
    ).slice(0, 6);
  }, []);

  const recentLeads = useMemo(() => {
    return [...MOCK_LEADS].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
  }, []);

  const bySource = useMemo(() => {
    const m = new Map();
    for (const l of MOCK_LEADS) m.set(l.source, (m.get(l.source) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, []);

  const byStatus = useMemo(() => {
    const statuses = ["OPEN", "FOLLOW_UP", "CLOSED", "LOST"];
    const out = statuses.map((s) => ({
      status: s,
      count: MOCK_LEADS.filter((l) => l.status === s).length,
    }));
    return out;
  }, []);

  return (
    <div className="dash">
      {/* KPIs */}
      <div className="dash-kpis">
        <div className="dash-kpi">
          <div className="dash-kpiLabel">Open Leads</div>
          <div className="dash-kpiValue">{stats.open}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpiLabel">Follow Ups</div>
          <div className="dash-kpiValue">{stats.follow}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpiLabel">Hot</div>
          <div className="dash-kpiValue">{stats.hot}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpiLabel">Closed</div>
          <div className="dash-kpiValue">{stats.closed}</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        {/* Follow-ups due */}
        <div className="adm-card dash-card">
          <div className="dash-head">
            <div>
              <div className="dash-title">Follow-ups due</div>
              <div className="dash-sub">People you should contact today</div>
            </div>
            <button className="adm-miniBtn">View all</button>
          </div>

          {followUpsDue.length === 0 ? (
            <div className="dash-empty">No follow-ups due.</div>
          ) : (
            <div className="dash-list">
              {followUpsDue.map((l) => (
                <div key={l.id} className="dash-item">
                  <div className="dash-itemLeft">
                    <div className="dash-itemName">{l.name}</div>
                    <div className="dash-itemMeta">
                      {l.phone} · {l.area} · {l.source}
                    </div>
                  </div>
                  <div className="dash-itemRight">
                    {chip(l.urgency)}
                    <button className="adm-miniBtn">WhatsApp</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads table */}
        <div className="adm-card dash-card dash-span2">
          <div className="dash-head">
            <div>
              <div className="dash-title">Recent leads</div>
              <div className="dash-sub">Latest created records</div>
            </div>
            <button className="adm-miniBtn">Open Leads</button>
          </div>

          <div className="adm-tableWrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Name</th>
                  <th className="adm-th">Area</th>
                  <th className="adm-th">Budget</th>
                  <th className="adm-th">Urgency</th>
                  <th className="adm-th">Status</th>
                  <th className="adm-th">Agent</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id} className="adm-row">
                    <td className="adm-td" style={{ fontWeight: 700 }}>
                      {l.name}
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        {l.phone} · {l.source}
                      </div>
                    </td>
                    <td className="adm-td">{l.area || "—"}</td>
                    <td className="adm-td">
                      {money(l.budgetMin)} – {money(l.budgetMax)}
                    </td>
                    <td className="adm-td">{chip(l.urgency)}</td>
                    <td className="adm-td">{l.status}</td>
                    <td className="adm-td">{l.agent || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top sources */}
        <div className="adm-card dash-card">
          <div className="dash-head">
            <div>
              <div className="dash-title">Top sources</div>
              <div className="dash-sub">Where leads come from</div>
            </div>
          </div>

          <div className="dash-bars">
            {bySource.map(([src, count]) => (
              <div key={src} className="dash-barRow">
                <div className="dash-barLabel">{src}</div>
                <div className="dash-barTrack">
                  <div
                    className="dash-barFill"
                    style={{ width: `${(count / MOCK_LEADS.length) * 100}%` }}
                  />
                </div>
                <div className="dash-barVal">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline status */}
        <div className="adm-card dash-card">
          <div className="dash-head">
            <div>
              <div className="dash-title">Pipeline</div>
              <div className="dash-sub">Status distribution</div>
            </div>
          </div>

          <div className="dash-pills">
            {byStatus.map((s) => (
              <div key={s.status} className="dash-pill">
                <div className="dash-pillLabel">{s.status}</div>
                <div className="dash-pillVal">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
