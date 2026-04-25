const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const GOOGLE_CLIENT_ID = asString(import.meta.env.VITE_GOOGLE_CLIENT_ID);
export const GITHUB_CLIENT_ID = asString(import.meta.env.VITE_GITHUB_CLIENT_ID);

const explicitBase = asString(import.meta.env.VITE_API_BASE);
const serverUrl = asString(import.meta.env.VITE_SERVER_URL) || asString(import.meta.env.VITE_SIGNAL_SERVER_URL);

const fallbackBase = serverUrl
	? `${serverUrl.replace(/\/$/, "")}${serverUrl.endsWith("/api") ? "" : "/api"}`
	: `${window.location.origin.replace(/\/$/, "")}/api`;

export const API_BASE = explicitBase || fallbackBase;

if (import.meta.env.PROD && /(localhost|127\.0\.0\.1)/i.test(API_BASE)) {
	console.warn(
		`[config] API_BASE resolves to a localhost URL in production (${API_BASE}). Set VITE_API_BASE to your deployed backend URL.`
	);
}

if (import.meta.env.DEV) {
	console.info(`[config] API_BASE: ${API_BASE}`);
}
export const TOKEN_KEY = "skillup_auth_token";
