import { describe, it, expect } from "vitest";
import { invariantResponse } from "./invariantResponse";

describe("invariantResponse", () => {
  it("should not throw when condition is truthy", () => {
    expect(() => invariantResponse(true, "Error message")).not.toThrow();
    expect(() => invariantResponse(1, "Error message")).not.toThrow();
    expect(() => invariantResponse("string", "Error message")).not.toThrow();
    expect(() => invariantResponse({}, "Error message")).not.toThrow();
    expect(() => invariantResponse([], "Error message")).not.toThrow();
  });

  it("should throw Response when condition is falsy", () => {
    expect(() => invariantResponse(false, "Error message")).toThrow(Response);
    expect(() => invariantResponse(null, "Error message")).toThrow(Response);
    expect(() => invariantResponse(undefined, "Error message")).toThrow(
      Response
    );
    expect(() => invariantResponse(0, "Error message")).toThrow(Response);
    expect(() => invariantResponse("", "Error message")).toThrow(Response);
  });

  it("should throw Response with correct message", async () => {
    try {
      invariantResponse(false, "Custom error message");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      const text = await response.text();
      expect(text).toBe("Custom error message");
    }
  });

  it("should throw Response with default status 400", async () => {
    try {
      invariantResponse(false, "Error message");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(400);
    }
  });

  it("should accept a function for the message", async () => {
    try {
      invariantResponse(false, () => "Function message");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      const text = await response.text();
      expect(text).toBe("Function message");
    }
  });

  it("should accept custom response init options", async () => {
    try {
      invariantResponse(false, "Not found", { status: 404 });
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  it("should accept custom headers in response init", async () => {
    try {
      invariantResponse(false, "Error", {
        headers: { "X-Custom-Header": "value" },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.headers.get("X-Custom-Header")).toBe("value");
    }
  });

  it("should work as a type guard (asserts condition)", () => {
    const value: string | null = "test";
    invariantResponse(value !== null, "Value must not be null");
    // TypeScript should know value is string here
    const length: number = value.length;
    expect(length).toBe(4);
  });
});
