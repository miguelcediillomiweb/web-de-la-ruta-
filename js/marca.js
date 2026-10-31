// Al tocar una marca: pequeña pantalla de carga con su eslogan y cartel de fondo (pop-up).
// Al terminar, el cartel crece a pantalla completa y los productos aparecen encima.
// Usa las columnas "Eslogan" y "Cartel" de la pestaña Marcas.
(function () {
  const abrirOriginal = window.abrirMarca;
  if (typeof abrirOriginal !== 'function') return;
  const ruta = (n) => (typeof rutaImg === 'function' ? rutaImg(n) : 'imagenes/' + n);
  const limpiarUrl = (u) => u.replace(/["\\\n]/g, '');
  let cargando = false;

  // Limpieza: quita textos viejos que ya no van en la portada (por si quedó publicada una versión anterior)
  const limpiarTextosViejos = () => {
    document.querySelectorAll('.banner-eslogan').forEach((e) => e.remove());
    document.querySelectorAll('.cabecera p').forEach((e) => { if (/toca una marca/i.test(e.textContent)) e.remove(); });
  };
  limpiarTextosViejos();
  const encabezado = document.querySelector('.cabecera');
  if (encabezado) new MutationObserver(limpiarTextosViejos).observe(encabezado, { childList: true, subtree: true });


  function crear(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }

  // El cartel queda de fondo de la ventana de la marca; arriba se pone un velo suave para leer los productos
  function fondoDeMarca(cartel) {
    const ventana = document.getElementById('marca');
    ventana.style.backgroundImage = cartel
      ? 'linear-gradient(rgba(255,255,255,.2), rgba(255,255,255,.45)), url("' + limpiarUrl(cartel) + '")'
      : '';
    ventana.style.backgroundSize = 'cover';
    ventana.style.backgroundPosition = 'center';
    ventana.scrollTop = 0;
  }

  window.abrirMarca = function (m) {
    if (cargando) return;
    cargando = true;
    const eslogan = String(m.Eslogan || '').trim();
    const palabras = eslogan ? eslogan.split(/\s+/).length : 0; // ~4 palabras por segundo + tiempo para notarlo
    const ms = eslogan ? Math.min(6000, Math.max(3000, 2000 + palabras * 300)) : 2000;
    const cartel = String(m.Cartel || '').trim() ? ruta(String(m.Cartel).trim()) : '';

    const capa = crear('div', 'carga-marca');
    capa.setAttribute('role', 'status');
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

    let terminado = false;
    const temporizador = setTimeout(terminar, ms);
    function terminar() {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      capa.classList.add('expandir'); // el cartel crece hasta ocupar toda la pantalla
      setTimeout(() => {
        abrirOriginal(m);
        fondoDeMarca(cartel);
        capa.remove();
        cargando = false;
      }, 520);
    }
    capa.addEventListener('click', terminar);
    document.body.append(capa);
  };
})();
