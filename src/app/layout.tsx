import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // removed to avoid external font fetch
import "./globals.css";

// const inter = Inter({
//   variable: "--font-sans",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Tracker360",
  description: "Every Lead. Every Follow-up. Every Opportunity. One Tracker.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
