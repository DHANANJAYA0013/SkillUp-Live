const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const GOOGLE_CLIENT_ID = asString(import.meta.env.VITE_GOOGLE_CLIENT_ID);
export const GITHUB_CLIENT_ID = asString(import.meta.env.VITE_GITHUB_CLIENT_ID);

const explicitBase = asString(import.meta.env.VITE_API_BASE);
const serverUrl = asString(import.meta.env.VITE_SERVER_URL) || asString(import.meta.env.VITE_SIGNAL_SERVER_URL);

export const API_BASE =
	explicitBase ||
	(serverUrl ? `${serverUrl.replace(/\/$/, "")}${serverUrl.endsWith("/api") ? "" : "/api"}` : "http://localhost:5000/api");
export const TOKEN_KEY = "skillup_auth_token";
