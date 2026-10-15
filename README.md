# ¿Sí o No?

Juego web de verdadero o falso para niñas y niños de 5 años que todavía no leen. Las preguntas se leen en voz alta y se responden con dos botones gigantes: SÍ y NO.

- 5 mundos: animales cazadores, animales del mar, el cielo y la naturaleza, mi cuerpo y matemáticas.
- Rondas de 10 preguntas. Las que se fallan vuelven en la siguiente ronda como "¡Otra oportunidad!".
- Las preguntas de matemáticas se generan por código y la respuesta siempre se calcula.
- Funciona en celular, tablet y computador, con modo claro y oscuro.

## Cómo jugar

Abre `index.html` en el navegador. No necesita instalación ni servidor.

## Pruebas

```bash
node pruebas/verificar.js
```

Revisa 20.000 preguntas de matemáticas y los bancos fijos (cantidad, duplicadas y porcentaje de "No").

```bash
npm i -D playwright && npx playwright install chromium && node pruebas/navegador.js
```

Toma capturas a 360, 390 y 1280 px y revisa que no haya scroll horizontal ni errores de consola.
