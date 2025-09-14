# Technical Implementation Guide

## Feature-Specific Infrastructure & Development Requirements

---

## 1. Home Page Pagination & Discovery

### **Database Changes Required**

```sql
-- Add indexes for better query performance
CREATE INDEX idx_images_created_at ON Image(createdAt DESC);
CREATE INDEX idx_images_likes_count ON Image(likes_count DESC); -- if implementing like counting
CREATE INDEX idx_images_model ON Image(model);
CREATE INDEX idx_images_style_preset ON Image(stylePreset);
CREATE INDEX idx_images_public ON Image(private, createdAt DESC);

-- Optional: Add view count tracking
ALTER TABLE Image ADD COLUMN viewCount INT DEFAULT 0;
CREATE INDEX idx_images_view_count ON Image(viewCount DESC);
```

### **Backend API Changes**

```typescript
// New API endpoints needed:
// GET /api/images/discover?page=1&limit=20&sortBy=recent|popular|trending&filter[model]=dall-e&filter[style]=anime

interface DiscoverImagesParams {
  page: number;
  limit: number;
  sortBy: "recent" | "popular" | "trending";
  filters: {
    model?: string;
    stylePreset?: string;
    userId?: string;
    dateRange?: [Date, Date];
  };
}
```

### **Frontend Components Needed**

- `InfiniteScrollContainer.tsx`
- `ImageDiscoveryFilters.tsx`
- `SortingControls.tsx`
- `LoadMoreButton.tsx` (alternative to infinite scroll)

### **Caching Strategy**

- Redis caching for paginated results (TTL: 5 minutes)
- Edge caching for popular image thumbnails
- Database connection pooling optimization

### **Infrastructure Requirements**

- **No additional AWS services needed**
- Existing database and Redis sufficient
- Consider read replicas if query load increases significantly

---

## 2. Google Gemini 2.5 Flash Image Integration

### **API Integration Requirements**

#### **Environment Variables Needed**

```env
GOOGLE_AI_API_KEY=your_gemini_api_key
GEMINI_MODEL_NAME=gemini-2.5-flash-image-preview
GEMINI_PROJECT_ID=your_google_cloud_project_id
```

#### **New Dependencies**

```json
{
  "dependencies": {
    "@google/genai": "^0.1.0", // Google GenAI SDK
    "sharp": "^0.32.0", // Image processing for format conversion
    "file-type": "^18.0.0" // MIME type detection
  }
}
```

### **Database Schema Updates**

```sql
-- Extend Image model to support Gemini-specific fields
ALTER TABLE Image ADD COLUMN generationModel TEXT; -- 'gemini', 'dall-e', 'stable-diffusion'
ALTER TABLE Image ADD COLUMN conversationId TEXT; -- for iterative editing sessions
ALTER TABLE Image ADD COLUMN parentImageId TEXT REFERENCES Image(id); -- for edited versions
ALTER TABLE Image ADD COLUMN editingInstructions JSONB; -- store editing history
ALTER TABLE Image ADD COLUMN synthIdWatermark BOOLEAN DEFAULT FALSE;

-- New table for conversation-based editing sessions
CREATE TABLE ImageEditingSessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id),
  baseImageId TEXT REFERENCES Image(id),
  conversationHistory JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  lastActivityAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_editing_sessions_user ON ImageEditingSessions(userId);
CREATE INDEX idx_editing_sessions_activity ON ImageEditingSessions(lastActivityAt);
```

### **Backend Services Architecture**

```typescript
// New service files needed:
// app/services/gemini.server.ts
// app/services/imageConversation.server.ts
// app/utils/geminiImageProcessing.server.ts

interface GeminiGenerationOptions {
  prompt: string;
  baseImage?: Buffer; // for editing mode
  conversationHistory?: ConversationTurn[];
  outputFormat: "png" | "webp";
  maxRetries: number;
}

interface ConversationTurn {
  type: "user_prompt" | "assistant_response" | "image_generation";
  content: string;
  imageUrl?: string;
  timestamp: Date;
}
```

### **Frontend Components Required**

- `GeminiModelSelector.tsx`
- `ConversationalImageEditor.tsx`
- `ImageEditingHistory.tsx`
- `MultiImageComposer.tsx`
- `IterativeRefinementChat.tsx`

### **File Storage Requirements**

```typescript
// AWS S3 bucket structure updates:
// bucket/
// ├── images/
// │   ├── original/          // existing
// │   ├── thumbnails/        // existing
// │   ├── gemini/           // new - Gemini generated images
// │   └── editing-history/   // new - store intermediate editing steps
```

