---
description: Test an API endpoint manually
allowed-tools:
  - Bash
  - Read
  - Grep
argument-hint: <endpoint path like /api/images>
---

# API Endpoint Testing

Test endpoint: $ARGUMENTS

## Find the Route Handler

1. Search for the route file:
   ```bash
   ls app/routes/api.*
   ```

2. Read the route to understand:
   - Required authentication
   - Expected request body/params
   - Response format

## Testing Methods

### Using curl (if server is running)

```bash
# GET request
curl http://localhost:5173/api/endpoint

# POST with JSON
curl -X POST http://localhost:5173/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# POST with form data
curl -X POST http://localhost:5173/api/endpoint \
  -F "field=value"

# With authentication cookie
curl http://localhost:5173/api/endpoint \
  -H "Cookie: __session=<session_token>"
```

### Check Route Implementation

1. Read the route file
2. Identify the loader (GET) or action (POST/PUT/DELETE)
3. Check Zod validation schema
4. Verify authentication requirements

## Common API Patterns in This Project

### Protected Endpoint
```typescript
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  // ... handler logic
}
```

### Public Endpoint
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  // No auth check - public data
}
```

### Response Formats
```typescript
// Success
return json({ success: true, data: result });

// Error
return json({ error: "Message" }, { status: 400 });

// Redirect
return redirect("/path");
```

## Debugging API Issues

1. Check server logs for errors
2. Verify request format matches Zod schema
3. Check authentication state
4. Test with minimal payload first
