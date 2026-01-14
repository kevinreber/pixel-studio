---
description: Create and apply Prisma database migrations
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: <migration name or description>
---

# Database Migration

Create a database migration for: $ARGUMENTS

## Process

1. **Review Current Schema**
   - Read `prisma/schema.prisma`
   - Understand existing models and relationships

2. **Make Schema Changes**
   - Edit `prisma/schema.prisma` with the required changes
   - Follow existing naming conventions (camelCase for fields)
   - Add proper relations and indexes

3. **Generate Migration**
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```

4. **Update Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Verify**
   - Check migration file in `prisma/migrations/`
   - Run `npx prisma studio` to view changes (optional)

## Schema Conventions

```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

## Key Models Reference
- User - User accounts with credits
- Image - Generated images
- Collection - User-organized groups
- Set - Batch generations
- Comment - Nested comments
- ImageLike/CommentLike - Like tracking
- Follow - Social relationships
