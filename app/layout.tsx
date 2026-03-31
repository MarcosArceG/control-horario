import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { authSafe } from "@/lib/auth-safe";
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
  title: "Control Horario",
  description:
    "Registro de entradas y salidas con correcciones y auditoría.",
  applicationName: "Control Horario",
  icons: {
    icon: [
      { url: "/icono.png", type: "image/png", sizes: "192x192" },
      { url: "/icono.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icono.png", type: "image/png", sizes: "180x180" },
    ],
    shortcut: "/icono.png",
  },
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "Control Horario",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1222" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await authSafe();

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-h-[100dvh] antialiased`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
