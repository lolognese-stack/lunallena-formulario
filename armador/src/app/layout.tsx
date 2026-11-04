import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { BASE } from "@/lib/contacto";

// Misma tipografía que el sitio (tema premium): Manrope liviana en títulos y texto.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("titulo"),
    description: t("descripcion"),
    icons: { icon: `${BASE}/logo.svg` },
    // Mientras se valida vive en un dominio aparte: no indexar.
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={manrope.variable}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
