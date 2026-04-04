/**
 * Mention parsing utilities for comments.
 *
 * Recognizes @username patterns in text and provides helpers
 * for extracting, validating, and rendering mentions.
 */

// Matches @username where username is 3-30 chars of letters, numbers, underscores, hyphens
const MENTION_REGEX = /@([a-zA-Z0-9_-]{3,30})/g;

/**
 * Extract all @username mentions from a text string.
 * Returns unique lowercase usernames.
 */
export function extractMentions(text: string): string[] {
  const mentions = new Set<string>();
  // Create a new regex instance to avoid global lastIndex issues
  const regex = new RegExp(MENTION_REGEX.source, "g");
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.add(match[1].toLowerCase());
  }
  return Array.from(mentions);
}

/**
 * Split text into segments of plain text and mentions.
 * Useful for rendering comments with clickable mention links.
 */
export interface TextSegment {
  type: "text" | "mention";
  content: string;
  username?: string;
}

export function parseTextWithMentions(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  // Reset regex since it's global
  const regex = new RegExp(MENTION_REGEX.source, "g");
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }
    // Add the mention
    segments.push({
      type: "mention",
      content: match[0],
      username: match[1].toLowerCase(),
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
}
