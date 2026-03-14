# Pixel Studio - Improvement Strategy & Roadmap

## Overview

This document outlines a comprehensive strategy for improving the Pixel Studio application across multiple dimensions: code quality, performance, user experience, security, and observability.

> **Last updated**: March 2026
> **Queue system**: QStash (Upstash) — Kafka infrastructure exists but is on hold for cost savings.

---

## Completed Features

The following items from the original roadmap have been implemented and are in production.

### Async Queue System (QStash)

- [x] Async image generation with real-time progress tracking
- [x] Async video generation pipeline
- [x] Multi-model comparison with parent-child request tracking
- [x] Processing page with live status updates (`/processing/$requestId`)
- [x] Local development mode with simulated processing
- [x] Signature verification and health checks

> **Note**: Kafka infrastructure (`infrastructure/kafka/`, consumer scripts) is available but disabled. QStash is the active queue backend (`QUEUE_BACKEND=qstash`). Kafka deployment (~$220/mo for AWS MSK) is deferred until scale demands it.

### Caching Strategy

- [x] Redis/Upstash caching layer (`app/utils/cache.server.ts`)
- [x] Stale-while-revalidate patterns
- [x] Pattern-based cache invalidation
- [x] Error fallback to direct fetch if Redis fails

### Social & Engagement Features

- [x] Following/followers system
- [x] Achievements system (60+ achievements with XP/credit rewards)
- [x] Login streaks with daily bonuses and milestone rewards
- [x] User-to-user tipping (1–1000 credits)
- [x] Image and video likes
- [x] Nested comments on images and videos
- [x] Comment likes
- [x] Notifications (12 types)

### Content & Discovery

- [x] Prompt marketplace (search, purchase, reviews, ratings)
- [x] Blog/tutorial system with admin editor, SEO metadata, categories/tags
- [x] Multi-model image comparison (`/compare/$requestId`)
- [x] Image remixing with lineage tracking
- [x] Short URL sharing (`/p/$imageId`)
- [x] Dynamic sitemap generation (images, videos, users, prompts, blog posts)
- [x] What's New / changelog page
- [x] Trending content computation

### Analytics & Monitoring

- [x] User analytics (daily/weekly/monthly stats, style fingerprint)
- [x] Admin analytics dashboards
- [x] Prompt analytics and performance metrics
- [x] Generation logging with metadata
- [x] Image deletion audit trail
- [x] Sentry error tracking
- [x] Winston + OpenTelemetry structured logging (OTLP HTTP → PostHog)
- [x] PostHog event tracking (60+ events)
- [x] Vercel Analytics

### Monetization

- [x] Stripe payment integration
- [x] Credit transaction ledger
- [x] Creator earnings and payouts system
- [x] Premium collections
- [x] External API token management

### Video Generation

- [x] Runway ML (Gen-3 Turbo, Veo 3.1)
- [x] Luma AI
- [x] Stability AI
- [x] Image-to-video conversion (source image support)
- [x] Video thumbnail extraction
- [x] Video comments and likes

### Security (Partial)

- [x] CSRF protection (`remix-utils/csrf`)
- [x] Zod validation on major routes (create, create-video, admin blog, collections, comments)

### CI/CD & Developer Experience

- [x] Husky + lint-staged pre-commit hooks
- [x] CI pipeline (lint, typecheck, test, build, CodeQL, dependency review)
- [x] 22 unit test files + 11 E2E test files
- [x] Vitest with coverage (v8)
- [x] Playwright E2E tests

### Testing Coverage (Current)

- [x] Unit tests: `app/utils/` (8), `app/server/` (4), `app/services/` (1), `app/components/` (1), `app/contexts/` (1)
- [x] E2E tests: pages, create interactions, video creation, notifications, user retention, admin flows, generation progress, sets, video support

---

## Remaining Work

### Phase 1: Code Quality & Security (High Priority)

#### 1.1 TypeScript Strict Mode

- [ ] Enable `noImplicitAny: true` in `tsconfig.json`
- [ ] Enable `noUnusedLocals: true`
- [ ] Enable `noUnusedParameters: true`
- [ ] Fix resulting type errors across the codebase

#### 1.2 Zod Validation Expansion

- [ ] Add Zod schemas for all remaining API endpoints (currently only 3 dedicated schema files)
- [ ] Standardize validation middleware pattern across routes

#### 1.3 Security Gaps

- [ ] Implement Content Security Policy (CSP) headers
- [ ] Add rate limiting to API endpoints (especially image generation, auth, tipping)
- [ ] Input sanitization middleware for user-generated content
- [ ] Regular dependency audit schedule

#### 1.4 Component Architecture

- [ ] Break down large components (e.g., ExploreImageDetailsPage.tsx)
- [ ] Extract reusable UI components and hooks

