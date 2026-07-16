# Explorador de contribución

## Cuándo se abre

El explorador se abre desde la gráfica de contribución, la acción de timeline o funciones de detalle. `openActivityContributionDetail()` decide entre configuración compartida e individual.

## Actividad compartida

`buildActivityContributionConfig()` usa `activity.contributionRows` de la población completa de la actividad. Un filtro de cliente no recorta a los demás participantes: solo marca `isSelectedClient`.

El resumen contiene ventas conjuntas, objetivo, cumplimiento, diferencia, vigencia y estado. La tabla presenta:

- cliente SAP y nombre;
- ventas atribuibles;
- participación;
- posición por aporte;
- presentaciones relacionadas.

La participación es `ventas del cliente / ventas conjuntas`. La posición se asigna sobre aporte; empates reciben la misma posición.

## Actividad individual

`buildIndividualActivityDetailConfig()` muestra cliente, venta, objetivo, cumplimiento, diferencia y datos contractuales. No construye tabla competitiva, contribución 100 % ni posición 1 de 1.

## Caso `947124`

El modelo contiene dos clientes:

| Aporte | Venta | Participación | Posición |
| --- | ---: | ---: | ---: |
| Cliente `1000116858` | 371 | 68,58 % | 1 |
| Cliente `1000134867` | 170 | 31,42 % | 2 |

La suma es 541, que coincide con las ventas conjuntas y con el numerador de cumplimiento de la actividad.

## Búsqueda, orden y paginación

El buscador usa código, nombre, razón de negocio y NIT preprocesados. El debounce es 150 ms. Se puede ordenar por ventas, participación, nombre, código o posición.

`DETAIL_EXPLORER_VISIBLE_STEP` es 25. “Mostrar más” aumenta el lote sin reconstruir el análisis. El estado conserva consulta, orden, dirección, cantidad visible y selección interna.

## Modo compacto y responsive

Con dos a cuatro clientes, la configuración marca `compact`. En móvil se presenta una lista de tarjetas en vez de renderizar simultáneamente una tabla oculta. La altura se adapta al contenido.

## Drill-down interno

Una fila puede abrir detalle del cliente o presentación sin cerrar el contexto completo. Antes del cambio se guarda una instantánea en `state.modalNavigation.stack`; **← Volver** restaura consulta, orden, página, selección, scroll y foco sin recalcular la actividad ni reaplicar filtros.

## CSV

`exportDetailExplorerCsv()` exporta las filas visibles según búsqueda y orden. `serializeCsvCell()` escapa comillas, saltos y fórmulas; `downloadCsv()` crea y revoca la Blob URL.

## Accesibilidad

El diálogo tiene `role="dialog"`, `aria-modal`, título y descripción. El foco entra al abrir, queda contenido, Escape cierra y el foco regresa al elemento que abrió. Botones y filas interactivas conservan activación por teclado.

## Caché y rendimiento

`contributionModelCache` es LRU de ocho entradas por dataset, actividad y selección. Reabrir, buscar, ordenar o paginar reutiliza el modelo y no recorre el workbook. Los listeners se delegan una sola vez sobre el overlay estable y el debounce se cancela al cerrar o cambiar dataset.

El fondo se bloquea con `lockPageScroll()` mientras el flujo está abierto. El contador evita desbloquearlo al pasar de detalle a contribución; rueda, teclado y tacto permanecen dentro del contenedor desplazable. No hay listeners de scroll ni render durante el desplazamiento normal.
