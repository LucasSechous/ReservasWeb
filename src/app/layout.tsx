import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ReservasWeb · Tu web con reservas online",
    template: "%s · ReservasWeb",
  },
  description:
    "Páginas web con reservas online para barberías, peluquerías y centros de estética en Uruguay. Tus clientes reservan solos desde el celular.",
  openGraph: {
    title: "ReservasWeb · Tu web con reservas online",
    description:
      "Tu negocio con su propia web, y turnos que se reservan solos.",
    locale: "es_UY",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
