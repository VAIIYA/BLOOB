"use client";

import type { LeaderboardEntry } from "@/types/game";

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    myWallet: string;
}

export default function Leaderboard({ entries, myWallet }: LeaderboardProps) {
    return (
        <div
            style={{
                minWidth: 180,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "10px 14px",
                fontFamily: "Inter, sans-serif",
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "rgba(180,130,255,0.9)",
                    marginBottom: 8,
                }}
            >
                Leaderboard
            </div>

            {entries.length === 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                    Waiting for players…
                </div>
            )}

            {entries.map((entry) => {
                const isMe = entry.walletAddress === myWallet;
                return (
                    <div
                        key={entry.walletAddress}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "3px 0",
                            opacity: 1,
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                    >
                        {/* Rank number */}
                        <span
                            style={{
                                width: 18,
                                fontSize: 11,
                                fontWeight: 700,
                                color: isMe
                                    ? "#c4b5fd"
                                    : entry.rank <= 3
                                        ? "#f59e0b"
                                        : "rgba(255,255,255,0.4)",
                                flexShrink: 0,
                            }}
                        >
                            {entry.rank}
                        </span>

                        {/* Username */}
                        <span
                            style={{
                                flex: 1,
                                fontSize: 12,
                                fontWeight: isMe ? 700 : 400,
                                color: isMe ? "#ffffff" : "rgba(255,255,255,0.75)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {isMe ? `▶ ${entry.username}` : entry.username}
                        </span>

                        {/* Mass */}
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: isMe ? "#c4b5fd" : "rgba(255,255,255,0.45)",
                                flexShrink: 0,
                            }}
                        >
                            {Math.round(entry.totalMass)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
