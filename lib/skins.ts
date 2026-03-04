import type { SkinDefinition } from "@/types/game";

// ─── Skin definitions ─────────────────────────────────────────────────────────

export const SKINS: SkinDefinition[] = [
    // Free
    { id: "classic", name: "Classic", description: "Your signature color based on your wallet address.", unlockType: "free" },
    { id: "ghost", name: "Ghost", description: "Semi-transparent with a soft ethereal glow.", unlockType: "free" },
    { id: "void", name: "Void", description: "Pure black with a dark purple border.", unlockType: "free" },
    // Milestone
    { id: "gold", name: "Gold", description: "Shiny gold fill. Earn 5,000 total mass.", unlockType: "milestone", milestoneRequired: 5_000 },
    { id: "plasma", name: "Plasma", description: "Animated blue/purple gradient. Earn 15,000.", unlockType: "milestone", milestoneRequired: 15_000 },
    { id: "lava", name: "Lava", description: "Animated red/orange gradient. Earn 30,000.", unlockType: "milestone", milestoneRequired: 30_000 },
    // Purchasable
    { id: "neon", name: "Neon", description: "Neon green outline with electric glow.", unlockType: "purchasable", coinCost: 500 },
    { id: "galaxy", name: "Galaxy", description: "Animated starfield inside your cell.", unlockType: "purchasable", coinCost: 1_200 },
    { id: "chrome", name: "Chrome", description: "Metallic silver reflective surface.", unlockType: "purchasable", coinCost: 800 },
    { id: "toxic", name: "Toxic", description: "Animated green drip effect.", unlockType: "purchasable", coinCost: 600 },
    { id: "inferno", name: "Inferno", description: "Animated fire blazing inside the cell.", unlockType: "purchasable", coinCost: 2_000 },
    { id: "diamond", name: "Diamond", description: "Sparkling diamond texture with light rays.", unlockType: "purchasable", coinCost: 3_500 },
];

export const SKIN_MAP = new Map(SKINS.map((s) => [s.id, s]));

// ─── Colour from wallet address ───────────────────────────────────────────────

