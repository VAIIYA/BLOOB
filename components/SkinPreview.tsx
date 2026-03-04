"use client";

import { useRef, useEffect } from "react";
import { renderSkin } from "@/lib/skins";
import type { SkinDefinition } from "@/types/game";

interface SkinPreviewProps {
    skin: SkinDefinition;
    walletAddress: string;
    size?: number;
}

/**
 * SkinPreview — animates a skin in a small canvas square.
 * Uses requestAnimationFrame so animated skins loop correctly.
 */
export default function SkinPreview({ skin, walletAddress, size = 80 }: SkinPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number>(Date.now());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const radius = size / 2 - 4;

        function draw() {
            if (!ctx || !canvas) return;
            const t = Date.now() - startRef.current;
            ctx.clearRect(0, 0, size, size);
            ctx.save();
            ctx.translate(size / 2, size / 2);
            renderSkin(ctx, skin.id, radius, walletAddress, t);
            ctx.restore();
            rafRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [skin.id, walletAddress, size]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ borderRadius: "50%", display: "block" }}
        />
    );
}
