import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import provisioning, { ProvisioningRequest } from './provisioning';
import { tenantContextMiddleware, requireTenant, getTableName, getTenantSchema } from './tenant-context';
import assetManager from './asset-manager';
import { getTenantPool } from './db';
import vercelDeploy, { VercelDeployService } from './vercel-deploy';

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

      // Verify tenant owns this asset. Keys are minted as
      // `tenants/${tenantId}/...` (see asset-manager.generateS3Key) so
      // we require a real prefix match — the previous `includes`
      // check was bypassable by crafting a key that simply contains
      // the tenantId substring.
      const expectedPrefix = `tenants/${req.tenantId}/`;
      if (!key.startsWith(expectedPrefix)) {
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

// =============================================================================
// Per-tenant Vercel deployment routes
//
// POST   /api/admin/deploy/:tenantId   — create project (if needed) + trigger
// GET    /api/admin/deploy/:tenantId   — poll deployment status
// DELETE /api/admin/deploy/:tenantId   — tear down the Vercel project
//
// Architecture: 1A + 2A + 3A + 4A. Each tenant gets its own Vercel project
// backed by the same Vite SPA repo. The dashboard's `VITE_API_BASE` env
// var is pinned onto every project so the deployed storefront knows where
// to fetch its data.
// =============================================================================

function deploymentSummary(tenant: any) {
  return {
    tenantId: tenant.id,
    deploymentStatus: tenant.deployment_status || "not_deployed",
    vercelProjectId: tenant.vercel_project_id || null,
    vercelProjectName: tenant.vercel_project_name || null,
    vercelDeploymentId: tenant.vercel_deployment_id || null,
    vercelDeploymentUrl: tenant.vercel_deployment_url || null,
    deployedAt: tenant.deployed_at || null,
    lastDeployError: tenant.last_deploy_error || null,
  };
}

// Helper to compute the dashboard's own public URL so the deployed
// storefront knows where its API lives. We honor VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL
// (auto-set by Vercel) and fall back to a local default.
function dashboardPublicBaseUrl(req: Request): string {
  const explicit = process.env.DASHBOARD_PUBLIC_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelHost =
    req.get("x-forwarded-host") ||
    req.get("host") ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "localhost:3000";
  const proto =
    req.get("x-forwarded-proto") || (vercelHost.startsWith("localhost") ? "http" : "https");
  return `${proto}://${vercelHost}`;
}

/**
 * POST /api/admin/deploy/:tenantId
 * Body: {} — every parameter is derived from the tenant record.
 *
 * Behaviour:
 *   - If the tenant has no Vercel project yet, create one (Vite SPA
 *     template, same GitHub repo, slug-based name) and persist the
 *     project ID + name. The first call to Vercel will return 403 if
 *     the GitHub repo isn't connected to the user's Vercel account —
 *     we surface that error verbatim.
 *   - If a project exists, trigger a fresh production deploy.
 *   - Returns 202 Accepted with `deploymentStatus: 'building'` so the
 *     UI can poll the GET endpoint for completion.
 */
router.post("/admin/deploy/:tenantId", async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!vercelDeploy.isConfigured()) {
      return res.status(503).json({
        error: "Vercel not configured",
        message:
          "Set VERCEL_API_TOKEN (and optionally VERCEL_TEAM_ID) on the dashboard's Vercel project, then redeploy.",
      });
    }

    const tenant = await provisioning.getTenantByIdAnyStatus(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    if (tenant.status === "deleted") {
      return res.status(410).json({ error: "Tenant has been deleted" });
    }

    const repo = vercelDeploy.getDefaultRepo();
    const slug = tenant.domain.split(".")[0] || tenant.name || "store";

    // ---------- Step 1: ensure a Vercel project exists ----------
    let projectId: string = tenant.vercel_project_id;
    let projectName: string = tenant.vercel_project_name;

    if (!projectId) {
      const project = await vercelDeploy.createProject({
        name: VercelDeployService.projectName(slug, tenant.id),
        slug,
        repo,
        branch: "main",
      });
      projectId = project.id;
      projectName = project.name;

      // Pin tenant identity into the project's production env so the
      // deployed SPA knows who it is at runtime.
      const apiBase = dashboardPublicBaseUrl(req);
      await vercelDeploy.setProductionEnv(projectId, [
        {
          key: "VITE_TENANT_ID",
          value: tenant.id,
          target: ["production", "preview"],
          type: "plain",
        },
        {
          key: "VITE_API_BASE",
          value: apiBase,
          target: ["production", "preview"],
          type: "plain",
        },
        {
          key: "VITE_STORE_DOMAIN",
          value: tenant.domain,
          target: ["production", "preview"],
          type: "plain",
        },
      ]);

      await provisioning.updateTenantDeployment(tenant.id, {
        vercelProjectId: projectId,
        vercelProjectName: projectName,
        deploymentStatus: "provisioned",
        lastDeployError: null,
      });
    }

    // ---------- Step 2: trigger a production deploy ----------
    const deployment = await vercelDeploy.deployProject({
      projectId,
      repo,
      branch: "main",
    });

    await provisioning.updateTenantDeployment(tenant.id, {
      vercelDeploymentId: deployment.id,
      vercelDeploymentUrl: deployment.url,
      deploymentStatus:
        deployment.readyState === "READY" ? "ready" :
        deployment.readyState === "ERROR" ? "failed" : "building",
      deployedAt: new Date(),
      lastDeployError: null,
    });

    res.status(202).json({
      status: "accepted",
      ...deploymentSummary({
        ...tenant,
        vercel_project_id: projectId,
        vercel_project_name: projectName,
        vercel_deployment_id: deployment.id,
        vercel_deployment_url: deployment.url,
        deployment_status:
          deployment.readyState === "READY" ? "ready" :
          deployment.readyState === "ERROR" ? "failed" : "building",
        deployed_at: new Date(),
      }),
    });
  } catch (error: any) {
    console.error("Deploy tenant error:", error);

    // Best-effort: persist the error on the tenant so the UI can
    // surface it without a second round-trip.
    try {
      const { tenantId } = req.params;
      await provisioning.updateTenantDeployment(tenantId, {
        deploymentStatus: "failed",
        lastDeployError: String(error?.message || error).slice(0, 1000),
      });
    } catch {
      // ignore — primary error matters more
    }

    res.status(500).json({
      error: "Deploy failed",
      message: String(error?.message || error),
    });
  }
});

