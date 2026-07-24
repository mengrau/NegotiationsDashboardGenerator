# Checklist de QA para producción

Esta lista separa las verificaciones automatizadas de las que requieren navegador. No se considera aprobada una casilla manual hasta registrar fecha, navegador, responsable y evidencia.

## Preparación automática

```powershell
npm.cmd test
npm.cmd run audit:workbook
npm.cmd run audit:performance
npm.cmd run audit:production
```

Todos los comandos deben terminar con código cero. `audit:production` debe informar `criticalErrors: 0` y `visualInspectionPerformed: false` hasta completar la revisión manual.

## Flujo de usuario

- [ ] Cargar `INSUMO DASHBOARD (1).xlsx` y confirmar 18.319 registros.
- [ ] Confirmar que el estado de procesamiento se muestra y se cierra al finalizar.
- [ ] Generar y abrir el dashboard descargable.
- [ ] Aplicar y retirar filtros desde controles, chips y gráficas.
- [ ] Abrir la timeline y revisar tooltips, zoom y fallback.
- [ ] Abrir y cerrar el explorador de contribución con botón, fondo y Escape.
- [ ] Exportar CSV general y de contribuciones; abrirlos como UTF-8.
- [ ] Limpiar filtros y confirmar que no reaparece una selección anterior.
- [ ] Cambiar tema sin perder selección ni cerrar el modal.
- [ ] Cargar otro workbook y confirmar que filtros, preview, URLs y diagnósticos anteriores desaparecen.

## Regresiones reales

- [ ] `947124`: 2 clientes; ventas 541; objetivo 1.100; cumplimiento 49,18 %; diferencia -559; aportes 371/170 y participaciones 68,58 %/31,42 %.
- [ ] `874894`: cliente `1002564657`; ventas 549,252; objetivo 500; cumplimiento 109,85 %; sin ranking ni contribución redundante.
- [ ] `1002559342`: mayo 53.956, junio 67.401, total 121.357, actividades `965821`/`965923`, inicio 01/07/2026; histórico fuera del cumplimiento.

## Matriz visual manual

Repetir en tema claro y oscuro, con zoom 80 %, 100 % y 125 %:

- [ ] 1440 × 900.
- [ ] 1024 × 768.
- [ ] 768 × 1024.
- [ ] 390 × 844.

En cada combinación revisar:

- [ ] `document.documentElement.scrollWidth <= window.innerWidth`.
- [ ] Layout central sin sidebar ni espacio reservado a la izquierda.
- [ ] Encabezado, KPI, filtros, gráficas y timeline alineados.
- [ ] Vista global con ocho KPI, incluyendo Ventas atribuibles comparables y sin tarjeta Actividades comparables.
- [ ] Verificar que cumplimiento y diferencia reconcilien con ventas comparables y objetivo comparable, no con Ventas totales.
- [ ] Confirmar que no existe tarjeta, hueco, ancla ni canvas de la visualización temporal retirada.
- [ ] Dropdown dentro del viewport y por debajo del modal.
- [ ] Modal centrado, cerrable y sin scroll general.
- [ ] Foco visible, orden de tabulación y contraste.
- [ ] Estados vacíos y conflictos legibles sin depender solo del color.
- [ ] Timeline de una actividad con línea suavizada, puntos mensuales, objetivo discontinuo, banda de vigencia e hitos de inicio/fin.
- [ ] Histórico previo con marcador hueco, comparable con mayor peso y posterior al fin con diamante atenuado.
- [ ] Cliente multiactividad conserva Gantt y no mezcla negociaciones en una línea única.
- [ ] Donut con leyenda legible; treemap sin bloques caóticos ni texto cortado; lollipop con etiquetas completas o tooltip accesible.
- [ ] El KPI **Clientes negociados sin ventas** cuenta clientes únicos con `TotalVentaMes` explícitamente igual a cero y abre un único modal con clientes, negociaciones y presentaciones.
- [ ] Con un cliente, el KPI global se sustituye por **Estado de la negociación** o **Negociaciones del cliente**, sin mostrar un cero irrelevante.
- [ ] Una negociación futura muestra **Por iniciar** y su fecha; varias negociaciones cuentan cada `ID Actividad` una vez.
- [ ] Los KPI no repiten la etiqueta `Filtros activos`.
- [ ] El detalle acumulado usa **Ventas comparables acumuladas** y **Brecha total**; si ventas totales y comparables coinciden no crea dos tarjetas.
- [ ] `TotalVentaMes` vacío, nulo, inválido o positivo no se convierte en cero ni entra al KPI.
- [ ] Año, Mes y Año Mes vacíos no impiden la clasificación; el filtro Mes no excluye estas filas ni se infiere un período.
- [ ] Objetivos y presentaciones se deduplican por actividad y código, respectivamente; volver restaura página, orden, selección y scroll.
- [ ] KPI, tabla, modales, gráficas y CSV usan los textos definidos en `UI_COPY`.
- [ ] La diferencia positiva indica cajas físicas por encima del objetivo y la negativa indica cajas físicas pendientes.
- [ ] La interfaz no muestra nombres técnicos de estados ni variables internas.
- [ ] Los encabezados del CSV coinciden con la terminología ejecutiva de la tabla.
- [ ] Los combobox de Actividad y Cliente SAP permanecen sobre gráficas, timeline y tarjetas después de hacer scroll; el modal permanece por encima del dropdown.
- [ ] La tabla de seguimiento no muestra buscador local; filtros globales y estados locales determinan tabla y CSV.
- [ ] **← Volver** recupera detalle, contribución y cliente interno con página, orden, selección y scroll anteriores.
- [ ] Con el modal abierto, rueda, teclado y tacto no desplazan el dashboard; al cerrar se restaura la posición exacta.

## Errores y fallbacks

- [ ] Bloquear archivo sin una columna obligatoria y listar su nombre.
- [ ] Permitir archivo sin columna analítica opcional y explicar la función desactivada.
- [ ] Rechazar archivo inválido y liberar el estado de procesamiento.
- [ ] Probar sin ECharts: gráficas y timeline deben usar fallback nativo.
- [ ] Probar sin Lucide: textos, etiquetas y fallback de KPI deben seguir utilizables.
- [ ] Probar sin ambas CDN.
- [ ] Revisar objetivo conflictivo, venta ambigua y fechas conflictivas sin valores inventados.
- [ ] Confirmar que un CSV con `=`, `+`, `-` o `@` textual queda prefijado con `'` y que un número negativo permanece numérico.

## Registro

| Fecha | Navegador/versión | Responsable | Resultado | Evidencia/incidencias |
| --- | --- | --- | --- | --- |
| Pendiente | Pendiente | Pendiente | No ejecutado | El entorno automatizado no dispone de navegador |

## Tabla de seguimiento

- [ ] Confirmar período predeterminado y período seleccionado desde Mes.
- [ ] Probar los tres estados mensuales y los tres estados del objetivo total.
- [ ] Filtrar por SAP, nombre/NIT, actividad, región y CEDI desde los controles globales; ordenar y cambiar 25/50/100 en la tabla.
- [ ] Verificar que el CSV contiene todas las coincidencias y columnas de cada período.
- [ ] Abrir un detalle individual y uno compartido; separar venta general, aporte y venta conjunta.
- [ ] Usar Ver cliente, Ver negociación y Ver contribución; confirmar chips sincronizados.
- [ ] En 390 × 844 confirmar tarjetas únicas, modal usable y scroll interno mensual.
