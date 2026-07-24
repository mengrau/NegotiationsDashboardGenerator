# Indicadores y fórmulas

## Regla central

La venta comparable mensual es `TotalVentaMes` dentro de la vigencia. La venta negociada se obtiene de `Ventas cajas físicas (sin rep)` y la venta no negociada es la diferencia; sus porcentajes explican composición, pero ambas porciones participan en cumplimiento.

En multiactividad el total del cliente se usa una sola vez contra la suma de objetivos únicos y no se copia a cada actividad.

## Contrato central

```text
Cumplimiento = Venta total comparable / Objetivo comparable

Diferencia = Venta total comparable - Objetivo comparable
```

Las fórmulas se evalúan con números completos. El formato `es-CO` se aplica después.

## KPI globales

| KPI | Fuente y población | Fórmula | Exclusiones e interpretación |
| --- | --- | --- | --- |
| Ventas totales | `TotalVentaMes` resuelto por cliente + período | suma de grupos resueltos | Incluye la venta registrada en el período seleccionado. |
| Ventas del último mes | Igual fuente, solo período máximo filtrado | suma de grupos del último mes | No es venta atribuida a una actividad. |
| Ventas comparables | `activityAggregate.sales` / `kpis.comparableSales` | suma de `TotalVentaMes` sin duplicar cliente-período | Excluye histórico, posterior al fin, multiactividad sin distribución, fechas u objetivo inválidos. |
| Objetivo mensual | `activityAggregate.objective` / `kpis.comparableObjective` | suma de objetivos únicos comparables | No usa `objectiveAll` en la tarjeta reconciliable. |
| Cumplimiento mensual | mismos numerador y denominador | ventas comparables / objetivo comparable | No promedia porcentajes. |
| Diferencia frente al objetivo | misma población | ventas comparables - objetivo comparable | Positiva sobre objetivo; negativa bajo objetivo. Los valores se expresan en cajas físicas. |
| Clientes negociados sin ventas | `negotiationUsageAnalysis.totalUniqueClients` | conteo único de `Cliente SAP` | Incluye filas con actividad válida y `TotalVentaMes` explícitamente igual a cero; no requiere período. |

```text
Cliente negociado sin ventas = cliente SAP válido
                              ∧ ID Actividad válido
                              ∧ TotalVentaMes informado
                              ∧ TotalVentaMes === 0
```

La venta física y la composición negociada/no negociada son informativas y no cambian este estado. Año, Mes y Año Mes no se completan ni se infieren.
| Negociaciones vigentes | actividad única con vigencia actual | conteo único | No cuenta filas ni clientes. |

La cobertura se muestra como texto secundario: `Cobertura: X de Y actividades`. Ya no ocupa una tarjeta principal.

## Por qué Ventas totales no coincide con la diferencia

`TotalVentaMes` y ventas atribuibles comparables tienen poblaciones distintas:

```text
TotalVentaMes ≠ ventas atribuibles comparables
```

La venta general puede incluir períodos previos, posteriores, actividades ambiguas o venta sin actividad comparable. Por tanto, esta operación no es la fórmula del sistema:

```text
Ventas totales - objetivo
```

En el workbook de referencia, la última auditoría produjo venta general del período de 662.713,715 y venta general del último mes de 361.527,007. Para las actividades comparables del último mes, el numerador fue 254.043,659 y el objetivo comparable 242.422. Así:

```text
254.043,659 / 242.422 = 104,79 %
254.043,659 - 242.422 = 11.621,659
```

La diferencia se reconcilia con el numerador comparable, no con 361.527,007.

## Estados no disponibles

`Ventas atribuibles comparables` muestra **No disponible** cuando no existe ninguna actividad que participe en cumplimiento. Un cero se muestra únicamente si hay al menos una actividad comparable y su venta atribuible confirmada es cero.

El objetivo y las fórmulas también quedan no disponibles con objetivo ausente/cero, conflicto de objetivo, fechas conflictivas, venta ambigua o actividad aún no iniciada.

## KPI contextuales

En vista general se conserva **Clientes negociados sin ventas**. Con exactamente un cliente seleccionado, esa información global se sustituye por:

- **Estado de la negociación** si existe una sola actividad efectiva: Vigente, Por iniciar, Finalizada, No evaluable o Revisar fechas;
- **Negociaciones del cliente** si existen varias: cuenta cada `ID Actividad` una sola vez y resume vigentes, futuras y finalizadas;
- **Sin negociación asociada** cuando el modelo preparado no contiene relaciones válidas para los filtros.

La tarjeta consume `clientActivitySummary`; no vuelve a recorrer el workbook. Los códigos técnicos permanecen en diagnósticos y el texto visible explica la causa.

### Varias actividades

- Ventas atribuibles de las actividades.
- Objetivo agregado comparable.
- Cumplimiento agregado por totales.
- Diferencia atribuible.
- Cobertura en la descripción.

### Cliente con varias actividades

El numerador usa `selectedComparableContributionSales`: aporte atribuible del cliente dentro de actividades comparables. Los objetivos se mantienen únicos por actividad. No se copia `TotalVentaMes` a cada negociación.

### Actividad compartida

- **Ventas conjuntas de la actividad:** suma atribuible de todos los clientes; numerador del cumplimiento.
- **Objetivo mensual:** objetivo conjunto.
- **Contribución:** venta del cliente / venta conjunta.
- **Posición:** ranking por aporte.

