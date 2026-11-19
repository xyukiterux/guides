const C='lol-2026-11-18-415572';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','data/lol.js','data/items.js','manifest.webmanifest','icon-192.png','assets/fonts/Cinzel.ttf'])));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request)));});
