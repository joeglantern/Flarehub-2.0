self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Flarehub', {
      body:  data.body ?? '',
      icon:  data.icon ?? '/favicon.ico',
      badge: '/favicon.ico',
      data:  { url: data.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const found = cs.find((c) => c.url.includes(url));
      if (found) return found.focus();
      return clients.openWindow(url);
    }),
  );
});