/** Deterministically pick a vibrant hue from a wallet address string */
export function walletToHue(walletAddress: string): number {
    let hash = 0;
    for (let i = 0; i < walletAddress.length; i++) {
        hash = (hash << 5) - hash + walletAddress.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % 360;
}

// ─── Canvas skin renderers ────────────────────────────────────────────────────
// Each function draws a skin onto a CanvasRenderingContext2D.
// ctx must already be translated so (0, 0) = cell center, radius = r.
// t = elapsed time in ms (for animations).

export type SkinRenderFn = (
    ctx: CanvasRenderingContext2D,
    r: number,
    walletAddress: string,
    t: number
) => void;

/** Draw a simple filled circle at the origin */
function drawBaseCircle(ctx: CanvasRenderingContext2D, r: number, fillStyle: string | CanvasGradient): void {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

// --- classic ---
const renderClassic: SkinRenderFn = (ctx, r, walletAddress) => {
    const hue = walletToHue(walletAddress);
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
    grad.addColorStop(0, `hsl(${hue}, 80%, 75%)`);
    grad.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
    drawBaseCircle(ctx, r, grad);
    // Border
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsl(${hue}, 60%, 30%)`;
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
};

// --- ghost ---
const renderGhost: SkinRenderFn = (ctx, r) => {
    // Outer glow
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.2);
    glow.addColorStop(0, "rgba(220,220,255,0)");
    glow.addColorStop(1, "rgba(180,180,255,0.25)");
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    // Cell body
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    grad.addColorStop(0, "rgba(255,255,255,0.8)");
    grad.addColorStop(1, "rgba(200,200,220,0.35)");
    drawBaseCircle(ctx, r, grad);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = Math.max(2, r * 0.03);
    ctx.stroke();
};

// --- void ---
const renderVoid: SkinRenderFn = (ctx, r) => {
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
    grad.addColorStop(0, "#1a0a2e");
    grad.addColorStop(1, "#000000");
    drawBaseCircle(ctx, r, grad);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#6b21a8";
    ctx.lineWidth = Math.max(3, r * 0.05);
    ctx.stroke();
};

// --- gold ---
const renderGold: SkinRenderFn = (ctx, r) => {
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
    grad.addColorStop(0, "#fde68a");
    grad.addColorStop(0.5, "#f59e0b");
    grad.addColorStop(1, "#92400e");
    drawBaseCircle(ctx, r, grad);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
    // Shine fleck
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
};

// --- plasma ---
const renderPlasma: SkinRenderFn = (ctx, r, _wa, t) => {
    const offset = (t / 2000) % 1; // 0→1 in 2 seconds
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, `hsl(${260 + offset * 60}, 90%, 60%)`);
    grad.addColorStop(0.5, `hsl(${200 + offset * 80}, 80%, 55%)`);
    grad.addColorStop(1, `hsl(${280 + offset * 40}, 85%, 50%)`);
    drawBaseCircle(ctx, r, grad);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
};

// --- lava ---
const renderLava: SkinRenderFn = (ctx, r, _wa, t) => {
    const offset = (t / 1800) % 1;
    const grad = ctx.createLinearGradient(-r, r, r, -r);
    grad.addColorStop(0, `hsl(${10 + offset * 30}, 90%, 45%)`);
    grad.addColorStop(0.5, `hsl(${30 + offset * 20}, 85%, 55%)`);
    grad.addColorStop(1, `hsl(${50 + offset * 10}, 90%, 60%)`);
    drawBaseCircle(ctx, r, grad);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
};

// --- neon ---
const renderNeon: SkinRenderFn = (ctx, r, _wa, t) => {
    const pulse = 0.7 + 0.3 * Math.sin(t / 400);
    // Outer glow
    const glow = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.3);
    glow.addColorStop(0, `rgba(34,197,94,${0.3 * pulse})`);
    glow.addColorStop(1, "rgba(34,197,94,0)");
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    // Body
    drawBaseCircle(ctx, r, "rgba(0,0,0,0.85)");
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(74,222,128,${pulse})`;
    ctx.lineWidth = Math.max(3, r * 0.06);
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#4ade80";
    ctx.stroke();
    ctx.shadowBlur = 0;
};

// --- galaxy (starfield) ---
const renderGalaxy: SkinRenderFn = (ctx, r, walletAddress, t) => {
    // Dark space background
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, "#0f0c29");
    grad.addColorStop(1, "#090614");
    drawBaseCircle(ctx, r, grad);

    // Stars – deterministic positions based on wallet, animated twinkle
    const starCount = Math.floor(r * 1.2);
    let seed = 0;
    for (let i = 0; i < walletAddress.length; i++) seed += walletAddress.charCodeAt(i);

    // Clip to circle before drawing stars
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    for (let i = 0; i < starCount; i++) {
        // LCG pseudo-random for deterministic positions
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        const sx = ((seed & 0xffff) / 0xffff) * 2 * r - r;
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        const sy = ((seed & 0xffff) / 0xffff) * 2 * r - r;
        if (sx * sx + sy * sy > r * r) continue;
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        const phase = (seed & 0xffff) / 0xffff;
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t / 800 + phase * Math.PI * 2));
        const sr = 0.5 + ((seed >> 16) & 0xf) / 32;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${twinkle.toFixed(2)})`;
        ctx.fill();
    }
    ctx.restore();

    // Border
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
};

// --- chrome ---
const renderChrome: SkinRenderFn = (ctx, r) => {
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, "#f8fafc");
    grad.addColorStop(0.3, "#94a3b8");
    grad.addColorStop(0.6, "#e2e8f0");
    grad.addColorStop(1, "#475569");
    drawBaseCircle(ctx, r, grad);
    // Shine
    const shine = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0, -r * 0.2, -r * 0.2, r * 0.55);
    shine.addColorStop(0, "rgba(255,255,255,0.7)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = shine;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = Math.max(2, r * 0.03);
    ctx.stroke();
};

// --- toxic ---
const renderToxic: SkinRenderFn = (ctx, r, _wa, t) => {
    // Body
    drawBaseCircle(ctx, r, "#14532d");
    // Animated drip stripes
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    const dripOffset = (t / 1000) % 1;
    for (let i = -3; i < 4; i++) {
        const sx = i * r * 0.55;
        const sy = -r + dripOffset * r * 2;
        ctx.beginPath();
        ctx.ellipse(sx, sy, r * 0.1, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(74,222,128,0.3)";
        ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
};

// --- inferno ---
const renderInferno: SkinRenderFn = (ctx, r, _wa, t) => {
    drawBaseCircle(ctx, r, "#1a0900");
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    // Animated flame blobs rising upward
    const fireCount = 7;
    for (let i = 0; i < fireCount; i++) {
        const phase = (i / fireCount) * Math.PI * 2;
        const flicker = Math.sin(t / 200 + phase);
        const bx = Math.sin(phase + t / 600) * r * 0.6;
        const by = r * 0.4 - flicker * r * 0.5;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.5);
        grad.addColorStop(0, "rgba(255,255,100,0.9)");
        grad.addColorStop(0.4, "rgba(255,80,0,0.6)");
        grad.addColorStop(1, "rgba(255,0,0,0)");
        ctx.beginPath();
        ctx.ellipse(bx, by, r * 0.28, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
};

// --- diamond ---
const renderDiamond: SkinRenderFn = (ctx, r, _wa, t) => {
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, "#e0f2fe");
    grad.addColorStop(0.25, "#bae6fd");
    grad.addColorStop(0.5, "#f0fffe");
    grad.addColorStop(0.75, "#a5f3fc");
    grad.addColorStop(1, "#cffafe");
    drawBaseCircle(ctx, r, grad);
    // Sparkles
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    const sparklePositions = [
        { x: -r * 0.4, y: -r * 0.4 },
        { x: r * 0.3, y: -r * 0.2 },
        { x: -r * 0.1, y: r * 0.4 },
        { x: r * 0.45, y: r * 0.35 },
    ];
    for (const { x, y } of sparklePositions) {
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t / 600 + x));
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.5;
        const sz = r * 0.1;
        ctx.beginPath();
        ctx.moveTo(x - sz, y);
        ctx.lineTo(x + sz, y);
        ctx.moveTo(x, y - sz);
        ctx.lineTo(x, y + sz);
        ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.stroke();
};

// ─── Renderer registry ────────────────────────────────────────────────────────

export const SKIN_RENDERERS: Record<string, SkinRenderFn> = {
    classic: renderClassic,
    ghost: renderGhost,
    void: renderVoid,
    gold: renderGold,
    plasma: renderPlasma,
    lava: renderLava,
    neon: renderNeon,
    galaxy: renderGalaxy,
    chrome: renderChrome,
    toxic: renderToxic,
    inferno: renderInferno,
    diamond: renderDiamond,
};

/**
 * Draw a player cell at the canvas origin (0,0).
 * Save/restore is handled by the caller so transforms stack correctly.
 */
export function renderSkin(
    ctx: CanvasRenderingContext2D,
    skinId: string,
    radius: number,
    walletAddress: string,
    t: number
): void {
    const render = SKIN_RENDERERS[skinId] ?? SKIN_RENDERERS["classic"];
    render(ctx, radius, walletAddress, t);
}
