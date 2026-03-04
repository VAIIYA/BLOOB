import { NextRequest, NextResponse } from "next/server";
import { verifyWalletSignature, isTimestampFresh, buildSignMessage } from "@/lib/solana";
import { getUserProfile, createUser, isUsernameTaken } from "@/lib/db";
import { issueToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            walletAddress: string;
            signature: string;
            timestamp: number;
            username?: string;
        };

        const { walletAddress, signature, timestamp, username } = body;

        // 1. Validate timestamp freshness (replay attack prevention)
        if (!isTimestampFresh(timestamp)) {
            return NextResponse.json({ error: "Signature expired. Please try again." }, { status: 401 });
        }

        // 2. Verify the signature server-side using Ed25519
        const message = buildSignMessage(timestamp);
        const valid = verifyWalletSignature(walletAddress, signature, message);
        if (!valid) {
            return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
        }

        // 3. Check if user already exists OR create them
        let profile = await getUserProfile(walletAddress);

        if (!profile) {
            // New user — username is required
            if (!username || username.trim().length === 0) {
                return NextResponse.json(
                    { error: "Username required for new accounts.", needsUsername: true },
                    { status: 422 }
                );
            }

            const clean = username.trim().slice(0, 16);
            if (!/^[a-zA-Z0-9_-]{3,16}$/.test(clean)) {
                return NextResponse.json(
                    { error: "Username must be 3–16 characters (letters, numbers, _ or -)." },
                    { status: 422 }
                );
            }

            if (await isUsernameTaken(clean)) {
                return NextResponse.json({ error: "Username already taken." }, { status: 409 });
            }

            profile = await createUser(walletAddress, clean);
        }

        // 4. Issue JWT stored in httpOnly cookie
        await issueToken(walletAddress);

        return NextResponse.json(profile, { status: 200 });
    } catch (err) {
        console.error("[verify] error:", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
