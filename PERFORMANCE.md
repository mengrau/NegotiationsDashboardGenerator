# Contrato de rendimiento del dashboard

Esta fase optimiza el costo de interacción sin alterar las reglas documentadas en ANALYTICS.md. Los índices y cachés son derivados del dataset normalizado; se invalidan por completo cada vez que se procesa o inicializa un libro nuevo.

## Perfil de referencia

Medición realizada con Node.js sobre `INSUMO DASHBOARD (3).xlsx` (14.623 filas en la auditoría actual). Las cantidades se descubren del archivo y no están codificadas en producción. Los tiempos no incluyen pintura del navegador ni trabajo interno de ECharts y pueden variar entre ejecuciones.

| Etapa | Antes | Después |
| --- | ---: | ---: |
| Filtrar actividad 947124 | 71,19 ms | 0,42 ms |
| Repetir el mismo filtro | no existía caché | 0,03 ms |
| Repetir el mismo análisis | no existía caché | 0,03 ms |
| Construcción de índices | no existía | 752,67 ms, una vez por dataset |
| Modelo del modal 947124 | 9,59 ms | 9,53 ms |

Medición de filtros sobre el mismo workbook:

| Operación | Tiempo Node.js |
| --- | ---: |
| Construcción facetada con actividad seleccionada | 49,37 ms |
| Reutilización del modelo facetado | 0,07 ms |
| Búsqueda preprocesada de actividad | 0,21 ms |
| Búsqueda preprocesada de cliente | 0,14 ms |

Medición de la timeline sobre la actividad 947124 (Node.js, 12 de julio de 2026):

| Operación | Tiempo |
| --- | ---: |
| Construcción directa del modelo | 1,87 ms |
| Reutilización desde caché | 0,13 ms |

El modelo generó 18 períodos, incluyó una actividad y preparó dos series ECharts. La auditoría Node.js no inicializa ni actualiza instancias visuales, por lo que ambos contadores permanecieron en cero; el tamaño observado de la caché fue tres y su límite estructural es ocho.

El modal tiene solo dos contribuciones y nunca fue el cuello de botella analítico. La mejora relevante está antes de abrirlo: la selección usa el índice de actividad y reutiliza análisis ya calculados. Una segunda lectura con la misma firma evita por completo reconstruir el análisis. ECharts conserva su instancia cuando cambia únicamente el modelo y omite setOption si la firma es idéntica.

## Arquitectura

- Índices por filtros, actividad, cliente, período y relaciones actividad-cliente-presentación.
- Estado de vigencia y categorías resueltos una sola vez por dataset.
- Cachés LRU acotados: 12 resultados de filtro, 8 análisis y 8 análisis de presentaciones sin venta.
- Firmas de filtros deterministas: el orden de campos y valores no crea entradas duplicadas.
- Scheduler con requestAnimationFrame: cambios rápidos cancelan el render pendiente y ejecutan solo el estado más reciente.
- ECharts: init al crear la tarjeta, setOption al cambiar datos y dispose únicamente al retirar o sustituir el contenedor.
- Modal: modelo construido al abrir, búsqueda con debounce de 150 ms, ordenamiento cacheado, lotes de 25 filas y una sola representación DOM según el ancho.
- Explorador de contribución: caché LRU de ocho modelos por actividad y firma de clientes seleccionados. Reabrir, buscar, ordenar, paginar o entrar al detalle reutiliza las contribuciones preparadas y no recorre el workbook.
- Filtros: una fuente central normalizada, firmas estables y una caché LRU de doce modelos facetados. El catálogo proviene de los índices del workbook y no se reconstruye desde las filas filtradas.
- Timeline: modelo derivado de los análisis existentes, caché LRU de ocho firmas, máximo de 36 meses y ocho filas Gantt. ECharts conserva la instancia y omite `setOption()` cuando la firma de modelo y tema no cambia.
- Tipos visuales: donut, treemap, lollipop y línea se deciden sobre los arreglos ya agregados del análisis. La selección por cardinalidad no recorre el workbook ni crea una caché paralela.

Los contadores están disponibles en la consola del HTML generado:

~~~js
window.__getDashboardPerformance()
~~~

Para imprimir un resumen después de cada render:

~~~js
window.__DASHBOARD_PERF_DEBUG__ = true
~~~

## Auditoría reproducible

