import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecastAI — Turn Podcasts & Videos Into Viral Content",
  description:
    "Paste a YouTube URL and get a blog post, Twitter thread, LinkedIn post, and newsletter in seconds. Powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
