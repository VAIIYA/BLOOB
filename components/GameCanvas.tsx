"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { usePartySocket } from "@/hooks/usePartySocket";
import { renderSkin } from "@/lib/skins";
import type {
    TickMessage,
    DeadMessage,
    LeaderboardMessage,
    PlayerSnapshot,
    FoodPellet,
    Virus,
    Cell,
} from "@/types/game";
import { WORLD_SIZE, VIRUS_RADIUS } from "@/lib/gameConstants";

interface GameCanvasProps {
    roomId: string;
    walletAddress: string;
    username: string;
    skinId: string;
    token: string;
    onDead: (msg: DeadMessage) => void;
    onLeaderboard: (msg: LeaderboardMessage) => void;
    paused: boolean;
}

// ─── Interpolation helpers ────────────────────────────────────────────────────

/** Latest snapshot from the server – used for rendering */
interface GameSnapshot {
    players: PlayerSnapshot[];
    food: FoodPellet[];
    viruses: Virus[];
    tick: number;
}

export default function GameCanvas({
    roomId,
    walletAddress,
    username,
    skinId,
    token,
    onDead,
    onLeaderboard,
    paused,
}: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const snapshotRef = useRef<GameSnapshot | null>(null);
    const mouseAngleRef = useRef<number>(0);
    const mouseSpeedRef = useRef<number>(1);
    const startTimeRef = useRef<number>(Date.now());

    // We track mouse position relative to canvas center
    const handleMouseMove = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        mouseAngleRef.current = Math.atan2(dy, dx);
        // Speed is 1 for most distances, but taper off very close to center
        const d = Math.sqrt(dx * dx + dy * dy);
        mouseSpeedRef.current = Math.min(1, d / 80);
    }, []);

    const { sendInput, sendSplit, sendEject } = usePartySocket({
        roomId,
        walletAddress,
        username,
        skinId,
        token,
        onTick: useCallback((msg: TickMessage) => {
            snapshotRef.current = {
                players: msg.players,
                food: msg.food,
                viruses: msg.viruses,
                tick: msg.tick,
            };
        }, []),
        onDead,
        onLeaderboard,
    });

    // ── Input loop: send mouse input 30x/s alongside keydown events ──────────
    useEffect(() => {
        if (paused) return;

        const inputInterval = setInterval(() => {
            sendInput(mouseAngleRef.current, mouseSpeedRef.current);
        }, 33);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") { e.preventDefault(); sendSplit(); }
            if (e.code === "KeyW") { e.preventDefault(); sendEject(); }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            clearInterval(inputInterval);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [paused, sendInput, sendSplit, sendEject, handleMouseMove]);

    // ── Resize canvas to fill window ──────────────────────────────────────────
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // ── Render loop ───────────────────────────────────────────────────────────
    useGameLoop({
        running: !paused,
        onFrame: (_dt) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const snap = snapshotRef.current;
            const t = Date.now() - startTimeRef.current;

            // Find MY cells
            const myPlayer = snap?.players.find((p) => p.walletAddress === walletAddress);
            const myCells = myPlayer?.cells ?? [];
            const myCenter = getCenterOfMass(myCells, canvas.width / 2, canvas.height / 2);
            const myMass = myCells.reduce((s, c) => s + c.mass, 0);

            // ── Camera zoom based on mass ──────────────────────────────────────
            // Base: viewport shows ~1000 world units across at mass=10
            // As mass grows, zoom out so player still sees a decent viewport
            const baseViewport = 1000;
            const viewportW = baseViewport * Math.max(1, Math.sqrt(myMass / 10));
            const scale = canvas.width / viewportW;

            // Camera offset: centre on player mass-center
            const camX = myCenter.x - canvas.width / 2 / scale;
            const camY = myCenter.y - canvas.height / 2 / scale;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ── Background ─────────────────────────────────────────────────────
            ctx.fillStyle = "#0a0a0f";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.scale(scale, scale);
            ctx.translate(-camX, -camY);

            // ── Grid ───────────────────────────────────────────────────────────
            drawGrid(ctx, camX, camY, canvas.width / scale, canvas.height / scale);

            // ── World border ───────────────────────────────────────────────────
            ctx.strokeStyle = "#3b1d8a";
            ctx.lineWidth = 6;
            ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

            if (snap) {
                // ── Food pellets ─────────────────────────────────────────────────
                for (const food of snap.food) {
                    drawFood(ctx, food);
                }

                // ── Viruses ──────────────────────────────────────────────────────
                for (const virus of snap.viruses) {
                    drawVirus(ctx, virus, t);
                }

                // ── Player cells ─────────────────────────────────────────────────
                // Draw others first, then self on top
                const others = snap.players.filter((p) => p.walletAddress !== walletAddress);
                const self = snap.players.filter((p) => p.walletAddress === walletAddress);

                for (const player of [...others, ...self]) {
                    for (const cell of player.cells) {
                        drawCell(ctx, cell, player.skinId, player.username, player.walletAddress, t,
                            player.walletAddress === walletAddress);
                    }
                }
            }

            ctx.restore();
        },
    });

    return (
        <canvas
            ref={canvasRef}
            style={{ display: "block", cursor: "none", background: "#0a0a0f" }}
        />
    );
}

