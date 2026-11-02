/**
 * Escuela Primaria Rafael Ramírez (CCT 15DPR082X)
 * Integración: Google Apps Script, Google Drive y OneSignal
 * Ruta: js/escuela.js
 */

const API = 'https://script.google.com/macros/s/AKfycbyizN5oq0LMc4uCabXVayS_6JsNM1HuWgWIZzwh_mlpHCu0oidYimuj1K4-eHc4Fcmz/exec';
const $ = s => document.querySelector(s);

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const CICLO = [
  {n:'Octubre 2026',k:'octubre',e:'🍂'},
  {n:'Noviembre 2026',k:'noviembre',e:'🍁'},
  {n:'Diciembre 2026',k:'diciembre',e:'🎄'},
  {n:'Enero 2027',k:'enero',e:'⛄'},
  {n:'Febrero 2027',k:'febrero',e:'💌'},
  {n:'Marzo 2027',k:'marzo',e:'🌸'},
  {n:'Abril 2027',k:'abril',e:'🌱'},
  {n:'Mayo 2027',k:'mayo',e:'🌷'},
  {n:'Junio 2027',k:'junio',e:'☀️'},
  {n:'Julio 2027',k:'julio',e:'🏖️'}
];

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function seguro(u){ return /^https:\/\//i.test(u || '') ? u : '#'; }
function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function folderId(u){
  const m = String(u || '').match(/drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?folders\/|folderview\?id=|open\?id=)([\w-]+)/);
  return m ? m[1] : '';
}
function driveId(u){
  const m = String(u || '').match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  return m ? m[1] : null;
}

/* Avatares del alumno */
const NINAS = ('maria ana sofia valentina camila isabella isabel ximena regina fernanda daniela victoria andrea paola mariana renata natalia jimena diana karla carla abigail alexa ariana ashley brenda citlali dulce emily evelyn fatima frida guadalupe itzel jennifer julia karen kimberly lucia luna melany mia michelle miranda nicole paulina romina samantha sara sarah vanessa yaretzi zoe aranza naomi scarlett monserrat montserrat lizbeth leslie jazmin ivanna ines gabriela estefania elizabeth dana cristina claudia angela alejandra aylin ailyn keila nayeli perla rosa lupita kenia britany brithany atziri luz marisol yoselin yesenia viridiana tania teresa sandra patricia olivia noemi nancy mayte lilian liliana laura lesly jessica jazmine ingrid helena giselle fabiola esmeralda erika elena dayana danna cynthia constanza celeste catalina bianca berenice ariadna arely angelica amairani alma alicia aline alison adriana').split(' ');
const NINOS = ('juan jose luis carlos miguel angel diego daniel david jesus santiago mateo sebastian emiliano leonardo alejandro fernando gael ian iker jorge javier kevin axel adrian bruno christian cristian dylan eduardo erick erik ethan ivan joaquin jonathan julian liam lucas manuel marco mario mauricio max nicolas oscar pablo pedro rafael ricardo roberto rodrigo samuel tadeo thiago victor yahir yael uriel aaron abraham alan alexis andres antonio armando brandon cesar damian dario edgar elias enrique francisco gerardo gustavo hugo isaac jaime jair josue kenneth lorenzo marcos martin matias noe omar orlando raul ruben saul sergio valentino vicente benjamin bryan carlo emmanuel esteban felipe gabriel gonzalo guillermo ismael jacobo jeremy johan leandro lionel marcelo maximiliano moises nestor patricio ramon santino tomas ulises wilson zaid').split(' ');

