# MCP (Model Context Protocol) Configuration

This guide covers MCP server configuration for Pixel Studio, enabling Claude Code to interact with external tools and services.

## What is MCP?

MCP (Model Context Protocol) is an open standard that allows Claude Code to securely connect with databases, APIs, and external tools. With MCP, Claude can:

- Query your PostgreSQL database directly
- Manage GitHub issues and PRs
- Access AWS S3 storage
- Interact with Redis cache
- Process Stripe payments
- And much more

## Quick Start

```bash
# Add GitHub integration
claude mcp add --transport http github --scope project https://api.githubcopilot.com/mcp/

# Add Prisma for database
claude mcp add --transport http prisma --scope project https://mcp.prisma.io/mcp

# List configured servers
claude mcp list

# Authenticate in Claude Code session
> /mcp
```

## Configuration File

MCP servers are configured in `.mcp.json` (project scope) or `~/.claude.json` (personal scope).

### Recommended Setup for Pixel Studio

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "note": "Manage issues, PRs, and repository"
    },
    "prisma": {
      "type": "http",
      "url": "https://mcp.prisma.io/mcp",
      "note": "Database migrations and Prisma Studio"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp",
      "note": "Error tracking and debugging"
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      },
      "note": "Direct PostgreSQL queries"
    },
    "aws-s3": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@aws-samples/mcp-server-s3"],
      "env": {
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
        "AWS_DEFAULT_REGION": "${AWS_DEFAULT_REGION:-us-east-1}"
      },
      "note": "S3 bucket operations"
    },
    "redis": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-server-redis"],
      "env": {
        "REDIS_URL": "${UPSTASH_REDIS_REST_URL}"
      },
      "note": "Redis cache operations"
    }
  }
}
```

## Available MCP Servers

### Core Infrastructure

| Server | Purpose | Transport | Best For |
|--------|---------|-----------|----------|
| **prisma** | Database migrations, Prisma Studio | HTTP | Schema changes, data browsing |
| **postgres** | Direct SQL queries | Stdio | Complex queries, data analysis |
| **redis** | Cache operations | Stdio | Cache debugging, key inspection |
| **aws-s3** | S3 bucket management | Stdio | Image storage, file operations |

### Development Tools

| Server | Purpose | Transport | Best For |
|--------|---------|-----------|----------|
| **github** | Issues, PRs, workflows | HTTP | Code review, issue management |
| **sentry** | Error tracking | HTTP | Debugging production errors |
| **stripe** | Payment operations | HTTP | Customer data, subscriptions |

### Additional Options

| Server | Purpose | Install Command |
|--------|---------|-----------------|
| **filesystem** | Local file access | `npx -y @modelcontextprotocol/server-filesystem` |
| **memory** | Persistent memory | `npx -y @modelcontextprotocol/server-memory` |
| **puppeteer** | Browser automation | `npx -y @modelcontextprotocol/server-puppeteer` |
| **fetch** | HTTP requests | `npx -y @modelcontextprotocol/server-fetch` |

## Configuration Scopes

### Project Scope (Shared with Team)
```bash
# Stored in .mcp.json (commit to git)
claude mcp add --transport http github --scope project https://api.githubcopilot.com/mcp/
```

### Local Scope (Personal, Not Committed)
```bash
# Stored in ~/.claude.json for this project only
claude mcp add --transport stdio postgres --scope local \
  --env DATABASE_URL=postgresql://localhost/dev \
  -- npx -y @modelcontextprotocol/server-postgres
```

### User Scope (Global, All Projects)
```bash
# Stored in ~/.claude.json globally
claude mcp add --transport http notion --scope user https://mcp.notion.com/mcp
```

**Priority**: Local > Project > User

## Environment Variables

Use `${VAR}` syntax for environment variable expansion:

```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}",
        "READONLY_URL": "${READONLY_DATABASE_URL:-${DATABASE_URL}}"
      }
    }
  }
}
```

- `${VAR}` - Uses variable or fails if not set
- `${VAR:-default}` - Uses variable or fallback value

## Using MCP in Claude Code

### Check Server Status
```bash
> /mcp
# Shows connected servers and their tools
```

### Reference MCP Resources
```bash
# Reference database schema
> Analyze @postgres:schema://users table

