# Resumen ejecutivo

## El proyecto en un minuto

El proyecto recibe un workbook de negociaciones, valida sus columnas, normaliza 18.319 registros del archivo de referencia y genera un único HTML interactivo que puede compartirse. Su valor no está en sumar filas: reconoce que la venta general pertenece a un cliente y período, mientras el objetivo pertenece a una actividad. Después determina qué parte de la venta puede atribuirse de forma segura a actividades válidas y comparables.

El resultado permite revisar ventas generales, ventas atribuibles comparables, objetivos, cumplimiento, diferencia, vigencia, presentaciones sin venta y contribución de clientes. Las actividades compartidas se evalúan de manera conjunta; las individuales evitan indicadores redundantes. Las ventas anteriores al inicio permanecen visibles como contexto histórico, pero no cuentan como cumplimiento.

## Problema que resuelve

Una hoja transaccional repite datos contractuales por cliente, presentación y fila. Sumar todas las columnas directamente puede duplicar `TotalVentaMes`, multiplicar objetivos y atribuir una venta a varias actividades. Además, una actividad puede tener varios clientes y un cliente puede participar en varias actividades.

El proyecto convierte esa estructura repetida en un contrato analítico explícito:

- venta general: cliente + período;
- objetivo mensual: actividad;
- venta física: cliente + actividad + presentación + período;
- cumplimiento: actividades atribuibles, vigentes y con objetivo válido;
- histórico: información visible que no se fuerza dentro del cumplimiento.

## Usuarios y decisiones

El generador está pensado para analistas, responsables comerciales y personas que supervisan negociaciones. Permite responder:

- ¿cuál fue la venta general de los clientes?;
- ¿qué venta sí participa en el cumplimiento de objetivos?;
- ¿qué actividades están por encima o debajo del objetivo?;
- ¿qué cliente aportó más en una actividad compartida?;
- ¿qué ocurrió antes, durante y después de una vigencia?;
- ¿qué presentaciones negociadas no tienen venta?

## Entrada y salida

La entrada es un `.xlsx` o `.xls` con columnas de cliente, actividad, presentación, ventas, objetivos y fechas. `app.js` procesa el archivo localmente. La salida es un HTML generado por `generateDashboardHtml()` en `dashboard-template.js`, con datos normalizados serializados, estilos, lógica de filtros y fallbacks.

El workbook no se envía a un servidor. Las dependencias visuales se solicitan a CDN; si fallan, las funciones principales conservan representaciones nativas.

## Por qué no es una suma simple

`TotalVentaMes` aparece repetido en múltiples filas de presentaciones, pero representa una cifra de cliente-período. El objetivo mensual aparece en filas de varios clientes y presentaciones, pero pertenece a una actividad. La aplicación resuelve valores únicos y conflictos antes de agregarlos.

Esta distinción evita dos errores comunes:

1. sumar la misma venta general una vez por presentación;
2. multiplicar el objetivo de una negociación compartida por el número de clientes.

## Venta general y venta atribuible comparable

Las dos cifras responden preguntas diferentes:

- **Ventas del período:** toda la venta general resuelta por cliente y período.
- **Ventas atribuibles comparables:** solo el numerador que puede asociarse a actividades con vigencia, objetivo y fuente válidos.

Por eso `Ventas del período - objetivo` no tiene que coincidir con la diferencia. La diferencia usa ventas atribuibles comparables y objetivo comparable. Véase [Indicadores y fórmulas](06_INDICADORES_Y_FORMULAS.md).

## Actividades compartidas e individuales

Una actividad con más de un cliente es compartida. Su objetivo es conjunto y su cumplimiento usa la suma atribuible de todos los clientes. La venta de cada cliente se presenta como contribución y participación, no como cumplimiento individual frente al objetivo completo.

Una actividad con un solo cliente es individual. Muestra venta, objetivo, cumplimiento y diferencia, pero omite contribución 100 % y posición 1 de 1 porque no agregan información.

## Períodos anteriores al inicio

Las ventas anteriores a la fecha de inicio se muestran en la línea de tiempo como histórico previo. Sirven para entender el contexto del cliente, pero no participan en objetivo, cumplimiento ni diferencia. El cliente `1002559342` ilustra esta regla: mayo y junio de 2026 son históricos antes del inicio del 1 de julio de 2026.

## Resultado operativo

El dashboard combina KPI contextuales, filtros facetados, visualizaciones, timeline y explorador de contribución sobre una misma población analítica. La eliminación de la gráfica temporal independiente deja la timeline como única explicación de evolución, con vigencia y estados que una serie simple no podía aportar.
