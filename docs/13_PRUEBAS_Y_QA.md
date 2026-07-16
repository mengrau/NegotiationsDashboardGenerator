# Pruebas y QA

## Comandos

```bash
npm.cmd test
npm.cmd run audit:workbook
npm.cmd run audit:performance
npm.cmd run audit:production
```

También se ejecuta `node --check` sobre archivos JavaScript y `git diff --check` antes del cierre.

## `npm.cmd test`

Ejecuta `tests/sales-information.test.js`. Carga `app.js` y el script generado en contextos VM y cubre:

- normalización numérica, fechas y períodos;
- resolución de `TotalVentaMes` y objetivos;
- actividades individuales, compartidas y multiactividad;
- KPI contextuales y reconciliación comparable;
- ausencia de la visualización temporal eliminada;
- filtros, facetas, chips y scheduler;
- timeline, Gantt y fallback;
- modal, búsqueda, orden, paginación y CSV;
- tabla de seguimiento sin búsqueda local y con filtros globales;
- pila de navegación modal, restauración de página/orden/selección/scroll y bloqueo encadenado del fondo;
- seguridad HTML/CSV;
- cachés, listeners e inicialización idempotente;
- layout, temas y marcadores estáticos.

## `audit:workbook`

`tests/workbook-audit.js` lee el workbook real y reporta:

- filas, columnas y cardinalidades;
- estados de presentaciones;
- actividades individuales/compartidas;
- relaciones cliente-período;
- conflictos y ambigüedades;
- fuentes de atribución;
- ejemplos y calidad.

En la referencia se esperan 18.319 filas, 370 actividades, 464 clientes y dos períodos.

## `audit:performance`

`tests/performance-audit.js` mide lectura, normalización, índices, facetas, búsquedas, análisis, filtros, timeline, modal y opciones visuales. Informa ventas generales, ventas atribuibles comparables, objetivo, cumplimiento, diferencia, consistencia, cantidad de gráficas y ausencia de la visualización retirada.

Falla si las fórmulas comparables no reconcilian.

## `audit:production`

`tests/production-audit.js` genera el HTML completo en memoria y valida:

- doctype y estructura única;
- IDs no duplicados;
- una carga ECharts y Lucide;
- serialización segura;
- CSV seguro;
- límites de caché y diagnósticos;
- casos reales;
- ausencia de código de la gráfica eliminada;
- presencia del KPI comparable.

Un error crítico produce código de salida distinto de cero.

## Regresiones reales

- `947124`: dos clientes, 541, objetivo 1.100, 49,18 %, -559, aportes 371/170.
- `874894`: cliente `1002564657`, 549,252, objetivo 500, 109,85 %, sin ranking redundante.
- `1002559342`: mayo 53.956, junio 67.401, total 121.357, actividades `965821` y `965923`, inicio 01/07/2026.

Los identificadores aparecen en pruebas y documentación, no como ramas especiales de producción.

## Seguridad, cachés y listeners

La suite introduce `<script>`, `<img onerror>`, `</script>`, U+2028/U+2029 y fórmulas CSV. También fuerza límites LRU, múltiples inicializaciones, cambios rápidos y apertura repetida de modal.

## Documentación

Las pruebas comprueban que los 16 documentos existan, estén enlazados, no contengan rutas personales, cierren sus bloques Mermaid y describan el KPI comparable y la eliminación de redundancia.

## Matriz visual manual

Repetir con temas claro y oscuro y zoom 80 %, 100 % y 125 %:

| Resolución | Foco |
| --- | --- |
| 1440 × 900 | cuatro KPI por fila, timeline completa, filtros amplios |
| 1024 × 768 | KPI/gráficas adaptadas, dropdown en viewport |
| 768 × 1024 | una columna de gráficas, modal funcional |
| 390 × 844 | sin scroll general, controles táctiles y timeline legible |

Comprobar encabezado, sidebar, ocho KPI globales, ausencia de hueco, timeline, donut, treemap, lollipop, modal, dropdown, contraste, foco y `scrollWidth <= innerWidth`.

## Estado honesto

Las auditorías Node no equivalen a inspección visual. Si el entorno responde que no hay navegador, el resultado se registra como pendiente y se sigue `../QA_CHECKLIST.md` en un navegador real.

## Cobertura automatizada del seguimiento

La suite verifica estructura, granularidad cliente–actividad, selección mensual, filtros descriptivos, numerador conjunto en compartidas, contrato del detalle, LRU, paginación por `slice()`, navegación central y responsive sin duplicar tabla/tarjetas. Los CSV se prueban con todas las coincidencias, columnas dinámicas, BOM y protección de fórmulas. Encabezado fijo, scroll, contraste y modal en 1440/1024/768/390 requieren inspección manual.
