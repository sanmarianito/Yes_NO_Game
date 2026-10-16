# Design Engineering Audit: ¿Sí o No? (juego para preescolar)

**Perspective**: Design Engineer
**Date**: 2026-10-16
**Plan**: no hay plan escrito; se auditó la implementación publicada (commit `d36df46`): `index.html`, `css/estilos.css`, `js/juego.js`

## Plan Summary
Juego de sí/no con estilo "caja de juguetes": contornos gruesos de tinta, sombras duras de botón presionable, un color por mundo, modo claro y oscuro, y animaciones de acierto o fallo. Para la auditoría medí contrastes con la fórmula WCAG y la posición de los botones con Playwright en 5 tamaños de pantalla.

## Files Reviewed
| File | Visual Role | Risk |
|------|-------------|------|
| `css/estilos.css` | Tokens, componentes, estados, movimiento, modo oscuro | Alto: el modo oscuro y el layout tras responder |
| `js/juego.js` | Construye visuales (emojis, matemáticas, figuras), confeti, foco tras responder | Medio: `preventScroll` deja Siguiente fuera de vista |
| `index.html` | Estructura de pantallas, íconos SVG, `aria-hidden` en lo decorativo | Bajo |

## Verdict: APPROVE WITH CHANGES

La base es sólida: hay tokens, foco visible, movimiento reducido, hover solo en dispositivos con puntero, transiciones solo de `transform` y sin scroll horizontal. Hay tres problemas que una niña de 5 años sí va a notar.

## Critical Issues (Must Fix)
| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| 1 | **Siguiente queda fuera de la pantalla después de responder.** El panel de respuesta mide más que los botones SÍ/NO, y el foco usa `preventScroll: true`, así que la página no baja. Medido: 390×664 (iPhone con barras de Safari): termina en 745 px de 664. 360×640 (Android): 736 de 640. 1024×700 (tablet horizontal): 729 de 700. Ver `reviews/pliegue-390x664.png`. | `js/juego.js` (`responder`, `el.siguiente.focus`), `css/estilos.css` (`.visual`, `.retro`) | Una niña que no lee ve la explicación cortada y no encuentra cómo seguir. Es el bloqueo más probable del juego. | Al responder, encoger la tarjeta: por ejemplo `body[data-respondida] .visual { min-height: 96px }` y ocultar el botón Escuchar de la tarjeta, porque el panel ya lee la explicación. Además, desplazar con `el.retro.scrollIntoView({ block: 'end', behavior: menosMovimiento() ? 'auto' : 'smooth' })`. Verificar de nuevo en los 5 tamaños. |
| 2 | **En modo oscuro desaparece el efecto de botón presionable.** `--linea: #07040F` contra el fondo `#16112A` da 1.11:1, y contra `--papel` 1.37:1. Los contornos y las sombras duras, que son la identidad visual, casi no se ven: las tarjetas se ven planas y el ↺ deshabilitado es casi invisible. | `css/estilos.css` (bloque `prefers-color-scheme: dark`, `.btn-icono:disabled`) | El modo oscuro pierde el lenguaje visual y la señal de "esto se puede tocar". | Separar el token en dos: `--contorno` (en oscuro un tono claro como `#9C8FD0`, ≥3:1 contra papel y fondo) y `--sombra` (en oscuro, `#000` o un tono del color del mundo). Para el ↺ deshabilitado, usar un borde punteado con `--tinta-suave` en vez de `opacity: .4`. |
| 3 | **Texto pequeño con contraste bajo AA (4.5:1).** El chip "Era SÍ ✓" (blanco sobre `--si`, 1.15rem) da 3.91 en claro y 3.13 en oscuro. "Historial borrado." (`--si` sobre papel) da 3.91 en claro. El enlace "Borrar historial" da 3.69 en oscuro. | `css/estilos.css` (`.retro-respuesta`, `.adultos-aviso`, `.enlace`) | Lo leen adultos o se lee en voz alta, pero falla WCAG AA. | Agregar tokens de texto más oscuros: `--si-texto: #12753A` y `--no-texto: #B42323` en claro, y versiones más claras en oscuro (`#5BD68A`, `#FF8A8A`). Úsalos para texto pequeño y deja `--si`/`--no` para los rellenos grandes. El blanco sobre los botones gigantes SÍ/NO sí cumple, porque es texto grande (≥3:1). |

## Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| 1 | Colores sueltos fuera de los tokens: `#2B1F45` en 3 sitios (texto sobre amarillo), `#fff` en 3, `rgba(...)` en sombras de emoji y brillo, `--mundo: #9DB6FF` en el menú, y el arreglo `COLORES` del confeti en JS, que duplica los tokens. | `css/estilos.css` (líneas 78, 159, 238, 245, 328, 387, 513, 516, 560, 577); `js/juego.js` (`COLORES`) | Si cambia la paleta, esos valores quedan desincronizados. | Crear `--sobre-color` (blanco), `--sobre-amarillo` (tinta fija), `--mundo-menu` y `--brillo`. Que el confeti lea los colores con `getComputedStyle(document.documentElement)`. El proyecto usa hex: no hace falta migrar a oklch, pero sí mantener todo en tokens. |
| 2 | Movimiento continuo que nadie pidió: el segmento actual del progreso late sin parar (`latido`, infinito). Además, las celebraciones duran más de 300 ms (`salto` 0.6 s; las estrellas finales escalonadas llegan a ~1.7 s). | `css/estilos.css` (`.progreso li.actual`, `.retro-titulo`, `.final-estrellas`) | Las celebraciones largas tienen sentido en un juego infantil. El latido infinito, en cambio, compite con la pregunta por la atención. | Dejar las celebraciones. Cambiar el latido a 2–3 repeticiones (`animation-iteration-count: 3`) o quitarlo y marcar el segmento actual con un borde más grueso. |
| 3 | No se sabe qué botón tocó la niña: al responder se ocultan SÍ y NO. Si acierta, el chip "Era SÍ/NO" tampoco aparece. | `js/juego.js` (`responder`) | La relación "toqué esto → pasó esto" es más clara si se ve. | Mostrar siempre el chip con el ícono de la respuesta correcta (también al acertar), o mantener visible un mini botón de la opción elegida dentro del panel. |
| 4 | Estado deshabilitado de SÍ/NO sin estilo propio: hoy no se nota porque se ocultan, pero `.btn:disabled` solo cambia el cursor. | `css/estilos.css` (`.btn:disabled`) | Si mañana se deja de ocultar, se verán "activos". | Agregar `.btn:disabled { filter: saturate(.4); box-shadow: 0 2px 0 var(--sombra); }`. |

## Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Radios concéntricos: en `.tarjeta` (32 px, relleno 14 px) el `.visual` interno debería medir ~18 px, no 24. | El borde interno se ve "inflado" respecto al marco. En los mundos (32/8/24) sí cuadra. |
| 2 | `font-variant-numeric: tabular-nums` en `.ecuacion` y `.numero-cifra`. | Las cifras no bailan de ancho entre preguntas. |
| 3 | Fuente de respaldo con `size-adjust` (o `<link rel="preload">` de Baloo 2). | `display=swap` provoca un salto visible del texto en conexiones lentas. |
| 4 | Cambiar el ➕ de Matemáticas por otro emoji. | En Apple sale gris oscuro y "pesado", no como sticker de color como los demás. |

## Design System Compliance
Hay un sistema de tokens real en `:root` (tinta, papel, fondo, sí/no, estrella, foco, 5 colores de mundo, radios, borde, hundimiento) y casi todo lo usa. Lo que fragmenta el sistema: ~10 valores sueltos en CSS y una paleta duplicada en JS (Recomendación 1). El problema de fondo es que `--linea` cumple dos funciones a la vez, contorno y sombra. En claro funciona porque coinciden; en oscuro no (Crítico 2). Separarlo en dos tokens arregla el modo oscuro sin tocar ningún componente.

