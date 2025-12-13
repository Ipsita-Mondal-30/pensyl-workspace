import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intellirite",
  description: "Desktop Writing IDE - Web Version",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
