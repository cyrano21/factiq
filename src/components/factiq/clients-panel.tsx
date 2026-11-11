"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, UserRound } from "lucide-react";
import type { FactiqClient } from "./types";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const EMPTY_FORM = {
  name: "",
  email: "",
  address: "",
  zip: "",
  city: "",
  siret: "",
  vatNumber: "",
};

export default function ClientsPanel({
  clients,
  onChanged,
}: {
  clients: FactiqClient[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom du client est requis.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur.");
        return;
      }
      toast.success("Client ajouté.");
      setForm(EMPTY_FORM);
      setOpen(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Client supprimé.");
      onChanged();
    } else {
      toast.error("Suppression impossible (des factures peuvent y être liées).");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="h-10 font-medium" onClick={() => setOpen((o) => !o)}>
          <Plus className={`mr-1 h-4 w-4 transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
          {open ? "Fermer le formulaire" : "Ajouter un client"}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="client-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cli-name">Nom / Raison sociale *</Label>
                  <Input id="cli-name" placeholder="Boulangerie Dupont SAS" value={form.name} onChange={set("name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cli-email">E-mail</Label>
                  <Input id="cli-email" type="email" placeholder="compta@dupont.fr" value={form.email} onChange={set("email")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cli-address">Adresse</Label>
                  <Input id="cli-address" placeholder="12 rue de la République" value={form.address} onChange={set("address")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cli-zip">Code postal</Label>
                  <Input id="cli-zip" placeholder="75011" value={form.zip} onChange={set("zip")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cli-city">Ville</Label>
                  <Input id="cli-city" placeholder="Paris" value={form.city} onChange={set("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cli-siret">SIRET du client</Label>
                  <Input id="cli-siret" placeholder="12345678901234" value={form.siret} onChange={set("siret")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cli-vat">TVA intracommunautaire</Label>
                  <Input id="cli-vat" placeholder="FR32123456789" value={form.vatNumber} onChange={set("vatNumber")} />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button onClick={submit} disabled={busy} className="font-medium">
                    {busy ? "Enregistrement…" : "Enregistrer le client"}
                  </Button>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] py-16 text-center">
          <UserRound className="mx-auto h-6 w-6 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun client. Ajoutez votre premier client pour pouvoir facturer.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid gap-3 sm:grid-cols-2"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {clients.map((c) => (
            <motion.div
              key={c.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
              }}
              className="group card-lift flex items-start justify-between gap-3 rounded-2xl border border-white/[0.08] bg-card p-4"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/25 bg-lime/[0.08] font-mono text-[13px] font-medium text-lime">
                  {initials(c.name) || <UserRound className="h-4 w-4" size={16} />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{c.name}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {[c.zip, c.city].filter(Boolean).join(" ") || c.email || "—"}
                  </p>
                  {c.siret && (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground/60">
                      SIRET {c.siret}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => remove(c.id)}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
