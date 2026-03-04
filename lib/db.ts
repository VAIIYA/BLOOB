import { sql } from "@vercel/postgres";
import type { UserProfile } from "@/types/game";

// ─── Database helpers ─────────────────────────────────────────────────────────
// Thin wrappers around @vercel/postgres tagged-template queries.
// The POSTGRES_URL env var is automatically used by @vercel/postgres.

/** Fetch full user profile including owned skins */
export async function getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    const { rows } = await sql`
    SELECT
      u.wallet_address,
      u.username,
      u.skin_id,
      u.coins,
      u.total_games,
      u.total_mass_eaten,
      u.highest_mass,
      u.created_at,
      u.username_changed_at,
      COALESCE(
        ARRAY_AGG(os.skin_id) FILTER (WHERE os.skin_id IS NOT NULL),
        ARRAY[]::TEXT[]
      ) AS owned_skins
    FROM users u
    LEFT JOIN owned_skins os ON os.wallet_address = u.wallet_address
    WHERE u.wallet_address = ${walletAddress}
    GROUP BY u.wallet_address
  `;

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        wallet_address: row.wallet_address as string,
        username: row.username as string,
        skin_id: row.skin_id as string,
        coins: row.coins as number,
        total_games: row.total_games as number,
        total_mass_eaten: row.total_mass_eaten as number,
        highest_mass: row.highest_mass as number,
        created_at: String(row.created_at),
        username_changed_at: row.username_changed_at ? String(row.username_changed_at) : null,
        owned_skins: row.owned_skins as string[],
    };
}

/** Create a brand-new user, also granting the 3 free starter skins */
export async function createUser(walletAddress: string, username: string): Promise<UserProfile> {
    // Insert user
    await sql`
    INSERT INTO users (wallet_address, username)
    VALUES (${walletAddress}, ${username})
    ON CONFLICT (wallet_address) DO NOTHING
  `;

    // Grant free skins
    const freeSkins = ["classic", "ghost", "void"];
    for (const skinId of freeSkins) {
        await sql`
      INSERT INTO owned_skins (wallet_address, skin_id)
      VALUES (${walletAddress}, ${skinId})
      ON CONFLICT DO NOTHING
    `;
    }

    const profile = await getUserProfile(walletAddress);
    if (!profile) throw new Error("Failed to create user");
    return profile;
}

/** Check if a username is already taken */
export async function isUsernameTaken(username: string): Promise<boolean> {
    const { rows } = await sql`
    SELECT 1 FROM users WHERE username = ${username} LIMIT 1
  `;
    return rows.length > 0;
}

/** Update the user's current skin */
export async function updateSkin(walletAddress: string, skinId: string): Promise<void> {
    await sql`
    UPDATE users SET skin_id = ${skinId} WHERE wallet_address = ${walletAddress}
  `;
}

/** Update username (enforced 7-day cooldown in the API route) */
export async function updateUsername(walletAddress: string, username: string): Promise<void> {
    await sql`
    UPDATE users
    SET username = ${username}, username_changed_at = NOW()
    WHERE wallet_address = ${walletAddress}
  `;
}

/** Add a skin to the user's owned_skins and deduct coins */
export async function purchaseSkin(
    walletAddress: string,
    skinId: string,
    cost: number
): Promise<void> {
    // Deduct coins and insert skin atomically via two queries
    await sql`
    UPDATE users
    SET coins = coins - ${cost}
    WHERE wallet_address = ${walletAddress} AND coins >= ${cost}
  `;
    await sql`
    INSERT INTO owned_skins (wallet_address, skin_id)
    VALUES (${walletAddress}, ${skinId})
    ON CONFLICT DO NOTHING
  `;
}

/** Update stats after a game session ends */
export async function recordGameEnd(opts: {
    walletAddress: string;
    massEaten: number;
    finalMass: number;
    durationSeconds: number;
    roomId: string;
}): Promise<void> {
    const { walletAddress, massEaten, finalMass, durationSeconds, roomId } = opts;

    // Calculate coins earned: 1 per 100 mass eaten
    const coinsEarned = Math.floor(massEaten / 100);

    await sql`
    UPDATE users
    SET
      total_games       = total_games + 1,
      total_mass_eaten  = total_mass_eaten + ${massEaten},
      highest_mass      = GREATEST(highest_mass, ${finalMass}),
      coins             = coins + ${coinsEarned}
    WHERE wallet_address = ${walletAddress}
  `;

    // Record the game session for historical stats
    await sql`
    INSERT INTO game_sessions (wallet_address, room_id, mass_eaten, final_mass, duration_seconds)
    VALUES (${walletAddress}, ${roomId}, ${massEaten}, ${finalMass}, ${durationSeconds})
  `;

    // Check if milestone skins should be unlocked
    const { rows } = await sql`
    SELECT total_mass_eaten FROM users WHERE wallet_address = ${walletAddress}
  `;
    if (rows.length === 0) return;
    const totalMassEaten = rows[0].total_mass_eaten as number;

    const milestones: Array<{ skin: string; threshold: number }> = [
        { skin: "gold", threshold: 5_000 },
        { skin: "plasma", threshold: 15_000 },
        { skin: "lava", threshold: 30_000 },
    ];

    for (const { skin, threshold } of milestones) {
        if (totalMassEaten >= threshold) {
            await sql`
        INSERT INTO owned_skins (wallet_address, skin_id)
        VALUES (${walletAddress}, ${skin})
        ON CONFLICT DO NOTHING
      `;
        }
    }
}
