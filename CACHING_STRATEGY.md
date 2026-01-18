# Caching Strategy & Stale Data Prevention

This document outlines the caching implementation in Pixel Studio, identifies potential stale data issues, and provides recommendations for cache invalidation to ensure a seamless user experience.

## Overview

Pixel Studio uses **Upstash Redis** for caching with a default TTL of **1 hour (3600 seconds)**. The caching layer is implemented in `app/utils/cache.server.ts` with the Redis client in `app/services/redis.server.ts`.

## Cache Key Reference

| Cache Key Pattern | TTL | Location | Purpose |
|---|---|---|---|
| `user-login:${userId}` | 1 hour | `root.tsx`, `settings.tsx` | Logged-in user data (credits, profile) |
| `explore-images?q=...&page=...` | **5 min** | `explore._index.tsx:12` | Explore page search results |
| `following-feed:${userId}:${page}:${pageSize}` | 1 hour | `feed._index.tsx:33` | User's following feed |
| `user-profile:${userId}:${page}:${pageSize}` | 1 hour | `profile.$userId.tsx:58` | User profile with pagination |
| `user-follow-stats:${userId}` | 1 hour | `profile.$userId.tsx:64` | Follow/follower counts |
| `image-details:${imageId}` | 1 hour | `explore.$imageId.tsx:27` | Image details with comments |
| `liked-images:user:${userId}` | 1 hour | `likes._index.tsx:26` | User's liked images |
| `user-collections:${userId}` | 1 hour | `explore.$imageId.tsx:33` | User's image collections |
| `sets:user:${userId}:${prompt}:${model}` | 1 hour | `sets._index.tsx:80` | Filtered user sets list |
| `set:${setId}` | 1 hour | `sets.$setId.tsx:33` | Single set details |
| `processing:${requestId}` | 1 hour | `processingStatus.server.ts:6` | Image/video generation progress |

---

## Current Cache Invalidation Map

### User Actions → Required Cache Invalidations

| User Action | Current Invalidation | Missing Invalidation |
|---|---|---|
| **Like Image** | `liked-images:user:${userId}`, `image-details:${imageId}` | None |
| **Unlike Image** | `liked-images:user:${userId}`, `image-details:${imageId}` | None |
| **Follow User** | `user-profile:${targetUserId}:*`, `user-profile:${userId}:*`, `user-follow-stats:*`, `following-feed:${userId}:*` | None |
| **Unfollow User** | Same as Follow | None |
| **Add Comment** | `image-details:${imageId}` | None |
| **Delete Comment** | `image-details:${imageId}` | None |
| **Like Comment** | `image-details:${imageId}` | None |
| **Update Username** | `user-login:${userId}` | `user-profile:${userId}:*` |
| **Purchase Credits** | `user-login:${userId}` | None |
| **Use Credits** | `user-login:${userId}` | None |
| **Delete Set** | `sets:user:${userId}:undefined:undefined` | `sets:user:${userId}:*` (all filter combinations) |
| **Add Image to Collection** | None | `user-collections:${userId}` |
| **Remove Image from Collection** | None | `user-collections:${userId}` |
| **Create Collection** | None | `user-collections:${userId}` |
| **Delete Collection** | None | `user-collections:${userId}` |
| **Update Collection** | None | `user-collections:${userId}` |
| **Generate New Image** | None | `explore-images?*` (if public), `user-profile:${userId}:*` |

---

## Identified Stale Data Issues

### Critical Issues

#### 1. Collection Operations Missing Cache Invalidation
**Files:** `api.collections.add-image.ts`, `api.collections.remove-image.ts`, `api.collections.create.ts`, `api.collections.$collectionId.ts`

**Problem:** When users save/unsave images to collections, create, update, or delete collections, the `user-collections:${userId}` cache is never invalidated.

**User Impact:** User saves an image to a collection, navigates away, then returns to the image - the "saved to collection" status shows stale data until the cache expires (up to 1 hour).

**Fix Required:**
```typescript
// In api.collections.add-image.ts, api.collections.remove-image.ts, etc.
import { cacheDelete } from "~/utils/cache.server";

// After successful operation:
await cacheDelete(`user-collections:${user.id}`);
```

#### 2. Set Deletion Cache Key Bug
**File:** `server/deleteSet.ts:24`

**Problem:** The cache invalidation uses hardcoded `undefined:undefined`:
```typescript
await cacheDelete(`sets:user:${set.userId}:undefined:undefined`);
```

**User Impact:** If a user has filtered their sets by prompt or model, then deletes a set, the filtered cache is not invalidated. The deleted set continues to appear until TTL expires.

**Fix Required:**
```typescript
// Use pattern deletion instead
await cacheDeletePattern(`sets:user:${set.userId}:*`);
```

