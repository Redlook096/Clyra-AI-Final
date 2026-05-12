import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const geminiKey = env.GEMINI_API_KEY ?? env.VITE_GEMINI_API_KEY ?? '';
  const hmrPort = Number(process.env.HMR_PORT) || 24678;
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // JSON.stringify(undefined) is invalid for define and leaves `process` in the bundle → blank page in browser.
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-syntax-highlighter')) return 'syntax-highlighter';
            if (id.includes('node_modules/react-markdown')) return 'markdown';
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion';
            if (id.includes('node_modules/gsap')) return 'gsap';
            if (id.includes('node_modules/lucide-react')) return 'icons';
            if (id.includes('node_modules/@google/genai')) return 'gemini';
          },
        },
      },
    },
    optimizeDeps: {
      entries: ['index.html'],
    },
    server: {
      // The Vibe sandbox runs its own Vite middleware; keep the shell HMR port
      // explicit so the two live preview channels never collide.
      hmr: {
        host: 'localhost',
        port: hmrPort,
        clientPort: hmrPort,
      },
      watch: {
        ignored: ['**/vibe-sandbox/**'],
      },
    },
  };
});
