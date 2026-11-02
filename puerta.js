/* Puerta de entrada · Escuela Primaria Rafael Ramírez · Ruta: js/puerta.js */
(function(){
  var p = document.createElement('div');
  p.id = 'puerta';
  p.setAttribute('role', 'dialog');
  p.setAttribute('aria-label', 'Entrada a la escuela');
  p.innerHTML =
    '<div class="hoja izq"><div class="panel vent"></div><div class="panel p1"></div><div class="panel p2"></div><div class="manija"></div></div>' +
    '<div class="hoja der"><div class="panel vent"></div><div class="panel p1"></div><div class="panel p2"></div><div class="manija"></div></div>' +
    '<div class="placa"><img src="logo.png" alt="Escudo de la escuela"><h1>Escuela Rafael Ramírez</h1><small>📚 Espacio educativo ✏️</small></div>' +
    '<button id="btnPuerta" type="button">👆 Toca aquí para entrar 🚪</button>';
  document.body.appendChild(p);
  document.documentElement.classList.add('bloqueado');

  document.getElementById('btnPuerta').addEventListener('click', function(){
    p.classList.add('abierta');
    setTimeout(function(){
      p.remove();
      document.documentElement.classList.remove('bloqueado');
    }, 1300);
  });
})();
