# CLAUDE.md - Project Context for Claude Code

This file provides context for Claude Code to work effectively with the Pixel Studio codebase.

## Project Overview

**Pixel Studio** is an AI-powered image and video generation platform built with Remix. Users can generate images using multiple AI models (DALL-E, Stable Diffusion, Flux, Ideogram, FAL, and more), create videos with Runway/Luma/Stability, organize them into collections, and interact through social features including tipping, achievements, a prompt marketplace, and a blog/tutorial system.

## Tech Stack

| Layer       | Technology                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------ |
| Framework   | Remix 2.16 + React 18 + TypeScript 5.1                                                     |
| Styling     | TailwindCSS 3 + Radix UI + shadcn/ui + Lucide Icons                                        |
| Database    | PostgreSQL + Prisma ORM 5.19                                                               |
| Auth        | Remix Auth + Google OAuth + Supabase (v2 auth migration in progress)                       |
| State       | Zustand (client state) + React Context (generation progress)                               |
| Queue       | Apache Kafka (KafkaJS) + Upstash QStash                                                    |
| Cache       | Upstash Redis                                                                              |
| Storage     | AWS S3                                                                                     |
| Real-time   | Native WebSocket                                                                           |
| AI (Images) | OpenAI (DALL-E), Hugging Face (SD, Flux), FAL, Ideogram, Replicate, Together, Black Forest |
| AI (Video)  | Runway ML, Luma AI, Stability AI                                                           |
| Payments    | Stripe                                                                                     |
| Logging     | Winston + OpenTelemetry (OTLP HTTP exporter)                                               |
| Monitoring  | Sentry + Vercel Analytics + PostHog                                                        |
| Testing     | Vitest 4 + Playwright                                                                      |
| Git Hooks   | Husky + lint-staged                                                                        |
| Build       | Vite 5 + Remix Vite plugin (with v3 future flags)                                          |
| Deploy      | Vercel (with Express production server option)                                             |

## Project Structure

```
app/
├── components/       # 55 UI components (shadcn/ui based)
│   ├── ui/           # shadcn/ui primitives (4: alert-dialog, badge, dialog, switch)
│   └── skeletons/    # Loading skeleton components
├── config/           # 5 config files (models, video models, pricing, breakpoints, build logs)
├── contexts/         # React context providers (GenerationProgressContext)
├── hooks/            # 6 custom React hooks
├── pages/            # 12 page-level components
├── routes/           # 96 Remix routes (pages + API)
│   ├── api.*         # REST API endpoints (47)
│   ├── auth.*        # Authentication routes (7, includes v2 Supabase auth)
│   ├── admin.*       # Admin dashboard routes (13, includes blog management)
│   ├── create.*      # Creation interfaces
│   ├── explore.*     # Browse/detail pages
│   ├── blog.*        # Blog/tutorial pages
│   ├── profile.*     # User profile pages
│   └── settings.*    # Settings sub-pages
├── schemas/          # 3 Zod validation schemas
├── server/           # 74 server-side utilities
├── services/         # 35 business logic services
├── types/            # 2 TypeScript type definition files
├── utils/            # 34 shared utilities
└── client/           # 3 client-side utilities

infrastructure/kafka/  # Kafka deployment configs (Docker, AWS MSK)
scripts/               # 7 background workers & utility scripts
prisma/                # Database schema (43 models)
tests/                 # 12 Playwright E2E test files
.github/workflows/     # 10 CI/CD pipeline configs
```

## Path Aliases

Defined in `tsconfig.json`:

```typescript
import { something } from "~/utils/something"; // app/
import { Button } from "components/ui/button"; // app/components/
import { getUser } from "server/auth.server"; // app/server/
import { imageService } from "services/image"; // app/services/
import { cn } from "@/lib/utils"; // app/
import { schema } from "schema/collection"; // app/schema/
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build (remix vite:build)
npm run start            # Start production server (remix-serve)
npm run typecheck        # TypeScript checks (tsc)
npm run lint             # ESLint (with flat config disabled)

# Testing
npm run test             # Vitest unit tests (watch mode)
npm run test:run         # Run tests once
npm run test:coverage    # Vitest with coverage (v8)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright with UI mode

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
npm run stripe:listen    # Local webhook forwarding (port 5173)

# Utilities
npm run video:backfill-thumbnails  # Backfill video thumbnails
npm run queue:websocket            # Start WebSocket server (alias)
```

