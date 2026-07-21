# Contrato analítico del generador

Este documento registra la auditoría previa al rediseño. Las reglas no dependen del archivo de prueba: se aplican a cualquier libro que cumpla el contrato de columnas.

## Regla vigente de venta comparable

El numerador del cumplimiento mensual es `TotalVentaMes`, resuelto una sola vez por cliente SAP y período, siempre que la actividad esté vigente y sea evaluable. `Ventas cajas físicas (sin rep)` calcula la venta de presentaciones negociadas; la venta no negociada es la diferencia contra la venta total. Esta composición es informativa y no excluye ventas del cumplimiento.

Una actividad compartida suma una sola vez la venta total de cada cliente asociado. Un cliente multiactividad usa su venta total una sola vez en el agregado contra objetivos únicos y queda sin cumplimiento individual por actividad hasta contar con una regla verificable de distribución.

## Inventario original

Los KPI del HTML generado incluyen ventas del período, ventas del último mes, objetivo, cumplimiento, diferencia, clientes negociados sin ventas y negociaciones vigentes.

Las visualizaciones adaptativas cubren Región SAP, canal, categoría, clientes, presentaciones, CEDI y serie mensual. El detalle de clientes negociados sin ventas se concentra en el KPI y su modal paginado para evitar una gráfica redundante.

## Granularidad y reglas de agregación

| Campo | Granularidad observada y contrato | Regla |
| --- | --- | --- |
| `Ventas cajas físicas (sin rep)` | Fila de presentación y período | Se suma por fila cuando se analiza producto, categoría o presentación. No sustituye `TotalVentaMes`. |
| `TotalVentaMes` | Cliente y período; puede repetirse solo en algunas filas y coexistir con ceros | Se agrupa por cliente + período canónico. Se ignoran ceros cuando existe un único valor positivo. Dos valores positivos distintos generan conflicto; nunca se suman las filas. |
| `Objetivo mes` | Actividad o negociación | Se resuelve una sola vez por `ID Actividad`. El objetivo se aplica en cada período en que la actividad está vigente; nunca se multiplica por clientes o presentaciones. |
| `Objetivo cajas total` | Actividad o negociación | Se resuelve una sola vez por `ID Actividad`. Se conserva como contexto contractual y cualquier valor diferente dentro de la actividad genera conflicto. |
| `% De inversión` | Actividad | Se resuelve una vez por actividad; valores distintos generan `INVERSION_CONFLICTIVA`. No se suma ni promedia. |
| `Porcentaje descuento negociación` | Presentación dentro de la negociación | Se conserva como resumen `UNICO`, `VARIOS` o `SIN_DATO`, con todos los valores. No se promedia. |
| `Porcentaje descuento venta` | Fila informativa | Se conserva para detalle; no interviene en cumplimiento. |
| `Porcentaje descuento mes` | Cliente + actividad + período | Se resuelve sin sumar ni promediar; valores positivos distintos generan `DESCUENTO_MENSUAL_CONFLICTIVO`. |
| `ID Actividad` | Negociación | Se usa para deduplicar negociaciones, vigencia y presentaciones negociadas; no para multiplicar el objetivo mensual. |
| `Cliente SAP - Clave` | Cliente | Participa en la clave de venta mensual. Frente a una actividad compartida, su venta representa contribución, no cumplimiento individual. |
| `Presentación AS400 de la venta - Clave` | Producto/presentación | Se conserva como texto alfanumérico. El estado consolidado prioriza `CON_VENTA`, luego `VENTA_CERO`, luego `SIN_INFORMACION_VENTA`. |
| `Año Mes` | Etiqueta fuente no confiable para ordenar | El período canónico se construye primero con `Año` + `Mes`; solo usa formatos validados de `Año Mes` como respaldo. |

## Resolución de conflictos

Toda resolución conserva `value`, `status` y `sourceValues`. `status` puede ser `OK`, `AUSENTE`, `CERO` o `CONFLICTO`. Los conflictos producen un valor nulo y una incidencia de calidad; nunca se convierten en texto dentro de un campo numérico.

## Actividades individuales y compartidas

Una actividad es compartida cuando contiene más de un `Cliente SAP - Clave` único. El objetivo mensual pertenece siempre a la actividad completa.

