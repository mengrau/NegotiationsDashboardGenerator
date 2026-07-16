"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { performance } = require("perf_hooks");

const testPath = path.join(__dirname, "sales-information.test.js");
let source = fs.readFileSync(testPath, "utf8").replace(/\r\n/g, "\n");
const marker = /runSyntheticTests\(\);[\s\S]*?console\.log\("sales-information\.test\.js: OK"\);/;

const audit = String.raw`
const workbookPath = process.env.INSUMO_DASHBOARD_XLSX || path.join(os.homedir(), "Downloads", "INSUMO DASHBOARD (3).xlsx");
const measurements = {};
function measure(name, callback) {
  const startedAt = performance.now();
  const value = callback();
  measurements[name] = Math.round((performance.now() - startedAt) * 100) / 100;
  return value;
}
const matrix = measure("readWorkbookXmlMs", function () { return readXlsxFirstSheet(workbookPath); });
const rows = measure("normalizationMs", function () {
  const headers = matrix[0].map(app.normalizeCellText);
  const headerMap = app.buildHeaderMap(headers);
  return matrix.slice(1).filter(function (row) { return row && !row.every(app.isEmptyCell); }).map(function (row) {
    const rowObject = {};
    REQUIRED_COLUMNS.forEach(function (column) {
      const index = app.getHeaderIndex(headerMap, column);
      rowObject[column] = index === undefined ? null : row[index];
    });
    return app.normalizeRow(rowObject);
  });
});
measure("indexConstructionMs", function () { return dashboard.initializeDashboardDataset(rows); });
const preferredActivityId = rows.some(function (row) { return row["ID Actividad"] === "947124"; })
  ? "947124"
  : rows.map(function (row) { return row["ID Actividad"]; }).find(Boolean);
const facetedOptions = measure("facetedOptionsColdMs", function () {
  return dashboard.buildFacetedOptions({ "ID Actividad": [preferredActivityId] }, rows);
});
measure("facetedOptionsCacheHitMs", function () {
  return dashboard.buildFacetedOptions({ "ID Actividad": [preferredActivityId] }, rows);
});
measure("activityComboboxSearchMs", function () {
  const query = dashboard.normalizeSearchText(preferredActivityId);
  return facetedOptions.get("ID Actividad").filter(function (item) { return item.searchText.includes(query); });
});
measure("clientComboboxSearchMs", function () {
  const query = dashboard.normalizeSearchText("1002559342");
  return facetedOptions.get("Cliente SAP - Clave").filter(function (item) { return item.searchText.includes(query); });
});
const activityAnalytics = measure("activityAnalyticsMs", function () { return dashboard.buildActivityAnalytics(rows); });
const clientNegotiationModels = measure("clientNegotiationModelColdMs", function () { return app.buildClientNegotiationModels(rows); });
measure("clientNegotiationModelReadMs", function () { return clientNegotiationModels.clientActivitySummary.length + clientNegotiationModels.clientSummary.length; });
const trackingRows = measure("clientTrackingProjectionMs", function () {
  return clientNegotiationModels.clientActivitySummary.filter(function (row) { return dashboard.clientTrackingRelationMatchesFilters(row, {}); }).slice().sort(function (a, b) { return a.clientName.localeCompare(b.clientName, "es"); });
});
measure("clientTrackingPageReadMs", function () { return trackingRows.slice(0, 25); });
measure("clientTrackingCsvMs", function () { return dashboard.buildClientTrackingSummaryCsv(trackingRows, clientNegotiationModels.availablePeriods, clientNegotiationModels.availablePeriods[clientNegotiationModels.availablePeriods.length - 1]); });
const trackingDetailRow = clientNegotiationModels.clientActivitySummary[0];
const trackingDetailCold = measure("clientTrackingDetailColdMs", function () { return dashboard.getClientTrackingDetailModel(trackingDetailRow, clientNegotiationModels.availablePeriods); });
const trackingDetailCached = measure("clientTrackingDetailCacheHitMs", function () { return dashboard.getClientTrackingDetailModel(trackingDetailRow, clientNegotiationModels.availablePeriods); });
if (trackingDetailCold !== trackingDetailCached) throw new Error("La caché de detalle no reutilizó el modelo preparado.");
const scrollCountersBefore = JSON.stringify(dashboard.getDashboardPerformanceSnapshot().counters);
measure("modalScrollBoundaryChecks1000Ms", function () {
  const scrollable = { scrollHeight: 1200, clientHeight: 480, scrollTop: 200, parentElement: null };
  for (let index = 0; index < 1000; index += 1) dashboard.findModalScroller(scrollable, index % 2 ? 1 : -1);
});
if (JSON.stringify(dashboard.getDashboardPerformanceSnapshot().counters) !== scrollCountersBefore) throw new Error("El scroll del modal modificó contadores de análisis o render");
measure("noSalesAnalysisMs", function () { return dashboard.getNoSalesAnalysis(rows); });
measure("dimensionOptionsMs", function () {
  return ["Región SAP", "Canal", "Categoría AS400 de la venta", "Cliente SAP - Clave", "Cedi"].map(function (field) {
    return dashboard.getUniqueOptions(rows, field);
  });
});
measure("salesByCanonicalPeriodMs", function () { return dashboard.salesByCanonicalPeriod(rows); });
measure("presentationStatusMs", function () { return dashboard.buildPresentationStatusAnalysis(rows); });
measure("categoryAndPresentationGroupsMs", function () {
  return [
    dashboard.groupBySum(rows, "Presentación AS400 de la venta - Texto", "Ventas cajas físicas (sin rep)", 10),
    dashboard.groupBySum(rows, "Categoría AS400 de la venta", "Ventas cajas físicas (sin rep)", 12)
  ];
});
measure("kpisWithActivityCacheMs", function () {
  return dashboard.computeKpis(rows, dashboard.getNoSalesAnalysis(rows), { scopeRows: rows, filters: {}, activityAnalytics: activityAnalytics });
});
const fullAnalysis = measure("dashboardAnalysesColdMs", function () {
  return dashboard.buildDashboardAnalyses(rows, dashboard.getNoSalesAnalysis(rows), { scopeRows: rows, filters: {}, clientNegotiationModels: clientNegotiationModels });
});
const visibleChartDefinitions = dashboard.getChartRegistry().filter(function (definition) { return definition.shouldRender(fullAnalysis); });
const adaptiveChartLayout = measure("adaptiveChartLayoutMs", function () {
  return dashboard.assignAdaptiveChartLayout(visibleChartDefinitions);
});
const comparableFormulaConsistency = dashboard.reconcileComparablePerformance({
  comparableSales: fullAnalysis.kpis.comparableSales,
  comparableObjective: fullAnalysis.kpis.comparableObjective,
  compliance: fullAnalysis.kpis.compliance,
  objectiveDifference: fullAnalysis.kpis.objectiveDifference
});
if (!comparableFormulaConsistency.consistent) throw new Error("Las fórmulas comparables no se reconcilian");
if (visibleChartDefinitions.some(function (definition) { return definition.id === "salesTrend" || definition.elementId === "chartMes"; })) throw new Error("Evolución de ventas sigue activa");
if (visibleChartDefinitions.some(function (definition) { return definition.id === "noSales" || definition.elementId === "chartSinVentasCategoria"; })) throw new Error("La gráfica de presentaciones sin ventas sigue activa");
const visualOptions = measure("visualOptionConstructionMs", function () {
  const categoryType = dashboard.chooseCompositionChartType(fullAnalysis.categorySales, { treemapLimit: 12, fallbackType: "bar" });
  return {
    categoryType: categoryType,
    category: dashboard.buildEChartOption(categoryType, fullAnalysis.categorySales, false, true, {}),
    presentations: dashboard.buildEChartOption("lollipop", fullAnalysis.presentationSales, false, true, {})
  };
});
measure("kpiGridLayoutMetadataMs", function () { return dashboard.getKpiGridLayoutMetadata(8); });
measure("dashboardAnalysesWithActivityCacheMs", function () {
  return dashboard.buildDashboardAnalyses(rows, fullAnalysis.noSalesAnalysis, { scopeRows: rows, filters: {}, activityAnalytics: activityAnalytics });
});
const cachedAnalysis = measure("dashboardAnalysisCacheColdMs", function () {
  return dashboard.getDashboardAnalysisCached("audit:all", function () {
    return dashboard.buildDashboardAnalyses(rows, fullAnalysis.noSalesAnalysis, { scopeRows: rows, filters: {}, activityAnalytics: activityAnalytics });
  });
});
measure("dashboardAnalysisCacheHitMs", function () {
  return dashboard.getDashboardAnalysisCached("audit:all", function () { throw new Error("No debe reconstruir el análisis"); });
});
const activityRows = measure("filterActivity947124Ms", function () {
  return dashboard.getFilteredRowsCached(rows, { "ID Actividad": [preferredActivityId] }, "activity-audit");
});
measure("filterActivity947124CacheHitMs", function () {
  return dashboard.getFilteredRowsCached(rows, { "ID Actividad": [preferredActivityId] }, "activity-audit");
});
const activityAnalysis = measure("activity947124AnalysisCachedMs", function () {
  return dashboard.buildDashboardAnalyses(activityRows, dashboard.getNoSalesAnalysis(activityRows), {
    scopeRows: rows,
    filters: { "ID Actividad": preferredActivityId },
    activityAnalytics: activityAnalytics
  });
});
const timelineCold = measure("timelineModelColdMs", function () {
  return dashboard.buildNegotiationTimelineAnalysis({
    filters: { "ID Actividad": preferredActivityId },
    analyses: activityAnalysis,
    indexes: dashboard.state && dashboard.state.indexes
  });
});
const timelineVisualOption = measure("timelineVisualOptionMs", function () { return dashboard.buildNegotiationTimelineOption(timelineCold); });
if (timelineVisualOption.series[0].type !== "line" || timelineVisualOption.series[0].smooth !== 0.25) throw new Error("La timeline no usa la línea suavizada aprobada");
if (visualOptions.presentations.series[1].type !== "scatter") throw new Error("El ranking no usa lollipop");
measure("timelineCachePopulateMs", function () {
  return dashboard.getNegotiationTimelineAnalysisCached({
    filters: { "ID Actividad": preferredActivityId }, analyses: activityAnalysis, datasetVersion: "audit-timeline"
  });
});
const timelineCached = measure("timelineModelCacheHitMs", function () {
  return dashboard.getNegotiationTimelineAnalysisCached({
    filters: { "ID Actividad": preferredActivityId }, analyses: activityAnalysis, datasetVersion: "audit-timeline"
  });
});
const activity = activityAnalysis.kpis.selectedActivity;
const modalConfig = measure("contributionModalModelMs", function () { return dashboard.buildActivityContributionConfig(activity); });
measure("contributionSearchMs", function () {
  const query = "cliente";
  return modalConfig.rows.filter(function (row) {
    return (row.clientId + " " + row.clientName).toLocaleLowerCase("es-CO").includes(query);
  });
});
measure("contributionSortMs", function () {
  return modalConfig.rows.slice().sort(function (a, b) { return b.sales - a.sales; });
});
measure("contributionCsvModelMs", function () {
  return modalConfig.rows.map(function (row) {
    return [row.clientId, row.clientName, row.sales, row.share, row.rank, row.presentationCount, row.source, row.status];
  });
});
console.log(JSON.stringify({
  environment: "Node.js calculation timings; no browser paint or ECharts timing",
  rows: rows.length,
  measurements: measurements,
  activityAudit: activity ? {
    activityId: preferredActivityId,
    clients: activity.associatedClientCount,
    sales: activity.totalSales,
    objective: activity.objectiveMonthly,
    achievement: activity.achievement,
    gap: activity.gap,
    contributions: activity.contributionRows.map(function (row) { return { clientId: row.clientId, sales: row.sales, share: row.share }; })
  } : null,
  modalRows: modalConfig.rows.length,
  layout: {
    visibleCharts: adaptiveChartLayout.length,
    featuredOrTimeline: adaptiveChartLayout.filter(function (item) { return item.layout === "featured" || item.layout === "timeline"; }).length,
    rowFillCards: adaptiveChartLayout.filter(function (item) { return item.layoutClass.includes("chart-row-fill"); }).length,
    analysisRebuiltForLayout: false,
    categoryVisualType: visualOptions.categoryType,
    noSalesExplorer: "kpi-modal",
    presentationVisualType: "lollipop"
  },
  indicatorConsistency: {
    generalSales: fullAnalysis.kpis.salesPeriod,
    comparableAttributableSales: fullAnalysis.kpis.comparableSales,
    comparableObjective: fullAnalysis.kpis.comparableObjective,
    calculatedCompliance: fullAnalysis.kpis.compliance,
    calculatedDifference: fullAnalysis.kpis.objectiveDifference,
    formulaConsistent: comparableFormulaConsistency.consistent,
    activeChartCount: visibleChartDefinitions.length,
    salesTrendAbsent: !dashboard.getChartRegistry().some(function (definition) { return definition.id === "salesTrend" || definition.elementId === "chartMes"; }),
    noSalesChartAbsent: !dashboard.getChartRegistry().some(function (definition) { return definition.id === "noSales" || definition.elementId === "chartSinVentasCategoria"; }),
    previousPhaseReferenceChartCount: 12,
    currentChartCount: visibleChartDefinitions.length
  },
  timeline: {
    mode: timelineCold.mode,
    periodsGenerated: timelineCold.periods.length,
    activitiesIncluded: timelineCold.activities.length,
    echartsSeries: timelineCold.displayMode === "DETAIL" ? 2 : 0,
    primarySeriesType: timelineVisualOption.series[0].type,
    smooth: timelineVisualOption.series[0].smooth,
    updates: dashboard.getDashboardPerformanceSnapshot().counters.timelineUpdates,
    initializations: dashboard.getDashboardPerformanceSnapshot().counters.timelineInitializations,
    cacheSize: dashboard.getDashboardPerformanceSnapshot().caches.timelines,
    cacheReturnedSameModel: timelineCached === dashboard.getNegotiationTimelineAnalysisCached({ filters: { "ID Actividad": preferredActivityId }, analyses: activityAnalysis, datasetVersion: "audit-timeline" })
  },
  analyticalSummary: activityAnalytics.summary,
  clientNegotiationSummary: {
    relations: clientNegotiationModels.clientActivitySummary.length,
    clients: clientNegotiationModels.clientSummary.length,
    periods: clientNegotiationModels.availablePeriods,
    columns: clientNegotiationModels.summaryTableColumns.length,
    diagnostics: clientNegotiationModels.diagnostics
  },
  instrumentation: dashboard.getDashboardPerformanceSnapshot()
}, null, 2));
`;

if (!marker.test(source)) throw new Error("No se encontró el punto de entrada del archivo de pruebas.");
source = source.replace(marker, audit);
eval(source);
