import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Chart libraries are only used on admin analytics — split them out
          if (id.includes('@nivo') || id.includes('recharts') || id.includes('/d3-')) {
            return 'vendor-charts'
          }
          // Framer Motion is large — isolate it
          if (id.includes('framer-motion')) return 'vendor-motion'
          // Radix UI primitives — stable, cache-friendly
          if (id.includes('@radix-ui')) return 'vendor-radix'
          // Icon set is large (~300 KB)
          if (id.includes('@phosphor-icons')) return 'vendor-icons'
          // TanStack Query
          if (id.includes('@tanstack')) return 'vendor-query'
          // Supabase auth client
          if (id.includes('@supabase')) return 'vendor-supabase'
          // React core + router
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
