import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import provisioning, { ProvisioningRequest } from './provisioning';
import { tenantContextMiddleware, requireTenant, getTableName, getTenantSchema } from './tenant-context';
import assetManager from './asset-manager';
import { getTenantPool } from './db';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ==========================================
// ADMIN API: PROVISIONING & TENANT MANAGEMENT
// ==========================================

/**
 * Provision a new storefront tenant
 * POST /api/admin/provision
 */
router.post('/admin/provision', async (req: Request, res: Response) => {
  try {
    const { domain, name, ownerEmail, ownerName, plan } = req.body;

    if (!domain || !name || !ownerEmail) {
      return res.status(400).json({
        error: 'Missing required fields: domain, name, ownerEmail'
      });
    }

    // Validate domain format
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        error: 'Invalid domain format'
      });
    }

    const request: ProvisioningRequest = {
      domain,
      name,
      ownerEmail,
      ownerName: ownerName || 'Store Owner',
      plan: (plan as 'free' | 'monthly' | 'yearly') || 'free'
    };

    const result = await provisioning.provisionTenant(request);

    if (result.status === 'error') {
      return res.status(400).json({
        error: result.message || 'Provisioning failed'
      });
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Provisioning error:', error);
    res.status(500).json({ error: 'Provisioning failed' });
  }
});

/**
 * List all tenants
 * GET /api/admin/tenants
 */
router.get('/admin/tenants', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const tenants = await provisioning.listTenants(limit, offset);
    res.json({ data: tenants, limit, offset });
  } catch (error: any) {
    console.error('List tenants error:', error);
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

/**
 * Get tenant by ID
 * GET /api/admin/tenants/:tenantId
 */
router.get('/admin/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const tenant = await provisioning.getTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error: any) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to get tenant' });
  }
});

/**
 * Suspend tenant
 * POST /api/admin/tenants/:tenantId/suspend
 */
router.post('/admin/tenants/:tenantId/suspend', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    await provisioning.suspendTenant(tenantId, reason || 'Administrative suspension');
    res.json({ status: 'success', message: 'Tenant suspended' });
  } catch (error: any) {
    console.error('Suspend tenant error:', error);
    res.status(500).json({ error: 'Failed to suspend tenant' });
  }
});

/**
 * Delete tenant
 * POST /api/admin/tenants/:tenantId/delete
 */
router.post('/admin/tenants/:tenantId/delete', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    await provisioning.deleteTenant(tenantId);
    res.json({ status: 'success', message: 'Tenant deleted' });
  } catch (error: any) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// ==========================================
// TENANT API: ASSET MANAGEMENT (CDN)
// ==========================================

/**
 * Upload banner image (single tenant context)
 * POST /api/assets/upload/banner
 */
