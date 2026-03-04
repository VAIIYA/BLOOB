import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "agarsol_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecret(): Uint8Array {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is required");
    }
    return new TextEncoder().encode(JWT_SECRET);
}

export interface AuthPayload extends JWTPayload {
    walletAddress: string;
}

/** Issue a signed JWT and set it as an httpOnly cookie */
export async function issueToken(walletAddress: string): Promise<string> {
    const token = await new SignJWT({ walletAddress } satisfies Omit<AuthPayload, keyof JWTPayload>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MAX_AGE,
        path: "/",
    });

    return token;
}

/** Verify JWT from the cookie and return the payload */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as AuthPayload;
    } catch {
        return null;
    }
}

/** Get the authenticated wallet address from the request cookie */
export async function getAuthWallet(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return payload?.walletAddress ?? null;
}

/** Clear the auth cookie (logout) */
export async function clearToken(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

/** 
 * Verify a JWT string directly (used in PartyKit message validation
 * where we cannot use cookies – the client sends the token in the join message).
 */
export async function verifyTokenString(token: string): Promise<AuthPayload | null> {
    return verifyToken(token);
}
