// Vercel serverless entry point.
//
// `vercel.json` rewrites all incoming requests (including `/api/*`,
// `/store/*`, `/admin/*`, and the SPA catch-all) to this file. We import
// the already-bundled Express `app` from `dist/server.cjs` and re-export
// it as the serverless function handler.
//
// Why not `../server`?
//   Vercel's function builder only bundles files inside `api/` into the
//   Lambda package. The project-root `server.ts` is never copied to
//   `/var/task/`, so a relative import like `import app from "../server"`
//   throws `ERR_MODULE_NOT_FOUND: '/var/task/server'` on the first
//   request.
//
//   Instead, the `build` script in `package.json` runs
//     esbuild server.ts --bundle --platform=node --format=cjs --packages=external
//   which inlines every dependency (express, @google/genai, multer, pg,
//   supabase, etc.) into a single CommonJS file at `dist/server.cjs`.
//   That file lives next to `api/index.ts` in the final deployment
//   layout (`dist/` is the `outputDirectory`), so we can `require` it
//   directly. Vercel auto-builds `api/index.ts` separately; we just keep
//   this shim tiny and CJS-friendly.
//
// Notes:
//   - Importing `../dist/server.cjs` runs the source file's top-level
//     side effects: registers all `/api/*` routes, calls
//     `initializeMasterSchema()`, etc. The `startServer()` call is
//     gated by `process.env.VERCEL !== "1"` and is therefore skipped
//     here, so the listener is never invoked.
//   - Vercel invokes the default-exported function with `(req, res)` and
//     Express handles the response normally.
//   - Local dev is unchanged: `npm run dev` still runs `tsx server.ts`,
//     which never touches this file.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../dist/server.cjs").default;

export default app;
