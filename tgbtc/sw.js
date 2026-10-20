const C='tgbtc2-2026-10-19-202817-2049341';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./", "manifest.webmanifest", "icon-192.png", "index.html", "path.html", "spend.html", "calendar.html", "guildwar.html", "meta.html", "tiers.html", "tips.html", "videos.html", "handbook.html", "early-tiers.html"])));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request)));});
