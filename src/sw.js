const CACHE_NAME = 'actoffline-v3'

// Кэшируем основные файлы при установке
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/sw.js'
      ])
    })
  )
})

// Активация и очистка старого кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache)
          }
        })
      )
    })
  )
})

// Перехватываем запросы
self.addEventListener('fetch', (event) => {
  // Запросы к бэкенду (API) не кэшируем
  if (event.request.url.includes(':3000')) {
    return
  }

  // Для остальных файлов сначала ищем в кэше, если нет — качаем из сети
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Если нет сети и нет в кэше, возвращаем index.html для SPA
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
      })
    })
  )
})