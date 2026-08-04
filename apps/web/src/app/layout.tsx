import type { Metadata } from "next";
import { Libertinus_Serif } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmoothScrollProvider } from "./components/SmoothScrollProvider";
import "./globals.css";

const libertinusSerif = Libertinus_Serif({
  variable: "--font-libertinus-serif",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Páginas de Projeto",
  description:
    "Plataforma para publicar páginas de projeto com fotos, vídeos e blocos editoriais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${libertinusSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
