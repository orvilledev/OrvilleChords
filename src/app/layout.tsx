import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AuthGate } from "@/components/AuthGate";
import { SongsProvider } from "@/lib/data/SongsProvider";
import { SetlistsProvider } from "@/lib/data/SetlistsProvider";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "OrvilleChords", template: "%s · OrvilleChords" },
  description: "Chords and lyrics for worship songs.",
  applicationName: "OrvilleChords",
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthGate>
            <SongsProvider>
              <SetlistsProvider>
                <main className="flex-1 w-full max-w-2xl mx-auto pb-20">{children}</main>
                <BottomNav />
              </SetlistsProvider>
            </SongsProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
