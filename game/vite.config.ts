import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset paths, so the build works from any folder or static host
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000
  }
});