### **Cost Considerations**

- **Gemini API**: $30 per 1M tokens (1290 tokens per image)
- **Estimated cost per image**: ~$0.039 per generation
- **Budget recommendation**: Start with $200/month limit
- **Monitoring needed**: Token usage tracking, cost alerts

### **Infrastructure Requirements**

- **API Gateway rate limiting**: Prevent API abuse
- **Background job processing**: For long-running image generations
- **Webhook handling**: For async responses (if supported)
- **Error handling service**: Gemini-specific error codes and retries

---

## 3. Video Animation from Static Images

### **Major Infrastructure Additions Required**

#### **AWS Services Expansion**

```yaml
# Additional AWS Services Needed:
Services:
  - S3 Video Bucket:
      Purpose: Store generated videos
      Estimated Storage: 50GB-1TB (depending on usage)
      Lifecycle Policy: Delete after 30 days unless saved by user

  - CloudFront Distribution:
      Purpose: Global video delivery
      Features: Video streaming optimization, global edge caching

  - Lambda Functions:
      Purpose: Video processing triggers, status updates
      Runtime: Node.js 18.x
      Memory: 1024MB-3008MB
      Timeout: 15 minutes max

  - SQS Queues:
      Purpose: Video processing job queue
      Type: Standard queue with DLQ

  - ElasticTranscoder (Alternative: MediaConvert):
      Purpose: Video format conversion and optimization
      Outputs: MP4 (H.264), WebM, GIF
```

#### **S3 Bucket Structure for Videos**

```
pixel-studio-videos/
├── source/              # Original uploaded images
├── processing/          # Temporary processing files
├── rendered/
│   ├── mp4/            # Final MP4 videos
│   ├── webm/           # WebM format videos
│   ├── gif/            # GIF animations
│   └── thumbnails/     # Video preview thumbnails
└── user-uploads/       # User-uploaded videos for reference
```

#### **Database Schema for Video Support**

```sql
-- New Video table
CREATE TABLE Video (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id),
  sourceImageId TEXT NOT NULL REFERENCES Image(id),
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  animationType TEXT NOT NULL, -- 'parallax', 'zoom', 'fade', 'custom'
  duration INTEGER NOT NULL DEFAULT 5, -- seconds
  fps INTEGER NOT NULL DEFAULT 24,
  formats JSONB, -- {'mp4': 'url', 'webm': 'url', 'gif': 'url'}
  processingStartedAt TIMESTAMP,
  processingCompletedAt TIMESTAMP,
  errorMessage TEXT,
  fileSize BIGINT, -- in bytes
  metadata JSONB, -- animation parameters, effects, etc.
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_video_user ON Video(userId);
CREATE INDEX idx_video_status ON Video(status);
CREATE INDEX idx_video_created ON Video(createdAt DESC);

-- Update Image table to track video relationships
ALTER TABLE Image ADD COLUMN hasVideo BOOLEAN DEFAULT FALSE;
ALTER TABLE Image ADD COLUMN videoProcessingStatus TEXT; -- 'none', 'queued', 'processing', 'completed'
```

#### **Third-Party API Integration Options**

**Option 1: Runway ML API** (Recommended)

```typescript
// Integration requirements:
interface RunwayMLConfig {
  apiKey: string;
  baseUrl: "https://api.runwayml.com/v1";
  maxConcurrentJobs: 5;
  webhookUrl: string;
}

// Estimated costs:
// - $0.15-0.30 per 4-second video generation
// - API rate limits: 100 requests/minute
```

**Option 2: Stability AI Video Generation**

```typescript
interface StabilityVideoConfig {
  apiKey: string;
  model: "stable-video-diffusion-img2vid-v1-1";
  maxResolution: "1024x1024";
  maxFrames: 120;
}

// Estimated costs:
// - $0.04 per frame (25 frames = $1.00)
// - Lower quality but more cost-effective
```

**Option 3: Custom Animation Pipeline** (Long-term)

```typescript
// Using FFmpeg + custom effects
interface CustomAnimationConfig {
  ffmpegPath: string;
  effects: ("parallax" | "zoom" | "fade" | "pan")[];
  maxProcessingTime: 300; // seconds
}

// Infrastructure: AWS Batch or ECS for processing
// Cost: Only compute costs (~$0.01-0.05 per video)
```

### **Backend Architecture for Video Processing**

#### **Job Queue System**

