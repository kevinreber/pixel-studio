import { describe, it, expect } from "vitest";
import {
  convertNumberToLocaleString,
  getPaginationRange,
} from "./client";

describe("client utilities", () => {
  describe("convertNumberToLocaleString", () => {
    it("should format numbers with locale-specific separators", () => {
      const result = convertNumberToLocaleString(1000);
      // Intl.NumberFormat uses locale-specific formatting
      expect(result).toMatch(/1[,.]?000/);
    });

    it("should handle zero", () => {
      expect(convertNumberToLocaleString(0)).toBe("0");
    });

    it("should handle large numbers", () => {
      const result = convertNumberToLocaleString(1000000);
      expect(result).toMatch(/1[,.]?000[,.]?000/);
    });
  });

  describe("getPaginationRange", () => {
    it("should calculate correct range for first page", () => {
      const result = getPaginationRange(1, 10, 100);

      expect(result.startRange).toBe(1);
      expect(result.endRange).toBe(10);
    });

    it("should calculate correct range for middle page", () => {
      const result = getPaginationRange(3, 10, 100);

      expect(result.startRange).toBe(21);
      expect(result.endRange).toBe(30);
    });

    it("should handle last page with fewer items than page size", () => {
      const result = getPaginationRange(5, 10, 45);

      expect(result.startRange).toBe(41);
      expect(result.endRange).toBe(45);
    });

    it("should handle exact page boundary", () => {
      const result = getPaginationRange(5, 10, 50);

      expect(result.startRange).toBe(41);
      expect(result.endRange).toBe(50);
    });

    it("should handle page size of 1", () => {
      const result = getPaginationRange(5, 1, 10);

      expect(result.startRange).toBe(5);
      expect(result.endRange).toBe(5);
    });

    it("should handle total items less than page size", () => {
      const result = getPaginationRange(1, 10, 5);

      expect(result.startRange).toBe(1);
      expect(result.endRange).toBe(5);
    });

    it("should handle large page sizes", () => {
      const result = getPaginationRange(1, 100, 500);

      expect(result.startRange).toBe(1);
      expect(result.endRange).toBe(100);
    });

    it("should handle second page correctly", () => {
      const result = getPaginationRange(2, 20, 100);

      expect(result.startRange).toBe(21);
      expect(result.endRange).toBe(40);
    });
  });
});
