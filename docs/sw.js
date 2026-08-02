// まかいの ひつじレースを オフラインでも あそべるようにする
//
// ためこむ ファイルの いちらんと なまえは precache.json に まとめてある。
// ゲームを 更新したら precache.json の "cache" の すうじを 1つ ふやすこと。
// （わすれると、ホーム画面に ついかずみの 端末で ふるいままに なる）

let cfg = null;
const config = () =>
  cfg || (cfg = fetch("./precache.json", { cache: "no-store" }).then((r) => r.json()));

// ブラウザの キャッシュに のこった ふるい ファイルを ためこむと、
// あたらしい index.html と ふるい js が まざって がめんが まっしろに なる。
// かならず ネットから とりなおす（cache:"reload"）。
function fill(box, files){
  return Promise.all(files.map((f) =>
    fetch(f, { cache: "reload" }).then((res) => (res.ok ? box.put(f, res) : null)).catch(() => null)
  ));
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    config()
      .then((c) => caches.open(c.cache).then((k) => fill(k, c.files)))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // 1つでも とれなくても ゲームは うごかす
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    config()
      .then((c) =>
        caches.keys().then((keys) =>
          Promise.all(keys.filter((k) => k !== c.cache).map((k) => caches.delete(k)))
        )
      )
      .catch(() => {})
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
            config().then((c) => caches.open(c.cache).then((k) => k.put(e.request, copy)));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
