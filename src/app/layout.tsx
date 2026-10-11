import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Field to Future: Bloom | Agriculture, Sustainability & Eco-Flourish",
  description: "Transform an ash-destroyed world into a flourishing Eden. Connect smart farming, wildlife restoration, and real-world conservation funding with Bayer.",
  icons: {
    icon: [
      { url: '/assets/sprout_cursor.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/assets/sprout_cursor.svg',
    apple: '/assets/sprout_cursor.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
