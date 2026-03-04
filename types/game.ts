// ─── Shared Game Types ───────────────────────────────────────────────────────
// Used by both the PartyKit server (party/game.ts) and the Next.js client.

/** A single food pellet in the world */
export interface FoodPellet {
    id: string;
    x: number;
    y: number;
    /** Radius of the pellet (visual size) */
    radius: number;
    /** RGB color string, e.g. "#ff4444" */
    color: string;
}

/** A virus – green spiky circle that splits large cells */
export interface Virus {
    id: string;
    x: number;
    y: number;
    radius: number; // fixed at ~30
}

/** A single cell belonging to a player (players can have multiple after split) */
export interface Cell {
    id: string; // unique per cell, e.g. playerId + "_0"
    x: number;
    y: number;
    mass: number;
    /** radius = Math.sqrt(mass) * 4 */
    radius: number;
    velocityX: number;
    velocityY: number;
    /** Unix timestamp (ms) after which this cell can merge back */
    mergeAt: number;
}

/** Full player state – tracked server-side, sent to clients */
export interface PlayerState {
    id: string; // PartyKit connection ID
    walletAddress: string;
    username: string;
    skinId: string;
    cells: Cell[];
    /** Current input angle in radians from player mouse */
    mouseAngle: number;
    /** 0–1 normalised speed intent from client */
    speed: number;
    isAlive: boolean;
    score: number; // total mass eaten this session
    joinedAt: number; // unix ms
}

/** Serialised player snapshot sent inside tick messages */
export interface PlayerSnapshot {
    id: string;
    walletAddress: string;
    username: string;
    skinId: string;
    cells: Cell[];
    score: number;
    isAlive: boolean;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
    walletAddress: string;
    username: string;
    totalMass: number; // sum of all cells' mass
    rank: number;
}

// ─── Message shapes: client → server ─────────────────────────────────────────

export interface JoinMessage {
    type: "join";
    walletAddress: string;
    username: string;
    skinId: string;
    token: string; // JWT
}

export interface InputMessage {
    type: "input";
    angle: number; // radians
    speed: number; // 0–1
}

export interface SplitMessage {
    type: "split";
}

export interface EjectMessage {
    type: "eject";
}

export type ClientMessage = JoinMessage | InputMessage | SplitMessage | EjectMessage;

// ─── Message shapes: server → client ─────────────────────────────────────────

export interface TickMessage {
    type: "tick";
    players: PlayerSnapshot[];
    food: FoodPellet[];
    viruses: Virus[];
    tick: number;
}

export interface DeadMessage {
    type: "dead";
    eatenBy: string; // username of the killer
    score: number;
}

export interface LeaderboardMessage {
    type: "leaderboard";
    top10: LeaderboardEntry[];
}

export type ServerMessage = TickMessage | DeadMessage | LeaderboardMessage;

// ─── REST API shapes ──────────────────────────────────────────────────────────

export interface UserProfile {
    wallet_address: string;
    username: string;
    skin_id: string;
    coins: number;
    total_games: number;
    total_mass_eaten: number;
    highest_mass: number;
    created_at: string;
    username_changed_at: string | null;
    owned_skins: string[]; // array of skin IDs
}

export interface SkinDefinition {
    id: string;
    name: string;
    description: string;
    /** "free" | "milestone" | "purchasable" */
    unlockType: "free" | "milestone" | "purchasable";
    /** For milestone skins: total_mass_eaten required */
    milestoneRequired?: number;
    /** For purchasable skins: coin cost */
    coinCost?: number;
}
