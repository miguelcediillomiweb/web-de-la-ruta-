document.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn-salir';
  button.textContent = '👋 Salir de esta web';
  button.setAttribute('aria-label', 'Salir de esta web');

  const footer = document.createElement('section');
  footer.className = 'salir';
  footer.append(button);
  const main = document.querySelector('main');
  if (main) main.after(footer);

  button.addEventListener('click', () => {
    if (document.body.classList.contains('despedida-abierta')) return;
    button.classList.add('presionado');
    try { if (navigator.vibrate) navigator.vibrate([70, 40, 90]); } catch (_) {}

    const screen = document.createElement('section');
    screen.className = 'despedida';
    screen.setAttribute('role', 'status');
    screen.setAttribute('aria-live', 'polite');
    screen.innerHTML = '<div class="despedida-ondas" aria-hidden="true"><i></i><i></i><i></i></div><div class="confeti" aria-hidden="true"></div><div class="despedida-contenido"><div class="despedida-mano" aria-hidden="true">👋</div><h2>¡Hasta la próxima!</h2><p>Muchas gracias por visitar Grupo Peñafiel. ¡Te esperamos pronto!</p></div>';
    document.body.append(screen);
    document.body.classList.add('despedida-abierta');

    const confetti = screen.querySelector('.confeti');
    const pieces = ['✦', '●', '◆', '✧', '✺', '•'];
    for (let i = 0; i < 64; i++) {
      const piece = document.createElement('span');
      piece.className = 'pieza';
      piece.textContent = pieces[i % pieces.length];
      piece.style.setProperty('--dx', (Math.random() * 100 - 50) + 'vw');
      piece.style.setProperty('--dy', (Math.random() * 100 - 50) + 'vh');
      piece.style.setProperty('--delay', (Math.random() * 0.45) + 's');
      piece.style.setProperty('--hue', Math.floor(Math.random() * 360));
      confetti.append(piece);
    }

    window.setTimeout(() => {
      try { window.close(); } catch (_) {}
      window.setTimeout(() => {
        document.documentElement.innerHTML = '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title></head><body style="margin:0;background:#fff"></body>';
      }, 250);
    }, 5000);
  });
});
