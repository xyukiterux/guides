const CACHE='tgbtc-field-8ba73199c8609d19';
const PREFIX='tgbtc-field-';
const CORE=["./", "index.html", "app.js", "i18n.js", "style.css", "economy.js", "data.js", "data.pt.js", "data.es.js", "manifest.webmanifest", "icon-192.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(u.pathname.includes('/legacy/')||u.pathname.includes('/data/'))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.type==='basic'){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;}).catch(async()=>{
  const cache=await caches.open(CACHE);const cached=await cache.match(e.request);if(cached)return cached;
  if(e.request.mode==='navigate')return cache.match('index.html');
  return new Response('Not available offline',{status:503,statusText:'Offline'});
 }));
});
