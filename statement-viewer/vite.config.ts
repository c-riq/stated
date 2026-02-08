import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isCompanies = mode === 'companies';
  
  return {
    root: '.',
    publicDir: 'public',
    server: {
      port: 3033,
      open: isCompanies ? '/?config=companies' : '/',
      cors: true,
      fs: {
        // Allow serving files from the entire project
        allow: ['..']
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          browser: resolve(__dirname, 'browser.html'),
          editor: resolve(__dirname, 'editor.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './')
      }
    }
  };
});