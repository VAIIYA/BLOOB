import { NextRequest, NextResponse } from "next/server";
import { getAuthWallet } from "@/lib/auth";
import { getUserProfile, purchaseSkin, updateSkin } from "@/lib/db";
import { SKIN_MAP } from "@/lib/skins";

export async function POST(req: NextRequest) {
    const walletAddress = await getAuthWallet();
    if (!walletAddress) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skinId } = (await req.json()) as { skinId: string };
    const skin = SKIN_MAP.get(skinId);

    if (!skin || skin.unlockType !== "purchasable" || skin.coinCost === undefined) {
        return NextResponse.json({ error: "Skin is not purchasable." }, { status: 400 });
    }

    const profile = await getUserProfile(walletAddress);
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (profile.owned_skins.includes(skinId)) {
        return NextResponse.json({ error: "You already own this skin." }, { status: 409 });
    }

    if (profile.coins < skin.coinCost) {
        return NextResponse.json(
            { error: `Insufficient coins. Need ${skin.coinCost}, have ${profile.coins}.` },
            { status: 402 }
        );
    }

    // Deduct coins and unlock the skin, then equip it
    await purchaseSkin(walletAddress, skinId, skin.coinCost);
    await updateSkin(walletAddress, skinId);

    return NextResponse.json({ ok: true, coinsRemaining: profile.coins - skin.coinCost });
}
