import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

/**
 * Build the exact message the client signs.
 * Timestamp is sent by the client as part of the sign-in flow.
 */
export function buildSignMessage(timestamp: number): string {
    return `Sign in to AgarSol - ${timestamp}`;
}

/**
 * Verify a Solana wallet signature server-side.
 *
 * @param walletAddress  - Base58 encoded public key
 * @param signature      - Base58 encoded Ed25519 signature
 * @param message        - The exact UTF-8 message that was signed
 * @returns true if the signature was created by the private key of walletAddress
 */
export function verifyWalletSignature(
    walletAddress: string,
    signature: string,
    message: string
): boolean {
    try {
        // 1. Decode the base58 public key into raw bytes
        const publicKeyBytes = new PublicKey(walletAddress).toBytes();

        // 2. Decode the base58 signature into raw bytes
        const signatureBytes = bs58.decode(signature);

        // 3. Encode the message as UTF-8 bytes
        const messageBytes = new TextEncoder().encode(message);

        // 4. Use TweetNaCl to verify the Ed25519 signature
        //    nacl.sign.detached.verify(message, signature, publicKey) → boolean
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch {
        // Any decoding error means invalid input → treat as forged
        return false;
    }
}

/**
 * Validate that the timestamp in the sign-in request is fresh
 * (within 5 minutes of now). Prevents replay attacks.
 */
export function isTimestampFresh(timestamp: number, maxAgeMs = 5 * 60 * 1000): boolean {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    return diff < maxAgeMs;
}
