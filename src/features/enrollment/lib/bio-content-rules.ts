/**
 * Content rules for free-text bio fields (shortBio, bio).
 *
 * Shared between the client wizard validator and the server schema so both
 * enforcement layers stay in sync without duplicating patterns.
 *
 * No `server-only` / `use client` — intentionally neutral so both sides
 * can import it.
 */

// Protocol-based URLs: http://, https://, ftp://
const PROTOCOL_URL = /https?:\/\/|ftp:\/\//i;

// Classic www. prefix
const WWW_PREFIX = /\bwww\./i;

// Known platform hostnames referenced without a protocol.
// Covers the most common off-platform contact and social channels.
const PLATFORM_HOSTNAME =
  /\b(t\.me|wa\.me|instagram\.com|onlyfans\.com|twitter\.com|x\.com|tiktok\.com|facebook\.com|telegram\.me|snapchat\.com|linkedin\.com|youtube\.com|youtu\.be)\b/i;

export function containsUrl(value: string): boolean {
  return (
    PROTOCOL_URL.test(value) ||
    WWW_PREFIX.test(value) ||
    PLATFORM_HOSTNAME.test(value)
  );
}

// Phone-like runs: 7+ digits allowing the usual separators (spaces, dots,
// dashes, parentheses) and an optional leading +country code. Catches the
// shapes people sneak a number into a bio with — "+57 300 123 4567",
// "3001234567", "300-123-4567" — while ignoring short numbers like ages or
// prices. Used only for a soft, real-time warning (not a hard block) so the
// modelo can fix it before human review instead of getting rejected.
const PHONE_LIKE = /(?:\+?\d[\s().-]?){7,}\d/;

export function containsPhone(value: string): boolean {
  return PHONE_LIKE.test(value);
}

/** True if the text leaks off-platform contact (a URL or a phone number). */
export function hasContactLeak(value: string): boolean {
  return containsUrl(value) || containsPhone(value);
}

// Whole-token matcher for stripping: protocol/www links plus bare platform
// hostnames and whatever trails them (handle, path), globally.
const URL_TOKEN =
  /(?:https?:\/\/|ftp:\/\/|www\.)\S+|(?:t\.me|wa\.me|instagram\.com|onlyfans\.com|twitter\.com|x\.com|tiktok\.com|facebook\.com|telegram\.me|snapchat\.com|linkedin\.com|youtube\.com|youtu\.be)\S*/gi;

/**
 * Sanitisation net for free-text bio fields: removes off-platform links and
 * tidies the whitespace left behind, then trims. The wizard already blocks
 * submission when a URL is detected and the server schema re-validates — this
 * is defense-in-depth so nothing link-shaped is ever persisted/rendered.
 */
export function sanitizeBioText(value: string): string {
  return value
    .replace(URL_TOKEN, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
