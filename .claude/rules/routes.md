---
paths:
  - app/routes/*.tsx
  - app/routes/*.ts
---

# Route Conventions

When working on Remix routes:

## File Naming

```
_index.tsx          # / (home)
explore.tsx         # /explore
user.$userId.tsx    # /user/:userId
generate.tsx        # /generate
auth.login.tsx      # /auth/login
api.images.ts       # /api/images (no UI)
```

## Route Structure

```typescript
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";

// SEO meta tags
export const meta: MetaFunction = () => [
  { title: "Page Title | Pixel Studio" },
  { name: "description", content: "Description" },
];

// Data loading (GET)
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Fetch data
  return json({ data });
}

// Mutations (POST/PUT/DELETE)
export async function action({ request }: ActionFunctionArgs) {
  // Handle form submission
  return json({ success: true });
  // or
  return redirect("/path");
}

// Component
export default function Page() {
  const { data } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return <div>...</div>;
}

// Error handling
export function ErrorBoundary() {
  return <div>Something went wrong</div>;
}
```

## Authentication

```typescript
// Protected route
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  // user is guaranteed
}

// Optional auth
export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getGoogleSessionAuth(request);
  const userId = auth?.user?.id; // May be undefined
}
```

## URL Parameters

```typescript
// From URL path: /user/:userId
export async function loader({ params }: LoaderFunctionArgs) {
  const { userId } = params;
}

// From query string: /search?q=term&page=1
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const page = parseInt(url.searchParams.get("page") || "1");
}
```

## Multiple Actions

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create":
      return handleCreate(formData);
    case "delete":
      return handleDelete(formData);
    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
}
```
