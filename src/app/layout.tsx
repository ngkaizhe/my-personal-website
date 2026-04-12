import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";

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

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light' || t === 'sepia') {
      document.documentElement.classList.add(t);
    } else {
      document.documentElement.classList.add('light');
    }
  } catch (e) {
    document.documentElement.classList.add('light');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={montserrat.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
