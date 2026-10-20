// Only public app-shell resources are cached. No API responses, exports or financial data.
const CACHE='duewise-shell-v2';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/icon.svg','/manifest.webmanifest','/offline.html','/offline.css']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.method!=='GET'||url.pathname.startsWith('/api/')||url.pathname.startsWith('/health'))return;
 if(event.request.mode==='navigate') {event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));return;}
 if(url.pathname.startsWith('/assets/')||['/icon.svg','/manifest.webmanifest','/offline.css'].includes(url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;})));
});
