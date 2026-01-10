/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, CacheFirst, StaleWhileRevalidate, ExpirationPlugin, CacheableResponsePlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Custom caching strategies for Emerse
const photoCacheConfig: RuntimeCaching[] = [
  // Cache images from picsum.photos (development mock images)
  {
    matcher: /^https:\/\/picsum\.photos\/.*/i,
    handler: new CacheFirst({
      cacheName: "photo-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    }),
  },
  // Cache S3 bucket images (production)
  {
    matcher: /^https:\/\/.*\.s3\..*\.amazonaws\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "s3-photo-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    }),
  },
  // Cache API responses with stale-while-revalidate
  {
    matcher: /^\/api\/photos.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "api-photo-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    }),
  },
  // Cache tags API
  {
    matcher: /^\/api\/tags.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "api-tags-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...photoCacheConfig, ...defaultCache],
});

serwist.addEventListeners();
