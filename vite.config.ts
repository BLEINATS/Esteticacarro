import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      // Proxy for W-API (.io version)
      '/w-api-proxy-io': {
        target: 'https://api.w-api.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/w-api-proxy-io/, ''),
        secure: false
      },
      // Proxy for W-API (.app version - legacy support)
      '/w-api-proxy-app': {
        target: 'https://api.w-api.app/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/w-api-proxy-app/, ''),
        secure: false
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          charts: ['recharts'],
          utils: ['date-fns', 'axios', 'qrcode']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
