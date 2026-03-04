"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import SkinPreview from "@/components/SkinPreview";
import { SKIN_MAP } from "@/lib/skins";
import Link from "next/link";

/**
 * Landing page — animated background, logo, wallet connect, and navigation.
 * The animated background is drawn on a canvas with drifting coloured circles.
 */
export default function LandingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { connected } = useWallet();
    const { profile, isAuthed, loading, signIn, loadProfile } = useWalletAuth();
    const [showUsername, setShowUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [signing, setSigning] = useState(false);
    const hasTriedLoad = useRef(false);

    // Load profile on mount (checks cookie)
    useEffect(() => {
        if (!hasTriedLoad.current) {
            hasTriedLoad.current = true;
            loadProfile();
        }
    }, [loadProfile]);

    // When wallet connects, try to sign in
    useEffect(() => {
        if (connected && !isAuthed && !loading) {
            handleSignIn();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    async function handleSignIn(username?: string) {
        setSigning(true);
        const result = await signIn(username);
        setSigning(false);
        if (!result && !username) {
            // New user — show username form
            setShowUsername(true);
        }
    }

    async function handleUsernameSubmit() {
        setUsernameError("");
        const clean = usernameInput.trim();
        if (!/^[a-zA-Z0-9_-]{3,16}$/.test(clean)) {
            setUsernameError("3–16 chars, letters / numbers / _ / - only");
            return;
        }
        setSigning(true);
        const result = await signIn(clean);
        setSigning(false);
        if (result) setShowUsername(false);
    }

    // ── Background animation ─────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        interface Blob {
            x: number; y: number; r: number;
            dx: number; dy: number;
            hue: number; alpha: number;
        }

        const blobs: Blob[] = Array.from({ length: 18 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 80 + Math.random() * 160,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            hue: Math.random() * 360,
            alpha: 0.07 + Math.random() * 0.1,
        }));

        let raf: number;

        function draw() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#0a0a0f";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (const b of blobs) {
                const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
                grad.addColorStop(0, `hsla(${b.hue},70%,60%,${b.alpha})`);
                grad.addColorStop(1, `hsla(${b.hue},70%,60%,0)`);
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();

                b.x += b.dx;
                b.y += b.dy;
                b.hue = (b.hue + 0.08) % 360;
                if (b.x < -b.r) b.x = canvas.width + b.r;
                if (b.x > canvas.width + b.r) b.x = -b.r;
                if (b.y < -b.r) b.y = canvas.height + b.r;
                if (b.y > canvas.height + b.r) b.y = -b.r;
            }

            raf = requestAnimationFrame(draw);
        }

        draw();
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }, []);

    const equippedSkin = SKIN_MAP.get(profile?.skin_id ?? "classic");

    return (
        <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
            {/* Animated background */}
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

            {/* Wallet button (top-right) */}
            <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
                <WalletMultiButton />
            </div>

            {/* Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    gap: 24,
                    padding: "40px 20px",
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center" }}>
                    <h1
                        style={{
                            fontSize: "clamp(52px, 10vw, 96px)",
                            fontWeight: 900,
                            margin: 0,
                            lineHeight: 1,
                            background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            letterSpacing: -3,
                            textShadow: "none",
                        }}
                    >
                        AgarSol
                    </h1>
                    <p
                        style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 16,
                            marginTop: 8,
                            marginBottom: 0,
                        }}
                    >
                        Agar.io — on Solana. Multiplayer. Real-time. No gas fees.
                    </p>
                </div>

                {/* Skin preview if logged in */}
                {isAuthed && profile && equippedSkin && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                border: "2px solid rgba(167,139,250,0.4)",
                                borderRadius: "50%",
                                padding: 4,
                                boxShadow: "0 0 32px rgba(124,58,237,0.4)",
                            }}
                        >
                            <SkinPreview skin={equippedSkin} walletAddress={profile.wallet_address} size={100} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "#c4b5fd" }}>{profile.username}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                            {profile.coins} 🪙 coins · {profile.total_mass_eaten.toLocaleString()} mass eaten
                        </div>
                    </div>
                )}

                {/* CTA buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
                    {!connected && !isAuthed ? (
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>
                                Connect your Solana wallet to play
                            </p>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <WalletMultiButton />
                            </div>
                        </div>
                    ) : (
                        <>
                            {isAuthed ? (
                                <Link href="/play" style={{ textDecoration: "none" }}>
                                    <button
                                        style={{
                                            width: "100%",
                                            padding: "16px 0",
                                            fontSize: 18,
                                            fontWeight: 800,
                                            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                            border: "none",
                                            borderRadius: 14,
                                            color: "#fff",
                                            cursor: "pointer",
                                            boxShadow: "0 4px 24px rgba(124,58,237,0.5)",
                                            fontFamily: "Inter, sans-serif",
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        🎮 Play Now
                                    </button>
                                </Link>
                            ) : (
                                <button
                                    onClick={() => handleSignIn()}
                                    disabled={signing || loading}
                                    style={{
                                        width: "100%",
                                        padding: "16px 0",
                                        fontSize: 16,
                                        fontWeight: 700,
                                        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                        border: "none",
                                        borderRadius: 14,
                                        color: "#fff",
                                        cursor: signing ? "wait" : "pointer",
                                        opacity: signing ? 0.7 : 1,
                                        fontFamily: "Inter, sans-serif",
                                    }}
                                >
                                    {signing ? "Signing in…" : "Sign In with Wallet"}
                                </button>
                            )}

                            {isAuthed && (
                                <>
                                    <Link href="/profile" style={{ textDecoration: "none" }}>
                                        <button style={outlineBtn}>👤 Profile</button>
                                    </Link>
                                    <Link href="/shop" style={{ textDecoration: "none" }}>
                                        <button style={outlineBtn}>🛍️ Skin Shop</button>
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Tip */}
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", maxWidth: 400 }}>
                    Move with your mouse · SPACE to split · W to eject · Eat smaller cells to grow
                </p>
            </div>

            {/* Username modal */}
            {showUsername && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 300,
                        background: "rgba(0,0,0,0.8)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "linear-gradient(135deg, #12121f, #1e1040)",
                            border: "1px solid rgba(196,181,253,0.25)",
                            borderRadius: 20,
                            padding: "40px 48px",
                            textAlign: "center",
                            maxWidth: 380,
                            width: "90%",
                        }}
                    >
                        <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
                        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>
                            Choose a username
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 24 }}>
                            This name will be visible to other players. You can change it once every 7 days.
                        </p>
                        <input
                            type="text"
                            placeholder="CoolPlayer42"
                            value={usernameInput}
                            maxLength={16}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUsernameSubmit()}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 10,
                                color: "#fff",
                                fontSize: 16,
                                outline: "none",
                                fontFamily: "Inter, sans-serif",
                                marginBottom: 8,
                            }}
                        />
                        {usernameError && (
                            <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 12px" }}>{usernameError}</p>
                        )}
                        <button
                            onClick={handleUsernameSubmit}
                            disabled={signing}
                            style={{
                                width: "100%",
                                padding: "13px 0",
                                marginTop: 8,
                                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                border: "none",
                                borderRadius: 12,
                                color: "#fff",
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: signing ? "wait" : "pointer",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            {signing ? "Signing in…" : "Confirm & Sign In"}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

const outlineBtn: React.CSSProperties = {
    width: "100%",
    padding: "14px 0",
    fontSize: 15,
    fontWeight: 600,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    color: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
};
