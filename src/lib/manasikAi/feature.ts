// Master switch for Manasik AI:
// - 'live'   → fully working.
// - 'locked' → still in the sidebar, but the page shows "setup needed — not ready yet" and the API refuses requests.
// - 'hidden' → removed from the sidebar; the page and API answer 404.
// The code stays in place in every mode.
export type ManasikAiStatus = 'live' | 'locked' | 'hidden';
// Widened with `as` so switching the value doesn't trip TypeScript's literal-comparison check.
export const MANASIK_AI_STATUS = 'live' as ManasikAiStatus;

export const MANASIK_AI_ENABLED = MANASIK_AI_STATUS !== 'hidden';
export const MANASIK_AI_LOCKED = MANASIK_AI_STATUS === 'locked';
