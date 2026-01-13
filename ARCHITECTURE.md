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
│  │    Prisma     │  │  │  │    Upstash    │  │  │  │  QStash / Kafka     ││
│  │     ORM       │  │  │  │     Cache     │  │  │  │  (Async Processing) ││
│  └───────────────┘  │  │  └───────────────┘  │  │  └─────────────────────┘│
└─────────────────────┘  └─────────────────────┘  └─────────────────────────┘
                                                              │
              ┌───────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   OpenAI    │  │ Hugging Face│  │    AWS S3   │  │      Stripe         │ │
│  │  (DALL-E)   │  │ (SD, Flux)  │  │  (Storage)  │  │    (Payments)       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
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

**Key Models:**

| Model | Purpose | Key Relations |
|-------|---------|---------------|
| User | User accounts | has many Images, Collections, Follows |
| Image | Generated images | belongs to User, Set; has many Comments, Likes |
| Collection | User collections | belongs to User; has many Images |
| Set | Batch of images | belongs to User; has many Images |
| Comment | Image comments | belongs to User, Image; self-referential for threads |
| Follow | User follows | connects Users |

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

Two options supported:

**QStash (Recommended for most cases)**
```
User Request → QStash Queue → Webhook Endpoint → Process → Update DB
```

**Kafka (High throughput)**
```
User Request → Kafka Producer → Topic → Consumer Worker → Process → Update DB
                                                              ↓
                                                    WebSocket Server → Client
```

## Request Flows

### Image Generation (Async)

```
1. User submits prompt
2. Server validates request
3. Server publishes to queue (QStash/Kafka)
4. Server returns requestId immediately
5. Client connects to WebSocket for updates
6. Worker picks up job from queue
7. Worker calls AI API (OpenAI/HuggingFace)
8. Worker uploads result to S3
9. Worker saves to database
10. Worker publishes status update
11. WebSocket server notifies client
12. Client displays result
```

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

### Why QStash/Kafka?

- Long-running AI generation (30s+)
- User doesn't have to wait
- Retry handling
- Rate limiting

### Why Redis?

- Fast cache lookups
- Reduces database load
- Session storage capable
- Pub/sub for real-time

## Deployment Architecture

### Simple (Vercel)

```
Vercel (Remix App)
       │
       ├── Supabase (PostgreSQL)
       ├── Upstash (Redis + QStash)
       └── AWS S3 (Images)
```

### Production (AWS)

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
    ├── RDS (PostgreSQL)
    ├── ElastiCache (Redis)
    ├── MSK (Kafka)
    └── S3 (Images)
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