```typescript
// app/services/videoProcessing.server.ts
interface VideoJob {
  id: string;
  userId: string;
  imageId: string;
  animationType: string;
  parameters: AnimationParameters;
  priority: "low" | "normal" | "high";
  maxRetries: number;
  createdAt: Date;
}

// AWS SQS integration for job management
class VideoProcessingQueue {
  async enqueueJob(job: VideoJob): Promise<string>;
  async processJob(jobId: string): Promise<VideoResult>;
  async getJobStatus(jobId: string): Promise<JobStatus>;
}
```

#### **Real-time Status Updates**

```typescript
// WebSocket or Server-Sent Events for progress tracking
interface VideoProcessingUpdate {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  estimatedTimeRemaining: number; // seconds
  errorMessage?: string;
}
```

### **Frontend Components for Video Features**

- `VideoAnimationStudio.tsx` - Main animation interface
- `AnimationPresets.tsx` - Pre-built animation types
- `VideoProgressTracker.tsx` - Real-time processing status
- `VideoPlayerComponent.tsx` - Playback with controls
- `VideoExportOptions.tsx` - Format and quality selection
- `VideoGallery.tsx` - User's generated videos

### **Content Delivery & Streaming**

```typescript
// CDN Configuration for video streaming
interface VideoCDNConfig {
  provider: "AWS CloudFront";
  streamingProtocols: ["HLS", "DASH", "Progressive"];
  adaptiveBitrate: true;
  globalEdgeLocations: true;
  caching: {
    ttl: 86400; // 24 hours
    invalidationOnUpdate: true;
  };
}
```

---

## 4. Cross-Feature Infrastructure Requirements

### **Monitoring & Observability Enhancements**

```yaml
# Additional Prometheus metrics needed:
Metrics:
  - gemini_api_requests_total
  - gemini_api_request_duration_seconds
  - gemini_api_errors_total
  - video_processing_jobs_total
  - video_processing_duration_seconds
  - video_processing_queue_length
  - storage_usage_by_type (images vs videos)
  - api_costs_by_provider

# Grafana Dashboards:
Dashboards:
  - "AI Model Performance Comparison"
  - "Video Processing Pipeline Health"
  - "Cost Tracking by Feature"
  - "User Engagement with New Features"
```

### **Security Considerations**

```typescript
// API rate limiting for new endpoints
interface RateLimitConfig {
  geminiGeneration: "10 per minute per user";
  videoProcessing: "5 per hour per user";
  bulkOperations: "100 per day per user";
  fileUploads: "50MB per request";
}

// Content Security Policy updates
const cspConfig = {
  "connect-src": [
    "https://generativelanguage.googleapis.com", // Gemini API
    "https://api.runwayml.com", // Video generation
    // ... existing sources
  ],
  "media-src": [
    "https://your-video-cdn.com",
    // ... existing sources
  ],
};
```

### **Database Performance Optimization**

```sql
-- Additional database optimizations needed
CREATE INDEX idx_images_video_status ON Image(videoProcessingStatus) WHERE videoProcessingStatus != 'none';
CREATE INDEX idx_videos_processing ON Video(status, processingStartedAt) WHERE status IN ('queued', 'processing');

-- Partitioning for large video tables (if needed)
CREATE TABLE Video_2024 PARTITION OF Video
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

---

## 5. Cost Estimation & Budget Planning

### **Monthly Cost Estimates** (assuming 1000 active users)

#### **Home Page Enhancement**

- Additional database queries: +$20-30/month
- CDN costs for pagination: +$10-15/month
- **Total: ~$35-45/month**

#### **Gemini Integration**

- API costs (500 images/day): ~$585/month
- Additional storage: +$5-10/month
- Processing overhead: +$15-20/month
- **Total: ~$605-615/month**

#### **Video Animation**

- Video generation API (100 videos/day): ~$450-900/month
- S3 video storage (1TB): ~$23/month
- CloudFront delivery: ~$50-100/month
- Processing compute (Lambda/ECS): ~$30-50/month
- **Total: ~$553-1073/month**

### **Infrastructure Scaling Plan**

```yaml
Phase 1 (0-1000 users):
  - Single region deployment
  - Basic monitoring
  - Manual cost optimization

Phase 2 (1000-10000 users):
  - Multi-region CDN
  - Auto-scaling groups
  - Automated cost alerts
  - Database read replicas

Phase 3 (10000+ users):
  - Multi-region deployment
  - Advanced caching layers
  - Cost optimization automation
  - Dedicated video processing cluster