- Actividad individual: `TotalVentaMes` del único cliente se asigna a la actividad cuando esta es la única negociación activa del cliente en el período.
- Actividad multicliente: las ventas conjuntas son la suma de las ventas atribuibles de todos sus clientes.
- Contribución del cliente: venta atribuible del cliente dividida por ventas conjuntas de la actividad.
- Cumplimiento de la actividad: ventas conjuntas divididas por el objetivo mensual único.
- Diferencia: ventas conjuntas menos objetivo mensual.

La contribución no se denomina “cumplimiento del cliente”, porque no existe un objetivo individual en la fuente.

## Cliente con varias actividades

Para cada cliente-período se cuentan las actividades vigentes asociadas:

- `UNICA_ACTIVIDAD`: se utiliza el `TotalVentaMes` resuelto completo.
- `MULTIPLES_ACTIVIDADES`: se usa `Ventas cajas físicas (sin rep)` resuelta por cliente + actividad + presentación + período.
- Si no existe venta granular confiable, se marca `VENTA_ACTIVIDAD_AMBIGUA`; no se duplica `TotalVentaMes`, no se distribuye por partes iguales y el cumplimiento queda `N/A`.

La venta granular se resuelve una vez por presentación. Valores diferentes para la misma clave generan `VENTA_CONFLICTIVA`.

## Vigencia y conflictos

Una actividad aplica a un período cuando `fechaInicio <= finDeMes` y `fechaFin >= inicioDeMes`. Fechas fuente diferentes dentro de la misma actividad producen `FECHAS_CONFLICTIVAS`; no se elige silenciosamente la primera, mínima o máxima.

Los estados analíticos son `OK`, `SIN_OBJETIVO`, `SIN_VENTAS`, `OBJETIVO_CONFLICTIVO`, `VENTA_CONFLICTIVA`, `VENTA_ACTIVIDAD_AMBIGUA` y `FECHAS_CONFLICTIVAS`.

## Métricas ejecutivas

- Ventas totales: suma de los valores de `TotalVentaMes` resueltos una vez por cliente-período.
- Ventas del último mes: valores resueltos para el período canónico máximo.

## Selección contextual de KPI

Los KPI se seleccionan a partir del modelo analítico ya construido y del filtro activo. El selector no vuelve a recorrer el workbook.

En una actividad compartida, el cliente tiene contribución y posición frente a los demás clientes asociados. En una actividad individual, contribución y posición siempre serían 100 % y 1 de 1, por lo que son redundantes y no se muestran.

El objetivo mensual siempre pertenece a la actividad, incluso cuando el filtro principal es un cliente. Cuando un cliente participa en varias actividades, el objetivo agregado es la suma de los objetivos únicos de las actividades comparables; el cumplimiento se obtiene dividiendo los totales y nunca promediando porcentajes.

| Contexto | KPI principales |
| --- | --- |
| Actividad compartida | Ventas conjuntas, objetivo de la actividad, cumplimiento conjunto, diferencia, clientes, presentaciones, estado y vigencia |
| Cliente en actividad compartida | Ventas del cliente, objetivo completo de la actividad, contribución, ventas conjuntas, cumplimiento conjunto, diferencia, clientes y posición |
| Actividad individual | Ventas de la actividad, objetivo, cumplimiento, diferencia, presentaciones, estado, vigencia y cliente asociado |
| Cliente en actividad individual | Ventas del cliente, objetivo de la actividad, cumplimiento, diferencia, presentaciones, estado, vigencia y actividad relacionada |
| Cliente multiactividad | Ventas atribuibles comparables, objetivos únicos agregados, cumplimiento por totales, diferencia y cobertura secundaria |
| Varias actividades | Ventas comparables, objetivos únicos agregados, cumplimiento por totales, diferencia, actividades y clientes relacionados |

Una actividad aún no iniciada puede mostrar su objetivo contractual y las ventas históricas relacionadas, pero cumplimiento y diferencia permanecen no disponibles. SIN_OBJETIVO, OBJETIVO_CONFLICTIVO y VENTA_ACTIVIDAD_AMBIGUA también impiden calcular cumplimiento y diferencia; el objetivo se presenta como No disponible, Revisar o su valor contractual según corresponda.

