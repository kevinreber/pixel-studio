---
name: image-pipeline-debug
description: Debug image generation pipeline issues including Kafka, QStash, WebSocket, and AI API problems. Use when investigating why images aren't generating, queue failures, or real-time update issues.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Image Generation Pipeline Debugger

You specialize in debugging the Pixel Studio image generation pipeline.

## Pipeline Overview

```
User Request → Route Handler → Queue (Kafka/QStash) → Consumer → AI API → S3 Upload → WebSocket Update
```

## Key Files

| Component        | File                                     |
| ---------------- | ---------------------------------------- |
| Route handler    | `app/routes/create.tsx`                  |
| Queue interface  | `app/services/imageQueue.server.ts`      |
| Kafka producer   | `app/server/kafka.server.ts`             |
| QStash producer  | `app/server/qstash.server.ts`            |
| Kafka consumer   | `scripts/kafka-consumer.ts`              |
| WebSocket server | `scripts/websocket-server.ts`            |
| Image creation   | `app/server/createNewImages.ts`          |
| AI service       | `app/services/imageGeneration.server.ts` |

## Debugging Steps

### 1. Check Queue Backend

```bash
# Which backend is configured?
grep "QUEUE_BACKEND" .env
# Should be "qstash" or "kafka"
```

### 2. Check Environment Variables

```bash
# QStash
grep "QSTASH" .env

# Kafka
grep "KAFKA" .env

# AI APIs
grep "OPENAI_API_KEY\|HUGGINGFACE" .env
```

### 3. Check Queue Health

Look at `app/services/imageQueue.server.ts` for the health check function.

### 4. Common Issues

**Images stuck in "processing"**

- Check if consumer is running
- Check for errors in consumer logs
- Verify AI API keys are valid

**WebSocket not updating**

- Check if WebSocket server is running on correct port
- Verify `WEBSOCKET_URL` environment variable
- Check browser console for connection errors

**Queue messages not sending**

- Check QStash/Kafka credentials
- Verify network connectivity
- Check for rate limiting

### 5. Test AI APIs Directly

Check `app/services/imageGeneration.server.ts` for the API calls:

- DALL-E: Uses OpenAI client
- Stable Diffusion/Flux: Uses Hugging Face API

## Logs to Check

```bash
# Consumer logs (if running)
npm run kafka:consumer

# WebSocket logs
npm run kafka:websocket

# App server logs
npm run dev
```

## Database Checks

Check image/set status in database:

```sql
-- Find recent pending images
SELECT * FROM "Image" WHERE status = 'processing' ORDER BY "createdAt" DESC LIMIT 10;

-- Find failed images
SELECT * FROM "Image" WHERE status = 'failed' ORDER BY "createdAt" DESC LIMIT 10;
```
