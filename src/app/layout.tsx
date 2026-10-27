import { FallingLeaves } from "@/components/FallingLeaves";
import type { Metadata, Viewport } from "next";
import { Cinzel, Fraunces, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { MenuCloser } from "@/components/MenuCloser";
import { getCurrentUser } from "@/modules/accounts/session";
import { aiConfigured } from "@/modules/assistant/ai";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["700"], variable: "--font-cinzel", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Gaach - Trees for your place in Bangladesh", template: "%s | Gaach" },
  description: "Find the right tree for your district, space and sunlight, buy healthy saplings, and get care guidance.",
};

export const viewport: Viewport = { themeColor: "#0d2b23", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${poppins.variable} ${cinzel.variable} ${fraunces.variable}`}>
      <body className="min-h-screen overflow-x-clip antialiased">
        <noscript><style>{`.reveal{opacity:1;transform:none;filter:none}.step-icon,.rise-word,.species-item,.hero-photo-card,.hero-eyebrow-line{opacity:1;transform:none;filter:none}`}</style></noscript>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">{children}</main>
        <Footer />
        <MenuCloser />
        <FallingLeaves />
        <ChatWidget loggedIn={!!user} firstName={user?.name.split(" ")[0] ?? null} offline={!aiConfigured()} />
      </body>
    </html>
  );
}
