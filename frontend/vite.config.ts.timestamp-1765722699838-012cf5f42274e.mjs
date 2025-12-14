// vite.config.ts
import { defineConfig } from "file:///C:/Users/USER/Documents/CascadeProjects/windsurf-project/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/USER/Documents/CascadeProjects/windsurf-project/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { nodePolyfills } from "file:///C:/Users/USER/Documents/CascadeProjects/windsurf-project/frontend/node_modules/vite-plugin-node-polyfills/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\USER\\Documents\\CascadeProjects\\windsurf-project\\frontend";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util", "process", "path", "events"],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  define: {
    global: "globalThis"
  },
  resolve: {
    alias: {
      // Use browser-compatible implementations
      "keccak": path.resolve(__vite_injected_original_dirname, "src/polyfills/keccak.ts"),
      "fetch-retry": path.resolve(__vite_injected_original_dirname, "src/polyfills/fetch-retry.ts")
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      }
    },
    exclude: ["@zama-fhe/relayer-sdk"]
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        format: "es"
      }
    }
  },
  esbuild: {
    supported: {
      "top-level-await": true
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVU0VSXFxcXERvY3VtZW50c1xcXFxDYXNjYWRlUHJvamVjdHNcXFxcd2luZHN1cmYtcHJvamVjdFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVVNFUlxcXFxEb2N1bWVudHNcXFxcQ2FzY2FkZVByb2plY3RzXFxcXHdpbmRzdXJmLXByb2plY3RcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VTRVIvRG9jdW1lbnRzL0Nhc2NhZGVQcm9qZWN0cy93aW5kc3VyZi1wcm9qZWN0L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBub2RlUG9seWZpbGxzKHtcclxuICAgICAgaW5jbHVkZTogWydidWZmZXInLCAnY3J5cHRvJywgJ3N0cmVhbScsICd1dGlsJywgJ3Byb2Nlc3MnLCAncGF0aCcsICdldmVudHMnXSxcclxuICAgICAgZ2xvYmFsczoge1xyXG4gICAgICAgIEJ1ZmZlcjogdHJ1ZSxcclxuICAgICAgICBnbG9iYWw6IHRydWUsXHJcbiAgICAgICAgcHJvY2VzczogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbiAgZGVmaW5lOiB7XHJcbiAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIC8vIFVzZSBicm93c2VyLWNvbXBhdGlibGUgaW1wbGVtZW50YXRpb25zXHJcbiAgICAgICdrZWNjYWsnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3BvbHlmaWxscy9rZWNjYWsudHMnKSxcclxuICAgICAgJ2ZldGNoLXJldHJ5JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9wb2x5ZmlsbHMvZmV0Y2gtcmV0cnkudHMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGVzYnVpbGRPcHRpb25zOiB7XHJcbiAgICAgIGRlZmluZToge1xyXG4gICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGV4Y2x1ZGU6IFsnQHphbWEtZmhlL3JlbGF5ZXItc2RrJ10sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgZm9ybWF0OiAnZXMnLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGVzYnVpbGQ6IHtcclxuICAgIHN1cHBvcnRlZDoge1xyXG4gICAgICAndG9wLWxldmVsLWF3YWl0JzogdHJ1ZSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtWSxTQUFTLG9CQUFvQjtBQUNoYSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxVQUFVLFVBQVUsVUFBVSxRQUFRLFdBQVcsUUFBUSxRQUFRO0FBQUEsTUFDM0UsU0FBUztBQUFBLFFBQ1AsUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFTCxVQUFVLEtBQUssUUFBUSxrQ0FBVyx5QkFBeUI7QUFBQSxNQUMzRCxlQUFlLEtBQUssUUFBUSxrQ0FBVyw4QkFBOEI7QUFBQSxJQUN2RTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTLENBQUMsdUJBQXVCO0FBQUEsRUFDbkM7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFdBQVc7QUFBQSxNQUNULG1CQUFtQjtBQUFBLElBQ3JCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
