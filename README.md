# Generador de Negociaciones

Aplicación web estática para GitHub Pages que permite cargar un Excel, validar su estructura, procesar los datos localmente en el navegador y descargar un `dashboard.html` ejecutivo listo para compartir.

## Regla de cumplimiento

Durante un período válido de la negociación, la venta total del cliente (`TotalVentaMes`) se utiliza para comparar contra el objetivo mensual. La venta de presentaciones negociadas y no negociadas se muestra como composición informativa, pero ambas participan en el cumplimiento.

En actividades compartidas se suma una vez la venta total de cada cliente asociado. Si un cliente tiene varias actividades vigentes en el mismo mes, su venta total se usa una sola vez en el resumen agregado contra la suma de objetivos únicos; no se duplica ni se distribuye entre actividades sin una regla verificable.

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

`Año`, `Mes`, `Año Mes`, `Centro - Clave`, `Canal`, `Categoría AS400 de la venta`, `Nit cliente - Clave`, `Presentación AS400 de la venta - Texto`, `Presentación AS400 de la venta - Clave`, `Región SAP`, `Tipología`, `Cliente AS400 - Texto`, `Cliente SAP - Clave`, `Cliente AS400 - Nombre negocio (Texto)`, `Ventas cajas físicas (sin rep)`, `Objetivo mes`, `% De inversión`, `ID Actividad`, `Fecha inicio`, `Fecha fin`, `Objetivo cajas total`, `Tipo descuento`, `Porcentaje descuento negociación`, `Porcentaje descuento venta`, `Porcentaje descuento mes`, `Periodo negociacion`, `Cedi` y `TotalVentaMes`.

Por compatibilidad, la herramienta también acepta `Ventas cajas físicas mes (sin rep)`, `Objetivo mes` sin espacio final y variantes como `Total venta mes`.

`normalizeWorkbookRow()` centraliza el esquema y crea nombres internos estables (`clientSap`, `activityId`, `periodKey`, `physicalSales`, `monthlyObjective`, `totalObjective`, `investmentPercentage` y los tres descuentos). Las claves originales permanecen temporalmente como compatibilidad de las vistas existentes. `Año Mes` admite formas como `52026` y `62026`, que se convierten en `202605` y `202606`, junto con etiquetas `MAY 2026` y `JUN 2026`. Las filas con negociación pero sin período se conservan como `SIN_PERIODO_DE_VENTA` y `NO_EVALUABLE`.

## Modelo preparado para la tabla de clientes

La Fase 10A incorpora dos modelos analíticos, todavía sin añadir la interfaz final:

- `clientActivitySummary`: una fila segura por `Cliente SAP + ID Actividad`, con descriptores resueltos, objetivos, inversión, descuentos, ventas generales y atribuibles por mes, avance frente al objetivo total, estado y advertencias.
- `clientSummary`: una fila por cliente construida desde las relaciones anteriores y objetivos únicos por actividad; nunca suma directamente filas del Excel ni promedia porcentajes.

`availablePeriods` se obtiene de los datos y `summaryTableColumns` añade por cada período columnas de venta, descuento, cumplimiento y estado. Cada relación conserva `clientSap` y `activityId` para que la futura acción navegue mediante `updateDashboardFilters()` sin crear otro estado. El modelo se construye durante el procesamiento, se serializa de forma segura en el HTML y se incorpora a `state.analyses`; las interacciones futuras consumirán esa estructura y la caché analítica LRU, no las filas originales.

El estado principal se calcula por mes: venta total comparable del período dividida por objetivo mensual. Produce `CUMPLE_MES`, `NO_CUMPLE_MES` o `NO_EVALUABLE_MES`. Sin filtro de mes se usa el último período disponible; con un mes seleccionado, `state.analyses` proyecta ese período sobre el modelo ya preparado. El avance acumulado contra `Objetivo cajas total` se conserva por separado como `CUMPLIO_OBJETIVO_TOTAL`, `EN_PROGRESO_OBJETIVO_TOTAL` o `NO_EVALUABLE_TOTAL`.

Por cada período, `summaryTableColumns` prepara venta, descuento, cumplimiento y estado. Las columnas base incluyen estado y cumplimiento del mes seleccionado, ventas atribuibles acumuladas, objetivo total, avance y estado del objetivo total. La interfaz completa de la tabla permanece fuera del alcance de esta fase.

Los KPI principales usan un período canónico construido con `Año` y `Mes`, con `Año Mes` validado como respaldo. **Ventas totales** resuelve `TotalVentaMes` una sola vez por `Cliente SAP - Clave` y período; si coexisten ceros y un único valor no cero, conserva el valor no cero, y si hay dos valores no cero distintos marca conflicto. El objetivo mensual y el objetivo total se resuelven una sola vez por `ID Actividad`.