// ─── Rendering helpers ────────────────────────────────────────────────────────

function getCenterOfMass(
    cells: Cell[],
    fallbackX: number,
    fallbackY: number
): { x: number; y: number } {
    if (cells.length === 0) return { x: fallbackX, y: fallbackY };
    let wx = 0, wy = 0, totalMass = 0;
    for (const c of cells) {
        wx += c.x * c.mass;
        wy += c.y * c.mass;
        totalMass += c.mass;
    }
    return { x: wx / totalMass, y: wy / totalMass };
}

function drawGrid(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number
): void {
    const gridSize = 50;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;

    const startX = Math.floor(camX / gridSize) * gridSize;
    const startY = Math.floor(camY / gridSize) * gridSize;

    ctx.beginPath();
    for (let x = startX; x < camX + viewW; x += gridSize) {
        ctx.moveTo(x, camY);
        ctx.lineTo(x, camY + viewH);
    }
    for (let y = startY; y < camY + viewH; y += gridSize) {
        ctx.moveTo(camX, y);
        ctx.lineTo(camX + viewW, y);
    }
    ctx.stroke();
}

function drawFood(ctx: CanvasRenderingContext2D, food: FoodPellet): void {
    ctx.beginPath();
    ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.fill();
}

function drawVirus(ctx: CanvasRenderingContext2D, virus: Virus, t: number): void {
    const r = virus.radius;
    const spikes = 12;

    ctx.save();
    ctx.translate(virus.x, virus.y);
    ctx.rotate(t / 4000); // slow rotation for visual interest

    // Outer spikes
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
        const angle = (i / spikes) * Math.PI * 2;
        const outer = r * 1.35;
        const inner = r * 0.85;
        if (i === 0) {
            ctx.moveTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        } else {
            const midAngle = angle - Math.PI / spikes;
            ctx.lineTo(Math.cos(midAngle) * inner, Math.sin(midAngle) * inner);
            ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        }
    }
    ctx.closePath();
    ctx.fillStyle = "#166534";
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = "#15803d";
    ctx.fill();

    ctx.restore();
}

function drawCell(
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    skinId: string,
    username: string,
    walletAddress: string,
    t: number,
    isSelf: boolean
): void {
    ctx.save();
    ctx.translate(cell.x, cell.y);

    // Render the skin
    renderSkin(ctx, skinId, cell.radius, walletAddress, t);

    // Self-glow ring
    if (isSelf) {
        ctx.beginPath();
        ctx.arc(0, 0, cell.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Username label (only if cell is big enough to show text)
    if (cell.radius > 20) {
        const fontSize = Math.max(12, Math.min(24, cell.radius * 0.35));
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Shadow for readability
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillText(username, 1, 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(username, 0, 0);
    }

    ctx.restore();
}
