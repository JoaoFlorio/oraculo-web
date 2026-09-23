import type { NextConfig } from "next";

// 23/09/2026 (auditoria de segurança): headers que faltavam em produção e o
// `x-powered-by` que anunciava a versão do Next. CSP fica pra uma 2ª etapa (o NEO
// renderiza markdown/inline — precisa mapear antes de travar).
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
