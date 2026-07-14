# Generador de Negociaciones

Aplicación web estática para GitHub Pages que permite cargar un Excel, validar su estructura, procesar los datos localmente en el navegador y descargar un `dashboard.html` ejecutivo listo para compartir.

## Cómo usar la herramienta

1. Abre `index.html` localmente o desde GitHub Pages.
2. Carga un archivo `.xlsx` o `.xls` en el componente de carga.
3. Si el Excel tiene varias hojas, selecciona la hoja correcta.
4. Revisa la validación de columnas, columnas extra y estado del flujo.
5. Haz clic en **Procesar archivo**.
6. Revisa la vista previa interactiva.
7. Descarga `dashboard_negociacion_YYYYMMDD_HHMM.html`.
8. Comparte ese HTML con las personas encargadas.

## Formato del Excel

La primera fila debe contener encabezados. La validación tolera espacios al inicio/final y espacios múltiples, incluida la columna `Objetivo mes ` con espacio final.

Columnas requeridas:

`Año`, `Mes`, `Año Mes`, `Centro - Clave`, `Canal`, `Categoría AS400 de la venta`, `Nit cliente - Clave`, `Presentación AS400 de la venta - Texto`, `Presentación AS400 de la venta - Clave`, `Región SAP`, `Tipología`, `Cliente AS400 - Texto`, `Cliente SAP - Clave`, `Cliente AS400 - Nombre negocio (Texto)`, `Ventas cajas físicas (sin rep)`, `TotalVentaMes`, `Objetivo mes `, `ID Actividad`, `Fecha inicio`, `Fecha fin`, `Objetivo cajas total`, `Tipo descuento`, `Porcentaje descuento`, `Periodo negociacion` y `Cedi`.

Por compatibilidad, la herramienta también acepta `Ventas cajas físicas mes (sin rep)`, `Objetivo mes` sin espacio final y variantes como `Total venta mes`.

Los KPI principales usan un período canónico construido con `Año` y `Mes`, con `Año Mes` validado como respaldo. `Ventas del período` resuelve `TotalVentaMes` una sola vez por `Cliente SAP - Clave` y período; si coexisten ceros y un único valor no cero, conserva el valor no cero, y si hay dos valores no cero distintos marca conflicto. El objetivo mensual y el objetivo total se resuelven una sola vez por `ID Actividad`.

Cuando una actividad contiene varios clientes, el cumplimiento se calcula con las ventas conjuntas de todos los clientes asociados. Si un cliente tiene varias actividades vigentes en el mismo período, la atribución usa `Ventas cajas físicas (sin rep)` por cliente, actividad, presentación y período. Si esa fuente no permite atribuir la venta, la actividad queda marcada como ambigua y no se duplica ni distribuye `TotalVentaMes`. La venta individual se presenta como contribución a la negociación, nunca como cumplimiento frente al objetivo completo.

Si `Ventas cajas físicas (sin rep)` viene vacía, se interpreta como `0` para conservar la clasificación de venta. Un `TotalVentaMes` vacío permanece ausente; no se inventa un cero. Los valores numéricos no válidos se registran como incidencias de calidad.

Los valores numéricos se leen desde el valor crudo del `.xlsx`. Si Excel guarda una celda como número decimal, se conserva ese número aunque en pantalla se vea con coma regional. Si `TotalVentaMes` llega como texto, acepta coma o punto decimal; el resto de campos mantiene coma decimal y punto de miles. Por ejemplo, `909,022` en ventas se procesa como novecientos nueve coma cero veintidós; `1.376` en objetivos se procesa como mil trescientos setenta y seis.

Si faltan columnas obligatorias, el procesamiento se bloquea. Si hay columnas extra, se muestran como advertencia y el archivo puede procesarse.

## Privacidad

El Excel se procesa localmente en el navegador. No se sube a ningún servidor, no se envía a APIs externas y no se usa base de datos. Internet solo se usa para cargar librerías visuales desde CDN.

## Dashboard generado

El dashboard descargado incluye los datos procesados como JSON dentro del HTML. El título se construye con la columna `Región SAP`: si hay una sola región se muestra como `Negociaciones Antioquia`, si hay varias se muestra `Negociaciones múltiples regiones`, y si no hay región disponible se mantiene `Negociaciones`.

El HTML compartido contiene KPI priorizados, contexto compacto, filtros con variación real, una línea de tiempo analítica, visualizaciones adaptativas, búsqueda, drill-down de presentaciones sin ventas, explorador de contribución multicliente y exportación CSV. No genera comparativos para dimensiones con un único valor; esos valores se muestran como contexto. El encabezado incluye un indicador discreto de calidad y no clasifica las presentaciones sin información de venta como datos corruptos.

