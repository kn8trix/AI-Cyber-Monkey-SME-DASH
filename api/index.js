// Vercel serverless entry point.
//
// `vercel.json` rewrites all incoming requests (including `/api/*`,
// `/store/*`, `/admin/*`, and the SPA catch-all) to this file. We
// re-export the pre-bundled Express `app` from `./server.cjs`.
//
// Why an ESM `.js` shim?
//   Vercel's serverless function auto-discovery only recognises the
//   following extensions inside `api/`: `.js`, `.ts`, `.mjs`, `.tsx`,
//   `.jsx`. A `.cjs` file in `api/` is shipped as a static asset
//   and is *not* registered as a function. That's why the previous
//   `api/index.cjs` layout returned a 404 from the Vercel edge on
//   every request.
//
//   The project root is `"type": "module"`, so this `api/index.js` is
//   treated as ESM. The bundled server in `api/server.cjs` is CommonJS
//   (esbuild `--format=cjs`); ESM can import CJS via the default
//   import and receive `module.exports` as the namespace object.
//
// Why is `api/server.cjs` next to this file?
//   The `build` script in `package.json` runs
//     esbuild server.ts --bundle --platform=node --format=cjs
//   which inlines every dependency (express, @google/genai, multer,
//   pg, supabase, etc.) into `./server.cjs` next to this shim. Both
//   files end up in `api/`, so Vercel's function builder ships them
//   together inside the same Lambda package. The shim just re-exports
//   the Express `app` and never invokes `app.listen()`.
//
// Notes:
//   - Importing `./server.cjs` runs its top-level side effects:
//     registers all `/api/*` routes, calls `initializeMasterSchema()`,
//     etc. The `startServer()` call is gated by
//     `process.env.VERCEL !== "1"` and is therefore skipped here.
//   - Vercel invokes the default-exported function with `(req, res)`
//     and Express handles the response normally.
//   - Local dev is unchanged: `npm run dev` still runs `tsx server.ts`
//     and never touches this file.

// `import x from "./server.cjs"` returns the CJS `module.exports`
// namespace. The Express app is exported via `export default app` in
// `server.ts`, which esbuild emits as `module.exports.default = app`,
// so we unwrap `.default` and fall back to the raw namespace for safety.
import serverBundle from "./server.cjs";

const app = serverBundle && serverBundle.default
  ? serverBundle.default
  : serverBundle;

// Vercel Node serverless functions receive a Web Request in Vercel's
// Edge runtime, but on the Node runtime they receive the raw
// `http.IncomingMessage` / `http.ServerResponse` pair. Express
// understands that pair directly, so we can pass them through.
//
// We log a one-liner on every invocation so the Vercel function logs
// dashboard shows what URL Vercel is actually sending us. This makes
// it easy to verify that the rewrite destination preserves the
// original path (e.g. `/api/categorize-products`) instead of always
// calling us at `/api/index`.
export default function handler(req, res) {
  if (process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      console.log(
        `[api] ${req.method || "?"} ${req.url || "?"} ` +
          `ct=${req.headers && req.headers["content-type"] ? req.headers["content-type"] : "-"}`
      );
    } catch {
      /* logging must never throw */
    }
  }
  return app(req, res);
}
