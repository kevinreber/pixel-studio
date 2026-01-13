# AGENTS.md - Specialized Agent Workflows

This file defines specialized workflows for Claude Code agents working on Pixel Studio.

---

## Code Review Agent

Use this workflow when reviewing pull requests or code changes.

### Checklist

1. **Type Safety**
   - No `any` types without justification
   - Proper TypeScript strict mode compliance
   - Zod schemas for external data validation

2. **Security**
   - No hardcoded secrets or API keys
   - Input validation on all user inputs
   - SQL injection prevention (Prisma handles this)
   - XSS prevention in rendered content
   - CSRF protection on mutations

3. **Performance**
   - Database queries are optimized (use `select`, avoid N+1)
   - Proper use of React hooks (no unnecessary re-renders)
   - Images are optimized before storage
   - Redis caching for expensive operations

4. **Error Handling**
   - Errors are caught and handled appropriately
   - User-facing errors are friendly
   - Server errors are logged (Winston)
   - Sentry captures unhandled exceptions

5. **Code Style**
   - Follows ESLint rules
   - Consistent naming conventions
   - No commented-out code
   - Meaningful variable/function names

6. **Testing**
   - New features have tests
   - Edge cases are covered
   - Tests pass locally

### Commands to Run

```bash
npm run typecheck      # Type errors
npm run lint           # Style issues
npm run test:run       # Unit tests
npm run test:e2e       # E2E tests (if UI changes)
```

---

## Feature Development Agent

Use this workflow when implementing new features.

### Process

1. **Understand Requirements**
   - Read related code and documentation
   - Identify affected files and systems
   - Consider edge cases

2. **Plan Implementation**
   - List files to create/modify
   - Identify database schema changes
   - Consider API contract changes
   - Plan test coverage

3. **Implement**
   - Start with database schema if needed (`prisma/schema.prisma`)
   - Create/update services in `app/services/`
   - Create/update routes in `app/routes/`
   - Create/update components in `app/components/`
   - Add validation schemas in `app/schemas/`

4. **Test**
   - Write unit tests for services
   - Write E2E tests for user flows
   - Manual testing in browser

5. **Document**
   - Update CHANGELOG.md
   - Add JSDoc comments for complex functions
   - Update README if needed

### File Creation Order

```
1. prisma/schema.prisma          # Database changes
2. app/schemas/*.ts              # Validation schemas
3. app/services/*.server.ts      # Business logic
4. app/routes/api.*.ts           # API endpoints
5. app/routes/*.tsx              # Page routes
6. app/components/*.tsx          # UI components
7. tests/*.test.ts               # Tests
```

---

## Bug Fix Agent

Use this workflow when fixing bugs.

### Process

1. **Reproduce**
   - Understand the bug report
   - Reproduce locally
   - Identify the root cause

2. **Fix**
   - Make minimal changes to fix the issue
   - Don't refactor unrelated code
   - Add test to prevent regression

3. **Verify**
   - Confirm fix works locally
   - Run full test suite
   - Check for side effects

4. **Document**
   - Add entry to BUGFIXES.md with:
     - Bug description
     - Root cause
     - Fix applied
     - Prevention measures

### BUGFIXES.md Entry Template

```markdown
## [Date] - Brief Description

**Symptoms:** What users experienced
**Root Cause:** Why it happened
**Fix:** What was changed
**Files Modified:** List of files
**Prevention:** How to avoid in future
```

---

## Database Migration Agent

Use this workflow for database schema changes.

### Process

1. **Plan Schema Change**
   - Edit `prisma/schema.prisma`
   - Consider data migration needs
   - Check for breaking changes

2. **Apply Changes**
   ```bash
   # Development
   npx prisma db push          # Quick push for dev

   # Production-ready
   npx prisma migrate dev --name descriptive_name
   ```

3. **Update Code**
   - Update affected services
   - Update TypeScript types if needed
   - Regenerate Prisma client: `npx prisma generate`

4. **Test**
   - Verify queries work
   - Check existing data compatibility
   - Run integration tests

### Common Schema Patterns

```prisma
// Adding a new field (nullable for existing data)
model Example {
  newField String?
}

// Adding required field with default
model Example {
  newField String @default("default_value")
}

// Adding relation
model Example {
  relatedId String
  related   Related @relation(fields: [relatedId], references: [id])
  @@index([relatedId])
}
```

---

## API Development Agent

Use this workflow when creating or modifying API endpoints.

### Route Structure

```
app/routes/
├── api.images.ts           # /api/images
├── api.images.$id.ts       # /api/images/:id
├── api.collections.ts      # /api/collections
└── api.users.$username.ts  # /api/users/:username
```

