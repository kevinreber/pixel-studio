import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { delay } from "./delay";

describe("delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a promise", () => {
    const result = delay(100);
    expect(result).toBeInstanceOf(Promise);
  });

  it("should resolve after the specified time", async () => {
    const delayMs = 1000;
    const promise = delay(delayMs);

    // Promise should still be pending
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    // Fast forward time
    await vi.advanceTimersByTimeAsync(delayMs);

    expect(resolved).toBe(true);
  });

  it("should delay for the correct duration", async () => {
    const delayMs = 500;
    const promise = delay(delayMs);

    // Advance by less than delay time
    await vi.advanceTimersByTimeAsync(499);

    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    // Should not be resolved yet
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(false);

    // Now complete the remaining time
    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);
  });

  it("should handle zero delay", async () => {
    const promise = delay(0);
    await vi.advanceTimersByTimeAsync(0);

    await expect(promise).resolves.toBeUndefined();
  });
});
