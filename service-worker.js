// ===========================================
// Service Worker للتطبيق التقدمي (PWA)
// ===========================================
const CACHE_NAME = 'todo-app-v1';

// تحديد المسار الأساسي للتطبيق
const BASE_PATH = '/todo-app-enhanced-repo/';

// الملفات التي سيتم تخزينها مؤقتاً
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'styles.css',
  BASE_PATH + 'script.js',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'offline.html',
  BASE_PATH + 'icons/icon-72x72.svg',
  BASE_PATH + 'icons/icon-96x96.svg',
  BASE_PATH + 'icons/icon-128x128.svg',
  BASE_PATH + 'icons/icon-144x144.svg',
  BASE_PATH + 'icons/icon-152x152.svg',
  BASE_PATH + 'icons/icon-192x192.svg',
  BASE_PATH + 'icons/icon-384x384.svg',
  BASE_PATH + 'icons/icon-512x512.svg',
  BASE_PATH + 'icons/add-icon.svg'
];

// ===========================================
// حدث التثبيت (Install Event)
// ===========================================
self.addEventListener('install', (event) => {
  console.log('[SW] جاري تثبيت Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] جاري تخزين الملفات مؤقتاً...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] تم تخزين جميع الملفات مؤقتاً بنجاح');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] خطأ في التخزين المؤقت:', error);
      })
  );
});

// ===========================================
// حدث التنشيط (Activate Event)
// ===========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] جاري تفعيل Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] جاري حذف الإصدار القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] تم التفعيل بنجاح');
      return self.clients.claim();
    })
  );
});

// ===========================================
// حدث الجلب (Fetch Event)
// ===========================================
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات chrome-extension والموارد الخارجية
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] جلب من الـ Cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[SW] جلب من الشبكة:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('[SW] تم تخزين:', event.request.url);
              });

            return response;
          })
          .catch(() => {
            console.log('[SW] فشل في الجلب، إرجاع صفحة الأوفلاين');
            return caches.match(BASE_PATH + 'offline.html');
          });
      })
  );
});

// ===========================================
// أحداث الرسائل (Message Event)
// ===========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});
