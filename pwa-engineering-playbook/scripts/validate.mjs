import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const files = walk(root)
const htmlFiles = files.filter((file) => extname(file) === '.html')

for (const file of htmlFiles) {
  const source = readFileSync(file, 'utf8')
  const relative = file.slice(root.length + 1)
  for (const required of ['<!doctype html>', '<title>', '<h1']) {
    if (!source.toLowerCase().includes(required)) errors.push(`${relative}: missing ${required}`)
  }
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1]
    if (/^(?:https?:|mailto:|#)/.test(target)) continue
    const [path] = target.split('#')
    if (!path || existsSync(resolve(dirname(file), path))) continue
    errors.push(`${relative}: missing local target ${target}`)
  }
}

const serviceWorker = readFileSync(join(root, 'sw.js'), 'utf8')
for (const match of serviceWorker.matchAll(/'\.\/([^']+)'/g)) {
  const target = match[1]
  if (!existsSync(join(root, target))) errors.push(`sw.js: missing precache target ${target}`)
}

const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'))
for (const icon of manifest.icons ?? []) {
  if (!existsSync(join(root, icon.src))) errors.push(`manifest: missing icon ${icon.src}`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Validated ${htmlFiles.length} HTML pages, local links, manifest icons, and service-worker precache targets.`)
}
