# Visualizaciones vigentes

`getChartRegistry()` en `dashboard-template.js` declara las visualizaciones. `assignAdaptiveChartLayout()` distribuye únicamente las definiciones que cumplen `shouldRender()`; por eso retirar una gráfica no deja tarjeta ni hueco.

## Catálogo

| Visualización | Pregunta | Fuente | Tipo | Interacción y fallback |
| --- | --- | --- | --- | --- |
| Evolución de la negociación | ¿Cómo cambian ventas, objetivo y vigencia por período? | timeline analítico | línea o Gantt | El detalle temporal se conserva en tooltips. |
| Línea de tiempo | ¿Qué ocurrió antes, durante y después? | `analysis.timeline` | línea suavizada, Gantt o resumen | Filtros/explorador; fallback temporal. Layout timeline. |
| Ventas por cliente asociado | ¿Quién aporta a una actividad compartida? | `selectedActivity.contributionRows` | barras | Abre explorador; fallback navegable. Featured. |
| Cumplimiento por actividad | ¿Qué actividades comparables tienen mayor cumplimiento? | `activityPerformance` comparable | barras horizontales | Filtra actividad; hasta 12. Standard. |
| Estado de presentaciones | ¿Qué proporción tiene venta, cero o falta información? | `presentationStatus` | donut | Tooltip y leyenda; fallback donut. Compact. |
| Ventas por categoría | ¿Cómo se compone la venta física? | `categorySales` | treemap hasta 12, barra después | Filtra categoría; fallback equivalente. Standard. |
| Presentaciones con mayor venta | ¿Cuál es el ranking de presentaciones? | `presentationSales` | lollipop horizontal | Filtra presentación; top 10; fallback lollipop. Standard. |
| Clientes negociados sin ventas (KPI explorador) | ¿Qué clientes tienen venta total reportada en cero? | clientes únicos sin período de venta | Modal de clientes, negociaciones y presentaciones | No usa ECharts; ignora el filtro Mes y conserva estado al volver y CSV. |
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

## Exploración de clientes negociados sin ventas

El KPI **Clientes negociados sin ventas** es clicable y muestra una fila por cliente sin columna de período. **Ver negociaciones** abre las actividades consolidadas y **Ver presentaciones** muestra el contenido de cada actividad dentro del mismo modal. **← Volver** restaura página, orden, fila, cliente y scroll. Búsqueda, ordenamiento, paginación de 25 y CSV operan sobre el modelo preparado.

Los títulos visibles son **Evolución de la negociación**, **Contribución por cliente**, **Cumplimiento por negociación**, **Estado de ventas por presentación**, **Ventas por categoría**, **Presentaciones con mayor venta**, **Ventas por cliente**, **Ventas por región**, **Ventas por canal** y **Ventas por CEDI**. Los subtítulos describen el resultado y evitan reglas internas de deduplicación o atribución.

## Eliminación de la gráfica temporal redundante

La visualización independiente titulada anteriormente `Evolución de ventas` se retiró del registro, despachador, ID, opción genérica y pruebas. Mostraba `TotalVentaMes` por mes, pero se solapaba con la timeline. La timeline conserva histórico, comparabilidad, objetivo, inicio, fin y vigencia, por lo que es la explicación temporal principal.

No se agregó una gráfica de reemplazo. Al cambiar la firma del registro, `renderAdaptiveCharts()` recompone las tarjetas visibles y `assignAdaptiveChartLayout()` vuelve a emparejar compactas/estándar; no se reserva espacio para la definición eliminada.

## Tooltips y formato

Los tooltips usan `es-CO`, `escapeHtml()` y etiquetas semánticas. Donut y treemap incluyen valor y participación; lollipop presenta ventas; barras respetan porcentaje o número. Estados no disponibles se presentan como tarjetas informativas, no como valores inventados.

## Responsive y accesibilidad

Cada contenedor tiene `role="img"` y `aria-label`. Los fallbacks nativos usan botones o elementos con `role="button"`, `tabindex="0"` y activación por Enter/Espacio. Las leyendas se adaptan, y etiquetas largas usan espacio controlado y tooltip.

La validación automática comprueba estructura y fallbacks. La pintura en 1440, 1024, 768 y 390 px permanece en la matriz manual cuando no hay navegador disponible.

La interfaz principal no usa navegación lateral. `.dashboard-shell` centra encabezado, filtros, KPI, seguimiento y visualizaciones; las gráficas mantienen título, un subtítulo breve y la visualización, mientras las reglas técnicas quedan en tooltips, modales y documentación.

## Tabla de seguimiento

Aunque no es una gráfica, funciona como visualización ejecutiva de entrada. En escritorio usa tabla compacta con encabezado fijo y scroll horizontal interno; hasta 820 px renderiza únicamente tarjetas de la página activa. Los badges combinan icono, texto y tono. El modal presenta períodos dinámicos y separa venta general, aporte del cliente y venta conjunta.
