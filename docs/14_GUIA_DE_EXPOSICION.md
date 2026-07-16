# Guía de exposición

## Mensaje central actualizado

La venta total del cliente dentro de la vigencia se utiliza para comparar contra el objetivo. La venta de presentaciones negociadas y no negociadas se muestra como una composición informativa, pero ambas participan en el cumplimiento.

En actividades compartidas el resultado es conjunto. En multiactividad no se duplica `TotalVentaMes`: se usa una vez en el agregado del cliente y las actividades requieren una regla de distribución antes de mostrar cumplimiento individual.

## Mensaje central

El dashboard no suma columnas repetidas: respeta la granularidad de venta, objetivo y actividad. Distingue venta general de venta atribuible comparable para que cumplimiento y diferencia sean explicables.

## Guion de 3 minutos

1. **Problema:** el Excel repite ventas y objetivos en filas de presentaciones; una suma directa duplica cifras.
2. **Solución:** el generador valida y normaliza el workbook, resuelve venta general por cliente-período y objetivo por actividad, y genera un HTML interactivo.
3. **Diferencia clave:** Ventas totales muestra el resultado registrado; Ventas comparables es el valor utilizado para medir cumplimiento.
4. **Caso:** `947124` es compartida: 541 conjuntos contra 1.100, cumplimiento 49,18 %, con aportes 371 y 170.
5. **Resultado:** filtros, KPI, timeline y explorador usan el mismo análisis, con cachés, seguridad y fallbacks.

## Guion de 7 minutos

### 1. Problema

Explique que `TotalVentaMes` pertenece a cliente-período y el objetivo a actividad. Mostrar por qué multiplicar por filas o clientes sería incorrecto.

### 2. Solución

Describa el flujo: carga local, validación, normalización, índices, análisis y HTML descargable.

### 3. Arquitectura

`app.js` genera; `dashboard-template.js` contiene dashboard, estado, análisis, render, seguridad y fallbacks.

### 4. Reglas

- actividad compartida: objetivo y cumplimiento conjuntos;
- actividad individual: sin contribución redundante;
- multiactividad: atribución granular y suma de totales;
- histórico previo: visible, fuera del cumplimiento.

### 5. Demostración

Compare ventas generales con atribuibles, filtre `947124`, abra contribuciones y muestre timeline. Después enseñe `1002559342` para histórico.

### 6. Resultados

Mencione 18.319 filas, índices, cachés LRU, HTML seguro, auditorías y fallback sin ECharts.

## Guion de 15 minutos

### Minutos 0–2: contexto

Presente el problema de duplicación y las decisiones que el dashboard apoya.

### Minutos 2–4: datos

Explique las granularidades y el período canónico. Diferencie venta física de `TotalVentaMes`.

### Minutos 4–7: negocio

Use `947124`, `874894` y `1002559342`. Escriba las dos fórmulas comparables.

### Minutos 7–10: arquitectura

Recorra lectura, validación, índices, análisis común, estado, scheduler y render. Destaque que el DOM no es la fuente de datos.

### Minutos 10–12: interacción

Muestre filtros facetados, chips, contexto, visualizaciones, timeline y explorador.

### Minutos 12–14: estabilidad

Explique cachés, reutilización ECharts, seguridad XSS/CSV, diagnósticos y fallbacks.

### Minuto 14–15: cierre

Resuma: cifras reconciliables, reglas explícitas, distribución portable y auditorías reproducibles.

## Orden recomendado de demostración

1. Cargar archivo y confirmar validación.
2. Mostrar vista global con ocho KPI.
3. Comparar Ventas totales y Ventas comparables.
4. Filtrar actividad compartida `947124`.
5. Abrir contribuciones y explicar 371/170.
6. Filtrar actividad individual `874894`.
7. Filtrar cliente `1002559342`.
8. Explicar mayo/junio como histórico previo.
9. Mostrar línea curveada y Gantt multiactividad.
10. Mostrar comandos de seguridad, producción y rendimiento.

## Preguntas probables y respuestas

### ¿Por qué no suman `TotalVentaMes` por fila?

Porque se repite por presentaciones. Su granularidad es cliente + período; primero se resuelve un valor único.

