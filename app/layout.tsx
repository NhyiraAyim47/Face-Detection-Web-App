import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Face Detection | Ultralytics Hub",
  description: "Real-time face detection powered by YOLO26 and Ultralytics Cloud API, deployed on Vercel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