## Explorador de contribución

El explorador de contribución se muestra únicamente cuando la actividad tiene más de un cliente. En actividades individuales no se muestran participación ni posición, porque serían valores redundantes; cualquier acceso programático abre un detalle neutral de la actividad.

Cuando se abre una actividad compartida desde un cliente filtrado, el explorador conserva todos los clientes de la negociación y destaca discretamente los clientes seleccionados. El filtro no cambia las ventas conjuntas, las participaciones ni el ranking de la actividad completa.

El ranking ordena por ventas atribuibles, conserva posiciones compartidas para empates y no representa cumplimiento individual. La participación es la venta del cliente dividida por las ventas conjuntas atribuibles; su barra visual usa un color neutral y no expresa evaluación de desempeño.

## Presentación y sincronización de filtros

Los filtros explícitos se almacenan en una fuente de verdad central. El contexto derivado de una actividad o cliente —tipo compartido, vigencia, región resultante o cantidad de registros— no se considera automáticamente un filtro.

Los filtros aplicados desde el panel, chips, gráficas o exploradores se reflejan en los mismos controles. La sincronización visual nunca cambia las fórmulas ni agrega dimensiones derivadas al estado analítico.
- Objetivo del último mes: suma del objetivo de cada actividad vigente y válida, una sola vez por actividad.
- Cumplimiento agregado: suma de ventas de actividades comparables / suma de objetivos de esas mismas actividades. Nunca se promedian porcentajes simples.
- Diferencia agregada: ventas atribuibles comparables menos objetivos comparables.
- Cobertura: actividades comparables sobre actividades elegibles. Las ambiguas permanecen visibles, pero fuera del cociente.
- Clientes negociados sin ventas: cliente SAP único con al menos una actividad y `TotalVentaMes` explícitamente igual a cero. No requiere ni infiere período.
- Negociaciones vigentes: actividades únicas con fechas válidas que contienen la fecha actual.

Los umbrales de cumplimiento son: favorable desde 100 %, atención desde 90 % hasta menos de 100 %, y desfavorable por debajo de 90 %.

## Ejemplos semánticos

- Una actividad con un cliente y objetivo 100 usa la venta atribuible de ese cliente, pero conserva el objetivo a nivel de actividad.
- Una actividad con tres clientes que venden 4.000, 3.500 y 2.000 cajas tiene venta conjunta 9.500. Frente a un objetivo 10.000, su cumplimiento es 95 % y su diferencia −500.
- El primer cliente contribuye 42,11 % a la negociación; no tiene “42,11 % de cumplimiento”.
- Si un cliente participa simultáneamente en dos actividades, sus cajas físicas por presentación atribuyen la venta. Sin esa granularidad, ambas actividades quedan marcadas para revisión.
- Varias actividades se agregan sumando ventas y objetivos comparables; un 50 % y un 100 % no se promedian si sus objetivos tienen pesos diferentes.

## Política adaptativa

- Una dimensión sin valores no genera filtro ni gráfica.
- Una dimensión con un único valor se presenta como contexto, no como filtro ni comparativo.
- Tendencia temporal requiere al menos dos períodos; con dos usa columnas, con tres o más usa línea.
- Región, canal, cliente y CEDI requieren al menos dos valores.
- Categoría y presentación requieren al menos dos grupos con valores analizables.
- Estado de presentaciones requiere al menos dos estados con conteo positivo.
- Clientes negociados sin ventas se consulta desde el KPI: una fila por cliente, segundo nivel de negociaciones y tercer nivel de presentaciones. El mismo modal conserva página, orden, selección y scroll al volver.

La clasificación está centralizada en `hasExplicitZeroTotalMonthlySales()`. La venta física y la composición negociada/no negociada no determinan este KPI. Los objetivos se deduplican por actividad y son solo informativos.

## Riesgos corregidos

- La selección de la primera fila hacía que `TotalVentaMes` dependiera del orden.
- El objetivo se resolvía con granularidad cliente-período en lugar de actividad.
- Un `TotalVentaMes` podía duplicarse al atribuirlo completo a varias actividades simultáneas.
- `Año Mes` podía ordenarse como el número `52026`, que falla al cruzar años.
- Vigencias se contaban por fila y no por negociación.
- Filtros y gráficas de cardinalidad uno ocupaban espacio sin aportar comparación.
- La tabla completa contradecía el patrón de detalle bajo demanda.

