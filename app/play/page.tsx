"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import DeathScreen from "@/components/DeathScreen";
import type {
    PlayerSnapshot,
    LeaderboardEntry,
    DeadMessage,
} from "@/types/game";

/**
 * /play — full-screen game page.
 * Reads auth from cookie, generates a room ID, and renders the game.
 */
export default function PlayPage() {
    const router = useRouter();
    const { profile, loading, isAuthed, loadProfile } = useWalletAuth();
    const [players, setPlayers] = useState<PlayerSnapshot[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [deathInfo, setDeathInfo] = useState<DeadMessage | null>(null);
    const [paused, setPaused] = useState(false);
    const [roomId, setRoomId] = useState<string>("");
    const hasLoaded = useRef(false);
    // JWT token forwarded from server — use cookie fallback approach
    const [token, setToken] = useState<string>("");

    useEffect(() => {
        if (!hasLoaded.current) {
            hasLoaded.current = true;
            loadProfile();
        }
    }, [loadProfile]);

    // Generate/read room ID from URL hash
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (hash) {
            setRoomId(hash);
        } else {
            const newRoom = "room-" + Math.random().toString(36).slice(2, 8);
            window.location.hash = newRoom;
            setRoomId(newRoom);
        }
    }, []);

    // Fetch token for PartyKit authentication (re-uses the existing session)
    useEffect(() => {
        // We read the token from the server by making an auth-check request
        // The token is embedded in a hidden endpoint so it can be passed to PartyKit
        fetch("/api/user/profile")
            .then((r) => r.headers.get("x-session-token") ?? "")
            .then((t) => setToken(t))
            .catch(() => setToken(""));
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !isAuthed) {
            router.push("/");
        }
    }, [loading, isAuthed, router]);

    const handleLeaderboard = useCallback((msg: { type: "leaderboard"; top10: LeaderboardEntry[] }) => {
        setLeaderboard(msg.top10);
    }, []);

    const handleTick = useCallback((msg: { type: "tick"; players: PlayerSnapshot[] }) => {
        setPlayers(msg.players);
    }, []);

    // Death
    const handleDead = useCallback((msg: DeadMessage) => {
        setDeathInfo(msg);
    }, []);

    const handleRespawn = () => {
        setDeathInfo(null);
        // Reload the page to rejoin the room fresh
        window.location.reload();
    };

    const handleQuit = () => {
        router.push("/");
    };

    // ESC to pause
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "Escape") setPaused((p) => !p);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    if (loading || !isAuthed || !profile || !roomId) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    background: "#0a0a0f",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "Inter, sans-serif",
                }}
            >
                Loading game…
            </div>
        );
    }

    return (
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0a0a0f" }}>
            {/* Game canvas (fills screen) */}
            <GameCanvas
                roomId={roomId}
                walletAddress={profile.wallet_address}
                username={profile.username}
                skinId={profile.skin_id}
                token={token}
                onDead={handleDead}
                onLeaderboard={handleLeaderboard}
                paused={paused || !!deathInfo}
            />

            {/* HUD overlay */}
            {!deathInfo && (
                <HUD
                    myWallet={profile.wallet_address}
                    myUsername={profile.username}
                    players={players}
                    leaderboard={leaderboard}
                    roomId={roomId}
                    onPause={() => setPaused((p) => !p)}
                />
            )}

            {/* Pause menu */}
            {paused && !deathInfo && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 150,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(6px)",
                    }}
                    onClick={() => setPaused(false)}
                >
                    <div
                        style={{
                            background: "linear-gradient(135deg, #12121f, #1e1040)",
                            border: "1px solid rgba(196,181,253,0.2)",
                            borderRadius: 20,
                            padding: "40px 56px",
                            textAlign: "center",
                            color: "#fff",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 24px" }}>⏸ Paused</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <button
                                onClick={() => setPaused(false)}
                                style={pauseBtn("#7c3aed")}
                            >
                                ▶ Resume
                            </button>
                            <button onClick={handleQuit} style={pauseBtn("rgba(255,255,255,0.08)")}>
                                ← Quit to Lobby
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Death screen */}
            {deathInfo && (
                <DeathScreen
                    deathInfo={deathInfo}
                    onRespawn={handleRespawn}
                    onQuit={handleQuit}
                />
            )}
        </div>
    );
}

function pauseBtn(bg: string): React.CSSProperties {
    return {
        padding: "12px 40px",
        background: bg,
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#fff",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
    };
}
