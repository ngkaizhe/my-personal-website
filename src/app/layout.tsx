import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { isTheme, type Theme } from "@/lib/theme";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "My Journey — Personal Portfolio",
    template: "%s | My Journey",
  },
  description: "A timeline of milestones, growth, and the path that shaped who I am today.",
  openGraph: {
    title: "My Journey — Personal Portfolio",
    description: "A timeline of milestones, growth, and the path that shaped who I am today.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Journey — Personal Portfolio",
    description: "A timeline of milestones, growth, and the path that shaped who I am today.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('theme')?.value;
  const theme: Theme = isTheme(cookieTheme) ? cookieTheme : 'dark';
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={theme}>
      <body className={montserrat.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProviderWrapper>
            <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
