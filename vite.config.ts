import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['wphubpro.code045.nl', 'wphub.pro', 'app.wphub.pro', 'dev.wphub.pro']
  },
  plugins: [
    {
      name: 'jsx-in-js',
      async transform(code, id) {
        if (!id.includes('node_modules') && id.match(/\.js$/)) {
          return transformWithEsbuild(code, id.replace(/\.js$/, '.jsx'), {
            loader: 'jsx',
            jsx: 'automatic',
          })
        }
      },
    },
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      assets: path.resolve(__dirname, './src/assets'),
      components: path.resolve(__dirname, './src/components'),
      examples: path.resolve(__dirname, './src/examples'),
      layouts: path.resolve(__dirname, './src/layouts'),
      context: path.resolve(__dirname, './src/context'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
})

