const CACHE_PREFIX = 'pwa-engineering-playbook-'
const CACHE_NAME = `${CACHE_PREFIX}2026-09-10-v1`
const OFFLINE_URL = './index.html'
const PRECACHE = [
  './', './index.html', './manifest.webmanifest', './assets/styles.css', './assets/site.js',
  './assets/icon-192.png', './assets/icon-512.png',
  './lessons/01-mental-model.html', './lessons/02-capability-levels.html',
  './lessons/03-data-architecture.html', './lessons/04-service-worker-updates.html',
  './lessons/05-local-storage.html', './lessons/06-offline-reads.html',
  './lessons/07-durable-sync.html', './lessons/08-files-and-auth.html',
  './lessons/09-security.html', './lessons/10-testing-and-operations.html',
  './lessons/11-plaschema-case-study.html', './reference/glossary.html',
  './reference/decision-checklists.html', './reference/state-machines.html',
  './reference/sources.html', './AGENT_GUIDE.md'
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)))
          }
          return response
        })
        .catch(async () => (await caches.match(event.request)) || caches.match(OFFLINE_URL)),
    )
    return
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
})
