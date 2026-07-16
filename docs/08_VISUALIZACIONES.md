# Visualizaciones vigentes

`getChartRegistry()` en `dashboard-template.js` declara las visualizaciones. `assignAdaptiveChartLayout()` distribuye únicamente las definiciones que cumplen `shouldRender()`; por eso retirar una gráfica no deja tarjeta ni hueco.

## Catálogo

| Visualización | Pregunta | Fuente | Tipo | Interacción y fallback |
| --- | --- | --- | --- | --- |
| Ventas atribuibles frente al objetivo | ¿Cómo se compara el numerador con el objetivo? | `kpis.comparableSales` y `comparableObjective` | barras horizontales | Etiquetas; fallback de barras. Layout featured. |
| Línea de tiempo | ¿Qué ocurrió antes, durante y después? | `analysis.timeline` | línea suavizada, Gantt o resumen | Filtros/explorador; fallback temporal. Layout timeline. |
| Ventas por cliente asociado | ¿Quién aporta a una actividad compartida? | `selectedActivity.contributionRows` | barras | Abre explorador; fallback navegable. Featured. |
| Cumplimiento por actividad | ¿Qué actividades comparables tienen mayor cumplimiento? | `activityPerformance` comparable | barras horizontales | Filtra actividad; hasta 12. Standard. |
| Estado de presentaciones | ¿Qué proporción tiene venta, cero o falta información? | `presentationStatus` | donut | Tooltip y leyenda; fallback donut. Compact. |
| Ventas por categoría | ¿Cómo se compone la venta física? | `categorySales` | treemap hasta 12, barra después | Filtra categoría; fallback equivalente. Standard. |
| Presentaciones con mayor venta | ¿Cuál es el ranking de presentaciones? | `presentationSales` | lollipop horizontal | Filtra presentación; top 10; fallback lollipop. Standard. |
| Presentaciones sin ventas (KPI explorador) | ¿Dónde se concentra la ausencia de venta y qué presentaciones la explican? | análisis de presentaciones únicas sin venta | Modal con resumen por categoría y tabla paginada | No usa ECharts: abre desde el KPI, conserva filtros globales y ofrece CSV en ambos niveles. |
| Ventas por cliente | ¿Qué clientes concentran venta general? | `chartData.clients` | barras horizontales | Filtra cliente; top 10. Standard. |
| Ventas por Región SAP | ¿Cómo se distribuye la venta por macrozona? | `chartData.regions` | mapa + ranking | Filtra región; si falla GeoJSON muestra ranking. Featured. |
| Ventas por canal | ¿Cómo se comparan canales? | `chartData.channels` | barras horizontales | Filtra canal; hasta 10. Standard. |
| Cumplimiento por CEDI | ¿Qué CEDI tiene mayor cumplimiento agregado? | `cediCompliance` | barras horizontales | Filtra CEDI; hasta 12. Standard. |

## Criterio de tipo

- **Donut:** pocos estados y lectura de proporción.
- **Treemap:** composición con cardinalidad moderada.
- **Lollipop:** ranking con menor peso visual que otra barra completa.
- **Barra:** comparación exacta y ordenada contra un eje.
- **Línea/Gantt:** secuencia temporal con una actividad o vigencias distintas.

No se usan 3D, rose charts ni efectos decorativos que reduzcan legibilidad.

## Exploración de presentaciones sin ventas

La gráfica por categoría se retiró para evitar duplicar la información del KPI. El KPI **Presentaciones sin ventas** es clicable y abre un único modal: primero muestra categoría, cantidad, porcentaje, actividades y clientes relacionados; después muestra las presentaciones de la categoría seleccionada. La búsqueda, el ordenamiento, la paginación de 25 registros y la exportación CSV se realizan sobre el análisis ya preparado por los filtros actuales. Volver a categorías no abre un modal anidado ni modifica los filtros.

## Eliminación de la gráfica temporal redundante

La visualización independiente titulada anteriormente `Evolución de ventas` se retiró del registro, despachador, ID, opción genérica y pruebas. Mostraba `TotalVentaMes` por mes, pero se solapaba con la timeline. La timeline conserva histórico, comparabilidad, objetivo, inicio, fin y vigencia, por lo que es la explicación temporal principal.

No se agregó una gráfica de reemplazo. Al cambiar la firma del registro, `renderAdaptiveCharts()` recompone las tarjetas visibles y `assignAdaptiveChartLayout()` vuelve a emparejar compactas/estándar; no se reserva espacio para la definición eliminada.

## Tooltips y formato

Los tooltips usan `es-CO`, `escapeHtml()` y etiquetas semánticas. Donut y treemap incluyen valor y participación; lollipop presenta ventas; barras respetan porcentaje o número. Estados no disponibles se presentan como tarjetas informativas, no como valores inventados.

## Responsive y accesibilidad

Cada contenedor tiene `role="img"` y `aria-label`. Los fallbacks nativos usan botones o elementos con `role="button"`, `tabindex="0"` y activación por Enter/Espacio. Las leyendas se adaptan, y etiquetas largas usan espacio controlado y tooltip.

La validación automática comprueba estructura y fallbacks. La pintura en 1440, 1024, 768 y 390 px permanece en la matriz manual cuando no hay navegador disponible.

## Tabla de seguimiento

Aunque no es una gráfica, funciona como visualización ejecutiva de entrada. En escritorio usa tabla compacta con encabezado fijo y scroll horizontal interno; hasta 820 px renderiza únicamente tarjetas de la página activa. Los badges combinan icono, texto y tono. El modal presenta períodos dinámicos y separa venta general, aporte del cliente y venta conjunta.
