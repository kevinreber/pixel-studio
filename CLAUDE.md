# CLAUDE.md - Project Context for Claude Code

This file provides context for Claude Code to work effectively with the Pixel Studio codebase.

## Project Overview

**Pixel Studio** is an AI-powered image generation platform built with Remix. Users can generate images using multiple AI models (DALL-E, Stable Diffusion, Flux), organize them into collections, and interact through social features.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Remix 2.13 + React 18 + TypeScript |
| Styling | TailwindCSS + Radix UI + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | Remix Auth + Google OAuth + Supabase |
| Queue | Apache Kafka (KafkaJS) |
| Cache | Upstash Redis |
| Storage | AWS S3 |
| Real-time | Native WebSocket |
| AI APIs | OpenAI (DALL-E), Hugging Face (SD, Flux) |
| Payments | Stripe |
| Monitoring | Sentry + Vercel Analytics |

## Project Structure

```
app/
├── components/       # Reusable UI components (shadcn/ui based)
├── pages/            # Page-level components
├── routes/           # Remix routes (pages + API endpoints)
│   ├── api.*         # REST API endpoints
│   ├── auth.*        # Authentication routes
│   ├── generate.*    # Image generation pages
│   └── user.*        # User profile pages
├── services/         # Business logic & external integrations
├── server/           # Server-side utilities
│   ├── auth.server.ts
│   ├── kafka.server.ts
│   ├── prisma.server.ts
│   ├── redis.server.ts
│   ├── stripe.server.ts
│   └── websocket.server.ts
├── hooks/            # Custom React hooks
├── schemas/          # Zod validation schemas
├── types/            # TypeScript type definitions
└── utils/            # Shared utilities

infrastructure/kafka/  # Kafka deployment configs
scripts/               # Utility scripts (consumers, websocket, etc.)
prisma/                # Database schema
```

## Path Aliases

Use these TypeScript path aliases:

```typescript
import { something } from "~/utils/something";     // app/
import { Button } from "components/ui/button";     // app/components/
import { getUser } from "server/auth.server";      // app/server/
import { imageService } from "services/image";     // app/services/
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run typecheck        # TypeScript checks
npm run lint             # ESLint

# Testing
npm run test             # Vitest unit tests
npm run test:run         # Run tests once
npm run test:e2e         # Playwright E2E tests

# Database
npx prisma studio        # Visual DB browser
npx prisma db push       # Push schema changes
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create migration

# Kafka (async processing)
npm run kafka:create-topics   # Initialize topics
npm run kafka:consumer        # Start background workers
npm run kafka:websocket       # Start WebSocket server
npm run kafka:health          # Check cluster health

# Payments
npm run stripe:listen    # Local webhook forwarding
```

## Key Patterns

### Adding a New Route

1. Create route file in `app/routes/` following Remix conventions
2. Export `loader` for GET requests, `action` for mutations
3. Use Zod schemas from `app/schemas/` for validation
4. Return data with `json()` or redirect with `redirect()`

```typescript
// app/routes/api.example.ts
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";

const schema = z.object({ name: z.string() });

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = schema.parse(Object.fromEntries(formData));
  // ... business logic
  return json({ success: true });
}
```

### Adding a New Service

1. Create file in `app/services/`
2. Export functions that handle business logic
3. Use Prisma client from `server/prisma.server.ts`
4. Handle errors appropriately

```typescript
// app/services/example.server.ts
import { prisma } from "server/prisma.server";

export async function getExampleById(id: string) {
  return prisma.example.findUnique({ where: { id } });
}
```

### Server-Only Code

Files with `.server.ts` suffix are server-only. Use for:
- Database operations
- External API calls
- Authentication logic
- Sensitive operations

### Component Conventions

- Use shadcn/ui components from `components/ui/`
- Use Radix UI primitives for accessibility
- Style with Tailwind utility classes
- Use `cn()` helper for conditional classes

```typescript
import { cn } from "~/utils/cn";
import { Button } from "components/ui/button";

<Button className={cn("base-class", isActive && "active-class")} />
```

## Database Schema (Key Models)

| Model | Purpose |
|-------|---------|
| User | User accounts with credits, follows |
| Image | Generated images with metadata |
| Collection | User-organized image groups |
| Set | Batch of images from single prompt |
| Comment | Image comments (nested) |
| ImageLike | Like tracking |
| Follow | User follow relationships |

## Processing Modes

### Synchronous (Legacy)
- Set `ENABLE_KAFKA_IMAGE_GENERATION=false`
- Direct API calls, user waits for completion
- Simpler but slower UX

### Asynchronous (Recommended)
- Set `ENABLE_KAFKA_IMAGE_GENERATION=true`
- Kafka queue + WebSocket updates
- Better UX with real-time progress

## Environment Variables

Required variables (see `env.example`):
- `DATABASE_URL` - PostgreSQL connection
- `GOOGLE_CLIENT_ID/SECRET` - OAuth
- `OPENAI_API_KEY` - DALL-E access
- `HUGGINGFACE_API_KEY` - SD/Flux access
- `UPSTASH_REDIS_*` - Cache
- `AWS_*` / `S3_BUCKET_NAME` - Storage
- `STRIPE_*` - Payments
- `KAFKA_*` - Queue (if async mode)

## Code Style

- **TypeScript**: Strict mode, no `any`
- **ESLint**: Airbnb config + custom rules
- **Prettier**: Auto-formatting
- **Commits**: Conventional commits (feat:, fix:, etc.)
- **Naming**: camelCase for variables/functions, PascalCase for components/types

## Testing

- **Unit tests**: Vitest in `tests/` or colocated `*.test.ts`
- **E2E tests**: Playwright in `tests/` or `tests-examples/`
- Run `npm run test` before committing

## Things to Avoid

- Don't use `any` type - use proper typing or `unknown`
- Don't bypass Prisma - always use the singleton from `server/prisma.server.ts`
- Don't hardcode secrets - use environment variables
- Don't skip validation - use Zod schemas for all inputs
- Don't ignore errors - handle them properly or let them bubble up
- Don't use synchronous file operations on the server

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/root.tsx` | Root layout, providers, theme |
| `app/entry.server.tsx` | Server entry point |
| `app/entry.client.tsx` | Client entry point |
| `server.js` | Production Express server |
| `vite.config.ts` | Build configuration |
| `prisma/schema.prisma` | Database schema |

## Documentation

- `README.md` - Setup and overview
- `TECHNICAL_IMPLEMENTATION_GUIDE.md` - Architecture deep dive
- `KAFKA_ENVIRONMENT_SETUP.md` - Kafka configuration
- `CHANGELOG.md` - Version history
- `BUGFIXES.md` - Bug tracking
- `AGENTS.md` - Claude Code agent workflows
