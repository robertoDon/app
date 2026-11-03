// Sala — service worker: só avisos. Não guarda páginas em cache.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { titulo: "The Sala", corpo: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    // se a sala já está aberta e na frente, não precisa avisar
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (janelas.some((c) => c.visibilityState === "visible" && c.focused && d.url && new URL(c.url).pathname === d.url)) return;
    await self.registration.showNotification(d.titulo || "The Sala", {
      body: d.corpo || "", tag: d.tag, renotify: true, icon: "/icone-192.png", badge: "/icone-badge.png", data: { url: d.url || "/" },
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of janelas) {
      if (new URL(c.url).origin === self.location.origin) { await c.focus(); return c.navigate ? c.navigate(url) : undefined; }
    }
    return self.clients.openWindow(url);
  })());
});
