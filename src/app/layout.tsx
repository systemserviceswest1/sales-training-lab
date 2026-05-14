import type { Metadata } from "next";
import { Dosis } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dosis = Dosis({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dosis",
});

export const metadata: Metadata = {
  title: "WEST 1 Sales Lab",
  description: "Simulador de role-play para treinamento de consultores de intercâmbio da WEST 1.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${dosis.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
