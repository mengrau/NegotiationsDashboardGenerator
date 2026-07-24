# Reglas de negocio

Este documento explica las reglas que implementan `resolveMetricGroups()`, `buildActivityAnalytics()`, `aggregateActivityPerformance()` y funciones relacionadas en `app.js` y `dashboard-template.js`.

## 1. Resolución de `TotalVentaMes`

**Granularidad:** cliente SAP + período canónico.

Durante la vigencia, `TotalVentaMes` es la venta comparable usada como numerador del cumplimiento. Incluye ventas de presentaciones negociadas y no negociadas.

`TotalVentaMes` no pertenece a una presentación ni necesariamente a una actividad. `resolveMetricGroups()` agrupa todas las filas de una clave cliente-período y aplica estas reglas:

| Valores encontrados | Resultado | Estado |
| --- | ---: | --- |
| 120, 120, 120 | 120 | OK |
| 0, 0, 120 | 120 | OK; se prefiere el único no cero |
| 0, 0 | 0 | OK; cero confirmado |
| vacío, vacío | ausente | SIN_VALOR |
| 120, 150 | ausente | CONFLICTO |

Nunca se suman las repeticiones por presentación. Si un cliente tiene 120 repetido en diez filas, su venta del período sigue siendo 120.

## 2. Objetivo mensual

**Granularidad:** actividad.

El objetivo se resuelve una vez por `ID Actividad`. No se multiplica por:

- clientes asociados;
- presentaciones negociadas;
- filas del workbook;
- repeticiones del mismo período.

Valores distintos para una misma actividad producen `OBJETIVO_CONFLICTIVO`; no se elige máximo, promedio ni suma. Un objetivo ausente produce `SIN_OBJETIVO`.

## 3. Actividad compartida

Una actividad es compartida cuando `activityClientRelations` encuentra más de un cliente asociado.

- El objetivo mensual es conjunto.
- Las ventas conjuntas son la suma de contribuciones atribuibles.
- El cumplimiento es conjunto: ventas conjuntas / objetivo de la actividad.
- La diferencia es ventas conjuntas - objetivo.
- Cada cliente recibe una contribución y una participación sobre la venta conjunta.
- La posición ordena aporte, no desempeño individual.

No existe “cumplimiento del cliente” frente al objetivo completo. Ese lenguaje induciría a comparar una parte con un contrato conjunto.

### Ejemplo `947124`

En junio de 2026 la actividad tiene dos clientes, ventas conjuntas 541 y objetivo 1.100. Las contribuciones son 371 y 170, equivalentes a 68,58 % y 31,42 %. El cumplimiento es 541 / 1.100 = 49,18 % y la diferencia es -559.

El caso se descubre desde el workbook y las pruebas; no está codificado como excepción de producción.

## 4. Actividad individual

Una actividad con un solo cliente usa la venta total comparable de ese cliente, su objetivo único, cumplimiento y diferencia. No muestra:

- contribución 100 %;
- posición 1 de 1;
- ranking competitivo.

### Ejemplo `874894`

El cliente `1002564657` tiene ventas 549,252 y objetivo 500. El cumplimiento es 109,85 % y la diferencia sin redondear es 49,252.

## 5. Cliente con varias actividades

Cuando un cliente comparte período con varias actividades, `TotalVentaMes` no puede copiarse completo en cada una. La aplicación intenta usar venta física a granularidad cliente + actividad + presentación + período.

Para el agregado:

1. conserva actividades con objetivo y fechas válidas;
2. conserva ventas atribuibles sin ambigüedad;
3. suma ventas comparables;
4. suma objetivos únicos comparables;
5. divide los totales.

No promedia porcentajes. Por ejemplo, actividades con 60/100 y 40/200 producen 100/300 = 33,33 %, no el promedio de 60 % y 20 %.

Si la fuente granular no permite decidir a qué actividad pertenece la venta, el estado es `VENTA_ACTIVIDAD_AMBIGUA` y no se distribuye arbitrariamente.

## 6. Vigencia y comparabilidad temporal

Una actividad está vigente en un mes si su intervalo toca cualquier día del mes:

```text
fechaInicio <= finDelMes
y
fechaFin >= inicioDelMes
```

No se exige que empiece el día uno ni termine el último día. `isActivityActiveInPeriod()` implementa esta intersección.

## 7. Histórico previo

Una venta de período anterior al inicio es `HISTORICO_PREVIO`:

- se muestra en la timeline;
- ayuda a entender al cliente;
- no entra en ventas atribuibles comparables;
- no recibe objetivo;
- no entra en cumplimiento ni diferencia.

### Ejemplo `1002559342`

Mayo de 2026 registra 53.956 y junio 67.401, total 121.357. Las actividades `965821` y `965923` empiezan el 1 de julio de 2026. Mayo y junio permanecen como histórico previo.

## 8. Posterior al fin

Una venta posterior a la fecha final se presenta como contexto atenuado. No se compara contra el objetivo de una actividad terminada.

## 9. Estados que impiden comparabilidad

### Venta ambigua

La venta no puede asociarse con certeza a una actividad. Se excluye del numerador comparable y se conserva la advertencia.

### Fechas conflictivas

