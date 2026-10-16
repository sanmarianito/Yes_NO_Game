/* ¿Sí o No? — lógica del juego, voz e historial. */
(function () {
  'use strict';

  var BANCOS = window.BANCOS;
  var Mates = window.Matematicas;
  var POR_RONDA = 10;
  var MAX_REPASO = 5;
  var MAX_FIGURAS = 2;

  var MUNDOS = [
    { id: 'cazadores', nombre: 'Animales cazadores', emoji: '🦁', extra: ['🦅', '🐺'], color: 'var(--m-cazadores)' },
    { id: 'mar', nombre: 'Animales del mar', emoji: '🐙', extra: ['🐠', '🐳'], color: 'var(--m-mar)' },
    { id: 'cielo', nombre: 'El cielo y la naturaleza', emoji: '🌈', extra: ['☀️', '🌳'], color: 'var(--m-cielo)' },
    { id: 'cuerpo', nombre: 'Mi cuerpo', emoji: '🧒', extra: ['👀', '🦷'], color: 'var(--m-cuerpo)' },
    { id: 'mates', nombre: 'Matemáticas', emoji: '🔢', extra: ['➕', '🍎'], color: 'var(--m-mates)' }
  ];

  var ELOGIOS = ['¡Muy bien!', '¡Excelente!', '¡Genial!', '¡Súper!', '¡Bravo!', '¡Qué chévere!',
    '¡Lo lograste!', '¡Perfecto!', '¡Bacano!', '¡Maravilloso!'];

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    pantallas: { menu: $('menu'), juego: $('juego'), final: $('final') },
    inicio: $('btn-inicio'), reiniciar: $('btn-reiniciar'), estrellas: $('total-estrellas'),
    listaMundos: $('lista-mundos'),
    progreso: $('progreso'), tarjeta: $('tarjeta'), repaso: $('repaso'), visual: $('visual'),
    pregunta: $('pregunta'), escuchar: $('btn-escuchar'), escucharRetro: $('btn-escuchar-retro'),
    respuestas: $('respuestas'), si: $('btn-si'), no: $('btn-no'),
    retro: $('retro'), retroTitulo: $('retro-titulo'), retroRespuesta: $('retro-respuesta'),
    retroWhy: $('retro-why'), siguiente: $('btn-siguiente'),
    finalMundo: $('final-mundo'), finalTitulo: $('final-titulo'), finalEstrellas: $('final-estrellas'),
    finalTexto: $('final-texto'), siguienteMundo: $('btn-siguiente-mundo'), siguienteEmoji: $('siguiente-emoji'),
    mundos: $('btn-mundos'),
    adultosTotal: $('adultos-total'), adultosLista: $('adultos-lista'),
    borrar: $('btn-borrar'), confirmar: $('confirmar'), borrarSi: $('btn-borrar-si'), borrarNo: $('btn-borrar-no'),
    borradoOk: $('borrado-ok'),
    confeti: $('confeti'), anuncio: $('anuncio')
  };

  function azar() { return Math.random(); }
  function barajar(lista) { return Mates.barajar(lista, azar); }
  function escoger(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
  function menosMovimiento() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ================= Historial (localStorage) ================= */
  var CLAVE = 'siono-historial-v1';

  function historialVacio() { return { estrellas: 0, mundos: {} }; }

  function cargar() {
    try {
      var texto = localStorage.getItem(CLAVE);
      var datos = texto ? JSON.parse(texto) : null;
      if (datos && typeof datos === 'object' && datos.mundos && typeof datos.mundos === 'object') {
        datos.estrellas = Number(datos.estrellas) || 0;
        return datos;
      }
    } catch (e) { /* almacenamiento bloqueado o dañado: se empieza de cero */ }
    return historialVacio();
  }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(hist)); } catch (e) { /* sin almacenamiento: el juego sigue */ }
  }

  function borrarHistorial() {
    try { localStorage.removeItem(CLAVE); } catch (e) { /* nada que hacer */ }
    hist = historialVacio();
  }

  var hist = cargar();

  function datosMundo(id) {
    var m = hist.mundos[id];
    if (!m || typeof m !== 'object') m = hist.mundos[id] = {};
    if (!Array.isArray(m.vistas)) m.vistas = [];
    if (!Array.isArray(m.falladas)) m.falladas = [];
    if (typeof m.jugadas !== 'number') m.jugadas = 0;
    return m;
  }

  function idDe(p) { return p.id || p.q; }

  /* ================= Voz ================= */
  var PREFERIDAS = ['es-us', 'es-mx', 'es-419', 'es-co', 'es-ar', 'es-cl', 'es-pe', 'es-ve'];
  var hayVoz = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  var voz = null;
  var vozActiva = false; // se activa con el primer toque
  var enCurso = null;    // referencia para que el navegador no la descarte

  function normalizar(lang) { return String(lang || '').replace(/_/g, '-').toLowerCase(); }

  function elegirVoz() {
    if (!hayVoz) return;
    var voces;
    try { voces = window.speechSynthesis.getVoices() || []; } catch (e) { voces = []; }
    var elegida = null;
    for (var i = 0; i < PREFERIDAS.length && !elegida; i++) {
      for (var j = 0; j < voces.length; j++) {
        if (normalizar(voces[j].lang) === PREFERIDAS[i]) { elegida = voces[j]; break; }
      }
    }
    if (!elegida) {
      elegida = voces.filter(function (v) {
        var l = normalizar(v.lang);
        return (l === 'es' || l.indexOf('es-') === 0) && l !== 'es-es';
      })[0] || null;
    }
    if (!elegida) {
      elegida = voces.filter(function (v) { return normalizar(v.lang) === 'es-es'; })[0] || null;
    }
    voz = elegida;
  }

  if (hayVoz) {
    elegirVoz();
    try {
      if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', elegirVoz);
      } else {
        window.speechSynthesis.onvoiceschanged = elegirVoz;
      }
    } catch (e) { /* algunos navegadores no tienen el evento */ }
  } else {
    el.escuchar.hidden = true;
    el.escucharRetro.hidden = true;
  }

  function callar() {
    if (!hayVoz) return;
    try { window.speechSynthesis.cancel(); } catch (e) { /* nada */ }
    el.escuchar.classList.remove('hablando');
  }

  function hablar(texto) {
    if (!hayVoz || !texto) return;
    try {
      var sintesis = window.speechSynthesis;
      if (sintesis.speaking || sintesis.pending) sintesis.cancel();
      if (!voz) elegirVoz();
      var u = new SpeechSynthesisUtterance(texto);
      u.voice = voz;
      u.lang = voz ? String(voz.lang).replace(/_/g, '-') : 'es-CO';
      u.rate = 0.88;
      u.pitch = 1.1;
      u.onstart = function () { el.escuchar.classList.add('hablando'); };
      u.onend = u.onerror = function () { if (enCurso === u) el.escuchar.classList.remove('hablando'); };
      enCurso = u;
      sintesis.speak(u);
    } catch (e) { /* sin voz, el juego sigue */ }
  }

  function activarVoz() { vozActiva = true; }
  document.addEventListener('pointerdown', activarVoz, { once: true, capture: true });
  document.addEventListener('keydown', activarVoz, { once: true, capture: true });

  /* ================= Sonidos cortos (Web Audio) ================= */
  var audio = null;
  function tono(notas) {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio = audio || new Ctx();
      if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime;
      notas.forEach(function (n, i) {
        var o = audio.createOscillator();
        var g = audio.createGain();
        o.type = 'triangle';
        o.frequency.value = n;
        g.gain.setValueAtTime(0.0001, t + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.09 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.22);
        o.connect(g); g.connect(audio.destination);
        o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.25);
      });
    } catch (e) { /* sin audio */ }
  }

  /* ================= Armado de rondas ================= */
  function rondaBanco(mundo) {
    var datos = datosMundo(mundo.id);
    var banco = BANCOS[mundo.id];
    var porId = {};
    banco.forEach(function (p) { porId[p.q] = p; });

    // Se descartan falladas que ya no existan en el banco.
    datos.falladas = datos.falladas.filter(function (id) { return typeof id === 'string' && porId[id]; });

    var repaso = barajar(datos.falladas).slice(0, MAX_REPASO).map(function (id) {
      return Object.assign({}, porId[id], { repaso: true });
    });
    var usadas = {};
    repaso.forEach(function (p) { usadas[p.q] = true; });

    var faltan = POR_RONDA - repaso.length;
    var vistas = {};
    datos.vistas.forEach(function (id) { vistas[id] = true; });
    var nuevas = barajar(banco.filter(function (p) { return !vistas[p.q] && !usadas[p.q]; })).slice(0, faltan);

    if (nuevas.length < faltan) {
      // Se acabaron las preguntas nuevas: se reinicia la lista de vistas de este mundo.
      datos.vistas = [];
      nuevas.forEach(function (p) { usadas[p.q] = true; });
      var resto = barajar(banco.filter(function (p) { return !usadas[p.q]; })).slice(0, faltan - nuevas.length);
      nuevas = nuevas.concat(resto);
      guardar();
    }
    return repaso.concat(nuevas);
  }

  function rondaMates() {
    var datos = datosMundo('mates');
    datos.falladas = datos.falladas.filter(function (p) {
      return p && typeof p === 'object' && typeof p.q === 'string' && typeof p.r === 'boolean';
    });
    var repaso = barajar(datos.falladas).slice(0, MAX_REPASO).map(function (p) {
      return Object.assign({}, p, { repaso: true });
    });
    var ids = {};
    repaso.forEach(function (p) { ids[idDe(p)] = true; });

    var cuantasFiguras = Math.min(Math.floor(Math.random() * (MAX_FIGURAS + 1)), POR_RONDA - repaso.length);
    var figurasRepaso = repaso.filter(function (p) { return !p.m; }).length;
    cuantasFiguras = Math.max(0, Math.min(cuantasFiguras, MAX_FIGURAS - figurasRepaso));
    var figuras = barajar(Mates.FIGURAS.filter(function (f) { return !ids[f.q]; })).slice(0, cuantasFiguras);

    var generadas = Mates.generadas(POR_RONDA - repaso.length - figuras.length, azar)
      .filter(function (p) { return !ids[p.id]; });
    while (repaso.length + figuras.length + generadas.length < POR_RONDA) {
      generadas = generadas.concat(Mates.generadas(1, azar));
    }
    return repaso.concat(barajar(figuras.concat(generadas)));
  }

  /* ================= Estado de la partida ================= */
  var partida = null;

  function mundoPorId(id) { return MUNDOS.filter(function (m) { return m.id === id; })[0]; }

  function empezar(mundo) {
    callar();
    partida = {
      mundo: mundo,
      preguntas: mundo.id === 'mates' ? rondaMates() : rondaBanco(mundo),
      i: 0,
      resultados: [],
      respondida: false
    };
    document.body.style.setProperty('--mundo', mundo.color);
    el.reiniciar.disabled = false;
    mostrar('juego');
    pintarProgreso();
    mostrarPregunta();
  }

  function mostrar(nombre) {
    delete document.body.dataset.respondida;
    document.body.dataset.pantalla = nombre;
    Object.keys(el.pantallas).forEach(function (k) { el.pantallas[k].hidden = k !== nombre; });
    window.scrollTo(0, 0);
  }

  function actual() { return partida.preguntas[partida.i]; }

  function mostrarPregunta() {
    var p = actual();
    partida.respondida = false;
    delete document.body.dataset.respondida;
    window.scrollTo(0, 0);
    el.tarjeta.classList.remove('fallo');
    el.repaso.hidden = !p.repaso;
    el.visual.replaceChildren(crearVisual(p));
    el.pregunta.textContent = p.q;
    el.retro.hidden = true;
    el.respuestas.hidden = false;
    el.si.disabled = false;
    el.no.disabled = false;
    pintarProgreso();
    el.pregunta.focus({ preventScroll: true });
    if (vozActiva) leerPregunta();
  }

  function textoPregunta() {
    var p = actual();
    return (p.repaso ? '¡Otra oportunidad! ' : '') + p.q;
  }

  function leerPregunta() { hablar(textoPregunta()); }

  function pintarProgreso() {
    var items = [];
    for (var k = 0; k < POR_RONDA; k++) {
      var li = document.createElement('li');
      var r = partida.resultados[k];
      var estado = r === true ? 'bien' : r === false ? 'mal' : k === partida.i ? 'actual' : '';
      if (estado) li.className = estado;
      li.setAttribute('aria-label', 'Pregunta ' + (k + 1) + (r === true ? ': bien' : r === false ? ': para repasar' : k === partida.i ? ': ahora' : ''));
      items.push(li);
    }
    el.progreso.replaceChildren.apply(el.progreso, items);
  }

  /* ================= Visuales ================= */
  function nodo(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function contarGrafemas(texto) {
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(texto)).length;
    }
    return Array.from(texto.replace(/️|‍/g, '')).length;
  }

  function crearVisual(p) {
    if (p.m) return visualMates(p);
    if (p.f) return visualFigura(p.f);
    var n = nodo('span', 'visual-emoji', p.a);
    if (contarGrafemas(p.a) > 1) n.classList.add('varios');
    return n;
  }

  function grupo(emoji, cantidad, grises, caja) {
    var g = nodo('div', 'grupo' + (caja ? ' caja' : ''));
    var tam = cantidad <= 4 ? 3.6 : cantidad <= 6 ? 3 : cantidad <= 9 ? 2.5 : 2;
    g.style.setProperty('--tam', tam + 'rem');
    for (var k = 0; k < cantidad; k++) {
      var s = nodo('span', k >= cantidad - (grises || 0) ? 'se-va' : '', emoji);
      g.appendChild(s);
    }
    return g;
  }

  function puntos(n) {
    var d = nodo('div', 'puntos');
    for (var k = 0; k < Math.min(n, 10); k++) d.appendChild(document.createElement('i'));
    return d;
  }

  function tarjetaNumero(n, extra) {
    var t = nodo('div', 'numero' + (extra ? ' ' + extra : ''));
    t.appendChild(nodo('span', 'numero-cifra', String(n)));
    if (n <= 10) t.appendChild(puntos(n));
    return t;
  }

  function flecha() {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'numero-flecha');
    var a = document.createElementNS(ns, 'path'); a.setAttribute('d', 'M4 12h15');
    var b = document.createElementNS(ns, 'path'); b.setAttribute('d', 'm13 6 6 6-6 6');
    s.appendChild(a); s.appendChild(b);
    return s;
  }

  function ecuacion(partes) {
    var e = nodo('div', 'ecuacion');
    partes.forEach(function (t, k) { e.appendChild(nodo('span', k === partes.length - 1 ? 'dicho' : '', t)); });
    return e;
  }

  function visualMates(p) {
    var m = p.m;
    var cont = nodo('div', 'mate');
    var fila = nodo('div', 'mate-fila');
    switch (m.t) {
      case 'contar':
        fila.appendChild(grupo(p.a, m.n));
        cont.appendChild(fila);
        break;
      case 'sumar':
        fila.appendChild(grupo(p.a, m.x, 0, true));
        fila.appendChild(nodo('span', 'signo', '+'));
        fila.appendChild(grupo(p.a, m.y, 0, true));
        cont.appendChild(fila);
        cont.appendChild(ecuacion([String(m.x), '+', String(m.y), '=', String(m.dicho)]));
        break;
      case 'restar':
        fila.appendChild(grupo(p.a, m.x, m.y));
        cont.appendChild(fila);
        cont.appendChild(ecuacion([String(m.x), '−', String(m.y), '=', String(m.dicho)]));
        break;
      case 'comparar':
        var nums = nodo('div', 'numeros');
        nums.appendChild(tarjetaNumero(m.x));
        nums.appendChild(tarjetaNumero(m.y));
        cont.appendChild(nums);
        break;
      case 'siguiente':
        var fila2 = nodo('div', 'numeros');
        fila2.appendChild(tarjetaNumero(m.n));
        fila2.appendChild(flecha());
        fila2.appendChild(tarjetaNumero(m.dicho, 'dicho'));
        cont.appendChild(fila2);
        break;
    }
    return cont;
  }

  function visualFigura(f) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 200 200');
    s.setAttribute('class', 'figura');
    var forma;
    if (f === 'triangulo') {
      forma = document.createElementNS(ns, 'path');
      forma.setAttribute('d', 'M100 18 186 176H14Z');
    } else if (f === 'cuadrado') {
      forma = document.createElementNS(ns, 'rect');
      forma.setAttribute('x', '24'); forma.setAttribute('y', '24');
      forma.setAttribute('width', '152'); forma.setAttribute('height', '152');
      forma.setAttribute('rx', '6');
    } else {
      forma = document.createElementNS(ns, 'circle');
      forma.setAttribute('cx', '100'); forma.setAttribute('cy', '100'); forma.setAttribute('r', '80');
    }
    s.appendChild(forma);
    return s;
  }

  /* ================= Responder ================= */
  function registrar(p, acierto) {
    var id = partida.mundo.id;
    var datos = datosMundo(id);
    var clave = idDe(p);
    if (id === 'mates') {
      datos.jugadas += 1;
      var k = -1;
      datos.falladas.forEach(function (f, n) { if (idDe(f) === clave) k = n; });
      if (acierto && k >= 0) datos.falladas.splice(k, 1);
      if (!acierto && k < 0) {
        var copia = Object.assign({}, p);
        delete copia.repaso;
        datos.falladas.push(copia);
      }
    } else {
      if (datos.vistas.indexOf(clave) < 0) datos.vistas.push(clave);
      var j = datos.falladas.indexOf(clave);
      if (acierto && j >= 0) datos.falladas.splice(j, 1);
      if (!acierto && j < 0) datos.falladas.push(clave);
    }
    if (acierto) hist.estrellas += 1;
    guardar();
  }

  function responder(valor) {
    if (!partida || partida.respondida || el.pantallas.juego.hidden) return;
    partida.respondida = true;
    var p = actual();
    var acierto = valor === p.r;
    partida.resultados[partida.i] = acierto;
    registrar(p, acierto);
    pintarEstrellas(acierto);
    pintarProgreso();

    el.si.disabled = true;
    el.no.disabled = true;

    var titulo = acierto ? escoger(ELOGIOS) : '¡Casi!';
    el.retro.className = 'retro ' + (acierto ? 'bien' : 'mal');
    el.retroTitulo.textContent = (acierto ? '🎉 ' : '') + titulo;
    el.retroRespuesta.hidden = acierto;
    el.retroRespuesta.className = 'retro-respuesta ' + (p.r ? 'es-si' : 'es-no');
    el.retroRespuesta.textContent = p.r ? 'Era SÍ ✓' : 'Era NO ✗';
    el.retroWhy.textContent = p.why;
    el.respuestas.hidden = true;
    el.retro.hidden = false;
    document.body.dataset.respondida = '1';

    if (acierto) {
      tono([660, 880, 1175]);
      confeti();
    } else {
      tono([330, 262]);
      // Reiniciar la animación aunque la clase ya estuviera.
      el.tarjeta.classList.remove('fallo');
      void el.tarjeta.offsetWidth;
      el.tarjeta.classList.add('fallo');
    }

    var dicho = titulo + ' ' + (acierto ? '' : 'La respuesta es ' + (p.r ? 'sí' : 'no') + '. ') + p.why;
    el.anuncio.textContent = dicho;
    hablar(dicho);
    el.siguiente.focus({ preventScroll: true });
    // En pantallas bajitas, bajar hasta que Siguiente quede a la vista.
    el.retro.scrollIntoView({ block: 'end', behavior: menosMovimiento() ? 'auto' : 'smooth' });
  }

  function siguiente() {
    if (!partida || !partida.respondida) return;
    partida.i += 1;
    if (partida.i >= partida.preguntas.length) terminar();
    else mostrarPregunta();
  }

  /* ================= Final ================= */
  function terminar() {
    var ganadas = partida.resultados.filter(Boolean).length;
    var mundo = partida.mundo;
    var idx = MUNDOS.indexOf(mundo);
    var proximo = MUNDOS[(idx + 1) % MUNDOS.length];

    var titulo = ganadas >= 9 ? '¡Lo hiciste genial!' : ganadas >= 6 ? '¡Muy buen trabajo!' : '¡Bien hecho! Sigue practicando';
    el.finalMundo.textContent = mundo.emoji;
    el.finalTitulo.textContent = titulo;
    el.finalTexto.textContent = 'Ganaste ' + ganadas + (ganadas === 1 ? ' estrella' : ' estrellas');
    el.siguienteEmoji.textContent = proximo.emoji;
    el.siguienteMundo.setAttribute('aria-label', 'Siguiente mundo: ' + proximo.nombre);

    var items = [];
    for (var k = 0; k < POR_RONDA; k++) {
      var li = nodo('li', k < ganadas ? 'llena' : 'vacia', '⭐');
      li.style.setProperty('--i', k);
      items.push(li);
    }
    el.finalEstrellas.replaceChildren.apply(el.finalEstrellas, items);

    mostrar('final');
    el.finalTitulo.focus({ preventScroll: true });
    if (ganadas > 0) { tono([523, 659, 784, 1047]); confeti(); }
    hablar(titulo + '. ' + el.finalTexto.textContent + '.');
  }

  /* ================= Menú ================= */
  function irAlMenu() {
    callar();
    partida = null;
    el.reiniciar.disabled = true;
    document.body.style.removeProperty('--mundo');
    pintarAdultos();
    mostrar('menu');
  }

  function pintarMenu() {
    var items = MUNDOS.map(function (m) {
      var li = document.createElement('li');
      var b = nodo('button', 'btn mundo');
      b.type = 'button';
      b.style.setProperty('--c', m.color);
      b.setAttribute('aria-label', m.nombre);
      var arte = nodo('span', 'mundo-arte');
      arte.setAttribute('aria-hidden', 'true');
      arte.appendChild(nodo('span', 'mundo-emoji', m.emoji));
      arte.appendChild(nodo('span', 'mundo-extra uno', m.extra[0]));
      arte.appendChild(nodo('span', 'mundo-extra dos', m.extra[1]));
      b.appendChild(arte);
      var nom = nodo('span', 'mundo-nombre', m.nombre);
      nom.setAttribute('aria-hidden', 'true');
      b.appendChild(nom);
      b.addEventListener('click', function () { empezar(m); });
      li.appendChild(b);
      return li;
    });
    el.listaMundos.replaceChildren.apply(el.listaMundos, items);
  }

  function pintarEstrellas(sumo) {
    el.estrellas.textContent = String(hist.estrellas);
    var cont = el.estrellas.parentNode;
    cont.setAttribute('aria-label', hist.estrellas + (hist.estrellas === 1 ? ' estrella ganada' : ' estrellas ganadas'));
    if (sumo) {
      cont.classList.remove('sube');
      void cont.offsetWidth;
      cont.classList.add('sube');
    }
  }

  function pintarAdultos() {
    var totalVistas = 0, totalRepaso = 0;
    var filas = MUNDOS.map(function (m) {
      var d = datosMundo(m.id);
      var vistas = m.id === 'mates' ? d.jugadas : d.vistas.length;
      totalVistas += vistas;
      totalRepaso += d.falladas.length;
      var detalle = m.id === 'mates'
        ? vistas + (vistas === 1 ? ' pregunta jugada' : ' preguntas jugadas')
        : vistas + ' de ' + BANCOS[m.id].length + ' ya salieron';
      return nodo('li', '', m.nombre + ': ' + detalle + ', ' + d.falladas.length + ' por repasar.');
    });
    el.adultosTotal.textContent = 'Preguntas que ya salieron: ' + totalVistas + '. Faltan por repasar: ' + totalRepaso + '.';
    el.adultosLista.replaceChildren.apply(el.adultosLista, filas);
  }

  /* ================= Confeti ================= */
  var COLORES = ['#FFC63A', '#189447', '#DD3434', '#4F7DF3', '#EE5F98', '#12A3B4', '#8F5EF0', '#F28A26'];
  function confeti() {
    if (menosMovimiento()) return;
    var piezas = document.createDocumentFragment();
    for (var k = 0; k < 42; k++) {
      var s = nodo('span', 'papelito' + (k % 3 === 0 ? ' redondo' : ''));
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.background = COLORES[k % COLORES.length];
      s.style.setProperty('--dx', ((Math.random() - 0.5) * 40) + 'vw');
      s.style.setProperty('--giro', ((Math.random() - 0.5) * 1440) + 'deg');
      s.style.setProperty('--dur', (1.4 + Math.random() * 1.1) + 's');
      s.style.setProperty('--delay', (Math.random() * 0.25) + 's');
      piezas.appendChild(s);
    }
    el.confeti.appendChild(piezas);
    setTimeout(function () { el.confeti.replaceChildren(); }, 3000);
  }

  /* ================= Eventos ================= */
  el.inicio.addEventListener('click', irAlMenu);
  el.reiniciar.addEventListener('click', function () { if (partida) empezar(partida.mundo); });
  el.si.addEventListener('click', function () { responder(true); });
  el.no.addEventListener('click', function () { responder(false); });
  el.siguiente.addEventListener('click', siguiente);
  el.escucharRetro.addEventListener('click', function () { hablar(el.anuncio.textContent); });
  el.escuchar.addEventListener('click', function () {
    if (!partida) return;
    if (partida.respondida) hablar(el.anuncio.textContent);
    else leerPregunta();
  });
  el.siguienteMundo.addEventListener('click', function () {
    var idx = MUNDOS.indexOf(partida.mundo);
    empezar(MUNDOS[(idx + 1) % MUNDOS.length]);
  });
  el.mundos.addEventListener('click', irAlMenu);

  el.borrar.addEventListener('click', function () {
    el.confirmar.hidden = false;
    el.borrar.hidden = true;
    el.borradoOk.textContent = '';
    el.borrarNo.focus();
  });
  el.borrarNo.addEventListener('click', function () {
    el.confirmar.hidden = true;
    el.borrar.hidden = false;
    el.borrar.focus();
  });
  el.borrarSi.addEventListener('click', function () {
    borrarHistorial();
    el.confirmar.hidden = true;
    el.borrar.hidden = false;
    pintarEstrellas(false);
    pintarAdultos();
    el.borradoOk.textContent = 'Historial borrado.';
    el.borrar.focus();
  });

  // Atajos de teclado: S = sí, N = no.
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || !partida || el.pantallas.juego.hidden) return;
    var k = e.key.toLowerCase();
    if (k === 's' && !partida.respondida) { e.preventDefault(); responder(true); }
    if (k === 'n' && !partida.respondida) { e.preventDefault(); responder(false); }
  });

  /* ================= Inicio ================= */
  pintarMenu();
  pintarEstrellas(false);
  pintarAdultos();
})();
