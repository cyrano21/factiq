"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, ReceiptText, UserRound, Users, Wallet, Hourglass, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import type { FactiqClient, FactiqInvoice, FactiqUser } from "./types";
import InvoicesPanel from "./invoices-panel";
import ClientsPanel from "./clients-panel";
import SettingsPanel from "./settings-panel";
import InvoiceEditor from "./invoice-editor";
import { computeTotalsCents, formatEUR } from "@/lib/money";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Affichage monétaire : TOUJOURS depuis des centimes entiers (src/lib/money.ts).
const eurFmt = { format: (cents: number) => formatEUR(cents) };

const TABS = [
  { id: "invoices", label: "Factures" },
  { id: "clients", label: "Clients" },
  { id: "settings", label: "Paramètres" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AppShell({
  user,
  onUserChange,
  onLogout,
}: {
  user: FactiqUser;
  onUserChange: (u: FactiqUser) => void;
  onLogout: () => void;
}) {
  const [invoices, setInvoices] = useState<FactiqInvoice[]>([]);
  const [clients, setClients] = useState<FactiqClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("invoices");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, cliRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/clients"),
      ]);
      if (invRes.ok) setInvoices((await invRes.json()).invoices);
      if (cliRes.ok) setClients((await cliRes.json()).clients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  };

  const download = (id: string, kind: "pdf" | "xml") => {
    window.open(`/api/invoices/${id}/${kind}`, "_blank");
  };

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Statut mis à jour.");
      refresh();
    } else {
      toast.error("Mise à jour impossible.");
    }
  };

  const removeInvoice = async (id: string) => {
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Facture supprimée.");
      refresh();
    } else {
      toast.error("Suppression impossible.");
    }
  };

  const kpis = useMemo(() => {
    // Totaux KPI en centimes entiers (BR-CO-10 : lignes arrondies puis sommées).
    const ttc = (inv: FactiqInvoice) =>
      computeTotalsCents(
        inv.lines.map((l) => ({ quantity: l.quantity, unitPriceCents: l.unitPriceCents })),
        inv.vatRateCentiemes,
        inv.vatMode === "franchise" ? "franchise" : "standard"
      ).totalTCCCents;
    const total = invoices.reduce((s, i) => s + ttc(i), 0);
    const pending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + ttc(i), 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + ttc(i), 0);
    return [
      { icon: Wallet, label: "Total facturé TTC", value: eurFmt.format(total) },
      { icon: Hourglass, label: "En attente de paiement", value: eurFmt.format(pending) },
      { icon: BadgeCheck, label: "Encaissé", value: eurFmt.format(paid) },
      { icon: Users, label: "Clients", value: String(clients.length) },
    ];
  }, [invoices, clients]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* ambient glows */}
      <div aria-hidden className="pointer-events-none fixed -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 glow-lime opacity-50" />

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime text-primary-foreground">
              <ReceiptText className="h-4 w-4" size={16} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">Factiq</span>
            <Badge
              variant={user.plan === "pro" ? "default" : "outline"}
              className={
                user.plan === "pro"
                  ? "bg-lime text-primary-foreground hover:bg-lime"
                  : "border-white/[0.14] text-muted-foreground"
              }
            >
              {user.plan === "pro" ? "Pro" : "Gratuit"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 font-mono text-xs text-muted-foreground sm:block">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="mr-1 h-4 w-4" /> Quitter
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {/* greeting */}
        <motion.div
          className="flex flex-wrap items-end justify-between gap-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div>
            <h1 className="font-display text-4xl tracking-tight sm:text-[44px]">
              Bonjour <span className="italic text-gradient-lime">{user.name.split(" ")[0]}</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {invoices.length} facture{invoices.length > 1 ? "s" : ""} ·{" "}
              {clients.length} client{clients.length > 1 ? "s" : ""} · prêtes pour les
              plateformes agréées
            </p>
          </div>
          <Button
            className="h-11 px-5 font-medium"
            onClick={() => setEditorOpen(true)}
            disabled={clients.length === 0}
          >
            <Plus className="mr-1 h-4 w-4" /> Nouvelle facture
          </Button>
        </motion.div>

        {/* KPI cards */}
        <motion.div
          className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {kpis.map((k) => (
            <motion.div
              key={k.label}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
              }}
              className="card-lift rounded-2xl border border-white/[0.08] bg-card p-5"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <k.icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
                  {k.label}
                </span>
              </div>
              <p className="mt-3 font-mono text-xl font-medium tabular-nums tracking-tight sm:text-2xl">
                {k.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {clients.length === 0 && (
          <motion.div
            className="mt-6 overflow-hidden rounded-2xl border border-dashed border-lime/30 bg-lime/[0.04] p-6 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
          >
            <UserRound className="mx-auto h-5 w-5 text-lime" />
            <p className="mt-2 font-medium text-foreground">Commencez par ajouter un client</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Une facture a besoin d'un destinataire. Créez votre premier client, puis
              revenez émettre votre facture conforme.
            </p>
            <Button variant="outline" size="sm" className="mt-4 border-lime/30 bg-lime/[0.06] text-lime hover:bg-lime/[0.12]" onClick={() => setTab("clients")}>
              Aller aux clients
            </Button>
          </motion.div>
        )}

        {/* segmented tabs */}
        <div className="mt-10 flex justify-start">
          <div className="inline-flex rounded-full border border-white/[0.09] bg-white/[0.03] p-1 backdrop-blur">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 ${
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="factiq-tab-pill"
                      className="absolute inset-0 rounded-full bg-lime"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="mt-5"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {tab === "invoices" && (
              <InvoicesPanel
                invoices={invoices}
                loading={loading}
                onDownload={download}
                onSetStatus={setStatus}
                onDelete={removeInvoice}
              />
            )}
            {tab === "clients" && <ClientsPanel clients={clients} onChanged={refresh} />}
            {tab === "settings" && <SettingsPanel user={user} onUserChange={onUserChange} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-auto border-t border-white/[0.07] py-4">
        <p className="mx-auto max-w-6xl px-4 font-mono text-[11px] tracking-wide text-muted-foreground/60 sm:px-6">
          Factiq — PDF avec XML Factur-X EN 16931 embarqué · Réception obligatoire
          01/09/2026 · Émission TPE/PME 01/09/2027
        </p>
      </footer>

      <InvoiceEditor
        open={editorOpen}
        clients={clients}
        user={user}
        onClose={() => setEditorOpen(false)}
        onCreated={() => {
          setEditorOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
