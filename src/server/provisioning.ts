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

      // 2. Allocate backend port (3001-3999).
      //
      // The previous implementation used `SELECT MAX(port)+1` outside of
      // any row lock, so two concurrent provisions could read the same
      // value and both try to insert it. We now:
      //   1. Take a transaction-scoped advisory lock so only one provision
      //      reads/writes the port range at a time.
      //   2. Pick the lowest free port in the range (defends against
      //      holes from deleted tenants) instead of "max + 1".
      //   3. Have a UNIQUE(backend_port) constraint (see db.ts) as a
      //      last-resort safety net — if the lock ever fails to be held
      //      (e.g. across two app instances against the same DB), the
      //      INSERT will throw 23505 and we retry.
      const ADVISORY_LOCK_PORT_ALLOCATION = 0x534D4550; // 'SMEP' in hex
      await client.query('SELECT pg_advisory_xact_lock($1)', [
        ADVISORY_LOCK_PORT_ALLOCATION
      ]);

      const PORT_MIN = 3001;
      const PORT_MAX = 3999;

      // Find the lowest port that is not currently used. `generate_series`
      // + `LEFT JOIN ... WHERE t.id IS NULL` gives us gaps we can reuse.
      const portResult = await client.query<{ candidate: number }>(
        `SELECT candidate
           FROM generate_series($1::int, $2::int) AS candidate
           LEFT JOIN tenants t ON t.backend_port = candidate
          WHERE t.id IS NULL
          ORDER BY candidate
          LIMIT 1`,
        [PORT_MIN, PORT_MAX]
      );

      if (portResult.rows.length === 0) {
        throw new Error('No available backend ports');
      }
      const nextPort = portResult.rows[0].candidate;

      // 3. Generate API key
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // 4. S3 bucket name (must be globally unique)
      const s3Bucket = `sme-tenant-${tenantId.slice(0, 8)}`;

      // 5. Insert tenant record. The UNIQUE(backend_port) constraint
      // is the second line of defence: if two app instances ever
      // somehow race past the advisory lock, the loser gets a 23505
      // unique_violation. We surface that as an explicit retry hint
      // rather than a generic 500.
      const insertResult = await client.query(
        `INSERT INTO tenants (id, domain, name, owner_email, owner_name, plan, backend_port, s3_bucket, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [tenantId, request.domain, request.name, request.ownerEmail, request.ownerName, request.plan, nextPort, s3Bucket, 'active']
      ).catch((err: any) => {
        if (err?.code === '23505' && err?.constraint === 'tenants_backend_port_unique') {
          const e = new Error('Backend port collision, please retry');
          (e as any).code = 'PORT_COLLISION';
          throw e;
        }
        throw err;
      });

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
      `SELECT id, domain, name, owner_email, owner_name, plan, status, backend_port,
              s3_bucket, max_products, created_at, updated_at,
              vercel_project_id, vercel_project_name, vercel_deployment_id,
              vercel_deployment_url, deployment_status, deployed_at, last_deploy_error
         FROM tenants
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
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
   * Update a tenant's Vercel deployment metadata. Called by the
   * deploy routes in `multi-tenant-routes.ts`.
   *
   * Pass `null` to clear a field.
   */
  async updateTenantDeployment(
    tenantId: string,
    fields: {
      vercelProjectId?: string | null;
      vercelProjectName?: string | null;
      vercelDeploymentId?: string | null;
      vercelDeploymentUrl?: string | null;
      deploymentStatus?: string;
      deployedAt?: Date | null;
      lastDeployError?: string | null;
    }
  ) {
    const client = await masterPool.connect();
    try {
      // Build a dynamic SET clause with parameterised values so we
      // never concatenate user input.
      const sets: string[] = [];
      const values: any[] = [];
      let i = 1;
      const add = (col: string, val: any) => {
        sets.push(`${col} = $${i++}`);
        values.push(val);
      };

      if ("vercelProjectId" in fields) add("vercel_project_id", fields.vercelProjectId);
      if ("vercelProjectName" in fields) add("vercel_project_name", fields.vercelProjectName);
      if ("vercelDeploymentId" in fields) add("vercel_deployment_id", fields.vercelDeploymentId);
      if ("vercelDeploymentUrl" in fields) add("vercel_deployment_url", fields.vercelDeploymentUrl);
      if ("deploymentStatus" in fields) add("deployment_status", fields.deploymentStatus);
      if ("deployedAt" in fields) add("deployed_at", fields.deployedAt);
      if ("lastDeployError" in fields) add("last_deploy_error", fields.lastDeployError);

      if (sets.length === 0) return { status: "noop" };

      // Always bump updated_at
      sets.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(tenantId);
      const sql = `UPDATE tenants SET ${sets.join(", ")} WHERE id = $${i}`;
      await client.query(sql, values);

      await client.query(
        `INSERT INTO audit_logs (tenant_id, action, details)
         VALUES ($1, $2, $3)`,
        [
          tenantId,
          "TENANT_DEPLOYMENT_UPDATED",
          JSON.stringify({
            status: fields.deploymentStatus,
            url: fields.vercelDeploymentUrl,
            project: fields.vercelProjectName,
          }),
        ]
      );

      return { status: "success" };
    } finally {
      client.release();
    }
  }

  /**
   * Get tenant by ID, ignoring status (so deploy routes can find
   * `suspended` and `deleted` tenants too).
   */
  async getTenantByIdAnyStatus(tenantId: string) {
    const result = await masterPool.query(
      "SELECT * FROM tenants WHERE id = $1",
      [tenantId]
    );
    return result.rows[0] || null;
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
