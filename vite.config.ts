import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ['**/*.css'],
      serverModuleFormat: 'esm',
      serverPlatform: 'node',
    }),
    tsconfigPaths(),
    nodePolyfills({
      include: ['process'],
      globals: {
        process: true,
      },
    }),
    optimizeCssModules(),
    UnoCSS(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        format: 'esm',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/')) {
              return;
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
