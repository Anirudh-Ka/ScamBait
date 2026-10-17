// Builds one self-contained HTML file that plays fully offline (no server).
// Handy as a backup at Expo or to share a quick preview: npm run build:demo
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'dist-demo', assetsInlineLimit: 100000000 },
});