## Auditoría de `INSUMO DASHBOARD (3).xlsx`

La auditoría reproducible (`npm.cmd run audit:workbook`) encontró 14.623 filas, 382 clientes, 326 actividades y 386 relaciones cliente–actividad. De las actividades, 304 son individuales y 22 compartidas; cuatro clientes participan en más de una actividad. Los períodos disponibles se descubren dinámicamente y, en el archivo auditado, son mayo y junio de 2026.

Se conservaron 161 filas sin período de venta. El modelo nuevo no detectó conflictos de venta mensual, objetivo, inversión ni descuento mensual. En mayo, 47 relaciones cumplen el objetivo mensual, 191 no lo cumplen y 148 no son evaluables. En junio, 92 cumplen, 276 no cumplen y 18 no son evaluables. Frente al objetivo total, 364 negociaciones están en progreso y 22 no son evaluables; ninguna lo ha completado todavía. Estos conteos son resultados de auditoría, no constantes de producción.

## Línea de tiempo analítica

`buildNegotiationTimelineAnalysis()` deriva su modelo de `activityAnalytics`, objetivos, relaciones y ventas cliente-período ya preparados. No recorre de nuevo las filas del workbook. La línea de tiempo muestra ventas anteriores al inicio como histórico, pero solo los períodos dentro de la vigencia y con venta atribuible participan en el cumplimiento de la actividad.

Los períodos se clasifican como `HISTORICO_PREVIO`, `PERIODO_COMPARABLE`, `VIGENTE_SIN_VENTA_ATRIBUIBLE`, `VENTA_ACTIVIDAD_AMBIGUA`, `POSTERIOR_AL_FIN`, `FECHAS_CONFLICTIVAS`, `SIN_OBJETIVO`, `OBJETIVO_CONFLICTIVO` o `SIN_INFORMACION`. Un vacío de venta no se convierte en cero confirmado. El objetivo solo se dibuja cuando la venta y la vigencia hacen comparable el período; antes del inicio, después del fin, con objetivo ausente/conflictivo o con atribución ambigua permanece fuera de la referencia visual.

Una actividad individual usa su única venta atribuible. Una actividad compartida usa como serie principal las ventas conjuntas y presenta el aporte del cliente seleccionado únicamente como aporte, no como cumplimiento. En contexto de cliente, el histórico previo puede usar `TotalVentaMes` del cliente; nunca se asigna ese total completo a cada actividad relacionada.

Con una actividad se muestra detalle mensual, fechas exactas, banda de vigencia y objetivo comparable. Con dos a ocho actividades se muestran bandas independientes tipo Gantt; no existe una banda ni un objetivo único falsos. Con más de ocho se usa un resumen de estados. El rango mensual continuo está limitado a 36 períodos y activa zoom desde 13; el modelo registra si tuvo que compactarlo.

Una fecha final ausente queda como vigencia incompleta. Varias combinaciones de fechas producen `FECHAS_CONFLICTIVAS`: no se elige mínimo, máximo ni moda y no se dibuja banda. Sin ECharts se conserva una lista temporal o Gantt nativo con estados textuales. La tarjeta lee `state.filters`; sus acciones pasan por `updateDashboardFilters()` y el acceso a contribución reutiliza el explorador existente.

Los ajustes de layout de la Fase 6 son exclusivamente visuales y no modifican la población, granularidad, atribución ni fórmulas de los indicadores.

## Contrato de integración final

Filtros, KPI, timeline y explorador consumen el mismo `activityAnalytics` construido para el ámbito vigente. Los límites de error incorporados en la Fase 7 solo sustituyen la presentación técnica fallida por un mensaje; nunca reemplazan conflictos, ausencias o ambigüedades con cero ni alteran la población analítica.

La validación de columnas distingue campos obligatorios de dimensiones analíticas opcionales e información descriptiva. Una columna opcional ausente puede retirar su visualización, pero no modifica las reglas de ventas, objetivos, atribución o vigencia disponibles con las columnas obligatorias.

