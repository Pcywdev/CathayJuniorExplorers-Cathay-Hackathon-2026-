import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const sharedDir = fileURLToPath(new URL('../shared', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `import program from '@shared/program.json'` — one source for every number.
    alias: { '@shared': sharedDir },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: ['..'] },
  },
})
