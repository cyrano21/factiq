"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import type { FactiqUser } from "./types";

export default function SettingsPanel({
  user,
  onUserChange,
}: {
  user: FactiqUser;
  onUserChange: (u: FactiqUser) => void;
}) {
  const [form, setForm] = useState({
    legalName: user.legalName ?? "",
    siret: user.siret ?? "",
    vatNumber: user.vatNumber ?? "",
    address: user.address ?? "",
    zip: user.zip ?? "",
    city: user.city ?? "",
    iban: user.iban ?? "",
    vatMode: user.vatMode === "franchise" ? "franchise" : "standard",
  });
  const [busy, setBusy] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur.");
        return;
      }
      onUserChange(data.user);
      toast.success("Paramètres enregistrés.");
    } finally {
      setBusy(false);
    }
  };

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();
      if (data.url) {
        // Session Stripe Checkout réelle → redirection hébergée Stripe.
        window.location.href = data.url;
        return;
      }
      toast.info(data.error ?? "Paiement indisponible.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="border-white/[0.08] bg-card">
        <CardHeader>
          <CardTitle className="text-base">Identité de l'émetteur</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ces mentions apparaissent sur vos factures et dans le XML Factur-X.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-legal">Raison sociale</Label>
            <Input id="set-legal" placeholder="Sophie Martin Consulting" value={form.legalName} onChange={set("legalName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-siret">Votre SIRET</Label>
            <Input id="set-siret" placeholder="12345678901234" value={form.siret} onChange={set("siret")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-vat">N° TVA intracommunautaire</Label>
            <Input id="set-vat" placeholder="FR32123456789" value={form.vatNumber} onChange={set("vatNumber")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-iban">IBAN (pour vos clients)</Label>
            <Input id="set-iban" placeholder="FR76 3000 6000 0112 3456 7890 189" value={form.iban} onChange={set("iban")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="set-address">Adresse</Label>
            <Input id="set-address" placeholder="12 rue de la République" value={form.address} onChange={set("address")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-zip">Code postal</Label>
            <Input id="set-zip" placeholder="75011" value={form.zip} onChange={set("zip")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-city">Ville</Label>
            <Input id="set-city" placeholder="Paris" value={form.city} onChange={set("city")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Régime de TVA</Label>
            <Select value={form.vatMode} onValueChange={(v) => setForm((f) => ({ ...f, vatMode: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Assujetti à la TVA (20 %, 10 %, 5,5 %)</SelectItem>
                <SelectItem value="franchise">Franchise en base — « TVA non applicable, art. 293 B du CGI »</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground/70">
              Le régime détermine les mentions légales et le code d'exonération dans le XML.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={save} disabled={busy} className="font-medium">
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          user.plan === "pro"
            ? "h-fit border-lime/30 bg-lime/[0.05]"
            : "h-fit border-white/[0.08] bg-card"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-lime" /> Votre plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Plan actuel :{" "}
            <strong className={user.plan === "pro" ? "text-lime" : "text-foreground"}>
              {user.plan === "pro" ? "Pro" : "Gratuit"}
            </strong>
            {user.plan !== "pro" && <> — limité à 5 factures au total.</>}
          </p>
          {user.plan !== "pro" && (
            <Button className="w-full font-medium" onClick={upgrade} disabled={upgrading}>
              {upgrading ? "Connexion au paiement…" : "Passer au plan Pro — 9 €/mois"}
            </Button>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            Le paiement utilise Stripe Checkout. En environnement de démonstration sans
            clés configurées, l'activation est simulée et expliquée.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
