// Swiss Trip Deutsch 오프라인 캐시
// - 페이지: 네트워크 우선, 실패하면 캐시 (기차 안 등 오프라인 대비)
// - 음성·정적 파일: 캐시 우선 (파일명이 바뀌지 않으므로)
const CACHE = "std-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const cacheFirst = url.pathname.startsWith("/audio/") || url.pathname.startsWith("/_next/static/");

  if (cacheFirst) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error())),
  );
});