No se agrega otra tarjeta llamada ventas comparables porque duplicaría ventas conjuntas.

### Actividad individual

- **Ventas de la actividad:** venta atribuible comparable del único cliente.
- **Objetivo mensual:** objetivo único.
- **Cumplimiento y diferencia:** mismas fórmulas.

## Avance acumulado en el detalle

**Ventas comparables acumuladas** representa las ventas utilizadas para medir el avance total. Se mantiene separada de **Ventas totales acumuladas** y **Ventas negociadas acumuladas**. Si venta total y comparable son iguales, la interfaz consolida ambas en una tarjeta; si difieren, la venta total aparece como contexto secundario. El CSV conserva todos los campos.

La tarjeta **Brecha total** muestra `ventas comparables acumuladas - objetivo total` y acompaña el valor con “Faltan X cajas” o “Supera el objetivo en X cajas”.

No se agrega contribución 100 % ni posición 1 de 1.

### Cliente dentro de actividad compartida

Coexisten venta del cliente y ventas conjuntas. Solo las ventas conjuntas son el numerador del cumplimiento de la actividad. El aporte individual es participación, no cumplimiento.

## Otros indicadores

| Indicador | Definición |
| --- | --- |
| Ventas del cliente | Aporte atribuible del cliente en el contexto seleccionado. |
| Ventas conjuntas | Suma atribuible de clientes asociados a una actividad compartida. |
| Contribución | Venta atribuible del cliente / ventas conjuntas. |
| Posición por aporte | Orden descendente de contribuciones; empates comparten posición. |
| Presentaciones negociadas | Claves únicas vinculadas a actividades del contexto. |
| Estado de actividad | Comparable, sin objetivo, ambigua, conflictiva, aún no iniciada u otro estado aprobado. |
| Vigencia | Relación entre fechas contractuales y período analizado. |
| Cobertura | Actividades comparables / actividades evaluadas; también se expresa como X de Y. |

## Reconciliación técnica

`reconcileComparablePerformance()` recibe `comparableSales`, `comparableObjective`, `compliance` y `objectiveDifference`. Valida ambas ecuaciones con tolerancia `1e-9`. `computeKpis()` almacena el resultado como `performanceConsistency`, y las auditorías fallan si la población comparable no reconcilia.

## Ejemplos reales

- `947124`: 541 / 1.100 = 49,18 %; diferencia -559.
- `874894`: 549,252 / 500 = 109,85 %; diferencia 49,252.
- `1002559342`: mayo y junio suman 121.357 como histórico, pero no forman el numerador de actividades que empiezan el 1 de julio.

## Indicadores preparados para la tabla cliente–negociación

| Campo | Población | Fórmula o resolución |
| --- | --- | --- |
| Ventas acumuladas generales | cliente + períodos disponibles | Suma de `TotalVentaMes` resuelto una vez por cliente–período. |
| Ventas atribuibles acumuladas | cliente + actividad + períodos | Suma de ventas físicas resueltas por presentación; no copia la venta general. |
| Avance frente al objetivo total | negociación comparable | Venta atribuible comparable acumulada / objetivo total único. |
| Diferencia frente al objetivo total | misma población | Venta atribuible comparable acumulada - objetivo total único. |
| Descuento mensual | cliente + actividad + período | Valor único resuelto; no suma ni promedio. |
| Inversión | actividad | Valor único contractual; conflicto si existen varios. |

```text
Cumplimiento mensual = ventas atribuibles comparables del mes / objetivo mensual
Avance objetivo total = ventas atribuibles comparables acumuladas / objetivo total
```

El primer cociente produce `CUMPLE_MES`, `NO_CUMPLE_MES` o `NO_EVALUABLE_MES` y alimentará el filtro principal. El segundo produce `CUMPLIO_OBJETIVO_TOTAL`, `EN_PROGRESO_OBJETIVO_TOTAL` o `NO_EVALUABLE_TOTAL`. Ninguno reemplaza al otro. En ausencia de filtro se presenta el último mes disponible y el encabezado identifica su etiqueta.

Para una actividad compartida, la columna de avance representa el estado conjunto de la negociación y usa `jointActivitySalesByMonth`; no convierte la contribución del cliente en cumplimiento individual. En el resumen por cliente, objetivos se suman una vez por `activityId` y porcentajes distintos se conservan como `VARIOS`.

## Lectura en la tabla de seguimiento

**Venta comparable del mes** es el numerador del estado mostrado. En una actividad individual corresponde a `totalClientSalesByMonth[periodo]`; en una compartida, a `jointActivitySalesByMonth[periodo]`. El detalle agrega el aporte del cliente y la composición por separado.

## Cobertura de actividades compartidas

Para cada cliente asociado se resuelve una sola venta mensual. La venta conjunta conocida es la suma de resoluciones finitas; un cero explícito aporta `0` sin invalidar la suma.

```text
venta_conjunta = suma(venta_resuelta_por_cliente)
cobertura = clientes_resueltos / clientes_asociados
cumplimiento = venta_conjunta / objetivo_mensual
```

El último cociente solo se publica con cobertura completa. Con cobertura parcial se muestran venta conocida y `x de n clientes`, mientras cumplimiento y brecha permanecen no disponibles.