~~~powershell
npm.cmd run audit:performance
npm.cmd test
~~~

Para otro libro:

~~~powershell
$env:INSUMO_DASHBOARD_XLSX = "C:\ruta\archivo.xlsx"
npm.cmd run audit:performance
~~~

La salida debe mantener para la actividad 947124: 2 clientes, ventas 541, objetivo 1.100, cumplimiento 49,18 %, diferencia -559 y aportes 371/170. También informa `timelineModelColdMs`, `timelineModelCacheHitMs`, períodos generados, actividades incluidas, series, actualizaciones, reinicializaciones y tamaño de caché. Son tiempos de cálculo Node.js; actualizaciones visuales e inicializaciones permanecen en cero durante esta auditoría sin navegador.

## Rendimiento del layout adaptativo

La asignación de layout opera únicamente sobre el pequeño registro de visualizaciones ya filtrado. No toca filas, índices, objetivos, ventas ni modelos cacheados. Los metadatos de clase forman parte de `chartLayoutSignature`, de modo que el DOM solo se recompone cuando cambia la composición visible; un cambio de CSS o un resize no invalida análisis ni cachés.

Antes de retirar la visualización temporal redundante, la vista global de referencia tenía 12 visualizaciones visibles. Después quedan 11: la asignación adaptativa recompone el registro sin reservar tarjeta, firma ni instancia para `chartMes`. Calcular los metadatos de una grilla de ocho KPI continúa siendo una operación escalar y el reporte marca `analysisRebuiltForLayout: false`.

La grilla KPI calcula tres atributos escalares —cantidad, residuo sobre cuatro y paridad— durante su render normal. Los filtros calculan sus clases sobre las configuraciones disponibles, no sobre el workbook. No se incorporaron observers, listeners, dependencias ni representaciones responsive duplicadas. ECharts continúa redimensionándose mediante el único `debouncedResizeCharts` de 160 ms y conserva sus instancias mientras la composición de tarjetas no cambia.

Las alturas son variables de presentación: 280 px para gráficas compactas, 330 px para estándar y 380 px para destacadas, más encabezado y padding de tarjeta. Los estados vacíos reducen el canvas a 210 px. La timeline mantiene alturas específicas por modo y scroll vertical interno únicamente para Gantt extensos.

El cambio de barras a línea suavizada, donut, treemap o lollipop solo sustituye la opción entregada a la instancia existente. La firma ya incorpora el tipo visual, por lo que un cambio real actualiza `setOption()` una vez; filtros sin cambio de firma no actualizan ni reinicializan la gráfica. El lollipop combina un tallo silencioso y un punto interactivo dentro de una única opción ECharts. Los fallbacks nativos reutilizan la delegación y no agregan listeners globales.

En la última auditoría Node.js del 13 de julio de 2026, construir las opciones visuales de categoría y presentaciones tomó 0,86 ms y construir la opción de timeline tomó 0,81 ms. La medición confirmó `treemap`, `donut`, `lollipop` y una serie principal `line` con suavizado 0,25, sin inicializaciones ECharts ni reconstrucciones analíticas. Estos tiempos son orientativos y varían entre ejecuciones.

El KPI de ventas atribuibles comparables lee `activityAggregate.sales`; objetivo, cumplimiento y diferencia leen el mismo agregado. La reconciliación añade únicamente restas, división y comparaciones con tolerancia, sin recorrer nuevamente las filas normalizadas. `audit:performance` informa ambas poblaciones, consistencia y cantidad de gráficas.

## Diagnóstico y estabilidad

Los registros de ejecución tienen un límite independiente de 40 errores y 40 advertencias y solo escriben en consola cuando `__DASHBOARD_DEBUG__` o `__DASHBOARD_PERF_DEBUG__` está activo. No almacenan filas, nombres de clientes, filtros ni trazas completas. La instantánea de rendimiento incluye conteos de diagnósticos y tamaños de cada caché.

Al inicializar otro dataset se cancelan frames, se liberan gráficas, se cancelan búsquedas del modal y se limpian filtros, análisis, facetas, timeline, explorador, firmas, métricas y diagnósticos. Solo la preferencia de tema permanece en almacenamiento global.

La eliminación del sidebar retira su listener, persistencia y resize diferido. El KPI contextual de cliente consume `clientActivitySummary` y deduplica por `ID Actividad`; no recorre el workbook ni crea listeners por tarjeta. La consolidación visual del acumulado tampoco modifica el modelo ni el CSV.