**Clientes negociados sin ventas** cuenta clientes únicos cuyos registros contienen `TotalVentaMes` informado explícitamente como cero y un cliente SAP y actividad válidos. Esas filas no incluyen `Año`, `Mes` ni `Año Mes`; el indicador no exige, completa ni infiere un período y el filtro Mes no las excluye. Un valor vacío, nulo, inválido o positivo no se clasifica como cero.

Cuando una actividad contiene varios clientes, el cumplimiento se calcula con las ventas conjuntas de todos los clientes asociados. Si un cliente tiene varias actividades vigentes en el mismo período, la atribución usa `Ventas cajas físicas (sin rep)` por cliente, actividad, presentación y período. Si esa fuente no permite atribuir la venta, la actividad queda marcada como ambigua y no se duplica ni distribuye `TotalVentaMes`. La venta individual se presenta como contribución a la negociación, nunca como cumplimiento frente al objetivo completo.

Si `Ventas cajas físicas (sin rep)` viene vacía, se interpreta como `0` para conservar la clasificación de venta. Un `TotalVentaMes` vacío permanece ausente; no se inventa un cero. Los valores numéricos no válidos se registran como incidencias de calidad.

Los valores numéricos se leen desde el valor crudo del `.xlsx`. Si Excel guarda una celda como número decimal, se conserva ese número aunque en pantalla se vea con coma regional. Si `TotalVentaMes` llega como texto, acepta coma o punto decimal; el resto de campos mantiene coma decimal y punto de miles. Por ejemplo, `909,022` en ventas se procesa como novecientos nueve coma cero veintidós; `1.376` en objetivos se procesa como mil trescientos setenta y seis.

Si faltan columnas obligatorias, el procesamiento se bloquea. Si hay columnas extra, se muestran como advertencia y el archivo puede procesarse.

## Privacidad

El Excel se procesa localmente en el navegador. No se sube a ningún servidor, no se envía a APIs externas y no se usa base de datos. Internet solo se usa para cargar librerías visuales desde CDN.

## Dashboard generado

El dashboard descargado incluye los datos procesados como JSON dentro del HTML. El título se construye con la columna `Región SAP`: si hay una sola región se muestra como `Negociaciones Antioquia`, si hay varias se muestra `Negociaciones múltiples regiones`, y si no hay región disponible se mantiene `Negociaciones`.

El HTML compartido contiene KPI priorizados, contexto compacto, filtros con variación real, una línea de tiempo analítica, visualizaciones adaptativas, búsqueda, explorador de clientes negociados sin ventas y explorador de contribución multicliente. La descarga general de datos filtrados no se muestra; las exportaciones contextuales permanecen en las tablas y modales analíticos. El modal muestra una fila por cliente, sus negociaciones y sus presentaciones sin abrir modales anidados.

Los desplegables de Actividad y Cliente SAP se portalan temporalmente al documento y se posicionan con coordenadas del viewport; así quedan fuera de los contextos de apilamiento de tarjetas y gráficas. Se recalculan al desplazarse o redimensionar la ventana, y el modal conserva una capa superior.

Los KPI se adaptan al contexto. Una actividad compartida presenta ventas conjuntas, objetivo, cumplimiento y contribuciones; una actividad individual omite la contribución de 100 % y la posición 1 de 1. Al filtrar un cliente, el objetivo continúa identificado como objetivo completo de la actividad. Para varias actividades, los objetivos únicos y las ventas comparables se agregan mediante totales, sin promediar porcentajes.

En la vista global, **Ventas totales** representa `TotalVentaMes` resuelto por cliente y período. **Ventas comparables** representa esa venta total restringida a vigencias evaluables, sin duplicar cliente-período. El objetivo visible reconciliable usa la misma población comparable; la cobertura se muestra como ayuda secundaria.

Al pasar sobre **Ventas comparables**, la interfaz aclara que son cajas registradas dentro de la vigencia de la negociación y que por eso pueden diferir de las ventas generales o del último mes. Los estados **No evaluable** conservan y muestran su causa, como negociación aún no iniciada, fechas u objetivos conflictivos, ausencia de objetivo válido o atribución de venta no confiable.

La interfaz usa un registro central `UI_COPY` para mantener títulos, estados, acciones, encabezados, tooltips y mensajes vacíos consistentes. Los textos visibles son ejecutivos; las reglas de resolución, deduplicación y comparabilidad permanecen en la documentación técnica y no se infieren desde las etiquetas.

