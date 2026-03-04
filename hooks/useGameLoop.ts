"use client";

import { useEffect, useRef, useCallback } from "react";

interface GameLoopOptions {
    /** Called every animation frame with elapsed time since last frame (ms) */
    onFrame: (dt: number) => void;
    /** If false, the loop is paused */
    running?: boolean;
}

/**
 * useGameLoop — drives requestAnimationFrame loop for client-side rendering.
 *
 * The game state lives on the PartyKit server (updated at 30fps via setInterval).
 * The client renders at the display's native refresh rate (requestAnimationFrame),
 * interpolating or simply drawing the latest snapshot received from the server.
 */
export function useGameLoop({ onFrame, running = true }: GameLoopOptions): void {
    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const onFrameRef = useRef(onFrame);

    // Keep callback reference stable — avoids restarting the loop on re-renders
    onFrameRef.current = onFrame;

    const tick = useCallback((now: number) => {
        const dt = lastTimeRef.current === 0 ? 0 : now - lastTimeRef.current;
        lastTimeRef.current = now;
        onFrameRef.current(dt);
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
        if (!running) {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
                lastTimeRef.current = 0;
            }
            return;
        }

        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [running, tick]);
}
