/* Generador de preguntas de matemáticas.
   La respuesta r nunca se escribe: siempre sale de calcular(m), que compara
   lo que dice la pregunta con la cuenta real. */
(function (raiz) {
  'use strict';

  var OBJETOS = [
    { e: '🍎', s: 'manzana', p: 'manzanas' },
    { e: '🐥', s: 'pollito', p: 'pollitos' },
    { e: '⭐', s: 'estrella', p: 'estrellas' },
    { e: '🐞', s: 'mariquita', p: 'mariquitas' },
    { e: '🌸', s: 'flor', p: 'flores' },
    { e: '🚗', s: 'carro', p: 'carros' },
    { e: '🐟', s: 'pez', p: 'peces' },
    { e: '🍓', s: 'fresa', p: 'fresas' },
    { e: '⚽', s: 'balón', p: 'balones' },
    { e: '🐢', s: 'tortuga', p: 'tortugas' },
    { e: '🧁', s: 'ponquecito', p: 'ponquecitos' },
    { e: '🦋', s: 'mariposa', p: 'mariposas' }
  ];

  // Historias para restar: lo que "se va" se pinta en gris.
  var HISTORIAS = [
    { e: '🎈', p: 'globos', uno: 'se va volando', varios: 'se van volando' },
    { e: '🐦', p: 'pajaritos', uno: 'se va volando', varios: 'se van volando' },
    { e: '🦋', p: 'mariposas', uno: 'se va volando', varios: 'se van volando' },
    { e: '🐟', p: 'peces', uno: 'se va nadando', varios: 'se van nadando' },
    { e: '🐸', p: 'ranas', uno: 'se va saltando', varios: 'se van saltando' },
    { e: '🍪', p: 'galletas', uno: 'te comes', varios: 'te comes' },
    { e: '🐥', p: 'pollitos', uno: 'se va corriendo', varios: 'se van corriendo' }
  ];

  // Preguntas fijas de figuras (máximo 2 por ronda).
  var FIGURAS = [
    { a: '🔺', f: 'triangulo', q: '¿El triángulo tiene tres lados?', r: true, why: 'El triángulo tiene 3 lados y 3 esquinas.' },
    { a: '🔺', f: 'triangulo', q: '¿El triángulo tiene cuatro esquinas?', r: false, why: 'El triángulo tiene 3 esquinas.' },
    { a: '🟦', f: 'cuadrado', q: '¿El cuadrado tiene cuatro lados?', r: true, why: 'El cuadrado tiene 4 lados iguales.' },
    { a: '🟦', f: 'cuadrado', q: '¿El cuadrado tiene cinco lados?', r: false, why: 'El cuadrado tiene 4 lados.' },
    { a: '⚪', f: 'circulo', q: '¿El círculo tiene esquinas?', r: false, why: 'El círculo es redondo: no tiene esquinas.' },
    { a: '🕷️', q: '¿La araña tiene ocho patas?', r: true, why: 'La araña tiene 8 patas: 4 a cada lado.' },
    { a: '🦋', q: '¿La mariposa tiene ocho patas?', r: false, why: 'La mariposa es un insecto: tiene 6 patas.' },
    { a: '🐔', q: '¿La gallina tiene dos patas?', r: true, why: 'Las aves tienen 2 patas.' },
    { a: '🐶', q: '¿El perro tiene cuatro patas?', r: true, why: 'El perro tiene 4 patas.' },
    { a: '⭐', q: '¿Esta estrella tiene cinco puntas?', r: true, why: 'Cuenta las puntas: 1, 2, 3, 4, 5.' }
  ];

  var TIPOS = ['contar', 'sumar', 'restar', 'comparar', 'siguiente'];

  function entero(min, max, rnd) { return min + Math.floor(rnd() * (max - min + 1)); }
  function escoger(lista, rnd) { return lista[Math.floor(rnd() * lista.length)]; }
  function barajar(lista, rnd) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // La única fuente de verdad: compara lo dicho con la cuenta.
  function calcular(m) {
    switch (m.t) {
      case 'contar': return m.dicho === m.n;
      case 'sumar': return m.dicho === m.x + m.y;
      case 'restar': return m.dicho === m.x - m.y;
      case 'comparar': return m.rel === 'mayor' ? m.x > m.y : m.x < m.y;
      case 'siguiente': return m.dicho === m.n + 1;
    }
    throw new Error('Tipo desconocido: ' + m.t);
  }

  // Un número cercano al real (±1 o ±2) dentro del rango, para preguntas "No".
  function cercano(real, min, max, rnd) {
    var opciones = [real - 1, real + 1, real - 2, real + 2].filter(function (v) {
      return v >= min && v <= max;
    });
    return escoger(opciones, rnd);
  }

  function nombre(cant, obj) { return cant === 1 ? obj.s : obj.p; }

  function crear(tipo, quiereSi, rnd) {
    var m, q, why, e;
    switch (tipo) {
      case 'contar': {
        var o = escoger(OBJETOS, rnd);
        var n = entero(2, 9, rnd);
        var dicho = quiereSi ? n : cercano(n, 2, 10, rnd);
        m = { t: 'contar', n: n, dicho: dicho };
        e = o.e;
        q = '¿Hay ' + dicho + ' ' + nombre(dicho, o) + '?';
        why = 'Hay ' + n + ' ' + nombre(n, o) + '. Cuenta: ' + contarHasta(n) + '.';
        break;
      }
      case 'sumar': {
        var o2 = escoger(OBJETOS, rnd);
        var x = entero(1, 9, rnd);
        var y = entero(1, 9, rnd);
        var suma = x + y;
        var dichoS = quiereSi ? suma : cercano(suma, 2, 18, rnd);
        m = { t: 'sumar', x: x, y: y, dicho: dichoS };
        e = o2.e;
        q = '¿' + x + ' más ' + y + ' son ' + dichoS + '?';
        why = x + ' más ' + y + ' son ' + suma + '.';
        break;
      }
      case 'restar': {
        var h = escoger(HISTORIAS, rnd);
        var total = entero(3, 9, rnd);
        var van = entero(1, total - 1, rnd);
        var quedan = total - van;
        var dichoR = quiereSi ? quedan : cercano(quedan, 1, total, rnd);
        m = { t: 'restar', x: total, y: van, dicho: dichoR };
        e = h.e;
        q = 'Hay ' + total + ' ' + h.p + ' y ' + (van === 1 ? h.uno : h.varios) + ' ' + van + '. ' +
          (dichoR === 1 ? '¿Queda 1?' : '¿Quedan ' + dichoR + '?');
        why = total + ' menos ' + van + ' son ' + quedan + '.';
        break;
      }
      case 'comparar': {
        var a = entero(1, 9, rnd);
        var b;
        do { b = entero(1, 9, rnd); } while (b === a);
        var rel = rnd() < 0.5 ? 'mayor' : 'menor';
        var grande = Math.max(a, b), chico = Math.min(a, b);
        // Se ordena para que la afirmación sea cierta o falsa según se pidió.
        var primero = (rel === 'mayor') === quiereSi ? grande : chico;
        var segundo = primero === grande ? chico : grande;
        m = { t: 'comparar', x: primero, y: segundo, rel: rel };
        e = '●';
        q = '¿El ' + primero + ' es más ' + (rel === 'mayor' ? 'grande' : 'pequeño') + ' que el ' + segundo + '?';
        why = rel === 'mayor'
          ? 'El ' + grande + ' es más grande que el ' + chico + '.'
          : 'El ' + chico + ' es más pequeño que el ' + grande + '.';
        break;
      }
      case 'siguiente': {
        var num = entero(1, 19, rnd);
        var dichoN = quiereSi ? num + 1 : escoger([num + 2, num + 3, num - 1].filter(function (v) { return v >= 1; }), rnd);
        m = { t: 'siguiente', n: num, dicho: dichoN };
        e = '🔢';
        q = '¿Después del ' + num + ' viene el ' + dichoN + '?';
        why = 'Después del ' + num + ' viene el ' + (num + 1) + '.';
        break;
      }
      default:
        throw new Error('Tipo desconocido: ' + tipo);
    }
    return { id: JSON.stringify(m) + e, a: e, q: q, r: calcular(m), why: why, m: m };
  }

  function contarHasta(n) {
    var partes = [];
    for (var i = 1; i <= n; i++) partes.push(i);
    return partes.join(', ');
  }

  // Ronda de matemáticas: `cuantas` generadas, mitad Sí y mitad No, tipos variados.
  function generadas(cuantas, rnd) {
    var mitad = Math.floor(cuantas / 2);
    var respuestas = [];
    for (var i = 0; i < cuantas; i++) respuestas.push(i < mitad);
    if (cuantas % 2 === 1 && rnd() < 0.5) respuestas[mitad] = true;
    respuestas = barajar(respuestas, rnd);
    var tipos = [];
    while (tipos.length < cuantas) tipos = tipos.concat(barajar(TIPOS, rnd));
    var lista = [], ids = {};
    for (var k = 0; k < cuantas; k++) {
      var p, intentos = 0;
      do { p = crear(tipos[k], respuestas[k], rnd); intentos++; } while (ids[p.id] && intentos < 20);
      ids[p.id] = true;
      lista.push(p);
    }
    return lista;
  }

  var Matematicas = {
    TIPOS: TIPOS, FIGURAS: FIGURAS, OBJETOS: OBJETOS, HISTORIAS: HISTORIAS,
    calcular: calcular, crear: crear, generadas: generadas, barajar: barajar
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Matematicas;
  else raiz.Matematicas = Matematicas;
})(this);
