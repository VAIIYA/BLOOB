import { NextRequest, NextResponse } from "next/server";
import { getAuthWallet } from "@/lib/auth";
import { getUserProfile, updateUsername, isUsernameTaken } from "@/lib/db";

export async function PUT(req: NextRequest) {
    const walletAddress = await getAuthWallet();
    if (!walletAddress) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = (await req.json()) as { username: string };

    if (!username || !/^[a-zA-Z0-9_-]{3,16}$/.test(username.trim())) {
        return NextResponse.json(
            { error: "Username must be 3–16 characters (letters, numbers, _ or -)." },
            { status: 422 }
        );
    }

    const profile = await getUserProfile(walletAddress);
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Enforce 7-day cooldown
    if (profile.username_changed_at) {
        const lastChange = new Date(profile.username_changed_at).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastChange < sevenDays) {
            return NextResponse.json(
                { error: "You can only change your username once every 7 days." },
                { status: 429 }
            );
        }
    }

    const clean = username.trim();
    if (await isUsernameTaken(clean)) {
        return NextResponse.json({ error: "Username already taken." }, { status: 409 });
    }

    await updateUsername(walletAddress, clean);
    return NextResponse.json({ ok: true });
}
