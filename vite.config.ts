import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    https: false, // Set to true for HTTPS if needed for WebXR
  },
  // Enable network access for Quest testing
  preview: {
    host: '0.0.0.0',
    port: 4173,
  }
})
