// Al tocar una marca: pantalla de carga con eslogan y cartel; después abre la marca.
(function () {
  const abrirOriginal = window.abrirMarca;
  if (typeof abrirOriginal !== 'function') return;
  const ruta = (n) => (typeof rutaImg === 'function' ? rutaImg(n) : 'imagenes/' + n);
  const limpiarUrl = (u) => String(u || '').replace(/["\\\n\r]/g, '');
  let cargando = false;

  function crear(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function fondoDeMarca(cartel, eslogan) {
    const ventana = document.getElementById('marca');
    if (!ventana) return;
    ventana.style.backgroundImage = cartel
      ? 'linear-gradient(rgba(255,255,255,.2), rgba(255,255,255,.45)), url("' + limpiarUrl(cartel) + '")'
      : '';
    ventana.style.backgroundSize = 'cover';
    ventana.style.backgroundPosition = 'center';
    ventana.scrollTop = 0;
    const cabeza = document.querySelector('#marca-contenido .marca-cabeza');
    if (cabeza) {
      cabeza.querySelectorAll('.marca-eslogan').forEach(e => e.remove());
      if (eslogan && cabeza.firstElementChild) {
        cabeza.firstElementChild.after(crear('p', 'marca-eslogan', '“' + eslogan + '”'));
      }
    }
  }

  window.abrirMarca = function (m) {
    if (cargando) return;
    cargando = true;
    const eslogan = String(m.Eslogan || '').trim();
    const palabras = eslogan ? eslogan.split(/\s+/).length : 0;
    const ms = eslogan ? Math.min(6000, Math.max(3000, 2000 + palabras * 300)) : 2000;
    const nombreCartel = String(m.Cartel || '').trim();
    const cartel = nombreCartel ? ruta(nombreCartel) : '';

    const capa = crear('div', 'carga-marca');
    capa.setAttribute('role', 'status');
    capa.setAttribute('aria-label', 'Cargando marca ' + String(m.Marca || ''));
    const tarjeta = crear('div', 'cm-tarjeta');
    if (cartel) tarjeta.style.backgroundImage = 'url("' + limpiarUrl(cartel) + '")';

    const barra = crear('div', 'cm-barra');
    const relleno = document.createElement('span');
    relleno.style.animationDuration = ms + 'ms';
    barra.append(relleno);

    tarjeta.append(crear('p', 'cm-pre', 'Cargando'), crear('h2', 'cm-nombre', m.Marca || ''), barra);
    if (eslogan) tarjeta.append(crear('p', 'cm-eslogan', '“' + eslogan + '”'));
    tarjeta.append(crear('small', 'cm-saltar', 'Toca para continuar'));
    capa.append(tarjeta);
    document.body.append(capa);

    let terminado = false;
    let temporizador;
    function terminar() {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      capa.classList.add('expandir');
      window.setTimeout(() => {
        try {
          abrirOriginal(m);
          fondoDeMarca(cartel, eslogan);
        } finally {
          capa.remove();
          cargando = false;
        }
      }, 520);
    }
    temporizador = window.setTimeout(terminar, ms);
    capa.addEventListener('click', terminar, { once: false });
  };
})();
