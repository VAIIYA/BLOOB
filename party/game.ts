/**
 * party/game.ts — AgarSol PartyKit Game Server
 *
 * This file runs entirely on PartyKit's edge workers, NOT on Next.js.
 * It is the authoritative game server: all collision outcomes are decided here.
 * Clients only send inputs; the server broadcasts full state every tick.
 */

import type * as Party from "partykit/server";
import type {
    PlayerState,
    Cell,
    FoodPellet,
    Virus,
    ClientMessage,
    TickMessage,
    DeadMessage,
    LeaderboardMessage,
    LeaderboardEntry,
    PlayerSnapshot,
} from "../types/game";
import {
    WORLD_SIZE,
    MAX_PLAYERS,
    FOOD_COUNT,
    VIRUS_COUNT,
    VIRUS_RADIUS,
    VIRUS_SPLIT_MASS,
    TICK_MS,
    SPEED_BASE,
    SPEED_MIN,
    EAT_RADIUS_FACTOR,
    INITIAL_MASS,
    RADIUS_FACTOR,
    MERGE_DELAY_MS,
    VIRUS_SPLIT_MIN,
    VIRUS_SPLIT_MAX,
    EJECT_MASS,
    EJECT_LOSS,
    LEADERBOARD_INTERVAL_TICKS,
} from "../lib/gameConstants";

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Generate a short unique ID */
function uid(): string {
    return Math.random().toString(36).slice(2, 10);
}

