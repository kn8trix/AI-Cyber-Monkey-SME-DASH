/**
 * Vercel REST API client for per-tenant storefront deployments.
 *
 * Architecture (1A + 2A + 3A + 4A):
 *   - One Vercel project per tenant, all backed by the same GitHub repo
 *     (kn8trix/AI-Cyber-Monkey-SME-DASH) — each project gets its own
 *     production URL like https://sme-storefront-{slug}.vercel.app
 *   - The Vite build is identical across tenants; per-tenant identity
 *     flows in via VITE_TENANT_ID + VITE_API_BASE env vars that are
 *     pinned to the Vercel project at create time.
 *   - Deploys are triggered manually from the dashboard (POST
 *     /api/admin/deploy/:tenantId). A personal Vercel hobby token is
 *     used (Bearer auth).
 *
 * Endpoints used (Vercel REST API v9-v13):
 *   POST   /v10/projects
 *   POST   /v10/projects/{idOrName}/deploy-with-git
 *   GET    /v13/deployments/{id}
 *   DELETE /v9/projects/{id}
 *
 * All requests append ?teamId=... when VERCEL_TEAM_ID is set, so a Team
 * account also works without code changes.
 */

const VERCEL_API_BASE = "https://api.vercel.com";

export interface VercelProject {
  id: string;
  name: string;
}

export interface VercelDeployment {
  id: string;
  url: string;
  readyState: "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
  createdAt: number;
  errorMessage?: string;
}

export interface VercelEnvVar {
  key: string;
  value: string;
  target: ("production" | "preview" | "development")[];
  type: "plain" | "secret" | "encrypted";
}

export interface CreateProjectInput {
  name: string;          // project name, must be unique in account
  slug: string;          // tenant slug, used for the production URL hint
  repo: string;          // "owner/repo" for the GitHub source
  branch?: string;       // defaults to "main"
  buildCommand?: string; // defaults to "npm run build"
  installCommand?: string;
  outputDirectory?: string;
  envVars?: VercelEnvVar[];
}

export interface DeployProjectInput {
  projectId: string;
  repo: string;
  branch?: string;
}

class VercelDeployService {
  private token: string | undefined;
  private teamId: string | undefined;
  private defaultRepo: string | undefined;
  private defaultBranch: string;
  private defaultBuildCommand: string;
  private defaultOutputDir: string;
  private enabled: boolean;

  constructor() {
    this.token = process.env.VERCEL_API_TOKEN;
    this.teamId = process.env.VERCEL_TEAM_ID || undefined;
    // If unset, we fall back to whatever repo the dashboard itself is on.
    this.defaultRepo =
      process.env.VERCEL_STOREFRONT_REPO_URL ||
      process.env.VERCEL_DEFAULT_REPO ||
      "kn8trix/AI-Cyber-Monkey-SME-DASH";
    this.defaultBranch = process.env.VERCEL_DEFAULT_BRANCH || "main";
    this.defaultBuildCommand = process.env.VERCEL_BUILD_COMMAND || "npm run vercel-build";
    this.defaultOutputDir = process.env.VERCEL_OUTPUT_DIR || "dist";
    this.enabled = Boolean(this.token);
    if (!this.enabled) {
      console.warn(
        "[vercel-deploy] VERCEL_API_TOKEN is not set — tenant deploys will be rejected with 503."
      );
    }
  }

  /** Quick readiness check used by the /deploy routes. */
  isConfigured(): boolean {
    return this.enabled;
  }

