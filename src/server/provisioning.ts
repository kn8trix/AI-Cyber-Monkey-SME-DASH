import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { masterPool, getTenantPool, initializeTenantSchema } from './db';

export interface ProvisioningRequest {
  domain: string;
  name: string;
  ownerEmail: string;
  ownerName: string;
  plan: 'free' | 'monthly' | 'yearly';
  primaryColor?: string;
  themeStyle?: string;
}

export interface ProvisioningResult {
  tenantId: string;
  domain: string;
  apiKey: string;
  backendUrl: string;
  s3Bucket: string;
  status: 'success' | 'error';
  message?: string;
}

class ProvisioningService {
  /**
   * Provision a new storefront tenant
   */
  async provisionTenant(request: ProvisioningRequest): Promise<ProvisioningResult> {
    const tenantId = uuidv4();
    const client = await masterPool.connect();

    try {
      await client.query('BEGIN');

      // 1. Validate domain uniqueness
      const existingTenant = await client.query(
        'SELECT id FROM tenants WHERE domain = $1',
        [request.domain]
      );

      if (existingTenant.rows.length > 0) {
        return {
          tenantId: '',
          domain: request.domain,
          apiKey: '',
          backendUrl: '',
          s3Bucket: '',
          status: 'error',
          message: 'Domain already registered'
        };
      }

      // 2. Allocate backend port (3001-3999)
      const portResult = await client.query(
        'SELECT backend_port FROM tenants WHERE backend_port IS NOT NULL ORDER BY backend_port DESC LIMIT 1'
      );
      const nextPort = (portResult.rows[0]?.backend_port || 3000) + 1;

      if (nextPort > 3999) {
        throw new Error('No available backend ports');
      }

      // 3. Generate API key
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // 4. S3 bucket name (must be globally unique)
      const s3Bucket = `sme-tenant-${tenantId.slice(0, 8)}`;

      // 5. Insert tenant record
      const insertResult = await client.query(
        `INSERT INTO tenants (id, domain, name, owner_email, owner_name, plan, backend_port, s3_bucket, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [tenantId, request.domain, request.name, request.ownerEmail, request.ownerName, request.plan, nextPort, s3Bucket, 'active']
      );

      // 6. Store API key
      await client.query(
        'INSERT INTO api_keys (tenant_id, key_hash) VALUES ($1, $2)',
        [tenantId, apiKeyHash]
      );

      // 7. Log provisioning action
      await client.query(
        `INSERT INTO audit_logs (tenant_id, action, details)
         VALUES ($1, $2, $3)`,
        [tenantId, 'TENANT_PROVISIONED', JSON.stringify(request)]
      );

      await client.query('COMMIT');

      // 8. Initialize tenant schema (async, non-blocking)
      setImmediate(() => this.initializeTenantAsync(tenantId));

      return {
        tenantId,
        domain: request.domain,
        apiKey,
        backendUrl: `http://localhost:${nextPort}`,
        s3Bucket,
        status: 'success'
      };
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Provisioning error:', error);
      return {
        tenantId: '',
        domain: request.domain,
        apiKey: '',
        backendUrl: '',
        s3Bucket: '',
        status: 'error',
        message: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Initialize tenant schema asynchronously
   */
  private async initializeTenantAsync(tenantId: string) {
    try {
      await initializeTenantSchema(tenantId);
      
      // Initialize default storefront config
      const pool = await getTenantPool(tenantId);
      const schema = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      await pool.query(
        `INSERT INTO ${schema}.storefront_config (name, tagline, primary_color, theme_style, banner_text)
         VALUES ($1, $2, $3, $4, $5)`,
        ['New Storefront', 'Your online store', 'orange', 'tech', 'Welcome to our store']
      );

      console.log(`✓ Tenant ${tenantId} schema initialized`);
    } catch (error) {
      console.error(`Failed to initialize tenant ${tenantId}:`, error);
    }
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string) {
    const result = await masterPool.query(
      'SELECT * FROM tenants WHERE domain = $1 AND status = $2',
      [domain, 'active']
    );
    return result.rows[0] || null;
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string) {
    const result = await masterPool.query(
      'SELECT * FROM tenants WHERE id = $1 AND status = $2',
      [tenantId, 'active']
    );
    return result.rows[0] || null;
  }

  /**
   * List all tenants for admin
   */
  async listTenants(limit: number = 100, offset: number = 0) {
    const result = await masterPool.query(
      'SELECT id, domain, name, owner_email, plan, status, created_at FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason: string) {
    const client = await masterPool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        'UPDATE tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['suspended', tenantId]
      );

      await client.query(
        'INSERT INTO audit_logs (tenant_id, action, details) VALUES ($1, $2, $3)',
        [tenantId, 'TENANT_SUSPENDED', JSON.stringify({ reason })]
      );

      await client.query('COMMIT');
      return { status: 'success' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string) {
    const client = await masterPool.connect();
    try {
      await client.query('BEGIN');

      const schema = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Drop tenant schema
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`);

      // Mark tenant as deleted
      await client.query(
        'UPDATE tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['deleted', tenantId]
      );

      await client.query(
        'INSERT INTO audit_logs (tenant_id, action, details) VALUES ($1, $2, $3)',
        [tenantId, 'TENANT_DELETED', JSON.stringify({})]
      );

      await client.query('COMMIT');
      return { status: 'success' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new ProvisioningService();