function generoDe(d){
  const g = norm(d.sexo || d.genero || d.sex || '');
  if (g){
    if (/^(f|nina|mujer)/.test(g)) return 'f';
    if (/^(m|h|nino|hombre)/.test(g)) return 'm';
  }
  const toks = norm(d.nombre).split(/\s+/);
  for (const t of toks){
    if (NINAS.indexOf(t) > -1) return 'f';
    if (NINOS.indexOf(t) > -1) return 'm';
  }
  return '';
}
const OJOS = '<ellipse class="ojo" cx="51" cy="57" rx="3" ry="3.4" fill="#2B2B2B"/><ellipse class="ojo" cx="69" cy="57" rx="3" ry="3.4" fill="#2B2B2B"/>';
const CARA = OJOS + '<path d="M51 67q9 9 18 0" stroke="#B5533C" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="44" cy="64" r="4" fill="#F4A6A0" opacity=".65"/><circle cx="76" cy="64" r="4" fill="#F4A6A0" opacity=".65"/>';
const SVG_NINO = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="60" fill="#DCEBFF"/><path d="M26 120c0-24 15-36 34-36s34 12 34 36z" fill="#1F4591"/><rect x="50" y="74" width="20" height="14" rx="6" fill="#F2C29B"/><circle cx="60" cy="54" r="24" fill="#F7CFAA"/><path d="M35 54c-2-20 11-30 25-30s27 10 25 30c-5-9-14-13-25-13s-20 4-25 13z" fill="#3B2A1E"/>' + CARA + '</svg>';
const SVG_NINA = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="60" fill="#FFE4EE"/><circle cx="32" cy="66" r="10" fill="#5A3420"/><circle cx="88" cy="66" r="10" fill="#5A3420"/><path d="M26 120c0-24 15-36 34-36s34 12 34 36z" fill="#D9577F"/><rect x="50" y="74" width="20" height="14" rx="6" fill="#F2C29B"/><circle cx="60" cy="54" r="24" fill="#F7CFAA"/><path d="M34 56c-3-22 11-33 26-33s29 11 26 33c-3-9-8-15-14-17-8 6-22 6-30 2-4 3-6 8-8 15z" fill="#5A3420"/><circle cx="36" cy="44" r="5" fill="#F3C442"/><circle cx="84" cy="44" r="5" fill="#F3C442"/>' + CARA + '</svg>';
function avatar(d){
  const g = generoDe(d);
  return g === 'f' ? SVG_NINA : g === 'm' ? SVG_NINO : '<span class="grande emo">🧒</span>';
}

/* Reloj y saludo */
let ultSaludo = '';
function reloj(){
  const n = new Date(), h = n.getHours();
  let e, t;
  if (h >= 6 && h < 12){ e = '☀️'; t = '¡Buenos días!'; }
  else if (h >= 12 && h < 19){ e = '🌤️'; t = '¡Buenas tardes!'; }
  else { e = '🌙'; t = '¡Buenas noches!'; }

  if (t !== ultSaludo){
    ultSaludo = t;
    const sEmo = $('#saludoEmo'), sTxt = $('#saludoTxt');
    if (sEmo) sEmo.textContent = e;
    if (sTxt) sTxt.textContent = t;
  }
  const fTxt = $('#fechaTexto'), hTxt = $('#horaTexto');
  if (fTxt) fTxt.textContent = DIAS[n.getDay()] + ', ' + n.getDate() + ' de ' + MESES[n.getMonth()] + ' de ' + n.getFullYear();
  if (hTxt) hTxt.textContent = n.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
}
reloj();
setInterval(reloj, 1000);

/* Máscara de fecha DD/MM/AAAA */
function mascara(inp){
  if (!inp) return;
  inp.addEventListener('input', () => {
    const d = inp.value.replace(/\D/g, '').slice(0, 8);
    inp.value = d.length > 4 ? d.slice(0,2) + '/' + d.slice(2,4) + '/' + d.slice(4)
              : d.length > 2 ? d.slice(0,2) + '/' + d.slice(2) : d;
  });
}
mascara($('#fecha2'));
mascara($('#waFecha'));

/* Llamadas al Apps Script */
async function llamar(params){
  const r = await fetch(API + '?' + new URLSearchParams(params));
  return r.json();
}