Una actividad tiene más de una combinación de inicio/fin. No se elige una fecha conveniente ni se dibuja una banda falsa. La timeline presenta un estado informativo.

### Sin objetivo

La venta puede existir, pero si no participa en cumplimiento por falta de objetivo tampoco entra en `Ventas atribuibles comparables`.

### Objetivo conflictivo

Dos objetivos mensuales distintos para la misma actividad impiden comparación. No se promedian ni suman.

### Sin ventas

Un `TotalVentaMes` ausente no se convierte en cero. La venta física vacía sí se normaliza a cero para clasificar presentaciones, porque esa columna tiene una regla distinta.

## Clientes negociados sin ventas

La unidad del KPI es `Cliente SAP`. Se incluyen únicamente filas con cliente SAP, actividad y `TotalVentaMes` informado explícitamente como cero; vacíos, nulos, inválidos y positivos quedan fuera. Primero se consolidan `Cliente SAP + ID Actividad` y luego el cliente, por lo que presentaciones y actividades repetidas no aumentan el indicador.

Estas filas no tienen `Año`, `Mes` ni `Año Mes`. No se asigna el último período, el filtro seleccionado, la fecha contractual ni otro período artificial. El filtro Mes no participa en este KPI. Las fechas solo producen el estado contractual informativo Vigente hoy, Planeada, Finalizada, Fechas no disponibles o Fechas conflictivas.

### Actividad aún no iniciada

La venta histórica puede mostrarse, pero cumplimiento, diferencia y venta comparable quedan como no disponibles. El objetivo contractual puede mostrarse con la aclaración de que todavía no es comparable.

## 10. Agregación comparable

`aggregateActivityPerformance()` filtra primero actividades con objetivo y fechas válidas y después las comparables. Su salida incluye:

- `sales`: ventas atribuibles comparables;
- `objective`: objetivo comparable;
- `objectiveAll`: objetivos elegibles, incluso si una actividad no terminó siendo comparable por venta;
- `achievement`: `sales / objective`;
- `gap`: `sales - objective`;
- conteos comparable, elegible y total.

El KPI global usa `sales` y `objective`, no `objectiveAll`, para que numerador, denominador y diferencia pertenezcan a la misma población.

## 11. Reconciliación

`reconcileComparablePerformance()` valida valores completos, antes del formato:

```text
diferencia = ventas atribuibles comparables - objetivo comparable
cumplimiento = ventas atribuibles comparables / objetivo comparable
```

La tolerancia predeterminada es `1e-9`. Un contexto sin objetivo comparable devuelve consistencia no aplicable, no un éxito artificial.

## 12. Avance contra el objetivo total

La futura tabla usa un contrato adicional, sin sustituir el KPI mensual existente:

```text
avance total = ventas atribuibles comparables acumuladas / objetivo total
diferencia total = ventas atribuibles comparables acumuladas - objetivo total
```

`Objetivo cajas total`, `Objetivo mes` y `% De inversión` se resuelven una vez por actividad. Si `objetivo mes × Periodo negociacion` no coincide con el total fuente, se conserva el total fuente y se registra `OBJETIVO_TOTAL_NO_COINCIDE_CON_FORMULA`. Inversión repetida igual se conserva; vacío más un único valor adopta el valor; valores distintos producen `INVERSION_CONFLICTIVA`.

`Porcentaje descuento mes` se resuelve por cliente + actividad + período. Cero junto con un único positivo conserva el positivo; positivos distintos producen `DESCUENTO_MENSUAL_CONFLICTIVO`. `Porcentaje descuento negociación` puede variar por presentación y se resume sin promedio como `UNICO`, `VARIOS` o `SIN_DATO`.

El estado principal se resuelve por período: `CUMPLE_MES` con venta atribuible comparable / objetivo mensual mayor o igual a 1; `NO_CUMPLE_MES` con cociente válido inferior a 1; y `NO_EVALUABLE_MES` sin objetivo mensual, vigencia o atribución confiable. Los porcentajes mensuales nunca se promedian: un resumen multiactividad divide la suma de ventas comparables entre la suma de objetivos mensuales únicos.

El objetivo total conserva un estado independiente: `CUMPLIO_OBJETIVO_TOTAL`, `EN_PROGRESO_OBJETIVO_TOTAL` o `NO_EVALUABLE_TOTAL`. En actividad compartida ambos numeradores usan la venta conjunta y los estados pertenecen a la negociación; el aporte individual queda separado. Por eso son válidas combinaciones como “cumple mes y total en progreso” o “no cumple mes y objetivo total cumplido”.

## Cero explícito sin período

Un registro sin `Año`, `Mes` y `Año Mes` no recibe un período artificial. No obstante, puede aportar cero al análisis de un mes vigente cuando todas las filas de la misma relación cliente–actividad tienen `TotalVentaMes = 0`, sus ventas físicas son cero o están clasificadas consistentemente sin venta, y no existe ningún positivo ni conflicto.

La prioridad es: información específica del mes; cero explícito sin período; información mensual no disponible. Los conflictos nunca se degradan a cero. En actividades compartidas, todos los clientes resueltos —incluidos los ceros— producen evaluación completa. Si falta alguno, se conserva la venta conocida bajo `SHARED_ACTIVITY_PARTIAL_INFORMATION`, sin calcular cumplimiento definitivo.
