/* Prueba en navegador con Playwright: capturas a 360, 390 y 1280 px,
   scroll horizontal, errores de consola y flujo de una ronda completa.
   Uso: npm i -D playwright && npx playwright install chromium && node pruebas/navegador.js */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..');
const URL = 'file://' + path.join(RAIZ, 'index.html');
const SALIDA = path.join(__dirname, 'capturas');
fs.mkdirSync(SALIDA, { recursive: true });

const problemas = [];

async function sinScrollHorizontal(page, donde) {
  const { ancho, visible } = await page.evaluate(() => ({
    ancho: document.documentElement.scrollWidth,
    visible: document.documentElement.clientWidth
  }));
  if (ancho > visible) problemas.push(`${donde}: scroll horizontal (${ancho} > ${visible})`);
}

async function foto(page, nombre, donde) {
  await page.waitForTimeout(450);
  await sinScrollHorizontal(page, donde);
  await page.screenshot({ path: path.join(SALIDA, nombre + '.png'), fullPage: true });
}

async function probar(ancho, alto, esquema) {
  const etiqueta = `${ancho}px${esquema === 'dark' ? '-oscuro' : ''}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: ancho, height: alto },
    colorScheme: esquema,
    reducedMotion: 'reduce',
    hasTouch: ancho < 800,
    isMobile: ancho < 800
  });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') problemas.push(`${etiqueta} consola: ${m.text()}`); });
  page.on('pageerror', (e) => problemas.push(`${etiqueta} error JS: ${e.message}`));

  await page.goto(URL);
  await page.waitForLoadState('networkidle').catch(() => {});
  await foto(page, `${etiqueta}-1-menu`, `${etiqueta} menú`);

  // Ronda de "Animales cazadores": se responde siempre NO para dejar falladas.
  await page.getByRole('button', { name: 'Animales cazadores' }).click();
  await foto(page, `${etiqueta}-2-pregunta`, `${etiqueta} pregunta`);
  for (let k = 0; k < 10; k++) {
    await page.locator('#btn-no').click();
    if (k === 0) await foto(page, `${etiqueta}-3-respuesta`, `${etiqueta} respuesta`);
    await page.locator('#btn-siguiente').click();
  }
  await foto(page, `${etiqueta}-4-final`, `${etiqueta} final`);

  // Ronda nueva con ↺: deben salir primero las falladas (máx. 5) con "¡Otra oportunidad!".
  await page.locator('#btn-reiniciar').click();
  let repasos = 0;
  for (let k = 0; k < 10; k++) {
    const visible = await page.locator('#repaso').isVisible();
    if (visible) repasos++;
    if (k === 0) {
      if (!visible) problemas.push(`${etiqueta}: la primera pregunta tras fallar no es de repaso`);
      await foto(page, `${etiqueta}-5-repaso`, `${etiqueta} repaso`);
    }
    await page.locator('#btn-si').click();
    await page.locator('#btn-siguiente').click();
  }
  if (repasos < 1 || repasos > 5) problemas.push(`${etiqueta}: ${repasos} preguntas de repaso (esperado 1 a 5)`);

  // Matemáticas: varias preguntas para ver los visuales.
  await page.locator('#btn-inicio').click();
  await page.getByRole('button', { name: 'Matemáticas' }).click();
  for (let k = 0; k < 4; k++) {
    await foto(page, `${etiqueta}-6-mates-${k + 1}`, `${etiqueta} matemáticas ${k + 1}`);
    await page.locator('#btn-si').click();
    await page.locator('#btn-siguiente').click();
  }

  // Para adultos + confirmación de borrado dentro de la página.
  await page.locator('#btn-inicio').click();
  await page.locator('#adultos summary').click();
  await page.locator('#btn-borrar').click();
  await foto(page, `${etiqueta}-7-adultos`, `${etiqueta} adultos`);
  const resumen = await page.locator('#adultos-total').textContent();
  await page.locator('#btn-borrar-si').click();
  const estrellas = await page.locator('#total-estrellas').textContent();
  if (estrellas !== '0') problemas.push(`${etiqueta}: después de borrar quedan ${estrellas} estrellas`);
  console.log(`  ${etiqueta}: ${resumen.trim()} → borrado OK`);

  await browser.close();
}

(async () => {
  console.log('Probando en Chromium…');
  await probar(390, 844, 'light');
  await probar(1280, 800, 'light');
  await probar(360, 740, 'light');
  await probar(390, 844, 'dark');
  console.log(`Capturas en ${path.relative(RAIZ, SALIDA)}/`);
  if (problemas.length) {
    console.log('\n✗ Problemas:\n' + problemas.map((p) => '  - ' + p).join('\n'));
    process.exit(1);
  }
  console.log('\n✓ Sin scroll horizontal ni errores de consola');
})();