### Phase 2: Performance (Medium Priority)

#### 2.1 Image Optimization

- [ ] WebP/AVIF format conversion pipeline
- [ ] Progressive image loading
- [ ] Responsive image sizing (srcset)
- [ ] CDN integration for static/generated image assets
- [ ] Image compression for uploads

#### 2.2 Mobile Experience

- [ ] Simplify mobile UI patterns
- [ ] Touch gesture support for image viewing
- [ ] Mobile-specific image sizes

### Phase 3: Feature Enhancements (Medium Priority)

#### 3.1 Home Page Discovery

- [ ] Replace static landing page with paginated content discovery
- [ ] Add "See More" with infinite scroll or pagination
- [ ] Filtering options (date, popularity, model type)
- [ ] Personalized recommendations
- [ ] Category-based browsing
- **Estimated effort**: 1–2 weeks

#### 3.2 Google Gemini Integration

- [ ] Add Gemini image generation as a new model option in `app/config/models.ts`
- [ ] Implement provider in `app/server/` (text-to-image, image editing)
- [ ] Add conversational image refinement capabilities
- [ ] High-fidelity text rendering in images
- **Estimated effort**: 3–4 weeks

#### 3.3 Advanced Image Editing

- [ ] In-browser editing tools with natural language commands
- [ ] Mask-free editing
- [ ] Style transfer between user images

#### 3.4 Advanced Video Animation

- [ ] Keyframe editing for custom animations
- [ ] Duration and easing controls
- [ ] Animation presets
- [ ] Additional export formats (GIF, WebM)

### Phase 4: Testing & Quality (Ongoing)

- [ ] Expand unit test coverage toward 80%
- [ ] Add integration tests for remaining API routes
- [ ] Add visual regression testing
- [ ] Payment flow E2E tests
- [ ] Load testing for image generation pipeline

### Phase 5: Infrastructure (Low Priority / As Needed)

#### 5.1 Monitoring & Alerting

Current stack (Sentry, PostHog, Winston/OTLP, Vercel Analytics, Google Analytics) covers error tracking, product analytics, structured logging, and web vitals well at current scale.

- [ ] Set up Sentry alerting rules (error rate spikes, p99 latency thresholds)
- [ ] Set up PostHog alerting for key product metrics (generation failures, drop-offs)
- [ ] Prometheus metrics collection (request latency histograms, DB query performance, queue depth)
- [ ] Grafana dashboards for system health and real-time operational visibility
- [ ] Alerting rules for infrastructure (CPU, memory, error rates, performance degradation)

#### 5.2 Print on Demand

- [ ] Wire up actual provider API integration (Printful/Printify)
- [ ] Complete order flow end-to-end
- Architecture and database models are already in place

#### 5.3 Kafka Activation (When Scale Demands It)

If QStash throughput becomes a bottleneck, the Kafka infrastructure is ready:

- [ ] Deploy AWS MSK cluster (`infrastructure/kafka/deploy.sh`)
- [ ] Set `QUEUE_BACKEND=kafka` and configure broker credentials
- [ ] Deploy consumer workers (`scripts/startConsumers.ts`)
- [ ] Deploy WebSocket server (`scripts/startWebSocketServer.ts`)
- [ ] Set up monitoring for topic lag and throughput
- **Estimated cost**: ~$220–250/mo for AWS MSK
- **Risk**: Medium — code is implemented, needs production validation

#### 5.4 Collaborative Features (Future)

- [ ] Shared workspaces for teams
- [ ] Real-time collaborative editing
- [ ] Comment and approval workflows

### Accessibility

- [ ] Improve keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast audit
- [ ] Automatic alt text for generated images
- [ ] ARIA labels and roles

---

## Technical Debt

- [ ] Resolve TODO comments across codebase
- [ ] Update deprecated dependencies
- [ ] Optimize database queries and add indexing where needed
- [ ] Standardize API response formats
- [ ] Clean up unused code and imports

## Metrics & Success Criteria

### Technical Metrics

- [ ] Code coverage > 80%
- [ ] TypeScript strict mode with 0 errors
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms (p95)
- [ ] Zero critical security vulnerabilities

### Business Metrics

- [ ] Image generation success rate > 95%
- [ ] User retention rate tracking (streaks system provides data)
- [ ] Feature adoption metrics (PostHog provides data)
- [ ] Marketplace prompt sales growth

---

## Notes

- QStash is the production queue system. Kafka is available as a scale-up option.
- Priorities should be adjusted based on user feedback and business needs.
- PostHog and analytics infrastructure are already collecting data for informed decisions.
- The Prisma ORM migration to raw SQL has been deprioritized — Prisma is working well at current scale.