Los KPI se adaptan al contexto. Una actividad compartida presenta ventas conjuntas, objetivo, cumplimiento y contribuciones; una actividad individual omite la contribución de 100 % y la posición 1 de 1. Al filtrar un cliente, el objetivo continúa identificado como objetivo completo de la actividad. Para varias actividades, los objetivos únicos y las ventas comparables se agregan mediante totales, sin promediar porcentajes.

En la vista global, **Ventas del período** representa `TotalVentaMes` resuelto por cliente y período. **Ventas atribuibles comparables** representa únicamente el numerador de cumplimiento y diferencia. El objetivo visible reconciliable usa la misma población comparable; la cobertura `X de Y actividades` aparece como ayuda secundaria.

El explorador de una actividad compartida separa el resumen de la negociación de la tabla de clientes. Presenta ventas, objetivo, cumplimiento, diferencia, vigencia y estado; permite buscar por código o nombre, ordenar, mostrar 25 clientes por lote, abrir el detalle de un cliente y exportar el resultado visible a CSV. Con dos a cuatro clientes usa un modo compacto sin altura vacía; en móvil utiliza tarjetas en lugar de construir simultáneamente una tabla oculta. Si el dashboard está filtrado por cliente, conserva la población completa de la actividad y marca la selección.

Las actividades individuales no abren un ranking de contribución. El detalle individual conserva cliente, ventas, objetivo, cumplimiento y diferencia sin mostrar participación 100 % ni posición 1 de 1.

La línea de tiempo se activa al seleccionar una o varias actividades o un único cliente relacionado. Distingue histórico previo, vigencia comparable, ausencia de venta atribuible, ambigüedad, período posterior y conflictos de fechas. En el detalle de una actividad, las ventas se presentan como línea suavizada con marcadores que conservan el valor mensual exacto; el objetivo es una línea discontinua únicamente dentro de la vigencia, y la banda y los hitos de inicio y fin permanecen visibles. El histórico usa un marcador hueco y el período posterior un diamante atenuado: ninguno se interpreta como desempeño desfavorable. Para dos a ocho actividades se conserva el Gantt, porque fusionar vigencias distintas en una línea sería engañoso; selecciones mayores mantienen el resumen. El rango detallado se limita a 36 meses y usa zoom con más de 12. Si ECharts no carga, conserva una representación HTML/CSS accesible.

## Tipos de visualización

La selección visual se declara en el registro de gráficas y consume los arreglos analíticos ya preparados. Estado de presentaciones usa donut porque compara tres proporciones; ventas por categoría usa treemap con hasta doce categorías y vuelve a barra si la cardinalidad exige comparación por eje; el top de presentaciones usa lollipop horizontal para conservar el ranking; y presentaciones sin ventas usa donut hasta seis categorías, treemap hasta dieciocho y barra cuando hay más. El drill-down por categoría funciona en las tres variantes.

Se mantienen barras para ventas frente al objetivo, contribución por cliente, cumplimiento por actividad, ventas por cliente y canal y cumplimiento por CEDI. En esos casos la lectura exacta contra un eje o el ranking comparativo es más importante que la variedad estética. La visualización temporal independiente fue eliminada porque la timeline explica la evolución con vigencia, objetivo y estados. Donut, treemap y lollipop tienen fallback HTML/CSS navegable por teclado y no añaden dependencias.

## Documentación integral

El índice [docs/00_INDICE.md](docs/00_INDICE.md) enlaza arquitectura, modelo de datos, reglas de negocio, fórmulas, filtros, visualizaciones, timeline, explorador, rendimiento, seguridad, pruebas, guía de exposición y glosario. Incluye rutas de lectura para negocio, analistas, desarrollo, exposición y QA.

## Layout y responsive

El contenido ejecutivo está centrado dentro de `.dashboard-content`, con un ancho máximo de 1.640 px y espaciado controlado mediante variables CSS. La sidebar permanece fuera de este límite, mientras modal y dropdowns conservan posicionamiento respecto del viewport.

La grilla KPI usa doce columnas lógicas: normalmente presenta cuatro tarjetas por fila y redistribuye la última fila como una tarjeta centrada, dos mitades o tres tercios. A 1.180 px pasa a dos columnas y, si la cantidad es impar, la última completa la fila; a 390 px utiliza una columna. Los KPI secundarios conservan menor peso visual y no se crean nodos invisibles de relleno.

Cada visualización declara metadatos de presentación `compact`, `standard`, `featured` o `timeline`. Las destacadas y la timeline ocupan una fila; las estándar comparten dos columnas y la última tarjeta de un segmento impar completa la fila. Las alturas se asignan por tipo y los estados vacíos usan una presentación compacta. La timeline adapta su altura para detalle, Gantt, resumen o invitación a seleccionar contexto.

Los filtros usan una grilla de doce columnas: Actividad y Cliente tienen mayor ancho y los controles restantes redistribuyen su última fila. Contexto derivado y filtros removibles mantienen tratamientos visuales diferentes. Tablas, Gantt y listas con ancho propio contienen su desplazamiento internamente; el layout no recurre a ocultar globalmente el desbordamiento horizontal.

