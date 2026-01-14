---
name: route
description: Create Remix routes with loaders and actions. Use when creating new pages, implementing route loaders/actions, handling navigation, or when the user mentions route, page, loader, action, or navigation.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Creating Remix Routes

Create routes following Pixel Studio's Remix conventions.

## Route File Naming

Routes in `app/routes/` use dot-separated naming:

```
_index.tsx           # / (home)
explore.tsx          # /explore
user.$userId.tsx     # /user/:userId (dynamic segment)
generate.tsx         # /generate
generate_.tsx        # /generate (no layout nesting)
auth.login.tsx       # /auth/login
api.images.ts        # /api/images (API route)
```

## Full Page Route Template

```typescript
// app/routes/resource.tsx
import { json, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";
import { z } from "zod";
import { requireUserLogin } from "~/server/auth.server";
import { getResource, createResource } from "~/server/resource.server";

// Meta tags for SEO
export const meta: MetaFunction = () => {
  return [
    { title: "Page Title | Pixel Studio" },
    { name: "description", content: "Page description" },
  ];
};

// Loader - runs on GET requests
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);

  const resources = await getResource(user.id);

  return json({ resources, user });
}

// Action - runs on POST/PUT/DELETE
const ActionSchema = z.object({
  title: z.string().min(1, "Title required"),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();

  const result = ActionSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return json({ error: result.error.errors[0].message }, { status: 400 });
  }

  await createResource(user.id, result.data);

  return json({ success: true });
}

// Component
export default function ResourcePage() {
  const { resources, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Resources</h1>
      {actionData?.error && (
        <p className="text-red-500 mb-4">{actionData.error}</p>
      )}
      {/* Page content */}
    </div>
  );
}

// Error boundary for route errors
export function ErrorBoundary() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-red-500">Error</h1>
      <p>Something went wrong loading this page.</p>
    </div>
  );
}
```

## Loader Patterns

### Public Route with Optional Auth

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getGoogleSessionAuth(request);
  const userId = auth?.user?.id;

  const images = await getPublicImages();

  return json({ images, userId });
}
```

### Protected Route

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  // User is guaranteed to exist here

  return json({ user });
}
```

### Dynamic Parameters

```typescript
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { userId } = params;

  if (!userId) {
    throw new Response("User ID required", { status: 400 });
  }

  const user = await getUserProfile(userId);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return json({ user });
}
```

### URL Search Params

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("q") || "";

  const { images, total } = await getImages({ page, search });

  return json({ images, total, page, search });
}
```

## Action Patterns

### Multiple Intents

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create": {
      const title = formData.get("title") as string;
      await createResource(user.id, { title });
      return json({ success: true });
    }
    case "delete": {
      const id = formData.get("id") as string;
      await deleteResource(id, user.id);
      return json({ success: true });
    }
    default:
      return json({ error: "Invalid intent" }, { status: 400 });
  }
}
```

### Redirect After Action

```typescript
import { redirect } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  // ... create resource

  return redirect(`/resource/${newResource.id}`);
}
```

## Component Patterns

### Using Loader Data

```typescript
import { useLoaderData } from "@remix-run/react";

export default function Page() {
  const { resources, user } = useLoaderData<typeof loader>();
  // TypeScript knows the exact types
}
```

### Form Submission

```typescript
import { Form, useNavigation } from "@remix-run/react";

export default function Page() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <input type="hidden" name="intent" value="create" />
      <input name="title" required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </button>
    </Form>
  );
}
```

### Programmatic Navigation

```typescript
import { useNavigate, useSearchParams } from "@remix-run/react";

export default function Page() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigate to new page
  const goToDetails = (id: string) => navigate(`/resource/${id}`);

  // Update search params
  const setPage = (page: number) => {
    setSearchParams({ page: String(page) });
  };
}
```

## Layout Routes

### Nested Layout

```typescript
// app/routes/dashboard.tsx (layout)
import { Outlet } from "@remix-run/react";

export default function DashboardLayout() {
  return (
    <div className="flex">
      <aside className="w-64">Sidebar</aside>
      <main className="flex-1">
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}

// app/routes/dashboard.settings.tsx (child)
export default function Settings() {
  return <div>Settings Page</div>;
}
```

### Pathless Layout (Grouping)

```typescript
// app/routes/_auth.tsx (layout for auth routes)
// app/routes/_auth.login.tsx
// app/routes/_auth.register.tsx
```

## Links and Navigation

```typescript
import { Link, NavLink } from "@remix-run/react";

// Basic link
<Link to="/explore">Explore</Link>

// Active styling
<NavLink
  to="/dashboard"
  className={({ isActive }) =>
    isActive ? "text-blue-500" : "text-gray-500"
  }
>
  Dashboard
</NavLink>

// Prefetch on hover
<Link to="/resource" prefetch="intent">
  View Resource
</Link>
```

## Checklist

- [ ] Route file follows naming convention
- [ ] Exports `loader` for data fetching
- [ ] Exports `action` for mutations
- [ ] Exports `meta` for SEO
- [ ] Uses proper authentication helpers
- [ ] Validates action inputs with Zod
- [ ] Handles errors with ErrorBoundary
- [ ] Uses TypeScript types from loader/action
