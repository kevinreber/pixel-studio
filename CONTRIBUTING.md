# Contributing to Pixel Studio

Thank you for your interest in contributing to Pixel Studio! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

Be respectful and inclusive. We welcome contributors of all backgrounds and experience levels.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pixel-studio.git
   cd pixel-studio
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```
5. **Set up the database**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
6. **Start the development server**:
   ```bash
   npm run dev
   ```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

### 2. Make Your Changes

- Write clean, readable code
- Follow the [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run unit tests
npm run test:run

# Run E2E tests (if UI changes)
npm run test:e2e
```

### 4. Commit Your Changes

Follow the [commit conventions](#commit-conventions).

### 5. Push and Create a Pull Request

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub.

## Coding Standards

### TypeScript

- **Strict mode**: No `any` types without strong justification
- **Type everything**: Functions, parameters, return values
- **Use interfaces/types**: Define shapes for data structures

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// Bad
function getUser(id: any): any {
  return prisma.user.findUnique({ where: { id } });
}
```

### React Components

- Use functional components with hooks
- Use TypeScript for props
- Keep components focused and small
- Use shadcn/ui components from `components/ui/`

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function CustomButton({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}
```

### Styling

- Use Tailwind CSS utility classes
- Use the `cn()` helper for conditional classes
- Keep styles consistent with existing components

```typescript
import { cn } from "~/utils/cn";

<div className={cn("base-class", isActive && "active-class")} />
```

### File Organization

| Type         | Location          | Naming              |
| ------------ | ----------------- | ------------------- |
| Routes       | `app/routes/`     | Remix conventions   |
| Components   | `app/components/` | PascalCase.tsx      |
| Services     | `app/services/`   | camelCase.server.ts |
| Server utils | `app/server/`     | camelCase.server.ts |
| Hooks        | `app/hooks/`      | useCamelCase.ts     |
| Types        | `app/types/`      | PascalCase.types.ts |
| Schemas      | `app/schemas/`    | camelCase.ts        |

### Validation

Always validate external inputs using Zod:

```typescript
import { z } from "zod";

const CreateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  model: z.enum(["dall-e-3", "dall-e-2", "stable-diffusion"]),
});

// In route action
const result = CreateImageSchema.safeParse(data);
if (!result.success) {
  return json({ error: result.error.flatten() }, { status: 400 });
}
```

### Error Handling

- Handle errors appropriately at each level
- Provide user-friendly error messages
- Log technical details for debugging

```typescript
try {
  const result = await someOperation();
  return json({ success: true, data: result });
} catch (error) {
  console.error("Operation failed:", error);
  return json(
    { success: false, error: "Something went wrong" },
    { status: 500 },
  );
}
```

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                        |
| ---------- | ---------------------------------- |
| `feat`     | New feature                        |
| `fix`      | Bug fix                            |
| `docs`     | Documentation only                 |
| `style`    | Formatting, no code change         |
| `refactor` | Code change, no new feature or fix |
| `perf`     | Performance improvement            |
| `test`     | Adding/updating tests              |
| `chore`    | Maintenance tasks                  |

### Examples

```bash
feat(auth): add Google OAuth login
fix(images): resolve duplicate image upload issue
docs(readme): update installation instructions
refactor(api): simplify collection endpoints
test(comments): add unit tests for comment service
```

### Commit Message Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor" not "moves cursor")
- First line should be 72 characters or less
- Reference issues in the body when applicable

## Pull Request Process

### Before Submitting

- [ ] All tests pass (`npm run test:run`)
- [ ] Code passes linting (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Documentation is updated (if needed)
- [ ] Commits follow conventions

### PR Title

Follow the same format as commits:

```
feat(component): add new image gallery view
```

### PR Description

Use the pull request template. Include:

- **Summary**: What does this PR do?
- **Changes**: List of changes made
- **Testing**: How was this tested?
- **Screenshots**: For UI changes

### Review Process

1. Create PR and request review
2. Address feedback from reviewers
3. Once approved, squash and merge
4. Delete the branch after merging

### What We Look For

- Code quality and readability
- Test coverage for new code
- No breaking changes without discussion
- Performance considerations
- Security best practices

## Issue Guidelines

### Bug Reports

Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, OS)
- Screenshots if applicable

### Feature Requests

Include:

- Clear description of the feature
- Use case / problem it solves
- Proposed implementation (optional)
- Any alternatives considered

### Labels

| Label              | Description                     |
| ------------------ | ------------------------------- |
| `bug`              | Something isn't working         |
| `feature`          | New feature request             |
| `enhancement`      | Improvement to existing feature |
| `documentation`    | Documentation updates           |
| `good first issue` | Good for newcomers              |
| `help wanted`      | Extra attention needed          |

## Questions?

- Check existing issues and PRs
- Read the documentation
- Open a discussion for questions

Thank you for contributing!
