import type { Metadata, Viewport } from "next";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swiss Trip Deutsch",
  description: "스위스 여행을 위한 하루 10단어 독일어",
  appleWebApp: { capable: true, title: "Swiss Deutsch", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d52b1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh font-sans antialiased">
        <main className="mx-auto max-w-md px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
        <ServiceWorker />
      </body>
    </html>
  );
}