/* Datos públicos */
async function cargar(){
  try{
    const d = await llamar({action:'publico'});
    if (!d.ok) throw new Error();

    const avisosEl = $('#avisosLista');
    if (avisosEl){
      avisosEl.innerHTML = d.avisos && d.avisos.length ? d.avisos.map(a =>
        '<div class="gis' + (a.importante ? ' imp' : '') + '"><h3>' +
        (a.importante ? '★ ' : '') + esc(a.titulo) + '</h3>' +
        '<div class="meta">' + esc(a.fecha) + '</div>' +
        '<p>' + esc(a.mensaje) + '</p></div>'
      ).join('') : '<p class="gis">No hay avisos pendientes en el pizarrón por ahora.</p>';
    }

    const calEl = $('#calLista');
    if (calEl){
      calEl.innerHTML = d.calendario && d.calendario.length ? d.calendario.map(c =>
        '<div class="item-evento"><div class="ico">' + esc(c.icono || '📅') + '</div><div>' +
        '<h3>' + esc(c.evento) + '</h3>' +
        '<div class="meta">' + esc(c.fecha) + '</div>' +
        (c.descripcion ? '<p>' + esc(c.descripcion) + '</p>' : '') +
        '</div></div>'
      ).join('') : '<p style="color:var(--slate-500);font-size:0.9rem;">No hay actividades próximas agendadas.</p>';
    }

    const destEl = $('#destLista');
    if (destEl){
      const dest = d.destacados || [];
      destEl.innerHTML = dest.length ? dest.map(x => {
        const id = driveId(x.enlace);
        const fId = folderId(x.enlace);
        const media = id
          ? '<div style="position:relative;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;margin-bottom:8px;"><iframe loading="lazy" allowfullscreen src="https://drive.google.com/file/d/' + encodeURIComponent(id) + '/preview" style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe></div>'
          : '';
        const link = fId
          ? '<button type="button" class="btn-dorado ver-carpeta" data-folder="' + esc(fId) + '" data-titulo="' + esc(x.titulo || 'Destacado') + '" data-url="' + esc(seguro(x.enlace)) + '">Ver carpeta ➜</button>'
          : ((!id && x.enlace) ? '<a class="btn-dorado" target="_blank" rel="noopener" href="' + esc(seguro(x.enlace)) + '">Ver en Drive ↗</a>' : '');
        return '<div style="background:#fff;border:1px solid var(--slate-200);border-radius:12px;padding:12px;margin-bottom:12px;">' +
          media + '<h3 style="margin:4px 0;color:var(--navy);font-size:1rem;">' + esc(x.titulo || 'Destacado del mes') + '</h3>' +
          (x.descripcion ? '<p style="margin:4px 0 8px;font-size:0.85rem;color:var(--slate-700);">' + esc(x.descripcion) + '</p>' : '') +
          link + '</div>';
      }).join('') : '<p style="color:var(--slate-500);font-size:0.9rem;">Pronto verás aquí lo más especial del mes.</p>';
    }

    const cumpEl = $('#cumpLista'), feliEl = $('#felicidades');
    if (cumpEl){
      if (d.cumples && d.cumples.length){
        cumpEl.innerHTML = d.cumples.map(c => '<span class="chip-cumple">🎈 ' + esc(c.nombre) + '</span>').join('');
        if (feliEl) feliEl.hidden = false;
      } else {
        cumpEl.innerHTML = '<span class="chip-cumple">Este mes no hay cumpleaños registrados</span>';
        if (feliEl) feliEl.hidden = true;
      }
    }

    const opciones = '<option value="">Elige al alumno(a)</option>' +
      (d.alumnos || []).map(a => '<option value="' + esc(a.id) + '">' + esc(a.nombre) + '</option>').join('');
    if ($('#alumno')) $('#alumno').innerHTML = opciones;
    if ($('#waAlumno')) $('#waAlumno').innerHTML = opciones;

    if (d.hayWhatsapp && $('#btnWa')) $('#btnWa').hidden = false;
  }catch(e){
    console.error(e);
    if ($('#avisosLista')) $('#avisosLista').innerHTML = '<p class="gis">No se pudo cargar la información. Revisa tu conexión a internet.</p>';
  }
}

