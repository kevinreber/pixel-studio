import { describe, it, expect } from "vitest";
import { removeEmptyValuesFromObject } from "./removeEmptyValuesFromObject";

describe("removeEmptyValuesFromObject", () => {
  it("should remove null values", () => {
    const input = { a: "1", b: null };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({ a: "1" });
  });

  it("should remove undefined values", () => {
    const input = { a: "1", b: undefined };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({ a: "1" });
  });

  it("should remove empty string values", () => {
    const input = { a: "1", b: "" };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({ a: "1" });
  });

  it("should keep falsy values that are not null, undefined, or empty string", () => {
    const input = { a: 0, b: false };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({ a: 0, b: false });
  });

  it("should handle mixed values correctly", () => {
    const input = { A: "1", B: 2, C: undefined, D: null, E: false, F: "", G: 0 };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({ A: "1", B: 2, E: false, G: 0 });
  });

  it("should not modify the original object", () => {
    const input = { a: "1", b: null };
    removeEmptyValuesFromObject(input);
    expect(input).toEqual({ a: "1", b: null });
  });

  it("should return an empty object when all values are empty", () => {
    const input = { a: null, b: undefined, c: "" };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({});
  });

  it("should handle an empty object", () => {
    const input = {};
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({});
  });

  it("should handle nested objects and filter their empty values", () => {
    const input = {
      a: "1",
      nested: { x: "valid", y: null, z: "" },
    };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({
      a: "1",
      nested: { x: "valid" },
    });
  });

  it("should remove nested objects that become empty after filtering", () => {
    const input = {
      a: "1",
      nested: { x: null, y: undefined, z: "" },
    };
    const result = removeEmptyValuesFromObject(input);
    expect(result).toEqual({ a: "1" });
  });
});
