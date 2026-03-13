// Agenda Pro - Service Worker for Push Notifications
const CACHE_NAME = 'agendapro-v1'

self.addEventListener('install', (event) => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim())
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus()
            }
            return clients.openWindow('/')
        })
    )
})

// Listen for messages from the main app to show notifications
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon } = event.data
        self.registration.showNotification(title, {
            body,
            icon: icon || '/logo-celular.png',
            badge: '/logo-celular.png',
            vibrate: [200, 100, 200],
            tag: 'agenda-reminder',
            renotify: true,
        })
    }
})
