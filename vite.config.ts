import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Per-tenant storefront builds rely on these env vars being inlined
// at build time. The *dashboard* build (this repo's Vercel project)
// always runs with VITE_TENANT_ID="", so `import.meta.env.VITE_TENANT_ID`
// is "" everywhere in admin/UI code.
//
// When this same repo is deployed as a tenant storefront, the Vercel
// project has VITE_TENANT_ID + VITE_API_BASE pinned as project env
// vars. Vite picks them up automatically via the `loadEnv` path below.
const readEnv = (key: string, fallback = ""): string => {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
};

export default defineConfig(({ mode }) => {
  // Pull VITE_* env vars from process.env + .env files so we can
  // surface a `tenant` object at runtime via import.meta.env.
  const env = {
    VITE_TENANT_ID: readEnv("VITE_TENANT_ID"),
    VITE_API_BASE: readEnv("VITE_API_BASE", "http://localhost:3000"),
    VITE_STORE_DOMAIN: readEnv("VITE_STORE_DOMAIN"),
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Inline tenant env vars into the bundle. Vite does this
    // automatically for `VITE_*` keys, but spelling it out here
    // makes the build output deterministic across Vite upgrades.
    define: {
      'import.meta.env.VITE_TENANT_ID': JSON.stringify(env.VITE_TENANT_ID),
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE),
      'import.meta.env.VITE_STORE_DOMAIN': JSON.stringify(env.VITE_STORE_DOMAIN),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      sourcemap: mode !== 'production' || process.env.VITE_SOURCEMAP === 'true',
    },
  };
});
