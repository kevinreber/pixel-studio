# Kafka Environment Configuration

This document outlines the required environment variables for the Kafka-based async image generation pipeline.

## Required Environment Variables

Add these variables to your `.env` file:

### Kafka Configuration (for async image generation)

```env
# Local Development (with Docker Compose)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=pixel-studio
KAFKA_SSL=false
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=

# Production AWS MSK Configuration
# KAFKA_BROKERS=b-1.pixel-studio-kafka.abc123.c2.kafka.us-east-1.amazonaws.com:9092,b-2.pixel-studio-kafka.abc123.c2.kafka.us-east-1.amazonaws.com:9092,b-3.pixel-studio-kafka.abc123.c2.kafka.us-east-1.amazonaws.com:9092
# KAFKA_SSL=true
# KAFKA_SASL_USERNAME=your-msk-username
# KAFKA_SASL_PASSWORD=your-msk-password
```

### Processing Configuration

```env
PROCESSING_WORKER_INSTANCES=3
MAX_CONCURRENT_GENERATIONS=10
GENERATION_TIMEOUT_MS=300000  # 5 minutes max per generation
```

### WebSocket Configuration

```env
WS_PORT=3001
# Note: Uses existing Upstash Redis - no additional Redis setup needed
```

### Feature Flags

```env
ENABLE_KAFKA_IMAGE_GENERATION=true
```

## Local Development Setup

### 1. Start Kafka with Docker Compose

Create `docker-compose.kafka.yml`:

```yaml
version: "3.8"
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: true
```

Run with:

```bash
docker-compose -f docker-compose.kafka.yml up -d
```

### 2. Initialize Kafka Topics

```bash
npm run kafka:create-topics
```

### 3. Start Background Workers

```bash
npm run kafka:consumer
```

### 4. Health Check

```bash
npm run kafka:health
```

## Production Setup

### Current Status: ✅ Development Ready, 🚧 Production Pending

**What's Working:**

- ✅ Local Kafka development environment
- ✅ WebSocket real-time updates
- ✅ Async image generation pipeline
- ✅ Fixed redirect loop issues

**What's Missing for Production:**

- 🚧 AWS MSK cluster deployment
- 🚧 Background worker deployment to production
- 🚧 Production WebSocket server
- 🚧 Production monitoring and alerting

### Next Steps for Production (Priority Order)

#### **IMMEDIATE** (Next 1-2 weeks)

1. **Deploy AWS MSK Cluster**

   ```bash
   # Use the deployment script
   cd infrastructure/kafka
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Update Production Environment Variables**

   ```env
   KAFKA_BROKERS=your-msk-brokers-here
   KAFKA_SSL=true
   KAFKA_SASL_USERNAME=your-username
   KAFKA_SASL_PASSWORD=your-password
   ENABLE_KAFKA_IMAGE_GENERATION=true
   ```

3. **Deploy Background Workers**
   - Use `scripts/startConsumers.ts` for production workers
   - Configure PM2 or container orchestration
   - Set up auto-scaling for consumer instances

#### **SHORT TERM** (2-4 weeks)

4. **WebSocket Server Production Deployment**

   - Deploy using `scripts/startWebSocketServer.ts`
   - Configure load balancing and CORS
   - Test real-time updates in production

5. **Monitoring Setup**
   - Kafka topic monitoring (queue depth, consumer lag)
   - Failed generation alerting
   - Health check endpoints

**📋 Detailed Implementation Plan:**
See `IMPROVEMENT_STRATEGY.md` → "KAFKA PRODUCTION NEXT STEPS" for complete checklist and timelines.

**📊 Cost Estimates:**
~$220-250/month for AWS MSK infrastructure (3 kafka.t3.small brokers)

## Monitoring

The system creates the following Kafka topics:

- `image.generation.requests` - Queued image generation jobs
- `image.generation.status` - Processing status updates
- `image.generation.complete` - Successfully completed generations
- `image.generation.failed` - Failed generations with error details

Use Kafka monitoring tools to track:

- Queue depth and throughput
- Consumer lag
- Error rates
- Processing times
