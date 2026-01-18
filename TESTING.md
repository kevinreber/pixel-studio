# Testing Guide

Testing strategy and guidelines for Pixel Studio.

## Overview

Pixel Studio uses a comprehensive testing approach:

| Type          | Tool       | Location              | Purpose                              |
| ------------- | ---------- | --------------------- | ------------------------------------ |
| Unit Tests    | Vitest     | `tests/`, `*.test.ts` | Test individual functions/components |
| E2E Tests     | Playwright | `tests/`, `*.spec.ts` | Test full user flows                 |
| Type Checking | TypeScript | Everywhere            | Compile-time type safety             |
| Linting       | ESLint     | Everywhere            | Code quality                         |

## Quick Commands

```bash
# Unit tests
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage report

# E2E tests
npm run test:e2e          # Headless mode
npm run test:e2e:ui       # Interactive UI mode

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Unit Testing with Vitest

### Configuration

Vitest is configured in `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

### Writing Unit Tests

Place tests in `tests/` directory or colocate with source files as `*.test.ts`.

```typescript
// tests/services/collection.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCollection } from "~/services/collection.server";

describe("createCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a collection with valid data", async () => {
    const result = await createCollection({
      title: "Test Collection",
      userId: "user-123",
    });

    expect(result).toBeDefined();
    expect(result.title).toBe("Test Collection");
  });

  it("should throw error for empty title", async () => {
    await expect(
      createCollection({ title: "", userId: "user-123" }),
    ).rejects.toThrow("Title is required");
  });
});
```

### Mocking

#### Mock Prisma

```typescript
import { vi } from "vitest";
import { prisma } from "~/services/prisma.server";

vi.mock("~/services/prisma.server", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// In test
vi.mocked(prisma.user.findUnique).mockResolvedValue({
  id: "user-123",
  name: "Test User",
  // ...
});
```

#### Mock External APIs

```typescript
import { vi } from "vitest";

vi.mock("~/services/openai.server", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/image.png",
  }),
}));
```

#### Mock Redis

```typescript
vi.mock("~/utils/cache.server", () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue("OK"),
  cacheDelete: vi.fn().mockResolvedValue(1),
}));
```

### Testing Utilities

```typescript
// tests/utils/test-helpers.ts
import { vi } from "vitest";

export function createMockUser(overrides = {}) {
  return {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    username: "testuser",
    credits: 10,
    ...overrides,
  };
}

export function createMockImage(overrides = {}) {
  return {
    id: "image-123",
    prompt: "Test prompt",
    model: "dall-e-3",
    userId: "user-123",
    ...overrides,
  };
}
```

### Testing Zod Schemas

```typescript
import { describe, it, expect } from "vitest";
import { CreateImageSchema } from "~/schemas/image";

describe("CreateImageSchema", () => {
  it("should validate valid input", () => {
    const result = CreateImageSchema.safeParse({
      prompt: "A beautiful sunset",
      model: "dall-e-3",
      numberOfImages: 1,
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty prompt", () => {
    const result = CreateImageSchema.safeParse({
      prompt: "",
      model: "dall-e-3",
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid model", () => {
    const result = CreateImageSchema.safeParse({
      prompt: "Test",
      model: "invalid-model",
    });

    expect(result.success).toBe(false);
  });
});
```

## E2E Testing with Playwright

### Configuration

Playwright is configured in `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Writing E2E Tests

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page for unauthenticated users", async ({ page }) => {
    await page.goto("/");

    // Check for login button or redirect
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("should redirect to home after login", async ({ page }) => {
    // This would use a test account or mock auth
    await page.goto("/login");

    // Fill login form
    await page.click('button:has-text("Continue with Google")');

    // Verify redirect
    await expect(page).toHaveURL("/");
  });
});
```

### Testing User Flows

