import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {federation} from '@module-federation/vite';

export default defineConfig({
    plugins: [
        react(),
        federation({
            dev: true,
            name: "mf_repos",
            filename: "remoteEntry.js",
            exposes: {"./RepoSidebar": "./src/components/RepoSidebar.tsx"},
            shared: {
                "@rag/shared": {singleton: true},
                "react": {singleton: true},
                "react-dom": {singleton: true},
                "mobx": {singleton: true},
                "react-router-dom": {singleton: true},
                "mobx-react-lite": {singleton: true}
            }
        })
    ],
    server: {
        port: 5174,
        strictPort: true,
        proxy: {
            "/api/ingest": {
                target: "http://localhost:8000",
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, ""), // /api/ingest/repo -> /ingest/repo
            },
            "/api/chats": {
                target: "http://localhost:9100",
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, ""), // /api/chats -> /chats
            },
            "/api/repos": {
                target: "http://localhost:9000",
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, ""), // /api/repos -> /repos
            },
            "/api/repo-index-states": {
                target: "http://localhost:9000",
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, ""), // /api/repos -> /repos
            },
            "/api/v1/auth": {
                target: "http://localhost:9200",
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, ""), // /api/repos -> /repos
            },
        },
        origin: "http://localhost:5174",
        cors: true,
        headers: {"Access-Control-Allow-Origin": "*"},
    },
    build: {
        modulePreload: false,
        target: 'chrome89',
        minify: false,
        cssCodeSplit: false,
    }
});
