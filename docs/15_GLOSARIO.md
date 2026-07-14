# Glosario

| Término | Definición sencilla |
| --- | --- |
| Actividad | Identificador de una negociación y unidad a la que pertenecen objetivo y vigencia. |
| Negociación | Acuerdo comercial representado por una actividad, clientes, presentaciones, objetivo y fechas. |
| Cliente SAP | Cliente identificado por su clave SAP. |
| Presentación | Producto o formato negociado, identificado por clave/texto AS400. |
| Período canónico | Mes normalizado como `AAAAMM`, construido con Año y Mes. |
| `TotalVentaMes` | Venta general resuelta una vez por cliente y período; no pertenece automáticamente a una actividad. |
| Venta física | Venta a nivel granular de presentación, útil para atribuir entre actividades. |
| Venta atribuible | Venta que puede asociarse a una actividad con una fuente identificada. |
| Venta comparable | Venta atribuible de una actividad vigente, con fechas y objetivo válidos, que entra en cumplimiento. |
| Ventas atribuibles comparables | Suma del numerador real de cumplimiento y diferencia. |
| Objetivo mensual | Meta única de una actividad; no se multiplica por clientes ni filas. |
| Cumplimiento | Ventas atribuibles comparables divididas por objetivo comparable. |
| Diferencia | Ventas atribuibles comparables menos objetivo comparable. |
| Contribución | Venta aportada por un cliente a una actividad compartida. |
| Actividad compartida | Actividad asociada a dos o más clientes y evaluada de forma conjunta. |
| Actividad individual | Actividad asociada a un único cliente. |
| Cobertura | Cantidad/proporción de actividades comparables dentro de las evaluadas. |
| Vigencia | Intervalo entre fecha de inicio y fin que toca el período analizado. |
| Histórico previo | Venta anterior al inicio; visible como contexto, fuera del cumplimiento. |
| Posterior al fin | Venta posterior a la terminación; contexto no comparable. |
| Fecha conflictiva | Más de una combinación de fechas para la misma actividad. |
| Venta ambigua | Venta que no puede atribuirse con certeza a una actividad. |
| KPI | Indicador resumido en una tarjeta. |
| Drill-down | Apertura de un detalle desde una gráfica o resumen. |
| Fallback | Representación alternativa cuando una librería o recurso falla. |
| Caché | Almacenamiento temporal de resultados reutilizables. |
| Índice | Mapa preparado para encontrar filas/relaciones sin recorrer todo el dataset. |
| Scheduler | Coordinador que ordena renders y descarta actualizaciones obsoletas. |
| LRU | Caché acotada que elimina el resultado menos usado recientemente. |
| Firma | Clave estable de filtros, modelo o visualización usada para detectar igualdad. |
| ECharts | Librería que dibuja las gráficas interactivas. |
| Lucide | Librería de iconos; el dashboard mantiene fallbacks si falta. |
| CDN | Servicio externo desde el que se cargan librerías y fuentes. |
| Faceta | Lista de opciones de un filtro calculada en relación con los demás filtros. |
| Estado derivado | Información calculada del contexto que no es una selección explícita. |
| HTML generado | Archivo portable que incluye datos normalizados, estilos y lógica del dashboard. |

Para ejemplos completos, consulte [Reglas de negocio](04_REGLAS_DE_NEGOCIO.md) e [Indicadores y fórmulas](06_INDICADORES_Y_FORMULAS.md).
