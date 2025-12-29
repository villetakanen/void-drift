/**
 * Generates a 6-character hash from a UUID.
 *
 * Uses SHA-256 → base64 → first 6 chars.
 * Deterministic: same input always produces same output.
 *
 * Purpose: Prevents duplicate initials confusion (AAA_abc123 vs AAA_xyz789).
 *
 * @param userId - Supabase auth user ID (UUID)
 * @returns 6-character alphanumeric hash
 *
 * @example
 * generateUidHash('550e8400-e29b-41d4-a716-446655440000')
 * // => 'Xa3cD1'
 */
export async function generateUidHash(userId: string): Promise<string> {
    // Convert UUID string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(userId);

    // Hash with SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    // Take first 6 characters (alphanumeric + some symbols)
    // Replace symbols for cleaner display
    const hash = hashBase64
        .substring(0, 6)
        .replace(/\+/g, 'x')
        .replace(/\//g, 'y')
        .replace(/=/g, 'z');

    return hash;
}
