import { describe, it, expect, beforeEach } from "vitest";
import { singleton } from "./singleton";

describe("singleton", () => {
  beforeEach(() => {
    // Clear the global singletons before each test
    const globalObj = global as unknown as { __singletons?: Record<string, unknown> };
    delete globalObj.__singletons;
  });

  it("should return the value from the factory function", () => {
    const result = singleton("test", () => "value");
    expect(result).toBe("value");
  });

  it("should return the same value on subsequent calls with the same name", () => {
    const factory = () => ({ id: Math.random() });

    const first = singleton("unique-test", factory);
    const second = singleton("unique-test", factory);

    expect(first).toBe(second);
    expect(first.id).toBe(second.id);
  });

  it("should call factory function only once for the same name", () => {
    let callCount = 0;
    const factory = () => {
      callCount++;
      return "value";
    };

    singleton("counter-test", factory);
    singleton("counter-test", factory);
    singleton("counter-test", factory);

    expect(callCount).toBe(1);
  });

  it("should create different singletons for different names", () => {
    const result1 = singleton("name1", () => "value1");
    const result2 = singleton("name2", () => "value2");

    expect(result1).toBe("value1");
    expect(result2).toBe("value2");
  });

  it("should work with different value types", () => {
    const stringValue = singleton("string-type", () => "string");
    const numberValue = singleton("number-type", () => 42);
    const objectValue = singleton("object-type", () => ({ key: "value" }));
    const arrayValue = singleton("array-type", () => [1, 2, 3]);

    expect(stringValue).toBe("string");
    expect(numberValue).toBe(42);
    expect(objectValue).toEqual({ key: "value" });
    expect(arrayValue).toEqual([1, 2, 3]);
  });

  it("should handle complex objects as singleton values", () => {
    class ComplexObject {
      constructor(public value: string) {}
    }

    const instance = singleton("complex", () => new ComplexObject("test"));

    expect(instance).toBeInstanceOf(ComplexObject);
    expect(instance.value).toBe("test");
  });
});
