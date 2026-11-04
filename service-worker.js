
"use strict";

const CACHE_NAME = "video-stream-v9";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install application shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate and remove old application caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith("video-stream-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache only same-origin GET requests
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept external requests
  if (url.origin !== self.location.origin) return;

  // Ignore browser navigation and API requests outside the app
  if (
    url.pathname.includes("/api/") ||
    url.pathname.includes("/.well-known/")
  ) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (
          response.ok &&
          response.type === "basic"
        ) {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, copy)
            )
          );
        }

        return response;
      });
    })
  );
});
