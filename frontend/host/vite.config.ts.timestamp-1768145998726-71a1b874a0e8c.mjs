// vite.config.ts
import { defineConfig } from "file:///home/murken/source/DopDocAI/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///home/murken/source/DopDocAI/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { federation } from "file:///home/murken/source/DopDocAI/frontend/node_modules/@module-federation/vite/lib/index.cjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    federation({
      dev: true,
      name: "host",
      manifest: true,
      remotes: {
        mf_repos: {
          type: "module",
          name: "mf_repos",
          entry: "http://localhost:5174/remoteEntry.js"
        },
        mf_chat: {
          type: "module",
          name: "mf_chat",
          entry: "http://localhost:5175/remoteEntry.js"
        }
      },
      shared: {
        "react": { singleton: true },
        "react-dom": { singleton: true },
        "mobx": { singleton: true },
        "react-router-dom": { singleton: true },
        "mobx-react-lite": { singleton: true }
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/ingest": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, "")
        // /api/ingest/repo -> /ingest/repo
      },
      "/api/chats": {
        target: "http://localhost:9100",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, "")
        // /api/chats -> /chats
      },
      "/api": {
        target: "http://localhost:9000",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, "")
        // /api/repos -> /repos
      }
    }
  },
  build: {
    modulePreload: false,
    target: "chrome89",
    minify: false,
    cssCodeSplit: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9tdXJrZW4vc291cmNlL0RvcERvY0FJL2Zyb250ZW5kL2hvc3RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL211cmtlbi9zb3VyY2UvRG9wRG9jQUkvZnJvbnRlbmQvaG9zdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9tdXJrZW4vc291cmNlL0RvcERvY0FJL2Zyb250ZW5kL2hvc3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQge2RlZmluZUNvbmZpZ30gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB7ZmVkZXJhdGlvbn0gZnJvbSAnQG1vZHVsZS1mZWRlcmF0aW9uL3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgZmVkZXJhdGlvbih7XG4gICAgICAgICAgICBkZXY6IHRydWUsXG4gICAgICAgICAgICBuYW1lOiBcImhvc3RcIixcbiAgICAgICAgICAgIG1hbmlmZXN0OiB0cnVlLFxuICAgICAgICAgICAgcmVtb3Rlczoge1xuICAgICAgICAgICAgICAgIG1mX3JlcG9zOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwibW9kdWxlXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwibWZfcmVwb3NcIixcbiAgICAgICAgICAgICAgICAgICAgZW50cnk6IFwiaHR0cDovL2xvY2FsaG9zdDo1MTc0L3JlbW90ZUVudHJ5LmpzXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtZl9jaGF0OiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwibW9kdWxlXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwibWZfY2hhdFwiLFxuICAgICAgICAgICAgICAgICAgICBlbnRyeTogXCJodHRwOi8vbG9jYWxob3N0OjUxNzUvcmVtb3RlRW50cnkuanNcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNoYXJlZDoge1xuICAgICAgICAgICAgICAgIFwicmVhY3RcIjoge3NpbmdsZXRvbjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgXCJyZWFjdC1kb21cIjoge3NpbmdsZXRvbjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgXCJtb2J4XCI6IHtzaW5nbGV0b246IHRydWV9LFxuICAgICAgICAgICAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiOiB7c2luZ2xldG9uOiB0cnVlfSxcbiAgICAgICAgICAgICAgICBcIm1vYngtcmVhY3QtbGl0ZVwiOiB7c2luZ2xldG9uOiB0cnVlfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIF0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICAgIHByb3h5OiB7XG4gICAgICAgICAgICBcIi9hcGkvaW5nZXN0XCI6IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDo4MDAwXCIsXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmV3cml0ZTogKHApID0+IHAucmVwbGFjZSgvXlxcL2FwaS8sIFwiXCIpLCAvLyAvYXBpL2luZ2VzdC9yZXBvIC0+IC9pbmdlc3QvcmVwb1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiL2FwaS9jaGF0c1wiOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6OTEwMFwiLFxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJld3JpdGU6IChwKSA9PiBwLnJlcGxhY2UoL15cXC9hcGkvLCBcIlwiKSwgLy8gL2FwaS9jaGF0cyAtPiAvY2hhdHNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIi9hcGlcIjoge1xuICAgICAgICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjkwMDBcIixcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXdyaXRlOiAocCkgPT4gcC5yZXBsYWNlKC9eXFwvYXBpLywgXCJcIiksIC8vIC9hcGkvcmVwb3MgLT4gL3JlcG9zXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgICAgbW9kdWxlUHJlbG9hZDogZmFsc2UsXG4gICAgICAgIHRhcmdldDogJ2Nocm9tZTg5JyxcbiAgICAgICAgbWluaWZ5OiBmYWxzZSxcbiAgICAgICAgY3NzQ29kZVNwbGl0OiBmYWxzZVxuICAgIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1QsU0FBUSxvQkFBbUI7QUFDM1UsT0FBTyxXQUFXO0FBQ2xCLFNBQVEsa0JBQWlCO0FBRXpCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFNBQVM7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFdBQVc7QUFBQSxNQUNQLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFNBQVM7QUFBQSxRQUNMLFVBQVU7QUFBQSxVQUNOLE1BQU07QUFBQSxVQUNOLE1BQU07QUFBQSxVQUNOLE9BQU87QUFBQSxRQUNYO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDTCxNQUFNO0FBQUEsVUFDTixNQUFNO0FBQUEsVUFDTixPQUFPO0FBQUEsUUFDWDtBQUFBLE1BQ0o7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNKLFNBQVMsRUFBQyxXQUFXLEtBQUk7QUFBQSxRQUN6QixhQUFhLEVBQUMsV0FBVyxLQUFJO0FBQUEsUUFDN0IsUUFBUSxFQUFDLFdBQVcsS0FBSTtBQUFBLFFBQ3hCLG9CQUFvQixFQUFDLFdBQVcsS0FBSTtBQUFBLFFBQ3BDLG1CQUFtQixFQUFDLFdBQVcsS0FBSTtBQUFBLE1BQ3ZDO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osT0FBTztBQUFBLE1BQ0gsZUFBZTtBQUFBLFFBQ1gsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLFVBQVUsRUFBRTtBQUFBO0FBQUEsTUFDMUM7QUFBQSxNQUNBLGNBQWM7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxVQUFVLEVBQUU7QUFBQTtBQUFBLE1BQzFDO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDSixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsVUFBVSxFQUFFO0FBQUE7QUFBQSxNQUMxQztBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxlQUFlO0FBQUEsSUFDZixRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsRUFDbEI7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
