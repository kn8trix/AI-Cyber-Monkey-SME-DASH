// Vercel serverless entry point.
//
// `vercel.json` rewrites all incoming requests (including `/api/*`,
// `/store/*`, `/admin/*`, and the SPA catch-all) to this file. We import
// the shared Express `app` from `server.ts` and re-export it as the
// serverless function handler.
//
// Notes:
//   - Importing `../server` runs its top-level side effects: registers
//     all `/api/*` routes, calls `initializeMasterSchema()`, etc. The
//     `startServer()` call is gated by `process.env.VERCEL !== "1"` and
//     is therefore skipped here, so the listener is never invoked.
//   - Vercel invokes the default-exported function with `(req, res)` and
//     Express handles the response normally.
//   - Local dev is unchanged: `npm run dev` still runs `tsx server.ts`.

import app from "../server";

export default app;
