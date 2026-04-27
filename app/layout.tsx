import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORÁCULO — Amazon Intelligence",
  description: "Mineração de produtos, mais vendidos e análise de oportunidades para vendedores Amazon.com.br",
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
