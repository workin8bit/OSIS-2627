import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Saat development, request /api dan /uploads diteruskan ke server Express.
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': API_TARGET,
      '/uploads': API_TARGET,
    },
  },
});
