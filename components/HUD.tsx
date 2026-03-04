"use client";

import type { PlayerSnapshot, LeaderboardEntry } from "@/types/game";
import Minimap from "./Minimap";
import Leaderboard from "./Leaderboard";

interface HUDProps {
    myWallet: string;
    myUsername: string;
    players: PlayerSnapshot[];
    leaderboard: LeaderboardEntry[];
    roomId: string;
    onPause: () => void;
}

export default function HUD({
    myWallet,
    myUsername,
    players,
    leaderboard,
    roomId,
    onPause,
}: HUDProps) {
    const me = players.find((p) => p.walletAddress === myWallet);
    const myMass = me?.cells.reduce((s, c) => s + c.mass, 0) ?? 0;
    const myScore = me?.score ?? 0;

    // Only count alive players
    const alivePlayers = players.filter((p) => p.isAlive).length;

    return (
        <>
            {/* ── Top-left: mass + score ───────────────────────────────────── */}
            <div
                style={{
                    position: "fixed",
                    top: 16,
                    left: 16,
                    zIndex: 100,
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(4px)",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "10px 16px",
                    }}
                >
                    <div style={{ fontSize: 11, color: "rgba(180,130,255,0.9)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
                        {myUsername}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
                        {Math.round(myMass)}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                        mass
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,200,100,0.85)", fontWeight: 600 }}>
                        Score: {myScore}
                    </div>
                </div>
            </div>

            {/* ── Top-right: leaderboard ───────────────────────────────────── */}
            <div
                style={{
                    position: "fixed",
                    top: 16,
                    right: 16,
                    zIndex: 100,
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                <Leaderboard entries={leaderboard} myWallet={myWallet} />
            </div>

            {/* ── Bottom-right: minimap ────────────────────────────────────── */}
            <div
                style={{
                    position: "fixed",
                    bottom: 16,
                    right: 16,
                    zIndex: 100,
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                <Minimap players={players} myWallet={myWallet} />
            </div>

            {/* ── Bottom-left: room info + controls ───────────────────────── */}
            <div
                style={{
                    position: "fixed",
                    bottom: 16,
                    left: 16,
                    zIndex: 100,
                    fontFamily: "Inter, sans-serif",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(4px)",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "10px 14px",
                        color: "#fff",
                    }}
                >
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 1 }}>
                        Room
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#c4b5fd" }}>
                        {roomId}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                        {alivePlayers} player{alivePlayers !== 1 ? "s" : ""} online
                    </div>
                    <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                        SPACE: split &nbsp;|&nbsp; W: eject &nbsp;|&nbsp; ESC: pause
                    </div>
                </div>

                {/* Pause button */}
                <button
                    onClick={onPause}
                    style={{
                        marginTop: 8,
                        display: "block",
                        width: "100%",
                        background: "rgba(124,58,237,0.7)",
                        border: "1px solid rgba(196,181,253,0.3)",
                        borderRadius: 8,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 14px",
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    ⏸ Pause (ESC)
                </button>
            </div>
        </>
    );
}
