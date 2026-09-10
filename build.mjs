/**
 * Build the dsh-model-map plugin artifacts.
 *
 * - lib/index.js  — host half, self-contained ESM (schemastery is bundled in
 *   from the harness checkout's node_modules; the plugin carries no runtime
 *   dependencies of its own).
 * - lib/client.js — browser half, the loader's lazy-CJS closure factory with
 *   react externals resolved through the module table.
 *
 * The harness checkout path is resolved from DSH_REPO or the sibling default.
 */
import { build } from 'esbuild'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoNodeModules = process.env.DSH_REPO !== undefined
  ? join(process.env.DSH_REPO, 'node_modules')
  : join(here, '../deepseek-harness/node_modules')
if (!existsSync(repoNodeModules)) {
  console.error(`build: harness node_modules not found at ${repoNodeModules} (set DSH_REPO)`)
  process.exit(1)
}

const PLUGIN_ID = 'dsh-model-map'

/** The harness vendors its schemastery fork; resolve the alias to the real tree. */
const schemasteryDir = join(dirname(repoNodeModules), 'vendor/schemastery')
if (!existsSync(schemasteryDir)) {
  console.error(`build: vendored schemastery not found at ${schemasteryDir}`)
  process.exit(1)
}

await build({
  entryPoints: [join(here, 'src/index.ts')],
  outfile: join(here, 'lib/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  nodePaths: [repoNodeModules],
  alias: { '@deepseek-ai/schemastery': schemasteryDir },
  external: ['node:*'],
  sourcemap: true,
  logLevel: 'info',
})

await build({
  entryPoints: [join(here, 'src/client/index.ts')],
  outfile: join(here, 'lib/client.js'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  nodePaths: [repoNodeModules],
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/*'],
  banner: {
    js: [
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      'var module = { exports: {} }; var exports = module.exports;',
    ].join('\n'),
  },
  footer: { js: 'return module.exports; } });' },
  sourcemap: false,
  logLevel: 'info',
})

console.log('build: done')