El explorador de una actividad compartida separa el resumen de la negociación de la tabla de clientes. Presenta ventas, objetivo, cumplimiento, diferencia, vigencia y estado; permite buscar por código o nombre, ordenar, mostrar 25 clientes por lote, abrir el detalle de un cliente y exportar el resultado visible a CSV. Con dos a cuatro clientes usa un modo compacto sin altura vacía; en móvil utiliza tarjetas en lugar de construir simultáneamente una tabla oculta. Si el dashboard está filtrado por cliente, conserva la población completa de la actividad y marca la selección.

Las actividades individuales no abren un ranking de contribución. El detalle individual conserva cliente, ventas, objetivo, cumplimiento y diferencia sin mostrar participación 100 % ni posición 1 de 1.

La línea de tiempo se activa al seleccionar una o varias actividades o un único cliente relacionado. Distingue histórico previo, vigencia comparable, ausencia de venta atribuible, ambigüedad, período posterior y conflictos de fechas. En el detalle de una actividad, las ventas se presentan como línea suavizada con marcadores que conservan el valor mensual exacto; el objetivo es una línea discontinua únicamente dentro de la vigencia, y la banda y los hitos de inicio y fin permanecen visibles. El histórico usa un marcador hueco y el período posterior un diamante atenuado: ninguno se interpreta como desempeño desfavorable. Para dos a ocho actividades se conserva el Gantt, porque fusionar vigencias distintas en una línea sería engañoso; selecciones mayores mantienen el resumen. El rango detallado se limita a 36 meses y usa zoom con más de 12. Si ECharts no carga, conserva una representación HTML/CSS accesible.

## Tipos de visualización

La selección visual se declara en el registro de gráficas y consume los arreglos analíticos ya preparados. Estado de presentaciones usa donut porque compara tres proporciones; ventas por categoría usa treemap con hasta doce categorías y vuelve a barra si la cardinalidad exige comparación por eje; y el top de presentaciones usa lollipop horizontal para conservar el ranking. Los clientes negociados sin ventas se exploran desde su KPI con niveles internos de cliente, negociación y presentación, sin inventar un período ni requerir ECharts.

Se mantienen barras para ventas frente al objetivo, contribución por cliente, cumplimiento por actividad, ventas por cliente y canal y cumplimiento por CEDI. En esos casos la lectura exacta contra un eje o el ranking comparativo es más importante que la variedad estética. La visualización temporal independiente fue eliminada porque la timeline explica la evolución con vigencia, objetivo y estados. Donut, treemap y lollipop tienen fallback HTML/CSS navegable por teclado y no añaden dependencias.

## Documentación integral

El índice [docs/00_INDICE.md](docs/00_INDICE.md) enlaza arquitectura, modelo de datos, reglas de negocio, fórmulas, filtros, visualizaciones, timeline, explorador, rendimiento, seguridad, pruebas, guía de exposición y glosario. Incluye rutas de lectura para negocio, analistas, desarrollo, exposición y QA.

## Layout y responsive

La interfaz usa una sola columna central dentro de `.dashboard-shell`, con un ancho máximo de 1.640 px y espaciado lateral adaptable. No existe navegación lateral ni espacio reservado a la izquierda; modal y dropdowns siguen posicionándose respecto del viewport.

La grilla KPI usa doce columnas lógicas: normalmente presenta cuatro tarjetas por fila y redistribuye la última fila como una tarjeta centrada, dos mitades o tres tercios. A 1.180 px pasa a dos columnas y, si la cantidad es impar, la última completa la fila; a 390 px utiliza una columna. Los KPI secundarios conservan menor peso visual y no se crean nodos invisibles de relleno.

Cada visualización declara metadatos de presentación `compact`, `standard`, `featured` o `timeline`. Las destacadas y la timeline ocupan una fila; las estándar comparten dos columnas y la última tarjeta de un segmento impar completa la fila. Las alturas se asignan por tipo y los estados vacíos usan una presentación compacta. La timeline adapta su altura para detalle, Gantt, resumen o invitación a seleccionar contexto.

Los filtros usan una grilla de doce columnas: Actividad y Cliente tienen mayor ancho y los controles restantes redistribuyen su última fila. Contexto derivado y filtros removibles mantienen tratamientos visuales diferentes. Tablas, Gantt y listas con ancho propio contienen su desplazamiento internamente; el layout no recurre a ocultar globalmente el desbordamiento horizontal.

Los breakpoints principales son 1.180, 820, 560 y 390 px. Ajustan encabezado, filtros, KPI, gráficas, timeline y modal sin duplicar representaciones ni análisis. Los mismos tokens de panel, texto, borde, estados semánticos y foco se reutilizan en modo claro y oscuro.

Los KPI cambian según el contexto. En vista general se conserva **Clientes negociados sin ventas**; con un único cliente, la tarjeta secundaria presenta el estado de su negociación o el total de negociaciones únicas. Las causas no evaluables se expresan como **Por iniciar**, **Sin objetivo**, **Revisar fechas** o **Revisar ventas**, sin exponer códigos internos.

