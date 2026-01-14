---
description: Run tests and analyze coverage for specific areas
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
argument-hint: <file, feature, or "all">
---

# Test Coverage Analysis

Analyze test coverage for: $ARGUMENTS

## Commands

### Run All Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm run test -- <path/to/file.test.ts>
```

### Run Tests Matching Pattern
```bash
npm run test -- --grep "<pattern>"
```

### Run E2E Tests
```bash
npm run test:e2e
```

## Coverage Analysis

After running coverage, check:

1. **Coverage Report**
   - Look at `coverage/` directory
   - Open `coverage/index.html` in browser

2. **Key Metrics**
   - Statements: % of code statements executed
   - Branches: % of if/else branches taken
   - Functions: % of functions called
   - Lines: % of lines executed

3. **Priority Areas**
   - Server functions in `app/server/` - business logic
   - Utils in `app/utils/` - shared helpers
   - Schemas in `app/schemas/` - validation logic

## Test File Patterns

| Code Location | Test Location |
|---------------|---------------|
| `app/utils/foo.ts` | `app/utils/foo.test.ts` |
| `app/server/bar.ts` | `app/server/bar.test.ts` |
| Pages/routes | `tests/pages.spec.ts` (E2E) |
| API endpoints | `tests/api.spec.ts` (E2E) |

## Missing Test Identification

Find files without tests:
```bash
# List all .ts files without corresponding .test.ts
find app -name "*.ts" ! -name "*.test.ts" ! -name "*.server.ts" -type f
```
