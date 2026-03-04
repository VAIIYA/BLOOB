"use client";

import { ReactNode, useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
    children: ReactNode;
}

/**
 * WalletProvider — wraps the app with Solana wallet context.
 * Supports Phantom, Backpack, and Solflare.
 * Backpack is auto-detected as a standard wallet adapter.
 */
export default function WalletProvider({ children }: Props) {
    const network =
        (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "mainnet-beta" | "devnet" | "testnet") ??
        "devnet";

    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            // Backpack uses the standard wallet adapter protocol and is detected automatically
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
}
