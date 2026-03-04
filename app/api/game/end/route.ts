import { NextRequest, NextResponse } from "next/server";
import { recordGameEnd } from "@/lib/db";

// This endpoint is called by the PartyKit server (server to server) when a player dies.
// We verify a shared secret header to prevent external abuse.
export async function POST(req: NextRequest) {
    // Simple shared-secret guard — PartyKit sets this header when calling the endpoint
    const secret = req.headers.get("x-internal-secret");
    if (secret !== process.env.INTERNAL_API_SECRET) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { walletAddress, massEaten, finalMass, durationSeconds, roomId } =
        (await req.json()) as {
            walletAddress: string;
            massEaten: number;
            finalMass: number;
            durationSeconds: number;
            roomId: string;
        };

    if (!walletAddress || typeof massEaten !== "number") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await recordGameEnd({ walletAddress, massEaten, finalMass, durationSeconds, roomId });

    return NextResponse.json({ ok: true });
}
