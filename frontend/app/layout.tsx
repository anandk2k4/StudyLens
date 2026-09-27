import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyLens AI — Video Knowledge Engine & Study Platform",
  description: "Transform video lectures into persistent, structured Knowledge Bases with AI summaries, notes, interactive quizzes, flashcards, and grounded AI tutoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#05090B] text-[#F5F7F7] antialiased">{children}</body>
    </html>
  );
}
