import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { SmoothScrollProvider } from "./components/SmoothScrollProvider";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
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
      className={`${openSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
