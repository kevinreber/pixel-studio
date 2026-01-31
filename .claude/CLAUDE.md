# CLAUDE.md - Project Context for Claude Code

This file provides context for Claude Code to work effectively with the Pixel Studio codebase.

## Project Overview

**Pixel Studio** is an AI-powered image and video generation platform built with Remix. Users can generate images using multiple AI models (DALL-E, Stable Diffusion, Flux, Ideogram, FAL, and more), create videos with Runway/Luma/Stability, organize them into collections, and interact through social features including tipping, achievements, and a prompt marketplace.

## Tech Stack

| Layer       | Technology                                                      |
| ----------- | --------------------------------------------------------------- |
| Framework   | Remix 2.16 + React 18 + TypeScript 5.1                          |
| Styling     | TailwindCSS + Radix UI + shadcn/ui + Lucide Icons               |
| Database    | PostgreSQL + Prisma ORM 5.19                                    |
| Auth        | Remix Auth + Google OAuth + Supabase                            |
| Queue       | Apache Kafka (KafkaJS) + Upstash QStash                         |
| Cache       | Upstash Redis                                                   |
| Storage     | AWS S3                                                          |
| Real-time   | Native WebSocket                                                |
| AI (Images) | OpenAI (DALL-E), Hugging Face (SD, Flux), FAL, Ideogram, Replicate, Together, Black Forest |
| AI (Video)  | Runway ML, Luma AI, Stability AI                                |
| Payments    | Stripe                                                          |
| Monitoring  | Sentry + Vercel Analytics + PostHog                             |
| Testing     | Vitest + Playwright                                             |

## Project Structure

```
app/
├── components/       # 51 UI components (shadcn/ui based)
│   └── ui/           # shadcn/ui primitives
├── config/           # Model definitions & pricing
│   ├── models.ts     # Image model configs
│   ├── videoModels.ts # Video model configs
│   └── pricing.ts    # Credit costs
├── contexts/         # React context providers
├── hooks/            # 6 custom React hooks
├── pages/            # 11 page-level components
├── routes/           # 80+ Remix routes (pages + API)
│   ├── api.*         # REST API endpoints (40+)
│   ├── auth.*        # Authentication routes
│   ├── admin.*       # Admin dashboard routes
│   ├── generate.*    # Image generation pages
│   ├── create.*      # Creation interfaces
│   └── user.*        # User profile pages
├── schemas/          # Zod validation schemas
├── server/           # 57 server-side utilities
├── services/         # 30+ business logic services
├── types/            # TypeScript type definitions
├── utils/            # 30+ shared utilities
└── client/           # Client-side utilities

infrastructure/kafka/  # Kafka deployment configs (Docker, AWS MSK)
scripts/               # Background workers & utilities
prisma/                # Database schema (42 models)
tests/                 # Playwright E2E tests
.github/workflows/     # CI/CD pipelines
```

## Path Aliases

```typescript
import { something } from "~/utils/something";     // app/
import { Button } from "components/ui/button";     // app/components/
import { getUser } from "server/auth.server";      // app/server/
import { imageService } from "services/image";     // app/services/
import { cn } from "@/lib/utils";                  // app/
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run typecheck        # TypeScript checks
npm run lint             # ESLint

# Testing
npm run test             # Vitest unit tests (watch mode)
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
npm run kafka:monitor         # Monitor Kafka metrics

# Payments
npm run stripe:listen    # Local webhook forwarding
```

## Routes Overview

### Core Pages
| Route | Purpose |
| ----- | ------- |
| `_index.tsx` | Landing page |
| `create.tsx` | Image generation interface |
| `create-video.tsx` | Video generation interface |
| `explore._index.tsx` | Browse all images |
| `explore.$imageId.tsx` | Image detail page |
| `explore.video.$videoId.tsx` | Video detail page |
| `feed._index.tsx` | Following feed |
| `profile.$userId._index.tsx` | User profile |
| `collections._index.tsx` | User collections |
| `sets.$setId.tsx` | Generation batch details |
| `marketplace.tsx` | Prompt marketplace |
| `trending.tsx` | Trending content |
| `checkout.tsx` | Credit purchase |
| `settings.tsx` | User settings |

