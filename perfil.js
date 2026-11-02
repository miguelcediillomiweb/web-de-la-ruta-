/**
 * Perfil del alumno · Escuela Primaria Rafael Ramírez
 * Avatar de caricatura creado en el teléfono del padre. Ruta: js/perfil.js
 * - La foto original NUNCA se guarda ni se envía: se convierte en dibujo en el
 *   propio teléfono y se borra al instante.
 * - Solo se conserva la caricatura, en este dispositivo (localStorage).
 */
(function(){
  'use strict';

  var TAM = 256;
  var K_AV = 'ra_avatar_', K_MODO = 'ra_modo_';
  var ctxA = null, modal = null, stream = null, facing = 'user', audio = null, tmrs = [];

  function $(s){ return document.querySelector(s); }
  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function leer(k){ try{ return localStorage.getItem(k) || ''; }catch(e){ return ''; } }
  function guardar(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } }
  function borrar(k){ try{ localStorage.removeItem(k); }catch(e){} }
  function later(fn, ms){ var t = setTimeout(fn, ms); tmrs.push(t); return t; }
  function limpiarTimers(){ tmrs.forEach(clearTimeout); tmrs = []; }

  /* ---------- Navegadores incrustados (WhatsApp, Facebook...) ---------- */
  var UA = navigator.userAgent || '';
  var enApp = /FBAN|FBAV|Instagram|Messenger|MicroMessenger|Snapchat|TikTok|; wv\)|WhatsApp/i.test(UA);
  var esAndroid = /Android/i.test(UA);

  function avisoNavegador(){
    if (!enApp) return;
    var cerrado = false;
    try{ cerrado = sessionStorage.getItem('ra_nav_aviso') === '1'; }catch(e){}
    if (cerrado) return;
    var d = document.createElement('div');
    d.className = 'nav-aviso';
    var intent = 'intent://' + location.host + location.pathname + location.search +
      '#Intent;scheme=https;package=com.android.chrome;end';
    d.innerHTML = '<span>📸🔔 Para que funcionen la cámara y las notificaciones, abre esta página en <b>Chrome</b> o <b>Safari</b>.' +
      (esAndroid ? '' : ' Toca el icono de compartir y elige «Abrir en Safari».') + '</span>' +
      (esAndroid ? '<a class="btn-dorado" href="' + esc(intent) + '">Abrir en Chrome</a>' : '') +
      '<button type="button" class="btn-dorado" data-a="copiar">Copiar enlace</button>' +
      '<button type="button" class="btn-salir" data-a="x" aria-label="Cerrar aviso">✖</button>';
    d.addEventListener('click', function(ev){
      var b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'x'){ d.remove(); try{ sessionStorage.setItem('ra_nav_aviso', '1'); }catch(e){} }
      if (b.dataset.a === 'copiar'){
        try{ navigator.clipboard.writeText(location.href); b.textContent = '¡Copiado!'; }catch(e){ b.textContent = 'Copia desde la barra'; }
      }
    });
    document.body.insertBefore(d, document.body.firstChild);
  }

  /* ---------- Sonidos (sin archivos, con Web Audio) ---------- */
  function ac(){
    try{
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      if (!audio) audio = new A();
      if (audio.state === 'suspended') audio.resume();
      return audio;
    }catch(e){ return null; }
  }
  function ruido(t0, dur, freq, vol){
    var a = ac(); if (!a) return;
    var n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var s = a.createBufferSource(); s.buffer = buf;
    var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9;
    var g = a.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(a.destination); s.start(t0);
  }
  function obturador(){ var a = ac(); if (!a) return; var t = a.currentTime; ruido(t, 0.05, 2600, 0.9); ruido(t + 0.07, 0.07, 1500, 0.8); }
  function pitido(freq){
    var a = ac(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.14);
  }
  function motor(){
    var a = ac(); if (!a) return;
    var t = a.currentTime, o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(95, t + 1.8);
    f.type = 'lowpass'; f.frequency.value = 500;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 2);
  }

  /* ---------- Caricatura (todo ocurre en el teléfono) ---------- */
  function desenfocar(d, W, r){
    var tmp = new Uint8ClampedArray(d.length), x, y, c, k, sum, cnt, p;
    for (y = 0; y < W; y++) for (c = 0; c < 3; c++) for (x = 0; x < W; x++){
      sum = 0; cnt = 0;
      for (k = -r; k <= r; k++){ p = x + k; if (p >= 0 && p < W){ sum += d[(y * W + p) * 4 + c]; cnt++; } }
      tmp[(y * W + x) * 4 + c] = sum / cnt;
    }
    for (x = 0; x < W; x++) for (c = 0; c < 3; c++) for (y = 0; y < W; y++){
      sum = 0; cnt = 0;
      for (k = -r; k <= r; k++){ p = y + k; if (p >= 0 && p < W){ sum += tmp[(p * W + x) * 4 + c]; cnt++; } }
      d[(y * W + x) * 4 + c] = sum / cnt;
    }
  }
  function caricaturizar(d, W){
    var N = W * W, L = new Float32Array(N), borde = new Uint8Array(N), i, x, y, c;
    desenfocar(d, W, 2); desenfocar(d, W, 2);
    for (i = 0; i < N; i++) L[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    for (y = 1; y < W - 1; y++) for (x = 1; x < W - 1; x++){
      i = y * W + x;
      var gx = -L[i - W - 1] - 2 * L[i - 1] - L[i + W - 1] + L[i - W + 1] + 2 * L[i + 1] + L[i + W + 1];
      var gy = -L[i - W - 1] - 2 * L[i - W] - L[i - W + 1] + L[i + W - 1] + 2 * L[i + W] + L[i + W + 1];
      if (Math.sqrt(gx * gx + gy * gy) > 60) borde[i] = 1;
    }
    var niveles = 5, paso = 255 / (niveles - 1);
    for (i = 0; i < N; i++){
      var o = i * 4;
      if (borde[i]){ d[o] = 30; d[o + 1] = 30; d[o + 2] = 52; d[o + 3] = 255; continue; }
      var gris = L[i];
      for (c = 0; c < 3; c++){
        var v = d[o + c];
        v = gris + (v - gris) * 1.45;
        v = (v - 128) * 1.12 + 128 + 6;
        v = v < 0 ? 0 : v > 255 ? 255 : v;
        d[o + c] = Math.round(v / paso) * paso;
      }
      d[o + 3] = 255;
    }
  }
  function capturar(video){
    var vw = video.videoWidth, vh = video.videoHeight, s = Math.min(vw, vh);
    var c = document.createElement('canvas'); c.width = c.height = TAM;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, TAM, TAM);
    var im = x.getImageData(0, 0, TAM, TAM);
    caricaturizar(im.data, TAM);
    x.putImageData(im, 0, 0);
    var url = c.toDataURL('image/jpeg', 0.85);
    c.width = c.height = 0;               // se borra la foto original de la memoria
    return url;
  }

  /* ---------- Ventana ---------- */
  function abrirModal(){
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'perfilModal';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="pf-card" id="pfCard"></div><div class="pf-flash" id="pfFlash"></div>';
    modal.addEventListener('click', clic);
    document.body.appendChild(modal);
    document.documentElement.classList.add('bloqueado');
  }
  function cerrar(){
    detener(); limpiarTimers();
    if (modal){ modal.remove(); modal = null; }
    document.documentElement.classList.remove('bloqueado');
  }
  function detener(){
    if (stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
    var v = $('#pfVideo'); if (v) v.srcObject = null;
  }
  function pintar(html){ abrirModal(); $('#pfCard').innerHTML = '<button type="button" class="pf-x" data-a="cerrar" aria-label="Cerrar">✖</button>' + html; }

  function pantallaConsentimiento(){
    if (!ctxA) return;
    var aviso = enApp ? '<div class="pf-aviso">⚠️ Estás en un navegador incrustado. Si la cámara no abre, usa <b>Chrome</b> o <b>Safari</b>.</div>' : '';
    pintar(
      '<div class="pf-emoji emo">📸</div>' +
      '<h2>¡Creemos el avatar de ' + esc(ctxA.nombre) + '!</h2>' +
      '<p>Para ofrecer una mejor experiencia, y <b>solo si usted, como madre, padre o tutor, lo autoriza</b>, tomaremos una foto de su hijo(a) con la cámara de su teléfono y la convertiremos en un avatar de caricatura.</p>' +
      '<ul class="pf-lista"><li>🔒 La foto original <b>no se guarda ni se envía</b>: se convierte en dibujo en este teléfono y se borra al instante.</li>' +
      '<li>🖼️ Solo se conserva la caricatura, en este dispositivo.</li>' +
      '<li>🙂 Si prefiere no hacerlo, usaremos una imagen genérica.</li></ul>' + aviso +
      '<button type="button" class="pf-btn si" data-a="si">📸 Sí, autorizo tomar la foto</button>' +
      '<button type="button" class="pf-btn no" data-a="no">No, usar imagen genérica</button>'
    );
  }
  function pantallaGestion(){
    pintar(
      '<div class="pf-emoji emo">🖼️</div><h2>Avatar de ' + esc(ctxA.nombre) + '</h2>' +
      '<p>¿Qué desea hacer?</p>' +
      '<button type="button" class="pf-btn si" data-a="si">📸 Crear un avatar nuevo</button>' +
      '<button type="button" class="pf-btn no" data-a="quitar">🗑️ Quitar el avatar y usar la imagen genérica</button>'
    );
  }
  function pantallaCamara(){
    pintar(
      '<h2>¡Sonríe! 😄</h2><p>Coloca al niño o niña en el cuadro y toca el botón.</p>' +
      '<div class="visor-foto"><video id="pfVideo" playsinline muted autoplay></video><div id="pfCuenta"></div></div>' +
      '<p class="pf-msg" id="pfMsg"></p>' +
      '<div class="pf-controles"><button type="button" class="disparo" id="pfDisparo" data-a="disparo" aria-label="Tomar foto"></button></div>' +
      '<button type="button" class="pf-link" data-a="voltear">🔄 Cambiar cámara</button>'
    );
    iniciarCamara();
  }
  function errorCamara(txt){
    var m = $('#pfMsg'); if (!m) return;
    m.innerHTML = esc(txt) + '<br><button type="button" class="pf-link" data-a="reintentar">🔁 Reintentar</button>' +
      ' · <button type="button" class="pf-link" data-a="no">Usar imagen genérica</button>';
  }
  function iniciarCamara(){
    detener();
    var v = $('#pfVideo');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      errorCamara('Este navegador no permite usar la cámara. Abre la página en Chrome o Safari.'); return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 960 }, height: { ideal: 960 } }, audio: false })
      .then(function(s){
        if (!modal){ s.getTracks().forEach(function(t){ t.stop(); }); return; }
        stream = s; v.srcObject = s;
        v.classList.toggle('espejo', facing === 'user');
        var p = v.play(); if (p && p.catch) p.catch(function(){});
      })
      .catch(function(e){
        var n = e && e.name;
        if (n === 'NotFoundError' || n === 'OverconstrainedError')
          errorCamara('No encontramos una cámara en este dispositivo.');
        else if (n === 'NotReadableError')
          errorCamara('La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo.');
        else
          errorCamara('El teléfono no dejó abrir la cámara. Si aparece el aviso «superposición de pantalla», cierra las burbujas o ventanas flotantes (Messenger, WhatsApp, filtro de luz azul), toca Reintentar y elige «Permitir».');
      });
  }
  function disparar(){
    var v = $('#pfVideo'), b = $('#pfDisparo');
    if (!stream || !v || !v.videoWidth || !b || b.disabled) return;
    b.disabled = true;
    var n = 3, c = $('#pfCuenta');
    (function paso(){
      if (n > 0){
        c.textContent = n; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
        pitido(660); n--; later(paso, 850);
      } else { c.textContent = ''; foto(); }
    })();
  }
  function foto(){
    var v = $('#pfVideo'), url, f = $('#pfFlash');
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    obturador();
    try{ if (navigator.vibrate) navigator.vibrate(40); }catch(e){}
    try{ url = capturar(v); }catch(e){ errorCamara('No se pudo tomar la foto. Intenta de nuevo.'); var b = $('#pfDisparo'); if (b) b.disabled = false; return; }
    detener();
    later(function(){ pantallaResultado(url); }, 450);
  }
  function escribir(el, txt){
    var i = 0;
    (function t(){ if (!el.isConnected) return; el.textContent = txt.slice(0, ++i); if (i < txt.length) later(t, 70); })();
  }
  function pantallaResultado(url){
    pintar(
      '<h2>¡Tu avatar! 🎉</h2>' +
      '<div class="cam"><div class="tarjeta-foto" id="pfTarjeta"><div class="foto-box"><img id="pfImg" src="' + url + '" alt="Avatar de caricatura"></div><div class="nombre-foto" id="pfNombre"></div></div>' +
      '<svg class="cam-cuerpo" viewBox="0 0 280 150" aria-hidden="true">' +
      '<rect x="0" y="0" width="280" height="150" rx="26" fill="#6EA6E6"/><rect x="0" y="0" width="280" height="150" rx="26" fill="none" stroke="#4F86C6" stroke-width="3"/>' +
      '<rect x="62" y="6" width="156" height="12" rx="6" fill="#2E4A7A"/>' +
      '<rect x="24" y="36" width="40" height="28" rx="6" fill="#FFF6D6" stroke="#E8D9AE" stroke-width="2"/>' +
      '<circle cx="236" cy="40" r="10" fill="#F3E6CF" stroke="#E8D9AE" stroke-width="2"/>' +
      '<circle cx="140" cy="88" r="46" fill="#F3E6CF"/><circle cx="140" cy="88" r="36" fill="#2B3A55"/><circle cx="140" cy="88" r="24" fill="#0E1626"/>' +
      '<circle cx="130" cy="78" r="6" fill="#fff" opacity=".85"/><circle cx="152" cy="100" r="3" fill="#fff" opacity=".5"/>' +
      '<path d="M226 112c-6-8-16-2-9 7l9 9 9-9c7-9-3-15-9-7z" fill="#4F86C6"/></svg></div>' +
      '<div class="pf-final" id="pfFinal" hidden>' +
      '<button type="button" class="pf-btn si" data-a="usar">✅ Usar este avatar</button>' +
      '<button type="button" class="pf-btn no" data-a="repetir">🔄 Repetir la foto</button></div>'
    );
    modal._url = url;
    later(function(){ motor(); $('#pfTarjeta').classList.add('imprime'); }, 250);
    later(function(){ $('#pfTarjeta').classList.add('revelada'); }, 1500);
    later(function(){ escribir($('#pfNombre'), ctxA.nombre); }, 3000);
    later(function(){ var f = $('#pfFinal'); if (f) f.hidden = false; }, 3600);
  }
  function usar(){
    var url = modal && modal._url; if (!url) return;
    guardar(K_AV + ctxA.id, url); guardar(K_MODO + ctxA.id, 'foto');
    var cb = ctxA.cb; cerrar(); if (cb) cb(url);
    var av = document.getElementById('avatarAlumno');
    if (av){ av.classList.remove('nuevo'); void av.offsetWidth; av.classList.add('nuevo'); }
  }
  function generico(){
    borrar(K_AV + ctxA.id); guardar(K_MODO + ctxA.id, 'generico');
    var cb = ctxA.cb; cerrar(); if (cb) cb('');
  }
  function clic(ev){
    var b = ev.target.closest('[data-a]'); if (!b || !ctxA) return;
    var a = b.dataset.a;
    if (a === 'cerrar') cerrar();
    else if (a === 'si'){ ac(); pantallaCamara(); }
    else if (a === 'no' || a === 'quitar') generico();
    else if (a === 'disparo') disparar();
    else if (a === 'voltear'){ facing = facing === 'user' ? 'environment' : 'user'; iniciarCamara(); }
    else if (a === 'repetir') pantallaCamara();
    else if (a === 'reintentar'){ var m = $('#pfMsg'); if (m) m.textContent = ''; iniciarCamara(); }
    else if (a === 'usar') usar();
  }

  /* ---------- API pública ---------- */
  window.Perfil = {
    obtener: function(id){ return leer(K_AV + id); },
    iniciar: function(id, nombre, cb){
      ctxA = { id: id, nombre: nombre, cb: cb };
      if (!leer(K_MODO + id)) later(pantallaConsentimiento, 700);   // solo la primera vez
    },
    reabrir: function(){
      if (!ctxA) return;
      if (leer(K_AV + ctxA.id)) pantallaGestion(); else pantallaConsentimiento();
    }
  };
  var btn = document.getElementById('btnAvatar');
  if (btn) btn.addEventListener('click', function(){ window.Perfil.reabrir(); });
  avisoNavegador();

  if (typeof module !== 'undefined') module.exports = { caricaturizar: caricaturizar };
})();
