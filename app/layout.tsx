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

const metadataBaseUrl = (() => {
  try {
    const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (u) {
      const withProto =
        u.startsWith("http://") || u.startsWith("https://") ? u : `https://${u}`;
      return new URL(withProto.replace(/\/$/, ""));
    }
    if (process.env.VERCEL_URL) {
      return new URL(`https://${process.env.VERCEL_URL}`);
    }
  } catch {
    console.error(
      "[layout] NEXT_PUBLIC_APP_URL u otra URL base no válida; revisa variables de entorno.",
    );
  }
  return undefined;
})();

export const metadata: Metadata = {
  ...(metadataBaseUrl ? { metadataBase: metadataBaseUrl } : {}),
  title: "Triclock",
  description:
    "Triclock: control horario con correcciones y registro de actividad.",
  applicationName: "Triclock",
  icons: {
    icon: [{ url: "/icono.png", type: "image/png", sizes: "32x32" }],
    shortcut: "/icono.png",
    apple: [{ url: "/icono.png", type: "image/png", sizes: "180x180" }],
  },
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "Triclock",
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
