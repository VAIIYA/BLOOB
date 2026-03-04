"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import SkinCard from "@/components/SkinCard";
import { SKINS, SKIN_MAP } from "@/lib/skins";
import type { SkinDefinition, UserProfile } from "@/types/game";

export default function ShopPage() {
    const router = useRouter();
    const { profile: auth, loading, isAuthed, loadProfile } = useWalletAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [confirm, setConfirm] = useState<SkinDefinition | null>(null);
    const [buying, setBuying] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccess] = useState("");
    const hasLoaded = useRef(false);

    useEffect(() => {
        if (!hasLoaded.current) { hasLoaded.current = true; loadProfile(); }
    }, [loadProfile]);

    useEffect(() => { if (auth) setProfile(auth); }, [auth]);
    useEffect(() => { if (!loading && !isAuthed) router.push("/"); }, [loading, isAuthed, router]);

    async function handleBuy(skin: SkinDefinition) {
        setConfirm(skin);
    }

    async function confirmBuy() {
        if (!confirm || !profile) return;
        setBuying(true);
        setErrorMsg("");
        const res = await fetch("/api/shop/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId: confirm.id }),
        });
        setBuying(false);
        setConfirm(null);
        if (res.ok) {
            const { coinsRemaining } = (await res.json()) as { coinsRemaining: number };
            setProfile((p) =>
                p
                    ? {
                        ...p,
                        coins: coinsRemaining,
                        skin_id: confirm.id,
                        owned_skins: [...p.owned_skins, confirm.id],
                    }
                    : p
            );
            setSuccess(`${confirm.name} skin purchased and equipped!`);
            setTimeout(() => setSuccess(""), 3000);
        } else {
            const { error } = (await res.json()) as { error: string };
            setErrorMsg(error);
        }
    }

    async function handleEquip(skinId: string) {
        const res = await fetch("/api/user/skin", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId }),
        });
        if (res.ok) {
            setProfile((p) => (p ? { ...p, skin_id: skinId } : p));
            setSuccess("Skin equipped!");
            setTimeout(() => setSuccess(""), 2000);
        }
    }

    if (loading || !profile) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>
                Loading shop…
            </div>
        );
    }

    const purchasableSkins = SKINS.filter((s) => s.unlockType === "purchasable");
    const earnableSkins = SKINS.filter((s) => s.unlockType === "milestone");
    const freeSkins = SKINS.filter((s) => s.unlockType === "free");

    return (
        <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "Inter, sans-serif", color: "#fff" }}>
            {/* Nav */}
            <nav
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 32px",
                    background: "rgba(10,10,15,0.9)",
                    backdropFilter: "blur(12px)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <Link href="/" style={{ textDecoration: "none", fontWeight: 800, fontSize: 20, color: "#a78bfa" }}>
                    AgarSol
                </Link>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ fontSize: 14, color: "#fbbf24", fontWeight: 700 }}>
                        {profile.coins.toLocaleString()} 🪙
                    </div>
                    <Link href="/profile" style={navLink}>Profile</Link>
                    <Link href="/play" style={{ ...navLink, background: "linear-gradient(135deg, #7c3aed, #a855f7)", padding: "8px 18px", borderRadius: 10, color: "#fff" }}>
                        Play
                    </Link>
                </div>
            </nav>

            <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px" }}>
                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 8px", background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Skin Shop
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: 0 }}>
                        Earn coins by playing (+1 per 100 mass eaten). Purchase skins to stand out.
                    </p>
                </div>

                {successMsg && (
                    <div style={{ background: "rgba(5,150,105,0.2)", border: "1px solid #059669", borderRadius: 10, padding: "10px 20px", marginBottom: 24, fontSize: 14, color: "#34d399" }}>
                        ✓ {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div style={{ background: "rgba(220,38,38,0.15)", border: "1px solid #dc2626", borderRadius: 10, padding: "10px 20px", marginBottom: 24, fontSize: 14, color: "#f87171" }}>
                        ✕ {errorMsg}
                    </div>
                )}

                {/* Purchasable */}
                <SkinSection title="🛍️ Buy with Coins" subtitle="One-time purchase, yours forever.">
                    {purchasableSkins.map((skin) => (
                        <SkinCard
                            key={skin.id}
                            skin={skin}
                            walletAddress={profile.wallet_address}
                            totalMassEaten={profile.total_mass_eaten}
                            coins={profile.coins}
                            ownedSkins={profile.owned_skins}
                            equippedSkin={profile.skin_id}
                            onEquip={handleEquip}
                            onBuy={handleBuy}
                        />
                    ))}
                </SkinSection>

                {/* Earnable */}
                <SkinSection title="🏆 Earn by Playing" subtitle="Reach a total mass milestone to unlock.">
                    {earnableSkins.map((skin) => (
                        <SkinCard
                            key={skin.id}
                            skin={skin}
                            walletAddress={profile.wallet_address}
                            totalMassEaten={profile.total_mass_eaten}
                            coins={profile.coins}
                            ownedSkins={profile.owned_skins}
                            equippedSkin={profile.skin_id}
                            onEquip={handleEquip}
                            onBuy={handleBuy}
                        />
                    ))}
                </SkinSection>

                {/* Free */}
                <SkinSection title="🎁 Free Skins" subtitle="Available to all players from the start.">
                    {freeSkins.map((skin) => (
                        <SkinCard
                            key={skin.id}
                            skin={skin}
                            walletAddress={profile.wallet_address}
                            totalMassEaten={profile.total_mass_eaten}
                            coins={profile.coins}
                            ownedSkins={profile.owned_skins}
                            equippedSkin={profile.skin_id}
                            onEquip={handleEquip}
                            onBuy={handleBuy}
                        />
                    ))}
                </SkinSection>
            </main>

            {/* Confirmation modal */}
            {confirm && (
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
                            maxWidth: 360,
                            width: "90%",
                        }}
                    >
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🛒</div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
                            Buy {confirm.name}?
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 24 }}>
                            This will cost <strong style={{ color: "#fbbf24" }}>{confirm.coinCost?.toLocaleString()} 🪙</strong>.
                            You have <strong style={{ color: "#fbbf24" }}>{profile.coins.toLocaleString()} 🪙</strong>.
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button
                                onClick={confirmBuy}
                                disabled={buying}
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                    border: "none", borderRadius: 12, color: "#fff",
                                    fontSize: 15, fontWeight: 700, padding: "12px 28px",
                                    cursor: buying ? "wait" : "pointer", fontFamily: "Inter, sans-serif",
                                }}
                            >
                                {buying ? "Buying…" : "Confirm Buy"}
                            </button>
                            <button
                                onClick={() => setConfirm(null)}
                                style={{
                                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: 12, color: "rgba(255,255,255,0.7)",
                                    fontSize: 15, fontWeight: 600, padding: "12px 20px",
                                    cursor: "pointer", fontFamily: "Inter, sans-serif",
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SkinSection({ title, subtitle, children }: {
    title: string; subtitle: string; children: React.ReactNode;
}) {
    return (
        <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#fff" }}>{title}</h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 20px" }}>{subtitle}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16 }}>
                {children}
            </div>
        </section>
    );
}

const navLink: React.CSSProperties = {
    color: "rgba(255,255,255,0.65)", textDecoration: "none",
    fontSize: 14, fontWeight: 500, background: "none", fontFamily: "Inter, sans-serif",
};
