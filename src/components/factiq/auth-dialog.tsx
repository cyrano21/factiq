"use client";

import { useState } from "react";
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
import { ReceiptText } from "lucide-react";
import type { FactiqUser } from "./types";

export default function AuthDialog({
  open,
  mode,
  onClose,
  onModeChange,
  onSuccess,
}: {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onModeChange: (m: "login" | "register") => void;
  onSuccess: (u: FactiqUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { email, password, name } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur.");
        return;
      }
      onSuccess(data.user);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-primary-foreground">
            <ReceiptText className="h-5 w-5" size={20} />
          </span>
          <DialogTitle className="text-lg">
            {mode === "register" ? "Créer votre compte Factiq" : "Se connecter à Factiq"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {mode === "register"
              ? "5 factures offertes, sans carte bancaire."
              : "Retrouvez vos factures et vos clients."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                  mode === m
                    ? "border-lime/40 bg-lime/[0.08] text-lime"
                    : "border-white/[0.1] bg-white/[0.02] text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "register" ? "Créer un compte" : "Se connecter"}
              </button>
            ))}
          </div>
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Nom complet</Label>
              <Input
                id="auth-name"
                placeholder="Sophie Martin"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">E-mail</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="sophie@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Mot de passe</Label>
            <Input
              id="auth-password"
              type="password"
              placeholder={mode === "register" ? "8 caractères minimum" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <Button className="w-full font-medium" onClick={submit} disabled={busy}>
            {busy
              ? "Un instant…"
              : mode === "register"
                ? "Créer mon compte"
                : "Se connecter"}
          </Button>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setEmail("sophie@demo.fr");
                setPassword("demo1234");
              }}
              className="group w-full rounded-lg border border-dashed border-lime/25 bg-lime/[0.04] px-3 py-2 text-center text-xs text-muted-foreground transition-colors hover:border-lime/40 hover:bg-lime/[0.08] hover:text-foreground"
            >
              Compte de démonstration :{" "}
              <span className="font-mono text-lime/90">sophie@demo.fr · demo1234</span>
              <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100">
                — cliquer pour remplir
              </span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
