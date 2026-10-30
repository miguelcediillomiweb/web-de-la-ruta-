// Efectos de la web: pantalla de carga, saludo con emojis, burbujas y pie de página.
(function () {
  const DURACION_CARGA = 5000; // milisegundos que dura la barra de carga
  const aleatorio = (a, b) => a + Math.random() * (b - a);
  const barajar = (lista) => [...lista].sort(() => Math.random() - 0.5);
  const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const emoji = (txt, clases) => {
    const s = document.createElement('span');
    s.className = 'emoji ' + clases; s.textContent = txt; s.setAttribute('aria-hidden', 'true');
    s.style.animationDelay = aleatorio(0, 1).toFixed(2) + 's';
    return s;
  };

  // 1) Pantalla de carga: una sola vez por visita
  const pantalla = document.getElementById('pantalla-carga');
  if (pantalla) {
    let visto = false;
    try { visto = sessionStorage.getItem('gp-cargado') === '1'; } catch (e) {}
    if (visto) pantalla.remove();
    else setTimeout(() => {
      pantalla.classList.add('saliendo');
      setTimeout(() => pantalla.remove(), 500);
      try { sessionStorage.setItem('gp-cargado', '1'); } catch (e) {}
    }, DURACION_CARGA);
  }

  // 2) Saludo según la hora, con emojis animados al azar
  const hora = new Date().getHours();
  let momento;
  if (hora >= 5 && hora < 12) momento = { texto: '¡Buenos días!', emojis: ['☀️', '🌻', '☕', '🥤'] };
  else if (hora >= 12 && hora < 19) momento = { texto: '¡Buenas tardes!', emojis: ['🌤️', '😎', '🥤', '🫧'] };
  else momento = { texto: '¡Buenas noches!', emojis: ['🌙', '⭐', '✨', '🥤'] };
  const titulo = document.querySelector('.cabecera h1');
  if (titulo) {
    const [e1, e2] = barajar(momento.emojis);
    const animaciones = ['rebote', 'balanceo', 'flotar'];
    const saludo = document.createElement('p');
    saludo.className = 'saludo';
    const texto = document.createElement('span');
    texto.textContent = momento.texto;
    saludo.append(emoji(e1, barajar(animaciones)[0]), texto, emoji(e2, barajar(animaciones)[0]));
    titulo.after(saludo);
  }

  // 3) Burbujas que suben (no bloquean los toques)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const capa = document.createElement('div');
    capa.id = 'burbujas'; capa.setAttribute('aria-hidden', 'true');
    const cantidad = innerWidth < 700 ? 24 : 40;
    for (let i = 0; i < cantidad; i++) {
      const b = document.createElement('span');
      const t = aleatorio(10, 46).toFixed(0);
      b.className = 'burbuja';
      b.style.cssText = `width:${t}px;height:${t}px;left:${aleatorio(0, 100).toFixed(1)}%;` +
        `animation-duration:${aleatorio(7, 16).toFixed(1)}s;animation-delay:-${aleatorio(0, 16).toFixed(1)}s;` +
        `--vaiven:${aleatorio(-40, 40).toFixed(0)}px`;
      capa.append(b);
    }
    document.body.append(capa);
  }

  // 4) Pie de página con fecha y hora de la visita
  const pie = document.createElement('footer');
  pie.className = 'pie';
  const fecha = document.createElement('p');
  fecha.className = 'pie-fecha';
  const actualizar = () => {
    const d = new Date();
    fecha.textContent = '📅 ' + mayuscula(d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) +
      ' · 🕒 ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  actualizar();
  setInterval(actualizar, 1000);
  const credito = document.createElement('p');
  credito.textContent = '© ' + new Date().getFullYear() + ' Creado por Grupo Peñafiel y Ruta 1371';
  const diseno = document.createElement('p');
  diseno.append('Diseño web por Miguel, hecho con ', emoji('💗', 'latido'));
  pie.append(fecha, credito, diseno);
  const principal = document.querySelector('main');
  if (principal) principal.after(pie); else document.body.append(pie);
})();