# Reference GitHub issue
> Fix bug described in @github:issue://123
```

### Use MCP Tools
```bash
# Claude automatically uses appropriate MCP tools
> "What are the last 10 images created?"
# Uses postgres MCP to query database

> "Show me open PRs that need review"
# Uses github MCP to list PRs
```

## Server-Specific Setup

### GitHub

```bash
claude mcp add --transport http github --scope project https://api.githubcopilot.com/mcp/
```

Then authenticate:
```bash
claude
> /mcp
# Click GitHub to authenticate via browser
```

**Capabilities**:
- Create/read/update issues
- Manage pull requests
- Trigger workflows
- Search code and commits

### Prisma

```bash
claude mcp add --transport http prisma --scope project https://mcp.prisma.io/mcp
```

**Capabilities**:
- `migrate-status` - Check migration status
- `migrate-dev` - Create and run migrations
- `migrate-reset` - Reset database
- `studio` - Open Prisma Studio

### PostgreSQL (Direct)

```bash
claude mcp add --transport stdio postgres --scope local \
  --env DATABASE_URL="${DATABASE_URL}" \
  -- npx -y @modelcontextprotocol/server-postgres
```

**Capabilities**:
- Execute SELECT queries
- Analyze query performance
- Inspect table structures
- Generate data reports

### AWS S3

```bash
claude mcp add --transport stdio aws-s3 --scope project \
  --env AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  --env AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  -- npx -y @aws-samples/mcp-server-s3
```

**Capabilities**:
- List bucket contents
- Upload/download files
- Manage object metadata
- Generate presigned URLs

### Sentry

```bash
claude mcp add --transport http sentry --scope project https://mcp.sentry.dev/mcp
```

**Capabilities**:
- Query recent errors
- Analyze error trends
- Find error sources
- Track release health

### Stripe

```bash
claude mcp add --transport http stripe --scope project \
  --header "Authorization: Bearer ${STRIPE_SECRET_KEY}" \
  https://mcp.stripe.com
```

**Capabilities**:
- Query customers
- View subscriptions
- Analyze revenue
- Debug webhooks

## Security Best Practices

### 1. Never Commit Secrets
```bash
# WRONG - in .mcp.json
"env": { "API_KEY": "sk_live_xxx" }

# RIGHT - use environment variables
"env": { "API_KEY": "${STRIPE_SECRET_KEY}" }
```

### 2. Use Read-Only Where Possible
```json
{
  "env": {
    "DATABASE_URL": "${READONLY_DATABASE_URL:-${DATABASE_URL}}"
  }
}
```

### 3. Scope Appropriately
- **Project scope**: Shared, non-sensitive servers (GitHub, Sentry)
- **Local scope**: Database connections with credentials
- **User scope**: Personal utilities

### 4. Validate Before Sharing
```bash
# Test locally first
claude mcp add --transport stdio test --scope local -- npx -y package

# Then share with team
claude mcp add --transport stdio test --scope project -- npx -y package
```

## Management Commands

```bash
# List all servers
claude mcp list

# Get server details
claude mcp get github

# Remove a server
claude mcp remove postgres

# Reset all MCP configuration
claude mcp reset
```

## Troubleshooting

### Server Not Connecting

```bash
# Check if server is configured
claude mcp list

# Verify environment variables are set
echo $DATABASE_URL

# Check Claude Code session
> /mcp
```

### Authentication Issues

```bash
# Re-authenticate OAuth servers
> /mcp
# Click server name to re-authenticate
```

### Timeout Issues

```bash
# Increase timeout (default 10s)
export MCP_TIMEOUT=30000
claude
```

### Large Output Issues

```bash
# Increase output limit (default 25000 tokens)
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

## Example Workflows

### Database Analysis
```
> "Analyze the Image table schema and suggest indexes for common queries"
# Uses postgres MCP to inspect schema and query patterns
```

### Bug Investigation
```
> "Check Sentry for errors related to image generation in the last 24 hours"
# Uses sentry MCP to query recent errors
```

### S3 Cleanup
```
> "Find orphaned images in S3 that aren't referenced in the database"
# Uses both postgres and aws-s3 MCPs
```

### Release Preparation
```
> "Create a PR summary for all commits since last release"
# Uses github MCP to analyze commits and generate summary
```

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Claude Code MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Awesome MCP Servers](https://mcpservers.org/)