/* Acceso por alumno */
const formAcceso = $('#formAcceso');
if (formAcceso){
  formAcceso.addEventListener('submit', async ev => {
    ev.preventDefault();
    const msg = $('#msgAcceso'), btn = $('#btnEntrar');
    if (msg) { msg.style.color = 'var(--navy)'; msg.textContent = 'Verificando con el padrón escolar...'; }
    if (btn) btn.disabled = true;
    try{
      const d = await llamar({action:'acceso', id:$('#alumno').value, fecha:$('#fecha2').value});
      if (!d.ok){
        if (msg) { msg.style.color = '#B91C1C'; msg.textContent = d.error || 'Datos no coinciden. Revisa la fecha.'; }
        return;
      }
      if (msg) msg.textContent = '';
      $('#tituloAula').textContent = d.nombre;
      const idAl = $('#alumno').value;
      const pintarAvatar = url => {
        $('#avatarAlumno').innerHTML = url ? '<img src="' + url + '" alt="Avatar de ' + esc(d.nombre) + '">' : avatar(d);
      };
      pintarAvatar(window.Perfil ? Perfil.obtener(idAl) : '');
      if (window.Perfil) Perfil.iniciar(idAl, d.nombre, pintarAvatar);
      $('#carpetas').innerHTML = CICLO.map(m => {
        const c = d.carpetas ? d.carpetas.find(x => norm(x.mes).indexOf(m.k) === 0) : null;
        return c
          ? '<a class="carpeta-item" target="_blank" rel="noopener" data-folder="' + esc(folderId(c.enlace)) + '" data-titulo="' + esc(m.n) + '" href="' + esc(seguro(c.enlace)) + '"><span class="ico">' + m.e + '</span><span>' + esc(m.n) + '</span><small>📁 Abrir</small></a>'
          : '<div class="carpeta-item off"><span class="ico">' + m.e + '</span><span>' + esc(m.n) + '</span><small>🔒 Próximamente</small></div>';
      }).join('');

      const galTit = $('#galTit'), galeria = $('#galeria');
      if (galTit && galeria){
        const tieneGal = d.galeria && d.galeria.length;
        galTit.hidden = !tieneGal;
        galeria.hidden = !tieneGal;
        if (tieneGal){
          galeria.innerHTML = d.galeria.map(g =>
            '<a class="carpeta-item" target="_blank" rel="noopener" data-folder="' + esc(folderId(g.enlace)) + '" data-titulo="' + esc(g.titulo) + '" href="' + esc(seguro(g.enlace)) + '"><span class="ico">📸</span><span>' + esc(g.titulo) + '</span>' +
            (g.descripcion ? '<small>' + esc(g.descripcion) + '</small>' : '') + '</a>'
          ).join('');
        }
      }

      $('#formAcceso').hidden = true;
      $('#privado').hidden = false;
      $('#contacto').hidden = true;
    }catch(e){
      if (msg) { msg.style.color = '#B91C1C'; msg.textContent = 'Error de conexión. Inténtalo de nuevo.'; }
    }finally{
      if (btn) btn.disabled = false;
    }
  });
}

const btnSalir = $('#btnSalir');
if (btnSalir){
  btnSalir.addEventListener('click', () => {
    $('#privado').hidden = true;
    $('#formAcceso').hidden = false;
    $('#contacto').hidden = false;
    $('#fecha2').value = '';
    $('#carpetas').innerHTML = '';
  });
}

/* WhatsApp seguro */
const btnWa = $('#btnWa'), dlgWa = $('#dlgWa'), btnWaCerrar = $('#btnWaCerrar'), formWa = $('#formWa');
if (btnWa && dlgWa){
  btnWa.addEventListener('click', () => {
    $('#msgWa').textContent = '';
    dlgWa.showModal();
  });
}
if (btnWaCerrar && dlgWa){
  btnWaCerrar.addEventListener('click', () => {
    dlgWa.close();
    $('#waFecha').value = '';
  });
}
if (formWa){
  formWa.addEventListener('submit', async ev => {
    ev.preventDefault();
    const msg = $('#msgWa'), btn = $('#btnWaIr');
    if (msg) { msg.style.color = 'var(--navy)'; msg.textContent = 'Validando alumno...'; }
    if (btn) btn.disabled = true;
    try{
      const d = await llamar({action:'whatsapp', id:$('#waAlumno').value, fecha:$('#waFecha').value});
      if (!d.ok){
        if (msg) { msg.style.color = '#B91C1C'; msg.textContent = d.error || 'No se pudo abrir WhatsApp.'; }
        return;
      }
      $('#waFecha').value = '';
      window.location.href = d.url;
    }catch(e){
      if (msg) { msg.style.color = '#B91C1C'; msg.textContent = 'Error de conexión.'; }
    }finally{
      if (btn) btn.disabled = false;
    }
  });
}

