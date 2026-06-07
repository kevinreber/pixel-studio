# API Documentation

REST API reference for Pixel Studio.

## Base URL

- **Development**: `http://localhost:5173`
- **Production**: `https://your-domain.com`

## Authentication

Most endpoints require authentication. The API uses session-based authentication via Google OAuth (legacy) or Supabase (v2). Both stacks land in the same `User` record.

### Authentication Flow

1. Redirect user to `/auth/google` (or `/auth/v2/google` for the Supabase flow)
2. User authenticates with Google
3. Callback to `/auth/google/callback` (or `/auth/v2/callback-google`)
4. Session cookie is set

### Protected Endpoints

Protected endpoints return `401 Unauthorized` if not authenticated.

## Endpoint Index

47 REST endpoints under `/api/*` plus the `/webhook` Stripe handler. Detailed below — quick map:

| Family                  | Routes                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **Images**              | `api.images.$imageId.like`, `.remix`, `.tags`, `.comments`, `.comments.$commentId.like`, `.delete` |
| **Videos**              | `api.videos.$videoId.like`, `.comments`, `.comments.$commentId.like`                               |
| **Collections**         | `api.collections` (CRUD), `.add-image`, `.remove-image`, `.check-image`, `.$collectionId.premium`  |
| **Queue / Processing**  | `api.queue.process-image`, `api.queue.status`, `api.processing.$requestId`                         |
| **Notifications**       | `api.notifications` (list, read, delete)                                                           |
| **Users**               | `api.users.$userId.follow`, `.followers`, `.following`, `api.user.images`                          |
| **User Analytics**      | `api.user.analytics.dashboard`, `.style-fingerprint`                                               |
| **Marketplace**         | `api.marketplace.prompts` (list), `.purchase`                                                      |
| **Tips / Achievements** | `api.tips.send`, `api.achievements`, `api.streaks`                                                 |
| **Trending**            | `api.trending`                                                                                     |
| **Print on Demand**     | `api.print.products`, `.orders`, `.calculate`                                                      |
| **Admin**               | `api.admin.images`, `api.admin.users.$userId.credits`                                              |
| **Cache**               | `api.cache.clear` (admin)                                                                          |
| **User Preferences**    | `api.preferences.theme` (writes `User.theme`)                                                      |
| **Webhooks**            | `/webhook` (Stripe)                                                                                |

---

## Collections API

### List User Collections

```
GET /api/collections
```

Returns all collections for the authenticated user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `imageId` | string | Optional. Check if image exists in collections |

**Response:**

```json
{
  "collections": [
    {
      "id": "clx123...",
      "title": "My Collection",
      "imageCount": 5,
      "hasImage": true
    }
  ]
}
```

### Create Collection

```
POST /api/collections
```

**Request Body (FormData):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Collection name |

**Response:**

```json
{
  "success": true,
  "collection": {
    "id": "clx123...",
    "title": "New Collection"
  }
}
```

### Get Collection

```
GET /api/collections/:collectionId
```

**Response:**

```json
{
  "collection": {
    "id": "clx123...",
    "title": "My Collection",
    "description": "...",
    "images": [...]
  }
}
```

### Update Collection

```
PATCH /api/collections/:collectionId
```

**Request Body (FormData):**
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | New title |
| `description` | string | New description |

### Delete Collection

```
DELETE /api/collections/:collectionId
```

**Response:**

```json
{
  "success": true
}
```

### Add Image to Collection

```
POST /api/collections/add-image
```

**Request Body (FormData):**
| Field | Type | Required |
|-------|------|----------|
| `imageId` | string | Yes |
| `collectionId` | string | Yes |

**Response:**

```json
{
  "success": true
}
```

**Errors:**

- `400` - Image already in collection
- `404` - Collection or image not found

### Remove Image from Collection

```
POST /api/collections/remove-image
```

**Request Body (FormData):**
| Field | Type | Required |
|-------|------|----------|
| `imageId` | string | Yes |
| `collectionId` | string | Yes |

### Check Image in Collections

```
GET /api/collections/check-image?imageId=xxx
```

Check which collections contain a specific image.

---

## Images API

### Like Image

```
POST /api/images/:imageId/like
```

Like an image.

**Response:**

```json
{
  "success": true
}
```

### Unlike Image

```
DELETE /api/images/:imageId/like
```

Remove like from an image.

### Remix Image

```
POST /api/images/:imageId/remix
```

Fork an image — creates a new generation request seeded from the source's prompt/model/settings. The resulting `Image` records its source via `parentId` for lineage tracking.

### Tag Image

```
POST /api/images/:imageId/tags
```

Trigger AI-powered tag extraction for an image (writes `ImageTag` + `ImageAttribute` rows).

