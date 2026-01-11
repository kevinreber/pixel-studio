import { describe, it, expect } from "vitest";
import { combineHeaders } from "./combineHeaders";

describe("combineHeaders", () => {
  it("should combine multiple header objects", () => {
    const headers1 = { "Content-Type": "application/json" };
    const headers2 = { Authorization: "Bearer token" };

    const result = combineHeaders(headers1, headers2);

    expect(result.get("Content-Type")).toBe("application/json");
    expect(result.get("Authorization")).toBe("Bearer token");
  });

  it("should handle null headers", () => {
    const headers1 = { "Content-Type": "application/json" };

    const result = combineHeaders(headers1, null);

    expect(result.get("Content-Type")).toBe("application/json");
  });

  it("should handle undefined headers", () => {
    const headers1 = { "Content-Type": "application/json" };

    const result = combineHeaders(headers1, undefined);

    expect(result.get("Content-Type")).toBe("application/json");
  });

  it("should append duplicate header values instead of overwriting", () => {
    const headers1 = { "Set-Cookie": "cookie1=value1" };
    const headers2 = { "Set-Cookie": "cookie2=value2" };

    const result = combineHeaders(headers1, headers2);

    // Headers.get() returns comma-separated values for multiple same-name headers
    const setCookie = result.get("Set-Cookie");
    expect(setCookie).toContain("cookie1=value1");
    expect(setCookie).toContain("cookie2=value2");
  });

  it("should return empty Headers when no arguments provided", () => {
    const result = combineHeaders();

    expect([...result.entries()]).toHaveLength(0);
  });

  it("should handle Headers instances as input", () => {
    const headers1 = new Headers({ "Content-Type": "application/json" });
    const headers2 = new Headers({ Authorization: "Bearer token" });

    const result = combineHeaders(headers1, headers2);

    expect(result.get("Content-Type")).toBe("application/json");
    expect(result.get("Authorization")).toBe("Bearer token");
  });

  it("should handle mixed input types", () => {
    const headers1 = { "Content-Type": "application/json" };
    const headers2 = new Headers({ Authorization: "Bearer token" });

    const result = combineHeaders(headers1, null, headers2);

    expect(result.get("Content-Type")).toBe("application/json");
    expect(result.get("Authorization")).toBe("Bearer token");
  });
});