Filtros disponibles en el dashboard compartido:

`ID Actividad`, `Cliente SAP`, `Año`, `Mes`, `Región SAP`, `Canal`, `Categoría`, `Cedi` y `Estado de vigencia`, además del buscador general. Un filtro solo aparece cuando contiene al menos dos valores disponibles.

Actividad y Cliente SAP usan combobox multiselección buscables. Permiten buscar por identificador y, para clientes, por nombre, negocio o NIT; conservan la selección al actualizar KPI y gráficas y se sincronizan con filtros aplicados desde visualizaciones. Los demás filtros usan controles compactos de selección única.

Los chips representan únicamente filtros explícitos y permiten limpiar una dimensión sin afectar las demás. El contexto derivado —por ejemplo, actividad compartida, vigencia o región resultante— se presenta por separado y no se incorpora artificialmente al estado de filtros.

Las opciones son facetadas: cada dimensión responde a los demás filtros ignorando temporalmente su propia selección. Una opción seleccionada permanece visible aunque no tenga resultados con el resto del contexto; solo se elimina si el usuario la desmarca o si deja de existir en el workbook.

El dashboard generado puede requerir internet para cargar Apache ECharts, Lucide Icons y Google Fonts desde CDN. Si ECharts no carga, las gráficas usan un fallback nativo en HTML/CSS para evitar cards vacías.

## Auditoría analítica

`npm.cmd run audit:workbook` valida por defecto `Downloads/INSUMO DASHBOARD (3).xlsx`. También puede recibir `INSUMO_DASHBOARD_XLSX` o `PRUEBA_DASHBOARD_XLSX`. El reporte incluye actividades individuales y compartidas, relaciones cliente-período, atribución granular, filas sin período, inversión, descuentos, estados del modelo cliente-negociación, conflictos y tiempos de construcción.

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

## Seguimiento de clientes y negociaciones

El HTML generado incluye, después de KPI y filtros, una tabla cuya fila representa `Cliente SAP + ID Actividad`. El estado mensual usa el mes filtrado o el último período disponible; el avance contra el objetivo total se presenta como un estado independiente. Los filtros locales de estado, el ordenamiento y la paginación operan sobre `clientActivitySummary`, no sobre las filas del Excel. La segmentación por cliente, NIT, actividad, región o CEDI se hace exclusivamente con los filtros globales superiores.

La tabla muestra 10 relaciones por página de forma predeterminada y permite ampliar a 25, 50 o 100. En móvil genera únicamente tarjetas de la página visible. **Ver detalle** abre el modal único con contrato, resultados mensuales dinámicos y advertencias. **Ver cliente** y **Ver negociación** actualizan los filtros centrales. El CSV de resumen exporta todas las coincidencias y agrega cuatro columnas por período real; el CSV de detalle conserva meses y advertencias.

La tabla compacta prioriza **Estado mensual**, **Estado total**, **Cliente**, **Negociación**, **Objetivo mensual**, **Venta del mes**, **Mix de venta**, **Dcto. mes**, **Cumplimiento**, **Avance total**, **Inversión** y **Acción**. Región, CEDI y acumulados permanecen en el detalle. Los porcentajes se muestran desde decimales normalizados, evitando que un `10` contractual aparezca como `1.000 %`.

Los flujos **Ver detalle → Ver contribución → detalle del cliente** comparten un único modal. El botón **← Volver** recupera el nivel, página, orden, relación seleccionada y posición de scroll anteriores sin reaplicar filtros. Mientras el modal está abierto, el documento queda fijado en su posición y solo se desplaza el contenido interno; al cerrar se restaura exactamente el scroll original.

## Cero explícito sin período en actividades compartidas

La resolución mensual distingue venta del período, cero explícito sin período, información mensual faltante, conflicto y fuera de vigencia. Cuando un cliente asociado no tiene `Año`, `Mes` ni `Año Mes`, pero todas sus filas informan `TotalVentaMes = 0`, sus ventas físicas son cero y no existe un valor contradictorio, el modelo usa ese cero como evidencia analítica para cada mes vigente. La fuente no se modifica: el origen se conserva como `ZERO_EXPLICIT_WITHOUT_PERIOD`.

El cero aporta una sola vez a la venta conjunta y cuenta como cliente resuelto. Si falta información real, la actividad queda en `SHARED_ACTIVITY_PARTIAL_INFORMATION`: conserva la venta conocida y la cobertura, pero no declara cumplimiento. La tabla, el detalle y los CSV presentan el estado, el origen y los clientes resueltos sobre asociados.
