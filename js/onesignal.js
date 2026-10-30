// VERSIÓN DE DIAGNÓSTICO: muestra en pantalla qué pasa con OneSignal.
// Cuando todo funcione, se reemplaza por la versión limpia.
(function () {
  const base = location.pathname.replace(/[^/]*$/, '');

  function linea(txt, malo) {
    let d = document.getElementById('diag-onesignal');
    if (!d) {
      d = document.createElement('div');
      d.id = 'diag-onesignal';
      d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#0b3c6d;color:#fff;' +
        'font:12px/1.4 monospace;padding:8px 10px;border-radius:8px;white-space:pre-wrap;max-height:45vh;overflow:auto';
      document.body.append(d);
    }
    if (malo) d.style.background = '#a00000';
    d.textContent += txt + '\n';
  }

  window.addEventListener('error', (e) => linea('ERROR: ' + e.message, true));
  window.addEventListener('unhandledrejection', (e) => linea('ERROR: ' + (e.reason && e.reason.message || e.reason), true));

  linea('1) onesignal.js cargó');
  linea('2) App ID: ' + (typeof CONFIG !== 'undefined' && CONFIG.ONESIGNAL_APP_ID ? 'ok' : 'FALTA en config.js'), typeof CONFIG === 'undefined' || !CONFIG.ONESIGNAL_APP_ID);
  linea('3) Dirección: ' + location.origin + base);

  let sdkCargado = false;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function (OneSignal) {
    sdkCargado = true;
    linea('4) SDK de OneSignal cargó');
    try {
      await OneSignal.init({
        appId: CONFIG.ONESIGNAL_APP_ID,
        serviceWorkerPath: base.slice(1) + 'sw.js',
        serviceWorkerParam: { scope: base },
        serviceWorkerOverrideForTypical: true,
        notifyButton: { enable: true }
      });
      linea('5) init OK');
      linea('6) Permiso del navegador: ' + OneSignal.Notifications.permission);
      linea('7) Suscrito: ' + OneSignal.User.PushSubscription.optedIn);
    } catch (err) {
      linea('5) init FALLÓ: ' + (err && err.message || err), true);
    }
  });

  setTimeout(() => {
    if (!sdkCargado) linea('4) El SDK de OneSignal NO cargó (bloqueado o sin conexión)', true);
  }, 6000);

  if ('serviceWorker' in navigator) {
    setTimeout(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      linea('8) Service workers: ' + (regs.length ? regs.map((r) => r.scope.replace(location.origin, '') + ' [' + (r.active ? 'activo' : 'no activo') + ']').join(' , ') : 'ninguno'));
    }, 5000);
  }
})();
