import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  preview: { allowedHosts: true },
  optimizeDeps: { include: ['phaser'] },
});