La prueba de endurecimiento simula 50 cambios de filtro, 20 limpiezas, 20 ciclos de modal con búsqueda y orden, 20 construcciones de timeline y 10 CSV. También fuerza 50 entradas sobre una LRU de tamaño ocho y confirma que no crece fuera del límite.

## Validación manual en navegador

1. Generar el dashboard con `INSUMO DASHBOARD (3).xlsx` y confirmar que el conteo mostrado coincide con el workbook cargado.
2. Activar el modo de depuración y guardar la instantánea inicial.
3. Cambiar rápidamente actividad, cliente, período y CEDI; verificar que rendersCancelled crece y no se bloquea la interfaz.
4. Repetir una combinación de filtros; comprobar que analysesExecuted no aumenta.
5. Abrir 947124; confirmar dos filas, cierre por botón, fondo y Escape, foco restaurado y CSV correcto.
6. Cambiar orden y búsqueda dentro del modal; verificar que no se reconstruye el análisis global.
7. Alternar tema y redimensionar; confirmar que las gráficas se actualizan sin acumular listeners ni instancias.
8. Revisar en DevTools que no aparezcan excepciones, NaN, Infinity ni errores de ECharts.
9. Validar la timeline con cliente 1002559342, actividades 947124 y 874894, selección multiactividad, una actividad finalizada y otra con fechas conflictivas en 1440, 1024, 768 y 390 px, tanto en tema claro como oscuro.
10. En cada tamaño comprobar `document.documentElement.scrollWidth <= window.innerWidth`, con zoom del navegador en 80 %, 100 % y 125 %.
11. Abrir combobox y modal para verificar que sus capas siguen en z-index 60 y 80, respectivamente, y que el scroll necesario queda dentro del componente.

El ciclo de vida del explorador mantiene listeners delegados sobre el contenedor estable, cancela la búsqueda pendiente al cerrar, restaura el foco y conserva los filtros globales. El CSV se construye solo al pulsar el botón, respeta la búsqueda activa y libera inmediatamente su Blob URL.

## Flujo de filtros

Toda interacción llama a updateDashboardFilters: normaliza vacíos, elimina duplicados, valida contra el catálogo, compara la firma y programa como máximo un render. La sincronización posterior lee el estado central de forma silenciosa; no dispara eventos change ni crea ciclos.

`negotiationUsageCache` es una LRU de 8 entradas, identificada por filtros compatibles y búsqueda, excluyendo Año, Mes y Año Mes. `buildNegotiationUsageAnalysis()` filtra ceros explícitos y agrupa en una pasada con `Map` por cliente, relación cliente–actividad y presentación. Abrir, buscar, ordenar, paginar, exportar o volver consume el modelo preparado; no recalcula el workbook ni crea listeners.

Auditoría sintética de 14.623 filas (runtime Node de Cursor, sin pintura del navegador): construcción en frío de `negotiationUsageAnalysis` 121,25 ms y lectura desde caché 0,08 ms. La instrumentación confirmó una construcción, un acierto de caché y LRU de tamaño 1. Estos tiempos son de referencia del equipo de prueba, no un SLA de navegador.

Los combobox de actividad y cliente comparten el mismo componente, búsqueda preprocesada y listeners delegados. El estado de apertura, consulta y opción resaltada vive en filterUi, no en el DOM. Al limpiar todos los filtros se cierran los paneles, se cancelan búsquedas pendientes y se conserva el tema.

La disponibilidad facetada se obtiene con una pasada sobre el resultado completo y una pasada adicional por cada dimensión que tenga selección, excluyendo temporalmente esa dimensión. Los resultados se cachean por dataset y firma estable. El modo de diagnóstico reporta la etapa facetedOptions y el tamaño de la caché facets.

En escritorio el panel usa cuatro columnas y los combobox ocupan dos; en tablet pasa a dos columnas y en móvil a una. El desplegable móvil usa posición fija dentro del viewport con z-index inferior al modal.

## Modelo cliente–negociación

El nuevo modelo se construye una vez en `processCurrentSheet()` después de normalizar e indexar el workbook. Utiliza `Map` y `Set` para resolver relaciones, objetivos, ventas y descuentos. En la auditoría actual produjo 386 relaciones y 382 resúmenes de cliente en aproximadamente 511 ms en frío. `audit:performance` separa `clientNegotiationModelColdMs` de `clientNegotiationModelReadMs`; la segunda medición solo accede a los arreglos ya construidos.

