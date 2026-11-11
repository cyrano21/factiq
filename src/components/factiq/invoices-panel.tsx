"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  FileCode2,
  FileText,
  Inbox,
  Trash2,
} from "lucide-react";
import { STATUS_LABEL, type FactiqInvoice } from "./types";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const ttcOf = (inv: FactiqInvoice) =>
  inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) *
  (1 + (inv.vatMode === "franchise" ? 0 : inv.vatRate / 100));

const statusDot = (s: string) =>
  s === "paid" ? (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-lime" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
    </span>
  ) : s === "sent" ? (
    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
  ) : (
    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
  );

export default function InvoicesPanel({
  invoices,
  loading,
  onDownload,
  onSetStatus,
  onDelete,
}: {
  invoices: FactiqInvoice[];
  loading: boolean;
  onDownload: (id: string, kind: "pdf" | "xml") => void;
  onSetStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer h-[74px] rounded-2xl border border-white/[0.06]" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.12] py-16 text-center">
        <Inbox className="mx-auto h-6 w-6 text-muted-foreground/60" />
        <p className="mt-3 text-sm text-muted-foreground">
          Aucune facture pour le moment. Cliquez sur « Nouvelle facture » pour créer la
          première.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-2.5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {invoices.map((inv) => {
        const ttc = ttcOf(inv);
        return (
          <motion.div
            key={inv.id}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
            }}
            className="group rounded-2xl border border-white/[0.08] bg-card p-4 transition-colors duration-300 hover:border-lime/25 sm:px-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              {/* identity */}
              <div className="flex min-w-0 items-center gap-4">
                <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors group-hover:border-lime/25 group-hover:text-lime sm:flex">
                  <FileText className="h-4.5 w-4.5" size={18} />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium tracking-tight text-foreground">
                    {inv.number}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {inv.client.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/60">
                    émise le {inv.issueDate} · échéance {inv.dueDate}
                  </p>
                </div>
              </div>

              {/* amount + status + actions */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <p className="mr-1 font-mono text-[15px] font-medium tabular-nums tracking-tight">
                  {eur(ttc)}
                </p>

                <Select value={inv.status} onValueChange={(v) => onSetStatus(inv.id, v)}>
                  <SelectTrigger
                    size="sm"
                    className="h-9 w-[132px] gap-2 border-white/[0.1] bg-white/[0.02] text-[13px]"
                  >
                    {statusDot(inv.status)}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{STATUS_LABEL.draft}</SelectItem>
                    <SelectItem value="sent">{STATUS_LABEL.sent}</SelectItem>
                    <SelectItem value="paid">{STATUS_LABEL.paid}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-white/[0.1] bg-white/[0.02] px-2.5 text-[13px] hover:border-lime/30 hover:bg-lime/[0.08] hover:text-lime"
                    onClick={() => onDownload(inv.id, "pdf")}
                    title="PDF Factur-X"
                  >
                    <FileDown className="h-4 w-4" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-white/[0.1] bg-white/[0.02] px-2.5 text-[13px] hover:border-lime/30 hover:bg-lime/[0.08] hover:text-lime"
                    onClick={() => onDownload(inv.id, "xml")}
                    title="XML Factur-X"
                  >
                    <FileCode2 className="h-4 w-4" /> XML
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 px-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(inv.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