```

---

## 6. Implementation Timeline with Dependencies

### **Phase 1: Home Page Enhancement (Weeks 1-2)**

- ✅ **Prerequisites**: Existing database, Redis cache
- **Week 1**: Backend API changes, database indexes
- **Week 2**: Frontend components, infinite scroll

### **Phase 2: Gemini Integration (Weeks 3-6)**

- ✅ **Prerequisites**: Google Cloud account, API keys
- **Dependencies**: Phase 1 completion for UI patterns
- **Week 3**: Basic text-to-image integration
- **Week 4**: Database schema updates, conversation system
- **Week 5**: Advanced editing features
- **Week 6**: UI polish, testing

### **Phase 3: Video Animation (Weeks 7-12)**

- ✅ **Prerequisites**: AWS video infrastructure setup (Week 6)
- **Dependencies**: Gemini integration for source images
- **Week 7-8**: Infrastructure setup (S3, CloudFront, SQS)
- **Week 9-10**: Basic animation pipeline
- **Week 11**: Advanced animation controls
- **Week 12**: Testing, optimization

---

## 7. Apache Kafka Integration Strategy

### **Where Kafka Makes Sense in Pixel Studio**

Based on your architecture and planned features, Kafka would be most beneficial for:

#### **1. Video Processing Pipeline (HIGH PRIORITY)**

**Perfect Use Case**: Your video generation workflow is exactly what Kafka excels at - asynchronous, multi-stage processing with reliability requirements.

```typescript
// Kafka Topics for Video Processing
const KAFKA_TOPICS = {
  VIDEO_GENERATION_REQUESTS: "video.generation.requests",
  VIDEO_PROCESSING_STATUS: "video.processing.status",
  VIDEO_PROCESSING_COMPLETE: "video.processing.complete",
  VIDEO_PROCESSING_FAILED: "video.processing.failed",
};

// Event-driven video processing workflow
interface VideoGenerationEvent {
  id: string;
  userId: string;
  imageId: string;
  animationType: "parallax" | "zoom" | "fade" | "custom";
  parameters: AnimationParameters;
  priority: "low" | "normal" | "high";
  retryCount: number;
}

class VideoProcessingProducer {
  async requestVideoGeneration(event: VideoGenerationEvent): Promise<void> {
    await kafka.producer().send({
      topic: KAFKA_TOPICS.VIDEO_GENERATION_REQUESTS,
      messages: [
        {
          key: event.userId, // Partition by user for ordering
          value: JSON.stringify(event),
        },
      ],
    });
  }
}
```

**Benefits vs Current SQS Approach**:

- **Better Scaling**: Add video processors dynamically based on queue depth
- **Reliability**: Built-in replication and durability guarantees
- **Monitoring**: Rich metrics for pipeline health and throughput
- **Ordering**: Process user's videos in order if needed

#### **2. Real-time User Activity & Notifications (MEDIUM PRIORITY)**

**Use Case**: Stream user activities for real-time notifications, social features, and activity feeds.

```typescript
const ACTIVITY_TOPICS = {
  USER_ACTIVITIES: "user.activities",
  NOTIFICATIONS: "user.notifications",
  SOCIAL_INTERACTIONS: "social.interactions",
};

interface UserActivityEvent {
  userId: string;
  type:
    | "image_generated"
    | "image_liked"
    | "comment_added"
    | "collection_created";
  resourceId: string;
  timestamp: Date;
}

// Real-time activity tracking
class ActivityTracker {
  async trackImageGeneration(
    userId: string,
    imageId: string,
    model: string
  ): Promise<void> {
    await kafka.producer().send({
      topic: ACTIVITY_TOPICS.USER_ACTIVITIES,
      messages: [
        {
          key: userId,
          value: JSON.stringify({
            userId,
            type: "image_generated",
            resourceId: imageId,
            metadata: { model },
            timestamp: new Date(),
          }),
        },
      ],
    });
  }
}
```

#### **3. AI Model Request Orchestration (MEDIUM PRIORITY)**

**Use Case**: Smart routing between Gemini, DALL-E, and other AI models based on availability, cost, and user preferences.

```typescript
interface AIGenerationRequest {
  requestId: string;
  userId: string;
  prompt: string;
  preferredModel: "gemini" | "dall-e" | "stable-diffusion";
  fallbackModels: string[];
  priority: number;
}

class AIModelOrchestrator {
  async routeGenerationRequest(request: AIGenerationRequest): Promise<void> {
    // Check model health and costs in real-time
    const selectedModel = await this.selectOptimalModel(request);

    await kafka.producer().send({
      topic: `ai.${selectedModel}.requests`,
      messages: [{ value: JSON.stringify(request) }],
    });
  }
}
```

### **AWS MSK Infrastructure Setup**

#### **Recommended Configuration**

```yaml
# AWS MSK (Managed Streaming for Apache Kafka)
KafkaCluster:
  Type: AWS::MSK::Cluster
  Properties:
    ClusterName: pixel-studio-kafka
    KafkaVersion: 2.8.1
    NumberOfBrokerNodes: 3
    BrokerNodeGroupInfo:
      InstanceType: kafka.t3.small # Start small, scale up
      ClientSubnets: [subnet-1, subnet-2, subnet-3]
      StorageInfo:
        EBSStorageInfo:
          VolumeSize: 100GB
