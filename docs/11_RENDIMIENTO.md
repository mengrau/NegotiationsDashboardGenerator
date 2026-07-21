# Rendimiento

## Problema original

El workbook de referencia contiene 18.319 filas. Un enfoque directo volvería a filtrar todas las filas para cada control, reconstruiría análisis idénticos, recrearía ECharts y renderizaría tablas completas. Eso aumenta CPU, memoria y riesgo de interfaz sin respuesta.

## Estrategia implementada

### Índices

`buildIndexes()` prepara búsquedas por nueve campos, actividad, cliente y período. La última auditoría de referencia informó 370 actividades, 464 clientes, dos períodos y 164.583 referencias indexadas. El costo se paga una vez por dataset.

### Cachés LRU

| Caché | Límite | Contenido |
| --- | ---: | --- |
| `filterCache` | 12 | resultados de filtros |
| `analysisCache` | 8 | análisis completos |
| `negotiationUsageCache` | 8 | relaciones cliente-negociacion sin uso |
| `contributionModelCache` | 8 | modelos del explorador |
| `facetedOptionsCache` | 12 | opciones facetadas |
| `timelineCache` | 8 | modelos temporales |

Las claves incluyen versión de dataset y firmas estables. No almacenan nodos DOM.

### Scheduler y versiones

`scheduleDashboardRender()` coordina un único frame pendiente. Cada cambio incrementa `renderVersion`; el último filtro gana. Limpiar filtros no puede ser revertido por un callback antiguo.

### Reutilización de ECharts

`chartInstances` mantiene una instancia por contenedor vigente. `chartSignatures` evita `setOption()` si modelo, tipo y tema no cambiaron. Se hace `dispose()` al retirar una tarjeta o reinicializar dataset, no por resize.

La gráfica temporal redundante fue eliminada. En la vista global de referencia, las definiciones visibles bajan de 12 a 11; no se crea `chartMes`, firma ni opción asociada.

### Debounce y delegación

- resize: 160 ms;
- búsqueda del explorador: 150 ms;
- listeners delegados sobre contenedores estables;
- `lucide.createIcons()` limitado al contenedor actualizado.

### Timeline

El modelo temporal deriva de `activityAnalytics`, tiene LRU de ocho entradas, máximo 36 períodos y ocho filas Gantt. La opción visual no reconstruye el modelo.

### Filtros facetados

Las facetas usan índices, firma y caché. Los catálogos buscables se preparan una vez y no se reconstruyen por pulsación.

## Carga de otro workbook

`initializeDashboardDataset()` cancela frames y debounce, libera instancias, limpia índices, análisis, filtros, facetas, timeline, modal, firmas y diagnósticos. Esto evita referencias al dataset anterior y crecimiento acumulado.

## Mediciones de referencia

Las mediciones son Node.js: incluyen lectura, normalización y cálculo, pero no pintura ni trabajo interno del navegador.

| Operación | Medición de referencia |
| --- | ---: |
| Índices del workbook | ~712 ms |
| Filtro `947124` con índice | ~0,12 ms |
| Repetición del filtro | ~0,03 ms |
| Modelo timeline frío | ~1,90 ms |
| Timeline desde caché | ~0,04 ms |
| Construcción de opciones visuales | menos de 1 ms en la última fase medida |

Los valores cambian entre ejecuciones y deben leerse junto con `npm.cmd run audit:performance`.

## KPI comparable

El KPI no recorre filas. Lee `activityAggregate.sales`, `objective`, `achievement` y `gap` ya calculados. `reconcileComparablePerformance()` ejecuta operaciones escalares constantes.

## Prueba de estabilidad

La suite simula 50 cambios de filtro, 20 limpiezas, 20 ciclos de modal, búsquedas, ordenamientos, actualizaciones de timeline y construcciones CSV. Comprueba límites de caché, listeners, timers, firmas y no mutación de fuentes.

## Node frente a navegador

Node demuestra consistencia, límites y costos de cálculo. No demuestra FPS, pintura de canvas, contraste ni perfil de memoria del navegador. Esas comprobaciones permanecen en [Pruebas y QA](13_PRUEBAS_Y_QA.md) y `../QA_CHECKLIST.md`.
