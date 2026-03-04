import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";

export const metadata: Metadata = {
    title: "AgarSol – Agar.io on Solana",
    description: "Multiplayer agar.io clone with Solana wallet auth, skins, and real-time gameplay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ margin: 0, background: "#0a0a0f", color: "#fff", fontFamily: "Inter, sans-serif" }}>
                <WalletProvider>{children}</WalletProvider>
            </body>
        </html>
    );
}
