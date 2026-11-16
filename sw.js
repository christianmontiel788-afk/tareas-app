const CACHE='tareas-v4';
const INBOX='share-inbox';
const SHELL=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==INBOX).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function recibirCompartido(req){
  const fd=await req.formData();
  const files=fd.getAll('chat');
  const inbox=await caches.open(INBOX);
  let i=0;
  for(const f of files){
    if(!f||typeof f.text!=='function')continue;
    const body=await f.text();
    await inbox.put('share/'+Date.now()+'-'+(i++)+'.txt',new Response(body,{headers:{'Content-Type':'text/plain; charset=utf-8','X-Name':encodeURIComponent(f.name||'WhatsApp.txt')}}));
  }
  return Response.redirect('./index.html?shared=1',303);
}
self.addEventListener('fetch',e=>{
  if(e.request.method==='POST'){e.respondWith(recibirCompartido(e.request).catch(()=>Response.redirect('./index.html',303)));return}
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return res})
      .catch(()=>caches.match(e.request).then(hit=>hit||caches.match('index.html')))
  );
});
