/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
// Custom service worker for better mobile Safari compatibility

const CACHE_NAME = 'darmanager-v1';
const OFFLINE_URL = '/offline.html';

// Install event
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => {
    return cache.addAll([OFFLINE_URL, '/', '/manifest.json']);
  }));
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.map(cacheName => {
      if (cacheName !== CACHE_NAME) {
        return caches.delete(cacheName);
      }
    }));
  }));
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => {
      return caches.open(CACHE_NAME).then(cache => {
        return cache.match(OFFLINE_URL);
      });
    }));
  }
});
/******/ })()
;