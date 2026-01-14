---
description: Safely refactor code with proper verification
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
argument-hint: <what to refactor>
---

# Safe Refactoring

Refactor: $ARGUMENTS

## Refactoring Process

1. **Understand Current State**
   - Read and understand the code to be refactored
   - Identify all usages with grep/glob
   - Note any tests that cover this code

2. **Plan Changes**
   - List all files that need modification
   - Identify potential breaking changes
   - Consider backwards compatibility if needed

3. **Execute Refactoring**
   - Make changes incrementally
   - Update all usages consistently
   - Preserve existing behavior

4. **Verify Changes**
   ```bash
   # Type check
   npm run typecheck

   # Lint
   npm run lint

   # Run tests
   npm run test:run
   ```

## Common Refactoring Patterns

### Rename Function/Variable
1. Find all usages: `grep -r "oldName" app/`
2. Update definition and all usages
3. Run typecheck to catch missed references

### Extract Component
1. Identify reusable UI logic
2. Create new component in `app/components/`
3. Replace inline code with component
4. Pass props for customization

### Extract Server Function
1. Identify database/API logic in route
2. Create function in `app/server/`
3. Import and use in route
4. Add proper TypeScript types

### Move File
1. Move file to new location
2. Update all imports using path aliases
3. Run typecheck to verify

## Safety Checklist
- [ ] All usages found and updated
- [ ] TypeScript compiles without errors
- [ ] Tests pass
- [ ] No runtime errors in dev
- [ ] Imports use correct path aliases
