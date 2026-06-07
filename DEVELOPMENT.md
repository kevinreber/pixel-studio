# Development Guide

Quick-start guide for setting up and running Pixel Studio locally.

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** (comes with Node.js)
- **PostgreSQL** database
- **Git**

Optional (for full feature set):

- Docker (for local Kafka)
- AWS account (for S3 storage)
- Stripe account (for payments)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/kevinreber/pixel-studio.git
cd pixel-studio

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env
# Edit .env with your values (see Environment Variables section)

# 4. Set up the database
npx prisma db push
npx prisma generate

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

### Required for Basic Functionality

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pixel-studio"
DIRECT_URL="postgresql://user:password@localhost:5432/pixel-studio"

# Authentication
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
SESSION_SECRET="random-string-at-least-32-characters"

# AI Services (at least one required for image generation)
OPENAI_API_KEY="sk-..."           # OpenAI (gpt-image-1 with dall-e-3 fallback)
HUGGINGFACE_API_KEY="hf_..."      # Stable Diffusion + Flux via Hugging Face

# Other image providers (optional — drop in as needed)
# FAL_KEY="..."                     # FAL AI
# REPLICATE_API_TOKEN="..."         # Replicate
# IDEOGRAM_API_KEY="..."            # Ideogram
# TOGETHER_API_KEY="..."            # Together AI
# BFL_API_KEY="..."                 # Black Forest Labs
# STABILITY_API_KEY="..."           # Stability AI (also used for video)

# Video providers
# RUNWAY_API_KEY="..."              # Runway ML
# LUMAAI_API_KEY="..."              # Luma AI
```

### Optional Services

```bash
# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# S3 Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket"

# Stripe Payments
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Queue (QStash or Kafka)
QUEUE_BACKEND="qstash"
ENABLE_ASYNC_QUEUE="true"
QSTASH_TOKEN="..."
```

See `env.example` for the complete list with descriptions.

## Common Commands

### Development

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start development server (port 5173) |
| `npm run build`     | Create production build              |
| `npm run start`     | Run production server                |
| `npm run typecheck` | Run TypeScript type checking         |
| `npm run lint`      | Run ESLint                           |

### Testing

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `npm run test`          | Run Vitest in watch mode       |
| `npm run test:run`      | Run tests once                 |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e`      | Run Playwright E2E tests       |
| `npm run test:e2e:ui`   | Run E2E tests with UI          |

### Database

| Command                    | Description                     |
| -------------------------- | ------------------------------- |
| `npx prisma studio`        | Open visual database browser    |
| `npx prisma db push`       | Push schema changes to database |
| `npx prisma generate`      | Regenerate Prisma client        |
| `npx prisma migrate dev`   | Create a new migration          |
| `npx prisma migrate reset` | Reset database (destructive!)   |

### Async Processing (Kafka)

| Command                       | Description                |
| ----------------------------- | -------------------------- |
| `npm run kafka:create-topics` | Initialize Kafka topics    |
| `npm run kafka:consumer`      | Start background workers   |
| `npm run kafka:websocket`     | Start WebSocket server     |
| `npm run kafka:health`        | Check Kafka cluster health |
| `npm run kafka:monitor`       | Monitor Kafka topics       |

### Payments

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `npm run stripe:listen` | Forward Stripe webhooks locally |

## Project Structure

```
pixel-studio/
├── app/                    # Main application code
│   ├── components/         # React components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page-level components
│   ├── routes/             # Remix routes (pages + API)
│   ├── schemas/            # Zod validation schemas
│   ├── server/             # Server-side utilities
│   ├── services/           # Business logic
│   ├── types/              # TypeScript types
│   └── utils/              # Shared utilities
├── prisma/                 # Database schema
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── tests/                  # Test files
└── infrastructure/         # Deployment configs
```

## Path Aliases

Use these TypeScript path aliases in imports:

```typescript
import { something } from "~/utils/something"; // app/
import { Button } from "components/ui/button"; // app/components/
import { getUser } from "server/auth.server"; // app/server/
import { imageService } from "services/image"; // app/services/
```

## Database Setup

### Local PostgreSQL

```bash
# Create database
createdb pixel-studio

# Or using psql
psql -c "CREATE DATABASE pixel_studio;"

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://localhost:5432/pixel-studio"
```

### Using Docker

```bash
docker run --name pixel-studio-db \
  -e POSTGRES_DB=pixel-studio \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### Cloud Databases

The project works with:

- **Supabase** (recommended for quick start)
- **Railway**
- **Neon**
- **PlanetScale** (requires adapter)
- **AWS RDS**

## Authentication Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:5173/auth/google/callback`
   - Production: `https://your-domain.com/auth/google/callback`
6. Copy Client ID and Secret to `.env`

## Processing Modes

### Asynchronous with QStash — **default**

Both production and local dev use QStash. No Docker, no extra processes — `npm run dev` is enough.

```bash
QUEUE_BACKEND="qstash"
QSTASH_TOKEN="..."
QSTASH_CURRENT_SIGNING_KEY="..."
QSTASH_NEXT_SIGNING_KEY="..."
```

When the QStash keys are missing, local dev simulates queue dispatch in-process so you can still hit `/create` end-to-end without an Upstash account.

### Asynchronous with Kafka (optional, on hold)

The Kafka pipeline is fully wired but parked to save the ~$220/mo MSK bill. Re-enable for high-throughput experiments:

```bash
# Start Kafka locally
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml up -d

# Configure environment
QUEUE_BACKEND="kafka"
ENABLE_KAFKA_IMAGE_GENERATION="true"
KAFKA_BROKERS="localhost:9092"

# Start workers (in separate terminals)
npm run kafka:consumer
npm run kafka:websocket
```

See [`KAFKA_ENVIRONMENT_SETUP.md`](./KAFKA_ENVIRONMENT_SETUP.md) for full setup details.

### Synchronous (debug only)

Falls back to blocking provider calls in the Remix action. Useful only for debugging a single provider.

```bash
ENABLE_KAFKA_IMAGE_GENERATION="false"
# and leave QSTASH_TOKEN unset
```

## IDE Setup

### VS Code

Recommended extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- ES7+ React/Redux/React-Native snippets

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Cursor / Other Editors

The project uses:

- ESLint for linting
- Prettier for formatting
- TypeScript strict mode

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Regenerate Prisma client
npx prisma generate
```

### Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>
```

### Type Errors After Schema Change

```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### WebSocket Connection Failed

```bash
# Check if WebSocket server is running
npm run kafka:websocket

# Verify WS_PORT in .env matches client config
```

### Tests Failing

```bash
# Clear test cache
npm run test:run -- --clearCache

# Run specific test file
npm run test:run -- path/to/test.ts
```

## Next Steps

- Read [API.md](./API.md) for API documentation
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [TESTING.md](./TESTING.md) for testing guidelines
- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting PRs
