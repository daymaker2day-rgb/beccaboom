import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/sepgit1beccaboom/',
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
      },
      server: {
        port: 8000,
        host: '0.0.0.0',
        fs: {
          allow: ['..']
        }
      },
      publicDir: 'public',
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