  /**
   * Build the Authorization header + teamId query string for a Vercel call.
   */
  private authHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error("VERCEL_API_TOKEN is not configured");
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "User-Agent": "sme-ai-dashboard/1.0 (+vercel-deploy)",
    };
  }

  private teamQuery(): string {
    return this.teamId ? `?teamId=${encodeURIComponent(this.teamId)}` : "";
  }

  /**
   * Create a new Vercel project tied to the GitHub repo + branch.
   * Returns the project { id, name }.
   *
   * NOTE: Vercel's API requires the repo to already be in the user's
   * Vercel-GitHub integration. If it isn't, this returns a 403 with a
   * "git_provider_not_configured" error which we surface to the UI.
   */
  async createProject(input: CreateProjectInput): Promise<VercelProject> {
    const body: Record<string, any> = {
      name: input.name,
      framework: "vite",
      gitSource: {
        type: "github",
        repo: input.repo,
        ref: input.branch || this.defaultBranch,
      },
      buildCommand: input.buildCommand || this.defaultBuildCommand,
      installCommand: input.installCommand || "npm install",
      outputDirectory: input.outputDirectory || this.defaultOutputDir,
      rootDirectory: ".",
      // Make sure the production URL includes the tenant slug
      productionDeploymentAlias: [`sme-${input.slug}.vercel.app`],
    };

    const res = await fetch(`${VERCEL_API_BASE}/v10/projects${this.teamQuery()}`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Vercel createProject failed: ${res.status} ${res.statusText} — ${text}`
      );
    }

    const data: any = await res.json();
    return { id: data.id, name: data.name };
  }

  /**
   * Trigger a fresh production deployment on an existing project by
   * re-using the configured Git source. This is the cheapest way to
   * "rebuild" a storefront after a config change.
   */
  async deployProject(input: DeployProjectInput): Promise<VercelDeployment> {
    const body = {
      name: input.projectId,
      ref: input.branch || this.defaultBranch,
      target: "production",
      gitSource: {
        type: "github",
        ref: input.branch || this.defaultBranch,
        repoId: input.repo,
      },
    };

    const res = await fetch(
      `${VERCEL_API_BASE}/v10/projects/${encodeURIComponent(input.projectId)}/deploy-with-git${this.teamQuery()}`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Vercel deployProject failed: ${res.status} ${res.statusText} — ${text}`
      );
    }

    const data: any = await res.json();
    return {
      id: data.id,
      url: data.url ? `https://${data.url}` : data.alias?.[0]
        ? `https://${data.alias[0]}`
        : "",
      readyState: data.readyState || "QUEUED",
      createdAt: data.createdAt || Date.now(),
    };
  }

  /**
   * Poll the live status of a deployment. Used by the dashboard's
   * "Refresh status" button and the build-completion webhook path.
   */
  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    const res = await fetch(
      `${VERCEL_API_BASE}/v13/deployments/${encodeURIComponent(deploymentId)}${this.teamQuery()}`,
      { method: "GET", headers: this.authHeaders() }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Vercel getDeployment failed: ${res.status} ${res.statusText} — ${text}`
      );
    }
    const data: any = await res.json();
    return {
      id: data.id,
      url: data.url ? `https://${data.url}` : data.alias?.[0]
        ? `https://${data.alias[0]}`
        : "",
      readyState: data.readyState,
      createdAt: data.createdAt,
      errorMessage: data.errorMessage,
    };
  }

  /**
   * Tear down a Vercel project (and all its deployments + domains).
   * Idempotent — 404s are swallowed because the user may have already
   * nuked it from the Vercel dashboard.
   */
  async deleteProject(projectId: string): Promise<void> {
    const res = await fetch(
      `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectId)}${this.teamQuery()}`,
      { method: "DELETE", headers: this.authHeaders() }
    );
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(
        `Vercel deleteProject failed: ${res.status} ${res.statusText} — ${text}`
      );
    }
  }

  /**
   * Upsert a small set of plain env vars on the production target.
   * We always pin the tenant ID + API base so the deployed SPA can
   * self-identify at runtime.
   */
  async setProductionEnv(
    projectId: string,
    envVars: VercelEnvVar[]
  ): Promise<void> {
    for (const env of envVars) {
      const url =
        `${VERCEL_API_BASE}/v10/projects/${encodeURIComponent(projectId)}` +
        `/env${this.teamQuery()}`;

      // Vercel requires POST for new, PATCH-style for upsert; we use
      // a create-or-update loop keyed by env.key.
      // First try to create:
      const createRes = await fetch(url, {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(env),
      });

      if (createRes.status === 409 || createRes.status === 400) {
        // Already exists — PATCH the value:
        const patchRes = await fetch(
          `${url}/${encodeURIComponent(env.key)}${this.teamQuery()}`,
          {
            method: "PATCH",
            headers: this.authHeaders(),
            body: JSON.stringify({ value: env.value, target: env.target }),
          }
        );
        if (!patchRes.ok) {
          const text = await patchRes.text();
          throw new Error(
            `Vercel setEnv (patch ${env.key}) failed: ${patchRes.status} — ${text}`
          );
        }
      } else if (!createRes.ok) {
        const text = await createRes.text();
        throw new Error(
          `Vercel setEnv (create ${env.key}) failed: ${createRes.status} — ${text}`
        );
      }
    }
  }

  /**
   * Derive a Vercel-safe project name from a tenant UUID + slug. Must
   * be lowercase, alphanumeric + dashes, <= 50 chars.
   */
  static projectName(slug: string, tenantId: string): string {
    const safeSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const tail = tenantId.replace(/-/g, "").slice(0, 8);
    return `sme-${safeSlug || "store"}-${tail}`.slice(0, 50);
  }

  getDefaultRepo(): string {
    return this.defaultRepo;
  }
}

export { VercelDeployService };
export default new VercelDeployService();