Los breakpoints principales son 1.180, 820, 560 y 390 px. Ajustan navegación, encabezado, filtros, KPI, gráficas, timeline y modal sin duplicar representaciones ni análisis. Los mismos tokens de panel, texto, borde, estados semánticos y foco se reutilizan en modo claro y oscuro.

Filtros disponibles en el dashboard compartido:

`ID Actividad`, `Cliente SAP`, `Año`, `Mes`, `Región SAP`, `Canal`, `Categoría`, `Cedi` y `Estado de vigencia`, además del buscador general. Un filtro solo aparece cuando contiene al menos dos valores disponibles.

Actividad y Cliente SAP usan combobox multiselección buscables. Permiten buscar por identificador y, para clientes, por nombre, negocio o NIT; conservan la selección al actualizar KPI y gráficas y se sincronizan con filtros aplicados desde visualizaciones. Los demás filtros usan controles compactos de selección única.

Los chips representan únicamente filtros explícitos y permiten limpiar una dimensión sin afectar las demás. El contexto derivado —por ejemplo, actividad compartida, vigencia o región resultante— se presenta por separado y no se incorpora artificialmente al estado de filtros.

Las opciones son facetadas: cada dimensión responde a los demás filtros ignorando temporalmente su propia selección. Una opción seleccionada permanece visible aunque no tenga resultados con el resto del contexto; solo se elimina si el usuario la desmarca o si deja de existir en el workbook.

El dashboard generado puede requerir internet para cargar Apache ECharts, Lucide Icons y Google Fonts desde CDN. Si ECharts no carga, las gráficas usan un fallback nativo en HTML/CSS para evitar cards vacías.

## Auditoría analítica

`npm.cmd run audit:workbook` valida por defecto `Downloads/INSUMO DASHBOARD (1).xlsx`. También puede recibir `INSUMO_DASHBOARD_XLSX` o `PRUEBA_DASHBOARD_XLSX`. El reporte incluye actividades individuales y compartidas, relaciones cliente-período, atribución granular, ambigüedades, conflictos, cobertura y ejemplos de contribución.

## Auditoría de rendimiento

`npm.cmd run audit:performance` mide importación, normalización, construcción de índices, análisis, filtros y modelo del modal. La arquitectura, los contadores de depuración y el procedimiento de validación en navegador están documentados en [PERFORMANCE.md](PERFORMANCE.md).

## Cierre de producción

`npm.cmd run audit:production` genera en memoria el HTML con el workbook completo y falla con código distinto de cero ante errores críticos de integridad, serialización, CSV, cachés, listeners o regresiones reales. La revisión visual permanece separada en [QA_CHECKLIST.md](QA_CHECKLIST.md).

Los diagnósticos técnicos están limitados a 40 errores y 40 advertencias. Por defecto no escriben mensajes invasivos en consola. Para soporte puede activarse `window.__DASHBOARD_DEBUG__ = true`; las instantáneas se consultan mediante `window.__getGeneratorDiagnostics()` en el generador y `window.__getDashboardDiagnostics()` en el HTML generado.

Los CSV incluyen BOM UTF-8, escapan comillas y saltos de línea y protegen textos que comienzan con `=`, `+`, `-` o `@` ante fórmulas de hoja de cálculo. Los números negativos reales conservan su tipo y signo. Las URLs Blob se revocan después de iniciar la descarga.

Las columnas se clasifican en obligatorias, analíticas opcionales e informativas. La ausencia de una obligatoria bloquea el procesamiento; una analítica opcional permite continuar y muestra qué dimensión no estará disponible. La normalización conserva todas las columnas conocidas y representa las ausentes como valores no disponibles, nunca como cifras inventadas.

## Despliegue en GitHub Pages

1. Sube los archivos al repositorio.
2. Asegúrate de trabajar sobre la rama `main`.
3. En GitHub, entra a **Settings > Pages**.
4. En **Build and deployment**, selecciona **GitHub Actions**.
5. Haz push a `main` o ejecuta manualmente el workflow.

El archivo `.github/workflows/deploy.yml` publica el sitio estático sin build.

## Solución de problemas

Si faltan columnas, corrige los encabezados del Excel respetando los nombres requeridos. La app ignora diferencias menores de espacios, pero no puede inferir columnas ausentes.

Si las gráficas no cargan, revisa la conexión a internet o el bloqueo de CDN en la red corporativa.

Si GitHub Pages muestra 404, confirma que Pages esté configurado con **GitHub Actions**, que el workflow haya terminado correctamente y que el repositorio tenga `index.html` en la raíz.

Si cambia el Excel de origen, genera un nuevo HTML. El dashboard descargado contiene una copia de los datos del momento en que fue creado.