```typescript
// tests/e2e/image-generation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Image Generation", () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto("/test/login-google");
  });

  test("should generate an image with valid prompt", async ({ page }) => {
    await page.goto("/create");

    // Fill the prompt
    await page.fill('[name="prompt"]', "A beautiful mountain landscape");

    // Select model
    await page.selectOption('[name="model"]', "dall-e-3");

    // Submit
    await page.click('button[type="submit"]');

    // Wait for generation (or status indicator)
    await expect(page.locator(".image-result")).toBeVisible({
      timeout: 60000,
    });
  });

  test("should add image to collection", async ({ page }) => {
    await page.goto("/explore");

    // Click first image
    await page.click(".image-card >> nth=0");

    // Click add to collection button
    await page.click('button[aria-label="Add to collection"]');

    // Select or create collection
    await page.click('text="Create new collection"');
    await page.fill('[name="title"]', "Test Collection");
    await page.click('button:has-text("Create")');

    // Verify success
    await expect(page.locator(".toast-success")).toBeVisible();
  });
});
```

### Page Object Model

```typescript
// tests/pages/CreatePage.ts
import { Page, Locator } from "@playwright/test";

export class CreatePage {
  readonly page: Page;
  readonly promptInput: Locator;
  readonly modelSelect: Locator;
  readonly submitButton: Locator;
  readonly resultImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.promptInput = page.locator('[name="prompt"]');
    this.modelSelect = page.locator('[name="model"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.resultImage = page.locator(".image-result");
  }

  async goto() {
    await this.page.goto("/create");
  }

  async generateImage(prompt: string, model = "dall-e-3") {
    await this.promptInput.fill(prompt);
    await this.modelSelect.selectOption(model);
    await this.submitButton.click();
  }

  async waitForResult(timeout = 60000) {
    await this.resultImage.waitFor({ state: "visible", timeout });
  }
}

// Usage in test
test("generate image", async ({ page }) => {
  const createPage = new CreatePage(page);
  await createPage.goto();
  await createPage.generateImage("A sunset over mountains");
  await createPage.waitForResult();
});
```

### Testing with Authentication

```typescript
// tests/fixtures/auth.ts
import { test as base } from "@playwright/test";

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Set up authentication
    await page.goto("/test/login-google");
    await page.waitForURL("/");

    await use(page);
  },
});

// Usage
test("authenticated user can create collection", async ({
  authenticatedPage,
}) => {
  await authenticatedPage.goto("/collections");
  // ...
});
```

## Testing Best Practices

### What to Test

**Unit Tests:**

- Service functions
- Utility functions
- Zod schemas
- Data transformations
- Business logic

**E2E Tests:**

- Critical user flows (login, image generation)
- Form submissions
- Navigation
- Error states

### What NOT to Test

- Third-party libraries
- Framework internals
- Simple getters/setters
- Implementation details

### Test Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── collection.test.ts
│   │   └── image.test.ts
│   ├── utils/
│   │   └── format.test.ts
│   └── schemas/
│       └── image.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── image-generation.spec.ts
│   └── collections.spec.ts
├── fixtures/
│   └── auth.ts
├── pages/
│   └── CreatePage.ts
└── utils/
    └── test-helpers.ts
```

### Naming Conventions

```typescript
// File names
collection.test.ts; // Unit test
auth.spec.ts; // E2E test

// Test descriptions
describe("createCollection", () => {
  it("should create a collection with valid data", () => {});
  it("should throw error for empty title", () => {});
  it("should require authentication", () => {});
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Type Check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit Tests
        run: npm run test:run

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: E2E Tests
        run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Debugging Tests

### Vitest

```bash
# Run specific test file
npm run test:run -- tests/services/collection.test.ts

# Run tests matching pattern
npm run test:run -- -t "should create"

# Debug mode
npm run test -- --reporter=verbose
```

### Playwright

```bash
# Run with UI
npm run test:e2e:ui

# Debug mode
npx playwright test --debug

# Run specific test
npx playwright test auth.spec.ts

# Generate test code
npx playwright codegen localhost:5173
```

## Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/index.html
```

### Coverage Thresholds

Configure in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```
