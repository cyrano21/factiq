export type FactiqUser = {
  id: string;
  email: string;
  name: string;
  plan: string;
  legalName: string | null;
  siret: string | null;
  vatNumber: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  iban: string | null;
  vatMode: string;
};

export type FactiqClient = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  siret: string | null;
  vatNumber: string | null;
};

export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  /** Prix unitaire en CENTIMES d'euro (12,30 € → 1230) — jamais en Float. */
  unitPriceCents: number;
  sortOrder: number;
};

export type FactiqInvoice = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  /** Taux de TVA en centièmes de pourcentage (20 % → 2000). */
  vatRateCentiemes: number;
  vatMode: string;
  paymentTerms: string;
  notes: string | null;
  client: FactiqClient;
  lines: InvoiceLine[];
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
};