### Admin Routes
| Route | Purpose |
| ----- | ------- |
| `admin._index.tsx` | Admin dashboard home |
| `admin.users.tsx` | User management |
| `admin.credits.tsx` | Credit management |
| `admin.models.tsx` | AI model management |
| `admin.tokens.tsx` | External API token management |
| `admin.external-services.tsx` | External services monitoring |
| `admin.engagement.tsx` | Engagement analytics |
| `admin.deletion-logs.tsx` | Image deletion audit logs |

### API Endpoints (40+)
- **Images**: `/api/images/$imageId.*` (like, remix, tags, comments, delete)
- **Videos**: `/api/videos.$videoId.*` (like, comments)
- **Collections**: `/api/collections.*` (CRUD, add/remove images, premium)
- **Marketplace**: `/api/marketplace.prompts.*` (list, purchase, reviews)
- **Queue**: `/api/queue.*` (process-image, status)
- **Notifications**: `/api/notifications.*`
- **Users**: `/api/users.$userId.*` (follow, followers, following)
- **Admin**: `/api/admin.*` (images, user credits)
- **Tips**: `/api/tips.send.ts`
- **Achievements**: `/api/achievements.ts`
- **Streaks**: `/api/streaks.ts`
- **Trending**: `/api/trending.ts`

## Key Services

### Image Generation
| Service | Purpose |
| ------- | ------- |
| `imageGenerationProducer.server.ts` | Kafka producer for image jobs |
| `imageGenerationWorker.server.ts` | Worker processing image generation |
| `processingStatus.server.ts` | Track generation status |

### Video Generation
| Service | Purpose |
| ------- | ------- |
| `videoGenerationProducer.server.ts` | Kafka producer for video jobs |
| `videoGenerationWorker.server.ts` | Worker processing video generation |

### Monetization
| Service | Purpose |
| ------- | ------- |
| `stripe.server.ts` | Payment processing |
| `marketplace.server.ts` | Prompt marketplace |
| `tipping.server.ts` | User-to-user tipping |
| `premiumCollections.server.ts` | Premium collection features |
| `creditTransaction.server.ts` | Credit ledger tracking |
| `externalTokens.server.ts` | External service token management |

### Infrastructure
| Service | Purpose |
| ------- | ------- |
| `kafka.server.ts` | Kafka client & topic management |
| `qstash.server.ts` | Upstash QStash alternative queue |
| `websocket.server.ts` | WebSocket connection management |
| `redis.server.ts` | Redis/Upstash caching |

## Server Utilities (app/server/)

### Image Providers
- `createNewDallEImages.ts` - DALL-E 2/3 generation
- `createNewStableDiffusionImages.ts` - Stable Diffusion
- `createHuggingFaceImages.ts` - Hugging Face models
- `createBlackForestImages.ts` - Black Forest AI
- `createReplicateImages.ts` - Replicate API
- `createIdeogramImages.ts` - Ideogram
- `createFalImages.ts` - FAL AI
- `createTogetherImages.ts` - Together AI

### Video Providers
- `createRunwayVideo.ts` - Runway ML
- `createLumaVideo.ts` - Luma AI
- `createStabilityVideo.ts` - Stability AI

### Core Operations
- `createNewImage.ts` / `createNewImages.ts` - Image creation
- `createNewSet.ts` - Batch grouping
- `deleteImage.ts` / `deleteSet.ts` - Deletion
- `getImage.ts` / `getImages.ts` - Retrieval
- `addBase64EncodedImageToAWS.ts` - S3 upload
- `storeSourceImage.server.ts` - Source image storage

### User & Social
- `createNewUser.ts` - User registration
- `getLoggedInUserData.ts` - Current user data
- `createFollow.server.ts` / `deleteFollow.server.ts` - Follow system
- `createImageLike.server.ts` / `deleteImageLike.server.ts` - Like system
- `createComment.ts` / `deleteComment.ts` - Comments
- `createNotification.server.ts` - Notifications

## Database Schema (Key Models)

### Core Models (42 total)
| Model | Purpose |
| ----- | ------- |
| `User` | User accounts with credits, analytics |
| `Image` | Generated images with metadata, remixing |
| `Video` | Generated videos with status tracking |
| `Set` | Batch of generation results |
| `Collection` | User-organized image groups |

### Social Models
| Model | Purpose |
| ----- | ------- |
| `Comment` / `VideoComment` | Nested comments |
| `ImageLike` / `VideoLike` | Content reactions |
| `Follow` | User relationships |
| `Notification` | Activity notifications |
| `Tip` | User tipping |

