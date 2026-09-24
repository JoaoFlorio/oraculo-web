import type { NextConfig } from "next";

// 23/09/2026 (auditoria de segurança): headers que faltavam em produção e o
// `x-powered-by` que anunciava a versão do Next. CSP fica pra uma 2ª etapa (o NEO
// renderiza markdown/inline — precisa mapear antes de travar).
// 23/09 (achado 39): CSP em REPORT-ONLY — não bloqueia nada, só aponta no console do navegador
// o que uma CSP real quebraria (inline do Next, imagens da Amazon/ML, chamadas ao backend).
// Promover a `Content-Security-Policy` só depois de rodar limpa por uns dias.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=()" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];


const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
