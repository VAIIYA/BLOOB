// ─── Game World Constants ─────────────────────────────────────────────────────
// These are imported by both the PartyKit server and the Next.js client so
// values are always in sync.

/** Total width and height of the game world in world-units */
export const WORLD_SIZE = 5000;

/** Maximum simultaneous players per room */
export const MAX_PLAYERS = 50;

/** Target number of food pellets present at any time */
export const FOOD_COUNT = 500;

/** Fixed number of viruses on the map */
export const VIRUS_COUNT = 20;

/** Radius of a virus cell */
export const VIRUS_RADIUS = 30;

/** Minimum mass a cell must have to be able to eat a virus and split */
export const VIRUS_SPLIT_MASS = 150;

/** Server tick rate in milliseconds (30fps) */
export const TICK_MS = 33;

/** 
 * Speed formula: base max speed divided by sqrt(mass).
 * maxSpeed = SPEED_BASE / Math.sqrt(mass)
 * Clamped to a minimum of SPEED_MIN.
 */
export const SPEED_BASE = 120;
export const SPEED_MIN = 20;

/** 
 * A cell must be this much larger (factor) than its target to eat it.
 * 1.1 = 10% larger radius required.
 */
export const EAT_RADIUS_FACTOR = 1.1;

/** Starting mass for a new player cell */
export const INITIAL_MASS = 10;

/** 
 * Converts mass to visual radius.
 * radius = Math.sqrt(mass) * RADIUS_FACTOR
 */
export const RADIUS_FACTOR = 4;

/** Milliseconds before split cells can merge back together */
export const MERGE_DELAY_MS = 30_000;

/** 
 * Number of pieces a cell splits into when it hits a virus
 * (random between these two values).
 */
export const VIRUS_SPLIT_MIN = 8;
export const VIRUS_SPLIT_MAX = 16;

/** Mass of each ejected pellet */
export const EJECT_MASS = 12;

/** How much mass is lost from cell when ejecting */
export const EJECT_LOSS = 16; // slightly more than ejected to penalise

/** Coins awarded per N mass eaten in a session */
export const COINS_PER_MASS = 100; // 1 coin per 100 mass eaten

/** 
 * Leaderboard broadcast interval — we send leaderboard every N ticks
 * to avoid flooding the wire. 30 ticks ≈ 1 second at 30fps.
 */
export const LEADERBOARD_INTERVAL_TICKS = 30;
