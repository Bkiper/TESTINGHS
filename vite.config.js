
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Make the API_KEY environment variable available in the client-side code
    // This value will be taken from the environment where Vite is run (e.g., your shell, .env file, CI server)
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
