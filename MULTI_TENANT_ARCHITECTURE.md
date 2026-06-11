# Multi-Tenant E-Commerce Platform Architecture

## Overview

This is a complete **production-ready multi-tenant SaaS e-commerce platform** with:
- **Unified Admin Dashboard** managing 3+ independent storefronts
- **Dynamic Provisioning** for creating new standalone domains
- **Complete Tenant Isolation** (database, storage, frontend)
- **CDN-based Asset Management** fixing cross-domain media issues
- **Reverse Proxy Routing** (NGINX) for multi-domain access

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ REVERSE PROXY (NGINX - Port 80/443)                     │
│  - admin.domain.com → Admin Dashboard (3000)            │
│  - storeA.com → Storefront Backend (3001)              │
│  - storeB.com → Storefront Backend (3002)              │
│  - storeC.com → Storefront Backend (3003)              │
│  - cdn.domain.com → CDN Server (5001)                  │
├─────────────────────────────────────────────────────────┤
│ APP LAYER (Node.js/Express)                             │
│  - Multi-tenant middleware (tenant context injection)   │
│  - Provisioning service (tenant creation)               │
│  - Asset manager (S3 uploads, CDN routing)              │
│  - API endpoints (scoped to tenant)                     │
├─────────────────────────────────────────────────────────┤
│ DATA LAYER (PostgreSQL + Redis)                         │
│  - Master DB (admin.domain.com):                        │
│    └─ tenants, api_keys, audit_logs                    │
│  - Tenant schemas:                                      │
│    └─ tenant_${id}.products                             │
│    └─ tenant_${id}.orders                               │
│    └─ tenant_${id}.customers                            │
│    └─ tenant_${id}.storefront_config                    │
├─────────────────────────────────────────────────────────┤
│ STORAGE LAYER (AWS S3 + CloudFront CDN)                │
│  - S3 bucket: s3://sme-assets/tenants/{id}/             │
│  - CDN: https://cdn.domain.com/tenants/{id}/banners/    │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── src/
│   ├── components/              # React UI components
│   ├── server/
│   │   ├── db.ts               # Multi-tenant database init
│   │   ├── provisioning.ts     # Tenant creation service
│   │   ├── tenant-context.ts   # Middleware for tenant validation
│   │   ├── asset-manager.ts    # S3/CDN upload manager
│   │   └── multi-tenant-routes.ts  # API routes (provisioning, assets)
│   └── types.ts                # Updated with CDN URL fields
├── server.ts                   # Main Express app (enhanced)
├── nginx.conf                  # Reverse proxy config
├── docker-compose.yml          # Local development stack
├── Dockerfile                  # App container
└── README.md                   # This file
```

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose
- AWS credentials (for S3 uploads, optional for local dev)
- PostgreSQL running or Docker

### 1. Environment Setup

Create `.env` file:
```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sme_master
REDIS_URL=redis://redis:6379

# AWS (optional - for S3 uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_BASE=sme-assets
CDN_DOMAIN=https://cdn.domain.com

# Google Gemini (for AI features)
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Start the Stack

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **NGINX** (port 80, 443)
- **Node.js App** (ports 3000-3005)

### 3. Verify Services

```bash
# Check health
curl http://health.localhost/health

# Admin dashboard
curl http://localhost:3000

# Provision a new tenant
curl -X POST http://localhost:3000/api/admin/provision \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "store1.localhost",
    "name": "Store 1",
    "ownerEmail": "owner@store1.com",
    "ownerName": "John Doe",
    "plan": "monthly"
  }'
```

Response:
```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "domain": "store1.localhost",
  "apiKey": "abc123def456...",
  "backendUrl": "http://localhost:3001",
  "s3Bucket": "sme-tenant-550e8400",
  "status": "success"
}
```

## API Endpoints

### Admin APIs

**Provision New Tenant**
```
POST /api/admin/provision
Body: {domain, name, ownerEmail, ownerName, plan}
Response: {tenantId, domain, apiKey, backendUrl, s3Bucket}
```

**List Tenants**
```
GET /api/admin/tenants?limit=100&offset=0
Response: {data: [...], limit, offset}
```

**Get Tenant**
```
GET /api/admin/tenants/:tenantId
Response: {id, domain, name, status, ...}
```

**Suspend Tenant**
```
POST /api/admin/tenants/:tenantId/suspend
Body: {reason}
```

**Delete Tenant**
```
POST /api/admin/tenants/:tenantId/delete
```

### Tenant APIs (Asset Management)

**Upload Banner**
```
POST /api/assets/upload/banner
Headers: X-Tenant-ID: {tenantId}
Form: file (multipart/form-data)
Response: {url: "https://cdn.domain.com/...", key, status}
```

**Upload Product Image**
```
POST /api/assets/upload/product
Headers: X-Tenant-ID: {tenantId}
Form: file (multipart/form-data)
Response: {url, key, status}
```

