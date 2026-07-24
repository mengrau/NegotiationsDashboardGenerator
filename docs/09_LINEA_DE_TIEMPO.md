# Línea de tiempo analítica

## Propósito

La timeline explica la negociación dentro de su contexto temporal. No es una suma mensual genérica: distingue qué venta es histórica, comparable, ambigua o posterior y cuándo aplica el objetivo.

`buildNegotiationTimelineAnalysis()` consume `activityAnalytics` ya preparado y su versión cacheada vive en `timelineCache` con límite ocho.

## Detalle de una actividad

`buildNegotiationTimelineOption()` crea:

- serie principal `line` con suavizado 0,25;
- puntos mensuales visibles;
- objetivo mensual discontinuo, sin suavizado;
- `markArea` para vigencia;
- `markLine` para inicio y fin;
- tooltip con estado, venta, objetivo y explicación;
- `dataZoom` desde 13 períodos.

El suavizado modifica el trazo visual entre puntos, no los valores mensuales.

## Lectura de estados

```text
Histórico previo ── Inicio ── Período comparable ── Fin ── Posterior
       ○                         ●                         ◇
   sin objetivo            participa en KPI          atenuado
```

- **Histórico previo:** círculo hueco; visible, no comparable.
- **Período comparable:** círculo con mayor peso; venta y objetivo participan.
- **Vigente sin venta atribuible:** no inventa cero.
- **Venta ambigua:** marcador/estado de advertencia; fuera del cumplimiento.
- **Posterior al fin:** diamante atenuado; contexto.
- **Objetivo o fechas conflictivas:** explicación, no línea falsa.

## Fechas y vigencia

La banda usa el período de las fechas de inicio y fin; los hitos muestran las fechas exactas formateadas. La lógica de vigencia es la misma de `isActivityActiveInPeriod()` y no se recalcula a partir de la gráfica.

El objetivo solo contiene datos en períodos comparables. Antes del inicio, después del fin, sin objetivo válido o con venta ambigua recibe `null`, no cero.

## Actividad compartida

La línea principal representa ventas conjuntas comparables. Si hay un cliente filtrado, el tooltip puede mostrar su aporte como información secundaria, pero no lo llama cumplimiento del cliente.

## Actividad individual

La única línea de venta representa la venta atribuible del cliente asociado. No incluye semántica de contribución competitiva.

## Cliente multiactividad

Dos a ocho actividades usan Gantt independiente por actividad. Cada fila conserva actividad, rango, tipo, clientes y objetivo. Mezclar negociaciones con vigencias distintas en una única línea produciría una lectura falsa.

Más de ocho actividades usan un resumen de vigentes, futuras, finalizadas y conflictivas. `TIMELINE_MAX_GANTT_ROWS` es 8.

## Límite temporal

`TIMELINE_MAX_PERIODS` es 36. `buildContinuousPeriodSequence()` limita rangos mayores y registra advertencia. Con más de 12 puntos, ECharts activa zoom interno y slider.

## Fallback

Sin ECharts, `renderNativeTimeline()` produce:

- lista mensual con etiqueta y estado para detalle;
- Gantt HTML/CSS para varias actividades;
- resumen para selección amplia;
- mensaje de conflicto para fechas inconsistentes.

La funcionalidad de filtros, KPI, explorador y CSV continúa disponible.

## Accesibilidad e integración

La tarjeta usa resumen accesible, leyenda textual y estados que no dependen solo del color. `handleTimelineAction()` puede filtrar una actividad o abrir el explorador mediante el estado central.

KPI y timeline comparten `activityAnalytics`: una venta comparable en la timeline es la misma que entra en `comparableSales`. La retirada de la serie temporal independiente elimina una posible comparación de poblaciones diferentes.

## Ejemplos

- `947124`: detalle compartido con venta 541, objetivo 1.100 y banda contractual.
- `874894`: detalle individual con venta 549,252 y objetivo 500.
- `1002559342`: mayo/junio históricos y Gantt para actividades `965821` y `965923` desde julio.

## Información parcial y vigencia

La línea de tiempo determina vigencia exclusivamente por intersección mensual: `inicio <= fin del mes` y `fin >= inicio del mes`. La falta de período en una fila no cambia la vigencia contractual.

`INFORMACION_PARCIAL` muestra la venta conjunta conocida y conserva el objetivo, pero no dibuja cumplimiento definitivo. `ZERO_EXPLICIT_WITHOUT_PERIOD` cuenta como información resuelta y no produce el texto `Fuera del período`.
