"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2 } from "lucide-react";
import { computeTotalsCents, formatEUR, toCents } from "@/lib/money";
import type { FactiqClient, FactiqUser } from "./types";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type EditorLine = { description: string; quantity: string; unitPrice: string };

// Affichage monétaire : TOUJOURS depuis des centimes entiers (src/lib/money.ts).
const eur = (cents: number) => formatEUR(cents);

export default function InvoiceEditor({
  open,
  clients,
  user,
  onClose,
  onCreated,
}: {
  open: boolean;
  clients: FactiqClient[];
  user: FactiqUser;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState<string>("");
  // Taux mémorisé en CENTIÈMES de pourcentage : 2000 = 20 %, 550 = 5,5 %.
  const [vatRate, setVatRate] = useState<string>("2000");
  const [paymentTerms, setPaymentTerms] = useState("Paiement à 30 jours");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    () => new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [lines, setLines] = useState<EditorLine[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [busy, setBusy] = useState(false);

  const franchise = user.vatMode === "franchise";

  const totals = useMemo(() => {
    // Aperçu en centimes : la saisie « 12,30 » est convertie via toCents.
    // (une saisie invalide compte pour 0 à l'écran ; la soumission, elle,
    // refuse explicitement un prix invalide).
    const parsed = lines.map((l) => ({
      quantity: Number(l.quantity) || 0,
      unitPriceCents: toCents(l.unitPrice) ?? 0,
    }));
    return computeTotalsCents(
      parsed,
      Number(vatRate) || 0,
      franchise ? "franchise" : "standard"
    );
  }, [lines, vatRate, franchise]);

  const setLine = (i: number, k: keyof EditorLine, v: string) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const submit = async () => {
    if (!clientId) {
      toast.error("Choisissez un client.");
      return;
    }
    const payloadLines: { description: string; quantity: number; unitPriceCents: number }[] = [];
    for (const l of lines) {
      if (!l.description.trim() || !(Number(l.quantity) > 0)) continue;
      const cents = toCents(l.unitPrice);
      if (cents === null) {
        toast.error(`Prix unitaire invalide pour « ${l.description.trim()} » — utilisez un format comme 12,30.`);
        return;
      }
      payloadLines.push({
        description: l.description,
        quantity: Number(l.quantity),
        unitPriceCents: cents,
      });
    }
    if (payloadLines.length === 0) {
      toast.error("Ajoutez au moins une ligne valide (désignation + quantité).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          vatRateCentiemes: Number(vatRate),
          issueDate,
          dueDate,
          paymentTerms,
          lines: payloadLines,
          vatMode: user.vatMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur.");
        return;
      }
      toast.success(`Facture ${data.invoice.number} créée.`);
      onCreated();
      setLines([{ description: "", quantity: "1", unitPrice: "" }]);
      setClientId("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Nouvelle facture</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Numérotation automatique (FAC-AAAA-NNNN) · XML Factur-X généré à
            l'enregistrement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>TVA</Label>
            {franchise ? (
              <div className="rounded-md border border-lime/25 bg-lime/[0.05] px-3 py-2 text-[13px] text-lime">
                Franchise — « TVA non applicable, art. 293 B du CGI »
              </div>
            ) : (
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2000">20 % (taux normal)</SelectItem>
                  <SelectItem value="1000">10 % (intermédiaire)</SelectItem>
                  <SelectItem value="550">5,5 % (réduit)</SelectItem>
                  <SelectItem value="0">0 % (exonéré)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-issue">Date d'émission</Label>
            <Input id="inv-issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-due">Date d'échéance</Label>
            <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inv-terms">Conditions de paiement</Label>
            <Input id="inv-terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <Label>Lignes de facture</Label>
          <AnimatePresence initial={false}>
            {lines.map((l, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="flex items-end gap-2 pb-1.5">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Désignation (ex. Prestation de conseil)"
                      value={l.description}
                      onChange={(e) => setLine(i, "description", e.target.value)}
                    />
                  </div>
                  <Input
                    className="w-20"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Qté"
                    value={l.quantity}
                    onChange={(e) => setLine(i, "quantity", e.target.value)}
                  />
                  <Input
                    className="w-28"
                    type="text"
                    inputMode="decimal"
                    placeholder="P.U. € (12,30)"
                    value={l.unitPrice}
                    onChange={(e) => setLine(i, "unitPrice", e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                    disabled={lines.length === 1}
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.06]"
            onClick={() => setLines((ls) => [...ls, { description: "", quantity: "1", unitPrice: "" }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Ajouter une ligne
          </Button>
        </div>

        <div className="mt-2 space-y-1.5 rounded-xl border border-white/[0.08] bg-muted/60 p-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Total HT</span>
            <motion.span key={totals.totalHTCents} className="font-mono tabular-nums" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
              {eur(totals.totalHTCents)}
            </motion.span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>
              {franchise
                ? "TVA (art. 293 B)"
                : `TVA (${(Number(vatRate) / 100).toLocaleString("fr-FR")} %)`}
            </span>
            <span className="font-mono tabular-nums">{eur(totals.totalVATCents)}</span>
          </div>
          <div className="flex justify-between border-t border-white/[0.08] pt-2 text-base font-semibold">
            <span>Total TTC</span>
            <span className="rounded-md bg-lime px-2.5 py-0.5 font-mono tabular-nums text-primary-foreground">
              {eur(totals.totalTCCCents)}
            </span>
          </div>
        </div>

        <Button className="w-full font-medium" onClick={submit} disabled={busy}>
          {busy ? "Création…" : "Créer la facture conforme"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