### Delete Image

```
DELETE /api/images/:imageId/delete
```

Soft-delete an image. Admin deletions are recorded to `ImageDeletionLog` for audit.

---

## Videos API

Mirrors the Images API but for `Video` records. Created via the create-video flow (Runway / Luma / Stability).

### Like / Unlike Video

```
POST   /api/videos/:videoId/like
DELETE /api/videos/:videoId/like
```

### Video Comments

```
POST   /api/videos/:videoId/comments
PATCH  /api/videos/:videoId/comments/:commentId
DELETE /api/videos/:videoId/comments/:commentId
POST   /api/videos/:videoId/comments/:commentId/like
DELETE /api/videos/:videoId/comments/:commentId/like
```

Same request/response shape as the equivalent image comment endpoints — see the Comments section above.

---

## Comments API

### Create Comment

```
POST /api/images/:imageId/comments
```

**Request Body (FormData):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `comment` | string | Yes | Comment text |

**Response:**

```json
{
  "success": true,
  "comment": {
    "id": "clx123...",
    "message": "Great image!",
    "createdAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "...",
      "name": "User Name",
      "image": "..."
    }
  }
}
```

### Update Comment

```
PATCH /api/images/:imageId/comments/:commentId
```

**Request Body (FormData):**
| Field | Type | Required |
|-------|------|----------|
| `comment` | string | Yes |

### Delete Comment

```
DELETE /api/images/:imageId/comments/:commentId
```

### Like Comment

```
POST /api/images/:imageId/comments/:commentId/like
```

### Unlike Comment

```
DELETE /api/images/:imageId/comments/:commentId/like
```

---

## Users API

### Follow User

```
POST /api/users/:userId/follow
```

Follow a user.

**Response:**

```json
{
  "success": true
}
```

**Errors:**

- `400` - Cannot follow yourself

### Unfollow User

```
DELETE /api/users/:userId/follow
```

### Get Followers

```
GET /api/users/:userId/followers
```

**Response:**

```json
{
  "followers": [
    {
      "id": "...",
      "name": "User Name",
      "username": "username",
      "image": "..."
    }
  ]
}
```

### Get Following

```
GET /api/users/:userId/following
```

**Response:**

```json
{
  "following": [
    {
      "id": "...",
      "name": "User Name",
      "username": "username",
      "image": "..."
    }
  ]
}
```

### Get User Images

```
GET /api/user/images?page=1&limit=20
```

Authenticated user's own images, paginated.

---

## User Analytics API

### Dashboard

```
GET /api/user/analytics/dashboard
```

Returns the data backing `/user/analytics` — generation counts, credit spend, top models, engagement trends.

### Style Fingerprint

```
GET /api/user/analytics/style-fingerprint
```

Returns the user's `StyleFingerprint` — aggregated color / style / mood preferences derived from `ImageTag` + `ImageAttribute`.

---

## Notifications API

### List Notifications

```
GET /api/notifications
```

**Response:**

```json
{
  "notifications": [
    {
      "id": "...",
      "type": "image_liked",
      "read": false,
      "createdAt": "2026-06-06T00:00:00Z",
      "actor": { "id": "...", "name": "..." },
      "subject": { "type": "image", "id": "..." }
    }
  ],
  "unreadCount": 4
}
```

12 notification types supported (likes, comments, follows, tips, achievements, marketplace activity, etc.).

### Mark Read

```
POST /api/notifications/read
```

**Body:** `{ "ids": ["..."] }` or `{ "all": true }`.

### Delete Notification

```
DELETE /api/notifications/:id
```

---

## Marketplace API

### List Prompts

```
GET /api/marketplace/prompts?sort=trending&category=...
```

**Response:**

```json
{
  "prompts": [
    {
      "id": "...",
      "title": "...",
      "priceCredits": 25,
      "creator": { "id": "...", "name": "..." },
      "rating": 4.7,
      "reviewCount": 12
    }
  ]
}
```

### Purchase Prompt

```
POST /api/marketplace/prompts/:promptId/purchase
```

Deducts credits, creates a `PromptPurchase`, and credits the creator's `CreatorEarnings`.

---

## Tips API

### Send Tip

```
POST /api/tips/send
```

**Body:**

| Field         | Type             | Required              |
| ------------- | ---------------- | --------------------- |
| `recipientId` | string           | Yes                   |
| `amount`      | number (credits) | Yes                   |
| `message`     | string           | No                    |
| `imageId`     | string           | No (optional context) |

Creates a `Tip` row and a corresponding `CreditTransaction` on both sides.

---

## Achievements & Streaks API

```
GET /api/achievements        # user's achievements + progress
GET /api/streaks             # login-streak state
```

---

## Trending API