### ¿Por qué el objetivo no se multiplica por clientes?

Porque pertenece a la actividad. En una negociación compartida el contrato sigue teniendo un solo objetivo conjunto.

### ¿Por qué la diferencia no coincide con ventas totales?

Porque ventas totales incluyen población general. La diferencia usa solo ventas atribuibles comparables menos objetivo comparable.

### ¿Qué es una actividad compartida?

Una negociación asociada a más de un cliente. Se evalúa de forma conjunta y muestra el aporte individual sin llamarlo cumplimiento.

### ¿Qué ocurre si un cliente tiene varias actividades?

No se copia `TotalVentaMes` en todas. Se intenta atribuir venta física por actividad y presentación; si no es posible, se marca ambigüedad.

### ¿Qué ocurre antes del inicio?

La venta se muestra como histórico previo y no participa en objetivo, cumplimiento ni diferencia.

### ¿Qué ocurre si hay fechas conflictivas?

No se elige una fecha arbitraria ni se dibuja una vigencia falsa. La actividad queda para revisión y fuera de comparabilidad.

### ¿Cómo se evita duplicar ventas?

Con claves de granularidad, resolutores de valores únicos, índices y reglas de atribución.

### ¿Cómo funciona con 18.319 filas?

Construye índices una vez, usa cachés LRU, firmas estables, scheduler, debounce y reutilización de ECharts.

### ¿Por qué se genera como HTML?

Porque es portable, compartible y ejecuta filtros localmente sin desplegar un backend ni enviar el workbook.

### ¿Qué ocurre sin conexión a CDN?

ECharts y Lucide pueden faltar, pero KPI, filtros, timeline nativa, explorador y CSV siguen operativos; las gráficas tienen fallbacks.

### ¿Cómo se protege el contenido del Excel?

Se escapa al presentar, se serializa con `safeJson()` y se protege CSV contra fórmulas. El archivo se procesa localmente.

## Errores conceptuales que debe evitar

- llamar “cumplimiento individual” a una contribución;
- afirmar que `TotalVentaMes` pertenece a una actividad;
- sumar el objetivo por cliente o presentación;
- decir que histórico previo cumple;
- promediar porcentajes de actividades;
- afirmar que cero y ausencia son iguales;
- decir que una venta ambigua se reparte automáticamente;
- presentar validaciones Node como inspección visual.

## Frases recomendadas

- “La venta general responde cuánto vendió el cliente; la venta atribuible responde qué parte evalúa la negociación”.
- “El cumplimiento agrega numeradores y denominadores; no promedia porcentajes”.
- “En una actividad compartida el objetivo es conjunto y el cliente aporta una parte”.
- “El histórico explica el contexto, pero no altera el contrato”.
- “Cuando la fuente no permite decidir, el sistema muestra no disponible en lugar de inventar una cifra”.
- “La timeline reemplaza la serie temporal redundante porque agrega vigencia, objetivo y estados”.

## Preparación previa

Ejecute las cuatro auditorías, complete la matriz visual y tenga disponibles los tres casos reales. Si una cifra cambia por un workbook nuevo, explique la regla y no memorice el valor anterior como constante.

## Demostración de la tabla de seguimiento

1. Señale el período y explique que **Cumple mes** se evalúa contra el objetivo mensual.
2. Combine un estado mensual con **Objetivo total en progreso** para mostrar que responden preguntas distintas.
3. Busque un cliente, ordene por cumplimiento y abra **Ver detalle**.
4. Compare venta general, aporte atribuible y, si es compartida, venta conjunta.
5. Use **Ver cliente** o **Ver negociación** para mostrar navegación mediante filtros centrales.
6. Descargue el resumen: incluye todas las coincidencias y períodos, no solo 25 filas.

Frase recomendada: “La tabla resume una relación cliente–negociación; el estado mensual evalúa el mes activo y el avance total informa cuánto falta para completar el contrato”.

Frases ejecutivas recomendadas:

- “El tablero compara la venta total del cliente contra el objetivo mensual durante la vigencia de la negociación”.
- “La composición permite identificar qué parte de la venta corresponde a presentaciones negociadas y no negociadas”.
- “El resultado mensual y el avance del objetivo total se presentan por separado”.
