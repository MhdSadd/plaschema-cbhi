const root = new URL('../', import.meta.url)

document.querySelectorAll('[data-quiz]').forEach((quiz) => {
  const button = quiz.querySelector('button')
  button?.addEventListener('click', () => {
    const open = quiz.classList.toggle('open')
    button.setAttribute('aria-expanded', String(open))
    button.textContent = open ? 'Hide answer' : 'Check answer'
  })
})

const toast = document.querySelector('[data-update-toast]')
const updateButton = toast?.querySelector('button')
let waitingWorker

function showUpdate(worker) {
  waitingWorker = worker
  toast?.removeAttribute('hidden')
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    location.reload()
  })

  navigator.serviceWorker.register(new URL('sw.js', root), { updateViaCache: 'none' })
    .then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker)
        })
      })
      window.setInterval(() => registration.update(), 60 * 60 * 1000)
    })
    .catch(() => { /* The handbook still works as a normal static site. */ })
}

updateButton?.addEventListener('click', () => waitingWorker?.postMessage({ type: 'SKIP_WAITING' }))
