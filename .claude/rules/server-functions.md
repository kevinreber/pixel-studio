---
paths:
  - app/server/**/*.ts
  - app/server/**/*.server.ts
---

# Server Function Conventions

When working on server functions (`app/server/`):

## File Naming

Use `.server.ts` suffix to ensure server-only code:

```
app/server/getImages.server.ts
app/server/createCollection.server.ts
```

## Prisma Import

Always import from the singleton:

```typescript
import { prisma } from "~/services/prisma.server";
```

## Function Structure

```typescript
export async function getResourceById(
  id: string,
  userId?: string,
): Promise<Resource | null> {
  // 1. Validate inputs if needed
  if (!id) return null;

  // 2. Query database
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // 3. Transform if needed (e.g., add S3 URLs)
  if (resource) {
    return {
      ...resource,
      imageUrl: getS3Url(resource.s3Key),
    };
  }

  return null;
}
```

## Common Patterns

### Pagination

```typescript
const pageSize = 20;
const skip = (page - 1) * pageSize;

const [items, total] = await Promise.all([
  prisma.item.findMany({
    skip,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  }),
  prisma.item.count(),
]);
```

### With User Check

```typescript
const resource = await prisma.resource.findFirst({
  where: {
    id,
    userId, // Ensure user owns this resource
  },
});
```

### Include Counts

```typescript
const resource = await prisma.resource.findUnique({
  where: { id },
  include: {
    _count: {
      select: { likes: true, comments: true },
    },
  },
});
```

## Error Handling

Let errors bubble up to route handlers:

```typescript
// DON'T catch and return null silently
// DO let Prisma errors propagate
export async function createResource(data: CreateInput) {
  return prisma.resource.create({ data });
}
```
