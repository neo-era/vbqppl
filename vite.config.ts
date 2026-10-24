import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Đường dẫn gốc: '/' (Vercel/tên miền riêng) hoặc '/vbqppl/' (GitHub Pages) — đặt qua biến BASE_PATH.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // KHÔNG cache dữ liệu/Storage Supabase: trên máy dùng chung, dữ liệu theo
        // phiên đăng nhập không được lưu lại. Chỉ app shell được precache để mở offline.
        navigationPreload: false,
      },
      manifest: {
        name: 'Tra cứu Văn bản Quy phạm Pháp luật',
        short_name: 'VBQPPL',
        description: 'Lưu trữ & tra cứu văn bản quy phạm pháp luật',
        lang: 'vi',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#5b4bff',
        background_color: '#0e0f17',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
});
