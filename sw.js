const CACHE_NAME = "sauve-pwa-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

/*
============================================================
INSTALL
============================================================
*/

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(error => {
        console.warn(
          "SAUVE cache installation failed:",
          error
        );
      })
  );

  self.skipWaiting();
});


/*
============================================================
ACTIVATE
============================================================
*/

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))

        );

      })

  );

  self.clients.claim();

});


/*
============================================================
FETCH
============================================================
*/

self.addEventListener("fetch", event => {

  /*
    Only handle normal GET requests.
  */

  if (event.request.method !== "GET") {
    return;
  }


  /*
    Do not interfere with external
    Stremio, MDBList, metadata,
    stream or media requests.

    Your existing app needs those
    requests to reach their original
    servers.
  */

  const requestURL =
    new URL(
      event.request.url
    );

  const isSameOrigin =
    requestURL.origin ===
    self.location.origin;


  /*
    For SAUVE's own files:
    network first, then cache.

    This means GitHub Pages updates
    can be picked up without leaving
    the app permanently stuck on an
    old cached version.
  */

  if (isSameOrigin) {

    event.respondWith(

      fetch(event.request)
        .then(response => {

          if (
            response &&
            response.status === 200
          ) {

            const copy =
              response.clone();

            caches.open(
              CACHE_NAME
            ).then(cache => {

              cache.put(
                event.request,
                copy
              );

            });

          }

          return response;

        })

        .catch(() => {

          return caches.match(
            event.request
          );

        })

    );

    return;

  }


  /*
    External requests are passed
    directly through.

    This is important for:
      - MDBList
      - Stremio addons
      - metadata
      - stream addons
      - poster images
      - video sources
  */

  event.respondWith(
    fetch(event.request)
  );

});
