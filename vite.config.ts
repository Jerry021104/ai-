import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Injecting the API key provided.
    'process.env.API_KEY': JSON.stringify("AIzaSyBCIawtsznKGifNCHYuK0vC_VYzYIpjbfU"),
    'process.env': {} 
  }
});