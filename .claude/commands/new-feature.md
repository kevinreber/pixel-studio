---
description: Plan and implement a new feature end-to-end
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
argument-hint: <feature description>
---

# New Feature Implementation

Help me implement this feature: $ARGUMENTS

## Process

1. **Research Phase**
   - Search the codebase for similar patterns
   - Identify files that need modification
   - Check existing components/utilities that can be reused

2. **Planning Phase**
   - Create a todo list of specific changes
   - Identify the route, components, and server functions needed
   - Consider database schema changes if required

3. **Implementation Phase**
   - Follow existing patterns in the codebase
   - Use shadcn/ui components from `components/ui/`
   - Add Zod validation for all inputs
   - Use proper TypeScript types

4. **Verification Phase**
   - Run `npm run typecheck` to verify types
   - Run `npm run lint` to check code style
   - Run relevant tests if they exist

## Key Files to Reference

- Routes: `app/routes/`
- Components: `app/components/`
- Server functions: `app/server/`
- Services: `app/services/`
- Schemas: `app/schemas/`

## Conventions

- Use `requireUserLogin(request)` for protected routes
- Use `cn()` for conditional Tailwind classes
- Follow Remix loader/action patterns
- Cache frequently accessed data with Redis
