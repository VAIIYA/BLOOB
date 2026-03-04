"use client";

import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import type {
    ServerMessage,
    TickMessage,
    DeadMessage,
    LeaderboardMessage,
} from "@/types/game";

interface UsePartySocketOptions {
    roomId: string;
    walletAddress: string;
    username: string;
    skinId: string;
    /** JWT token from the httpOnly cookie — passed as query param for auth */
    token: string;
    onTick: (msg: TickMessage) => void;
    onDead: (msg: DeadMessage) => void;
    onLeaderboard: (msg: LeaderboardMessage) => void;
}

export function usePartySocket({
    roomId,
    walletAddress,
    username,
    skinId,
    token,
    onTick,
    onDead,
    onLeaderboard,
}: UsePartySocketOptions) {
    const socketRef = useRef<PartySocket | null>(null);

    // Stable callbacks via ref so the effect doesn't re-run on every render
    const onTickRef = useRef(onTick);
    const onDeadRef = useRef(onDead);
    const onLeaderboardRef = useRef(onLeaderboard);
    onTickRef.current = onTick;
    onDeadRef.current = onDead;
    onLeaderboardRef.current = onLeaderboard;

    useEffect(() => {
        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

        const socket = new PartySocket({
            host,
            room: roomId,
            party: "game",
            query: { token }, // pass token for any server-side verification
        });

        socketRef.current = socket;

        socket.addEventListener("open", () => {
            // Send join message immediately after connection opens
            socket.send(
                JSON.stringify({
                    type: "join",
                    walletAddress,
                    username,
                    skinId,
                    token,
                })
            );
        });

        socket.addEventListener("message", (evt: MessageEvent) => {
            let msg: ServerMessage;
            try {
                msg = JSON.parse(evt.data as string) as ServerMessage;
            } catch {
                return;
            }

            switch (msg.type) {
                case "tick":
                    onTickRef.current(msg);
                    break;
                case "dead":
                    onDeadRef.current(msg);
                    break;
                case "leaderboard":
                    onLeaderboardRef.current(msg);
                    break;
            }
        });

        return () => {
            socket.close();
            socketRef.current = null;
        };
    }, [roomId, walletAddress, username, skinId, token]);

    /** Send an input message to the server */
    const sendInput = useCallback((angle: number, speed: number) => {
        socketRef.current?.send(JSON.stringify({ type: "input", angle, speed }));
    }, []);

    /** Send a split command */
    const sendSplit = useCallback(() => {
        socketRef.current?.send(JSON.stringify({ type: "split" }));
    }, []);

    /** Send an eject command */
    const sendEject = useCallback(() => {
        socketRef.current?.send(JSON.stringify({ type: "eject" }));
    }, []);

    return { sendInput, sendSplit, sendEject };
}