```

#### **Topic Strategy**

```typescript
const TOPIC_CONFIGS = {
  // High-throughput, short retention
  "user.activities": {
    partitions: 12,
    replicationFactor: 3,
    retentionMs: 24 * 60 * 60 * 1000, // 1 day
  },

  // Ordered processing, longer retention
  "video.generation.requests": {
    partitions: 6,
    replicationFactor: 3,
    retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxMessageBytes: 10485760, // 10MB for large requests
  },
};
```

### **Implementation Priority**

#### **HIGHEST PRIORITY: Image Generation Queue (Weeks 1-3)**

**Problem**: Current `create.tsx` blocks users for 30-120 seconds during image generation

**Solution Architecture**:

```typescript
// Updated create.tsx action - instant response
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const validateFormData = CreateImagesFormSchema.safeParse(formData);

  // Deduct credits immediately
  await updateUserCredits(user.id, numberOfImages);

  // Generate unique request ID
  const requestId = generateId();

  // 🚀 Submit to Kafka - returns immediately!
  await kafka.producer().send({
    topic: IMAGE_TOPICS.GENERATION_REQUESTS,
    messages: [
      {
        key: user.id,
        value: JSON.stringify({
          requestId,
          userId: user.id,
          ...validateFormData.data,
          timestamp: new Date(),
        }),
      },
    ],
  });

  // Redirect immediately to processing page
  return redirect(`/processing/${requestId}`);
};
```

**Infrastructure Requirements**:

```bash
# New dependencies for image generation Kafka
npm install kafkajs ws @types/ws

# Environment variables
KAFKA_BROKERS=pixel-studio-kafka-brokers.amazonaws.com:9092
KAFKA_SASL_USERNAME=your-msk-username
KAFKA_SASL_PASSWORD=your-msk-password
KAFKA_CLIENT_ID=pixel-studio-image-gen
```

**Background Consumer Service**:

```typescript
// app/services/imageGenerationConsumer.ts
class ImageGenerationConsumer {
  async processGenerationRequests(): Promise<void> {
    const consumer = kafka.consumer({ groupId: "image-generators" });
    await consumer.subscribe({ topic: "image.generation.requests" });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const request = JSON.parse(message.value.toString());

        // Use existing createNewImages logic
        const result = await createNewImages(request, request.userId);

        // Publish completion event
        await this.publishComplete(request.requestId, result);
      },
    });
  }
}
```

**Real-time Progress Page**:

```typescript
// app/routes/processing.$requestId.tsx - NEW PAGE
export default function ProcessingPage() {
  const { requestId } = useParams();
  const [status, setStatus] = useState("queued");

  useEffect(() => {
    const ws = new WebSocket(`/api/processing/${requestId}/status`);
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === "complete") {
        window.location.href = `/sets/${update.setId}`;
      }
    };
    return () => ws.close();
  }, [requestId]);

  return (
    <div>
      <h1>Generating Your Images...</h1>
      <ProgressBar status={status} />
    </div>
  );
}
```

#### **Phase 1: Video Processing (Weeks 7-9 - During video feature development)**

- Replace SQS with Kafka for video generation queue
- Implement status updates streaming
- Add comprehensive monitoring

#### **Phase 2: Real-time Features (Weeks 13-15)**

- User activity streaming
- Real-time notifications
- Social interaction events

#### **Phase 3: AI Orchestration (Weeks 16-18)**

- Multi-model request routing
- Cost optimization through load balancing
- Fallback mechanisms

---

## 7.5. What You Need to Integrate Kafka

### **Infrastructure Requirements**

#### **AWS MSK Setup**

```yaml
# CloudFormation Template for Kafka Cluster
Resources:
  PixelStudioKafkaCluster:
    Type: AWS::MSK::Cluster
    Properties:
      ClusterName: pixel-studio-kafka
      KafkaVersion: 2.8.1
      NumberOfBrokerNodes: 3
      BrokerNodeGroupInfo:
        InstanceType: kafka.t3.small
        ClientSubnets:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
        SecurityGroups: [!Ref KafkaSecurityGroup]
        StorageInfo:
          EBSStorageInfo:
            VolumeSize: 100

      # Security Configuration
      EncryptionInfo:
        EncryptionAtRest:
          DataVolumeKMSKeyId: alias/aws/msk
        EncryptionInTransit:
          ClientBroker: TLS
          InCluster: true

      # Authentication
      ClientAuthentication:
        Sasl:
          Scram:
            Enabled: true
