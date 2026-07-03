import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const hmrPort = Number(process.env.HMR_PORT) || 24678;
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          todo: path.resolve(__dirname, 'pages/todo.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-syntax-highlighter')) return 'syntax-highlighter';
            if (id.includes('node_modules/react-markdown')) return 'markdown';
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion';
            if (id.includes('node_modules/gsap')) return 'gsap';
            if (id.includes('node_modules/lucide-react')) return 'icons';
          },
        },
      },
    },
    optimizeDeps: {
      entries: ['index.html', 'pages/todo.html'],
    },
    server: {
      hmr: {
        host: 'localhost',
        port: hmrPort,
        clientPort: hmrPort,
      },
      watch: {
        ignored: [
          '**/vibe-sandbox/**',
          '**/projects/**',
          '**/.agentic-browser-profile/**',
        ],
      },
    },
  };
});
