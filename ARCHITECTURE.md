# Architecture Overview

High-level system design for Pixel Studio.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   Client                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Browser   │  │   React     │  │   Remix     │  │   WebSocket Client  │ │
│  │             │──▶│ Components  │──▶│   Router    │  │   (Real-time)       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Remix Server                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Routes    │  │  Services   │  │   Server    │  │    Validation       │ │
│  │  (Loaders/  │──▶│ (Business   │──▶│  Utilities  │  │    (Zod Schemas)    │ │
│  │   Actions)  │  │   Logic)    │  │             │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│     PostgreSQL      │  │      Redis          │  │      Queue System       │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌─────────────────────┐│
│  │    Prisma     │  │  │  │    Upstash    │  │  │  │ QStash (default)    ││
│  │     ORM       │  │  │  │     Cache     │  │  │  │ Kafka (optional)    ││
│  └───────────────┘  │  │  └───────────────┘  │  │  └─────────────────────┘│
└─────────────────────┘  └─────────────────────┘  └─────────────────────────┘
                                                              │
              ┌───────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                  │
│                                                                              │
│  Image providers:  OpenAI (gpt-image-1) · Hugging Face · FAL · Ideogram     │
│                    Replicate · Together · Black Forest · Stability          │
│  Video providers:  Runway ML · Luma AI · Stability AI                       │
│  Other:            AWS S3 (storage) · Stripe (payments) · Sentry · PostHog  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (React + Remix)

```
app/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── ImageCard.tsx    # Image display card
│   ├── CollectionGrid.tsx
│   └── ...
├── pages/               # Page-level components
├── hooks/               # Custom React hooks
│   ├── useWebSocket.ts  # Real-time updates
│   └── useImageGeneration.ts
└── routes/              # Remix routes
```

**Key Patterns:**

- Server-side rendering with Remix loaders
- Progressive enhancement
- Optimistic UI updates
- Real-time updates via WebSocket

### 2. Backend (Remix + Node.js)

```
app/
├── routes/              # API endpoints + pages
│   ├── api.*            # REST API routes
│   └── *.tsx            # Page routes with loaders/actions
├── services/            # Business logic
│   ├── image.server.ts
│   ├── collection.server.ts
│   └── user.server.ts
└── server/              # Server utilities
    ├── auth.server.ts
    ├── prisma.server.ts
    └── kafka.server.ts
```

**Key Patterns:**

- Loaders for GET requests (data fetching)
- Actions for mutations (POST, PUT, DELETE)
- Server-only code in `.server.ts` files
- Zod validation for all inputs

### 3. Database (PostgreSQL + Prisma)

```
prisma/
└── schema.prisma        # Database schema
```

**Key Models** (43 total — abridged; see `prisma/schema.prisma` for the full list):

| Model                         | Purpose                           | Key Relations                                                    |
| ----------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| User                          | User accounts, credits, theme     | has many Images, Videos, Collections, Follows                    |
| Image                         | Generated images                  | belongs to User, Set; has many Comments, Likes; remix `parentId` |
| Video                         | Generated videos                  | belongs to User, Set; has VideoComments, VideoLikes              |
| Set                           | Batch of generation results       | belongs to User; has many Images / Videos                        |
| ComparisonRequest             | Multi-model comparison parent     | has many ComparisonGenerations                                   |
| Collection                    | User-organized image groups       | belongs to User; has many Images; supports paid                  |
| Comment / VideoComment        | Nested comments                   | belongs to User + Image/Video; self-referential                  |
| Follow                        | User-to-user follow               | connects Users                                                   |
| Notification                  | Activity notifications (12 types) | belongs to User                                                  |
| CreditTransaction             | Credit ledger                     | belongs to User                                                  |
| MarketplacePrompt             | Prompt marketplace listing        | has Reviews, Purchases                                           |
| BlogPost                      | Blog / tutorial content           | belongs to admin User                                            |
| Achievement / UserAchievement | Gamification                      | belongs to User                                                  |

### 4. Caching (Redis)

```typescript
// Cache patterns used
cache:user:{id}              // User profile data
cache:image:{id}             // Image details
cache:feed:{userId}:{page}   // Paginated feed
cache:liked-images:{userId}  // User's liked images
```

**Cache Strategy:**

- Cache-aside pattern
- TTL-based expiration
- Invalidation on mutations

### 5. Queue System

Selected at runtime via `QUEUE_BACKEND`:

**QStash — default**

```
User Request → QStash publish → /api/queue/process-image (signed webhook)
             → Provider SDK call → S3 upload → DB update → WebSocket broadcast
```

QStash handles retries, scheduling, and signature verification. Works on any host (including Vercel serverless) without long-running workers. Local dev simulates QStash when keys are absent.

**Kafka — optional / on hold**

```
User Request → Kafka Producer → Topic → Consumer Worker → Provider SDK call
             → S3 upload → DB update → Redis pub/sub → WebSocket Server → Client
```

