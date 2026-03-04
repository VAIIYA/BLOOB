"use client";

import type { DeadMessage } from "@/types/game";

interface DeathScreenProps {
    deathInfo: DeadMessage;
    onRespawn: () => void;
    onQuit: () => void;
}

export default function DeathScreen({ deathInfo, onRespawn, onQuit }: DeathScreenProps) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(8px)",
                fontFamily: "Inter, sans-serif",
            }}
        >
            <div
                style={{
                    background: "linear-gradient(135deg, #12121f 0%, #1e1040 100%)",
                    border: "1px solid rgba(196,181,253,0.2)",
                    borderRadius: 20,
                    padding: "48px 56px",
                    textAlign: "center",
                    color: "#fff",
                    maxWidth: 440,
                    width: "90%",
                    boxShadow: "0 0 60px rgba(124,58,237,0.3)",
                }}
            >
                {/* Skull emoji */}
                <div style={{ fontSize: 64, marginBottom: 16 }}>💀</div>

                <h2
                    style={{
                        fontSize: 28,
                        fontWeight: 800,
                        margin: "0 0 8px",
                        background: "linear-gradient(90deg, #f87171, #fb923c)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    You were eaten
                </h2>

                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 32px" }}>
                    by <strong style={{ color: "#c4b5fd" }}>{deathInfo.eatenBy}</strong>
                </p>

                <div
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        padding: "20px 28px",
                        marginBottom: 28,
                    }}
                >
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                        Final Score
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: "#a78bfa", lineHeight: 1 }}>
                        {deathInfo.score}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                        mass eaten this session
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button
                        onClick={onRespawn}
                        style={{
                            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                            border: "none",
                            borderRadius: 12,
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: 700,
                            padding: "14px 32px",
                            cursor: "pointer",
                            boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
                            transition: "transform 0.15s",
                        }}
                        onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)")}
                        onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
                    >
                        🔄 Respawn
                    </button>

                    <button
                        onClick={onQuit}
                        style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 12,
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 15,
                            fontWeight: 600,
                            padding: "14px 24px",
                            cursor: "pointer",
                            transition: "background 0.15s",
                        }}
                        onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)")}
                        onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")}
                    >
                        ← Quit
                    </button>
                </div>
            </div>
        </div>
    );
}
