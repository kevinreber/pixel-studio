# 🎨 Pixel Studio

> AI-powered image generation platform with real-time processing, collections, and social features.

**Pixel Studio** is a modern web application that allows users to generate stunning images using various AI models including DALL-E, Stable Diffusion, and Flux. Built with Remix, featuring real-time progress updates via WebSockets and Kafka-based async processing.

## ✨ Features

- 🤖 **Multiple AI Models**: DALL-E 3/2, Stable Diffusion XL, Flux Pro/Dev/Schnell
- ⚡ **Async Processing**: Kafka-based queue system with real-time updates
- 📱 **Real-time UI**: WebSocket integration for live progress tracking
- 🗂️ **Collections**: Organize and share your generated images
- 👥 **Social Features**: Comments, likes, and user profiles
- 🎨 **Style Presets**: Pre-configured art styles (anime, cinematic, digital art, etc.)
- 🔒 **Authentication**: Google OAuth integration
- 💳 **Credits System**: Stripe integration for usage-based billing
- 📊 **Analytics**: Comprehensive usage tracking and monitoring

## 🛠️ Tech Stack

- **Frontend**: [Remix](https://remix.run) + React + TypeScript
- **Styling**: TailwindCSS + Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Remix Auth + Supabase
- **Queue System**: Apache Kafka (KafkaJS)
- **Cache**: Upstash Redis
- **File Storage**: AWS S3
- **WebSockets**: Native WebSocket with connection pooling
- **AI APIs**: OpenAI, Hugging Face Inference
- **Payments**: Stripe
- **Analytics**: Vercel Analytics + Sentry
- **Infrastructure**: Docker + AWS (MSK, VPC)

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** or **yarn**
- **Docker** & **Docker Compose**
- **PostgreSQL** database (local or hosted)
- **Upstash Redis** account
- **OpenAI API key**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pixel-studio.git
cd pixel-studio
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Fill in your environment variables (see [Environment Variables](#-environment-variables) section).

### 4. Database Setup

```bash
# Generate Prisma client
npm run postinstall

# Run database migrations (if using a hosted DB)
npx prisma db push

# Optional: Seed the database
npx prisma db seed
```

### 5. Start Kafka (for async processing)

```bash
# Start Kafka with Docker Compose
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml up -d

# Create Kafka topics
npm run kafka:create-topics

# Verify Kafka health
npm run kafka:health
```

### 6. Start the Application

```bash
# Terminal 1: Start the main app
npm run dev

# Terminal 2: Start Kafka consumers (for image processing)
npm run kafka:consumer

# Terminal 3: Start WebSocket server (for real-time updates)
npm run kafka:websocket
```

The app will be available at `http://localhost:5173`

**Kafka UI** (optional): `http://localhost:8080`

## 📋 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pixel-studio"
DIRECT_URL="postgresql://user:password@localhost:5432/pixel-studio"

# Authentication
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
SESSION_SECRET="your-session-secret-key"

# Supabase (for additional auth features)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# AI Services
OPENAI_API_KEY="sk-your-openai-api-key"
HUGGINGFACE_API_KEY="hf_your-huggingface-key"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# AWS S3 (for image storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-s3-bucket"

# Stripe (for payments)
STRIPE_PUBLIC_KEY="pk_test_your-stripe-public-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Kafka Configuration (Local Development)
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID="pixel-studio"
KAFKA_SSL="false"
PROCESSING_WORKER_INSTANCES="3"
MAX_CONCURRENT_GENERATIONS="10"
GENERATION_TIMEOUT_MS="300000"
ENABLE_KAFKA_IMAGE_GENERATION="true"

# WebSocket
WS_PORT="3001"

# Application
NODE_ENV="development"
BASE_URL="http://localhost:5173"
```

See `env.example` for a complete template.

## 📖 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript checks
npm run lint         # Run ESLint
```

### Database

```bash
npx prisma studio          # Open Prisma Studio
npx prisma db push         # Push schema to database
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Create and apply migrations
```

### Kafka & Processing

```bash
npm run kafka:create-topics  # Initialize Kafka topics
npm run kafka:consumer      # Start background workers
npm run kafka:websocket     # Start WebSocket server
npm run kafka:health        # Check Kafka cluster health
npm run kafka:monitor       # Monitor Kafka topics
```

### Testing

```bash
npm run test         # Run unit tests
npm run test:e2e     # Run Playwright tests
```

### Payments

```bash
npm run stripe:listen  # Listen for Stripe webhooks (development)
```

## 🏗️ Architecture Overview

### Async Image Generation Flow

```mermaid
graph TD
    A[User Form] --> B[Remix Action]
    B --> C[Kafka Producer]
    C --> D[Kafka Queue]
    D --> E[Background Workers]
    E --> F[AI APIs]
    F --> G[Image Storage]
    G --> H[Database Update]
    H --> I[WebSocket Notification]
    I --> J[Real-time UI Update]
    J --> K[Redirect to Results]
```

### Project Structure

```
pixel-studio/
├── app/                          # Remix application
│   ├── components/              # Reusable UI components
│   ├── pages/                  # Page-level components
│   ├── routes/                 # Remix routes (pages + API)
│   ├── services/               # Business logic & integrations
│   ├── server/                 # Server-side utilities
│   ├── utils/                  # Shared utilities
│   └── types/                  # TypeScript definitions
├── infrastructure/             # Infrastructure as code
│   └── kafka/                  # Kafka deployment configs
├── prisma/                     # Database schema & migrations
├── scripts/                    # Utility scripts
└── tests/                      # Test files
```

## 🔄 Processing Modes

The application supports two processing modes:

### 1. Synchronous Mode (Legacy)

```env
ENABLE_KAFKA_IMAGE_GENERATION=false
```

- Immediate processing during form submission
- User waits 30-120 seconds for completion
- Simpler setup, no Kafka required

### 2. Asynchronous Mode (Recommended)

```env
ENABLE_KAFKA_IMAGE_GENERATION=true
```

- Immediate form response
- Background processing via Kafka
- Real-time progress updates
- Better scalability and user experience

## 📦 Key Services

### Image Generation

- **Models**: DALL-E 3/2, Stable Diffusion XL, Flux variants
- **Processing**: Queue-based with retry logic
- **Storage**: AWS S3 with CDN
- **Monitoring**: Real-time progress tracking

### Authentication

- **Google OAuth**: Primary login method
- **Session Management**: Remix Auth + Supabase
- **Authorization**: Role-based access control

### Collections

- **Organization**: Group related images
- **Sharing**: Public/private collections
- **Social**: Comments and likes system

### Payments

- **Credits System**: Pay-per-generation model
- **Stripe Integration**: Secure payment processing
- **Usage Tracking**: Comprehensive analytics

## 🛠️ Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

### Component Structure

- **Pages**: High-level page components
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks
- **Services**: Business logic abstraction

### API Routes

- **RESTful**: Standard HTTP methods
- **Validation**: Zod schema validation
- **Error Handling**: Consistent error responses
- **Authentication**: Protected routes

## 📚 Documentation

- [**Kafka Setup Guide**](./infrastructure/kafka/README.md) - Detailed Kafka configuration
- [**Technical Implementation Guide**](./TECHNICAL_IMPLEMENTATION_GUIDE.md) - Architecture deep dive
- [**Environment Setup**](./KAFKA_ENVIRONMENT_SETUP.md) - Environment variables guide

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Install** dependencies: `npm install`
4. **Set up** environment variables (see `env.example`)
5. **Start** development servers (main app + Kafka + WebSocket)
6. **Make** your changes
7. **Test** your changes: `npm run test && npm run test:e2e`
8. **Lint** your code: `npm run lint`
9. **Commit** your changes: `git commit -m 'Add amazing feature'`
10. **Push** to the branch: `git push origin feature/amazing-feature`
11. **Open** a Pull Request

### Before Contributing

- Read the [Technical Implementation Guide](./TECHNICAL_IMPLEMENTATION_GUIDE.md)
- Check existing issues and PRs
- Follow our coding standards
- Write tests for new features
- Update documentation as needed

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Errors**

```bash
# Check database URL
echo $DATABASE_URL
# Test connection
npx prisma db push
```

**2. Kafka Connection Issues**

```bash
# Verify Kafka is running
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml ps
# Check Kafka health
npm run kafka:health
```

**3. WebSocket Connection Failures**

```bash
# Check WebSocket server
curl -I http://localhost:3001/health
# Verify port availability
lsof -i :3001
```

**4. Image Generation Errors**

- Verify API keys (OpenAI, HuggingFace)
- Check AWS S3 permissions
- Monitor Kafka topics for error messages

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-username/pixel-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/pixel-studio/discussions)
- **Documentation**: Check the guides in this repository

## 🚀 Deployment

Pixel Studio can be deployed to various platforms. Here's a comprehensive guide for different deployment scenarios.

### 📋 Deployment Overview

**Required Services:**

- **Web App Hosting**: Vercel, Railway, Fly.io, or AWS/VPS
- **Database**: PostgreSQL (Supabase, Railway, AWS RDS, or hosted)
- **Queue System**: Apache Kafka (AWS MSK or self-hosted)
- **Cache**: Upstash Redis
- **File Storage**: AWS S3
- **WebSocket Server**: Same host as web app or separate instance

### 📁 Deployment Files Reference

| File/Directory                    | Purpose                     | Deployment Service     |
| --------------------------------- | --------------------------- | ---------------------- |
| `server.js`                       | Production Express server   | Web hosting platforms  |
| `package.json`                    | Dependencies and scripts    | All platforms          |
| `vite.config.ts`                  | Build configuration         | Build process          |
| `prisma/schema.prisma`            | Database schema             | PostgreSQL hosting     |
| `infrastructure/kafka/`           | **Kafka deployment files**  | **AWS MSK**            |
| `├── deploy.sh`                   | **MSK deployment script**   | **AWS MSK**            |
| `├── msk-cluster.yml`             | **CloudFormation template** | **AWS MSK**            |
| `├── docker-compose.kafka.yml`    | Local Kafka development     | Local only             |
| `scripts/checkKafkaHealth.ts`     | Kafka monitoring            | Background jobs        |
| `scripts/createKafkaTopics.ts`    | Kafka initialization        | Background jobs        |
| `scripts/startConsumers.ts`       | **Background workers**      | **Separate instances** |
| `scripts/startWebSocketServer.ts` | **Real-time updates**       | **WebSocket hosting**  |
| `env.example`                     | Environment template        | Configuration          |
| `tailwind.config.ts`              | CSS configuration           | Build process          |
| `playwright.config.ts`            | E2E testing                 | CI/CD                  |

### 🌐 Platform-Specific Deployment

#### **Option 1: Vercel (Recommended for Frontend)**

**✅ Pros**: Zero-config Remix support, automatic deployments, global CDN
**❌ Cons**: Serverless limitations for long-running processes

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configure environment variables in Vercel dashboard
# (Copy from your .env file)
```

**Required Vercel Configuration:**

- Set `ENABLE_KAFKA_IMAGE_GENERATION=false` (use sync mode)
- All other environment variables from `env.example`
- **Separate instances needed**: Kafka consumers and WebSocket server

#### **Option 2: Railway (Full-Stack)**

**✅ Pros**: Supports long-running processes, built-in PostgreSQL, simple setup
**❌ Cons**: More expensive than serverless options

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

**Railway Services Setup:**

```yaml
# railway.toml (create this file)
[deploy]
  startCommand = "npm start"
  restartPolicyType = "always"

[build]
  builder = "NIXPACKS"
```

#### **Option 3: AWS (Full Production)**

**✅ Pros**: Complete control, all services integrated, production-ready
**❌ Cons**: Complex setup, requires AWS knowledge

**Architecture:**

```
┌─ ECS/EC2 (Web App)
├─ RDS (PostgreSQL)
├─ MSK (Kafka)
├─ S3 (File Storage)
├─ ECS (Background Workers)
└─ ECS/EC2 (WebSocket Server)
```

**Deployment Steps:**

1. **Deploy Kafka (MSK)**:

```bash
cd infrastructure/kafka
./deploy.sh deploy -e prod -v vpc-xxx -s subnet-xxx,subnet-yyy -g sg-xxx
```

2. **Setup RDS PostgreSQL**:

```bash
# Create RDS instance via AWS Console or CLI
# Update DATABASE_URL in environment
```

3. **Deploy Web Application**:

```bash
# Build the application
npm run build

# Deploy to ECS/EC2
# Use server.js as entry point
```

4. **Deploy Background Services**:

```bash
# Separate ECS services for:
# - Kafka consumers: scripts/startConsumers.ts
# - WebSocket server: scripts/startWebSocketServer.ts
```

#### **Option 4: Self-Hosted VPS**

**✅ Pros**: Complete control, cost-effective for high usage
**❌ Cons**: Requires system administration knowledge

**Setup Process:**

1. **Server Setup**:

```bash
# Ubuntu/Debian server
sudo apt update && sudo apt upgrade
sudo apt install nodejs npm docker.io docker-compose

# Install PM2 for process management
npm install -g pm2
```

2. **Deploy Application**:

```bash
# Clone and build
git clone <your-repo>
cd pixel-studio
npm install
npm run build

# Start services with PM2
pm2 start ecosystem.config.js
```

3. **Create PM2 Config** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: "pixel-studio-web",
      script: "server.js",
      env: { NODE_ENV: "production" },
    },
    {
      name: "pixel-studio-consumers",
      script: "scripts/startConsumers.ts",
      interpreter: "tsx",
    },
    {
      name: "pixel-studio-websocket",
      script: "scripts/startWebSocketServer.ts",
      interpreter: "tsx",
    },
  ],
};
```

4. **Setup Kafka** (if not using cloud):

```bash
# Start Kafka with Docker Compose
docker-compose -f infrastructure/kafka/docker-compose.kafka.yml up -d

# Initialize topics
npm run kafka:create-topics
```

### ⚙️ Environment Configuration by Platform

#### **Vercel Environment Variables**

```env
# Required for Vercel
ENABLE_KAFKA_IMAGE_GENERATION=false  # Use sync mode
DATABASE_URL=<your-database-url>
OPENAI_API_KEY=<your-openai-key>
# ... other variables from env.example
```

#### **Railway Environment Variables**

```env
# Can use full async mode
ENABLE_KAFKA_IMAGE_GENERATION=true
KAFKA_BROKERS=localhost:9092  # If using Railway's internal network
# ... all variables from env.example
```

#### **AWS Production Environment Variables**

```env
# Production MSK setup
KAFKA_BROKERS=<msk-cluster-endpoints>
KAFKA_SSL=true
KAFKA_SASL_USERNAME=<msk-username>
KAFKA_SASL_PASSWORD=<msk-password>
DATABASE_URL=<rds-endpoint>
# ... other production values
```

### 🔄 Deployment Workflows

#### **GitHub Actions CI/CD** (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 🔍 Post-Deployment Checklist

**✅ Web Application**

- [ ] App loads and responds to requests
- [ ] Authentication (Google OAuth) works
- [ ] Database connection successful
- [ ] File uploads to S3 working

**✅ Kafka/Background Processing** (if using async mode)

- [ ] Kafka cluster healthy: `npm run kafka:health`
- [ ] Topics created: `npm run kafka:create-topics`
- [ ] Consumers running: `npm run kafka:consumer`
- [ ] WebSocket server responding: `curl -I http://your-domain/ws-health`

**✅ Environment Variables**

- [ ] All required variables set (check `env.example`)
- [ ] API keys valid and working
- [ ] Database URL accessible
- [ ] S3 bucket permissions correct

**✅ Performance & Monitoring**

- [ ] Application performance acceptable
- [ ] Error tracking setup (Sentry)
- [ ] Analytics working (Vercel Analytics)
- [ ] Logs accessible and readable

### 💰 Cost Estimates

| Platform                       | Monthly Cost | Best For                          |
| ------------------------------ | ------------ | --------------------------------- |
| **Vercel** + External Services | $50-200      | Small to medium apps              |
| **Railway** Full Stack         | $80-300      | Full-stack with databases         |
| **AWS** Production             | $150-500+    | Large-scale production            |
| **VPS** Self-hosted            | $20-100      | Cost-conscious with DevOps skills |

### 🚨 Production Considerations

**Security:**

- Use HTTPS for all endpoints
- Rotate API keys regularly
- Enable CORS properly
- Use environment variables, never hardcode secrets

**Scalability:**

- Monitor Kafka consumer lag
- Scale WebSocket servers based on concurrent users
- Use CDN for static assets
- Implement database connection pooling

**Monitoring:**

- Set up health checks for all services
- Monitor queue depths and processing times
- Track error rates and response times
- Set up alerts for service failures

**Backup & Recovery:**

- Regular database backups
- S3 bucket versioning and backup
- Infrastructure as Code (CloudFormation templates)
- Disaster recovery procedures documented

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Remix](https://remix.run) - Full-stack React framework
- [OpenAI](https://openai.com) - AI model APIs
- [Hugging Face](https://huggingface.co) - Open-source AI models
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Prisma](https://prisma.io) - Modern database toolkit

---

**Built with ❤️ by Kevin Reber**