Fully wired but parked to save the ~$220/mo AWS MSK bill. Re-enable by setting `QUEUE_BACKEND=kafka` plus `KAFKA_*` env vars and running `npm run kafka:consumer` + `npm run kafka:websocket`.

**Synchronous — legacy / debug only**

`ENABLE_KAFKA_IMAGE_GENERATION=false` with no QStash config falls back to blocking calls inside the Remix action. Only useful for debugging the provider integrations.

## Request Flows

### Image / Video Generation (Async)

```
1. User submits prompt + selects model (image or video)
2. Server validates with Zod, deducts credits, creates Image/Video row in `pending`
3. Server publishes to queue (QStash by default, optionally Kafka)
4. Server redirects to /processing/$requestId immediately
5. Client connects to WebSocket for updates
6. Worker picks up job:
   - Image:  one of 8 providers (OpenAI, FAL, Ideogram, Replicate, Together, BFL, HF, Stability)
   - Video:  Runway / Luma / Stability; FFmpeg extracts a thumbnail
7. Worker uploads result to S3
8. Worker updates the row (`status = completed`, urls, metadata)
9. Worker publishes status update (Redis pub/sub)
10. WebSocket server notifies subscribed clients
11. Client navigates to the set / detail page
```

For multi-model comparison, steps 2–9 fan out per model under a single `ComparisonRequest`; the UI shows a grid of children as they finish.

### Data Fetching (Remix Loader)

```
1. Browser requests page
2. Remix runs loader on server
3. Loader fetches data (DB, cache)
4. Loader returns JSON
5. Remix renders page with data
6. Browser receives HTML + hydration data
7. React hydrates on client
```

### Mutations (Remix Action)

```
1. User submits form
2. Browser POSTs to route
3. Remix runs action on server
4. Action validates with Zod
5. Action performs mutation
6. Action invalidates cache
7. Action returns response/redirect
8. Remix revalidates loaders
9. UI updates
```

## Technology Choices

### Why Remix?

- Server-side rendering out of the box
- Progressive enhancement
- Nested routing
- Built-in form handling
- Excellent loading states

### Why Prisma?

- Type-safe database queries
- Auto-generated TypeScript types
- Migration management
- Visual database browser

### Why QStash (and Kafka as an optional escape hatch)?

- Long-running generation (30s–5min) without blocking the request
- QStash gives us at-least-once delivery + signed webhooks + scheduling with zero ops
- Kafka stays available for high-throughput scale-out, but the cost (~$220/mo for MSK) isn't justified at current volume — `QUEUE_BACKEND` flips between them
- Both modes share the same WebSocket progress channel, so the UI doesn't care which back-end is active

### Why Redis?

- Fast cache lookups
- Reduces database load
- Session storage capable
- Pub/sub for real-time

## Deployment Architecture

### Default (Vercel + QStash)

```
Vercel (Remix App, serverless)
       │
       ├── Supabase / Neon (PostgreSQL)
       ├── Upstash (Redis + QStash)
       ├── AWS S3 (images + videos)
       └── Provider APIs (OpenAI / FAL / Runway / …)
```

This is what's running in production today. No separate worker fleet needed — QStash invokes `/api/queue/process-image` as a signed webhook.

### Scale-out (Kafka — when re-enabled)

```
Route 53 (DNS)
    │
CloudFront (CDN)
    │
ALB (Load Balancer)
    │
┌───┴───┐
│       │
ECS     ECS (Remix App Containers)
│       │
└───┬───┘
    │
    ├── RDS / Supabase (PostgreSQL)
    ├── ElastiCache / Upstash (Redis)
    ├── MSK (Kafka) ─── ECS (consumer workers + WebSocket server)
    └── S3 (Images + Videos)
```

## Security Considerations

### Authentication

- Google OAuth via Remix Auth
- Session-based (cookie)
- CSRF protection built into Remix

### Authorization

- User owns their data
- Server-side checks in loaders/actions
- Role-based permissions (future)

### Data Protection

- Passwords hashed with bcrypt
- Secrets in environment variables
- HTTPS in production
- Input validation with Zod

### API Security

- Rate limiting
- Webhook signature verification (Stripe, QStash)
- No sensitive data in URLs

## Scalability Considerations

### Database

- Connection pooling (Prisma)
- Indexed foreign keys
- Query optimization (select fields)

### Caching

- Cache frequently accessed data
- Invalidate on mutations
- Use TTLs appropriately

### Queue Processing

- Multiple worker instances
- Horizontal scaling
- Backpressure handling

### Static Assets

- S3 for image storage
- CDN for delivery
- Image optimization

## Monitoring & Observability

### Error Tracking

- Sentry integration
- Error boundaries in React
- Server-side error logging

### Analytics

- Vercel Analytics
- Custom event tracking

### Logging

- Winston for structured logs
- Request/response logging
- Error stack traces

## Future Considerations

- **Microservices**: Split image processing into separate service
- **GraphQL**: Consider for complex data requirements
- **Edge Caching**: Move more computation to edge
- **Multi-region**: Database replication for global users
