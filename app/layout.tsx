import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Copy sem marketplace fixo no nome: o Oráculo vai atender Mercado Livre além
  // da Amazon, e imagem/título de link são o que mais circula fora do site.
  title: "ORÁCULO — O lucro real da sua operação",
  description: "DRE automática, mineração de produtos, calculadora de precisão e agente de IA — o lucro real por produto, sem planilha.",
  metadataBase: new URL("https://app.oraculojf.com.br"),
  openGraph: {
    title: "ORÁCULO — O lucro real da sua operação",
    description: "DRE automática, mineração de produtos, calculadora de precisão e agente de IA — o lucro real por produto, sem planilha.",
    url: "https://app.oraculojf.com.br",
    siteName: "Oráculo",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ORÁCULO",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORÁCULO — O lucro real da sua operação",
    description: "DRE automática, mineração de produtos, calculadora de precisão e agente de IA — o lucro real por produto, sem planilha.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('oraculo_theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}" }} />
        {/* PWA: instalável no celular (ícone + tela cheia) — ver public/manifest.json e sw.js */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A0F" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ORÁCULO" />
      </head>
      <body style={{ margin: 0, background: 'var(--bg)', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
