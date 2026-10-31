// Pantalla de carga por marca. Lee las columnas "Eslogan" y "Cartel" de la pestaña Marcas.
(function () {
  const abrirOriginal = window.abrirMarca;
  if (typeof abrirOriginal !== 'function') return;
  const ruta = (n) => (typeof rutaImg === 'function' ? rutaImg(n) : 'imagenes/' + n);
  let cargando = false;

  function crear(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function fondoDeMarca(cartel, eslogan) {
    const ventana = document.getElementById('marca');
    ventana.style.backgroundImage = cartel
      ? 'linear-gradient(rgba(255,255,255,.82), rgba(255,255,255,.9)), url("' + cartel.replace(/["\\\n]/g, '') + '")'
      : '';
    ventana.style.backgroundSize = 'cover';
    ventana.style.backgroundPosition = 'center';
    const cabeza = document.querySelector('#marca-contenido .marca-cabeza');
    if (!cabeza) return;
    cabeza.querySelectorAll('.marca-eslogan').forEach(e => e.remove());
    if (eslogan && cabeza.firstElementChild) {
      cabeza.firstElementChild.after(crear('p', 'marca-eslogan', '“' + eslogan + '”'));
    }
  }

  window.abrirMarca = function (m) {
    if (cargando) return;
    cargando = true;
    const eslogan = String(m.Eslogan || '').trim();
    const palabras = eslogan ? eslogan.split(/\s+/).length : 0;
    const ms = eslogan ? Math.min(6000, Math.max(3000, 2000 + palabras * 300)) : 2000;
    const cartelNombre = String(m.Cartel || '').trim();
    const cartel = cartelNombre ? ruta(cartelNombre) : '';

    const capa = crear('div', 'carga-marca');
    capa.setAttribute('role', 'status');
    capa.setAttribute('aria-label', 'Cargando marca ' + String(m.Marca || ''));
    if (cartel) capa.style.backgroundImage = 'url("' + cartel.replace(/["\\\n]/g, '') + '")';
    const barra = crear('div', 'cm-barra');
    const relleno = document.createElement('span');
    relleno.style.animationDuration = ms + 'ms';
    barra.append(relleno);
    capa.append(crear('p', 'cm-pre', 'Cargando'), crear('h2', 'cm-nombre', m.Marca || ''));
    if (eslogan) capa.append(crear('p', 'cm-eslogan', '“' + eslogan + '”'));
    capa.append(barra, crear('small', 'cm-saltar', 'Toca para continuar'));

    let terminado = false;
    let temporizador;
    function terminar() {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      cargando = false;
      capa.classList.add('saliendo');
      setTimeout(() => capa.remove(), 350);
      abrirOriginal(m);
      fondoDeMarca(cartel, eslogan);
    }
    temporizador = setTimeout(terminar, ms);
    capa.addEventListener('click', terminar);
    document.body.append(capa);
  };
})();