**Upload Hero Image**
```
POST /api/assets/upload/hero
Headers: X-Tenant-ID: {tenantId}
Form: file (multipart/form-data)
Response: {url, key, status}
```

**Upload Custom Icon**
```
POST /api/assets/upload/icon
Headers: X-Tenant-ID: {tenantId}
Form: file (multipart/form-data)
Response: {url, key, status}
```

**List Assets**
```
GET /api/assets?folder=banners
Headers: X-Tenant-ID: {tenantId}
Response: {data: [{key, size, url, ...}]}
```

**Delete Asset**
```
DELETE /api/assets/{key}
Headers: X-Tenant-ID: {tenantId}
Response: {status, message}
```

### Storefront Configuration APIs

**Get Storefront Config**
```
GET /api/storefront/config
Headers: X-Tenant-ID: {tenantId}
Response: {name, tagline, primary_color, banner_url, hero_image_url, ...}
```

**Update Storefront Config**
```
PUT /api/storefront/config
Headers: X-Tenant-ID: {tenantId}
Body: {name, tagline, primary_color, theme_style, banner_text, custom_font, ...}
Response: Updated config object
```

## Tenant Provisioning Workflow

### Step 1: Admin Initiates Provisioning
```typescript
// Admin submits form → calls API
POST /api/admin/provision {
  domain: "newstore.com",
  name: "New Store",
  ownerEmail: "owner@newstore.com",
  plan: "monthly"
}
```

### Step 2: Provisioning Service Executes
```typescript
// provisioning.ts orchestrates:
1. Validates domain uniqueness
2. Allocates next available port (3001-3999)
3. Generates API key + hash
4. Creates S3 bucket reference
5. Inserts tenant record in master DB
6. Stores API key hash
7. Logs audit event
```

### Step 3: Schema Initialization (Async)
```typescript
// Non-blocking initialization:
1. CREATE SCHEMA tenant_${id}
2. Create tenant-specific tables:
   - products, orders, customers
   - storefront_config
3. Initialize default storefront config
```

### Step 4: Response
```json
{
  "tenantId": "uuid",
  "domain": "newstore.com",
  "apiKey": "secret_key",
  "backendUrl": "http://localhost:3001",
  "s3Bucket": "sme-tenant-${id}",
  "status": "success"
}
```

## Multi-Domain Routing Strategy

### NGINX Configuration
```
┌─ admin.domain.com → :3000 (Admin)
├─ storeA.com → :3001 (Tenant A)
├─ storeB.com → :3002 (Tenant B)
├─ storeC.com → :3003 (Tenant C)
└─ cdn.domain.com → :5001 (CDN server)
```

**How it works:**
1. NGINX reads `Host` header from request
2. Regex extracts tenant subdomain: `(?<tenant>[^.]+)\.domain\.com`
3. Sets `X-Tenant-ID` header
4. Routes to appropriate backend based on tenant

### Multi-Tenant Middleware
```typescript
// tenant-context.ts
export async function tenantContextMiddleware(req, res, next) {
  const host = req.hostname;  // "storeA.com"
  const tenant = await getTenantByDomain(host);
  
  if (!tenant) {
    return res.status(403).json({error: 'Tenant not found'});
  }
  
  req.tenantId = tenant.id;
  req.tenantPool = await getTenantPool(tenant.id);
  next();
}
```

## Tenant Isolation

### Database Isolation
- Each tenant has dedicated PostgreSQL schema: `tenant_${id}`
- Row-level security (RLS) policies enforce tenant boundaries
- Separate connection pools per tenant

### Storage Isolation
- S3 paths: `s3://bucket/tenants/{tenantId}/...`
- IAM policies restrict access by prefix
- CDN URLs include tenant context: `cdn.com/tenants/{id}/...`

### Frontend Isolation
- Build-time environment variables: `VITE_TENANT_ID={id}`
- Session/auth tokens scoped to tenant
- Redis session keys: `tenant:{id}:session:...`

## CDN Asset Management & Cross-Domain Fixes

### Previous Issue (Broken)
```
Admin domain: https://admin.domain.com
- Upload: /uploads/banner.jpg
- Store path: "./images/banner.jpg" (relative)
- On storefront: https://storeA.com (broken link!)
```

### Solution (Absolute CDN URLs)
```
Admin domain: https://admin.domain.com
- Upload: POST /api/assets/upload/banner
- S3 path: s3://sme-assets/tenants/{tenantId}/banners/123.jpg
- CDN URL: https://cdn.domain.com/tenants/{tenantId}/banners/123.jpg
- Store in DB: bannerUrl = "https://cdn.domain.com/..."
- On storefront: <img src={profile.bannerUrl} /> ✓ Works!
```

### Upload Handler
```typescript
// multi-tenant-routes.ts
router.post('/assets/upload/banner', async (req, res) => {
  const {url, key} = await assetManager.uploadFile({
    tenantId: req.tenantId,
    folder: 'banners',
    file: req.file
  });
  
  // Save ABSOLUTE URL to DB
  await pool.query(
    'UPDATE tenant_${id}.storefront_config SET banner_url = $1',
    [url]  // https://cdn.domain.com/...
  );
  
  res.json({url, key});
});
```

