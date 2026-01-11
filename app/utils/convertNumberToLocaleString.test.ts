import { describe, it, expect } from "vitest";
import { convertNumberToLocaleString } from "./convertNumberToLocaleString";

describe("convertNumberToLocaleString", () => {
  it("should format large numbers with commas", () => {
    expect(convertNumberToLocaleString(10000000)).toBe("10,000,000");
  });

  it("should format thousands with commas", () => {
    expect(convertNumberToLocaleString(1000)).toBe("1,000");
  });

  it("should not add commas for numbers less than 1000", () => {
    expect(convertNumberToLocaleString(100)).toBe("100");
  });

  it("should handle zero", () => {
    expect(convertNumberToLocaleString(0)).toBe("0");
  });

  it("should use default value of 0 when no argument is provided", () => {
    expect(convertNumberToLocaleString()).toBe("0");
  });

  it("should handle negative numbers", () => {
    expect(convertNumberToLocaleString(-1000)).toBe("-1,000");
  });

  it("should handle decimal numbers", () => {
    const result = convertNumberToLocaleString(1234.56);
    expect(result).toBe("1,234.56");
  });

  it("should handle very large numbers", () => {
    expect(convertNumberToLocaleString(1000000000)).toBe("1,000,000,000");
  });
});
