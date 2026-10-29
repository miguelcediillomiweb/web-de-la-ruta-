// Lógica del catálogo: lee las pestañas Marcas y Productos de Google Sheets.
let marcas = [];
let productos = [];
let player = null;

const $ = (s) => document.querySelector(s);
const norm = (s) => String(s ?? '').trim().toLocaleLowerCase('es-MX');
const clave = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const rutaImg = (n) => (/^https?:/i.test(String(n)) ? String(n) : CONFIG.CARPETA_IMAGENES + String(n || '').replace(/^\//, ''));
const dinero = (v) => v === '' || v == null ? '—' :
  isNaN(v) ? String(v) : Number(v).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const idYoutube = (url) => {
  const m = String(url ?? '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
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

function extraerTabla(txt, nombre) {
  const inicio = txt.indexOf('{');
  const fin = txt.lastIndexOf('}');
  if (inicio < 0 || fin <= inicio) {
    throw new Error('Google Sheets no devolvió datos JSON. Revisa que el archivo esté compartido para lectura pública.');
  }
  const respuesta = JSON.parse(txt.slice(inicio, fin + 1));
  if (respuesta.status && respuesta.status !== 'ok') {
    const detalle = respuesta.errors?.map(x => x.detailed_message || x.message).join('; ');
    throw new Error(detalle || 'Google Sheets rechazó la consulta de la pestaña ' + nombre + '.');
  }
  if (!respuesta.table) throw new Error('No se encontró la pestaña "' + nombre + '".');
  const tabla = respuesta.table;
  let encabezados = (tabla.cols || []).map(c => String(c.label || c.id || '').trim());
  let filas = tabla.rows || [];
  if (!encabezados.some(Boolean) && filas.length) {
    encabezados = (filas[0].c || []).map(c => String(c?.v ?? c?.f ?? '').trim());
    filas = filas.slice(1);
  }
  const canon = (s) => {
    const k = clave(s);
    const equivalencias = {
      marca: 'Marca', logo: 'Logo', videourl: 'Video_URL', video: 'Video_URL',
      producto: 'Producto', presentacion: 'Presentacion',
      preciocaja: 'Precio_Caja', precioporcaja: 'Precio_Caja',
      piezascaja: 'Piezas_Caja', piezasporcaja: 'Piezas_Caja',
      preciopublico: 'Precio_Publico', preciopublico: 'Precio_Publico'
    };
    return equivalencias[k] || String(s || '').trim();
  };
  return filas.map(r => {
    const obj = {};
    encabezados.forEach((nombreCol, i) => {
      const celda = r.c?.[i];
      obj[canon(nombreCol)] = celda?.v ?? celda?.f ?? '';
    });
    return obj;
  }).filter(obj => Object.values(obj).some(v => String(v).trim() !== ''));
}

let contadorConsulta = 0;

// Google Sheets GViz se consulta mediante JSONP para evitar bloqueos CORS
// del navegador al cargar la web desde GitHub Pages.
function consultarGViz(url, nombre) {
  return new Promise((resolve, reject) => {
    const callback = '__peñafielSheets' + (++contadorConsulta);
    const script = document.createElement('script');
    let terminado = false;
    const limpiar = () => {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      delete window[callback];
      script.remove();
    };
    window[callback] = (respuesta) => {
      limpiar();
      try {
        if (!respuesta || respuesta.status !== 'ok') {
          const detalle = respuesta?.errors?.map(x => x.detailed_message || x.message).join('; ');
          throw new Error(detalle || 'Google Sheets no autorizó o no encontró la pestaña "' + nombre + '".');
        }
        resolve(respuesta);
      } catch (e) { reject(e); }
    };
    script.onerror = () => { limpiar(); reject(new Error('No se pudo conectar con Google Sheets para leer "' + nombre + '".')); };
    const temporizador = setTimeout(() => {
      limpiar();
      reject(new Error('Tiempo de espera agotado al leer la pestaña "' + nombre + '". Comprueba que el archivo permita acceso a cualquier persona con el enlace.'));
    }, 15000);
    script.src = url + '&t=' + Date.now();
    document.head.append(script);
  });
}

async function leerHoja(nombre) {
  const callback = '__peñafielSheets' + (contadorConsulta + 1);
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:${callback}&headers=1&sheet=${encodeURIComponent(nombre)}`;
  const respuesta = await consultarGViz(url, nombre);
  return extraerTabla(JSON.stringify(respuesta), nombre);
}

function logo(m, clase) {
  const texto = () => h('span', { class: 'logo-texto' }, m.Marca || 'Marca');
  if (!m.Logo) return texto();
  const img = h('img', { class: clase, src: rutaImg(m.Logo), alt: m.Marca || 'Marca', loading: 'lazy' });
  img.addEventListener('error', () => img.replaceWith(texto()));
  return img;
}

const fila = (k, v, clase = '') => h('div', { class: 'fila' }, h('dt', {}, k), h('dd', { class: clase }, v));

const tarjeta = (p) => h('article', { class: 'tarjeta' },
  h('h3', {}, p.Producto || 'Producto'),
  h('p', { class: 'presentacion' }, p.Presentacion || ''),
  h('dl', {},
    fila('Precio caja', dinero(p.Precio_Caja) + (p.Piezas_Caja ? ` (${p.Piezas_Caja} pzas)` : ''), CONFIG.BORROSO_PRECIO_CAJA ? 'borroso' : ''),
    fila('Precio público', dinero(p.Precio_Publico))
  )
);

function abrirMarca(m) {
  const lista = productos.filter(p => norm(p.Marca) === norm(m.Marca));
  $('#marca-contenido').replaceChildren(
    h('div', { class: 'marca-cabeza' },
      logo(m, 'logo-grande'),
      idYoutube(m.Video_URL) && h('button', { class: 'btn', onclick: () => abrirVideo(m.Video_URL) }, 'Conoce la marca')
    ),
    lista.length ? h('div', { class: 'tarjetas' }, lista.map(tarjeta))
      : h('p', { class: 'vacio' }, 'No hay productos registrados para esta marca en la pestaña Productos.')
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
      videoId: id, playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: e => e.target.playVideo(),
        onStateChange: e => { if (e.data === YT.PlayerState.ENDED) $('#video').close(); }
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
  document.querySelectorAll('dialog').forEach(d => {
    d.querySelector('.x').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  });
  $('#video').addEventListener('close', limpiarVideo);
}

async function iniciar() {
  configurarVentanas();
  $('#marcas').replaceChildren(h('p', { class: 'vacio' }, 'Cargando marcas y productos…'));
  try {
    const [datosMarcas, datosProductos] = await Promise.all([
      leerHoja(CONFIG.HOJA_MARCAS), leerHoja(CONFIG.HOJA_PRODUCTOS)
    ]);
    marcas = datosMarcas.filter(m => m.Marca);
    productos = datosProductos.filter(p => p.Producto);
    if (!marcas.length) {
      $('#marcas').replaceChildren(h('p', { class: 'vacio' }, 'La pestaña Marcas se leyó, pero no contiene filas con la columna "Marca". Revisa los encabezados.'));
      return;
    }
    $('#marcas').replaceChildren(...marcas.map(m =>
      h('button', { class: 'marca-btn', 'aria-label': m.Marca, onclick: () => abrirMarca(m) }, logo(m, 'logo'))
    ));
    if (!productos.length) console.warn('La pestaña Productos se leyó, pero no devolvió productos. Revisa el encabezado Producto.');
  } catch (e) {
    console.error('Error al cargar el catálogo:', e);
    $('#marcas').replaceChildren(h('p', { class: 'vacio' },
      'No se pudieron cargar las hojas de Google Sheets. ' + (e.message || 'Revisa el ID, los nombres de pestañas y el permiso de lectura pública.')
    ));
  }
}

iniciar();
