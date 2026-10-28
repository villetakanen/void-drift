import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Environment variables (exposed via Astro's PUBLIC_ prefix)
// Note: import.meta.env is provided by the bundler (Vite/Astro)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const LEADERBOARD_UNAVAILABLE =
	"Shared scores are unavailable in this local session.";

// Local game and Lab use must not depend on live service credentials.
export const supabase: SupabaseClient | null =
	supabaseUrl && supabaseAnonKey
		? createClient(supabaseUrl, supabaseAnonKey, {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: false, // Not using OAuth
				},
			})
		: null;

/**
 * Ensures the user has an anonymous session.
 * Auto-signs in if no session exists.
 *
 * @returns The current session (existing or newly created)
 */
export async function ensureAnonymousSession() {
	if (!supabase) return null;
	// Check for existing session
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		console.log("[Supabase Auth] Existing session found:", session.user.id);
		return session;
	}

	// No session - create anonymous user
	console.log("[Supabase Auth] No session found, signing in anonymously...");
	const { data, error } = await supabase.auth.signInAnonymously();

	if (error) {
		console.error("[Supabase Auth] Anonymous signin failed:", error.message);
		throw error;
	}

	console.log("[Supabase Auth] Anonymous session created:", data.user?.id);
	return data.session;
}
