// Lógica: lee el Google Sheets y arma marcas, ventana de marca y video.
let marcas = [];
let productos = [];
let player = null;

const $ = (s) => document.querySelector(s);
const norm = (s) => String(s).trim().toLowerCase();
const rutaImg = (n) => (/^https?:/.test(n) ? n : CONFIG.CARPETA_IMAGENES + n);
const dinero = (v) =>
  v === '' || v == null ? '—' :
  isNaN(v) ? String(v) : Number(v).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const idYoutube = (url) => {
  const m = String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
};

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  kids.flat().forEach((c) => c != null && c !== false && el.append(c));
  return el;
}

async function leerHoja(nombre) {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(nombre)}`;
  const txt = await (await fetch(url)).text();
  const t = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)).table;
  let cols = t.cols.map((c) => (c.label || '').trim());
  let filas = t.rows;
  if (!cols.some(Boolean) && filas.length) {
    cols = filas[0].c.map((c) => String(c?.v ?? '').trim());
    filas = filas.slice(1);
  }
  return filas
    .map((r) => Object.fromEntries(cols.map((n, i) => [n, r.c[i] ? r.c[i].v ?? '' : ''])))
    .filter((f) => Object.values(f).some((v) => String(v).trim() !== ''));
}

function logo(m, clase) {
  const texto = () => h('span', { class: 'logo-texto' }, m.Marca);
  if (!m.Logo) return texto();
  const img = h('img', { class: clase, src: rutaImg(m.Logo), alt: m.Marca, loading: 'lazy' });
  img.addEventListener('error', () => img.replaceWith(texto()));
  return img;
}

const fila = (k, v, clase = '') => h('div', { class: 'fila' }, h('dt', {}, k), h('dd', { class: clase }, v));

const tarjeta = (p) =>
  h('article', { class: 'tarjeta' },
    h('h3', {}, p.Producto),
    h('p', { class: 'presentacion' }, p.Presentacion),
    h('dl', {},
      fila('Precio caja', dinero(p.Precio_Caja) + (p.Piezas_Caja ? ` (${p.Piezas_Caja} pzas)` : ''), CONFIG.BORROSO_PRECIO_CAJA ? 'borroso' : ''),
      fila('Precio público', dinero(p.Precio_Publico))
    )
  );

function abrirMarca(m) {
  const lista = productos.filter((p) => norm(p.Marca) === norm(m.Marca));
  $('#marca-contenido').replaceChildren(
    h('div', { class: 'marca-cabeza' },
      logo(m, 'logo-grande'),
      idYoutube(m.Video_URL) && h('button', { class: 'btn', onclick: () => abrirVideo(m.Video_URL) }, 'Conoce la marca')
    ),
    lista.length
      ? h('div', { class: 'tarjetas' }, lista.map(tarjeta))
      : h('p', { class: 'vacio' }, 'Pronto agregaremos los productos de esta marca.')
  );
  $('#marca').showModal();
}

function abrirVideo(url) {
  const id = idYoutube(url);
  if (!id) return;
  $('#video').showModal();
  const crear = () => {
    if (!$('#video').open) return;
    player = new YT.Player('reproductor', {
      videoId: id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e) => e.target.playVideo(),
        onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) $('#video').close(); }
      }
    });
  };
  if (window.YT && YT.Player) crear();
  else {
    window.onYouTubeIframeAPIReady = crear;
    if (!$('#yt-api')) document.head.append(h('script', { id: 'yt-api', src: 'https://www.youtube.com/iframe_api' }));
  }
}

function limpiarVideo() {
  if (player) { player.destroy(); player = null; }
  $('#video-caja').replaceChildren(h('div', { id: 'reproductor' }));
}

function configurarVentanas() {
  document.querySelectorAll('dialog').forEach((d) => {
    d.querySelector('.x').addEventListener('click', () => d.close());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });
  $('#video').addEventListener('close', limpiarVideo);
}

async function iniciar() {
  configurarVentanas();
  try {
    [marcas, productos] = await Promise.all([leerHoja(CONFIG.HOJA_MARCAS), leerHoja(CONFIG.HOJA_PRODUCTOS)]);
  } catch (e) {
    $('#marcas').replaceChildren(h('p', { class: 'vacio' }, 'No pudimos cargar los datos. Revisa tu conexión e intenta de nuevo.'));
    return;
  }
  marcas = marcas.filter((m) => m.Marca);
  productos = productos.filter((p) => p.Producto);
  $('#marcas').replaceChildren(
    ...marcas.map((m) => h('button', { class: 'marca-btn', 'aria-label': m.Marca, onclick: () => abrirMarca(m) }, logo(m, 'logo')))
  );
}

iniciar();