```

#### **Security Groups Configuration**

```yaml
KafkaSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for Kafka cluster
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 9092
        ToPort: 9094
        SourceSecurityGroupId: !Ref ApplicationSecurityGroup
      - IpProtocol: tcp
        FromPort: 2181
        ToPort: 2181
        SourceSecurityGroupId: !Ref ApplicationSecurityGroup
```

### **Application Dependencies**

#### **Package.json Updates**

```json
{
  "dependencies": {
    "kafkajs": "^2.2.4",
    "ws": "^8.14.0",
    "@types/ws": "^8.5.6",
    "ioredis": "^5.3.2" // For caching processing status
  },
  "scripts": {
    "kafka:create-topics": "tsx scripts/createKafkaTopics.ts",
    "kafka:consumer": "tsx scripts/startConsumers.ts",
    "kafka:health": "tsx scripts/checkKafkaHealth.ts"
  }
}
```

#### **Environment Variables**

```env
# Kafka Configuration
KAFKA_BROKERS=b-1.pixel-studio-kafka.abc123.c2.kafka.us-east-1.amazonaws.com:9092,b-2.pixel-studio-kafka.abc123.c2.kafka.us-east-1.amazonaws.com:9092,b-3.pixel-studio-kafka.abc123.c2.kafka.us-east-1.amazonaws.com:9092
KAFKA_CLIENT_ID=pixel-studio
KAFKA_SASL_USERNAME=your-msk-username
KAFKA_SASL_PASSWORD=your-msk-password
KAFKA_SSL=true

# Processing Configuration
PROCESSING_WORKER_INSTANCES=3
MAX_CONCURRENT_GENERATIONS=10
GENERATION_TIMEOUT_MS=300000  // 5 minutes max per generation

# WebSocket Configuration
WS_PORT=3001
REDIS_WS_ADAPTER_URL=redis://localhost:6379/1
```

### **New Application Files Required**

#### **Kafka Service Configuration**

```typescript
// app/services/kafka.server.ts
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: process.env.KAFKA_BROKERS?.split(",") || [],
  ssl: process.env.KAFKA_SSL === "true",
  sasl: {
    mechanism: "scram-sha-512",
    username: process.env.KAFKA_SASL_USERNAME!,
    password: process.env.KAFKA_SASL_PASSWORD!,
  },
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const IMAGE_TOPICS = {
  GENERATION_REQUESTS: "image.generation.requests",
  GENERATION_STATUS: "image.generation.status",
  GENERATION_COMPLETE: "image.generation.complete",
  GENERATION_FAILED: "image.generation.failed",
};

export { kafka };
```

#### **Background Worker Service**

```typescript
// app/services/imageGenerationWorker.ts
import { kafka, IMAGE_TOPICS } from "./kafka.server";
import { createNewImages } from "~/server/createNewImages";
import { publishProcessingUpdate } from "./processingStatus.server";

export class ImageGenerationWorker {
  private consumer = kafka.consumer({ groupId: "image-generators" });

  async start(): Promise<void> {
    await this.consumer.subscribe({ topic: IMAGE_TOPICS.GENERATION_REQUESTS });

    await this.consumer.run({
      eachMessage: async ({ message, partition, offset }) => {
        const request = JSON.parse(message.value!.toString());

        try {
          // Update status to processing
          await publishProcessingUpdate(request.requestId, {
            status: "processing",
            message: `Starting generation of ${request.numberOfImages} images...`,
            progress: 10,
          });

          // Use existing image generation logic
          const result = await createNewImages(request, request.userId);

          // Publish success
          await this.publishSuccess(request, result);
        } catch (error) {
          await this.publishError(request, error as Error);
        }
      },
    });
  }

  private async publishSuccess(request: any, result: any): Promise<void> {
    await kafka.producer().send({
      topic: IMAGE_TOPICS.GENERATION_COMPLETE,
      messages: [
        {
          key: request.userId,
          value: JSON.stringify({
            requestId: request.requestId,
            setId: result.setId,
            images: result.images,
            completedAt: new Date(),
          }),
        },
      ],
    });
  }

