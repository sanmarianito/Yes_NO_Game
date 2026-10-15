/* Verificación del contenido. Uso: node pruebas/verificar.js
   1. Genera 20.000 preguntas de matemáticas y recalcula la respuesta por separado.
   2. Revisa los bancos fijos: cantidad, duplicadas, campos y porcentaje de "No". */
'use strict';
const path = require('path');
const BANCOS = require(path.join(__dirname, '..', 'js', 'bancos.js'));
const Mates = require(path.join(__dirname, '..', 'js', 'matematicas.js'));

let fallos = 0;
const falla = (msg) => { fallos++; if (fallos <= 20) console.error('  ✗ ' + msg); };

// Generador con semilla para que la prueba sea repetible.
function semilla(s) {
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Cálculo independiente: lee los números del TEXTO de la pregunta, no del objeto m.
function verdadSegunTexto(p) {
  const n = (p.q.match(/\d+/g) || []).map(Number);
  switch (p.m.t) {
    case 'contar': return { ok: n[0] === p.m.n, nums: [p.m.dicho], ref: n };
    case 'sumar': return { ok: n[0] + n[1] === n[2], nums: [p.m.x, p.m.y, p.m.dicho], ref: n };
    case 'restar': return { ok: n[0] - n[1] === n[2], nums: [p.m.x, p.m.y, p.m.dicho], ref: n };
    case 'comparar': {
      const mayor = /más grande/.test(p.q);
      return { ok: mayor ? n[0] > n[1] : n[0] < n[1], nums: [p.m.x, p.m.y], ref: n };
    }
    case 'siguiente': return { ok: n[1] === n[0] + 1, nums: [p.m.n, p.m.dicho], ref: n };
  }
  throw new Error('tipo ' + p.m.t);
}

console.log('\n== Matemáticas: 20.000 preguntas ==');
const rnd = semilla(2026);
const TOTAL = 20000;
const porTipo = {};
let si = 0, coinciden = 0;
for (let k = 0; k < TOTAL; k++) {
  const tipo = Mates.TIPOS[k % Mates.TIPOS.length];
  const p = Mates.crear(tipo, rnd() < 0.5, rnd);
  const t = verdadSegunTexto(p);
  porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  if (p.r) si++;

  // El texto debe mostrar exactamente los números del objeto.
  if (JSON.stringify(t.ref) !== JSON.stringify(t.nums)) falla(`texto y datos no coinciden: "${p.q}" ${JSON.stringify(p.m)}`);
  if (t.ok === p.r) coinciden++; else falla(`r=${p.r} pero el cálculo da ${t.ok}: "${p.q}"`);

  // Rangos pedidos.
  const m = p.m;
  if (tipo === 'contar' && (m.n < 2 || m.n > 9)) falla('contar fuera de 2..9: ' + m.n);
  if (tipo === 'sumar' && m.x + m.y > 18) falla('suma mayor que 18: ' + p.q);
  if (tipo === 'restar' && (m.x - m.y < 1 || !/^Hay \d+ .+ \d+\. ¿Qued/.test(p.q))) falla('resta sin historia o sin resultado: ' + p.q);
  if (typeof p.why !== 'string' || !p.why) falla('sin explicación: ' + p.q);
}
console.log(`  Tipos: ${JSON.stringify(porTipo)}`);
console.log(`  r coincide con el cálculo: ${coinciden}/${TOTAL} (${(100 * coinciden / TOTAL).toFixed(2)} %)`);
console.log(`  Respuestas "Sí": ${(100 * si / TOTAL).toFixed(1)} %`);

// Rondas: mitad Sí y mitad No.
let desbalance = 0;
for (let k = 0; k < 2000; k++) {
  const ronda = Mates.generadas(10, rnd);
  const s = ronda.filter((p) => p.r).length;
  if (s !== 5) desbalance++;
  ronda.forEach((p) => { if (Mates.calcular(p.m) !== p.r) falla('ronda con r incorrecto'); });
}
console.log(`  Rondas de 10 con 5 Sí y 5 No: ${2000 - desbalance}/2000`);
if (desbalance) falla(desbalance + ' rondas desbalanceadas');

console.log(`  Figuras fijas: ${Mates.FIGURAS.length}`);

console.log('\n== Bancos fijos ==');
const todas = new Map();
for (const [mundo, banco] of Object.entries(BANCOS)) {
  const vistas = new Set();
  let no = 0, dup = 0;
  banco.forEach((p, i) => {
    if (typeof p.a !== 'string' || !p.a) falla(`${mundo}[${i}] sin imagen`);
    if (typeof p.q !== 'string' || !/^¿.+\?$/.test(p.q)) falla(`${mundo}[${i}] pregunta mal formada: ${p.q}`);
    if (typeof p.r !== 'boolean') falla(`${mundo}[${i}] r no es booleano`);
    if (typeof p.why !== 'string' || p.why.length < 5) falla(`${mundo}[${i}] sin explicación`);
    if (vistas.has(p.q)) { dup++; falla(`${mundo}: duplicada "${p.q}"`); }
    vistas.add(p.q);
    if (todas.has(p.q)) falla(`"${p.q}" repetida en ${todas.get(p.q)} y ${mundo}`);
    todas.set(p.q, mundo);
    if (!p.r) no++;
  });
  const pct = 100 * no / banco.length;
  console.log(`  ${mundo.padEnd(10)} ${banco.length} preguntas · duplicadas: ${dup} · "No": ${no} (${pct.toFixed(1)} %)`);
  if (banco.length !== 160) falla(`${mundo} tiene ${banco.length} preguntas, no 160`);
  if (no !== 64) falla(`${mundo} tiene ${no} "No", no 64 (40 %)`);
}

console.log(fallos ? `\n✗ ${fallos} problema(s)\n` : '\n✓ Todo en orden\n');
process.exit(fallos ? 1 : 0);
