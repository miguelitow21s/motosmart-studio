const CACHE_VERSION = "v2"
const STATIC_CACHE = `motosmart-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `motosmart-dynamic-${CACHE_VERSION}`

const STATIC_ASSETS = [
  "/login",
  "/manifest.json",
  "/offline.html",
]

// ── Install ───────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: "reload" })))
        .catch(() => {})
    ).then(() => self.skipWaiting())
  )
})

// ── Activate ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip: non-GET, cross-origin, Supabase API, hot reload, realtime
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.includes("/realtime/")
  ) {
    return
  }

  // Next.js static chunks → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Navigation → network-first, solo cachea respuestas 200
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached ?? caches.match("/offline.html") ?? Response.error()
          )
        )
    )
    return
  }

  // Resto → network-first con fallback a cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then((r) => r ?? Response.error()))
  )
})
