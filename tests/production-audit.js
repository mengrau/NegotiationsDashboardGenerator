"use strict";

const fs = require("fs");
const path = require("path");

const testPath = path.join(__dirname, "sales-information.test.js");
let source = fs.readFileSync(testPath, "utf8").replace(/\r\n/g, "\n");
const marker = /runSyntheticTests\(\);[\s\S]*?console\.log\("sales-information\.test\.js: OK"\);/;

const audit = String.raw`
const productionWorkbookPath = process.env.INSUMO_DASHBOARD_XLSX || path.join(os.homedir(), "Downloads", "INSUMO DASHBOARD (3).xlsx");
if (!fs.existsSync(productionWorkbookPath)) throw new Error("No se encontró INSUMO DASHBOARD (3).xlsx para la auditoría de producción.");
const productionRows = processWorkbook(productionWorkbookPath);
dashboard.initializeDashboardDataset(productionRows);
const productionAnalytics = dashboard.buildActivityAnalytics(productionRows);
const productionQuality = app.buildDataQualityReport(productionRows);
const clientNegotiationModels = app.buildClientNegotiationModels(productionRows);
const activity947878 = clientNegotiationModels.clientActivitySummary.find(function (row) {
  return row.activityId === "947878" && Number.isFinite(row.totalClientSalesByMonth && row.totalClientSalesByMonth[202606]);
});
const productionHtml = dashboard.generatedHtml({ rows: productionRows, metadata: { qualityWarnings: productionQuality, sourceFileName: "INSUMO DASHBOARD (3).xlsx", clientNegotiationModels: clientNegotiationModels } });
const criticalErrors = [];
const warnings = ["Validación visual pendiente: el entorno automatizado de Node.js no inspecciona pintura, contraste ni overflow real."];
function checkProduction(condition, message) { if (!condition) criticalErrors.push(message); }
checkProduction(/^<!doctype html>/i.test(productionHtml), "DOCTYPE ausente");
checkProduction(countOccurrences(productionHtml, "<html") === 1, "Cantidad inválida de etiquetas html");
checkProduction(countOccurrences(productionHtml, "<head>") === 1, "Cantidad inválida de head");
checkProduction(countOccurrences(productionHtml, "<body>") === 1, "Cantidad inválida de body");
checkProduction(findDuplicateHtmlIds(productionHtml).length === 0, "IDs duplicados");
checkProduction(countOccurrences(productionHtml, "echarts@5/dist/echarts.min.js") === 1, "Carga ECharts inválida");
checkProduction(countOccurrences(productionHtml, "unpkg.com/lucide@latest") === 1, "Carga Lucide inválida");
checkProduction(Array.from(productionHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)).length === 1, "Script inline inválido");
checkProduction(!/>\s*(?:NaN|-?Infinity|undefined|null|\[object Object\])\s*</.test(productionHtml), "Valor visual inválido en HTML");
const hostileProductionHtml = dashboard.generatedHtml({ rows: [{ value: "</script><script>alert(1)</script>\u2028\u2029" }], metadata: {} });
checkProduction(!hostileProductionHtml.includes("</script><script>alert(1)</script>"), "Serialización insegura");
checkProduction(hostileProductionHtml.includes("\\u003c/script\\u003e") && hostileProductionHtml.includes("\\u2028") && hostileProductionHtml.includes("\\u2029"), "Escape Unicode incompleto");
const productionCsv = dashboard.exportFilteredCsv([{ "Presentación AS400 de la venta - Texto": "=CMD()", "Ventas cajas físicas (sin rep)": -5 }]);
checkProduction(productionCsv.startsWith("\uFEFF"), "CSV sin BOM UTF-8");
checkProduction(productionCsv.includes("'=CMD()") && productionCsv.includes('"-5"'), "Protección CSV inválida");
const productionSnapshot = dashboard.getDashboardPerformanceSnapshot();
checkProduction(productionSnapshot.caches.filters <= 12 && productionSnapshot.caches.analyses <= 8 && productionSnapshot.caches.timelines <= 8 && productionSnapshot.caches.clientTrackingDetails <= 16, "Límite de caché inválido");
const shared = productionAnalytics.activityPerformance.find(function (item) { return item.activityId === "947124" && item.period === 202606; });
const individual = productionAnalytics.activityPerformance.find(function (item) { return item.activityId === "874894" && item.period === 202606; });
checkProduction(!productionRows.some(function (row) { return row["ID Actividad"] === "947124"; }) || (Boolean(shared) && shared.totalSales === 541 && shared.objectiveMonthly === 1100 && shared.gap === -559), "Regresion 947124");
checkProduction(Boolean(individual) && individual.totalSales === 549.252 && individual.objectiveMonthly === 500 && individual.isSharedActivity === false, "Regresión 874894");
checkProduction(!activity947878 || Math.abs(activity947878.totalClientSalesByMonth[202606] - 223.5) < 0.01, "Venta total 947878 inválida");
checkProduction(!activity947878 || Math.abs(activity947878.negotiatedPresentationSalesByMonth[202606] - 191) < 0.01, "Venta negociada 947878 inválida");
checkProduction(!activity947878 || Math.abs(activity947878.monthlyComplianceByMonth[202606] - 223.5 / 134) < 0.0001, "Cumplimiento 947878 inválido");
const clientRows = productionRows.filter(function (row) { return row["Cliente SAP - Clave"] === "1002559342"; });
const clientAnalysis = dashboard.buildDashboardAnalyses(clientRows, dashboard.getNoSalesAnalysis(clientRows), { scopeRows: productionRows, filters: { "Cliente SAP - Clave": "1002559342" }, activityAnalytics: productionAnalytics });
checkProduction(clientAnalysis.timeline.historicalPeriodCount === 2 && clientAnalysis.timeline.activities.length === 2, "Regresión cliente 1002559342");
const appSource = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const dashboardSource = fs.readFileSync(path.join(ROOT, "dashboard-template.js"), "utf8");
checkProduction(!appSource.includes("console.error(") && !appSource.includes("console.warn("), "Logs invasivos en generador");
checkProduction(!dashboardSource.includes("console.error(") && !dashboardSource.includes("console.warn("), "Logs invasivos en dashboard");
checkProduction(countOccurrences(dashboardSource, 'window.addEventListener("resize", debouncedResizeCharts)') === 1, "Listener resize duplicado");
checkProduction(countOccurrences(dashboardSource, 'charts.addEventListener("click", handleTimelineAction)') === 1, "Listener timeline duplicado");
checkProduction(dashboardSource.includes("function portalComboboxPanel") && dashboardSource.includes("document.body.appendChild(panel)"), "El dropdown no usa portal directo en body");
checkProduction(dashboardSource.includes("position: fixed; z-index: 1000") && dashboardSource.includes("z-index: 2000"), "Jerarquía de capas de dropdown/modal inválida");
checkProduction(dashboardSource.includes('window.addEventListener("scroll", repositionOpenComboboxPanel, true)') && dashboardSource.includes("getBoundingClientRect()"), "El dropdown no se reposiciona tras scroll");
checkProduction(!dashboardSource.includes('id: "salesTrend"') && !dashboardSource.includes('"chartMes"') && !dashboardSource.includes("Evolución de ventas"), "La gráfica Evolución de ventas no fue eliminada completamente");
checkProduction(!dashboardSource.includes('id: "noSales"') && !dashboardSource.includes('"chartSinVentasCategoria"') && !dashboardSource.includes("renderNoSalesCategoryChart"), "La gráfica anterior de ausencia de venta no fue eliminada completamente");
checkProduction(!productionHtml.includes('<aside class="sidebar">') && !productionHtml.includes('id="sidebarToggle"') && !dashboardSource.includes("function initSidebar"), "El sidebar o su ciclo de vida siguen presentes");
checkProduction(productionHtml.includes('class="dashboard-shell"') && !dashboardSource.includes("sidebar-collapsed"), "El layout central no está consolidado");
checkProduction(!dashboardSource.includes('escapeHtml(model.filterBadge)') && !dashboardSource.includes("Numerador comparable acumulado") && dashboardSource.includes("Ventas comparables acumuladas"), "La limpieza de textos KPI/acumulado está incompleta");
checkProduction(dashboardSource.includes("buildClientNegotiationContextKpi") && dashboardSource.includes("clientActivitySummary"), "Falta el KPI contextual de cliente basado en el modelo preparado");
checkProduction(dashboardSource.includes('action: "open-negotiation-usage"') && dashboardSource.includes("buildNegotiationUsageExplorerConfig"), "Falta el explorador del KPI de clientes negociados sin ventas");
checkProduction(dashboardSource.includes("function hasExplicitZeroTotalMonthlySales") && dashboardSource.includes("value === 0"), "La regla de venta total cero explicita no esta centralizada");
checkProduction(dashboardSource.includes("function getNegotiationUsageCompatibleFilters") && dashboardSource.includes('["A\\u00f1o", "Mes", "A\\u00f1o Mes"]'), "El KPI no excluye correctamente los filtros temporales");
checkProduction(!dashboardSource.includes("NEGOCIACION_SIN_USO") && !dashboardSource.includes("totalWithoutUse"), "Permanece la clasificacion anterior de negociaciones sin uso");
checkProduction(dashboardSource.includes('title: "Ventas comparables"'), "Falta el KPI de ventas comparables");
checkProduction(productionRows.length > 0, "Workbook sin filas");
checkProduction(clientNegotiationModels.clientActivitySummary.length > 0, "Modelo cliente-negociacion vacio");
checkProduction(clientNegotiationModels.clientSummary.length > 0, "Modelo resumido por cliente vacio");
checkProduction(clientNegotiationModels.availablePeriods.length > 0, "No se resolvieron periodos dinamicos");
checkProduction(clientNegotiationModels.summaryTableColumns.length === 17 + clientNegotiationModels.availablePeriods.length * 8, "Contrato de columnas dinamicas invalido");
const trackingPeriod = clientNegotiationModels.availablePeriods[clientNegotiationModels.availablePeriods.length - 1];
const trackingCsv = dashboard.buildClientTrackingSummaryCsv(clientNegotiationModels.clientActivitySummary, clientNegotiationModels.availablePeriods, trackingPeriod);
checkProduction(productionHtml.includes('id="clientTracking"') && productionHtml.includes("Seguimiento de clientes y negociaciones"), "Vista de seguimiento ausente");
checkProduction(dashboardSource.includes("clientTrackingCache: createLruCache(8)") && dashboardSource.includes("rows.slice(start, start + tableState.pageSize)"), "Proyeccion de seguimiento no acotada");
checkProduction(trackingCsv.startsWith("\uFEFF") && trackingCsv.includes("Cumplimiento " + trackingPeriod.label) && trackingCsv.includes("Estado " + trackingPeriod.label), "CSV de seguimiento invalido");
checkProduction(clientNegotiationModels.clientActivitySummary.every(function (row) { return Object.values(row.monthlyDiscountByMonth || {}).every(function (value) { return value >= -1 && value <= 1; }); }), "Descuento mensual fuera de escala decimal");
checkProduction(clientNegotiationModels.clientActivitySummary.every(function (row) { return row.investmentPercentage === null || row.investmentPercentage === undefined || Math.abs(row.investmentPercentage) <= 1; }), "Inversion fuera de escala decimal");
checkProduction((trackingCsv.match(/\n/g) || []).length === clientNegotiationModels.clientActivitySummary.length, "CSV de seguimiento no exporta todas las relaciones");
checkProduction(clientNegotiationModels.availablePeriods.every(function (period) {
  const counts = clientNegotiationModels.diagnostics.monthlyStatusCountsByPeriod[period.key];
  return counts && counts.CUMPLE_MES + counts.NO_CUMPLE_MES + counts.NO_EVALUABLE_MES === clientNegotiationModels.clientActivitySummary.length;
}), "Auditoria mensual incompleta");
checkProduction(Object.values(clientNegotiationModels.diagnostics.totalObjectiveStatusCounts).reduce(function (sum, value) { return sum + value; }, 0) === clientNegotiationModels.clientActivitySummary.length, "Auditoria de objetivo total incompleta");
checkProduction(productionAnalytics.summary.activityCount > 0, "Cantidad de actividades invalida");
checkProduction(productionAnalytics.activityClientRelations.periods.length > 0, "Cantidad de periodos invalida");
if (criticalErrors.length) throw new Error("Auditoría de producción fallida: " + criticalErrors.join(" | "));
console.log(JSON.stringify({
  status: "OK",
  criticalErrors: criticalErrors.length,
  warnings: warnings,
  workbook: { rows: productionRows.length, activities: productionAnalytics.summary.activityCount, clients: productionSnapshot.indexes.clients, periods: productionAnalytics.activityClientRelations.periods.length },
  html: { bytes: Buffer.byteLength(productionHtml, "utf8"), duplicateIds: 0, echartsLoads: 1, lucideLoads: 1, safeSerialization: true },
  csv: { utf8Bom: true, formulaProtection: true, negativeNumberPreserved: true, trackingRows: clientNegotiationModels.clientActivitySummary.length, dynamicPeriods: clientNegotiationModels.availablePeriods.length },
  caches: productionSnapshot.caches,
  diagnostics: dashboard.getDashboardDiagnosticsSnapshot(),
  clientNegotiationModels: { relations: clientNegotiationModels.clientActivitySummary.length, clients: clientNegotiationModels.clientSummary.length, periods: clientNegotiationModels.availablePeriods.length, monthlyStates: clientNegotiationModels.diagnostics.monthlyStatusCountsByPeriod, totalStates: clientNegotiationModels.diagnostics.totalObjectiveStatusCounts },
  regressions: {
    activity947124: shared ? true : "no presente en el workbook",
    activity947878: activity947878 ? {
      totalSales: activity947878.totalClientSalesByMonth[202606],
      negotiatedSales: activity947878.negotiatedPresentationSalesByMonth[202606],
      nonNegotiatedSales: activity947878.nonNegotiatedPresentationSalesByMonth[202606],
      compliance: activity947878.monthlyComplianceByMonth[202606],
      status: activity947878.monthlyStatusByMonth[202606]
    } : "no presente en el workbook",
    activity874894: true,
    client1002559342: true
  },
  visualInspectionPerformed: false
}, null, 2));
`;

if (!marker.test(source)) throw new Error("No se encontró el punto de entrada del archivo de pruebas.");
source = source.replace(marker, audit);
eval(source);
