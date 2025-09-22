# Kafka Infrastructure for Pixel Studio

This directory contains the infrastructure setup for Apache Kafka integration with the Pixel Studio image generation pipeline.

## Overview

The Kafka integration replaces the synchronous image generation in `create.tsx` with an asynchronous, event-driven pipeline that provides:

- Instant form submissions (no more 30-120 second waits)
- Real-time progress tracking via WebSockets
- Better scalability and reliability
- Comprehensive error handling and retries

## Architecture

```
User Form Submission → Kafka Producer → Processing Queue → Background Workers → Image Generation → Status Updates → WebSocket → User
```

## Files in this Directory

- `msk-cluster.yml` - CloudFormation template for AWS MSK (production)
- `docker-compose.kafka.yml` - Local development Kafka setup
- `deploy.sh` - Deployment script for AWS infrastructure
- `README.md` - This documentation

## Local Development Setup

### 1. Start Kafka Locally

```bash
# From the root of the project
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml up -d
```

This starts:

- Kafka broker on `localhost:9092`
- Zookeeper on `localhost:2181`
- Kafka UI on `http://localhost:8080`

**Note**: Uses your existing Upstash Redis setup - no additional Redis needed!

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Kafka Configuration (Local Development)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=pixel-studio
KAFKA_SSL=false
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=

# Processing Configuration
PROCESSING_WORKER_INSTANCES=3
MAX_CONCURRENT_GENERATIONS=10
GENERATION_TIMEOUT_MS=300000

# WebSocket Configuration
WS_PORT=3001
# Uses existing Upstash Redis - no additional setup needed

# Feature Flags
ENABLE_KAFKA_IMAGE_GENERATION=true
```

### 3. Initialize Kafka Topics

```bash
npm run kafka:create-topics
```

### 4. Verify Setup

```bash
npm run kafka:health
```

### 5. Start Background Workers (when implemented)

```bash
npm run kafka:consumer
```

### 6. Access Kafka UI

Visit `http://localhost:8080` to:

- Monitor topic activity
- View message contents
- Debug consumer lag
- Manage topics and configurations

## Production AWS Setup

### Prerequisites

1. AWS CLI configured with appropriate permissions
2. VPC with at least 2 private subnets (preferably 3 for multi-AZ)
3. Security group for your application instances
4. KMS permissions for encryption

### Deploy MSK Cluster

```bash
# Navigate to the kafka infrastructure directory
cd infrastructure/kafka

# Deploy development cluster
./deploy.sh deploy -e dev -v vpc-12345678 -s subnet-123,subnet-456 -g sg-789abc

# Deploy production cluster
./deploy.sh deploy -e prod -v vpc-12345678 -s subnet-123,subnet-456,subnet-789 -g sg-789abc
```

### Check Deployment Status

```bash
./deploy.sh status -e dev
./deploy.sh outputs -e dev
```

### Production Environment Variables

After successful deployment, update your production environment with:

```env
# Get these values from: ./deploy.sh outputs -e prod
KAFKA_BROKERS=b-1.pixel-studio-kafka-prod.abc123.c2.kafka.us-east-1.amazonaws.com:9092,b-2.pixel-studio-kafka-prod.abc123.c2.kafka.us-east-1.amazonaws.com:9092,b-3.pixel-studio-kafka-prod.abc123.c2.kafka.us-east-1.amazonaws.com:9092
KAFKA_SSL=true
KAFKA_CLIENT_ID=pixel-studio
KAFKA_SASL_USERNAME=your-msk-username
KAFKA_SASL_PASSWORD=your-msk-password

# Production settings
PROCESSING_WORKER_INSTANCES=5
MAX_CONCURRENT_GENERATIONS=20
GENERATION_TIMEOUT_MS=300000
```

## Cost Estimates

### Local Development

- **Cost**: $0 (uses local Docker containers + existing Upstash Redis)
- **Resource Usage**: ~1.5GB RAM, minimal CPU (reduced without Redis container)

### AWS MSK Development

- **Monthly Cost**: ~$150-200
- **Instance Type**: kafka.t3.small × 2
- **Storage**: 100GB × 2

### AWS MSK Production

- **Monthly Cost**: ~$220-250
- **Instance Type**: kafka.t3.small × 3 (or kafka.m5.large for higher throughput)
- **Storage**: 100GB × 3
- **Additional**: CloudWatch logs, enhanced monitoring

## Topics Created

The system creates these Kafka topics:

| Topic                       | Purpose                            | Partitions | Retention |
| --------------------------- | ---------------------------------- | ---------- | --------- |
| `image.generation.requests` | Queued image generation jobs       | 6          | 7 days    |
| `image.generation.status`   | Processing status updates          | 3          | 1 day     |
| `image.generation.complete` | Successfully completed generations | 3          | 7 days    |
| `image.generation.failed`   | Failed generations with errors     | 3          | 7 days    |

## Monitoring

### Local Development

- **Kafka UI**: http://localhost:8080
- **Application Logs**: Check console output
- **Redis**: Uses your existing Upstash Redis (check Upstash dashboard)

### Production

- **CloudWatch**: Automatic broker and topic metrics
- **Enhanced Monitoring**: Per-topic, per-partition metrics
- **Custom Dashboards**: Set up Grafana dashboards (see TECHNICAL_IMPLEMENTATION_GUIDE.md)

## Security

### Development

- No authentication (local only)
- Plaintext communication
- Auto-topic creation enabled

### Production

- SCRAM-SHA-512 authentication
- TLS encryption (in-transit and at-rest)
- KMS encryption for data at rest
- IAM-based access controls
- VPC security groups

## Troubleshooting

### Common Issues

1. **Kafka not starting**

   ```bash
   # Check Docker containers
   docker-compose -f infrastructure/kafka/docker-compose.kafka.yml ps

   # View logs
   docker-compose -f infrastructure/kafka/docker-compose.kafka.yml logs kafka
   ```

2. **Topics not created**

   ```bash
   # Manually create topics
   npm run kafka:create-topics

   # Or check Kafka UI at http://localhost:8080
   ```

3. **Connection refused**

   ```bash
   # Verify Kafka is running
   npm run kafka:health

   # Check environment variables
   echo $KAFKA_BROKERS
   ```

4. **AWS deployment fails**
   ```bash
   # Check CloudFormation console for detailed errors
   # Common issues: insufficient permissions, invalid VPC/subnet IDs
   ```

### Useful Commands

```bash
# Local development
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml up -d     # Start
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml down     # Stop
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml logs -f  # View logs

# AWS deployment
./deploy.sh status -e dev      # Check deployment status
./deploy.sh outputs -e dev     # View stack outputs
./deploy.sh delete -e dev      # Delete infrastructure (careful!)

# Application
npm run kafka:health           # Health check
npm run kafka:create-topics    # Initialize topics
npm run kafka:consumer         # Start workers
npm run kafka:websocket        # Start WebSocket server

# Redis monitoring (Upstash)
# Use your Upstash dashboard to monitor Redis usage
```

## Next Steps

1. **Complete the consumer implementation** (see todo items)
2. **Update create.tsx to use Kafka producer**
3. **Add real-time WebSocket status updates**
4. **Set up monitoring and alerts**
5. **Load test the pipeline**

## Support

For issues with this infrastructure:

1. Check the troubleshooting section above
2. Review CloudFormation events in AWS Console
3. Check application logs for Kafka connection errors
4. Refer to TECHNICAL_IMPLEMENTATION_GUIDE.md for detailed implementation guidance
