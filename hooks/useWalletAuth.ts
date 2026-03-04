"use client";

import { useState, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import type { UserProfile } from "@/types/game";

interface WalletAuthState {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    isAuthed: boolean;
}

/**
 * useWalletAuth — ties together Solana wallet connect, message signing,
 * backend JWT issuance, and user profile loading.
 *
 * Flow:
 *   1. User clicks "Connect Wallet" → Phantom/Backpack/Solflare prompts
 *   2. Once connected, signIn() is called automatically
 *   3. signIn() asks the wallet to sign a timestamped message
 *   4. POST /api/auth/verify with walletAddress + signature + timestamp
 *   5. Server verifies signature, issues JWT cookie, returns profile
 *   6. If new user, redirects to username setup flow
 */
export function useWalletAuth() {
    const { publicKey, signMessage, disconnect, connected } = useWallet();
    const [state, setState] = useState<WalletAuthState>({
        profile: null,
        loading: false,
        error: null,
        isAuthed: false,
    });

    // Guard against double-signing in React Strict Mode
    const signingRef = useRef(false);

    /** Sign in with the connected wallet */
    const signIn = useCallback(
        async (username?: string): Promise<UserProfile | null> => {
            if (!publicKey || !signMessage) return null;
            if (signingRef.current) return null;
            signingRef.current = true;

            setState((s) => ({ ...s, loading: true, error: null }));

            try {
                const timestamp = Date.now();
                const message = `Sign in to AgarSol - ${timestamp}`;
                const encoded = new TextEncoder().encode(message);

                // Ask the wallet (Phantom / Backpack / Solflare) to sign the message
                const signatureBytes = await signMessage(encoded);
                const signature = bs58.encode(signatureBytes);
                const walletAddress = publicKey.toBase58();

                const body: Record<string, unknown> = {
                    walletAddress,
                    signature,
                    timestamp,
                };
                if (username) body.username = username;

                const res = await fetch("/api/auth/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const { error } = (await res.json()) as { error: string };
                    throw new Error(error ?? "Authentication failed");
                }

                const profile = (await res.json()) as UserProfile;
                setState({ profile, loading: false, error: null, isAuthed: true });
                signingRef.current = false;
                return profile;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setState((s) => ({ ...s, loading: false, error: message, isAuthed: false }));
                signingRef.current = false;
                return null;
            }
        },
        [publicKey, signMessage]
    );

    /** Load existing profile from the server (checks JWT cookie) */
    const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
        setState((s) => ({ ...s, loading: true }));
        try {
            const res = await fetch("/api/user/profile");
            if (!res.ok) {
                setState((s) => ({ ...s, loading: false, isAuthed: false, profile: null }));
                return null;
            }
            const profile = (await res.json()) as UserProfile;
            setState({ profile, loading: false, error: null, isAuthed: true });
            return profile;
        } catch {
            setState((s) => ({ ...s, loading: false }));
            return null;
        }
    }, []);

    /** Logout — clear cookie + disconnect wallet */
    const logout = useCallback(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        disconnect().catch(() => undefined);
        setState({ profile: null, loading: false, error: null, isAuthed: false });
    }, [disconnect]);

    return {
        ...state,
        connected,
        walletAddress: publicKey?.toBase58() ?? null,
        signIn,
        loadProfile,
        logout,
    };
}
