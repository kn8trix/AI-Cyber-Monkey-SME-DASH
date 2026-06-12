// Vercel serverless entry point.
//
// `vercel.json` rewrites all incoming requests (including `/api/*`,
// `/store/*`, `/admin/*`, and the SPA catch-all) to this file. We
// re-export the pre-bundled Express `app` from `./server.cjs`.
//
// Why a separate CJS shim?
//   The project root is `"type": "module"`, so Vercel compiles any
//   `api/index.ts` to strict ESM. That meant the previous shim —
//   `import app from "../dist/server.cjs"` — failed at runtime with
//   `ERR_MODULE_NOT_FOUND` (project-root files are not shipped to the
//   Lambda) and the alternate `require(...)` failed with
//   `ReferenceError: require is not defined` in ESM context.
//
//   The `build` script in `package.json` runs
//     esbuild server.ts --bundle --platform=node --format=cjs
//   which inlines every dependency (express, @google/genai, multer,
//   pg, supabase, etc.) into `./server.cjs` next to this file. Both
//   files are inside `api/`, so Vercel's function builder ships them
//   together inside the same Lambda package. The shim is a CommonJS
//   file (`.cjs`) so `require()` works regardless of the package's
//   `"type": "module"` setting.
//
// Notes:
//   - Importing `./server.cjs` runs its top-level side effects:
//     registers all `/api/*` routes, calls `initializeMasterSchema()`,
//     etc. The `startServer()` call is gated by
//     `process.env.VERCEL !== "1"` and is therefore skipped here, so
//     the listener is never invoked.
//   - Vercel invokes the default-exported function with `(req, res)`
//     and Express handles the response normally.
//   - Local dev is unchanged: `npm run dev` still runs `tsx server.ts`
//     and never touches this file.

module.exports = require("./server.cjs").default;
