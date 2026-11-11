import { BarChart3, Bell, Contact, LayoutDashboard, Settings, Sparkles, Users, Wallet, LifeBuoy, FolderKanban, Megaphone, Plug } from "lucide-react";

const kpis = [
  { label: "Total revenue", value: "$62,940", delta: "+15.11%", up: true, big: true },
  { label: "Avg Revenue (Email)", value: "10%", delta: "+22.64%", up: true },
  { label: "Avg Revenue (SMS)", value: "341", delta: "+11.23%", up: true },
  { label: "Avg Revenue (WhatsApp)", value: "11", delta: "-4.51%", up: false },
  { label: "Avg Revenue (Voice)", value: "1,789", delta: "+25.69%", up: true },
  { label: "Avg Purchases (Email)", value: "9,143", delta: "+15.01%", up: true },
  { label: "Avg Purchases (SMS)", value: "12,761", delta: "-4.51%", up: false },
  { label: "Avg Purchases (WhatsApp)", value: "19,905", delta: "+15.01%", up: true },
  { label: "Avg Purchases (Voice)", value: "7,341", delta: "+11.23%", up: true },
];

const channels = [
  { name: "Email", share: 34 },
  { name: "SMS", share: 26 },
  { name: "WhatsApp", share: 22 },
  { name: "Push", share: 11 },
  { name: "AI Voice", share: 7 },
];

const navGroups = [
  { icon: LayoutDashboard, label: "Dashboard" },
];

const marketing = [
  { icon: FolderKanban, label: "Data room" },
  { icon: BarChart3, label: "Analytics", active: true },
  { icon: Users, label: "Audience Studio" },
  { icon: Contact, label: "Leads" },
];

const campaign = [
  { icon: Megaphone, label: "Campaigns" },
  { icon: Plug, label: "Integrations" },
];

const others = [
  { icon: Wallet, label: "Plan & Billing" },
  { icon: Settings, label: "Settings" },
  { icon: LifeBuoy, label: "Support" },
];

export function DashboardMockup() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e08] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
      role="img"
      aria-label="Loopcart analytics dashboard preview"
    >
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 flex-col border-r border-white/5 bg-[#0a0c07] p-4 md:flex">
          <div className="mb-6 flex items-center gap-2 font-display text-xl">
            <Sparkles className="h-4 w-4 text-lime" aria-hidden />
            loopcart
          </div>

          {navGroups.map((item) => (
            <div
              key={item.label}
              className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground/70"
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </div>
          ))}

          <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            Marketing
          </p>
          {marketing.map((item) => (
            <div
              key={item.label}
              className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] ${
                item.active
                  ? "bg-lime/15 text-lime"
                  : "text-foreground/70"
              }`}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </div>
          ))}

          <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            Campaign agent
          </p>
          {campaign.map((item) => (
            <div
              key={item.label}
              className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground/70"
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </div>
          ))}

          <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            Others
          </p>
          {others.map((item) => (
            <div
              key={item.label}
              className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground/70"
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </div>
          ))}
        </aside>

        {/* Main panel */}
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <h3 className="font-display text-2xl text-foreground">Analytics</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Track campaign performance and audience behavior insights.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {["Revenue attribution", "Audience analytics", "Conversions"].map(
                (tab, i) => (
                  <span
                    key={tab}
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      i === 0
                        ? "border-white/15 bg-white/10 text-foreground"
                        : "border-white/5 bg-white/[0.03] text-foreground/60"
                    }`}
                  >
                    {tab}
                  </span>
                )
              )}
            </div>
            <span className="hidden items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-foreground/70 sm:inline-flex">
              All campaigns
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
          </div>

          {/* KPI grid */}
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/5 bg-white/5 sm:grid-cols-3 lg:grid-cols-5">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className={`bg-[#0e1009] p-3.5 ${kpi.big ? "row-span-2 flex flex-col justify-between sm:col-span-1" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] leading-tight text-foreground/55">
                    {kpi.label}
                  </p>
                  {!kpi.big && (
                    <span
                      className={`shrink-0 text-[10px] font-medium ${
                        kpi.up ? "text-lime" : "text-[#ff8a7e]"
                      }`}
                    >
                      {kpi.delta}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-2 font-semibold tracking-tight text-foreground ${
                    kpi.big ? "text-3xl" : "text-xl"
                  }`}
                >
                  {kpi.value}
                </p>
                {kpi.big && (
                  <span className="mt-1 inline-block self-start rounded bg-lime/15 px-1.5 py-0.5 text-[10px] font-medium text-lime">
                    {kpi.delta}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Channel performance */}
          <div className="mt-4 rounded-xl border border-white/5 bg-[#0e1009] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Channel performance
                </p>
                <p className="text-[11px] text-foreground/50">
                  Revenue percentage by channel
                </p>
              </div>
              <Bell className="h-4 w-4 text-foreground/40" aria-hidden />
            </div>
            <div className="mt-4 space-y-2.5">
              {channels.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[11px] text-foreground/60">
                    {c.name}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-lime/80"
                      style={{ width: `${c.share}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] text-foreground/60">
                    {c.share}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