```
GET /api/trending?type=images|videos|prompts&window=24h|7d
```

Returns ranked content from the `trending.server.ts` computation (cached in Redis).

---

## Print on Demand API

```
GET  /api/print/products                # available print products & sizes
POST /api/print/calculate               # body: { imageId, productId } → { priceUsd }
POST /api/print/orders                  # creates a PrintOrder (Stripe checkout)
```

---

## Admin API

All admin endpoints require the caller's `User.isAdmin = true`. Listed routes under `/api/admin/*`:

```
GET  /api/admin/images                       # paginated list with filters
POST /api/admin/users/:userId/credits        # adjust balance, creates CreditTransaction
```

The admin UI (under `/admin/*`) calls these via Remix actions; treat them as internal-but-stable.

---

## User Preferences API

### Set Theme

```
POST /api/preferences/theme
```

**Body:** `{ "theme": "light" | "dark" }`

Persists the choice on `User.theme`. The client applies `data-theme` instantly via `ThemeToggle`.

---

## Cache API (Admin)

```
POST /api/cache/clear
```

Admin-only. Invalidates the Redis cache keys listed in [`CACHING_STRATEGY.md`](./CACHING_STRATEGY.md).

---

## Queue/Processing API

### Get Processing Status

```
GET /api/processing/:requestId
```

Get the status of an image generation request.

**Response:**

```json
{
  "status": "processing",
  "progress": 50,
  "message": "Generating images...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `queued` | Request is in queue |
| `processing` | Currently generating |
| `complete` | Generation finished |
| `failed` | Generation failed |

### Get Queue Status

```
GET /api/queue/status
```

Get overall queue health and statistics.

### Process Image (Internal)

```
POST /api/queue/process-image
```

Internal endpoint called by QStash to process queued jobs. Requires QStash signature verification.

---

## Webhooks

### Stripe Webhook

```
POST /webhook
```

Handles Stripe payment events. Requires Stripe signature verification.

**Handled Events:**

- `checkout.session.completed` - Process successful payment
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Handle cancellation

---

## Authentication Routes

### Google OAuth

```
GET /auth/google
```

Initiates Google OAuth flow.

### OAuth Callback

```
GET /auth/google/callback
```

Handles OAuth callback from Google.

### Logout

```
POST /auth/logout
```

Destroys the session and logs out the user.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code  | Description                  |
| ----- | ---------------------------- |
| `200` | Success                      |
| `400` | Bad Request - Invalid input  |
| `401` | Unauthorized - Not logged in |
| `403` | Forbidden - No permission    |
| `404` | Not Found                    |
| `405` | Method Not Allowed           |
| `500` | Internal Server Error        |

---

## Rate Limiting

Rate limiting is configured via environment variables:

```bash
RATE_LIMIT_MAX="100"           # Max requests
RATE_LIMIT_WINDOW_MS="900000"  # 15 minute window
```

When rate limited, the API returns:

```json
{
  "error": "Too many requests. Please try again later."
}
```

---

## WebSocket API

For real-time processing updates, connect to the WebSocket server:

```javascript
const ws = new WebSocket("ws://localhost:3001");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { requestId, status, progress, message }
};

// Subscribe to a request
ws.send(
  JSON.stringify({
    type: "subscribe",
    requestId: "request-id-here",
  }),
);
```

### Message Types

**Processing Update:**

```json
{
  "type": "processing_update",
  "requestId": "...",
  "status": "processing",
  "progress": 50,
  "message": "Generating..."
}
```

**Completion:**

```json
{
  "type": "processing_update",
  "requestId": "...",
  "status": "complete",
  "progress": 100,
  "setId": "...",
  "images": [...]
}
```

---

## Examples

### cURL Examples

**List collections:**

```bash
curl -X GET http://localhost:5173/api/collections \
  -H "Cookie: session=..."
```

**Create collection:**

```bash
curl -X POST http://localhost:5173/api/collections \
  -H "Cookie: session=..." \
  -F "title=My New Collection"
```

**Like an image:**

```bash
curl -X POST http://localhost:5173/api/images/IMAGE_ID/like \
  -H "Cookie: session=..."
```

**Follow a user:**

```bash
curl -X POST http://localhost:5173/api/users/USER_ID/follow \
  -H "Cookie: session=..."
```

### JavaScript/Fetch Examples

```javascript
// List collections
const response = await fetch("/api/collections", {
  credentials: "include",
});
const data = await response.json();

// Create collection
const formData = new FormData();
formData.append("title", "My Collection");

await fetch("/api/collections", {
  method: "POST",
  body: formData,
  credentials: "include",
});

// Like an image
await fetch(`/api/images/${imageId}/like`, {
  method: "POST",
  credentials: "include",
});
```
