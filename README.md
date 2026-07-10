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

Los KPIs principales usan la granularidad del nuevo formato: `Total ventas periodo` cuenta `TotalVentaMes` una sola vez por combinación de `Cliente SAP - Clave` y `Año Mes`; `Total venta último mes` usa esa misma regla, pero solo para el `Año Mes` más reciente dentro de los filtros aplicados. `Cumplimiento` y `Cajas faltantes` comparan `Total venta último mes` contra `Objetivo mes `, que se cuenta una sola vez por `ID Actividad`. Las ventas por categoría y presentación siguen usando `Ventas cajas físicas (sin rep)`, porque esa columna sí está a nivel de presentación.

Si `Ventas cajas físicas (sin rep)` o `TotalVentaMes` vienen vacías, la herramienta las interpreta como `0`. Los valores no numéricos no vacíos se mantienen como advertencia.

Los valores numéricos se leen desde el valor crudo del `.xlsx`. Si Excel guarda una celda como número decimal, se conserva ese número aunque en pantalla se vea con coma regional. Si `TotalVentaMes` llega como texto, acepta coma o punto decimal; el resto de campos mantiene coma decimal y punto de miles. Por ejemplo, `909,022` en ventas se procesa como novecientos nueve coma cero veintidós; `1.376` en objetivos se procesa como mil trescientos setenta y seis.

Si faltan columnas obligatorias, el procesamiento se bloquea. Si hay columnas extra, se muestran como advertencia y el archivo puede procesarse.

## Privacidad

El Excel se procesa localmente en el navegador. No se sube a ningún servidor, no se envía a APIs externas y no se usa base de datos. Internet solo se usa para cargar librerías visuales desde CDN.

## Dashboard generado

El dashboard descargado incluye los datos procesados como JSON dentro del HTML. El título se construye con la columna `Región SAP`: si hay una sola región se muestra como `Negociaciones Antioquia`, si hay varias se muestra `Negociaciones múltiples regiones`, y si no hay región disponible se mantiene `Negociaciones`.

El HTML compartido contiene KPIs, filtros principales, gráficas, tabla paginada, búsqueda, ordenamiento, badges de vigencia y exportación CSV filtrada. Las gráficas también actúan como filtros: al hacer clic en una barra, punto o segmento se filtra por ese valor, y al repetir el clic se desactiva ese filtro. La calidad de datos queda solo en la página del administrador para no saturar la vista del usuario final.

Filtros disponibles en el dashboard compartido:

`Año`, `Mes`, `Región SAP`, `Canal`, `Categoría`, `Cedi` y `Estado de vigencia`, además del buscador general.

El dashboard generado puede requerir internet para cargar Apache ECharts, Lucide Icons y Google Fonts desde CDN. Si ECharts no carga, las gráficas usan un fallback nativo en HTML/CSS para evitar cards vacías.

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