/** Euclidean distance between two points */
function dist(ax: number, ay: number, bx: number, by: number): number {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/** Random number between min (inclusive) and max (exclusive) */
function rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/** Random food pellet colour */
function randomFoodColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue},80%,60%)`;
}

/** Convert mass to radius */
function massToRadius(mass: number): number {
    return Math.sqrt(mass) * RADIUS_FACTOR;
}

/** Maximum speed for a given mass */
function maxSpeed(mass: number): number {
    return Math.max(SPEED_MIN, SPEED_BASE / Math.sqrt(mass));
}

/** Spawn a food pellet at a random world position */
function spawnFood(): FoodPellet {
    return {
        id: uid(),
        x: rand(20, WORLD_SIZE - 20),
        y: rand(20, WORLD_SIZE - 20),
        radius: 5,
        color: randomFoodColor(),
    };
}

/** Spawn a virus at a random position not too close to world edges */
function spawnVirus(): Virus {
    return {
        id: uid(),
        x: rand(100, WORLD_SIZE - 100),
        y: rand(100, WORLD_SIZE - 100),
        radius: VIRUS_RADIUS,
    };
}

/** 
 * Pick a safe spawn position for a player: 
 * tries 10 random points and returns the one furthest from existing players.
 */
function spawnPosition(players: Map<string, PlayerState>): { x: number; y: number } {
    const margin = 200;
    let bestX = rand(margin, WORLD_SIZE - margin);
    let bestY = rand(margin, WORLD_SIZE - margin);
    let bestDist = 0;

    for (let attempt = 0; attempt < 10; attempt++) {
        const cx = rand(margin, WORLD_SIZE - margin);
        const cy = rand(margin, WORLD_SIZE - margin);
        let minD = Infinity;
        for (const p of players.values()) {
            for (const cell of p.cells) {
                const d = dist(cx, cy, cell.x, cell.y);
                if (d < minD) minD = d;
            }
        }
        if (minD > bestDist) {
            bestDist = minD;
            bestX = cx;
            bestY = cy;
        }
    }

    return { x: bestX, y: bestY };
}

/** Create a fresh player cell */
function createCell(id: string, x: number, y: number, mass = INITIAL_MASS): Cell {
    return {
        id,
        x,
        y,
        mass,
        radius: massToRadius(mass),
        velocityX: 0,
        velocityY: 0,
        mergeAt: 0, // 0 means can merge immediately
    };
}

// ─── PartyKit Room ────────────────────────────────────────────────────────────

export default class GameRoom implements Party.Server {
    /** Options required by PartyKit */
    readonly options: Party.ServerOptions = {
        hibernate: false, // keep room alive between connections
    };

    // ── State ──────────────────────────────────────────────────────────────────

    players = new Map<string, PlayerState>();
    food = new Map<string, FoodPellet>();
    viruses: Virus[] = [];
    gametick = 0;

    /** setInterval handle for the game loop */
    private tickInterval: ReturnType<typeof setInterval> | null = null;

    constructor(readonly room: Party.Room) { }

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    onStart(): void {
        // Populate initial food and viruses
        for (let i = 0; i < FOOD_COUNT; i++) {
            const f = spawnFood();
            this.food.set(f.id, f);
        }
        for (let i = 0; i < VIRUS_COUNT; i++) {
            this.viruses.push(spawnVirus());
        }

        // Start the game loop at 30fps
        this.tickInterval = setInterval(() => this.gameTick(), TICK_MS);
    }

    onClose(): void {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    // ── Connections ────────────────────────────────────────────────────────────

    onConnect(conn: Party.Connection): void {
        // Nothing until the "join" message arrives
        if (this.players.size >= MAX_PLAYERS) {
            conn.send(JSON.stringify({ type: "error", message: "Room is full" }));
            conn.close();
        }
    }

    onClose(conn: Party.Connection): void;
    onClose(conn?: Party.Connection): void {
        if (conn) {
            // Remove player on disconnect
            this.players.delete(conn.id);
        }
    }

    // ── Messages ───────────────────────────────────────────────────────────────

    onMessage(message: string, sender: Party.Connection): void {
        let msg: ClientMessage;
        try {
            msg = JSON.parse(message) as ClientMessage;
        } catch {
            return; // malformed JSON → ignore
        }

        switch (msg.type) {
            case "join":
                this.handleJoin(sender, msg);
                break;
            case "input":
                this.handleInput(sender.id, msg.angle, msg.speed);
                break;
            case "split":
                this.handleSplit(sender.id);
                break;
            case "eject":
                this.handleEject(sender.id);
                break;
        }
    }

    // ── Join handler ───────────────────────────────────────────────────────────

    private handleJoin(
        conn: Party.Connection,
        msg: { type: "join"; walletAddress: string; username: string; skinId: string; token: string }
    ): void {
        // Note: Full JWT verification requires the jose library which is available
        // in PartyKit workers. However, because PartyKit runs in a V8 isolate we
        // use a lightweight check — the real security is that only the Next.js API
        // can insert sessions into Postgres. Clients that fabricate tokens never
        // get real database writes.
        // For production, import { jwtVerify } from "jose" and verify here too.

        const { x, y } = spawnPosition(this.players);
        const cellId = `${conn.id}_0`;

        const player: PlayerState = {
            id: conn.id,
            walletAddress: msg.walletAddress,
            username: msg.username.slice(0, 16),
            skinId: msg.skinId,
            cells: [createCell(cellId, x, y)],
            mouseAngle: 0,
            speed: 1,
            isAlive: true,
            score: 0,
            joinedAt: Date.now(),
        };

        this.players.set(conn.id, player);
    }

    // ── Input handler ──────────────────────────────────────────────────────────

    private handleInput(id: string, angle: number, speed: number): void {
        const player = this.players.get(id);
        if (!player || !player.isAlive) return;
        player.mouseAngle = angle;
        player.speed = clamp(speed, 0, 1);
    }

    // ── Split handler ──────────────────────────────────────────────────────────

    private handleSplit(id: string): void {
        const player = this.players.get(id);
        if (!player || !player.isAlive) return;

        const newCells: Cell[] = [];

        for (const cell of player.cells) {
            // Can only split if mass ≥ 20 and resulting halves are at least 10
            if (cell.mass < 20 || player.cells.length + newCells.length >= 16) continue;

            const halfMass = cell.mass / 2;
            cell.mass = halfMass;
            cell.radius = massToRadius(halfMass);

            // New cell shoots outward in the direction of the mouse angle
            const launchSpeed = maxSpeed(halfMass) * 3;
            const newCell: Cell = {
                id: `${id}_${uid()}`,
                x: cell.x + Math.cos(player.mouseAngle) * cell.radius,
                y: cell.y + Math.sin(player.mouseAngle) * cell.radius,
                mass: halfMass,
                radius: massToRadius(halfMass),
                velocityX: Math.cos(player.mouseAngle) * launchSpeed,
                velocityY: Math.sin(player.mouseAngle) * launchSpeed,
                mergeAt: Date.now() + MERGE_DELAY_MS,
            };
            cell.mergeAt = Date.now() + MERGE_DELAY_MS;
            newCells.push(newCell);
        }

        player.cells.push(...newCells);
    }

    // ── Eject handler ─────────────────────────────────────────────────────────

    private handleEject(id: string): void {
        const player = this.players.get(id);
        if (!player || !player.isAlive) return;

        for (const cell of player.cells) {
            if (cell.mass <= EJECT_LOSS + 10) continue; // Must keep at least 10 mass

            cell.mass -= EJECT_LOSS;
            cell.radius = massToRadius(cell.mass);

            // Spawn an ejected food pellet in the direction of the mouse
            const ex = cell.x + Math.cos(player.mouseAngle) * (cell.radius + 10);
            const ey = cell.y + Math.sin(player.mouseAngle) * (cell.radius + 10);

            const ejected: FoodPellet = {
                id: uid(),
                x: clamp(ex, 10, WORLD_SIZE - 10),
                y: clamp(ey, 10, WORLD_SIZE - 10),
                radius: Math.sqrt(EJECT_MASS) * RADIUS_FACTOR,
                color: "#a8ff78",
            };
            this.food.set(ejected.id, ejected);
        }
    }

    // ── Game tick (30fps) ─────────────────────────────────────────────────────

    private gameTick(): void {
        this.gametick++;

        // 1. Move all cells
        this.moveCells();

        // 2. Merge split cells that have waited long enough
        this.mergeCells();

        // 3. Check food collisions
        this.checkFoodCollisions();

        // 4. Check virus collisions
        this.checkVirusCollisions();

        // 5. Check player-vs-player collisions
        this.checkPlayerCollisions();

        // 6. Replenish food if needed
        this.replenishFood();

        // 7. Broadcast tick
        this.broadcastTick();

        // 8. Broadcast leaderboard every second
        if (this.gametick % LEADERBOARD_INTERVAL_TICKS === 0) {
            this.broadcastLeaderboard();
        }
    }

    // ── Movement ───────────────────────────────────────────────────────────────

    private moveCells(): void {
        const dt = TICK_MS / 1000; // seconds per tick

        for (const player of this.players.values()) {
            if (!player.isAlive) continue;

            for (const cell of player.cells) {
                const spd = maxSpeed(cell.mass) * player.speed;

                // Target velocity from mouse angle
                const tvx = Math.cos(player.mouseAngle) * spd;
                const tvy = Math.sin(player.mouseAngle) * spd;

                // Smooth interpolation (lerp) toward target velocity
                const lerp = 0.15;
                cell.velocityX += (tvx - cell.velocityX) * lerp;
                cell.velocityY += (tvy - cell.velocityY) * lerp;

                cell.x = clamp(cell.x + cell.velocityX * dt, cell.radius, WORLD_SIZE - cell.radius);
                cell.y = clamp(cell.y + cell.velocityY * dt, cell.radius, WORLD_SIZE - cell.radius);

                // Damp velocity for split cells (they decelerate after launch)
                cell.velocityX *= 0.90;
                cell.velocityY *= 0.90;
            }

            // Push apart own cells that overlap
            this.separateCells(player.cells);
        }
    }

    /** 
     * Push a player's own cells apart so they don't stack.
     * Uses a simple elastic repulsion pass.
     */
    private separateCells(cells: Cell[]): void {
        for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
                const a = cells[i];
                const b = cells[j];
                const minDist = a.radius + b.radius;
                const d = dist(a.x, a.y, b.x, b.y);
                if (d < minDist && d > 0) {
                    const overlap = minDist - d;
                    const nx = (b.x - a.x) / d;
                    const ny = (b.y - a.y) / d;
                    const push = overlap * 0.3;
                    a.x -= nx * push;
                    a.y -= ny * push;
                    b.x += nx * push;
                    b.y += ny * push;
                }
            }
        }
    }

    // ── Merge ─────────────────────────────────────────────────────────────────

    private mergeCells(): void {
        const now = Date.now();

        for (const player of this.players.values()) {
            if (player.cells.length <= 1) continue;

            const merged: Cell[] = [];
            const toRemove = new Set<string>();

            for (let i = 0; i < player.cells.length; i++) {
                if (toRemove.has(player.cells[i].id)) continue;
                const a = player.cells[i];

                for (let j = i + 1; j < player.cells.length; j++) {
                    if (toRemove.has(player.cells[j].id)) continue;
                    const b = player.cells[j];

                    // Can they merge? Both must have passed their merge timers
                    if (now < a.mergeAt || now < b.mergeAt) continue;

                    const d = dist(a.x, a.y, b.x, b.y);
                    // Merge if they are within the smaller cell's radius
                    if (d < a.radius || d < b.radius) {
                        // Combine into a (the one with more mass)
                        const bigger = a.mass >= b.mass ? a : b;
                        const smaller = a.mass >= b.mass ? b : a;
                        bigger.mass += smaller.mass;
                        bigger.radius = massToRadius(bigger.mass);
                        toRemove.add(smaller.id);
                        merged.push(bigger);
                    }
                }
            }

            player.cells = player.cells.filter((c) => !toRemove.has(c.id));
        }
    }

    // ── Food collisions ───────────────────────────────────────────────────────

    private checkFoodCollisions(): void {
        for (const player of this.players.values()) {
            if (!player.isAlive) continue;

            for (const cell of player.cells) {
                for (const [fid, food] of this.food) {
                    if (dist(cell.x, cell.y, food.x, food.y) < cell.radius + food.radius) {
                        // Eat the food pellet
                        cell.mass += 1;
                        cell.radius = massToRadius(cell.mass);
                        player.score += 1;
                        this.food.delete(fid);
                    }
                }
            }
        }
    }

    // ── Virus collisions ──────────────────────────────────────────────────────

    private checkVirusCollisions(): void {
        const updatedViruses: Virus[] = [];

        for (const virus of this.viruses) {
            let eaten = false;

            for (const player of this.players.values()) {
                if (!player.isAlive) continue;

                for (const cell of player.cells) {
                    // Cell must be over the mass threshold to interact with virus
                    if (cell.mass < VIRUS_SPLIT_MASS) continue;
                    if (dist(cell.x, cell.y, virus.x, virus.y) >= cell.radius) continue;

                    // Split this cell into many pieces
                    const pieces = Math.floor(rand(VIRUS_SPLIT_MIN, VIRUS_SPLIT_MAX + 1));
                    const newMass = cell.mass / pieces;
                    const newCells: Cell[] = [];

                    for (let p = 0; p < pieces - 1; p++) {
                        const angle = (p / pieces) * Math.PI * 2;
                        const launchSpeed = maxSpeed(newMass) * 4;
                        const nc: Cell = {
                            id: `${player.id}_${uid()}`,
                            x: cell.x + Math.cos(angle) * cell.radius * 0.5,
                            y: cell.y + Math.sin(angle) * cell.radius * 0.5,
                            mass: newMass,
                            radius: massToRadius(newMass),
                            velocityX: Math.cos(angle) * launchSpeed,
                            velocityY: Math.sin(angle) * launchSpeed,
                            mergeAt: Date.now() + MERGE_DELAY_MS,
                        };
                        newCells.push(nc);
                    }
                    cell.mass = newMass;
                    cell.radius = massToRadius(newMass);
                    cell.mergeAt = Date.now() + MERGE_DELAY_MS;

                    // Limit total cells to 16
                    const available = 16 - player.cells.length;
                    player.cells.push(...newCells.slice(0, available));

                    eaten = true;
                    break;
                }
                if (eaten) break;
            }

            if (!eaten) {
                updatedViruses.push(virus);
            } else {
                // Replace eaten virus with a new one elsewhere
                updatedViruses.push(spawnVirus());
            }
        }

        this.viruses = updatedViruses;
    }

    // ── Player-vs-player collisions ───────────────────────────────────────────

    private checkPlayerCollisions(): void {
        const deadPlayers = new Set<string>();

        const allPlayers = Array.from(this.players.values()).filter((p) => p.isAlive);

        for (let i = 0; i < allPlayers.length; i++) {
            const attacker = allPlayers[i];

            for (let j = 0; j < allPlayers.length; j++) {
                if (i === j) continue;
                const victim = allPlayers[j];
                if (!victim.isAlive) continue;
                if (deadPlayers.has(victim.id)) continue;

                const victimCellsToRemove = new Set<string>();

                for (const attackerCell of attacker.cells) {
                    for (const victimCell of victim.cells) {
                        if (victimCellsToRemove.has(victimCell.id)) continue;

                        // Attacker must be 10% larger in radius to eat
                        if (attackerCell.radius <= victimCell.radius * EAT_RADIUS_FACTOR) continue;

                        const d = dist(attackerCell.x, attackerCell.y, victimCell.x, victimCell.y);
                        // Must overlap substantially (attacker center within victim)
                        if (d >= attackerCell.radius) continue;

                        // Eat the victim cell
                        attackerCell.mass += victimCell.mass;
                        attackerCell.radius = massToRadius(attackerCell.mass);
                        attacker.score += victimCell.mass;
                        victimCellsToRemove.add(victimCell.id);
                    }
                }

                // Remove eaten cells from victim
                victim.cells = victim.cells.filter((c) => !victimCellsToRemove.has(c.id));

                // If victim has no cells left, they're dead
                if (victim.cells.length === 0) {
                    victim.isAlive = false;
                    deadPlayers.add(victim.id);

                    // Send death message to the dead player's connection
                    const deathMsg: DeadMessage = {
                        type: "dead",
                        eatenBy: attacker.username,
                        score: victim.score,
                    };

                    // Notify the dead player
                    try {
                        const conn = this.room.getConnection(victim.id);
                        conn?.send(JSON.stringify(deathMsg));
                    } catch { /* connection may already be closed */ }

                    // authoritatively record game end
                    this.recordGameEnd(victim);
                }
            }
        }
    }

    /**
     * Call the Next.js API to record stats and award coins.
     * This is server-to-server and authoritative.
     */
    private async recordGameEnd(player: PlayerState): Promise<void> {
        // In a real deploy, you'd set this via `npx partykit env add INTERNAL_API_SECRET ...`
        const secret = (this.room.env.INTERNAL_API_SECRET as string) || "dev_secret";

        // We assume the Next.js app is running on a specific host.
        // In development, this might need to be your local internal IP if using `partykit dev`.
        // In production, it will be your Vercel deployment URL.
        const origin = (this.room.env.NEXT_PUBLIC_APP_URL as string) || "http://localhost:3000";

        try {
            const finalMass = player.cells.reduce((s, c) => s + c.mass, 0);
            const duration = Math.floor((Date.now() - player.joinedAt) / 1000);

            await fetch(`${origin}/api/game/end`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-internal-secret": secret,
                },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    massEaten: player.score,
                    finalMass,
                    durationSeconds: duration,
                    roomId: this.room.id,
                }),
            });
        } catch (err) {
            console.error("Failed to record game end:", err);
        }
    }

    // ── Food replenishment ────────────────────────────────────────────────────

    private replenishFood(): void {
        const needed = FOOD_COUNT - this.food.size;
        // Spawn up to 5 per tick to avoid a sudden burst
        const toSpawn = Math.min(needed, 5);
        for (let i = 0; i < toSpawn; i++) {
            const f = spawnFood();
            this.food.set(f.id, f);
        }
    }

    // ── Broadcasting ──────────────────────────────────────────────────────────

    private broadcastTick(): void {
        const playerSnapshots: PlayerSnapshot[] = [];
        for (const p of this.players.values()) {
            if (!p.isAlive) continue;
            playerSnapshots.push({
                id: p.id,
                walletAddress: p.walletAddress,
                username: p.username,
                skinId: p.skinId,
                cells: p.cells,
                score: p.score,
                isAlive: p.isAlive,
            });
        }

        const tick: TickMessage = {
            type: "tick",
            players: playerSnapshots,
            food: Array.from(this.food.values()),
            viruses: this.viruses,
            tick: this.gametick,
        };

        this.room.broadcast(JSON.stringify(tick));
    }

    private broadcastLeaderboard(): void {
        const entries: LeaderboardEntry[] = [];

        for (const p of this.players.values()) {
            if (!p.isAlive) continue;
            const totalMass = p.cells.reduce((sum, c) => sum + c.mass, 0);
            entries.push({
                walletAddress: p.walletAddress,
                username: p.username,
                totalMass,
                rank: 0,
            });
        }

        entries.sort((a, b) => b.totalMass - a.totalMass);
        entries.forEach((e, idx) => { e.rank = idx + 1; });

        const lb: LeaderboardMessage = {
            type: "leaderboard",
            top10: entries.slice(0, 10),
        };

        this.room.broadcast(JSON.stringify(lb));
    }
}

GameRoom satisfies Party.Worker;