El resultado se serializa dentro de `DASHBOARD_META.clientNegotiationModels` y `buildDashboardAnalyses()` lo incorpora a `state.analyses`. La caché LRU de análisis, limitada a ocho firmas, conserva la referencia al modelo; filtros de estado, ordenamientos y paginación de la tabla no recorren las 14.623 filas. Al procesar otro workbook, `resetProcessedOutput()` elimina el modelo anterior, el HTML nuevo reemplaza sus metadatos y `initializeDashboardDataset()` invalida todas las cachés por `datasetVersion`.

Las columnas mensuales se crean recorriendo únicamente `availablePeriods`, no el workbook. Para dos meses se obtienen 25 columnas: 17 base y ocho dinámicas —venta, descuento, cumplimiento y estado por mes—. El costo escala con el número real de períodos y no contiene casos especiales para mayo o junio. Cambiar el mes seleccionado proyecta los campos `selectedMonthly*` sobre 386 relaciones ya preparadas; no reconstruye índices ni atribución.

## Limitaciones de esta medición

El repositorio no contiene un último dashboard descargado; la prueba automatizada compila el HTML en memoria desde el workbook. En la sesión de auditoría el controlador devolvió exactamente "No browser is available", por lo que quedan pendientes la pintura real, el tiempo interno de ECharts, la respuesta tras 20 cambios y el perfil de memoria. Las cifras anteriores demuestran costos de cálculo y reutilización de caché en Node.js, no garantizan por sí solas que el aviso de página sin respuesta haya desaparecido en todos los navegadores.

## Proyección de seguimiento

`clientTrackingCache` es una LRU de ocho firmas. La clave combina versión del dataset, filtros globales, período, estados locales y ordenamiento. Cada fallo filtra y ordena las relaciones preparadas sin mutarlas; paginar solo aplica `slice()` y renderiza 25/50/100 elementos. La tabla no mantiene búsqueda local: cliente, NIT, actividad, región y CEDI se segmentan con los filtros globales. Exportar reutiliza la proyección completa y abrir el detalle referencia la relación: ninguna acción recorre las 14.623 filas.

El snapshot expone tamaño de la LRU, proyecciones, aciertos y filas renderizadas. `initializeDashboardDataset()` invalida caché, pila modal y estado local al cambiar de workbook.

La apertura del detalle usa `clientTrackingRelationIndex`, un `Map` construido cuando se renderiza la proyección, para localizar `Cliente SAP + ID Actividad` sin buscar filas del workbook. `clientTrackingDetailCache` conserva hasta 16 modelos por versión de dataset, relación y firma de períodos. Cada modelo contiene únicamente el registro preparado, sus períodos contractuales y valores mensuales. Abrir o cerrar no agrega listeners, no llama a `updateDashboardFilters()` y no renderiza nuevamente KPI o gráficas.

El overlay registra una sola vez eventos delegados de clic, teclado, rueda y tacto. No existe listener de `scroll`: desplazarse no modifica el DOM ni consulta análisis. Se retiraron `backdrop-filter` y el encabezado sticky redundante; tarjetas y secciones independientes limitan su pintura. `state.modalNavigation.stack` conserva referencias a modelos ya preparados y estados de vista, por lo que **Volver** solo renderiza el nivel recuperado. `lockPageScroll()` fija el body, compensa la barra lateral y usa contador para cadenas de vistas; `unlockPageScroll()` restaura estilos y coordenadas exactas.

## Índice y caché de resolución mensual

La preparación construye `rowsByClientActivityPeriod`, `periodlessRowsByClientActivity` y `rowsByClientActivity` en una sola pasada. La caché usa `datasetVersion + clientSap + activityId + periodKey`. La agregación compartida consume esas resoluciones; filtros, paginación, ordenamiento, modales y CSV leen el modelo preparado y no recorren nuevamente el workbook.

`performance.monthlyResolutionCacheHits`, `monthlyResolutionCacheMisses` y `monthlyResolutionCacheSize` exponen la preparación del generador. `window.__getDashboardPerformance()` incluye el tamaño y los contadores de la caché del dashboard. `tests/performance-audit.js` mide resolución en frío y desde caché.
