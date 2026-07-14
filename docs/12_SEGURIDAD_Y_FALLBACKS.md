# Seguridad y fallbacks

## Principio

Los valores del workbook se calculan sin escape y se escapan únicamente al presentarlos. Esto conserva números correctos y evita que texto externo se convierta en HTML ejecutable.

## Escape HTML y XSS

`escapeHtml()` reemplaza `&`, `<`, `>`, comillas dobles y simples. Se usa en clientes, presentaciones, categorías, chips, modal, atributos, tooltips HTML y fallbacks.

Ejemplo inseguro como dato:

```html
<img src=x onerror=alert(1)>
```

Presentación segura:

```html
&lt;img src=x onerror=alert(1)&gt;
```

Para atributos se escapa antes de construir el markup; las selecciones no se insertan sin tratamiento.

## Serialización segura

`safeJson()` reemplaza:

- `<` por `\u003c`;
- `>` por `\u003e`;
- `&` por `\u0026`;
- U+2028 y U+2029 por escapes Unicode.

Así una celda con `</script>` no puede cerrar el script que contiene `DASHBOARD_DATA`.

## CSV

Las exportaciones:

- incluyen BOM UTF-8;
- duplican comillas;
- preservan comas, punto y coma y saltos dentro de celdas;
- protegen strings que empiezan por `=`, `+`, `-` o `@` ante CSV injection;
- conservan números negativos reales como números.

Ejemplo: el texto `=HYPERLINK(...)` se exporta prefijado con `'`; el número `-559` mantiene su signo sin convertirse en texto por esa regla.

## Blob URL

El HTML y los CSV usan Blob URL temporal. La URL se revoca después de iniciar la descarga y también se limpia si el flujo falla o se carga otro workbook.

## Validación de columnas

La aplicación bloquea un workbook que carece de columnas obligatorias y lista los nombres. Las opcionales producen advertencia y desactivación localizada. No se continúa con valores indefinidos en masa.

## Límites de error

Generador y dashboard tienen `runtimeDiagnostics` con máximo 40 errores y 40 advertencias. No guardan filas completas ni datos sensibles. `safelyRenderComponent()` impide que una gráfica fallida inutilice KPI, filtros o modal.

## Debug

Por defecto no hay logs invasivos. Se puede activar:

```js
window.__DASHBOARD_DEBUG__ = true
```

Las instantáneas están disponibles mediante `window.__getGeneratorDiagnostics()` y `window.__getDashboardDiagnostics()`. El modo de rendimiento usa `window.__DASHBOARD_PERF_DEBUG__`.

## Sin ECharts

Si `window.echarts` no existe o falla:

- barras, donut, treemap y lollipop usan HTML/CSS;
- el mapa muestra ranking regional;
- la timeline usa lista, Gantt o resumen nativo;
- filtros, KPI, explorador, CSV, tema y navegación siguen operativos.

La carga tiene reintentos acotados; no reintenta indefinidamente.

## Sin Lucide

Los botones conservan texto o nombre accesible. Los KPI usan fallback `circle-dot` y un punto CSS. `refreshIcons()` retorna de forma segura si la librería no existe.

## Error de GeoJSON o CDN

El mapa depende de GeoJSON externo, pero el ranking no. Un error se registra como advertencia y mantiene la lectura tabular. Google Fonts puede fallar sin bloquear Inter del sistema/fallback tipográfico.

## Fallback por componente

| Componente | Respuesta segura |
| --- | --- |
| KPI | tarjeta “No disponible” o estado técnico localizado |
| Gráfica | visual nativa o mensaje |
| Timeline | lista/Gantt/resumen nativo |
| Modal | mensaje y cierre disponible |
| CSV | aviso de exportación sin romper dashboard |
| Filtros | error específico o controles restantes |

## Segundo workbook

Las versiones de carga impiden carreras. Al cambiar dataset se limpian filtros, cachés, instancias, modal, URL, timeline, diagnósticos y renders pendientes. Solo preferencias globales apropiadas, como tema, pueden conservarse.

## Alcance

Estas medidas reducen XSS y errores accidentales en el HTML generado. No convierten el archivo en un sistema de autorización: quien recibe el HTML tiene acceso a los datos serializados que contiene.
