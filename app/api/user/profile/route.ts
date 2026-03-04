import { NextResponse } from "next/server";
import { getAuthWallet } from "@/lib/auth";
import { getUserProfile } from "@/lib/db";

export async function GET() {
    const walletAddress = await getAuthWallet();
    if (!walletAddress) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getUserProfile(walletAddress);
    if (!profile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
}
