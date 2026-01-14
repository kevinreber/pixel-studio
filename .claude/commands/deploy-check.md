---
description: Pre-deployment validation checklist
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Pre-Deployment Check

Run comprehensive checks before deploying.

## Automated Checks

Run all verification commands:

```bash
# 1. TypeScript compilation
npm run typecheck

# 2. Linting
npm run lint

# 3. Unit tests
npm run test:run

# 4. Build
npm run build

# 5. Prisma schema validation
npx prisma validate
```

## Manual Review Checklist

### Code Quality
- [ ] No `console.log` statements left in production code
- [ ] No `any` types (search: `as any`, `: any`)
- [ ] No TODO/FIXME comments for critical issues
- [ ] Error handling in place for API calls

### Security
- [ ] No secrets in code (API keys, passwords)
- [ ] All user inputs validated with Zod
- [ ] Protected routes use `requireUserLogin`
- [ ] No SQL injection vulnerabilities

### Database
- [ ] Migrations up to date
- [ ] No breaking schema changes without migration
- [ ] Indexes added for frequently queried fields

### Environment
- [ ] All required env vars documented in `env.example`
- [ ] No hardcoded URLs or config values

### Performance
- [ ] Images optimized
- [ ] No N+1 database queries
- [ ] Proper caching with Redis where needed

## Quick Search Commands

```bash
# Find console.log
grep -r "console.log" app/ --include="*.ts" --include="*.tsx"

# Find any types
grep -r ": any" app/ --include="*.ts" --include="*.tsx"
grep -r "as any" app/ --include="*.ts" --include="*.tsx"

# Find TODOs
grep -r "TODO\|FIXME" app/ --include="*.ts" --include="*.tsx"
```
