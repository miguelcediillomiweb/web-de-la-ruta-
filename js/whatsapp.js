// WhatsApp: botón flotante, botones de interés y ventana de mensaje.
(function(){
const NUMERO=(typeof CONFIG!=='undefined'&&CONFIG.WHATSAPP_NUMERO)||'';
const seleccion=new Map();
try{JSON.parse(sessionStorage.getItem('gp-intereses')||'[]').forEach(x=>seleccion.set(x.clave,x))}catch(e){}
const crear=(tag,clase,texto)=>{const e=document.createElement(tag);if(clase)e.className=clase;if(texto!=null)e.textContent=texto;return e};
const lineaProducto=(d,separador='; ')=>d.detalles.length<=1?d.titulo+(d.detalles[0]?' ('+d.detalles[0]+')':''):d.titulo+': '+(separador==='; '? '' : separador)+d.detalles.join(separador);
const ventana=crear('dialog','ventana ventana-wa'),cerrar=crear('button','x','×');cerrar.setAttribute('aria-label','Cerrar');
const listaTitulo=crear('p','wa-lista-titulo','Productos que me interesan'),lista=crear('ul','wa-lista'),vacio=crear('p','wa-vacio','Aún no has marcado productos. Toca 👍 en las tarjetas que te interesen.');
const texto=document.createElement('textarea');texto.placeholder='Escribe tu mensaje (opcional)…';texto.setAttribute('aria-label','Tu mensaje');
const enviar=crear('button','btn','Enviar por WhatsApp');enviar.type='button';
ventana.append(cerrar,crear('h2','','Escríbenos por WhatsApp'),crear('p','wa-ayuda','Cuéntanos qué te interesa y te respondemos por WhatsApp.'),listaTitulo,lista,vacio,texto,enviar);document.body.append(ventana);
cerrar.addEventListener('click',()=>ventana.close());ventana.addEventListener('click',e=>{if(e.target===ventana)ventana.close()});
const flotante=crear('button','wa-flotante');flotante.type='button';flotante.setAttribute('aria-label','Escríbenos por WhatsApp');
const icono=crear('span','','💬');icono.setAttribute('aria-hidden','true');const contador=crear('span','wa-contador','0');flotante.append(icono,contador);document.body.append(flotante);
flotante.addEventListener('click',()=>{dibujarLista();ventana.showModal()});
const guardar=()=>{try{sessionStorage.setItem('gp-intereses',JSON.stringify([...seleccion.values()]))}catch(e){}};
function dibujarLista(){lista.replaceChildren(...[...seleccion.values()].map(d=>{const li=crear('li','',lineaProducto(d)),quitar=crear('button','wa-quitar','✕');quitar.type='button';quitar.setAttribute('aria-label','Quitar '+d.titulo);quitar.addEventListener('click',()=>{seleccion.delete(d.clave);guardar();refrescar()});li.append(quitar);return li}));const hay=seleccion.size>0;listaTitulo.style.display=lista.style.display=hay?'':'none';vacio.style.display=hay?'none':''}
function refrescar(){contador.textContent=seleccion.size;contador.style.display=seleccion.size?'':'none';document.querySelectorAll('.btn-interes').forEach(b=>b._pintar&&b._pintar());if(ventana.open)dibujarLista()}
enviar.addEventListener('click',()=>{if(!NUMERO){alert('Falta configurar el número de WhatsApp.');return}let mensaje='Hola, visité la web de Grupo Peñafiel.';if(seleccion.size)mensaje+='\nMe interesan estos productos:\n'+[...seleccion.values()].map(d=>'• '+lineaProducto(d,'\n   – ')).join('\n');const extra=texto.value.trim();if(extra)mensaje+='\n\n'+extra;window.open('https://wa.me/'+String(NUMERO).replace(/\D/g,'')+'?text='+encodeURIComponent(mensaje),'_blank','noopener')});
function datosTarjeta(card){const titulo=(card.querySelector('h3')?.textContent||'').trim();const detalles=[...card.querySelectorAll('.variante-nombre strong')].map(s=>s.textContent.trim()).filter(Boolean);return{clave:(titulo+'|'+detalles.join('|')).toLowerCase(),titulo,detalles}}
function ponerManita(card){if(card.querySelector(':scope > .btn-interes'))return;const d=datosTarjeta(card);if(!d.titulo)return;const b=crear('button','btn-interes');b.type='button';b._pintar=()=>{const activo=seleccion.has(d.clave);b.classList.toggle('activo',activo);b.setAttribute('aria-pressed',String(activo));b.textContent=activo?'👍 ¡Me interesa!':'👍 Me interesa'};b.addEventListener('click',()=>{if(seleccion.has(d.clave))seleccion.delete(d.clave);else seleccion.set(d.clave,d);guardar();refrescar()});b._pintar();card.prepend(b)}
const revisar=n=>{if(n.nodeType!==1)return;if(n.matches('.tarjeta'))ponerManita(n);n.querySelectorAll&&n.querySelectorAll('.tarjeta').forEach(ponerManita)};
new MutationObserver(cs=>cs.forEach(c=>c.addedNodes.forEach(revisar))).observe(document.body,{childList:true,subtree:true});
document.querySelectorAll('.tarjeta').forEach(ponerManita);refrescar()
})();