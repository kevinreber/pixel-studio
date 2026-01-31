# Pre-Commit Check Command

Run all required checks before committing code changes.

## Usage

Use this command before making any commit to ensure all CI checks will pass.

## Steps

1. **Run Lint Check**

   ```bash
   npm run lint
   ```

   - Fix any ESLint errors before proceeding
   - Use `npm run lint -- --fix` for auto-fixable issues

2. **Run TypeScript Check**

   ```bash
   npm run typecheck
   ```

   - Fix any type errors before proceeding

3. **Run Unit Tests**

   ```bash
   npm run test:run
   ```

   - Ensure all tests pass
   - If tests fail, fix the code or update tests as appropriate

4. **Run Build**
   ```bash
   npm run build
   ```

   - Ensure the production build succeeds

## Quick Check

Run all checks in sequence:

```bash
npm run lint && npm run typecheck && npm run test:run && npm run build
```

## If Checks Fail

- **Do not commit** until all checks pass
- Fix the issues identified by each check
- Re-run the failing check to verify the fix
- Then proceed with the commit

## Required Checks Summary

| Check      | Command             | Must Pass |
| ---------- | ------------------- | --------- |
| Lint       | `npm run lint`      | Yes       |
| TypeCheck  | `npm run typecheck` | Yes       |
| Unit Tests | `npm run test:run`  | Yes       |
| Build      | `npm run build`     | Yes       |
