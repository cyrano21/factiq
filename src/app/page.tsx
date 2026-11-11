"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import Landing from "@/components/factiq/landing";
import AppShell from "@/components/factiq/app-shell";
import AuthDialog from "@/components/factiq/auth-dialog";
import type { FactiqUser } from "@/components/factiq/types";

export default function Home() {
  const [user, setUser] = useState<FactiqUser | null | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  useEffect(() => {
    // Retour de Stripe Checkout : confirmation du paiement → plan Pro.
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success" && params.get("session_id")) {
      fetch(`/api/billing/confirm?session_id=${params.get("session_id")}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.user) {
            setUser(d.user);
            toast.success(
              d.upgraded
                ? "Paiement confirmé — plan Pro activé, facturation illimitée !"
                : "Retour de paiement enregistré."
            );
          }
        })
        .catch(() => toast.error("Confirmation du paiement impossible."))
        .finally(() => window.history.replaceState({}, "", "/"));
      return;
    }
    if (checkout === "cancel") {
      toast.info("Paiement annulé — aucun prélèvement effectué.");
      window.history.replaceState({}, "", "/");
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      {user === undefined ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-lime border-t-transparent" />
            <span className="text-sm">Chargement de Factiq…</span>
          </div>
        </div>
      ) : user ? (
        <AppShell
          user={user}
          onUserChange={setUser}
          onLogout={() => setUser(null)}
        />
      ) : (
        <Landing
          onSignup={() => openAuth("register")}
          onLogin={() => openAuth("login")}
        />
      )}
      <AuthDialog
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        onSuccess={(u) => {
          setAuthOpen(false);
          setUser(u);
        }}
      />
      <Toaster position="top-center" richColors theme="dark" />
    </>
  );
}
