# Changelog

All notable changes to Pixel Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Full App Redesign (PR #150 — 2026-06)

- **New design system** keyed off CSS custom properties on `[data-theme="dark"|"light"]`
  - Indigo accent + accent-soft/text/glow ramp
  - Surface ramp (`--surface-1/2/3/hover/inset`) and fg ramp (`--fg-muted/subtle/faint`)
  - Status colors (`--success/warning/danger/info` + soft variants)
  - Onest (sans) + Geist Mono linked in `root.tsx`; shadcn HSL aliases preserved for back-compat
  - Lives in `app/globals.css` + `tailwind.config.ts`
- **Theme toggle** (light + dark) persisted server-side
  - `User.theme` column written via `POST /api/preferences/theme`
  - Client applies `data-theme` instantly via `ThemeToggle`
- **New primitive library** at `app/components/ps/*`: `Button` (6 variants × 5 sizes), `Badge`, `PageHeader`, `Segmented`, `Select`, `Avatar`, `EmptyState`, `ArtTile`, `AdminStatCard`, `NavProgressBar`, `ThemeToggle`
- **New app shell**: `Sidebar` (252px, grouped + active rail), `TopBar` (sticky 58px, blur), `MobileNav` (top + bottom-tab + slide-up sheet), `AppShell`
- **Redesigned screens**: Landing, Explore, Create image, Create video, Feed, Liked, Profile, What's New, Image-detail modal, Admin overview, Admin Users / Credits / Models / Engagement / Tokens / External Services / Deletion Logs

#### Kafka Integration & Async Processing

- **Kafka-based async image generation pipeline** - Major architecture improvement
  - Added `app/services/kafka.server.ts` - Kafka client configuration and connection management
  - Added `app/services/imageGenerationProducer.server.ts` - Producer for queuing image generation requests
  - Added `app/services/imageGenerationWorker.server.ts` - Consumer for processing image generation jobs
  - Added `app/services/processingStatus.server.ts` - Redis-based status tracking for async jobs
  - Added `scripts/startConsumers.ts` - Production-ready consumer management
  - Added `scripts/createKafkaTopics.ts` - Topic initialization and management
  - Added `scripts/checkKafkaHealth.ts` - Health monitoring for Kafka services
  - Added `scripts/monitorKafka.ts` - Real-time Kafka monitoring dashboard

#### Real-Time Processing Updates

- **WebSocket integration for live status updates**
  - Added `app/services/websocket.server.ts` - WebSocket server for real-time processing updates
  - Added `app/routes/processing.$requestId.tsx` - Processing status page with live updates
  - Added `scripts/startWebSocketServer.ts` - Production WebSocket server management
  - Real-time progress tracking during image generation
  - Instant user feedback instead of blocking form submissions

#### Infrastructure & Deployment

- **AWS MSK deployment configuration**
  - Added `infrastructure/kafka/deploy.sh` - Automated AWS MSK cluster deployment
  - Added `infrastructure/kafka/msk-cluster.yml` - CloudFormation template for MSK setup
  - Added `infrastructure/kafka/docker-compose.kafka.yml` - Local Kafka development environment
  - Added `infrastructure/kafka/README.md` - Comprehensive Kafka setup documentation

#### Documentation & Developer Experience

- **Comprehensive documentation overhaul**
  - Complete rewrite of `README.md` with detailed setup instructions, architecture overview, and deployment guides
  - Added `KAFKA_ENVIRONMENT_SETUP.md` - Kafka-specific environment configuration
  - Updated `IMPROVEMENT_STRATEGY.md` with Kafka production roadmap and CI/CD future considerations
  - Added `env.example` - Complete environment variable template
  - Added deployment file reference table with service mappings

#### Health Monitoring & Testing

- Added `app/routes/health.tsx` - Health check endpoint with database, Redis, and system metrics
- Enhanced error logging and debugging capabilities across all services
- Added comprehensive status tracking for async operations

### Changed

#### OpenAI Image Provider (PR #150)

- **Switched primary OpenAI generation from `dall-e-3` to `gpt-image-1`**
  - OpenAI sequentially deprecated `response_format`, then `style`/`quality`, then `dall-e-3` itself
  - `app/server/createNewDallEImages.ts` now uses a layered fallback chain: `dall-e-3` w/ params → `dall-e-3` w/o params → `gpt-image-1` (with `mapSizeToGptImage1()` for the `1024x1792` → `1024x1536` mapping)
  - `dall-e-2` removed from `app/config/models.ts` (option no longer exposed)
  - Display name shows "OpenAI Image" via `MODEL_DISPLAY_NAMES` in `app/components/ModelBadge.tsx`

### Fixed

#### Credit refunds on failed generations (PR #150)

- `app/services/qstash.server.ts` flipped `refundCredits: false → true` so a failed QStash job properly refunds the user. Previously, generation failures silently consumed credits without a `CreditTransaction` of `type=refund`.

#### Hydration mismatches from PostHog autocapture (PR #150)

- `app/entry.client.tsx` now defers `initPostHog` past `window.load` (+ `setTimeout(0)`). PostHog's autocapture injects `<script>` tags during the React `hydrateRoot` window; deferring eliminates the resulting `Hydration failed` warnings.

#### Suspense stalls under `v3_singleFetch` (PR #150)

- `ExplorePage` and `UserProfilePage` switched from `defer()` + `<Await>` + `Promise.all` to eager `await` + `json()`. The composed pattern never settled under the v3 single-fetch flag.

#### Processing Flow Improvements

- **Replaced blocking image generation with async workflow**
  - Modified `app/routes/create.tsx` to use async processing when Kafka is enabled
  - Users now get instant response instead of waiting 30-120 seconds for DALL-E 3
  - Fallback to synchronous mode when Kafka is disabled

#### Enhanced Error Handling & Reliability

- Improved WebSocket error handling to be less aggressive for temporary connection issues
- Added retry logic and exponential backoff for failed operations
- Enhanced client-side error parsing with better debugging information
- Added proper connection status tracking and user feedback

#### TypeScript & Code Quality

- Enhanced type safety with optional chaining for array access patterns
- Improved `ProcessingStatus` interface with better type definitions
- Updated error handling patterns for more robust applications
- Added `useCallback` optimization to prevent unnecessary re-renders

### Infrastructure

- Added support for both local development (Docker Compose) and production (AWS MSK) Kafka environments
- Environment-based feature flagging with `ENABLE_KAFKA_IMAGE_GENERATION`
- PM2 configuration for production deployments (`ecosystem.config.js`)
- Railway deployment configuration (`railway.toml`)

### Developer Tools

- Added comprehensive npm scripts for Kafka management
- Enhanced development workflow with separate terminal commands for different services
- Added health check utilities and monitoring scripts

## Version History

### [v2.0.0] - 2025-09-21 (Kafka Integration Release)

- **Breaking Change**: Async processing architecture
- **Major Feature**: Real-time status updates via WebSocket
- **Infrastructure**: AWS MSK integration ready
- **UX Improvement**: Instant form submissions for image generation

### [v1.x.x] - Previous Versions

- Synchronous image generation
- Basic Remix application structure
- User authentication and collections
- Payment integration

---

## Contributing to Changelog

When making changes:

1. **Add entries to `[Unreleased]` section**
2. **Use consistent formatting**:

   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for any bug fixes (also track in BUGFIXES.md)
   - `Security` for security improvements

3. **Include relevant file paths and technical details**
4. **Reference related issues or pull requests when applicable**
5. **Move entries to versioned section when releasing**

## Release Process

1. Move unreleased changes to new version section
2. Update version numbers in `package.json`
3. Create git tag for release
4. Deploy to production with proper environment configuration