### Monetization Models
| Model | Purpose |
| ----- | ------- |
| `CreditTransaction` | Credit ledger |
| `MarketplacePrompt` | Prompt marketplace items |
| `PromptPurchase` | Purchase records |
| `CreatorEarnings` / `Payout` | Creator earnings |
| `PrintProduct` / `PrintOrder` | Print on demand |

### Analytics Models
| Model | Purpose |
| ----- | ------- |
| `UserAnalytics` | Daily/weekly/monthly stats |
| `GenerationLog` | Detailed generation records |
| `ImageDeletionLog` | Admin audit trail |
| `Achievement` / `UserAchievement` | Gamification |
| `LoginStreak` | Daily login tracking |

## Key Patterns

### Adding a New Route

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

```typescript
import { cn } from "~/utils/cn";
import { Button } from "components/ui/button";

<Button className={cn("base-class", isActive && "active-class")} />
```

### Caching Pattern

```typescript
import { cache } from "~/utils/cache.server";

// Cache with TTL
const data = await cache.get("key", async () => {
  return await expensiveOperation();
}, { ttl: 300 }); // 5 minutes
```

## Processing Modes

### Synchronous (Legacy)
- Set `ENABLE_KAFKA_IMAGE_GENERATION=false`
- Direct API calls, user waits for completion
- Simpler but slower UX

### Asynchronous (Recommended)
- Set `ENABLE_KAFKA_IMAGE_GENERATION=true`
- Kafka queue + WebSocket updates
- Better UX with real-time progress
- Requires running: `npm run kafka:consumer` and `npm run kafka:websocket`

## Environment Variables

Required variables (see `env.example`):

```bash
# Database
DATABASE_URL=                    # PostgreSQL connection

# Authentication
GOOGLE_CLIENT_ID=                # Google OAuth
GOOGLE_CLIENT_SECRET=
SUPABASE_URL=                    # Supabase
SUPABASE_ANON_KEY=

# AI Services (Images)
OPENAI_API_KEY=                  # DALL-E
HUGGINGFACE_API_KEY=             # SD/Flux
FAL_KEY=                         # FAL AI
REPLICATE_API_TOKEN=             # Replicate
IDEOGRAM_API_KEY=                # Ideogram
TOGETHER_API_KEY=                # Together AI
BFL_API_KEY=                     # Black Forest Labs

# AI Services (Video)
RUNWAY_API_KEY=                  # Runway ML
LUMAAI_API_KEY=                  # Luma AI
STABILITY_API_KEY=               # Stability AI

# Infrastructure
UPSTASH_REDIS_REST_URL=          # Redis cache
UPSTASH_REDIS_REST_TOKEN=
AWS_ACCESS_KEY_ID=               # S3 storage
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# Payments
STRIPE_SECRET_KEY=               # Stripe
STRIPE_WEBHOOK_SECRET=

# Queue (if async mode)
KAFKA_BROKERS=
KAFKA_USERNAME=
KAFKA_PASSWORD=
ENABLE_KAFKA_IMAGE_GENERATION=   # true/false
```

## Code Style

- **TypeScript**: Strict mode, no `any` - use proper typing or `unknown`
- **ESLint**: Airbnb config + custom rules
- **Prettier**: Auto-formatting
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- **Naming**:
  - camelCase for variables/functions
  - PascalCase for components/types/models
  - `.server.ts` suffix for server-only files
  - `.test.ts` / `.test.tsx` for tests

## Testing

### Unit Tests (Vitest)
- Located in `tests/` or colocated as `*.test.ts`
- Run with `npm run test` (watch) or `npm run test:run` (once)

### E2E Tests (Playwright)
- Located in `tests/` directory
- Run with `npm run test:e2e`
- Configuration optimized for CI (4 workers, Chromium default)

Key test files:
- `pages.spec.ts` - Page routing
- `create-video.spec.ts` - Video creation flow
- `notifications.spec.ts` - Notification system
- `user-retention.spec.ts` - Streaks & achievements
- `admin-image-deletion.spec.ts` - Admin audit

## Pre-Commit Requirements

**IMPORTANT**: Before creating any commit, you MUST ensure all of the following checks pass:

```bash
# Required checks (run in order)
npm run lint          # ESLint - must pass with no errors
npm run typecheck     # TypeScript - must pass with no errors
npm run test:run      # Unit tests - must pass
npm run build         # Build - must succeed
```