router.post('/assets/upload/banner', 
  tenantContextMiddleware,
  requireTenant,
  upload.single('banner'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { url, key } = await assetManager.uploadFile({
        tenantId: req.tenantId!,
        folder: 'banners',
        file: req.file,
        public: true
      });

      // Store in database
      const pool = await getTenantPool(req.tenantId!);
      const schema = getTenantSchema(req.tenantId!);

      await pool.query(
        `UPDATE ${schema}.storefront_config SET banner_url = $1, updated_at = CURRENT_TIMESTAMP`,
        [url]
      );

      res.json({ url, key, status: 'success' });
    } catch (error: any) {
      console.error('Banner upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
);

/**
 * Upload hero image
 * POST /api/assets/upload/hero
 */
router.post('/assets/upload/hero', 
  tenantContextMiddleware,
  requireTenant,
  upload.single('hero'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { url, key } = await assetManager.uploadFile({
        tenantId: req.tenantId!,
        folder: 'images',
        file: req.file,
        public: true
      });

      // Store in database
      const pool = await getTenantPool(req.tenantId!);
      const schema = getTenantSchema(req.tenantId!);

      await pool.query(
        `UPDATE ${schema}.storefront_config SET hero_image_url = $1, updated_at = CURRENT_TIMESTAMP`,
        [url]
      );

      res.json({ url, key, status: 'success' });
    } catch (error: any) {
      console.error('Hero upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
);

/**
 * Upload product image
 * POST /api/assets/upload/product
 */
router.post('/assets/upload/product', 
  tenantContextMiddleware,
  requireTenant,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { url, key } = await assetManager.uploadFile({
        tenantId: req.tenantId!,
        folder: 'images',
        file: req.file,
        public: true
      });

      res.json({ url, key, status: 'success' });
    } catch (error: any) {
      console.error('Product image upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
);

/**
 * Upload custom icon
 * POST /api/assets/upload/icon
 */
router.post('/assets/upload/icon', 
  tenantContextMiddleware,
  requireTenant,
  upload.single('icon'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { url, key } = await assetManager.uploadFile({
        tenantId: req.tenantId!,
        folder: 'icons',
        file: req.file,
        public: true
      });

      // Store in database
      const pool = await getTenantPool(req.tenantId!);
      const schema = getTenantSchema(req.tenantId!);

      await pool.query(
        `UPDATE ${schema}.storefront_config SET custom_icon = $1, updated_at = CURRENT_TIMESTAMP`,
        [url]
      );

      res.json({ url, key, status: 'success' });
    } catch (error: any) {
      console.error('Icon upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
);

/**
 * Delete asset
 * DELETE /api/assets/:key
 */
router.delete('/assets/:key', 
  tenantContextMiddleware,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;

      // Verify tenant owns this asset
      if (!key.includes(req.tenantId!)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await assetManager.deleteFile(key);
      res.json({ status: 'success', message: 'Asset deleted' });
    } catch (error: any) {
      console.error('Asset delete error:', error);
      res.status(500).json({ error: error.message || 'Delete failed' });
    }
  }
);

/**
 * List assets for tenant
 * GET /api/assets?folder=banners
 */
router.get('/assets', 
  tenantContextMiddleware,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const { folder } = req.query;

      const files = await assetManager.listFiles(
        req.tenantId!,
        (folder as string) || undefined
      );

      res.json({ data: files });
    } catch (error: any) {
      console.error('List assets error:', error);
      res.status(500).json({ error: error.message || 'List failed' });
    }
  }
);

// ==========================================
// TENANT API: STOREFRONT CONFIGURATION
// ==========================================

/**
 * Get storefront configuration
 * GET /api/storefront/config
 */
router.get('/storefront/config',
  tenantContextMiddleware,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const pool = await getTenantPool(req.tenantId!);
      const schema = getTenantSchema(req.tenantId!);

      const result = await pool.query(
        `SELECT * FROM ${schema}.storefront_config LIMIT 1`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Storefront config not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Get storefront config error:', error);
      res.status(500).json({ error: 'Failed to get config' });
    }
  }
);

/**
 * Update storefront configuration
 * PUT /api/storefront/config
 */
router.put('/storefront/config',
  tenantContextMiddleware,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        tagline,
        primary_color,
        theme_style,
        banner_text,
        custom_font,
        category_default
      } = req.body;

      const pool = await getTenantPool(req.tenantId!);
      const schema = getTenantSchema(req.tenantId!);

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (tagline !== undefined) {
        updates.push(`tagline = $${paramIndex++}`);
        values.push(tagline);
      }
      if (primary_color !== undefined) {
        updates.push(`primary_color = $${paramIndex++}`);
        values.push(primary_color);
      }
      if (theme_style !== undefined) {
        updates.push(`theme_style = $${paramIndex++}`);
        values.push(theme_style);
      }
      if (banner_text !== undefined) {
        updates.push(`banner_text = $${paramIndex++}`);
        values.push(banner_text);
      }
      if (custom_font !== undefined) {
        updates.push(`custom_font = $${paramIndex++}`);
        values.push(custom_font);
      }
      if (category_default !== undefined) {
        updates.push(`category_default = $${paramIndex++}`);
        values.push(category_default);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(req.tenantId!);

      const result = await pool.query(
        `UPDATE ${schema}.storefront_config SET ${updates.join(', ')} WHERE id = (SELECT id FROM ${schema}.storefront_config LIMIT 1) RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update storefront config error:', error);
      res.status(500).json({ error: 'Failed to update config' });
    }
  }
);

export default router;
