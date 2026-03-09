import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['wphubpro.code045.nl', 'wphub.pro', 'app.wphub.pro', 'dev.wphub.pro']
  },
  plugins: [
    react(),
    {
      name: 'jsx-in-js',
      async transform(code, id) {
        if (!id.includes('node_modules') && id.match(/\.js$/)) {
          return transformWithEsbuild(code, id.replace(/\.js$/, '.jsx'), {
            loader: 'jsx',
            jsx: 'automatic',
            jsxImportSource: 'react',
          })
        }
      },
    },
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
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
    sourcemap: false, // Avoid 500s: browser tries to fetch raw .tsx from prod URL, which aren't deployed
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    force: true,
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
})

