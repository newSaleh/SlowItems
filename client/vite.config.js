import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // مسار المشروع على GitHub Pages: https://<user>.github.io/SlowItems/
  base: command === 'build' ? '/SlowItems/' : '/',
  plugins: [react(), tailwindcss()],
}))
