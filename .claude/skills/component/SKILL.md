---
name: component
description: Create React components using shadcn/ui patterns. Use when building UI components, forms, dialogs, buttons, or when the user mentions component, UI, form, dialog, modal, or styling.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Creating React Components

Create UI components following Pixel Studio's shadcn/ui-based component patterns.

## Directory Structure

```
app/components/
├── ui/              # Base shadcn/ui components (Button, Dialog, etc.)
├── forms/           # Form-specific components
├── layout/          # Layout components (Header, Footer, etc.)
└── [feature]/       # Feature-specific components
```

## Base Component Pattern

```typescript
import { cn } from "~/utils/cn";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

interface MyComponentProps extends ComponentPropsWithoutRef<"div"> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
}

const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "base-styles-here",
          variant === "outline" && "border border-gray-200",
          size === "sm" && "text-sm p-2",
          size === "md" && "text-base p-4",
          size === "lg" && "text-lg p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MyComponent.displayName = "MyComponent";

export { MyComponent };
```

## Using shadcn/ui Components

```typescript
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
```

## The cn() Utility

Always use `cn()` for conditional class merging:

```typescript
import { cn } from "~/utils/cn";

<div className={cn(
  "base-class text-gray-900",
  isActive && "bg-blue-500 text-white",
  isDisabled && "opacity-50 cursor-not-allowed",
  className // Allow override from props
)} />
```

## Form Components with Remix

```typescript
import { Form, useNavigation, useActionData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";

interface FormData {
  error?: string;
  success?: boolean;
}

export function MyForm() {
  const navigation = useNavigation();
  const actionData = useActionData<FormData>();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          name="name"
          required
          disabled={isSubmitting}
          className="mt-1"
        />
      </div>

      {actionData?.error && (
        <p className="text-red-500 text-sm">{actionData.error}</p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </Form>
  );
}
```

## Dialog/Modal Pattern

```typescript
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Button } from "components/ui/button";

export function ConfirmDialog({
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone."
}: {
  onConfirm: () => void;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Loading States

```typescript
import { useNavigation } from "@remix-run/react";

function MyComponent() {
  const navigation = useNavigation();

  // Check for any navigation
  const isLoading = navigation.state === "loading";
  const isSubmitting = navigation.state === "submitting";

  // Check for specific action
  const isLiking = navigation.formData?.get("intent") === "like";

  return (
    <Button disabled={isSubmitting}>
      {isSubmitting ? (
        <span className="animate-spin mr-2">...</span>
      ) : null}
      Submit
    </Button>
  );
}
```

## Responsive Design

```typescript
// Mobile-first approach
<div className={cn(
  // Base (mobile)
  "flex flex-col gap-2 p-4",
  // Tablet (md: 768px+)
  "md:flex-row md:gap-4 md:p-6",
  // Desktop (lg: 1024px+)
  "lg:gap-6 lg:p-8"
)} />

// Hide/show based on screen size
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>
```

## Common Tailwind Patterns

```typescript
// Card
"rounded-lg border bg-card text-card-foreground shadow-sm";

// Flex centering
"flex items-center justify-center";

// Truncate text
"truncate"; // Single line
"line-clamp-2"; // Two lines

// Interactive states
"hover:bg-accent hover:text-accent-foreground";
"focus:outline-none focus:ring-2 focus:ring-ring";
"disabled:pointer-events-none disabled:opacity-50";

// Transitions
"transition-colors duration-200";
"transition-all duration-300 ease-in-out";
```

## Checklist

- [ ] Uses `cn()` for conditional classes
- [ ] Follows shadcn/ui patterns
- [ ] Accepts `className` prop for customization
- [ ] Handles loading/disabled states
- [ ] Uses proper TypeScript types
- [ ] Responsive design considered
- [ ] Accessible (labels, ARIA attributes)
