// Portada: banner de eslóganes, banner neón y buscador de marcas.
(function () {
  const sinAcentos = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const zonaMarcas = document.getElementById('marcas');
  if (!zonaMarcas) return;

  const bloque = document.createElement('section');
  bloque.className = 'bloque-marcas';
  const neon = document.createElement('div');
  neon.className = 'banner-neon';
  const cristal = document.createElement('div');
  cristal.className = 'banner-cristal';
  const pista = document.createElement('div');
  pista.className = 'banner-pista';
  for (let i = 0; i < 8; i++) {
    const frase = document.createElement('span');
    frase.textContent = '¿Y tú qué marca quieres conocer hoy? 🫧';
    if (i > 0) frase.setAttribute('aria-hidden', 'true');
    pista.append(frase);
  }
  cristal.append(pista);
  neon.append(cristal);

  const buscador = document.createElement('label');
  buscador.className = 'buscador-marcas';
  const lupa = document.createElement('span');
  lupa.setAttribute('aria-hidden', 'true');
  lupa.textContent = '🔎';
  const campo = document.createElement('input');
  campo.type = 'search';
  campo.placeholder = 'Busca una marca…';
  campo.autocomplete = 'off';
  campo.setAttribute('aria-label', 'Buscar marca');
  buscador.append(lupa, campo);

  const aviso = document.createElement('p');
  aviso.className = 'sin-marcas';
  aviso.textContent = 'No encontramos esa marca. Prueba con otro nombre.';
  aviso.style.display = 'none';
  bloque.append(neon, buscador, aviso);
  zonaMarcas.before(bloque);

  campo.addEventListener('input', () => {
    const q = sinAcentos(campo.value);
    let visibles = 0;
    zonaMarcas.querySelectorAll('.marca-btn').forEach((b) => {
      const coincide = !q || sinAcentos(b.getAttribute('aria-label') || b.textContent).includes(q);
      b.style.display = coincide ? '' : 'none';
      if (coincide) visibles++;
    });
    aviso.style.display = q && !visibles ? '' : 'none';
  });

  const alinear = () => {
    const oculto = zonaMarcas.hidden || zonaMarcas.style.display === 'none';
    bloque.style.display = oculto ? 'none' : '';
  };
  new MutationObserver(alinear).observe(zonaMarcas, { attributes: true, attributeFilter: ['hidden', 'style'] });
  alinear();

  const encabezado = document.querySelector('.cabecera');
  const banner = document.createElement('div');
  banner.className = 'banner-eslogan';
  banner.style.display = 'none';
  if (encabezado) encabezado.append(banner);

  function rotar(lista) {
    let i = 0;
    const mostrar = () => {
      const { marca, texto } = lista[i % lista.length];
      i++;
      const s = document.createElement('span');
      s.className = 'texto';
      const b = document.createElement('b');
      b.textContent = marca;
      s.append(b, ' ' + texto);
      banner.replaceChildren(s);
      setTimeout(mostrar, Math.max(3500, 2000 + texto.split(/\s+/).length * 300));
    };
    banner.style.display = '';
    mostrar();
  }

  let intentos = 0;
  const espera = setInterval(() => {
    intentos++;
    if (zonaMarcas.querySelector('.marca-btn') && typeof marcas !== 'undefined') {
      clearInterval(espera);
      const lista = marcas.filter(m => m && String(m.Eslogan || '').trim())
        .map(m => ({ marca: m.Marca || '', texto: String(m.Eslogan).trim() }));
      if (lista.length && encabezado) rotar(lista);
    } else if (intentos > 60) clearInterval(espera);
  }, 400);
})();