import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'offline' ? [viteSingleFile()] : [])],
  build: {
    target: 'es2024',
    sourcemap: mode !== 'offline',
    assetsInlineLimit: mode === 'offline' ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 1200
  },
  test: { environment: 'node' }
}));
