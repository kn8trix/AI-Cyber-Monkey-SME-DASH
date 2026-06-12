import pg from 'pg';
import { Pool } from 'pg';

const { Pool: PgPool } = pg;

// Master database connection pool
export const masterPool = new PgPool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sme_master',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Tenant-specific connection pools (cached)
const tenantPools: Map<string, Pool> = new Map();

export async function getTenantPool(tenantId: string): Promise<Pool> {
  if (tenantPools.has(tenantId)) {
    return tenantPools.get(tenantId)!;
  }

  const pool = new PgPool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sme_master',
    max: 10,
    idleTimeoutMillis: 30000,
  });

  tenantPools.set(tenantId, pool);
  return pool;
}

// Initialize master schema on startup
export async function initializeMasterSchema() {
  const client = await masterPool.connect();
  try {
    // Master tenants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain VARCHAR UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        owner_email VARCHAR NOT NULL,
        owner_name VARCHAR,
        plan VARCHAR DEFAULT 'free',
        status VARCHAR DEFAULT 'active',
        backend_port INT,
        s3_bucket VARCHAR,
        CONSTRAINT tenants_backend_port_unique UNIQUE (backend_port),
        ssl_cert_path VARCHAR,
        max_products INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // API Keys for tenants
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        key_hash VARCHAR UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP
      );
    `);

    // Audit log
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        action VARCHAR NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Customer sessions (master-scoped — sessions span tenants if the
    // same email is used on multiple stores, but each session is pinned
    // to one tenant_id). Used by the customer-facing storefront API.
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        session_id VARCHAR(128) PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL,
        email VARCHAR NOT NULL,
        name VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS customer_sessions_tenant_email_idx
         ON customer_sessions(tenant_id, email);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS customer_sessions_expires_idx
         ON customer_sessions(expires_at);`
    );

    // -------- Forward-only migrations (idempotent) --------
    // Add Vercel deployment columns for the per-tenant store-deploy
    // feature. Each ALTER is a no-op on fresh installs because the
    // columns don't exist in the CREATE TABLE above — Postgres 9.6+
    // supports `ADD COLUMN IF NOT EXISTS`.
    await client.query(`
      ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS vercel_project_id VARCHAR,
        ADD COLUMN IF NOT EXISTS vercel_project_name VARCHAR,
        ADD COLUMN IF NOT EXISTS vercel_deployment_id VARCHAR,
        ADD COLUMN IF NOT EXISTS vercel_deployment_url VARCHAR,
        ADD COLUMN IF NOT EXISTS deployment_status VARCHAR DEFAULT 'not_deployed',
        ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS last_deploy_error TEXT;
    `);

    console.log('✓ Master schema initialized');
  } finally {
    client.release();
  }
}

// Initialize per-tenant schema
export async function initializeTenantSchema(tenantId: string) {
  const client = await masterPool.connect();
  try {
    const schema = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Create schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        category VARCHAR,
        description TEXT,
        image_url VARCHAR,
        msrp NUMERIC(10, 2),
        discount_percentage NUMERIC(5, 2),
        buying_price NUMERIC(10, 2),
        stock_count INT DEFAULT 0,
        sales_count INT DEFAULT 0,
        views_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID,
        customer_email VARCHAR,
        total NUMERIC(10, 2),
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Order items
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES ${schema}.orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        quantity INT NOT NULL,
        price NUMERIC(10, 2) NOT NULL
      );
    `);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR,
        phone VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Storefront configuration
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.storefront_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        tagline VARCHAR,
        primary_color VARCHAR DEFAULT 'orange',
        theme_style VARCHAR DEFAULT 'tech',
        banner_text VARCHAR,
        banner_url VARCHAR,
        hero_image_url VARCHAR,
        custom_icon VARCHAR,
        custom_font VARCHAR DEFAULT 'sans',
        category_default VARCHAR DEFAULT 'all',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(`✓ Tenant schema ${schema} initialized`);
  } finally {
    client.release();
  }
}