## Scaling Strategy

### Horizontal Scaling
```yaml
# Docker Compose: Add more tenant backends
services:
  tenant_backend_1:
    environment:
      TENANT_ID: store1
      PORT: 3001
  tenant_backend_2:
    environment:
      TENANT_ID: store2
      PORT: 3002
  # ... scale to N backends
```

### NGINX Load Balancing
```nginx
upstream storefront_backend {
  least_conn;
  server app:3001 weight=1;
  server app:3002 weight=1;
  server app:3003 weight=1;
  # Add more servers...
}
```

### Database Optimization
- Connection pooling: 20 connections max
- Read replicas for analytics
- Cache layer: Redis for sessions
- Indexes on `tenant_id` + query columns

### CDN Caching
```nginx
location /assets/ {
  proxy_cache_valid 200 30d;  # Cache for 30 days
  proxy_cache_use_stale error timeout;
}
```

## Development Workflow

### 1. Add New Tenant Feature
```typescript
// 1. Update DB schema (db.ts)
// 2. Add API endpoint (multi-tenant-routes.ts)
// 3. Add React component (components/)
// 4. Test: curl -H "X-Tenant-ID: {id}" http://localhost:3000/api/...
```

### 2. Deploy New Tenant
```bash
# Via admin dashboard or CLI
curl -X POST http://localhost:3000/api/admin/provision \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "store2.com",
    "name": "Store 2",
    "ownerEmail": "owner@store2.com"
  }'
```

### 3. Test Multi-Domain Access
```bash
# Local testing (add to /etc/hosts)
# 127.0.0.1 admin.localhost
# 127.0.0.1 store1.localhost
# 127.0.0.1 store2.localhost

curl http://admin.localhost:3000
curl http://store1.localhost:3000
curl http://store2.localhost:3000
```

## Production Deployment

### AWS Deployment
```bash
# 1. ECR: Push Docker image
docker tag sme-app:latest 123456.dkr.ecr.us-east-1.amazonaws.com/sme-app:latest
docker push 123456.dkr.ecr.us-east-1.amazonaws.com/sme-app:latest

# 2. RDS: Create PostgreSQL instance
# 3. ElastiCache: Create Redis cluster
# 4. ECS: Deploy app with ALB
# 5. CloudFront: Setup CDN distribution
# 6. Route53: Setup DNS + wildcard
```

### Kubernetes Deployment
```yaml
# sme-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sme-api
spec:
  replicas: 3
  template:
    containers:
    - name: app
      image: 123456.dkr.ecr.us-east-1.amazonaws.com/sme-app:latest
      ports:
      - containerPort: 3000
      env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: sme-secrets
            key: database_url
      - name: REDIS_URL
        valueFrom:
          secretKeyRef:
            name: sme-secrets
            key: redis_url
```

## Monitoring & Debugging

### View Logs
```bash
docker logs sme_app
docker logs sme_nginx
docker logs sme_postgres
```

### Debug Tenant Context
```bash
# Check X-Tenant-ID header
curl -v http://store1.localhost:3000/api/storefront/config

# Check DB schema
docker exec sme_postgres psql -U postgres -d sme_master -c "\dn"
docker exec sme_postgres psql -U postgres -d sme_master -c "SELECT * FROM tenants;"
```

### Monitor Performance
```bash
# NGINX metrics
docker exec sme_nginx nginx -T

# Database query performance
docker exec sme_postgres psql -U postgres -c "SELECT query, calls FROM pg_stat_statements ORDER BY calls DESC LIMIT 10;"
```

## Troubleshooting

### Issue: "Tenant not found"
```
Solution: Ensure domain is registered in provisioning API
         Check X-Tenant-ID header matches tenant ID in DB
```

### Issue: Asset upload 403
```
Solution: Verify S3 IAM credentials in .env
         Check S3 bucket policy allows tenant prefix writes
```

### Issue: NGINX 502 Bad Gateway
```
Solution: Check if backend services are running
         docker-compose ps
         docker logs sme_app
```

### Issue: Database connection timeout
```
Solution: Verify PostgreSQL is running
         Check DATABASE_URL in .env
         docker exec sme_postgres pg_isready
```

## Next Steps

1. ✅ **Phase 1**: Admin Dashboard + Provisioning Service (COMPLETE)
2. ✅ **Phase 2**: Isolation & Routing (COMPLETE)
3. ✅ **Phase 3**: Media Upload Fix (COMPLETE)
4. **Phase 4**: Scale & Optimize
   - [ ] Container orchestration (Kubernetes)
   - [ ] Load balancing across multiple backends
   - [ ] Cache invalidation strategy
   - [ ] Monitoring: ELK stack or DataDog
   - [ ] Analytics: Per-tenant dashboards

## License

Proprietary - Multi-Tenant SaaS Platform
