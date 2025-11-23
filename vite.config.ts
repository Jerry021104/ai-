import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Injecting the API key provided for Vercel deployment.
    // WARNING: In a production environment, it is recommended to set this in Vercel Project Settings > Environment Variables
    // and use `process.env.API_KEY` here instead of the hardcoded string.
    'process.env.API_KEY': JSON.stringify("AIzaSyBCIawtsznKGifNCHYuK0vC_VYzYIpjbfU"),
    'process.env': {} 
  }
});