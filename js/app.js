// Lógica del catálogo: lee las pestañas Marcas y Productos de Google Sheets.
let marcas = [];
let productos = [];
let player = null;
let errorProductos = '';

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
  const columnas = tabla.cols || [];
  const filasOriginales = tabla.rows || [];
  const canon = (s) => {
    const k = clave(s);
    const equivalencias = {
      marca: 'Marca', logo: 'Logo', videourl: 'Video_URL', video: 'Video_URL',
      producto: 'Producto', presentacion: 'Presentacion',
      preciocaja: 'Precio_Caja', precioporcaja: 'Precio_Caja',
      piezascaja: 'Piezas_Caja', piezasporcaja: 'Piezas_Caja',
      preciopublico: 'Precio_Publico'
    };
    return equivalencias[k] || String(s || '').trim();
  };
  const puntuar = (encabezados) => {
    const nombres = encabezados.map(canon);
    return Number(nombres.includes('Marca')) + Number(nombre !== 'Productos' || nombres.includes('Producto'));
  };
  const etiquetas = columnas.map(c => String(c.label || '').trim());
  const primeraFila = (filasOriginales[0]?.c || []).map(c => String(c?.v ?? c?.f ?? '').trim());

  // GViz puede entregar encabezados como labels de columnas o como primera fila.
  // Evaluamos ambas formas y elegimos la que realmente contiene los campos esperados.
  const candidatos = [
    { encabezados: etiquetas, filas: filasOriginales, origen: 'labels' },
    { encabezados: primeraFila, filas: filasOriginales.slice(1), origen: 'primera fila' }
  ].filter(x => x.encabezados.some(Boolean));
  candidatos.sort((a, b) => puntuar(b.encabezados) - puntuar(a.encabezados));
  const elegido = candidatos[0];

  if (!elegido || puntuar(elegido.encabezados) < 2) {
    const muestra = filasOriginales.slice(0, 3).map(f =>
      (f.c || []).map(c => c?.v ?? c?.f ?? '').join(' | ')
    ).join(' / ');
    const cols = columnas.map(c => String(c.label || c.id || '')).join(' | ');
    throw new Error('No reconocí los encabezados de "' + nombre + '". Columnas recibidas: [' +
      cols + ']. Primeras filas: [' + muestra + '].');
  }

  return elegido.filas.map(r => {
    const obj = {};
    elegido.encabezados.forEach((nombreCol, i) => {
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
    const callback = '__penafielSheets' + (++contadorConsulta);
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
  const callback = '__penafielSheets' + (contadorConsulta + 1);
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

// Agrupa variantes del mismo producto aunque cambien tamaño o envase.
const limpiarNombreGrupo = (valor) => {
  const texto = String(valor ?? '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  return clave(texto
    .replace(/\\b\\d+(?:[.,]\\d+)?\\s*(?:mililitros?|ml|litros?|lts?|lt|l)\\b/g, ' ')
    .replace(/\\b(?:lata|botella|vidrio|retornable|envase|pet|desechable|no retornable)\\b/g, ' ')
    .replace(/\\b(?:original)\\b/g, ' original ')
  );
};

const tamanoClave = (p) => clave([p.Producto, p.Presentacion].join(' '));
const esSaborCitrico = (p) => /naranjada|limonada|pinada/.test(clave(p.Producto));

function agruparProductos(lista) {
  const grupos = [];
  const mapa = new Map();

  lista.forEach((p) => {
    const base = limpiarNombreGrupo([p.Producto, p.Presentacion].join(' '));
    const key = base || clave(p.Producto);
    if (!mapa.has(key)) {
      const grupo = { titulo: p.Producto || 'Producto', variantes: [] };
      mapa.set(key, grupo);
      grupos.push(grupo);
    }
    mapa.get(key).variantes.push(p);
  });

  // Los sabores surtidos de Orange Crush (naranjada, limonada y piñada)
  // se muestran juntos cuando corresponden al mismo formato de envase/tamaño.
  const resultado = [];
  const surtidos = new Map();
  grupos.forEach((g) => {
    if (g.variantes.length === 1 && esSaborCitrico(g.variantes[0])) {
      const p = g.variantes[0];
      const texto = clave([p.Producto, p.Presentacion].join(' '));
      const tamano = (texto.match(/\d+(?:\d+)?(?:ml|mililitros|l|lt|lts|litros)/) || [''])[0];
      const envase = /vidrio|retornable/.test(texto) ? 'vidrio-retornable' :
        /lata/.test(texto) ? 'lata' : 'otro';
      const claveSurtido = 'saborescitrus|' + tamano + '|' + envase;
      if (!surtidos.has(claveSurtido)) {
        const grupo = { titulo: 'Sabores surtidos', variantes: [] };
        surtidos.set(claveSurtido, grupo);
        resultado.push(grupo);
      }
      surtidos.get(claveSurtido).variantes.push(p);
    } else {
      resultado.push(g);
    }
  });

  return resultado;
}

const tarjeta = (grupo) => {
  const variantes = grupo.variantes;
  const nombres = [...new Set(variantes.map(p => String(p.Producto || '').trim()).filter(Boolean))];
  const titulo = nombres.length > 1 ? (nombres.every(n => esSaborCitrico({ Producto: n }))
    ? 'Sabores surtidos'
    : nombres[0].replace(/\s*\d+(?:[.,]\d+)?\s*(?:ml|mililitros?|l|lt|lts|litros?)\b/ig, '').trim() || nombres[0])
    : (variantes[0].Producto || grupo.titulo || 'Producto');

  const filas = variantes.map((p) => {
    const detalle = [p.Presentacion, p.Producto !== titulo ? p.Producto : '']
      .map(x => String(x || '').trim()).filter(Boolean);
    return h('div', { class: 'variante-producto' },
      h('div', { class: 'variante-nombre' },
        h('strong', {}, detalle.join(' · ') || p.Producto || 'Presentación')
      ),
      h('dl', { class: 'precios-variante' },
        fila('Precio caja', dinero(p.Precio_Caja) + (p.Piezas_Caja ? ` (${p.Piezas_Caja} pzas)` : ''), CONFIG.BORROSO_PRECIO_CAJA ? 'borroso' : ''),
        fila('Precio público', dinero(p.Precio_Publico))
      )
    );
  });

  return h('article', { class: 'tarjeta tarjeta-grupo' },
    h('h3', {}, titulo),
    h('div', { class: 'variantes-producto' }, filas)
  );
};

function abrirMarca(m) {
  const lista = productos.filter(p => clave(p.Marca) === clave(m.Marca));
  const contenido = [
    h('div', { class: 'marca-cabeza' },
      logo(m, 'logo-grande'),
      idYoutube(m.Video_URL) && h('button', { class: 'btn', onclick: () => abrirVideo(m.Video_URL) }, 'Conoce la marca')
    )
  ];
  if (errorProductos) contenido.push(h('p', { class: 'vacio' }, 'No se pudieron leer los productos: ' + errorProductos));
  else if (lista.length) contenido.push(h('div', { class: 'tarjetas' }, agruparProductos(lista).map(tarjeta)));
  else contenido.push(h('p', { class: 'vacio' }, 'No hay productos registrados para esta marca en la pestaña Productos.'));
  $('#marca-contenido').replaceChildren(...contenido);
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
  $('#marcas').replaceChildren(h('p', { class: 'vacio' }, 'Cargando marcas…'));

  // Las marcas y los productos se consultan por separado: un fallo en una
  // pestaña ya no impide mostrar la información que sí se pudo leer.
  try {
    const datosMarcas = await leerHoja(CONFIG.HOJA_MARCAS);
    marcas = datosMarcas.filter(m => String(m.Marca || '').trim());
    if (!marcas.length) {
      $('#marcas').replaceChildren(h('p', { class: 'vacio' },
        'La pestaña Marcas se leyó, pero no contiene filas válidas en la columna Marca. Revisa el encabezado y los datos.'));
      return;
    }
    $('#marcas').replaceChildren(...marcas.map(m =>
      h('button', { class: 'marca-btn', 'aria-label': m.Marca, onclick: () => abrirMarca(m) }, logo(m, 'logo'))
    ));
  } catch (e) {
    console.error('Error al leer la pestaña Marcas:', e);
    $('#marcas').replaceChildren(h('p', { class: 'vacio' },
      'No se pudieron cargar las marcas. ' + (e.message || 'Revisa el ID de la hoja y el permiso de lectura pública.')
    ));
    return;
  }

  try {
    const datosProductos = await leerHoja(CONFIG.HOJA_PRODUCTOS);
    productos = datosProductos.filter(p =>
      String(p.Producto || '').trim() && String(p.Marca || '').trim()
    );
    errorProductos = '';
    if (!productos.length) {
      errorProductos = 'La pestaña se leyó, pero no se encontraron filas con Marca y Producto. Verifica los encabezados.';
      console.warn(errorProductos);
      $('#marcas').append(h('p', { class: 'vacio' }, errorProductos));
    }
  } catch (e) {
    errorProductos = e.message || 'No fue posible consultar la pestaña Productos.';
    console.error('Error al leer la pestaña Productos:', e);
    $('#marcas').append(h('p', { class: 'vacio' },
      'Las marcas se cargaron, pero falló la lectura de Productos: ' + errorProductos
    ));
  }
}

iniciar();
