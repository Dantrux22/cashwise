// CashWise Service Worker
// Cache version is injected by build.py at build time — never edit 20260402054649 manually.
const CACHE_VERSION = '20260402054649';
const APP_CACHE    = 'cw-app-'    + CACHE_VERSION; // network-first (HTML/JS/CSS)
const ASSET_CACHE  = 'cw-assets-' + CACHE_VERSION; // cache-first (icons, fonts)

// ── Requests that must NEVER be cached ─────────────────────────────────────
function shouldSkipCache(url) {
  return (
    url.includes('firestore.googleapis.com')  ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('firebaseapp.com')            ||
    url.includes('gstatic.com/firebasejs')     ||
    url.includes('cdn.jsdelivr.net')           ||  // xlsx lib — always fresh
    url.includes('firebase')                   ||
    url.includes('googleapis.com')
  );
}

// ── Cache-first: versioned static assets ───────────────────────────────────
function isStaticAsset(url) {
  return (
    /\.(png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|otf)(\?.*)?$/.test(url) ||
    url.includes('fonts.gstatic.com')
  );
}

// ── Install: pre-cache app shell ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll([
        './',
        './index.html',
        './manifest.json',
      ]))
      // Skip waiting immediately so this SW activates without needing a tab close
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge all old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== APP_CACHE && k !== ASSET_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      ))
      // Claim all open tabs so the new SW controls them immediately
      .then(() => self.clients.claim())
  );
});

// ── Message: allow page to trigger skipWaiting ─────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: routing strategy ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Never intercept Firebase / Firestore / CDN requests
  if (shouldSkipCache(url)) return;

  // Cache-first for icons and fonts
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Network-first for app shell (HTML, JS, CSS) — never serve stale code
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(APP_CACHE).then(cache => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(request).then(cached => cached || caches.match('./index.html'));
      })
  );
});
