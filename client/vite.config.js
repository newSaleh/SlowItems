import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // مسار المشروع على GitHub Pages: https://<user>.github.io/SlowItems/
  // يبقى "/" فقط أثناء التطوير المباشر (vite dev)؛ البناء والمعاينة (preview) يطابقان مسار النشر الفعلي
  base: command === 'build' || isPreview ? '/SlowItems/' : '/',
  plugins: [react(), tailwindcss()],
}))
