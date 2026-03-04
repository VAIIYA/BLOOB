"use client";

import SkinPreview from "./SkinPreview";
import type { SkinDefinition } from "@/types/game";

interface SkinCardProps {
    skin: SkinDefinition;
    walletAddress: string;
    totalMassEaten: number;
    coins: number;
    ownedSkins: string[];
    equippedSkin: string;
    onEquip: (skinId: string) => void;
    onBuy: (skin: SkinDefinition) => void;
}

/** 
 * SkinCard — one card in the shop / profile skin grid.
 * Shows the animated preview, status badge, and action button.
 */
export default function SkinCard({
    skin,
    walletAddress,
    totalMassEaten,
    coins,
    ownedSkins,
    equippedSkin,
    onEquip,
    onBuy,
}: SkinCardProps) {
    const owned = ownedSkins.includes(skin.id);
    const equipped = equippedSkin === skin.id;

    // Check if milestone skin can be unlocked
    const milestoneReached =
        skin.unlockType === "milestone" &&
        skin.milestoneRequired !== undefined &&
        totalMassEaten >= skin.milestoneRequired;

    const canAfford =
        skin.unlockType === "purchasable" &&
        skin.coinCost !== undefined &&
        coins >= skin.coinCost;

    // Status label
    let badge = "";
    let badgeColor = "rgba(255,255,255,0.2)";
    if (equipped) {
        badge = "Equipped";
        badgeColor = "#7c3aed";
    } else if (owned) {
        badge = "Owned";
        badgeColor = "#059669";
    } else if (skin.unlockType === "free") {
        badge = "Free";
        badgeColor = "#0369a1";
    } else if (skin.unlockType === "milestone") {
        badge = milestoneReached ? "Unlocked!" : `${(skin.milestoneRequired ?? 0).toLocaleString()} mass`;
        badgeColor = milestoneReached ? "#059669" : "#92400e";
    } else {
        badge = `${(skin.coinCost ?? 0).toLocaleString()} 🪙`;
        badgeColor = canAfford ? "#b45309" : "#374151";
    }

    return (
        <div
            style={{
                background: equipped
                    ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.1))"
                    : "rgba(255,255,255,0.04)",
                border: equipped
                    ? "1px solid rgba(196,181,253,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
            }}
            onMouseOver={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.25)";
            }}
            onMouseOut={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
        >
            {/* Preview */}
            <SkinPreview skin={skin} walletAddress={walletAddress} size={80} />

            {/* Name */}
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", textAlign: "center" }}>
                {skin.name}
            </div>

            {/* Description */}
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.4 }}>
                {skin.description}
            </div>

            {/* Badge */}
            <div
                style={{
                    background: badgeColor,
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    color: "#fff",
                    letterSpacing: 0.5,
                }}
            >
                {badge}
            </div>

            {/* Action button */}
            {!owned && !equipped && (
                <>
                    {skin.unlockType === "milestone" && !milestoneReached && (
                        <div style={{ fontSize: 11, color: "rgba(255,200,100,0.7)", textAlign: "center" }}>
                            Need {((skin.milestoneRequired ?? 0) - totalMassEaten).toLocaleString()} more mass
                        </div>
                    )}

                    {skin.unlockType === "milestone" && milestoneReached && (
                        <button
                            onClick={() => onEquip(skin.id)}
                            style={actionButtonStyle("#059669")}
                        >
                            Equip (unlocked!)
                        </button>
                    )}

                    {skin.unlockType === "purchasable" && (
                        <button
                            disabled={!canAfford}
                            onClick={() => onBuy(skin)}
                            style={actionButtonStyle(canAfford ? "#7c3aed" : "#374151")}
                        >
                            {canAfford ? "Buy & Equip" : "Not enough 🪙"}
                        </button>
                    )}
                </>
            )}

            {owned && !equipped && (
                <button
                    onClick={() => onEquip(skin.id)}
                    style={actionButtonStyle("#7c3aed")}
                >
                    Equip
                </button>
            )}
        </div>
    );
}

function actionButtonStyle(bg: string): React.CSSProperties {
    return {
        background: bg,
        border: "none",
        borderRadius: 10,
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 20px",
        cursor: "pointer",
        width: "100%",
        fontFamily: "Inter, sans-serif",
        transition: "opacity 0.15s",
    };
}