  private async publishError(request: any, error: Error): Promise<void> {
    await kafka.producer().send({
      topic: IMAGE_TOPICS.GENERATION_FAILED,
      messages: [
        {
          key: request.userId,
          value: JSON.stringify({
            requestId: request.requestId,
            error: error.message,
            failedAt: new Date(),
          }),
        },
      ],
    });
  }
}
```

#### **Processing Status Service**

```typescript
// app/services/processingStatus.server.ts
import Redis from "ioredis";
import { WebSocket } from "ws";

const redis = new Redis(process.env.REDIS_WS_ADAPTER_URL);

interface ProcessingUpdate {
  requestId: string;
  status: "queued" | "processing" | "complete" | "failed";
  progress: number;
  message?: string;
  setId?: string;
  error?: string;
}

export async function publishProcessingUpdate(
  requestId: string,
  update: Omit<ProcessingUpdate, "requestId">
): Promise<void> {
  const fullUpdate: ProcessingUpdate = { requestId, ...update };

  // Store in Redis
  await redis.setex(
    `processing:${requestId}`,
    3600,
    JSON.stringify(fullUpdate)
  );

  // Broadcast to WebSocket clients
  await redis.publish("processing-updates", JSON.stringify(fullUpdate));
}

export async function getProcessingStatus(
  requestId: string
): Promise<ProcessingUpdate | null> {
  const data = await redis.get(`processing:${requestId}`);
  return data ? JSON.parse(data) : null;
}
```

#### **WebSocket Server for Real-time Updates**

```typescript
// app/services/websocket.server.ts
import { WebSocketServer } from "ws";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_WS_ADAPTER_URL);
const subscriber = new Redis(process.env.REDIS_WS_ADAPTER_URL);

export class ProcessingWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Map<string, Set<WebSocket>>();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    // Subscribe to processing updates
    subscriber.subscribe("processing-updates");
    subscriber.on("message", (channel, message) => {
      if (channel === "processing-updates") {
        const update = JSON.parse(message);
        this.broadcastToClients(update.requestId, update);
      }
    });
  }

  start(): void {
    this.wss.on("connection", (ws, request) => {
      const requestId = this.extractRequestId(request.url);

      if (requestId) {
        // Add client to request-specific group
        if (!this.clients.has(requestId)) {
          this.clients.set(requestId, new Set());
        }
        this.clients.get(requestId)!.add(ws);

        // Send current status
        this.sendCurrentStatus(ws, requestId);

        ws.on("close", () => {
          this.clients.get(requestId)?.delete(ws);
        });
      }
    });
  }

  private broadcastToClients(requestId: string, update: any): void {
    const clients = this.clients.get(requestId);
    if (clients) {
      clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(update));
        }
      });
    }
  }

  private extractRequestId(url: string | undefined): string | null {
    const match = url?.match(/\/processing\/([^\/]+)\/status/);
    return match ? match[1] : null;
  }
}
```

#### **New Routes Required**

```typescript
// app/routes/processing.$requestId.tsx - Processing page
// app/routes/api.processing.$requestId.status.ts - WebSocket endpoint
// app/routes/api.kafka.health.ts - Kafka health check
```

### **Deployment Requirements**

#### **Docker Compose for Local Development**

```yaml
# docker-compose.kafka.yml
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

#### **Process Management**

```typescript
// scripts/startWorkers.ts - Start background consumers
// scripts/createTopics.ts - Initialize Kafka topics
// scripts/healthCheck.ts - Monitor system health
```

### **Implementation Checklist**

#### **Week 1: Infrastructure Setup**

- [ ] Set up AWS MSK cluster
- [ ] Configure security groups and authentication
- [ ] Install Kafka dependencies (`kafkajs`, `ws`, etc.)
- [ ] Create basic Kafka service configuration
- [ ] Set up local development environment with Docker

#### **Week 2: Core Implementation**

- [ ] Modify `create.tsx` to use Kafka producer (instant response)
- [ ] Build image generation background consumer
- [ ] Create processing status service with Redis
- [ ] Implement WebSocket server for real-time updates
- [ ] Create processing page (`/processing/$requestId`)

#### **Week 3: Testing & Monitoring**

- [ ] Add comprehensive error handling and retry logic
- [ ] Set up Prometheus metrics for Kafka
- [ ] Create health check endpoints
- [ ] Load testing with concurrent image generations
- [ ] Deploy to staging environment

### **Cost Analysis**

```yaml
AWS MSK Monthly Costs:
  MSK Cluster (kafka.t3.small × 3): $150
  Storage (100GB × 3): $30
  Data Transfer: $20-50 (depending on volume)
  Monitoring: $20
  Total: ~$220-250/month

Additional Operational Costs:
  Redis for WebSocket state: $15-25/month
  Additional ELB for WebSocket: $16/month
  CloudWatch logs: $10-20/month
  Total System Cost: ~$260-310/month
```

