import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * middleware.ts — Protect /play and /profile routes.
 * Redirects unauthenticated requests to the landing page.
 */
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Routes that require authentication
    const protectedRoutes = ["/play", "/profile", "/shop"];
    const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

    if (!isProtected) return NextResponse.next();

    const token = req.cookies.get("agarsol_token")?.value;
    if (!token) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    // Inline verify (middleware runs on the Edge — jose works there)
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
    try {
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }
}

export const config = {
    matcher: ["/play/:path*", "/profile/:path*", "/shop/:path*"],
};
