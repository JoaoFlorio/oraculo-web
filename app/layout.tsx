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
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#0A0A0F', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
