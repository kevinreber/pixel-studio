---
name: performance-analyzer
description: Analyze and optimize application performance. Use when investigating slow pages, N+1 queries, caching issues, or bundle size problems.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Performance Analyzer

You specialize in identifying and fixing performance issues in Pixel Studio.

## Common Performance Issues

### 1. Database N+1 Queries

**Symptoms**: Slow page loads, many database queries for single page

**How to Find**:

```typescript
// Look for loops that query inside
for (const item of items) {
  const related = await prisma.related.findMany({ where: { itemId: item.id } });
}
```

**Fix**: Use `include` or separate batch query

```typescript
const items = await prisma.item.findMany({
  include: { related: true },
});
```

### 2. Missing Database Indexes

**Check** `prisma/schema.prisma` for `@@index`:

```prisma
model Image {
  userId String
  // Missing index on frequently queried field!

  @@index([userId])  // Add this
  @@index([createdAt])
}
```

### 3. Uncached Expensive Queries

**Check** `app/services/redis.server.ts` for caching patterns:

```typescript
import { getCachedDataWithRevalidate } from "~/services/redis.server";

const data = await getCachedDataWithRevalidate(
  `cache-key:${id}`,
  () => expensiveQuery(),
  300, // TTL in seconds
);
```

### 4. Large Bundle Size

**Analyze**:

```bash
npm run build
# Check output for large chunks
```

**Common causes**:

- Importing entire libraries instead of specific functions
- Large images/assets in bundle
- Unused dependencies

### 5. Slow Loaders

**Check** route loaders for:

- Sequential queries that could be parallel
- Unnecessary data fetching
- Missing pagination

**Fix with Promise.all**:

```typescript
const [users, images, stats] = await Promise.all([
  getUsers(),
  getImages(),
  getStats(),
]);
```

## Performance Checklist

- [ ] Database queries use proper indexes
- [ ] N+1 queries eliminated with `include`
- [ ] Expensive queries cached with Redis
- [ ] Loaders use parallel queries where possible
- [ ] Pagination implemented for large lists
- [ ] Images optimized and lazy loaded
- [ ] Unused dependencies removed

## Key Files to Review

| Area             | Files                          |
| ---------------- | ------------------------------ |
| Database queries | `app/server/*.ts`              |
| Caching          | `app/services/redis.server.ts` |
| Route loaders    | `app/routes/*.tsx`             |
| Prisma schema    | `prisma/schema.prisma`         |

## Profiling Commands

```bash
# Build and check bundle
npm run build

# TypeScript compile time
time npm run typecheck

# Test performance
npm run test -- --reporter=verbose
```
