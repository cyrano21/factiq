import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Les erreurs TypeScript bloquent le build : règle non négociable pour un
  // logiciel qui produit des documents comptables.
  reactStrictMode: false,
};

export default nextConfig;
