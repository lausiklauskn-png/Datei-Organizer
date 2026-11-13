// Offline-Vorrat des Datei-Organizers: nur die App selbst, nie Nutzerdateien.
// Neue Fassung = neue Nummer; alte Vorräte werden beim Aktivieren entfernt.
const VORRAT = "datei-organizer-v5";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VORRAT).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./favicon.svg", "./icon-192.png", "./icon-512.png", "./datenschutz.html"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n.startsWith("datei-organizer-v") && n !== VORRAT).map((n) => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || !u.pathname.startsWith(new URL("./", self.registration.scope).pathname)) return;
  if (u.pathname.endsWith("/version.json")) return; // Update-Fähnchen fragt immer das Netz, nie den Vorrat
  // Seite: erst Netz (neue Fassung), sonst Vorrat. Gebaute Dateien (Name mit Prüfsumme): erst Vorrat.
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((r) => { const k = r.clone(); caches.open(VORRAT).then((c) => c.put("./index.html", k)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then((t) => t || fetch(e.request).then((r) => { if (r.ok && u.pathname.includes("/assets/")) { const k = r.clone(); caches.open(VORRAT).then((c) => c.put(e.request, k)); } return r; })));
});
