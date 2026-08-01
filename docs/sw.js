// まかいの ひつじレースを オフラインでも あそべるようにする
// ファイルを更新したら CACHE の数字を 1つ ふやす
const CACHE = "makaino-sheep-v4";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./js/main.js",
  "./js/data.js",
  "./js/save.js",
  "./js/sheep.js",
  "./js/ui.js",
  "./js/farm.js",
  "./js/race.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// まず キャッシュを返して すぐ遊べるようにし、うしろで あたらしいものを とってくる
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
