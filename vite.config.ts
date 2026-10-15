import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// One id per build. The app compares it with /version.json to know a new version is live,
// and the service worker gets it in its cache name so the phone sees the worker changed.
const BUILD_ID = Date.now().toString(36)

function stampBuild(): Plugin {
  let outDir = 'dist'
  return {
    name: 'avigi-stamp-build',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      writeFileSync(resolve(outDir, 'version.json'), JSON.stringify({ build: BUILD_ID }))
      const sw = resolve(outDir, 'sw.js')
      if (existsSync(sw)) {
        const src = readFileSync(sw, 'utf8').replace(/const CACHE_NAME = '[^']*';/, `const CACHE_NAME = 'avigi-${BUILD_ID}';`)
        writeFileSync(sw, src)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    tailwindcss(),
    stampBuild(),
  ],
})