## Visual State Coverage
| Component/Element | Hover | Focus | Active | Disabled | Loading | Empty | Error | Dark Mode |
|-------------------|-------|-------|--------|----------|---------|-------|-------|-----------|
| Botón base `.btn` | ✅ (solo con puntero) | ✅ anillo 4 px | ✅ se hunde | ⚠️ solo cursor | n/a | n/a | n/a | ❌ sombra invisible |
| SÍ / NO | ✅ | ✅ | ✅ | ⚠️ se ocultan, sin estilo | n/a | n/a | n/a | ⚠️ blanco 3.13 en SÍ (pasa como texto grande) |
| Íconos inicio / ↺ | ✅ | ✅ | ✅ | ⚠️ claro bien; oscuro casi invisible | n/a | n/a | n/a | ❌ |
| Tarjetas de mundo | ✅ | ✅ | ✅ | n/a | n/a | n/a | n/a | ❌ sin profundidad |
| Escuchar | ✅ | ✅ | ✅ | ✅ se oculta sin voz | ✅ ícono animado al hablar | n/a | ✅ falla en silencio | ✅ |
| Panel de respuesta | n/a | ✅ foco en Siguiente | n/a | n/a | n/a | n/a | ✅ "¡Casi!" + temblor | ⚠️ chip 3.13 |
| Siguiente | ✅ | ✅ (pero fuera de vista) | ✅ | n/a | n/a | n/a | n/a | ✅ |
| Barra de progreso | n/a | n/a | n/a | n/a | n/a | ✅ segmentos vacíos | ✅ rojo | ✅ |
| Contador de estrellas | n/a | n/a | n/a | n/a | n/a | ✅ "0" | n/a | ✅ |
| Para adultos / Borrar | ⚠️ sin hover en el enlace | ✅ | ⚠️ | n/a | n/a | ✅ "0 por repasar" | ✅ confirmación en página | ⚠️ enlace 3.69 |
| Fuente web | n/a | n/a | n/a | n/a | ⚠️ salto al cargar | n/a | ✅ respaldo redondeado | n/a |

## Verdict Details
- Design Token Fidelity: CONCERNS (~10 valores sueltos y paleta duplicada en JS)
- Visual State Coverage: CONCERNS (Siguiente fuera de vista; deshabilitado débil)
- Dark Mode Parity: CONCERNS (contornos y sombras a 1.1–1.4:1)
- Animation Quality: PASS (solo `transform`/`opacity`, respeta movimiento reducido; el latido infinito es mejorable)
- Visual Consistency: PASS (lenguaje de juguete coherente en las 3 pantallas y los 5 mundos)

## Estado de los críticos (2026-10-16)
Los tres críticos quedaron resueltos y medidos de nuevo:
1. **Siguiente visible**: al responder, la tarjeta se compacta, Escuchar pasa a ser un botón redondo junto a Siguiente y la página baja con `scrollIntoView`. Cada pregunta nueva vuelve arriba. Siguiente ahora termina en 571 de 664 px (390×664), 537 de 640 (360×640) y 622 de 700 (1024×700).
2. **Modo oscuro**: `--linea` (contorno, `#A497D6`, 5.6–7:1) y `--sombra` (`#7A6DB0`) son tokens separados. El ↺ deshabilitado usa un borde punteado en vez de opacidad. También se agregó `[hidden] { display: none !important; }`: sin eso, la clase `.btn` dejaba visible el botón Escuchar en navegadores sin voz.
3. **Contraste**: nuevos tokens `--si-fuerte`/`--no-fuerte` (blanco encima: 5.9 y 6.6:1) y `--si-texto`/`--no-texto` (5.4–8.6:1 en claro y oscuro).

`pliegue-390x664.png` muestra el problema 1 antes del arreglo.
