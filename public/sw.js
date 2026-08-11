self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Life OS Reminder 🔔', body: event.data.text() };
  }

  const title = data.title || 'Life OS Reminder 🔔';
  const options = {
    body: data.body || 'Waktunya produktif hari ini!',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'lifeos-push-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    renotify: true,
    timestamp: data.timestamp || Date.now(),
    data: {
      url: data.url || '/dashboard',
      habitId: data.habitId || null,
    },
  };

  if (Array.isArray(data.actions) && data.actions.length > 0) {
    options.actions = data.actions;
  }

  event.waitUntil(
    self.registration.showNotification(title, options).catch(function (err) {
      console.warn('Failed to show notification with full options, retrying simple fallback notification:', err);
      return self.registration.showNotification(title, {
        body: options.body,
        tag: options.tag,
        data: options.data,
      });
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
