import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getTenantPool, masterPool } from './db';
import provisioning from './provisioning';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: any;
      tenantPool?: any;
    }
  }
}

/**
 * Extract tenant from request (via Host header or X-Tenant-ID)
 */
export async function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let tenantId: string | undefined;
    const host = req.hostname || req.get('host');

    // Skip tenant context for admin routes
    if (host?.startsWith('admin.') || host?.startsWith('localhost')) {
      return next();
    }

    // 1. Try to get tenant by domain (from Host header)
    if (host) {
      const tenant = await provisioning.getTenantByDomain(host);
      if (tenant) {
        tenantId = tenant.id;
        req.tenant = tenant;
      }
    }

    // 2. Fallback to X-Tenant-ID header (from reverse proxy)
    if (!tenantId) {
      tenantId = req.get('X-Tenant-ID');
    }

    // 3. If still no tenant, check API key
    if (!tenantId) {
      const apiKey = extractApiKey(req);
      if (apiKey) {
        tenantId = await verifyApiKey(apiKey);
      }
    }

    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not identified' });
    }

    req.tenantId = tenantId;
    req.tenantPool = await getTenantPool(tenantId);

    next();
  } catch (error: any) {
    console.error('Tenant context error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Extract API key from Authorization header
 */
function extractApiKey(req: Request): string | null {
  const authHeader = req.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Verify API key and return tenant ID
 */
async function verifyApiKey(apiKey: string): Promise<string | null> {
  try {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const result = await masterPool.query(
      'SELECT tenant_id FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL',
      [keyHash]
    );

    if (result.rows.length > 0) {
      return result.rows[0].tenant_id;
    }
    return null;
  } catch (error) {
    console.error('API key verification error:', error);
    return null;
  }
}

/**
 * Require valid tenant context (fail if not present)
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenantId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }
  next();
}

/**
 * Execute query scoped to tenant
 */
export async function executeInTenantContext(
  tenantId: string,
  query: string,
  params?: any[]
) {
  const pool = await getTenantPool(tenantId);
  return pool.query(query, params);
}

/**
 * Get tenant schema name
 */
export function getTenantSchema(tenantId: string): string {
  return `tenant_${tenantId.replace(/-/g, '_')}`;
}

/**
 * Build qualified table name
 */
export function getTableName(tenantId: string, table: string): string {
  const schema = getTenantSchema(tenantId);
  return `${schema}.${table}`;
}
