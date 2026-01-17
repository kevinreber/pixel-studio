---
paths:
  - app/components/**/*.tsx
---

# Component Conventions

When working on React components:

## Import Patterns

```typescript
// UI components from shadcn
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Dialog, DialogContent, DialogHeader } from "components/ui/dialog";

// Utility for class names
import { cn } from "~/utils/cn";

// Remix hooks
import {
  Form,
  useNavigation,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
```

## Class Name Merging

Always use `cn()` for conditional classes:

```typescript
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes",
  className // Allow override from props
)} />
```

## Component Props

Accept `className` for customization:

```typescript
interface MyComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function MyComponent({ className, children }: MyComponentProps) {
  return (
    <div className={cn("default-styles", className)}>
      {children}
    </div>
  );
}
```

## Loading States

Use Remix's `useNavigation` for loading states:

```typescript
const navigation = useNavigation();
const isSubmitting = navigation.state === "submitting";
const isLoading = navigation.state === "loading";

<Button disabled={isSubmitting}>
  {isSubmitting ? "Saving..." : "Save"}
</Button>
```

## Form Handling

Use Remix `Form` component:

```typescript
<Form method="post">
  <input type="hidden" name="intent" value="create" />
  {/* form fields */}
</Form>
```

## Accessibility

- Always include proper labels for form inputs
- Use semantic HTML elements
- Add ARIA attributes where needed
- Ensure keyboard navigation works
