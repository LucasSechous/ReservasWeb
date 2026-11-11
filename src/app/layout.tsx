import type { Metadata } from "next";
import {
  Alegreya_Sans,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Courier_Prime,
  Geist,
  Geist_Mono,
  Jost,
  Oswald,
  Playfair_Display,
  Shrikhand,
} from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { urlSitio } from "@/lib/sitio";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tipografías del estilo retro (components/landing-retro.tsx). Sin precarga: solo se descargan en las
// páginas que las usan, así la vitrina y las demás landings no pagan por ellas.
const shrikhand = Shrikhand({
  variable: "--font-shrikhand",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const courierPrime = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

const alegreyaSans = Alegreya_Sans({
  variable: "--font-alegreya",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  preload: false,
});

// Tipografías del estilo editorial (components/landing-editorial.tsx), también sin precarga.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  preload: false,
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  preload: false,
});

// Tipografías del estilo clásico de barbería (components/landing-clasica.tsx), también sin precarga.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  preload: false,
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600"],
  preload: false,
});

export const metadata: Metadata = {
  // Base de los links absolutos de og:image y og:url. Se cambia con NEXT_PUBLIC_SITE_URL (ver lib/sitio.ts).
  metadataBase: urlSitio(),
  title: {
    default: "Tu Turno · Webs con reservas online",
    template: "%s · Tu Turno",
  },
  description:
    "Páginas web con reservas online para barberías, peluquerías, centros de estética, clínicas y consultorios en Uruguay. Tus clientes reservan solos desde el celular.",
  openGraph: {
    title: "Tu Turno · Webs con reservas online",
    description:
      "Tu negocio con su propia web, y turnos que se reservan solos.",
    url: "/",
    siteName: "Tu Turno",
    locale: "es_UY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${shrikhand.variable} ${courierPrime.variable} ${alegreyaSans.variable} ${cormorant.variable} ${jost.variable} ${playfair.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