## Routes Overview

### Core Pages

| Route                             | Purpose                        |
| --------------------------------- | ------------------------------ |
| `_index.tsx`                      | Landing page                   |
| `create.tsx`                      | Image generation interface     |
| `create-video.tsx`                | Video generation interface     |
| `explore._index.tsx`              | Browse all images              |
| `explore.$imageId.tsx`            | Image detail page              |
| `explore.video.$videoId.tsx`      | Video detail page              |
| `feed._index.tsx`                 | Following feed                 |
| `profile.$userId._index.tsx`      | User profile                   |
| `profile.$userId.sets.tsx`        | User's generation sets         |
| `collections._index.tsx`          | User collections list          |
| `collections.$collectionId.tsx`   | Collection detail page         |
| `sets.$setId.tsx`                 | Generation batch details       |
| `sets._index.tsx`                 | Sets listing page              |
| `marketplace.tsx`                 | Prompt marketplace             |
| `trending.tsx`                    | Trending content               |
| `checkout.tsx`                    | Credit purchase                |
| `settings.tsx`                    | User settings                  |
| `settings.credit-history.tsx`     | Credit transaction history     |
| `settings.generation-history.tsx` | Generation history             |
| `achievements.tsx`                | User achievements page         |
| `compare.$requestId.tsx`          | Multi-model comparison results |
| `processing.$requestId.tsx`       | Generation processing status   |
| `likes._index.tsx`                | User's liked images            |
| `users._index.tsx`                | User directory                 |
| `user.analytics.tsx`              | User analytics dashboard       |
| `login.tsx`                       | Login page                     |
| `whats-new.tsx`                   | What's new / changelog page    |
| `p.$imageId.tsx`                  | Short image URL redirect       |
| `health.tsx`                      | Health check endpoint          |
| `sitemap[.]xml.tsx`               | Dynamic sitemap generation     |

### Blog Routes

| Route             | Purpose              |
| ----------------- | -------------------- |
| `blog._index.tsx` | Blog listing page    |
| `blog.$slug.tsx`  | Individual blog post |

### Admin Routes

| Route                         | Purpose                       |
| ----------------------------- | ----------------------------- |
| `admin.tsx`                   | Admin layout wrapper          |
| `admin._index.tsx`            | Admin dashboard home          |
| `admin.users.tsx`             | User management               |
| `admin.credits.tsx`           | Credit management             |
| `admin.models.tsx`            | AI model management           |
| `admin.tokens.tsx`            | External API token management |
| `admin.external-services.tsx` | External services monitoring  |
| `admin.engagement.tsx`        | Engagement analytics          |
| `admin.deletion-logs.tsx`     | Image deletion audit logs     |
| `admin.blog.tsx`              | Blog post management          |
| `admin.blog.$postId.tsx`      | Blog post editor              |

### Authentication Routes

| Route                         | Purpose                    |
| ----------------------------- | -------------------------- |
| `auth.google.ts`              | Google OAuth initiation    |
| `auth.google.callback.ts`     | Google OAuth callback      |
| `auth.callback.tsx`           | Auth callback page         |
| `auth.logout.ts`              | Logout handler             |
| `auth.v2.google.ts`           | Supabase Google OAuth (v2) |
| `auth.v2.callback-google.tsx` | Supabase callback (v2)     |
| `auth.v2.logout.ts`           | Supabase logout (v2)       |

### API Endpoints (47)

