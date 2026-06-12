/**
 * Customer-facing storefront API.
 *
 * This is the single backend template used by ALL tenants — the 3 default
 * storefronts seeded in `src/data.ts` and every new storefront deployed via
 * the AI Storefront Deployer. Per-tenant data isolation is enforced by
 * `tenantContextMiddleware`, which derives the tenant from the request's
 * `X-Tenant-Id` header (or `Host` header in production) and scopes every
 * query to the `tenant_<id>` schema.
 *
 * Public surface (no auth — these are the storefront pages a customer
 * hits in their browser):
 *   GET    /api/storefront/config                  — get this tenant's branding
 *   GET    /api/storefront/products                — list products
 *   GET    /api/storefront/products/:productId     — single product
 *   POST   /api/storefront/products/:productId/view — bump a product's view count
 *   POST   /api/storefront/customers/login         — customer auth (email only)
 *   POST   /api/storefront/orders                  — checkout (creates order)
 *   GET    /api/storefront/orders                  — customer's order history
 *   GET    /api/storefront/orders/:orderId         — single order
 *
 * Authenticated surface (customer session required — sent as
 * `X-Customer-Token: <sessionId>` after login):
 *   GET    /api/storefront/me                      — current customer
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { tenantContextMiddleware, requireTenant, getTenantSchema, getTableName } from "./tenant-context";
import { getTenantPool, masterPool } from "./db";
import crypto from "crypto";

const router = Router();

// All routes below require a resolved tenant. The middleware sets
// `req.tenantId` from the X-Tenant-Id header (or Host header in prod).
router.use(tenantContextMiddleware, requireTenant);

// ==========================================
// CUSTOMER SESSIONS (in-memory, single process)
// ==========================================
// Sessions live in the master DB so they're visible to any worker. They
// expire after 30 days. Good enough for a demo — swap for Redis/JWT in
// production.
interface CustomerSession {
  sessionId: string;
  tenantId: string;
  customerId: string;
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createCustomerSession(
  tenantId: string,
  customerId: string,
  email: string,
  name: string
): Promise<{ token: string; session: Omit<CustomerSession, "sessionId"> }> {
  const raw = crypto.randomBytes(24).toString("hex");
  const token = `csess_${raw}`;
  const sessionId = hashSessionToken(token);
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await masterPool.query(
    `INSERT INTO customer_sessions (session_id, tenant_id, customer_id, email, name, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [sessionId, tenantId, customerId, email, name, now.toISOString(), expires.toISOString()]
  );
  return {
    token,
    session: {
      tenantId,
      customerId,
      email,
      name,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
  };
}

async function resolveCustomerSession(
  req: Request
): Promise<Omit<CustomerSession, "sessionId"> | null> {
  const raw = req.get("X-Customer-Token");
  if (!raw) return null;
  const sessionId = hashSessionToken(raw);
  const result = await masterPool.query(
    `SELECT tenant_id, customer_id, email, name, created_at, expires_at
       FROM customer_sessions
      WHERE session_id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

// ==========================================
// STOREFRONT CONFIG
// ==========================================
router.get("/storefront/config", async (req: Request, res: Response) => {
  try {
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);
    const result = await pool.query(
      `SELECT name, tagline, primary_color, theme_style, banner_text,
              banner_url, hero_image_url, custom_icon, custom_font, category_default
         FROM ${schema}.storefront_config
         ORDER BY id ASC
         LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Storefront config not found" });
    }
    return res.json(result.rows[0]);
  } catch (err: any) {
    console.error("[storefront-api] config error:", err);
    return res.status(500).json({ error: err?.message || "Failed to load config" });
  }
});

// ==========================================
// PRODUCTS
// ==========================================
router.get("/storefront/products", async (req: Request, res: Response) => {
  try {
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);
    const { category, q, limit } = req.query;
    const where: string[] = [];
    const params: any[] = [];
    if (category && typeof category === "string") {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (q && typeof q === "string" && q.trim()) {
      params.push(`%${q.trim()}%`);
      where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    const sql = `
      SELECT id, name, price, category, description, image_url,
             msrp, discount_percentage, buying_price, stock_count,
             sales_count, views_count, created_at, updated_at
        FROM ${schema}.products
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}
    `;
    params.push(Math.min(200, parseInt(String(limit ?? "100"), 10) || 100));
    const result = await pool.query(sql, params);
    return res.json({ data: result.rows, count: result.rows.length });
  } catch (err: any) {
    console.error("[storefront-api] products list error:", err);
    return res.status(500).json({ error: err?.message || "Failed to list products" });
  }
});

router.get("/storefront/products/:productId", async (req: Request, res: Response) => {
  try {
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);
    const result = await pool.query(
      `SELECT id, name, price, category, description, image_url,
              msrp, discount_percentage, buying_price, stock_count,
              sales_count, views_count, created_at, updated_at
         FROM ${schema}.products WHERE id = $1`,
      [req.params.productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(result.rows[0]);
  } catch (err: any) {
    console.error("[storefront-api] product get error:", err);
    return res.status(500).json({ error: err?.message || "Failed to get product" });
  }
});

router.post("/storefront/products/:productId/view", async (req: Request, res: Response) => {
  try {
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);
    await pool.query(
      `UPDATE ${schema}.products SET views_count = views_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [req.params.productId]
    );
    return res.json({ status: "ok" });
  } catch (err: any) {
    console.error("[storefront-api] product view error:", err);
    return res.status(500).json({ error: err?.message || "Failed to record view" });
  }
});

// ==========================================
// CUSTOMER AUTH (passwordless email)
// ==========================================
// No passwords — we accept an email and create / fetch the customer.
// This matches the storefront's "continue as guest" flow and avoids
// shipping an auth surface bigger than the demo needs.
router.post("/storefront/customers/login", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);

    // Upsert by email within this tenant's schema.
    const existing = await pool.query(
      `SELECT id, email, name FROM ${schema}.customers WHERE email = $1`,
      [email.toLowerCase()]
    );
    let customerId: string;
    let customerName = (name && String(name)) || "";
    if (existing.rows.length > 0) {
      customerId = existing.rows[0].id;
      if (customerName && customerName !== existing.rows[0].name) {
        await pool.query(
          `UPDATE ${schema}.customers SET name = $1 WHERE id = $2`,
          [customerName, customerId]
        );
      } else {
        customerName = existing.rows[0].name || customerName;
      }
    } else {
      customerId = uuidv4();
      await pool.query(
        `INSERT INTO ${schema}.customers (id, email, name) VALUES ($1, $2, $3)`,
        [customerId, email.toLowerCase(), customerName || email.split("@")[0]]
      );
    }

    const { token, session } = await createCustomerSession(
      req.tenantId!,
      customerId,
      email.toLowerCase(),
      customerName || email.split("@")[0]
    );
    return res.json({ token, customer: session });
  } catch (err: any) {
    console.error("[storefront-api] customer login error:", err);
    return res.status(500).json({ error: err?.message || "Login failed" });
  }
});

router.get("/storefront/me", async (req: Request, res: Response) => {
  const session = await resolveCustomerSession(req);
  if (!session || session.tenantId !== req.tenantId) {
    return res.status(401).json({ error: "Not signed in" });
  }
  return res.json(session);
});

router.post("/storefront/customers/logout", async (req: Request, res: Response) => {
  const raw = req.get("X-Customer-Token");
  if (!raw) return res.json({ status: "ok" });
  const sessionId = hashSessionToken(raw);
  await masterPool.query(`DELETE FROM customer_sessions WHERE session_id = $1`, [sessionId]);
  return res.json({ status: "ok" });
});

// ==========================================
// ORDERS / CHECKOUT
// ==========================================
interface CartItemInput {
  productId: string;
  quantity: number;
}

router.post("/storefront/orders", async (req: Request, res: Response) => {
  const client = await (await getTenantPool(req.tenantId!)).connect();
  try {
    const { items, email, name } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    // Normalize and validate the cart.
    const cart: CartItemInput[] = items
      .map((it: any) => ({
        productId: String(it.productId || it.id || ""),
        quantity: Math.max(1, Math.min(99, parseInt(String(it.quantity ?? 1), 10) || 1)),
      }))
      .filter((it) => it.productId);

    if (cart.length === 0) {
      return res.status(400).json({ error: "Cart contains no valid items" });
    }

    const schema = getTenantSchema(req.tenantId!);

    await client.query("BEGIN");

    // 1. Resolve / create customer.
    const existing = await client.query(
      `SELECT id, name FROM ${schema}.customers WHERE email = $1`,
      [email.toLowerCase()]
    );
    let customerId: string;
    if (existing.rows.length > 0) {
      customerId = existing.rows[0].id;
      if (name && existing.rows[0].name !== name) {
        await client.query(`UPDATE ${schema}.customers SET name = $1 WHERE id = $2`, [name, customerId]);
      }
    } else {
      customerId = uuidv4();
      await client.query(
        `INSERT INTO ${schema}.customers (id, email, name) VALUES ($1, $2, $3)`,
        [customerId, email.toLowerCase(), name || email.split("@")[0]]
      );
    }

    // 2. Load product prices, validate stock, compute total.
    const productIds = cart.map((c) => c.productId);
    const productsResult = await client.query(
      `SELECT id, name, price, stock_count, sales_count
         FROM ${schema}.products
        WHERE id = ANY($1::uuid[])`,
      [productIds]
    );
    const productsById = new Map<string, any>(productsResult.rows.map((p) => [p.id, p]));

    let total = 0;
    const orderItems: { productId: string; quantity: number; price: number; name: string }[] = [];
    for (const item of cart) {
      const product = productsById.get(item.productId);
      if (!product) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      if (product.stock_count < item.quantity) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({ error: `Insufficient stock for ${product.name}` });
      }
      const price = Number(product.price);
      total += price * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, price, name: product.name });
    }

    // 3. Create order.
    const orderId = uuidv4();
    await client.query(
      `INSERT INTO ${schema}.orders (id, customer_id, customer_email, total, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, customerId, email.toLowerCase(), total.toFixed(2), "pending"]
    );

    // 4. Insert order items + decrement stock + bump sales.
    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO ${schema}.order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, oi.productId, oi.quantity, oi.price.toFixed(2)]
      );
      await client.query(
        `UPDATE ${schema}.products
            SET stock_count = stock_count - $1,
                sales_count = sales_count + $2,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $3`,
        [oi.quantity, oi.quantity, oi.productId]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      id: orderId,
      status: "pending",
      total: Number(total.toFixed(2)),
      currency: "USD",
      items: orderItems,
      customer: { id: customerId, email: email.toLowerCase(), name: name || "" },
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    console.error("[storefront-api] checkout error:", err);
    return res.status(500).json({ error: err?.message || "Checkout failed" });
  } finally {
    client.release();
  }
});

router.get("/storefront/orders", async (req: Request, res: Response) => {
  try {
    const session = await resolveCustomerSession(req);
    const emailParam = typeof req.query.email === "string" ? req.query.email.toLowerCase() : null;
    if (!session && !emailParam) {
      return res.status(401).json({ error: "Provide X-Customer-Token or ?email=" });
    }
    const targetEmail = session?.email ?? emailParam!;
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);
    const result = await pool.query(
      `SELECT o.id, o.customer_email, o.total, o.status, o.created_at,
              COALESCE(json_agg(json_build_object(
                 'productId', oi.product_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
         FROM ${schema}.orders o
         LEFT JOIN ${schema}.order_items oi ON oi.order_id = o.id
        WHERE o.customer_email = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 50`,
      [targetEmail]
    );
    return res.json({ data: result.rows, count: result.rows.length });
  } catch (err: any) {
    console.error("[storefront-api] orders list error:", err);
    return res.status(500).json({ error: err?.message || "Failed to list orders" });
  }
});

router.get("/storefront/orders/:orderId", async (req: Request, res: Response) => {
  try {
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);
    const orderResult = await pool.query(
      `SELECT id, customer_email, total, status, created_at
         FROM ${schema}.orders WHERE id = $1`,
      [req.params.orderId]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    const itemsResult = await pool.query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name
         FROM ${schema}.order_items oi
         LEFT JOIN ${schema}.products p ON p.id = oi.product_id
        WHERE oi.order_id = $1`,
      [req.params.orderId]
    );
    return res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err: any) {
    console.error("[storefront-api] order get error:", err);
    return res.status(500).json({ error: err?.message || "Failed to get order" });
  }
});

// ==========================================
// ANALYTICS (lightweight, per-tenant)
// ==========================================
router.get("/storefront/analytics/summary", async (req: Request, res: Response) => {
  try {
    const pool = await getTenantPool(req.tenantId!);
    const schema = getTenantSchema(req.tenantId!);
    const [products, orders, revenue] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM ${schema}.products`),
      pool.query(`SELECT COUNT(*)::int AS count FROM ${schema}.orders`),
      pool.query(
        `SELECT COALESCE(SUM(total), 0)::numeric AS revenue FROM ${schema}.orders WHERE status <> 'cancelled'`
      ),
    ]);
    return res.json({
      products: products.rows[0]?.count ?? 0,
      orders: orders.rows[0]?.count ?? 0,
      revenue: Number(revenue.rows[0]?.revenue ?? 0),
    });
  } catch (err: any) {
    console.error("[storefront-api] analytics error:", err);
    return res.status(500).json({ error: err?.message || "Failed to load analytics" });
  }
});

export default router;
