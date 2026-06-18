import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORÁCULO — Amazon Intelligence",
  description: "Mineração de produtos, mais vendidos e análise de oportunidades para vendedores Amazon.com.br",
  metadataBase: new URL("https://app.oraculojf.com.br"),
  openGraph: {
    title: "ORÁCULO — Amazon Intelligence",
    description: "Mineração de produtos, mais vendidos e análise de oportunidades para vendedores Amazon.com.br",
    url: "https://app.oraculojf.com.br",
    siteName: "Oráculo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ORÁCULO — Amazon Intelligence",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORÁCULO — Amazon Intelligence",
    description: "Mineração de produtos, mais vendidos e análise de oportunidades para vendedores Amazon.com.br",
    images: ["/og-image.png"],
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
      </head>
      <body style={{ margin: 0, background: 'var(--bg)', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
