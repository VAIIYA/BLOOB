"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import SkinCard from "@/components/SkinCard";
import { SKINS } from "@/lib/skins";
import type { UserProfile } from "@/types/game";

export default function ProfilePage() {
    const router = useRouter();
    const { profile: auth, isAuthed, loading, loadProfile, logout } = useWalletAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editingUsername, setEditing] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [usernameError, setUErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const hasLoaded = useRef(false);

    useEffect(() => {
        if (!hasLoaded.current) {
            hasLoaded.current = true;
            loadProfile();
        }
    }, [loadProfile]);

    useEffect(() => {
        if (auth) setProfile(auth);
    }, [auth]);

    useEffect(() => {
        if (!loading && !isAuthed) router.push("/");
    }, [loading, isAuthed, router]);

    async function handleEquip(skinId: string) {
        const res = await fetch("/api/user/skin", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinId }),
        });
        if (res.ok) {
            setProfile((p) => p ? { ...p, skin_id: skinId } : p);
            setSuccessMsg("Skin equipped!");
            setTimeout(() => setSuccessMsg(""), 2000);
        }
    }

    async function handleUsernameSubmit() {
        setUErr("");
        const clean = newUsername.trim();
        if (!/^[a-zA-Z0-9_-]{3,16}$/.test(clean)) {
            setUErr("3–16 chars, letters / numbers / _ / - only");
            return;
        }
        setSaving(true);
        const res = await fetch("/api/user/username", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: clean }),
        });
        setSaving(false);
        if (res.ok) {
            setProfile((p) => p ? { ...p, username: clean } : p);
            setEditing(false);
            setSuccessMsg("Username updated!");
            setTimeout(() => setSuccessMsg(""), 2000);
        } else {
            const { error } = await res.json() as { error: string };
            setUErr(error);
        }
    }

    if (loading || !profile) {
        return <LoadingScreen />;
    }

    const canChangeUsername = !profile.username_changed_at
        || Date.now() - new Date(profile.username_changed_at).getTime() >= 7 * 24 * 60 * 60 * 1000;

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
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Link href="/shop" style={navLink}>Skin Shop</Link>
                    <Link href="/play" style={{ ...navLink, background: "linear-gradient(135deg, #7c3aed, #a855f7)", padding: "8px 18px", borderRadius: 10, color: "#fff" }}>
                        Play
                    </Link>
                    <button onClick={logout} style={{ ...navLink, cursor: "pointer", border: "none" }}>
                        Logout
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
                {successMsg && (
                    <div style={{ background: "rgba(5,150,105,0.2)", border: "1px solid #059669", borderRadius: 10, padding: "10px 20px", marginBottom: 24, fontSize: 14, color: "#34d399" }}>
                        ✓ {successMsg}
                    </div>
                )}

                {/* Profile header */}
                <section
                    style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.06))",
                        border: "1px solid rgba(196,181,253,0.15)",
                        borderRadius: 20,
                        padding: "32px 40px",
                        marginBottom: 32,
                    }}
                >
                    <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Stats */}
                        <div style={{ flex: 1, minWidth: 220 }}>
                            {/* Username */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                {editingUsername ? (
                                    <>
                                        <input
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            maxLength={16}
                                            style={inputStyle}
                                            onKeyDown={(e) => e.key === "Enter" && handleUsernameSubmit()}
                                            autoFocus
                                        />
                                        <button onClick={handleUsernameSubmit} disabled={saving} style={smallBtn("#7c3aed")}>
                                            {saving ? "…" : "Save"}
                                        </button>
                                        <button onClick={() => setEditing(false)} style={smallBtn("rgba(255,255,255,0.1)")}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#c4b5fd" }}>
                                            {profile.username}
                                        </h1>
                                        {canChangeUsername && (
                                            <button
                                                onClick={() => { setEditing(true); setNewUsername(profile.username); setUErr(""); }}
                                                style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            {usernameError && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 8px" }}>{usernameError}</p>}

                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24, fontFamily: "monospace" }}>
                                {profile.wallet_address.slice(0, 8)}…{profile.wallet_address.slice(-6)}
                            </div>

                            {/* Stat grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                                {[
                                    ["Games Played", profile.total_games, ""],
                                    ["Total Mass", profile.total_mass_eaten.toLocaleString(), "eaten"],
                                    ["Highest Mass", profile.highest_mass.toLocaleString(), "ever"],
                                    ["Coins", profile.coins.toLocaleString(), "🪙"],
                                ].map(([label, value, suffix]) => (
                                    <div key={String(label)}>
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                                            {value} <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>{suffix}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Skin grid */}
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
                    Skins
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: 16,
                    }}
                >
                    {SKINS.map((skin) => (
                        <SkinCard
                            key={skin.id}
                            skin={skin}
                            walletAddress={profile.wallet_address}
                            totalMassEaten={profile.total_mass_eaten}
                            coins={profile.coins}
                            ownedSkins={profile.owned_skins}
                            equippedSkin={profile.skin_id}
                            onEquip={handleEquip}
                            onBuy={() => router.push("/shop")}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>
            Loading profile…
        </div>
    );
}

const navLink: React.CSSProperties = {
    color: "rgba(255,255,255,0.65)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    background: "none",
    fontFamily: "Inter, sans-serif",
};

const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
    padding: "6px 12px",
    outline: "none",
    fontFamily: "Inter, sans-serif",
};

function smallBtn(bg: string): React.CSSProperties {
    return {
        background: bg,
        border: "none",
        borderRadius: 8,
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        padding: "6px 14px",
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
    };
}
