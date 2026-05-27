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
