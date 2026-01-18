---
paths:
  - prisma/schema.prisma
---

# Prisma Schema Conventions

When editing the Prisma schema:

## Model Structure

Follow this standard structure:

```prisma
model Example {
  // Primary key
  id        String   @id @default(cuid())

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Required fields
  title     String

  // Optional fields
  description String?

  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Reverse relations
  comments  Comment[]
  likes     Like[]

  // Indexes
  @@index([userId])
  @@index([createdAt])
}
```

## Naming Conventions

- **Models**: PascalCase singular (`User`, `Image`, `Collection`)
- **Fields**: camelCase (`createdAt`, `userId`, `imageUrl`)
- **Relations**: camelCase, descriptive (`user`, `images`, `parentComment`)

## Common Field Types

```prisma
// IDs
id        String   @id @default(cuid())
// or
id        String   @id @default(uuid())

// Timestamps
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Strings
title     String              // Required
subtitle  String?             // Optional
content   String   @db.Text   // Long text

// Numbers
count     Int      @default(0)
price     Float
credits   Int      @default(100)

// Booleans
isPublic  Boolean  @default(true)
isDeleted Boolean  @default(false)

// Enums
status    Status   @default(PENDING)
```

## Relations

### One-to-Many

```prisma
model User {
  id     String  @id
  images Image[]
}

model Image {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### Many-to-Many (Explicit)

```prisma
model Image {
  id          String            @id
  collections CollectionImage[]
}

model Collection {
  id     String            @id
  images CollectionImage[]
}

model CollectionImage {
  imageId      String
  collectionId String
  image        Image      @relation(fields: [imageId], references: [id], onDelete: Cascade)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([imageId, collectionId])
}
```

## After Schema Changes

Always run:

```bash
npx prisma format
npx prisma generate
npx prisma migrate dev --name <description>
```
