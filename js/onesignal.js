// Inicializa OneSignal usando el App ID de js/config.js.
// La web vive en una subcarpeta de GitHub Pages; se define la ruta y el alcance del service worker.
(function () {
  const base = location.pathname.replace(/[^/]*$/, '');
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: CONFIG.ONESIGNAL_APP_ID,
      serviceWorkerPath: base.slice(1) + 'sw.js',
      serviceWorkerParam: { scope: base },
      notifyButton: { enable: true }
    });
  });
})();