/* Visor de carpetas de Drive */
function abrirVisor(id, titulo, url){
  $('#visorTitulo').textContent = titulo || 'Carpeta de Evidencias';
  $('#visorDrive').href = seguro(url);
  $('#visorMarco').src = 'https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(id) + '#grid';
  $('#visor').hidden = false;
  document.documentElement.classList.add('bloqueado');
  history.pushState({visor:1}, '');
}
function cerrarVisor(){
  $('#visor').hidden = true;
  $('#visorMarco').src = 'about:blank';
  document.documentElement.classList.remove('bloqueado');
}
function volverVisor(){
  if (history.state && history.state.visor) history.back();
  else cerrarVisor();
}
['#visorAtras', '#visorCerrar'].forEach(sel => {
  const b = $(sel);
  if (b) b.addEventListener('click', volverVisor);
});
window.addEventListener('popstate', () => {
  if (!$('#visor').hidden) cerrarVisor();
});
document.addEventListener('click', ev => {
  const b = ev.target.closest('button.ver-carpeta');
  if (b){ abrirVisor(b.dataset.folder, b.dataset.titulo, b.dataset.url); return; }
  const a = ev.target.closest('a.carpeta-item[data-folder]');
  if (!a || !a.dataset.folder || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return;
  ev.preventDefault();
  abrirVisor(a.dataset.folder, a.dataset.titulo, a.href);
});

/* OneSignal */
window.OneSignalDeferred = window.OneSignalDeferred || [];
setTimeout(() => {
  const m = $('#msgNotif');
  if (m && m.textContent.indexOf('Cargando') === 0) {
    m.textContent = 'Avisos disponibles directamente en este portal escolar.';
  }
}, 5000);

OneSignalDeferred.push(async function(OneSignal){
  const btn = $('#btnNotif'), msg = $('#msgNotif');
  try{
    const base = location.pathname.replace(/[^/]*$/, '');
    await OneSignal.init({
      appId: '97d0ae47-97ab-482b-9312-d45a45a4b33f',
      serviceWorkerPath: base.replace(/^\//, '') + 'OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: base },
      serviceWorkerOverrideForTypical: true,
      notifyButton: { enable: false }
    });
    if (!OneSignal.Notifications.isPushSupported()){
      if (msg) msg.textContent = 'Este navegador no admite notificaciones push.';
      return;
    }
    function estado(){
      if (OneSignal.User.PushSubscription.optedIn){
        if (btn) btn.hidden = true;
        if (msg) msg.textContent = '✅ Notificaciones activadas. Recibirás avisos importantes en tu dispositivo.';
        OneSignal.User.addTag('escuela', 'si');
      } else if (Notification.permission === 'denied'){
        if (btn) btn.hidden = true;
        if (msg) msg.textContent = 'Notificaciones bloqueadas en el navegador. Puedes activarlas en la configuración del sitio.';
      } else {
        if (btn) btn.hidden = false;
        if (msg) msg.textContent = 'Toca el botón para recibir los avisos directamente en tu teléfono.';
      }
    }
    estado();
    if (btn) btn.addEventListener('click', async () => {
      await OneSignal.Notifications.requestPermission();
      estado();
    });
    OneSignal.User.PushSubscription.addEventListener('change', estado);
  }catch(e){
    if (msg) msg.textContent = 'Servicio de avisos disponible en la página escolar.';
  }
});

/* Aparición suave al hacer scroll */
const obs = ('IntersectionObserver' in window)
  ? new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  : null;
document.querySelectorAll('.reveal').forEach(el => obs ? obs.observe(el) : el.classList.add('in'));

cargar();
