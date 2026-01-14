---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - tests/**/*
---

# Testing Conventions

When writing or modifying tests:

## Unit Tests (Vitest)

### File Location
Place tests next to the file being tested:
```
app/utils/cn.ts
app/utils/cn.test.ts
```

### Test Structure
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("functionName", () => {
  beforeEach(() => {
    // Reset mocks/state
    vi.clearAllMocks();
  });

  it("should handle normal case", () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });

  it("should handle edge case", () => {
    expect(() => functionName(null)).toThrow();
  });
});
```

### Mocking

```typescript
// Mock a module
vi.mock("~/services/prisma.server", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Use the mock
import { prisma } from "~/services/prisma.server";
vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
```

## E2E Tests (Playwright)

### File Location
Place in `tests/` directory:
```
tests/pages.spec.ts
tests/api.spec.ts
```

### Test Structure
```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature", () => {
  test("should work correctly", async ({ page }) => {
    await page.goto("/path");
    await expect(page.locator("h1")).toBeVisible();
  });
});
```

### API Testing
```typescript
test("API returns data", async ({ request }) => {
  const response = await request.get("/api/endpoint");
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data).toHaveProperty("items");
});
```

## Running Tests

```bash
# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test:run

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Assertions

```typescript
// Equality
expect(value).toBe(expected);        // Strict
expect(value).toEqual(expected);     // Deep

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Arrays/Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty("key");

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```
