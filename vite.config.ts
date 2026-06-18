import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: false,
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                skipWaiting: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*supabase\.co\/rest\/v1\/.*/i,
                        handler: 'NetworkOnly',
                        options: {
                            cacheName: 'supabase-api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/.*supabase\.co\/storage\/v1\/object\/public\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'supabase-storage-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/auth/],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: false,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
});