Los cambios de la Fase 8 son exclusivamente de visualización. La línea suavizada, donut, treemap, lollipop y las barras conservadas consumen exactamente las mismas poblaciones, ventas, objetivos, estados temporales y granularidades descritas en este contrato.

## Coherencia visible de indicadores

La Fase 9 expone `comparableSales` como **Ventas atribuibles comparables** y usa `comparableObjective` en la tarjeta de objetivo reconciliable. No introduce una fórmula: muestra el numerador y denominador que ya consumían `compliance` y `objectiveDifference`.

`Ventas totales` continúa resolviendo `TotalVentaMes` por cliente y período. La cobertura comparable se conserva como texto secundario, no como KPI principal. `reconcileComparablePerformance()` comprueba las dos identidades con valores completos y tolerancia `1e-9`.

## Copia ejecutiva

Los títulos visibles se resuelven desde `UI_COPY`. La vista global presenta **Ventas totales**, **Ventas último mes**, **Ventas comparables**, **Objetivo mensual**, **Cumplimiento mensual** y **Diferencia frente al objetivo**. Las descripciones identifican ventas y objetivos en cajas físicas, y la diferencia usa un mensaje coherente con el signo; ninguna etiqueta modifica poblaciones, fórmulas o estados analíticos.

## Contrato analítico de cliente–negociación

`normalizeWorkbookRow()` crea aliases internos estables sin retirar las claves usadas por las vistas vigentes. `buildClientNegotiationModels()` construye:

- `clientActivitySummary`, a granularidad `Cliente SAP + ID Actividad`;
- `clientSummary`, a granularidad `Cliente SAP`, derivado del anterior;
- `availablePeriods`, ordenado mediante claves `AAAAMM`;
- `summaryTableColumns`, con venta, descuento, cumplimiento y estado por cada período real.

`TotalVentaMes` permanece a nivel cliente–período. La venta atribuible se resuelve primero por cliente, actividad, período y presentación, y luego se agrega. El objetivo mensual, objetivo total e inversión se resuelven una sola vez por actividad. El descuento mensual pertenece a cliente + actividad + período; el descuento de negociación conserva un resumen `UNICO`, `VARIOS` o `SIN_DATO` y no se promedia.

El estado principal es mensual. `CUMPLE_MES` significa venta atribuible comparable del mes mayor o igual al objetivo mensual; `NO_CUMPLE_MES`, un cociente válido inferior a uno; y `NO_EVALUABLE_MES`, ausencia de objetivo, vigencia o atribución confiable. `monthlyComplianceByMonth` y `monthlyStatusByMonth` conservan todos los períodos sin promediar porcentajes. `selectedStatusPeriod` usa el mes filtrado o, por defecto, el último período disponible.

El objetivo total responde otra pregunta. `CUMPLIO_OBJETIVO_TOTAL` indica avance acumulado mayor o igual a uno; `EN_PROGRESO_OBJETIVO_TOTAL`, avance válido inferior a uno; y `NO_EVALUABLE_TOTAL`, cálculo acumulado no confiable. Para una actividad compartida ambos estados usan ventas conjuntas y pertenecen a la negociación completa; la contribución del cliente permanece separada.

## Contrato de la tabla de seguimiento

La tabla consume `clientActivitySummary` a granularidad cliente–actividad. La venta mostrada para reconciliar cumplimiento usa el numerador comparable: aporte atribuible en actividad individual y venta conjunta en actividad compartida. El detalle conserva además `TotalVentaMes` del cliente y su aporte individual, con una advertencia explícita de que venta general y venta atribuible no son equivalentes. Los filtros locales solo cambian la proyección; las acciones de navegación llaman a `updateDashboardFilters()`.

Los campos `% De inversión`, `Porcentaje descuento mes`, `Porcentaje descuento venta` y `Porcentaje descuento negociación` se normalizan al cargar mediante `normalizePercentage()`. Internamente siempre son decimales: un `10`, `10.00`, `10,00` o `10%` se convierte en `0.10`; un `0.10` permanece `0.10`. La tabla y el detalle formatean el decimal al presentar. Valores diferentes conservan el estado de conflicto o `VARIOS` y no se promedian.