#### 3. Username Update Missing Profile Cache Invalidation
**File:** `settings.tsx:72-73`

**Problem:** When a user updates their username, only `user-login:${userId}` is invalidated, not `user-profile:${userId}:*`.

**User Impact:** User changes username, but their profile page shows the old username until TTL expires.

**Fix Required:**
```typescript
await Promise.all([
  cacheDelete(`user-login:${user.id}`),
  cacheDeletePattern(`user-profile:${user.id}:*`),
]);
```

### Medium Priority Issues

#### 4. Explore Page Has No Cache Invalidation
**File:** `explore._index.tsx`

**Problem:** The explore page uses a 5-minute TTL but has no event-based cache invalidation. When new images are created or existing images are modified (likes, comments), the explore cache is not updated.

**User Impact:**
- User creates a new public image but doesn't see it in explore for up to 5 minutes
- Like/comment counts in explore grid may be stale

**Recommendation:** Consider implementing:
- Invalidate `explore-images?*` pattern when new images are created
- Or accept 5-minute staleness as a tradeoff for performance

#### 5. Feed Cache Not Updated on New Content
**File:** `feed._index.tsx`

**Problem:** When a followed user creates new content, the `following-feed:${followerId}:*` cache is not invalidated.

**User Impact:** User doesn't see new images from followed users until cache expires (up to 1 hour).

**Recommendation:** Either:
- Reduce feed cache TTL to 5-10 minutes
- Or invalidate follower feeds when new images are created (complex, requires knowing all followers)

#### 6. `redis.keys()` Performance Issue
**File:** `cache.server.ts:115`

**Problem:** `cacheDeletePattern()` uses `redis.keys(pattern)` which scans all keys. This is O(n) and can be slow with large datasets.

**Recommendation:** Consider using Redis SCAN command or restructuring cache keys to avoid pattern matching:
```typescript
// Instead of pattern deletion, use explicit key lists
// Or implement SCAN-based deletion for large keyspaces
```

### Low Priority Issues

#### 7. Pagination Cache Fragmentation
**Problem:** Cache keys include pagination parameters, creating many cache entries per data set:
- `user-profile:abc:1:250`
- `user-profile:abc:2:250`
- `user-profile:abc:1:50`

**User Impact:** User visits page 1, navigates away, returns - page 1 is cached. User then visits page 2 - new cache entry. Pattern deletion with `*` handles this but creates many keys.

**Recommendation:** Consider caching full data sets and paginating in memory for smaller collections, or accepting current behavior for simplicity.

---

## Cache Invalidation Implementation Guide

### When to Invalidate (Decision Tree)

```
User performs write operation
    ↓
Does operation modify data displayed elsewhere?
    ↓ Yes
    ├─→ Identify all cache keys showing this data
    ├─→ Invalidate ALL identified keys
    └─→ Use pattern deletion for paginated data
    ↓ No
    └─→ No cache invalidation needed
```

### Required Invalidations by Feature Area

#### User Profile & Settings
| Operation | Cache Keys to Invalidate |
|---|---|
| Update username | `user-login:${userId}`, `user-profile:${userId}:*` |
| Update avatar | `user-login:${userId}`, `user-profile:${userId}:*` |
| Update bio | `user-profile:${userId}:*` |

#### Social Features
| Operation | Cache Keys to Invalidate |
|---|---|
| Follow user | `user-profile:${targetUserId}:*`, `user-profile:${userId}:*`, `user-follow-stats:${targetUserId}`, `user-follow-stats:${userId}`, `following-feed:${userId}:*` |
| Unfollow user | Same as follow |

#### Image Interactions
| Operation | Cache Keys to Invalidate |
|---|---|
| Like image | `liked-images:user:${userId}`, `image-details:${imageId}` |
| Unlike image | `liked-images:user:${userId}`, `image-details:${imageId}` |
| Add comment | `image-details:${imageId}` |
| Delete comment | `image-details:${imageId}` |
| Like comment | `image-details:${imageId}` |

#### Collections
| Operation | Cache Keys to Invalidate |
|---|---|
| Create collection | `user-collections:${userId}` |
| Update collection | `user-collections:${userId}` |
| Delete collection | `user-collections:${userId}` |
| Add image to collection | `user-collections:${userId}` |
| Remove image from collection | `user-collections:${userId}` |

#### Sets
| Operation | Cache Keys to Invalidate |
|---|---|
| Delete set | `sets:user:${userId}:*`, `set:${setId}` |
| Create set (image generation) | `sets:user:${userId}:*` |

#### Image Generation
| Operation | Cache Keys to Invalidate |
|---|---|
| Create public image | `explore-images?*` (optional), `user-profile:${userId}:*` |
| Delete image | `image-details:${imageId}`, `user-profile:${userId}:*`, `liked-images:user:*` (for all users who liked it - complex) |

