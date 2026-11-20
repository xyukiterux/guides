const C='ds3-2026-11-19-f2aae1c399';
const PRE=["./", "index.html", "data/core.js", "manifest.webmanifest", "icon-192.png", "fonts/cinzel.woff2", "fonts/garamond.woff2", "data/weapons.js", "data/armor.js", "data/rings.js", "data/spells.js", "data/items.js"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(PRE)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request)));});
