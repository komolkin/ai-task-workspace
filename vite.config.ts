import { rmSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import pkg from './package.json'

// frame-ancestors is ignored when delivered via <meta> (header-only); omit it here
const CSP_META =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'"

function cspPlugin() {
  return {
    name: 'csp-meta-production',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP_META}" />`
        )
      },
    },
  }
}

export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    resolve: {
      alias: { '@': path.join(__dirname, 'src/renderer') },
    },
    root: '.',
    publicDir: 'public',
    plugins: [
      react(),
      command === 'build' ? cspPlugin() : null,
      electron({
        main: {
          entry: 'src/main/index.ts',
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log('[startup] Electron App')
            } else {
              args.startup()
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: Object.keys(pkg.dependencies || {}),
              },
            },
          },
        },
        preload: {
          input: 'src/preload/index.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined,
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys(pkg.dependencies || {}),
              },
            },
          },
        },
        renderer: {},
      }),
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: process.env.VSCODE_DEBUG
      ? { host: '127.0.0.1', port: 5173 }
      : undefined,
    clearScreen: false,
  }
})
