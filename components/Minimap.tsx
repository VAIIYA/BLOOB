"use client";

import type { PlayerSnapshot } from "@/types/game";
import { WORLD_SIZE } from "@/lib/gameConstants";

interface MinimapProps {
    players: PlayerSnapshot[];
    myWallet: string;
    width?: number;
    height?: number;
}

/**
 * Minimap — renders a small top-down overview of the entire world.
 * Draws on a canvas using a 2D context.
 * Other players are shown as small dots; your cell is highlighted in white.
 */
export default function Minimap({
    players,
    myWallet,
    width = 180,
    height = 180,
}: MinimapProps) {
    // Scale world coordinates to minimap coordinates
    const scaleX = (x: number) => (x / WORLD_SIZE) * width;
    const scaleY = (y: number) => (y / WORLD_SIZE) * height;

    return (
        <div
            style={{
                width,
                height,
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)",
            }}
        >
            <svg width={width} height={height} style={{ display: "block" }}>
                {/* World border */}
                <rect
                    x={1} y={1}
                    width={width - 2} height={height - 2}
                    fill="none"
                    stroke="rgba(100,60,200,0.6)"
                    strokeWidth={1}
                />

                {/* Player dots */}
                {players.map((player) => {
                    const isMe = player.walletAddress === myWallet;
                    const totalMass = player.cells.reduce((s, c) => s + c.mass, 0);
                    // Dot size grows slightly with mass so large players are visible
                    const dotRadius = Math.max(2.5, Math.min(6, Math.sqrt(totalMass) * 0.4));

                    // Use center of mass for minimap position
                    if (player.cells.length === 0) return null;
                    const cx = player.cells.reduce((s, c) => s + c.x * c.mass, 0) / totalMass;
                    const cy = player.cells.reduce((s, c) => s + c.y * c.mass, 0) / totalMass;

                    return (
                        <circle
                            key={player.id}
                            cx={scaleX(cx)}
                            cy={scaleY(cy)}
                            r={dotRadius}
                            fill={isMe ? "#ffffff" : "#7c3aed"}
                            stroke={isMe ? "#c4b5fd" : "transparent"}
                            strokeWidth={isMe ? 1.5 : 0}
                            opacity={0.9}
                        />
                    );
                })}
            </svg>

            {/* Label */}
            <div
                style={{
                    position: "absolute",
                    bottom: 4,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                }}
            >
                Minimap
            </div>
        </div>
    );
}
