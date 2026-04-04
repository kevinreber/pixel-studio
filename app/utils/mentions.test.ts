import { describe, it, expect } from "vitest";
import { extractMentions, parseTextWithMentions } from "./mentions";

describe("extractMentions", () => {
  it("should extract a single mention", () => {
    expect(extractMentions("hello @johndoe")).toEqual(["johndoe"]);
  });

  it("should extract multiple mentions", () => {
    const result = extractMentions("@alice and @bob are here");
    expect(result).toEqual(["alice", "bob"]);
  });

  it("should return unique lowercase mentions", () => {
    const result = extractMentions("@Alice @alice @ALICE");
    expect(result).toEqual(["alice"]);
  });

  it("should return empty array for no mentions", () => {
    expect(extractMentions("no mentions here")).toEqual([]);
  });

  it("should ignore mentions shorter than 3 chars", () => {
    expect(extractMentions("@ab is too short")).toEqual([]);
  });

  it("should handle mentions with hyphens and underscores", () => {
    expect(extractMentions("@user-name_123")).toEqual(["user-name_123"]);
  });

  it("should not have stale lastIndex across multiple calls", () => {
    const result1 = extractMentions("@alice");
    const result2 = extractMentions("@bob");
    expect(result1).toEqual(["alice"]);
    expect(result2).toEqual(["bob"]);
  });

  it("should handle empty string", () => {
    expect(extractMentions("")).toEqual([]);
  });
});

describe("parseTextWithMentions", () => {
  it("should parse text with no mentions", () => {
    const result = parseTextWithMentions("hello world");
    expect(result).toEqual([{ type: "text", content: "hello world" }]);
  });

  it("should parse a single mention", () => {
    const result = parseTextWithMentions("hello @johndoe!");
    expect(result).toEqual([
      { type: "text", content: "hello " },
      { type: "mention", content: "@johndoe", username: "johndoe" },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse multiple mentions", () => {
    const result = parseTextWithMentions("@alice and @bob");
    expect(result).toEqual([
      { type: "mention", content: "@alice", username: "alice" },
      { type: "text", content: " and " },
      { type: "mention", content: "@bob", username: "bob" },
    ]);
  });

  it("should lowercase usernames in mentions", () => {
    const result = parseTextWithMentions("@Alice");
    expect(result).toEqual([
      { type: "mention", content: "@Alice", username: "alice" },
    ]);
  });

  it("should handle text starting with a mention", () => {
    const result = parseTextWithMentions("@alice hello");
    expect(result[0]).toEqual({
      type: "mention",
      content: "@alice",
      username: "alice",
    });
  });

  it("should handle empty string", () => {
    expect(parseTextWithMentions("")).toEqual([]);
  });
});
