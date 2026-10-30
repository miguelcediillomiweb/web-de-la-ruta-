// Efectos de bienvenida: carga, saludo según la hora y burbujas.
(function () {
  const DURACION_CARGA = 5000;
  const aleatorio = (a, b) => a + Math.random() * (b - a);
  const barajar = (lista) => [...lista].sort(() => Math.random() - 0.5);
  const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  function emoji(txt, clases) {
    const s = document.createElement('span');
    s.className = 'emoji ' + clases;
    s.textContent = txt;
    s.setAttribute('aria-hidden', 'true');
    s.style.animationDelay = aleatorio(0, 1).toFixed(2) + 's';
    return s;
  }

  // Pantalla de carga: una sola vez por visita.
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

  // Saludo y emoji alusivo a la hora, en la cabecera.
  const saludo = document.getElementById('saludo-hora');
  function actualizarSaludo() {
    const hora = new Date().getHours();
    let texto, emojis;
    if (hora >= 5 && hora < 12) {
      texto = '¡Buenos días!';
      emojis = ['☀️', '🌻', '☕'];
    } else if (hora >= 12 && hora < 19) {
      texto = '¡Buenas tardes!';
      emojis = ['🌤️', '😎', '🥤'];
    } else {
      texto = '¡Buenas noches!';
      emojis = ['🌙', '⭐', '✨'];
    }
    if (saludo) {
      saludo.replaceChildren();
      saludo.append(emoji(barajar(emojis)[0], barajar(['rebote', 'balanceo', 'flotar'])[0]));
      const textoSaludo = document.createElement('span');
      textoSaludo.textContent = texto;
      saludo.append(textoSaludo);
      saludo.append(emoji(barajar(emojis)[0], barajar(['rebote', 'balanceo', 'flotar'])[0]));
    }
  }

  // Fecha arriba del reloj; ambos permanecen en la bienvenida.
  const fecha = document.getElementById('fecha-visita');
  const reloj = document.getElementById('hora-visita');
  function actualizarFechaHora() {
    const ahora = new Date();
    if (fecha) {
      fecha.textContent = '📅 ' + mayuscula(ahora.toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }));
    }
    if (reloj) {
      reloj.textContent = '🕒 ' + ahora.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
  }
  actualizarSaludo();
  actualizarFechaHora();
  setInterval(actualizarSaludo, 60000);
  setInterval(actualizarFechaHora, 1000);

  // Burbujas decorativas, sin bloquear los toques.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const capa = document.createElement('div');
    capa.id = 'burbujas';
    capa.setAttribute('aria-hidden', 'true');
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
})();
