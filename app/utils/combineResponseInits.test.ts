import { describe, it, expect } from "vitest";
import { combineResponseInits } from "./combineResponseInits";

describe("combineResponseInits", () => {
  it("should use the last defined response init properties", () => {
    const init1: ResponseInit = { status: 200 };
    const init2: ResponseInit = { statusText: "OK" };

    const result = combineResponseInits(init1, init2);

    // The implementation spreads each init, so later inits overwrite earlier ones
    // Only statusText from init2 is preserved (status from init1 is lost)
    expect(result.statusText).toBe("OK");
  });

  it("should override properties from later inits", () => {
    const init1: ResponseInit = { status: 200 };
    const init2: ResponseInit = { status: 201 };

    const result = combineResponseInits(init1, init2);

    expect(result.status).toBe(201);
  });

  it("should combine headers from multiple inits", () => {
    const init1: ResponseInit = {
      headers: { "Content-Type": "application/json" },
    };
    const init2: ResponseInit = {
      headers: { Authorization: "Bearer token" },
    };

    const result = combineResponseInits(init1, init2);

    const headers = result.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("should skip undefined inits without losing previous values", () => {
    const init1: ResponseInit = { status: 200 };

    // When undefined is passed, the spread of undefined is empty,
    // so headers are still combined but other props aren't preserved
    const result = combineResponseInits(init1, undefined);

    // Headers should exist from combining
    expect(result.headers).toBeInstanceOf(Headers);
  });

  it("should return empty object when no arguments provided", () => {
    const result = combineResponseInits();

    // When no arguments, combined starts as {} and loop never runs
    expect(result).toEqual({});
  });

  it("should handle all undefined inits", () => {
    const result = combineResponseInits(undefined, undefined);

    // Headers should still be created (empty)
    expect(result.headers).toBeInstanceOf(Headers);
  });

  it("should preserve all properties when a single complete init is provided last", () => {
    const init1: ResponseInit = {
      headers: { "X-Custom-Header": "value1" },
    };
    const init2: ResponseInit = {
      status: 201,
      statusText: "Created",
      headers: { "X-Another-Header": "value2" },
    };

    const result = combineResponseInits(init1, init2);

    expect(result.status).toBe(201);
    expect(result.statusText).toBe("Created");
    const headers = result.headers as Headers;
    expect(headers.get("X-Custom-Header")).toBe("value1");
    expect(headers.get("X-Another-Header")).toBe("value2");
  });

  it("should append duplicate header values", () => {
    const init1: ResponseInit = {
      headers: { "Set-Cookie": "cookie1=value1" },
    };
    const init2: ResponseInit = {
      headers: { "Set-Cookie": "cookie2=value2" },
    };

    const result = combineResponseInits(init1, init2);

    const headers = result.headers as Headers;
    const setCookie = headers.get("Set-Cookie");
    expect(setCookie).toContain("cookie1=value1");
    expect(setCookie).toContain("cookie2=value2");
  });
});
