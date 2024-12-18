// vite.config.ts
import { vitePlugin as remix } from "file:///C:/Users/wjwel/projects/appdragon/appDragon/node_modules/.pnpm/@remix-run+dev@2.10.0_@remix-run+react@2.10.2_react-dom@18.3.1_react@18.3.1__react@18.3.1_typ_qfaveinkzcy5cswn4svdacs27u/node_modules/@remix-run/dev/dist/index.js";
import { defineConfig } from "file:///C:/Users/wjwel/projects/appdragon/appDragon/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///C:/Users/wjwel/projects/appdragon/appDragon/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.5.2_vite@5.3.1_@types+node@20.14.9_sass@1.77.6_/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { nodePolyfills } from "file:///C:/Users/wjwel/projects/appdragon/appDragon/node_modules/.pnpm/vite-plugin-node-polyfills@0.22.0_rollup@4.18.0_vite@5.3.1_@types+node@20.14.9_sass@1.77.6_/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { optimizeCssModules } from "file:///C:/Users/wjwel/projects/appdragon/appDragon/node_modules/.pnpm/vite-plugin-optimize-css-modules@1.2.0_vite@5.3.1_@types+node@20.14.9_sass@1.77.6_/node_modules/vite-plugin-optimize-css-modules/dist/index.mjs";
import UnoCSS from "file:///C:/Users/wjwel/projects/appdragon/appDragon/node_modules/.pnpm/unocss@0.61.9_postcss@8.4.38_rollup@4.18.0_vite@5.3.1_@types+node@20.14.9_sass@1.77.6_/node_modules/unocss/dist/vite.mjs";
var vite_config_default = defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/*.css"],
      serverModuleFormat: "esm",
      serverPlatform: "node"
    }),
    tsconfigPaths(),
    nodePolyfills({
      include: ["process"],
      globals: {
        process: true
      }
    }),
    optimizeCssModules(),
    UnoCSS()
  ],
  server: {
    port: 3e3
  },
  build: {
    target: "esnext",
    outDir: "dist",
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        format: "esm",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react/") || id.includes("react-dom/")) {
              return;
            }
            return "vendor";
          }
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx3andlbFxcXFxwcm9qZWN0c1xcXFxhcHBkcmFnb25cXFxcYXBwRHJhZ29uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx3andlbFxcXFxwcm9qZWN0c1xcXFxhcHBkcmFnb25cXFxcYXBwRHJhZ29uXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy93andlbC9wcm9qZWN0cy9hcHBkcmFnb24vYXBwRHJhZ29uL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gJ0ByZW1peC1ydW4vZGV2JztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xuaW1wb3J0IHsgb3B0aW1pemVDc3NNb2R1bGVzIH0gZnJvbSAndml0ZS1wbHVnaW4tb3B0aW1pemUtY3NzLW1vZHVsZXMnO1xuaW1wb3J0IFVub0NTUyBmcm9tICd1bm9jc3Mvdml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZW1peCh7XG4gICAgICBpZ25vcmVkUm91dGVGaWxlczogWycqKi8qLmNzcyddLFxuICAgICAgc2VydmVyTW9kdWxlRm9ybWF0OiAnZXNtJyxcbiAgICAgIHNlcnZlclBsYXRmb3JtOiAnbm9kZScsXG4gICAgfSksXG4gICAgdHNjb25maWdQYXRocygpLFxuICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgaW5jbHVkZTogWydwcm9jZXNzJ10sXG4gICAgICBnbG9iYWxzOiB7XG4gICAgICAgIHByb2Nlc3M6IHRydWUsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIG9wdGltaXplQ3NzTW9kdWxlcygpLFxuICAgIFVub0NTUygpLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBmb3JtYXQ6ICdlc20nLFxuICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LycpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20vJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVCxTQUFTLGNBQWMsYUFBYTtBQUNuVyxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLDBCQUEwQjtBQUNuQyxPQUFPLFlBQVk7QUFFbkIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLE1BQ0osbUJBQW1CLENBQUMsVUFBVTtBQUFBLE1BQzlCLG9CQUFvQjtBQUFBLE1BQ3BCLGdCQUFnQjtBQUFBLElBQ2xCLENBQUM7QUFBQSxJQUNELGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxTQUFTO0FBQUEsTUFDbkIsU0FBUztBQUFBLFFBQ1AsU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELG1CQUFtQjtBQUFBLElBQ25CLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsYUFBYSxJQUFJO0FBQ2YsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLGdCQUFJLEdBQUcsU0FBUyxRQUFRLEtBQUssR0FBRyxTQUFTLFlBQVksR0FBRztBQUN0RDtBQUFBLFlBQ0Y7QUFDQSxtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
