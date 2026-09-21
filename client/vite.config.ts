import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@solve/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [path.resolve(__dirname, '..')] },
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
});
