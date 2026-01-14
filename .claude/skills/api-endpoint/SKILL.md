---
name: api-endpoint
description: Create new REST API endpoints following project patterns. Use when adding API routes, creating actions/loaders, implementing CRUD operations, or when the user mentions API, endpoint, action, or REST.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Creating API Endpoints

Create REST API endpoints following Pixel Studio's established patterns.

## File Naming Convention

API routes go in `app/routes/` with dot-separated naming:

```
api.resource.ts           # Collection endpoint
api.resource.$id.ts       # Single resource
api.resource.action.ts    # Specific action
api.resource.$id.action.ts # Action on single resource
```

## Standard Structure

```typescript
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUserLogin } from "~/server/auth.server";
import { prisma } from "~/services/prisma.server";

// 1. Define Zod schema for validation
const RequestSchema = z.object({
  field: z.string().min(1),
});

// 2. Export loader for GET requests
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);

  const data = await prisma.resource.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return json({ data });
}

// 3. Export action for POST/PUT/DELETE
export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);

  // Handle different methods
  if (request.method === "DELETE") {
    await prisma.resource.delete({ where: { id: params.id } });
    return json({ success: true });
  }

  // Parse and validate form data
  const formData = await request.formData();
  const data = RequestSchema.parse(Object.fromEntries(formData));

  const result = await prisma.resource.create({
    data: { ...data, userId: user.id },
  });

  return json({ success: true, data: result });
}
```

## Authentication Patterns

```typescript
// Protected route - requires login
const user = await requireUserLogin(request);

// Public route with optional user
const auth = await getGoogleSessionAuth(request);
const userId = auth?.user?.id;

// Anonymous only (redirect if logged in)
await requireAnonymous(request);
```

## Error Handling

```typescript
// Validation errors (400)
try {
  const data = RequestSchema.parse(formData);
} catch (error) {
  if (error instanceof z.ZodError) {
    return json({ error: error.errors[0].message }, { status: 400 });
  }
}

// Not found (404)
const resource = await prisma.resource.findUnique({ where: { id } });
if (!resource) {
  return json({ error: "Resource not found" }, { status: 404 });
}

// Forbidden (403)
if (resource.userId !== user.id) {
  return json({ error: "Not authorized" }, { status: 403 });
}

// Server error (500)
return json({ error: "Failed to process request" }, { status: 500 });
```

## Cache Integration

```typescript
import { getCachedDataWithRevalidate, cacheDelete } from "~/utils/redis-cache";

// In loader - cache reads
const data = await getCachedDataWithRevalidate(
  `resource:${userId}`,
  () => prisma.resource.findMany({ where: { userId } }),
  60 * 5 // 5 minutes TTL
);

// In action - invalidate cache after mutations
await cacheDelete(`resource:${userId}`);
```

## Response Patterns

```typescript
// Success responses
return json({ success: true });
return json({ data: result });
return json({ collection, message: "Created successfully" });

// Error responses
return json({ error: "Validation failed" }, { status: 400 });
return json({ error: "Not found" }, { status: 404 });
return json({ error: "Not authorized" }, { status: 403 });
```

## Example: Like/Unlike Endpoint

```typescript
// app/routes/api.images.$imageId.like.ts
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/server/auth.server";
import { likeImage, unlikeImage } from "~/server/imageLikes";
import { cacheDelete } from "~/utils/redis-cache";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const { imageId } = params;

  if (!imageId) {
    return json({ error: "Image ID required" }, { status: 400 });
  }

  if (request.method === "POST") {
    await likeImage(imageId, user.id);
  } else if (request.method === "DELETE") {
    await unlikeImage(imageId, user.id);
  }

  await cacheDelete(`explore-images`);

  return json({ success: true });
}
```

## Checklist

- [ ] Route file follows naming convention
- [ ] Zod schema validates all inputs
- [ ] Authentication check for protected routes
- [ ] Proper error handling with status codes
- [ ] Cache invalidation after mutations
- [ ] TypeScript types are correct
- [ ] No `any` types used
