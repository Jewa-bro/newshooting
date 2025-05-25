import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/newshooting/' : '/';

  return {
    base: base,
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      watch: {
        usePolling: true,
        interval: 1000,
      },
      hmr: {
        overlay: false
      }
    }
  };
});
