// Notificaciones con OneSignal. El App ID está en config.js.
// La web vive en una subcarpeta de GitHub Pages, así que se le indica a OneSignal dónde está sw.js.
(function () {
  const base = location.pathname.replace(/[^/]*$/, ''); // ej. /web-de-la-ruta-/
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: CONFIG.ONESIGNAL_APP_ID,
      serviceWorkerPath: base.slice(1) + 'sw.js',
      serviceWorkerParam: { scope: base },
      serviceWorkerOverrideForTypical: true, // necesario porque OneSignal está en modo "sitio típico"
      notifyButton: { enable: true } // campanita para activar o quitar avisos
    });
  });
})();