### Standard API Response Patterns

```typescript
// Success response
return json({ success: true, data: result });

// Error response
return json({ success: false, error: "Message" }, { status: 400 });

// Redirect after mutation
return redirect("/destination");
```

### Authentication Check

```typescript
import { requireUserId } from "server/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  // ... authenticated logic
}
```

### Validation Pattern

```typescript
import { z } from "zod";

const CreateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  model: z.enum(["dall-e-3", "dall-e-2", "stable-diffusion"]),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = CreateImageSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return json({ error: result.error.flatten() }, { status: 400 });
  }

  // Use result.data
}
```

---

## Testing Agent

Use this workflow when writing or running tests.

### Unit Tests (Vitest)

Location: `tests/` or colocated `*.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";

describe("featureName", () => {
  it("should do something", () => {
    expect(result).toBe(expected);
  });
});
```

### E2E Tests (Playwright)

Location: `tests/` with `.spec.ts` extension

```typescript
import { test, expect } from "@playwright/test";

test("user can generate image", async ({ page }) => {
  await page.goto("/generate");
  await page.fill('[name="prompt"]', "A sunset");
  await page.click('button[type="submit"]');
  await expect(page.locator(".image-result")).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage

# E2E tests
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI
```

---

## Kafka/Async Processing Agent

Use this workflow when working with async image generation.

### Architecture

```
User Request → Kafka Producer → Topic → Consumer → AI API → S3 → DB → WebSocket → UI
```

### Key Files

| File | Purpose |
|------|---------|
| `app/server/kafka.server.ts` | Kafka client setup |
| `app/server/imageGenerationProducer.ts` | Queue job submission |
| `app/server/imageGenerationWorker.ts` | Job processing |
| `app/server/websocket.server.ts` | Real-time updates |
| `scripts/startConsumers.ts` | Consumer startup |
| `scripts/startWebSocketServer.ts` | WebSocket server |

### Adding New Job Type

1. Define message schema
2. Update producer to send new message type
3. Update consumer to handle new message type
4. Add WebSocket event for progress updates

### Debugging

```bash
npm run kafka:health       # Check cluster
npm run kafka:monitor      # Watch topics
docker logs kafka          # Container logs (local)
```

---

## Deployment Agent

Use this workflow when preparing for or executing deployments.

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] CHANGELOG.md updated

### Build Commands

```bash
npm run build              # Production build
npm run typecheck          # Verify types
npm run lint               # Check style
```

### Environment-Specific Notes

| Platform | Notes |
|----------|-------|
| Vercel | Set `ENABLE_KAFKA_IMAGE_GENERATION=false` |
| Railway | Can use full async mode |
| AWS | Use MSK for Kafka, RDS for Postgres |

### Post-Deployment

- [ ] Verify app loads
- [ ] Test authentication flow
- [ ] Test image generation
- [ ] Check error tracking (Sentry)
- [ ] Monitor logs for issues

---

## Performance Optimization Agent

Use this workflow when optimizing performance.

### Database Queries

```typescript
// Good: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true },
});

// Good: Use includes judiciously
const image = await prisma.image.findUnique({
  where: { id },
  include: { user: { select: { name: true } } },
});

// Bad: Fetching everything
const user = await prisma.user.findUnique({ where: { id } });
```

### React Components

- Use `React.memo()` for expensive pure components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for callbacks passed to children
- Avoid creating objects/arrays in render

### Caching (Redis)

```typescript
import { redis } from "server/redis.server";

// Cache expensive operation
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await expensiveOperation();
await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 });
return result;
```

---

## Troubleshooting Agent

Use this workflow when diagnosing issues.

### Common Issues

| Issue | Check |
|-------|-------|
| DB connection fails | Verify `DATABASE_URL`, check Prisma client |
| Auth not working | Check Google OAuth credentials, session secret |
| Images not generating | Verify API keys, check Kafka if async |
| WebSocket disconnects | Check `WS_PORT`, verify server running |
| Styles broken | Run `npm run build`, check Tailwind config |

### Debug Commands

```bash
# Database
npx prisma studio                    # Visual DB browser
npx prisma db pull                   # Sync schema from DB

# Kafka
npm run kafka:health                 # Cluster status
npm run kafka:monitor                # Topic monitoring

# Application
npm run dev -- --debug               # Debug mode
NODE_OPTIONS='--inspect' npm run dev # Node inspector
```

### Log Locations

- Application logs: Console (Winston)
- Error tracking: Sentry dashboard
- Kafka logs: Docker logs or CloudWatch (AWS)