### **When NOT to Use Kafka**

**Skip Kafka for:**

- Simple CRUD operations (user profiles, image metadata)
- Low-volume synchronous requests (authentication)
- File uploads/downloads (stick with S3 direct uploads)
- Basic caching (Redis is better)

### **Expected Benefits**

- **Video Processing**: 50% improvement in processing pipeline reliability
- **Scalability**: Handle 10x more concurrent operations
- **Real-time Features**: Sub-second activity updates
- **Cost Optimization**: Smart AI model selection based on real-time costs
- **Monitoring**: Comprehensive pipeline observability with Prometheus integration

---

## 8. Risk Assessment & Mitigation

### **High Risk Items**

1. **Gemini API Rate Limits**: Start with gradual rollout, implement queuing
2. **Video Processing Costs**: Set strict usage limits, implement user credits
3. **Storage Costs**: Implement lifecycle policies, user storage quotas

### **Technical Risks**

1. **Database Performance**: Implement proper indexing, consider sharding
2. **API Reliability**: Multiple provider fallbacks, circuit breakers
3. **User Experience**: Progressive loading, offline capabilities

---

## 8. Prisma ORM to Raw PostgreSQL Migration

### **Migration Strategy Overview**

- **Current**: Prisma ORM with generated client
- **Target**: Raw PostgreSQL with custom database layer
- **Timeline**: 16-24 weeks across 3 phases
- **Benefits**: 20-40% performance improvement, reduced memory usage, full SQL control

### **Phase 1: Database Abstraction Layer (4-6 weeks)**

#### **New Database Connection System**

```typescript
// app/database/connection.ts
import { Pool, PoolClient } from "pg";

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  async query<T>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.getClient();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      // Performance monitoring
      if (duration > 1000) {
        logger.warn("Slow query detected", { query: text, duration });
      }

      return result.rows;
    } finally {
      client.release();
    }
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
```

#### **Repository Pattern Implementation**

```typescript
// app/database/repositories/ImageRepository.ts
export class ImageRepository extends BaseRepository<Image> {
  async findPopularImages(limit: number): Promise<ImageWithStats[]> {
    const query = `
      SELECT 
        i.*,
        COUNT(DISTINCT il.user_id) as like_count,
        COUNT(DISTINCT c.id) as comment_count,
        u.username, u.image as user_avatar
      FROM Image i
      LEFT JOIN ImageLike il ON i.id = il.image_id
      LEFT JOIN Comment c ON i.id = c.image_id
      LEFT JOIN "User" u ON i.user_id = u.id
      WHERE i.private = false
      GROUP BY i.id, u.id
      ORDER BY like_count DESC, i.created_at DESC
      LIMIT $1
    `;

    const rows = await this.db.query(query, [limit]);
    return rows.map((row) => this.mapToImageWithStats(row));
  }
}
```

### **Phase 2: Service Migration (8-12 weeks)**

- Migrate read-heavy services first (image browsing, user profiles)
- Replace Prisma queries with optimized raw SQL
- Add comprehensive performance monitoring
- Implement connection pooling and transaction management

### **Phase 3: Complete Migration (4-6 weeks)**

- Remove all Prisma dependencies
- Custom migration and seed tools
- Performance testing and optimization
- Team training and documentation

### **Infrastructure Requirements**

```bash
# New dependencies
npm install pg @types/pg

# Remove Prisma
npm uninstall prisma @prisma/client
rm -rf prisma/

# New tooling scripts
"db:migrate": "tsx app/scripts/migrate.ts"
"db:seed": "tsx app/scripts/seed.ts"
"db:reset": "tsx app/scripts/resetDb.ts"
```

### **Expected Improvements**

- **Query Performance**: 20-40% faster execution
- **Memory Usage**: 30-50MB reduction per instance
- **Bundle Size**: Smaller production builds
- **Developer Control**: Full SQL optimization capabilities
- **Debugging**: Direct query access and monitoring

### **Risk Mitigation**

- **Type Safety**: Custom TypeScript interfaces with runtime validation
- **SQL Injection**: Parameterized queries, comprehensive input validation
- **Development Speed**: Repository patterns, query builders, code generators
- **Migration Complexity**: Gradual rollout, extensive testing, rollback plans

This comprehensive plan should give you a clear roadmap for implementation. Would you like me to dive deeper into any specific area or create implementation checklists for individual phases?