/**
 * GET /api/admin/deploy/:tenantId
 * Returns the tenant's current deployment metadata, and (when an
 * in-flight deployment exists) refreshes its `readyState` from Vercel.
 */
router.get("/admin/deploy/:tenantId", async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const tenant = await provisioning.getTenantByIdAnyStatus(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // If we have a deployment in flight, refresh its status.
    if (
      tenant.vercel_deployment_id &&
      tenant.deployment_status &&
      ["provisioned", "building"].includes(tenant.deployment_status)
    ) {
      try {
        const live = await vercelDeploy.getDeployment(tenant.vercel_deployment_id);
        const nextStatus =
          live.readyState === "READY" ? "ready" :
          live.readyState === "ERROR" ? "failed" :
          live.readyState === "CANCELED" ? "failed" : "building";

        // Resolve the canonical public URL (alias when ready, else the
        // build URL).
        const publicUrl =
          live.readyState === "READY" && live.url
            ? live.url
            : tenant.vercel_deployment_url || live.url || null;

        if (
          nextStatus !== tenant.deployment_status ||
          publicUrl !== tenant.vercel_deployment_url
        ) {
          await provisioning.updateTenantDeployment(tenant.id, {
            deploymentStatus: nextStatus,
            vercelDeploymentUrl: publicUrl,
            deployedAt: nextStatus === "ready" ? new Date(tenant.deployed_at || Date.now()) : undefined,
            lastDeployError:
              nextStatus === "failed" ? live.errorMessage || "Build failed" : null,
          });
        }
      } catch (pollErr: any) {
        // Swallow polling errors — return cached data and let the UI
        // decide whether to retry.
        console.warn("Deployment status poll failed:", pollErr?.message || pollErr);
      }
    }

    const refreshed = (await provisioning.getTenantByIdAnyStatus(tenantId)) || tenant;
    res.json(deploymentSummary(refreshed));
  } catch (error: any) {
    console.error("Get deploy status error:", error);
    res.status(500).json({ error: error.message || "Internal error" });
  }
});

/**
 * DELETE /api/admin/deploy/:tenantId
 * Tears down the Vercel project and clears all deployment metadata.
 */
router.delete("/admin/deploy/:tenantId", async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const tenant = await provisioning.getTenantByIdAnyStatus(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    if (tenant.vercel_project_id) {
      try {
        await vercelDeploy.deleteProject(tenant.vercel_project_id);
      } catch (delErr: any) {
        // Don't block the local cleanup on a Vercel-side failure —
        // surface the error in the audit log instead.
        console.warn("Vercel deleteProject failed:", delErr?.message || delErr);
      }
    }

    await provisioning.updateTenantDeployment(tenant.id, {
      vercelProjectId: null,
      vercelProjectName: null,
      vercelDeploymentId: null,
      vercelDeploymentUrl: null,
      deploymentStatus: "not_deployed",
      deployedAt: null,
      lastDeployError: null,
    });

    res.json({ status: "torn_down" });
  } catch (error: any) {
    console.error("Teardown deploy error:", error);
    res.status(500).json({ error: error.message || "Internal error" });
  }
});

export default router;
