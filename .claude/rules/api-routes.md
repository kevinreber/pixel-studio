---
paths:
  - app/routes/api.*
---

# API Route Conventions

When working on API routes (`app/routes/api.*`):

## Authentication

Always check authentication for protected endpoints:
```typescript
import { requireUserLogin } from "~/server/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  // user is guaranteed to exist
}
```

## Input Validation

Always validate inputs with Zod:
```typescript
import { z } from "zod";

const Schema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
});

const result = Schema.safeParse(Object.fromEntries(formData));
if (!result.success) {
  return json({ error: result.error.errors[0].message }, { status: 400 });
}
```

## Response Format

Use consistent response structure:
```typescript
// Success
return json({ success: true, data: result });

// Error
return json({ error: "Error message" }, { status: 400 });

// Not found
return json({ error: "Resource not found" }, { status: 404 });

// Server error
return json({ error: "Internal server error" }, { status: 500 });
```

## Cache Invalidation

Invalidate Redis cache after mutations:
```typescript
import { cacheDelete } from "~/services/redis.server";

// After creating/updating/deleting
await cacheDelete(`user-data:${userId}`);
```

## Method Handling

Use `request.method` for multi-method endpoints:
```typescript
export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "DELETE") {
    // Handle delete
  }
  // Default to POST/PUT
}
```
