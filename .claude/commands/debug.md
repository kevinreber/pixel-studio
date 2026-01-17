---
description: Investigate and fix a bug or issue
allowed-tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Bash
  - Task
argument-hint: <bug description or error message>
---

# Debug Issue

Investigate and fix: $ARGUMENTS

## Investigation Process

1. **Understand the Problem**
   - What is the expected behavior?
   - What is the actual behavior?
   - Can you reproduce it?

2. **Search for Clues**
   - Search for error messages in the codebase
   - Find related files and functions
   - Check recent changes with `git log`

3. **Trace the Code Path**
   - Start from the entry point (route, component)
   - Follow the data flow through services/server functions
   - Check database queries and external API calls

4. **Common Issue Areas**

   **Authentication Issues**
   - Check `app/services/auth.server.ts`
   - Verify session handling in `app/server/auth.server.ts`

   **API Errors**
   - Check route handlers in `app/routes/api.*`
   - Verify Zod validation schemas
   - Check error responses

   **Database Issues**
   - Check Prisma queries in `app/server/`
   - Verify relations and includes
   - Check for N+1 queries

   **Image Generation Issues**
   - Check queue backend (Kafka/QStash)
   - Verify WebSocket connections
   - Check AI API responses

5. **Fix and Verify**
   - Make minimal changes to fix the issue
   - Run `npm run typecheck`
   - Test the fix manually or with tests

## Debugging Commands

```bash
# Check TypeScript errors
npm run typecheck

# Run specific test
npm run test -- <test-file>

# Check Prisma schema
npx prisma validate

# View database
npx prisma studio
```