---

## Implementation Checklist

### Immediate Fixes (Critical)

- [ ] **`api.collections.add-image.ts`**: Add `cacheDelete(`user-collections:${user.id}`)` after successful add
- [ ] **`api.collections.remove-image.ts`**: Add `cacheDelete(`user-collections:${user.id}`)` after successful remove
- [ ] **`api.collections.create.ts`**: Add `cacheDelete(`user-collections:${user.id}`)` after successful create
- [ ] **`api.collections.$collectionId.ts`**: Add `cacheDelete(`user-collections:${user.id}`)` after successful update/delete
- [ ] **`server/deleteSet.ts`**: Change to `cacheDeletePattern(`sets:user:${set.userId}:*`)`
- [ ] **`settings.tsx`**: Add `cacheDeletePattern(`user-profile:${user.id}:*`)` after username update

### Recommended Improvements

- [ ] Reduce `following-feed` TTL to 10-15 minutes for fresher content
- [ ] Add logging for cache invalidation failures (currently silent)
- [ ] Consider adding cache invalidation metrics for monitoring
- [ ] Document cache key patterns in code comments

---

## Testing Cache Behavior

### Manual Testing Checklist

1. **Collection Save/Unsave**
   - Save image to collection
   - Navigate away and back to same image
   - Verify "saved" status is correct

2. **Follow/Unfollow**
   - Follow a user
   - Check follower count on their profile
   - Check your own following count
   - Check your feed includes their content

3. **Like/Unlike**
   - Like an image
   - Navigate to Likes page
   - Verify image appears
   - Unlike image
   - Verify image disappears from Likes

4. **Set Deletion**
   - Filter sets by model
   - Delete a set
   - Verify set disappears from filtered list

5. **Username Change**
   - Change username in settings
   - Navigate to profile
   - Verify new username appears

### Automated Testing

Consider adding integration tests that:
1. Perform write operation
2. Verify cache is invalidated (key deleted)
3. Verify subsequent read returns fresh data

---

## TTL Strategy Recommendations

| Data Type | Current TTL | Recommended TTL | Rationale |
|---|---|---|---|
| User login data | 1 hour | 1 hour | Stable, good for credits |
| Explore images | 5 min | 5 min | Good balance for discovery |
| Following feed | 1 hour | **10-15 min** | Fresher social content |
| User profile | 1 hour | 30 min | Balance freshness/performance |
| Image details | 1 hour | 1 hour | Good with event-based invalidation |
| Collections | 1 hour | 1 hour | Good with event-based invalidation |
| Sets | 1 hour | 1 hour | Good with event-based invalidation |

---

## Architecture Notes

### Current Caching Flow

```
Request → Check Redis Cache
            ↓ Hit?
            Yes → Return cached data
            No  → Fetch from database
                  → Store in Redis with TTL
                  → Return data
```

### Cache Functions

| Function | Purpose |
|---|---|
| `getCachedData()` | Fetch with cache-through pattern |
| `getCachedDataWithRevalidate()` | Same as above (name is misleading) |
| `cacheGet()` | Direct cache read |
| `cacheSet()` | Direct cache write |
| `cacheDelete()` | Delete single key |
| `cacheDeletePattern()` | Delete keys matching pattern (uses `redis.keys()`) |
| `invalidateCache()` | Alias for `cacheDelete()` |

### Error Handling

The caching layer gracefully falls back to database queries if Redis fails. Errors are logged but don't break the application. However, this means cache invalidation failures are silent - data may remain stale without any indication.

---

## Features Without Caching

Some features intentionally do not use Redis caching:

### Notifications System
**Files:** `api.notifications.ts`, `server/notifications/`

**Why no caching:**
- Notifications are highly dynamic and user-specific
- The UI uses client-side polling (every 30 seconds) for real-time updates
- Optimistic updates handle UI responsiveness without server-side caching
- Short-lived data that changes frequently makes caching less beneficial

**Current Implementation:**
- `NotificationDropdown.tsx` polls `/api/notifications?countOnly=true` every 30 seconds
- Full notification list is fetched on-demand when dropdown opens
- Uses optimistic updates for mark-read and delete operations

**Consideration:** If notification queries become a database bottleneck, consider:
- Short TTL caching (30-60 seconds) for unread count
- Or moving to WebSocket-based real-time updates instead of polling

### Processing Status
**File:** `processingStatus.server.ts`

While this does use Redis, it's for state management rather than traditional caching:
- Stores real-time image/video generation progress
- Uses atomic operations (`SET NX`) for claim tracking
- Has automatic cleanup for stale entries (24 hours)
