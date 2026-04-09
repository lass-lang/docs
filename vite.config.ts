import { defineConfig } from 'vite'
import lass from '@lass-lang/vite-plugin-lass'
import { mdPages } from './plugins/vite-plugin-md-pages'

export default defineConfig(async () => ({
  plugins: [
    lass(),
    await mdPages({ template: './template.html' }),
  ],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: 'index.html',
    },
  },
}))
