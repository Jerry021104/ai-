import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Polyfill process.env for the Google GenAI SDK and pass the API key from build environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env': {} 
  }
});