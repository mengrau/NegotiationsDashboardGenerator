# Indicadores y fórmulas

## Contrato central

```text
Cumplimiento = Ventas atribuibles comparables / Objetivo comparable

Diferencia atribuible = Ventas atribuibles comparables - Objetivo comparable
```

Las fórmulas se evalúan con números completos. El formato `es-CO` se aplica después.

## KPI globales

| KPI | Fuente y población | Fórmula | Exclusiones e interpretación |
| --- | --- | --- | --- |
| Ventas del período | `TotalVentaMes` resuelto por cliente + período | suma de grupos resueltos | Incluye venta general que puede quedar fuera del cumplimiento. |
| Ventas del último mes | Igual fuente, solo período máximo filtrado | suma de grupos del último mes | No es venta atribuida a una actividad. |
| Ventas atribuibles comparables | `activityAggregate.sales` / `kpis.comparableSales` | suma de `totalSales` de actividades comparables | Excluye histórico, posterior al fin, venta ambigua, fechas u objetivo inválidos. |
| Objetivo mensual de las actividades | `activityAggregate.objective` / `kpis.comparableObjective` | suma de objetivos únicos comparables | No usa `objectiveAll` en la tarjeta reconciliable. |
| Cumplimiento de las actividades | mismos numerador y denominador | ventas comparables / objetivo comparable | No promedia porcentajes. |
| Diferencia atribuible frente al objetivo | misma población | ventas comparables - objetivo comparable | Positiva sobre objetivo; negativa bajo objetivo. |
| Presentaciones sin ventas | `noSalesAnalysis.presentationCount` | conteo único de presentaciones negociadas sin contexto de venta | Distingue sin información de venta de venta cero. |
| Negociaciones vigentes | actividad única con vigencia actual | conteo único | No cuenta filas ni clientes. |

La cobertura se muestra como texto secundario: `Cobertura: X de Y actividades`. Ya no ocupa una tarjeta principal.

## Por qué Ventas del período no coincide con la diferencia

`TotalVentaMes` y ventas atribuibles comparables tienen poblaciones distintas:

```text
TotalVentaMes ≠ ventas atribuibles comparables
```

La venta general puede incluir períodos previos, posteriores, actividades ambiguas o venta sin actividad comparable. Por tanto, esta operación no es la fórmula del sistema:

```text
Ventas del período - objetivo
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

**Venta atribuible del mes** es el numerador del estado mostrado. En una actividad individual corresponde a `attributableSalesByMonth[periodo]`; en una compartida, a `jointActivitySalesByMonth[periodo]`. El detalle agrega el aporte del cliente por separado. **Ventas atribuibles acumuladas** y **Avance objetivo total** siguen el contrato comparable y nunca usan directamente `TotalVentaMes`.
