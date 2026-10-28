import type { NextConfig } from "next";

// 23/09/2026 (auditoria de segurança): headers que faltavam em produção e o
// `x-powered-by` que anunciava a versão do Next. CSP fica pra uma 2ª etapa (o NEO
// renderiza markdown/inline — precisa mapear antes de travar).
// 23/09 (achado 39): CSP em REPORT-ONLY — não bloqueia nada, só aponta no console do navegador
// o que uma CSP real quebraria (inline do Next, imagens da Amazon/ML, chamadas ao backend).
// Promover a `Content-Security-Policy` só depois de rodar limpa por uns dias.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  // 28/10 (varredura): faltavam a fonte de ícones Tabler (jsdelivr) e o Turnstile — a política reprovaria telas legítimas.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: data: https:",                         // 28/10: vídeo do NEO chega como data:video/mp4
  "connect-src 'self' https:",
  "frame-src https://*.tv.pandavideo.com.br https://challenges.cloudflare.com",   // 28/10: player Panda + Turnstile
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // 28/10: sem endpoint de report a Report-Only não coletava nada (só aparecia no DevTools de quem abrisse).
  "report-uri /api/csp-report",
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
  // 26/10/2026: a página de vendas oficial é a de oraculojf.com (repo oraculo-site). A raiz do app
  // leva pra lá (temporário, com os parâmetros da URL) em vez de manter uma 2ª landing que desatualiza.
  // Login, teste grátis, dashboard e o resto do app continuam aqui.
  async redirects() {
    return [
      // logado (cookie de sessão): direto pro painel
      { source: "/", has: [{ type: "cookie", key: "oraculo_session" }], destination: "/dashboard", permanent: false },
      // visitante: a página de vendas
      { source: "/", missing: [{ type: "cookie", key: "oraculo_session" }], destination: "https://oraculojf.com/", permanent: false },
    ];
  },
};

export default nextConfig;