- **Images**: `api.images.$imageId.*` (like, remix, tags, comments, comment likes, delete)
- **Videos**: `api.videos.$videoId.*` (like, comments, comment likes)
- **Collections**: `api.collections.*` (CRUD, add/remove images, premium, check-image)
- **Marketplace**: `api.marketplace.prompts.*` (list, purchase)
- **Queue**: `api.queue.*` (process-image, status)
- **Processing**: `api.processing.$requestId` (generation progress tracking)
- **Notifications**: `api.notifications.*` (list, read, delete)
- **Users**: `api.users.$userId.*` (follow, followers, following)
- **User Analytics**: `api.user.analytics.*` (dashboard, style-fingerprint)
- **User Images**: `api.user.images` (user's image list)
- **Admin**: `api.admin.*` (images, user credits)
- **Tips**: `api.tips.send`
- **Achievements**: `api.achievements`
- **Streaks**: `api.streaks`
- **Trending**: `api.trending`
- **Print**: `api.print.*` (products, orders, calculate)
- **Cache**: `api.cache.clear`
- **Webhook**: `webhook` (Stripe webhook handler)

## Key Services (app/services/)

### Image Generation

| Service                             | Purpose                            |
| ----------------------------------- | ---------------------------------- |
| `imageGenerationProducer.server.ts` | Kafka producer for image jobs      |
| `imageGenerationWorker.server.ts`   | Worker processing image generation |
| `imageQueue.server.ts`              | Image queue management             |
| `processingStatus.server.ts`        | Track generation status            |

### Video Generation

| Service                             | Purpose                            |
| ----------------------------------- | ---------------------------------- |
| `videoGenerationProducer.server.ts` | Kafka producer for video jobs      |
| `videoGenerationWorker.server.ts`   | Worker processing video generation |
| `videoQueue.server.ts`              | Video queue management             |

### Monetization

| Service                        | Purpose                           |
| ------------------------------ | --------------------------------- |
| `stripe.server.ts`             | Payment processing                |
| `marketplace.server.ts`        | Prompt marketplace                |
| `tipping.server.ts`            | User-to-user tipping              |
| `premiumCollections.server.ts` | Premium collection features       |
| `creditTransaction.server.ts`  | Credit ledger tracking            |
| `externalTokens.server.ts`     | External service token management |
| `printOnDemand.server.ts`      | Print-on-demand integration       |

### Analytics & Tracking

| Service                       | Purpose                    |
| ----------------------------- | -------------------------- |
| `analytics.server.ts`         | User analytics computation |
| `adminAnalytics.server.ts`    | Admin-level analytics      |
| `analyticsInsights.server.ts` | Analytics insights engine  |
| `generationLog.server.ts`     | Generation request logging |
| `imageDeletionLog.server.ts`  | Admin image deletion audit |

### Content & Engagement

| Service                  | Purpose                      |
| ------------------------ | ---------------------------- |
| `blog.server.ts`         | Blog post CRUD operations    |
| `trending.server.ts`     | Trending content computation |
| `achievements.server.ts` | Achievement system           |
| `loginStreak.server.ts`  | Login streak tracking        |
| `imageTagging.server.ts` | AI-powered image tagging     |

### Infrastructure

| Service               | Purpose                          |
| --------------------- | -------------------------------- |
| `kafka.server.ts`     | Kafka client & topic management  |
| `qstash.server.ts`    | Upstash QStash alternative queue |
| `websocket.server.ts` | WebSocket connection management  |
| `redis.server.ts`     | Redis/Upstash caching            |
| `webhook.server.ts`   | Webhook processing               |

### Core

| Service              | Purpose                 |
| -------------------- | ----------------------- |
| `auth.server.ts`     | Authentication logic    |
| `session.server.ts`  | Session management      |
| `prisma.server.ts`   | Prisma client singleton |
| `supabase.server.ts` | Supabase client         |

## Server Utilities (app/server/)

### Image Providers (8)

- `createNewDallEImages.ts` - DALL-E 2/3 generation
- `createNewStableDiffusionImages.ts` - Stable Diffusion
- `createHuggingFaceImages.ts` - Hugging Face models
- `createBlackForestImages.ts` - Black Forest AI
- `createReplicateImages.ts` - Replicate API
- `createIdeogramImages.ts` - Ideogram
- `createFalImages.ts` - FAL AI
- `createTogetherImages.ts` - Together AI

### Video Providers (3)

- `createRunwayVideo.ts` - Runway ML
- `createLumaVideo.ts` - Luma AI
- `createStabilityVideo.ts` - Stability AI

### Core Operations

- `createNewImage.ts` / `createNewImages.ts` - Image creation
- `createNewVideo.ts` / `createNewVideos.ts` - Video creation
- `createNewSet.ts` - Batch grouping
- `deleteImage.ts` / `deleteSet.ts` - Deletion
- `getImage.ts` / `getImages.ts` / `getImageBase64.ts` - Retrieval
- `getImageBlobFromS3.ts` / `getImageCollection.ts` - S3 / collection retrieval
- `getSet.ts` / `getUserSets.ts` - Set retrieval
- `getLikedImages.ts` - Liked images retrieval
- `getUserCollections.ts` - User collection retrieval
- `getVideo.ts` - Video retrieval
- `addBase64EncodedImageToAWS.ts` - S3 image upload
- `addVideoToS3.server.ts` - S3 video upload
- `extractVideoThumbnail.server.ts` - Video thumbnail extraction
- `storeSourceImage.server.ts` - Source image storage

### User & Social

- `createNewUser.ts` - User registration
- `getLoggedInUserData.ts` - Current user data
- `getUserData.ts` / `getUserDataByUserId.ts` / `getUserDataByUsername.ts` - User lookup
- `getUserFollowData.server.ts` - Follow relationship data
- `searchUsers.server.ts` - User search
- `createFollow.server.ts` / `deleteFollow.server.ts` - Follow system
- `createImageLike.server.ts` / `deleteImageLike.server.ts` - Image like system
- `createVideoLike.server.ts` / `deleteVideoLike.server.ts` - Video like system
- `createComment.ts` / `deleteComment.ts` - Image comments
- `createVideoComment.ts` / `deleteVideoComment.ts` - Video comments
- `commentLikes.ts` / `videoCommentLikes.ts` - Comment like system
- `updateUserCredits.ts` - Credit balance updates
- `isAdmin.server.ts` - Admin role check

### Notifications (app/server/notifications/)

- `createNotification.server.ts` - Create notifications
- `deleteNotification.server.ts` - Delete notifications
- `getNotifications.server.ts` - Fetch notifications
- `markNotificationRead.server.ts` - Mark as read

## Database Schema (43 Models)

### Core Models

| Model                | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `User`               | User accounts with credits, feature flags, analytics |
| `Account`            | OAuth provider accounts                              |
| `Session`            | User sessions                                        |
| `Password`           | Password hashes                                      |
| `Prompt`             | Prompt history/transformations                       |
| `Permission`         | Permission definitions                               |
| `Role`               | Role-based access control                            |
| `Image`              | Generated images with full metadata, remix lineage   |
| `Video`              | Generated videos with status tracking                |
| `Set`                | Batch of generation results                          |
| `Collection`         | User-organized image groups (with premium support)   |
| `CollectionHasImage` | Collection-image join table                          |

### Social Models

| Model                              | Purpose                           |
| ---------------------------------- | --------------------------------- |
| `Comment` / `VideoComment`         | Nested comments (image & video)   |
| `ImageLike` / `VideoLike`          | Content reactions                 |
| `CommentLike` / `VideoCommentLike` | Comment reactions                 |
| `Follow`                           | User relationships                |
| `Notification`                     | Activity notifications (12 types) |
| `Tip`                              | User-to-user tipping              |

### Monetization Models

| Model                         | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `CreditTransaction`           | Credit ledger (purchase, spend, refund, admin, bonus) |
| `MarketplacePrompt`           | Prompt marketplace items                              |
| `PromptPurchase`              | Purchase records                                      |
| `PromptReview`                | Marketplace prompt reviews                            |
| `CollectionPurchase`          | Premium collection purchases                          |
| `CreatorEarnings` / `Payout`  | Creator earnings & payouts                            |
| `PrintProduct` / `PrintOrder` | Print on demand                                       |

### Analytics Models

| Model              | Purpose                        |
| ------------------ | ------------------------------ |
| `UserAnalytics`    | Daily/weekly/monthly stats     |
| `PromptAnalytics`  | Per-prompt performance metrics |
| `StyleFingerprint` | User style analysis            |
| `GenerationLog`    | Detailed generation records    |
| `ImageDeletionLog` | Admin audit trail              |

### Engagement Models

| Model                             | Purpose              |
| --------------------------------- | -------------------- |
| `Achievement` / `UserAchievement` | Gamification system  |
| `LoginStreak`                     | Daily login tracking |

### Smart Tagging

| Model            | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `ImageTag`       | AI-generated image tags with confidence     |
| `ImageAttribute` | Image attributes (color, style, mood, etc.) |

### Content

| Model      | Purpose                                |
| ---------- | -------------------------------------- |
| `BlogPost` | Blog posts/tutorials with SEO metadata |

### Multi-Model Comparison

| Model                  | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `ComparisonRequest`    | Parent request for multi-model generation |
| `ComparisonGeneration` | Individual generation within a comparison |

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
const data = await cache.get(
  "key",
  async () => {
    return await expensiveOperation();
  },
  { ttl: 300 },
); // 5 minutes
```

### State Management

```typescript
// Client state with Zustand
import { create } from "zustand";

const useStore = create((set) => ({
  // ...state
}));

// Generation progress with React Context
import { useGenerationProgress } from "~/contexts/GenerationProgressContext";
```

### Toast Notifications

```typescript
// Using Sonner for toast notifications
import { toast } from "sonner";

toast.success("Image generated!");
toast.error("Generation failed");
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

## Vite Configuration

The project uses Remix v3 future flags for forward compatibility:

```typescript
// vite.config.ts
future: {
  v3_fetcherPersist: true,
  v3_relativeSplatPath: true,
  v3_throwAbortReason: true,
  v3_singleFetch: true,
}
```

Also uses:

- `@vercel/remix/vite` preset for Vercel deployment
- `@sentry/vite-plugin` for source map uploads
- `vite-tsconfig-paths` for path alias resolution

## Environment Variables

Required variables (see `env.example`):

```bash
# Database
DATABASE_URL=                    # PostgreSQL connection
DIRECT_URL=                      # Direct DB connection (Prisma)

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

# Monitoring
SENTRY_ORG=                      # Sentry
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

## Code Style

- **TypeScript**: Strict mode, no `any` - use proper typing or `unknown`
- **ESLint**: Airbnb-style config with TypeScript, React, JSX-a11y, import plugins
- **Prettier**: Auto-formatting (enforced via lint-staged)
- **Husky**: Pre-commit hooks run lint-staged automatically
- **lint-staged**: Auto-fixes `*.{ts,tsx}` with ESLint, formats `*.{json,md,css}` with Prettier
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- **Naming**:
  - camelCase for variables/functions
  - PascalCase for components/types/models
  - `.server.ts` suffix for server-only files
  - `.test.ts` / `.test.tsx` for unit tests
  - `.spec.ts` for E2E tests
- **Node.js**: Requires >= 20.0.0

## Testing

### Unit Tests (Vitest 4)

- Colocated with source files as `*.test.ts` / `*.test.tsx`
- Run with `npm run test` (watch) or `npm run test:run` (once)
- Coverage via `@vitest/coverage-v8`
- Uses `@testing-library/react` and `@testing-library/jest-dom`
- JSDOM environment for component tests
- 21+ unit test files across server/, services/, utils/, components/, contexts/

### E2E Tests (Playwright)

- Located in `tests/` directory
- Run with `npm run test:e2e` or `npm run test:e2e:ui` (interactive)
- Configuration optimized for CI (4 workers, Chromium default)

Key test files:

- `pages.spec.ts` - Page routing
- `create-pages-interactions.spec.ts` - Create page interactions
- `create-video.spec.ts` - Video creation flow
- `notifications.spec.ts` - Notification system
- `user-retention.spec.ts` - Streaks & achievements
- `admin-image-deletion.spec.ts` - Admin audit
- `admin-observability.spec.ts` - Admin monitoring
- `admin-tokens.spec.ts` - Token management
- `generation-progress-toaster.spec.ts` - Progress toast UI
- `user-sets.spec.ts` - User sets management
- `video-support.spec.ts` - Video feature support

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
- Don't add dependencies without checking for existing alternatives in the project
- Don't create new context providers when Zustand stores could serve the purpose

## Key Files Reference

| File                        | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `app/root.tsx`              | Root layout, providers, theme                 |
| `app/entry.server.tsx`      | Server entry point                            |
| `app/entry.client.tsx`      | Client entry point                            |
| `server.js`                 | Production Express server                     |
| `vite.config.ts`            | Build configuration (Remix + Sentry + Vercel) |
| `tsconfig.json`             | TypeScript config with path aliases           |
| `prisma/schema.prisma`      | Database schema (43 models)                   |
| `app/config/models.ts`      | Image model definitions & pricing             |
| `app/config/videoModels.ts` | Video model definitions                       |
| `app/config/pricing.ts`     | Credit cost configuration                     |
| `app/config/breakpoints.ts` | Responsive breakpoint definitions             |
| `.husky/`                   | Git hook configurations                       |

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

| Script                               | Purpose                          |
| ------------------------------------ | -------------------------------- |
| `scripts/startConsumers.ts`          | Kafka consumer workers           |
| `scripts/startWebSocketServer.ts`    | WebSocket server                 |
| `scripts/createKafkaTopics.ts`       | Topic initialization             |
| `scripts/checkKafkaHealth.ts`        | Health monitoring                |
| `scripts/monitorKafka.ts`            | Metrics monitoring               |
| `scripts/backfillVideoThumbnails.ts` | Video thumbnail backfill utility |
| `scripts/fetch-runway-task.ts`       | Runway task status fetcher       |

## Documentation

| File                                | Purpose                 |
| ----------------------------------- | ----------------------- |
| `README.md`                         | Setup and overview      |
| `TECHNICAL_IMPLEMENTATION_GUIDE.md` | Architecture deep dive  |
| `API.md`                            | API documentation       |
| `ARCHITECTURE.md`                   | System architecture     |
| `TESTING.md`                        | Testing guide           |
| `DEVELOPMENT.md`                    | Development setup       |
| `CONTRIBUTING.md`                   | Contribution guidelines |
| `CHANGELOG.md`                      | Version history         |
| `BUGFIXES.md`                       | Bug tracking            |
| `CACHING_STRATEGY.md`               | Caching approach        |
| `KAFKA_ENVIRONMENT_SETUP.md`        | Kafka configuration     |
| `IMPROVEMENT_STRATEGY.md`           | Planned improvements    |

## CI/CD Workflows

| Workflow                      | Purpose                                         |
| ----------------------------- | ----------------------------------------------- |
| `ci.yml`                      | Main CI pipeline (lint, typecheck, test, build) |
| `playwright.yml`              | E2E test runner                                 |
| `autobuild.yml`               | Auto-build on changes                           |
| `ci-failure-auto-fix.yml`     | Automated CI failure fixes                      |
| `docs-check.yml`              | Documentation validation                        |
| `pr-review-comprehensive.yml` | PR review automation                            |
| `claude.yml`                  | Claude Code automation                          |
| `codeql.yml`                  | CodeQL security scanning                        |
| `dependency-review.yml`       | Dependency vulnerability review                 |
| `jekyll-gh-pages.yml`         | GitHub Pages deployment                         |

## Recent Features

- Multi-model image comparison (compare page, ComparisonRequest/ComparisonGeneration models)
- Image remixing with lineage tracking
- Video generation (Runway, Luma, Stability) with thumbnail extraction
- Admin token management dashboard
- External service monitoring
- Prompt marketplace with reviews and ratings
- Creator earnings and payouts system
- Print on demand integration
- User achievements and login streaks
- AI-powered image tagging with confidence scores
- Advanced analytics dashboards (user, admin, style fingerprint)
- Blog/tutorial system with SEO metadata
- Supabase v2 auth migration
- Short URL image sharing (`/p/$imageId`)
- Dynamic sitemap generation
- Credit history and generation history settings pages
- What's new page for feature announcements
- Zustand state management
- OpenTelemetry + Winston structured logging
- Husky + lint-staged pre-commit automation
- Sonner toast notification system
