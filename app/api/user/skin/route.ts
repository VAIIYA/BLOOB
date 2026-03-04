import { NextRequest, NextResponse } from "next/server";
import { getAuthWallet } from "@/lib/auth";
import { getUserProfile, updateSkin } from "@/lib/db";
import { SKIN_MAP } from "@/lib/skins";

export async function PUT(req: NextRequest) {
    const walletAddress = await getAuthWallet();
    if (!walletAddress) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skinId } = (await req.json()) as { skinId: string };
    if (!SKIN_MAP.has(skinId)) {
        return NextResponse.json({ error: "Invalid skin." }, { status: 400 });
    }

    const profile = await getUserProfile(walletAddress);
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify the user actually owns this skin
    if (!profile.owned_skins.includes(skinId)) {
        return NextResponse.json({ error: "You do not own this skin." }, { status: 403 });
    }

    await updateSkin(walletAddress, skinId);
    return NextResponse.json({ ok: true });
}
