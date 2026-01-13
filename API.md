# API Documentation

REST API reference for Pixel Studio.

## Base URL

- **Development**: `http://localhost:5173`
- **Production**: `https://your-domain.com`

## Authentication

Most endpoints require authentication. The API uses session-based authentication via Google OAuth.

### Authentication Flow

1. Redirect user to `/auth/google`
2. User authenticates with Google
3. Callback to `/auth/google/callback`
4. Session cookie is set

### Protected Endpoints

Protected endpoints return `401 Unauthorized` if not authenticated.

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

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Not logged in |
| `403` | Forbidden - No permission |
| `404` | Not Found |
| `405` | Method Not Allowed |
| `500` | Internal Server Error |

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
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { requestId, status, progress, message }
};

// Subscribe to a request
ws.send(JSON.stringify({
  type: 'subscribe',
  requestId: 'request-id-here'
}));
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
const response = await fetch('/api/collections', {
  credentials: 'include'
});
const data = await response.json();

// Create collection
const formData = new FormData();
formData.append('title', 'My Collection');

await fetch('/api/collections', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});

// Like an image
await fetch(`/api/images/${imageId}/like`, {
  method: 'POST',
  credentials: 'include'
});
```
