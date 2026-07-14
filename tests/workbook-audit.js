"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const testPath = path.join(__dirname, "sales-information.test.js");
let source = fs.readFileSync(testPath, "utf8");
source = source.replace(/\r\n/g, "\n");
const marker = 'runSyntheticTests();\nrunTimelineModelTests();\nrunLayoutPresentationTests();\nrunProductionHardeningTests();\nrunDocumentationTests();\nrunAttachedWorkbookValidation();\nrunSharedWorkbookValidation();\n\nconsole.log("sales-information.test.js: OK");';

const audit = String.raw`
const workbookPath = process.env.INSUMO_DASHBOARD_XLSX || process.env.PRUEBA_DASHBOARD_XLSX || path.join(os.homedir(), "Downloads", "INSUMO DASHBOARD (1).xlsx");
const matrix = readXlsxFirstSheet(workbookPath);
const rows = processWorkbook(workbookPath);

function auditClean(value) {
  return app.normalizeCellText(value);
}

function auditUnique(field) {
  return Array.from(new Set(rows.map((row) => auditClean(row[field])).filter(Boolean)));
}

const statusCounts = rows.reduce((counts, row) => {
  counts[row.estadoInformacionVenta] = (counts[row.estadoInformacionVenta] || 0) + 1;
  return counts;
}, {});

const activityClients = new Map();
const clientPeriodActivities = new Map();
const activityObjectives = new Map();
const activityTotalObjectives = new Map();
const activityDates = new Map();
const granularSales = new Map();
rows.forEach((row, index) => {
  const activity = auditClean(row["ID Actividad"]);
  const client = auditClean(row["Cliente SAP - Clave"]);
  const period = app.getYearMonthSortValue(row);
  const presentation = auditClean(row["Presentación AS400 de la venta - Clave"]) || "fila-" + index;
  if (activity) {
    if (!activityClients.has(activity)) activityClients.set(activity, new Set());
    if (client) activityClients.get(activity).add(client);
    [[activityObjectives, "Objetivo mes "], [activityTotalObjectives, "Objetivo cajas total"]].forEach(([map, field]) => {
      if (!map.has(activity)) map.set(activity, new Set());
      const value = row[field];
      if (typeof value === "number" && Number.isFinite(value)) map.get(activity).add(value);
    });
    if (!activityDates.has(activity)) activityDates.set(activity, new Set());
    activityDates.get(activity).add(String(row["Fecha inicio"] || "") + "||" + String(row["Fecha fin"] || ""));
  }
  if (client && period !== null) {
    const clientPeriodKey = client + "||" + period;
    if (!clientPeriodActivities.has(clientPeriodKey)) clientPeriodActivities.set(clientPeriodKey, new Set());
    if (activity) clientPeriodActivities.get(clientPeriodKey).add(activity);
    if (activity) {
      const granularKey = clientPeriodKey + "||" + activity + "||" + presentation;
      if (!granularSales.has(granularKey)) granularSales.set(granularKey, new Set());
      const value = row["Ventas cajas físicas (sin rep)"];
      if (typeof value === "number" && Number.isFinite(value)) granularSales.get(granularKey).add(value);
    }
  }
});

const sharedActivities = Array.from(activityClients).filter((entry) => entry[1].size > 1);
const clientPeriodSingle = Array.from(clientPeriodActivities).filter((entry) => entry[1].size === 1);
const clientPeriodMultiple = Array.from(clientPeriodActivities).filter((entry) => entry[1].size > 1);
const clientPeriodWithout = Array.from(clientPeriodActivities).filter((entry) => entry[1].size === 0);
const granularConflictKeys = Array.from(granularSales).filter((entry) => entry[1].size > 1);
const objectiveConflictActivities = Array.from(activityObjectives).filter((entry) => entry[1].size > 1);
const totalObjectiveConflictActivities = Array.from(activityTotalObjectives).filter((entry) => entry[1].size > 1);
const dateConflictActivities = Array.from(activityDates).filter((entry) => entry[1].size > 1);
const activityAnalytics = app.buildActivityAnalytics(rows);
const activityStatusCounts = activityAnalytics.activityPerformance.reduce((counts, item) => {
  counts[item.status] = (counts[item.status] || 0) + 1;
  return counts;
}, {});
const attributionSourceCounts = activityAnalytics.activityPerformance.reduce((counts, item) => {
  item.contributionRows.forEach((row) => { counts[row.source] = (counts[row.source] || 0) + 1; });
  return counts;
}, {});
const latestActivityPeriod = activityAnalytics.activityClientRelations.periods[activityAnalytics.activityClientRelations.periods.length - 1] || null;
const latestActivityAggregate = app.aggregateActivityPerformance(activityAnalytics.activityPerformance.filter((item) => item.period === latestActivityPeriod));
const qualityReport = app.buildDataQualityReport(rows, { activityAnalytics: activityAnalytics });
const generalSales = { period: app.sumUniqueTotalSalesMonth(rows), latestMonth: app.sumUniqueTotalSalesMonth(app.getLatestYearMonthRows(rows)) };

console.log(JSON.stringify({
  rows: rows.length,
  columns: matrix[0].length,
  headers: matrix[0],
  statusCounts: statusCounts,
  unique: {
    presentations: auditUnique("Presentación AS400 de la venta - Clave").length,
    activities: auditUnique("ID Actividad").length,
    categories: auditUnique("Categoría AS400 de la venta").length,
    months: auditUnique("Mes"),
    clients: auditUnique("Cliente SAP - Clave").length,
    regions: auditUnique("Región SAP").length,
    channels: auditUnique("Canal").length,
    cedis: auditUnique("Cedi").length
  },
  activityRelations: {
    individualActivities: activityClients.size - sharedActivities.length,
    sharedActivities: sharedActivities.length,
    maximumClientsPerActivity: Math.max(0, ...Array.from(activityClients.values(), (clients) => clients.size)),
    sharedActivitySamples: sharedActivities.slice(0, 10).map((entry) => ({ activityId: entry[0], clients: Array.from(entry[1]) }))
  },
  clientPeriodRelations: {
    singleActivity: clientPeriodSingle.length,
    multipleActivities: clientPeriodMultiple.length,
    withoutActivity: clientPeriodWithout.length,
    multipleActivitySamples: clientPeriodMultiple.slice(0, 10).map((entry) => ({ key: entry[0], activities: Array.from(entry[1]) }))
  },
  sourceConflicts: {
    totalSalesClientPeriods: qualityReport.totalSalesConflicts,
    granularSalesKeys: granularConflictKeys.length,
    monthlyObjectiveActivities: objectiveConflictActivities.length,
    totalObjectiveActivities: totalObjectiveConflictActivities.length,
    dateActivities: dateConflictActivities.length,
    exactDuplicateRows: qualityReport.exactDuplicateRows
  },
  activityAnalytics: {
    summary: activityAnalytics.summary,
    statusCounts: activityStatusCounts,
    attributionSourceCounts: attributionSourceCounts,
    ambiguousSamples: activityAnalytics.activityPerformance.filter((item) => item.status === "VENTA_ACTIVIDAD_AMBIGUA").slice(0, 10).map((item) => ({
      activityId: item.activityId,
      period: item.period,
      reasons: item.ambiguityReasons
    })),
    latestPeriod: latestActivityPeriod,
    latestAggregate: latestActivityAggregate,
    generalSales: generalSales,
    individualPerformanceSample: activityAnalytics.activityPerformance.find((item) => !item.isSharedActivity && item.comparable && item.period === latestActivityPeriod) || null,
    sharedPerformanceSamples: activityAnalytics.activityPerformance.filter((item) => item.isSharedActivity && item.comparable).slice(0, 5).map((item) => ({
      activityId: item.activityId,
      period: item.period,
      clients: item.associatedClientCount,
      sales: item.totalSales,
      objective: item.objectiveMonthly,
      achievement: item.achievement,
      gap: item.gap,
      contributions: item.contributionRows.map((row) => ({ clientId: row.clientId, sales: row.sales, share: row.share, rank: row.rank, source: row.source }))
    }))
  },
  quality: qualityReport,
  noSalesByCategory: app.groupPresentationsWithoutSalesByCategory(rows)
}, null, 2));
`;

if (!source.includes(marker)) {
  throw new Error("No se encontró el punto de entrada del archivo de pruebas.");
}

source = source.replace(marker, audit);
eval(source);
