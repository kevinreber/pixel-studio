---
name: database-operation
description: Write Prisma database queries and server functions. Use when creating database operations, queries, migrations, or when the user mentions database, Prisma, query, model, or schema.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Database Operations with Prisma

Create database operations following Pixel Studio's established patterns.

## Prisma Client Import

Always use the singleton client:

```typescript
import { prisma } from "~/services/prisma.server";
```

Never create a new PrismaClient instance directly.

## Server Function Structure

Server functions go in `app/server/` with `.server.ts` suffix:

```typescript
// app/server/getResource.server.ts
import { prisma } from "~/services/prisma.server";

export interface GetResourceResponse {
  resources: Resource[];
  total: number;
}

export async function getResources(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<GetResourceResponse> {
  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.resource.count({ where: { userId } }),
  ]);

  return { resources, total };
}
```

## Common Query Patterns

### Find with Relations

```typescript
const image = await prisma.image.findUnique({
  where: { id: imageId },
  include: {
    user: { select: { id: true, name: true, image: true } },
    comments: {
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    },
    likes: { select: { userId: true } },
    _count: { select: { comments: true, likes: true } },
  },
});
```

### Pagination

```typescript
const pageSize = 20;
const currentPage = 1;

const images = await prisma.image.findMany({
  skip: (currentPage - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: "desc" },
  where: { isPublic: true },
});

const total = await prisma.image.count({ where: { isPublic: true } });
const totalPages = Math.ceil(total / pageSize);
```

### Count Relations

```typescript
const collections = await prisma.collection.findMany({
  where: { userId },
  select: {
    id: true,
    title: true,
    _count: { select: { images: true } },
  },
});

// Access: collection._count.images
```

### Conditional Includes

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    // Only include if imageId provided
    images: imageId
      ? { where: { id: imageId }, select: { id: true } }
      : false,
  },
});
```

### Search with OR Conditions

```typescript
const images = await prisma.image.findMany({
  where: {
    OR: [
      { prompt: { contains: searchTerm, mode: "insensitive" } },
      { title: { contains: searchTerm, mode: "insensitive" } },
    ],
    isPublic: true,
  },
});
```

### Transaction for Multiple Operations

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Deduct credits
  await tx.user.update({
    where: { id: userId },
    data: { credits: { decrement: creditCost } },
  });

  // Create image
  const image = await tx.image.create({
    data: { userId, prompt, url },
  });

  return image;
});
```

## CRUD Operations Pattern

### Create

```typescript
export async function createCollection(
  userId: string,
  data: { title: string; description?: string }
) {
  return prisma.collection.create({
    data: {
      ...data,
      userId,
    },
  });
}
```

### Read

```typescript
export async function getCollectionById(id: string, userId?: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      images: { orderBy: { createdAt: "desc" } },
      _count: { select: { images: true } },
    },
  });

  if (!collection) return null;
  if (!collection.isPublic && collection.userId !== userId) return null;

  return collection;
}
```

### Update

```typescript
export async function updateCollection(
  id: string,
  userId: string,
  data: { title?: string; description?: string }
) {
  return prisma.collection.update({
    where: { id, userId }, // Ensures ownership
    data,
  });
}
```

### Delete

```typescript
export async function deleteCollection(id: string, userId: string) {
  // First remove image associations
  await prisma.collection.update({
    where: { id, userId },
    data: { images: { set: [] } },
  });

  // Then delete collection
  return prisma.collection.delete({
    where: { id, userId },
  });
}
```

## Relationship Operations

### Many-to-Many: Add/Remove

```typescript
// Add image to collection
await prisma.collection.update({
  where: { id: collectionId },
  data: {
    images: { connect: { id: imageId } },
  },
});

// Remove image from collection
await prisma.collection.update({
  where: { id: collectionId },
  data: {
    images: { disconnect: { id: imageId } },
  },
});
```

### Toggle Operation (Like/Unlike)

```typescript
export async function toggleLike(imageId: string, userId: string) {
  const existing = await prisma.imageLike.findUnique({
    where: { userId_imageId: { userId, imageId } },
  });

  if (existing) {
    await prisma.imageLike.delete({
      where: { userId_imageId: { userId, imageId } },
    });
    return { liked: false };
  }

  await prisma.imageLike.create({
    data: { userId, imageId },
  });
  return { liked: true };
}
```

## Schema Reference

Key models in `prisma/schema.prisma`:

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  image       String?
  credits     Int      @default(10)
  images      Image[]
  collections Collection[]
  followers   Follow[] @relation("following")
  following   Follow[] @relation("follower")
}

model Image {
  id          String   @id @default(cuid())
  prompt      String
  url         String
  model       String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  collections Collection[]
  likes       ImageLike[]
  comments    Comment[]
}
```

## Database Commands

```bash
# Visual DB browser
npx prisma studio

# Push schema changes (dev)
npx prisma db push

# Generate client after schema change
npx prisma generate

# Create migration (for production)
npx prisma migrate dev --name description

# Reset database (dev only)
npx prisma migrate reset
```

## Checklist

- [ ] Uses singleton prisma client from `~/services/prisma.server`
- [ ] Server file has `.server.ts` suffix
- [ ] Exports typed response interfaces
- [ ] Uses transactions for multi-step operations
- [ ] Includes proper error handling
- [ ] Verifies ownership before updates/deletes
- [ ] Uses pagination for lists