### Quick Pre-Commit Command

Run all checks at once:

```bash
npm run lint && npm run typecheck && npm run test:run && npm run build
```

### What Each Check Validates

| Check      | Command             | Purpose                                    |
| ---------- | ------------------- | ------------------------------------------ |
| Lint       | `npm run lint`      | Code style, best practices, potential bugs |
| TypeCheck  | `npm run typecheck` | Type safety, catches type errors           |
| Unit Tests | `npm run test:run`  | Ensures existing functionality works       |
| Build      | `npm run build`     | Verifies production build succeeds         |

### CI Pipeline Checks

These checks run automatically on every PR:

1. **Lint** - ESLint validation
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Vitest with coverage
4. **Build** - Production build (depends on lint + typecheck)
5. **Security Scan** - CodeQL static analysis
6. **Dependency Review** - Vulnerability scanning for new dependencies

### If a Check Fails

- **Lint errors**: Fix the reported issues or run `npm run lint -- --fix` for auto-fixable issues
- **Type errors**: Fix the TypeScript errors shown in the output
- **Test failures**: Fix the failing tests or update them if behavior changed intentionally
- **Build failures**: Usually caused by lint/type errors - fix those first

## Things to Avoid

- Don't use `any` type - use proper typing or `unknown`
- Don't bypass Prisma - always use the singleton from `server/prisma.server.ts`
- Don't hardcode secrets - use environment variables
- Don't skip validation - use Zod schemas for all inputs
- Don't ignore errors - handle them properly or let them bubble up
- Don't use synchronous file operations on the server
- Don't commit `.env` files or credentials

## Key Files Reference

| File | Purpose |
| ---- | ------- |
| `app/root.tsx` | Root layout, providers, theme |
| `app/entry.server.tsx` | Server entry point |
| `app/entry.client.tsx` | Client entry point |
| `server.js` | Production Express server |
| `vite.config.ts` | Build configuration |
| `prisma/schema.prisma` | Database schema (42 models) |
| `app/config/models.ts` | Image model definitions |
| `app/config/videoModels.ts` | Video model definitions |
| `app/config/pricing.ts` | Credit costs |

## Infrastructure

### Kafka Setup
```bash
# Local development (Docker)
cd infrastructure/kafka
docker-compose -f docker-compose.kafka.yml up -d

# Create topics
npm run kafka:create-topics

# Start workers
npm run kafka:consumer
npm run kafka:websocket
```

### Background Scripts
| Script | Purpose |
| ------ | ------- |
| `scripts/startConsumers.ts` | Kafka consumer workers |
| `scripts/startWebSocketServer.ts` | WebSocket server |
| `scripts/createKafkaTopics.ts` | Topic initialization |
| `scripts/checkKafkaHealth.ts` | Health monitoring |
| `scripts/monitorKafka.ts` | Metrics monitoring |

## Documentation

| File | Purpose |
| ---- | ------- |
| `README.md` | Setup and overview |
| `TECHNICAL_IMPLEMENTATION_GUIDE.md` | Architecture deep dive |
| `API.md` | API documentation |
| `ARCHITECTURE.md` | System architecture |
| `TESTING.md` | Testing guide |
| `DEVELOPMENT.md` | Development setup |
| `CONTRIBUTING.md` | Contribution guidelines |
| `CHANGELOG.md` | Version history |
| `BUGFIXES.md` | Bug tracking |
| `CACHING_STRATEGY.md` | Caching approach |
| `KAFKA_ENVIRONMENT_SETUP.md` | Kafka configuration |
| `IMPROVEMENT_STRATEGY.md` | Planned improvements |

## CI/CD Workflows

| Workflow | Purpose |
| -------- | ------- |
| `ci.yml` | Main CI pipeline |
| `playwright.yml` | E2E test runner |
| `autobuild.yml` | Auto-build on changes |
| `ci-failure-auto-fix.yml` | Automated fixes |
| `docs-check.yml` | Documentation validation |
| `pr-review-comprehensive.yml` | PR review automation |

## Recent Features

- Multi-model image comparison
- Image remixing functionality
- Video generation (Runway, Luma, Stability)
- Admin token management dashboard
- External service monitoring
- Prompt marketplace with reviews
- Creator earnings and payouts
- Print on demand integration
- User achievements and login streaks
- AI-powered image tagging
- Advanced analytics dashboards
