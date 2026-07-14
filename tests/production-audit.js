"use strict";

const fs = require("fs");
const path = require("path");

const testPath = path.join(__dirname, "sales-information.test.js");
let source = fs.readFileSync(testPath, "utf8").replace(/\r\n/g, "\n");
const marker = 'runSyntheticTests();\nrunTimelineModelTests();\nrunLayoutPresentationTests();\nrunProductionHardeningTests();\nrunDocumentationTests();\nrunAttachedWorkbookValidation();\nrunSharedWorkbookValidation();\n\nconsole.log("sales-information.test.js: OK");';

const audit = String.raw`
const productionWorkbookPath = process.env.INSUMO_DASHBOARD_XLSX || path.join(os.homedir(), "Downloads", "INSUMO DASHBOARD (1).xlsx");
if (!fs.existsSync(productionWorkbookPath)) throw new Error("No se encontró INSUMO DASHBOARD (1).xlsx para la auditoría de producción.");
const productionRows = processWorkbook(productionWorkbookPath);
dashboard.initializeDashboardDataset(productionRows);
const productionAnalytics = dashboard.buildActivityAnalytics(productionRows);
const productionQuality = app.buildDataQualityReport(productionRows);
const productionHtml = dashboard.generatedHtml({ rows: productionRows, metadata: { qualityWarnings: productionQuality, sourceFileName: "INSUMO DASHBOARD (1).xlsx" } });
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
checkProduction(productionSnapshot.caches.filters <= 12 && productionSnapshot.caches.analyses <= 8 && productionSnapshot.caches.timelines <= 8, "Límite de caché inválido");
const shared = productionAnalytics.activityPerformance.find(function (item) { return item.activityId === "947124" && item.period === 202606; });
const individual = productionAnalytics.activityPerformance.find(function (item) { return item.activityId === "874894" && item.period === 202606; });
checkProduction(Boolean(shared) && shared.totalSales === 541 && shared.objectiveMonthly === 1100 && shared.gap === -559, "Regresión 947124");
checkProduction(Boolean(individual) && individual.totalSales === 549.252 && individual.objectiveMonthly === 500 && individual.isSharedActivity === false, "Regresión 874894");
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
checkProduction(!dashboardSource.includes('id: "noSales"') && !dashboardSource.includes('"chartSinVentasCategoria"') && !dashboardSource.includes("renderNoSalesCategoryChart"), "La gráfica de presentaciones sin ventas no fue eliminada completamente");
checkProduction(dashboardSource.includes('action: "open-no-sales-explorer"') && dashboardSource.includes("buildNoSalesCategoryExplorerConfig"), "Falta el explorador del KPI de presentaciones sin ventas");
checkProduction(dashboardSource.includes('title: "Ventas atribuibles comparables"'), "Falta el KPI de ventas atribuibles comparables");
checkProduction(productionRows.length === 18319, "Cantidad de filas inesperada");
checkProduction(productionAnalytics.summary.activityCount === 370, "Cantidad de actividades inesperada");
checkProduction(productionAnalytics.activityClientRelations.periods.length === 2, "Cantidad de períodos inesperada");
if (criticalErrors.length) throw new Error("Auditoría de producción fallida: " + criticalErrors.join(" | "));
console.log(JSON.stringify({
  status: "OK",
  criticalErrors: criticalErrors.length,
  warnings: warnings,
  workbook: { rows: productionRows.length, activities: productionAnalytics.summary.activityCount, clients: productionSnapshot.indexes.clients, periods: productionAnalytics.activityClientRelations.periods.length },
  html: { bytes: Buffer.byteLength(productionHtml, "utf8"), duplicateIds: 0, echartsLoads: 1, lucideLoads: 1, safeSerialization: true },
  csv: { utf8Bom: true, formulaProtection: true, negativeNumberPreserved: true },
  caches: productionSnapshot.caches,
  diagnostics: dashboard.getDashboardDiagnosticsSnapshot(),
  regressions: { activity947124: true, activity874894: true, client1002559342: true },
  visualInspectionPerformed: false
}, null, 2));
`;

if (!source.includes(marker)) throw new Error("No se encontró el punto de entrada del archivo de pruebas.");
source = source.replace(marker, audit);
eval(source);
