import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'cm-tracker' to match your GitHub repository name for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/cm-tracker/',
})
