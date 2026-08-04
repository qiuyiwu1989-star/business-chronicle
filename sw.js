/* 商业通鉴 · Service Worker
   策略：核心资源预缓存（离线可用）；HTML 走 network-first 保证内容新鲜；
   静态资源 stale-while-revalidate。改版时只需要改 VERSION。 */
const VERSION = "bc-v23-1";
const CORE = [
  "./",
  "./index.html",
  "./style.v22.css",
  "./data.v22.js",
  "./app.v22.js",
  "./manifest.webmanifest",
  "./assets/cover.jpg",
  "./assets/cover-model.jpg",
  "./assets/cover-america.jpg",
  "./assets/cover-mgmt100.jpg",
  "./assets/cover-newbiz.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 字体等三方资源不拦

  const isDoc = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";

  if (isDoc) {
    // network-first：有网always拿最新，断网回落缓存
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // 其它资源：stale-while-revalidate
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
