const assert = require("assert");
const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const REQUIRED_COLUMNS = [
  "Año",
  "Mes",
  "Año Mes",
  "Centro - Clave",
  "Canal",
  "Categoría AS400 de la venta",
  "Nit cliente - Clave",
  "Presentación AS400 de la venta - Texto",
  "Presentación AS400 de la venta - Clave",
  "Región SAP",
  "Tipología",
  "Cliente AS400 - Texto",
  "Cliente SAP - Clave",
  "Cliente AS400 - Nombre negocio (Texto)",
  "Ventas cajas físicas (sin rep)",
  "TotalVentaMes",
  "Objetivo mes ",
  "% De inversión",
  "ID Actividad",
  "Fecha inicio",
  "Fecha fin",
  "Objetivo cajas total",
  "Tipo descuento",
  "Porcentaje descuento negociación",
  "Porcentaje descuento venta",
  "Porcentaje descuento mes",
  "Periodo negociacion",
  "Cedi"
];

const app = loadAppContext();
const dashboard = loadDashboardContext();

runSyntheticTests();
runClientNegotiationModelTests();
runClientTrackingTableTests();
runTimelineModelTests();
runLayoutPresentationTests();
runProductionHardeningTests();
runDocumentationTests();
runAttachedWorkbookValidation();
runSharedWorkbookValidation();

console.log("sales-information.test.js: OK");

function runDocumentationTests() {
  const docsDir = path.join(ROOT, "docs");
  const expectedDocs = [
    "00_INDICE.md", "01_RESUMEN_EJECUTIVO.md", "02_ARQUITECTURA.md", "03_MODELO_DE_DATOS.md",
    "04_REGLAS_DE_NEGOCIO.md", "05_FLUJO_DE_PROCESAMIENTO.md", "06_INDICADORES_Y_FORMULAS.md",
    "07_FILTROS_Y_ESTADO.md", "08_VISUALIZACIONES.md", "09_LINEA_DE_TIEMPO.md",
    "10_EXPLORADOR_DE_CONTRIBUCION.md", "11_RENDIMIENTO.md", "12_SEGURIDAD_Y_FALLBACKS.md",
    "13_PRUEBAS_Y_QA.md", "14_GUIA_DE_EXPOSICION.md", "15_GLOSARIO.md"
  ];
  assert(fs.existsSync(docsDir));
  expectedDocs.forEach((name) => assert(fs.existsSync(path.join(docsDir, name)), "Falta " + name));
  const contents = expectedDocs.map((name) => ({ name, source: fs.readFileSync(path.join(docsDir, name), "utf8") }));
  const combined = contents.map((item) => item.source).join("\n");
  assert(!combined.includes("C:/Users/User/") && !combined.includes("C:\\Users\\User\\"));
  assert(combined.includes("Ventas atribuibles comparables"));
  assert(combined.includes("TotalVentaMes ≠ ventas atribuibles comparables"));
  assert(combined.includes("Guion de 3 minutos") && combined.includes("Guion de 15 minutos"));
  assert(combined.includes("LRU") && combined.includes("Lucide") && combined.includes("CDN"));
  assert(combined.includes("947124") && combined.includes("874894") && combined.includes("1002559342"));
  assert(combined.includes("npm.cmd run audit:production"));
  assert(combined.includes("Evolución de ventas") && combined.includes("se retiró"));
  const indexSource = contents.find((item) => item.name === "00_INDICE.md").source;
  expectedDocs.slice(1).forEach((name) => assert(indexSource.includes("(" + name + ")"), "Índice sin enlace a " + name));
  contents.forEach((item) => {
    const mermaidStarts = countOccurrences(item.source, "```mermaid");
    const mermaidBlocks = (item.source.match(/```mermaid[\s\S]*?```/g) || []).length;
    assert.strictEqual(mermaidBlocks, mermaidStarts, "Bloque Mermaid sin cerrar en " + item.name);
    for (const match of item.source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^(https?:|mailto:)/.test(target)) continue;
      assert(fs.existsSync(path.resolve(docsDir, target)), "Enlace roto en " + item.name + ": " + target);
    }
  });
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  assert(readme.includes("docs/00_INDICE.md"));
}

function loadAppContext() {
  const context = {
    console,
    document: {
      addEventListener() {},
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      }
    },
    window: {
      matchMedia() {
        return { matches: false };
      },
      localStorage: {
        getItem() {
          return null;
        },
        setItem() {}
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "app.js"), "utf8"), context);
  return context;
}

function loadDashboardContext() {
  const templateContext = { console };
  vm.createContext(templateContext);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "dashboard-template.js"), "utf8"), templateContext);

  const context = {
    console,
    DASHBOARD_DATA: [],
    DASHBOARD_META: {},
    document: {
      hidden: false,
      addEventListener() {},
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      }
    },
    window: {
      addEventListener() {},
      clearTimeout() {},
      setTimeout() {},
      matchMedia() {
        return { matches: false };
      },
      localStorage: {
        getItem() {
          return null;
        },
        setItem() {}
      },
      echarts: null
    }
  };
  vm.createContext(context);
  vm.runInContext(templateContext.dashboardScript(), context);
  context.generatedHtml = templateContext.generateDashboardHtml;
  return context;
}

function runSyntheticTests() {
  const withoutSales = normalize({
    "Categoría AS400 de la venta": "Hidratantes",
    "Presentación AS400 de la venta - Texto": "Squash Pet 500x12",
    "Presentación AS400 de la venta - Clave": "P-001",
    "Cliente SAP - Clave": "C-001",
    "ID Actividad": "A-001",
    "Ventas cajas físicas (sin rep)": "0"
  });

  const withoutSalesSameClient = normalize({
    "Categoría AS400 de la venta": "Gaseosa",
    "Presentación AS400 de la venta - Texto": "Manzana Pet 250x12",
    "Presentación AS400 de la venta - Clave": "P-006",
    "Cliente SAP - Clave": "C-001",
    "ID Actividad": "A-006",
    "Objetivo cajas total": "12",
    "Porcentaje descuento": "10",
    "Fecha fin": "2026-12-31",
    "Ventas cajas físicas (sin rep)": "0"
  });

  const withoutSalesGaseosaHighObjective = normalize({
    "Categoría AS400 de la venta": "Gaseosa",
    "Presentación AS400 de la venta - Texto": "Cola Max 400x12",
    "Presentación AS400 de la venta - Clave": "P-010",
    "Cliente SAP - Clave": "C-001",
    "ID Actividad": "A-010",
    "Objetivo cajas total": "99",
    "Porcentaje descuento": "8",
    "Fecha fin": "2026-10-15",
    "Ventas cajas físicas (sin rep)": "0"
  });

  const withoutSalesWithoutCategory = normalize({
    "Categoría AS400 de la venta": "",
    "Presentación AS400 de la venta - Texto": "Presentación sin categoría",
    "Presentación AS400 de la venta - Clave": "P-007",
    "Cliente SAP - Clave": "C-001",
    "ID Actividad": "A-007",
    "Ventas cajas físicas (sin rep)": "0"
  });

  const withoutSalesAlternateCategory = Object.assign(
    normalize({
      "Categoría AS400 de la venta": "",
      "Presentación AS400 de la venta - Texto": "Presentación con categoría alterna",
      "Presentación AS400 de la venta - Clave": "P-008",
      "Cliente SAP - Clave": "C-001",
      "ID Actividad": "A-008",
      "Ventas cajas físicas (sin rep)": "0"
    }),
    { "Categoria AS400 de la venta": "Energizantes" }
  );

  const withoutSalesResolvableCategory = normalize({
    "Categoría AS400 de la venta": "",
    "Presentación AS400 de la venta - Texto": "Cola retornable",
    "Presentación AS400 de la venta - Clave": "P-009",
    "Cliente SAP - Clave": "C-001",
    "ID Actividad": "A-009",
    "Ventas cajas físicas (sin rep)": "0"
  });

  const relatedPresentationWithCategory = normalize({
    "Año": "2026",
    "Mes": "Julio",
    "Año Mes": "202607",
    "Canal": "Tradicional",
    "Región SAP": "Antioquia",
    "Categoría AS400 de la venta": "Gaseosa",
    "Presentación AS400 de la venta - Texto": "Cola retornable",
    "Presentación AS400 de la venta - Clave": "P-009",
    "Cliente SAP - Clave": "C-001",
    "ID Actividad": "A-099",
    "Ventas cajas físicas (sin rep)": "12"
  });

  const zeroSale = normalize({
    "Año": "2026",
    "Mes": "Julio",
    "Año Mes": "202607",
    "Canal": "Tradicional",
    "Región SAP": "Antioquia",
    "Categoría AS400 de la venta": "Hidratantes",
    "Presentación AS400 de la venta - Texto": "Gatorade Pet 500x12",
    "Presentación AS400 de la venta - Clave": "P-002",
    "Cliente SAP - Clave": "C-002",
    "ID Actividad": "A-002",
    "Ventas cajas físicas (sin rep)": "0"
  });

  const withSale = normalize({
    "Año": "2026",
    "Mes": "Julio",
    "Año Mes": "202607",
    "Canal": "Moderno",
    "Región SAP": "Antioquia",
    "Categoría AS400 de la venta": "Gaseosa",
    "Presentación AS400 de la venta - Texto": "H2Oh! Pet 600 x 15",
    "Presentación AS400 de la venta - Clave": "P-003",
    "Cliente SAP - Clave": "C-003",
    "ID Actividad": "A-003",
    "Ventas cajas físicas (sin rep)": "1,5"
  });

  assert.strictEqual(withoutSales.estadoInformacionVenta, "SIN_INFORMACION_VENTA");
  assert.strictEqual(zeroSale.estadoInformacionVenta, "VENTA_CERO");
  assert.strictEqual(withSale.estadoInformacionVenta, "CON_VENTA");

  const invisibleSpaces = normalize({
    "Año": "\u00a0-\u00a0",
    "Mes": "\u00a0",
    "Región SAP": "-",
    "Categoría AS400 de la venta": "Hidratantes",
    "Presentación AS400 de la venta - Texto": " Presentación\u00a0larga ",
    "Presentación AS400 de la venta - Clave": "P-004",
    "Cliente SAP - Clave": "C-004",
    "ID Actividad": "A-004",
    "Ventas cajas físicas (sin rep)": "0"
  });
  assert.strictEqual(invisibleSpaces["Año"], null);
  assert.strictEqual(invisibleSpaces["Mes"], "");
  assert.strictEqual(invisibleSpaces["Región SAP"], "");
  assert.strictEqual(invisibleSpaces.estadoInformacionVenta, "SIN_INFORMACION_VENTA");

  const numericText = normalize({
    "Año": "2026",
    "Mes": "Julio",
    "Región SAP": "Antioquia",
    "Categoría AS400 de la venta": "Gaseosa",
    "Presentación AS400 de la venta - Texto": "Cola 400",
    "Presentación AS400 de la venta - Clave": "P-005",
    "Cliente SAP - Clave": "C-005",
    "ID Actividad": "A-005",
    "Ventas cajas físicas (sin rep)": "1.234"
  });
  assert.strictEqual(numericText["Ventas cajas físicas (sin rep)"], 1234);
  assert.strictEqual(numericText.estadoInformacionVenta, "CON_VENTA");
  assert.strictEqual(normalize({ "Objetivo mes ": "1.500" })["Objetivo mes "], 1500);
  assert.strictEqual(normalize({ "Objetivo mes ": "1.500,50" })["Objetivo mes "], 1500.5);
  assert.strictEqual(normalize({ "Objetivo mes ": 1500 })["Objetivo mes "], 1500);
  assert.strictEqual(normalize({ "Objetivo mes ": 0 })["Objetivo mes "], 0);
  assert.strictEqual(normalize({ "Objetivo mes ": "" })["Objetivo mes "], null);
  assert.strictEqual(normalize({ "Objetivo mes ": " 1.500 " })["Objetivo mes "], 1500);
  assert.strictEqual(normalize({ "Objetivo mes ": "\u00a01.500\u00a0" })["Objetivo mes "], 1500);
  assert.strictEqual(normalize({ "Objetivo mes ": "-" })["Objetivo mes "], null);
  assert.strictEqual(
    app.getHeaderIndex(app.buildHeaderMap(["Categoria AS400 de la venta"]), "Categoría AS400 de la venta"),
    0
  );

  const duplicated = normalize({
    "Categoría AS400 de la venta": "Hidratantes",
    "Presentación AS400 de la venta - Texto": "Squash Pet 500x12",
    "Presentación AS400 de la venta - Clave": "P-001",
    "Cliente SAP - Clave": "C-001",
    "ID Actividad": "A-001",
    "Ventas cajas físicas (sin rep)": "0"
  });
  assert.strictEqual(app.countUniquePresentationsWithoutSales([withoutSales, duplicated]), 1);

  const duplicateObjectiveRows = [
    normalizeNoSalesObjective({ objectiveMonth: "1.500", objectiveTotal: "36.000", period: "12" }),
    normalizeNoSalesObjective({ objectiveMonth: "1.500", objectiveTotal: "36.000", period: "12" }),
    normalizeNoSalesObjective({ objectiveMonth: "1.500", objectiveTotal: "36.000", period: "12" })
  ];
  const duplicateObjectiveAnalysis = dashboard.getNoSalesAnalysis(duplicateObjectiveRows);
  assert.strictEqual(duplicateObjectiveAnalysis.presentationCount, 1);
  assert.strictEqual(duplicateObjectiveAnalysis.rows.length, 3);
  assert.strictEqual(duplicateObjectiveAnalysis.uniquePresentations[0]["Objetivo mes "], 1500);
  assert.strictEqual(duplicateObjectiveAnalysis.uniquePresentations[0]["Objetivo cajas total"], 36000);
  assert.strictEqual(duplicateObjectiveAnalysis.uniquePresentations[0].__sourceRowCount, 3);

  const emptyAndValidObjectiveAnalysis = dashboard.getNoSalesAnalysis([
    normalizeNoSalesObjective({ objectiveMonth: "", objectiveTotal: "", period: "12" }),
    normalizeNoSalesObjective({ objectiveMonth: "-", objectiveTotal: "", period: "12" }),
    normalizeNoSalesObjective({ objectiveMonth: "1.500", objectiveTotal: "36.000", period: "12" })
  ]);
  assert.strictEqual(emptyAndValidObjectiveAnalysis.presentationCount, 1);
  assert.strictEqual(emptyAndValidObjectiveAnalysis.uniquePresentations[0]["Objetivo mes "], 1500);

  const conflictingObjectiveAnalysis = dashboard.getNoSalesAnalysis([
    normalizeNoSalesObjective({ objectiveMonth: "1.500", presentationCode: "P-CONFLICT", period: "12" }),
    normalizeNoSalesObjective({ objectiveMonth: "1.800", presentationCode: "P-CONFLICT", period: "12" })
  ]);
  assert.strictEqual(conflictingObjectiveAnalysis.presentationCount, 1);
  assert.strictEqual(conflictingObjectiveAnalysis.uniquePresentations[0]["Objetivo mes "], null);
  assert.strictEqual(conflictingObjectiveAnalysis.uniquePresentations[0].__monthlyTargetConflict, true);
  assert.deepStrictEqual(plain(conflictingObjectiveAnalysis.uniquePresentations[0].__monthlyTargetValues), [1500, 1800]);

  const samePresentationDifferentActivities = dashboard.getNoSalesAnalysis([
    normalizeNoSalesObjective({ activityId: "A-100", presentationCode: "P-SAME" }),
    normalizeNoSalesObjective({ activityId: "A-101", presentationCode: "P-SAME" })
  ]);
  assert.strictEqual(samePresentationDifferentActivities.presentationCount, 2);
  const samePresentationDifferentClients = dashboard.getNoSalesAnalysis([
    normalizeNoSalesObjective({ clientId: "C-100", presentationCode: "P-SAME" }),
    normalizeNoSalesObjective({ clientId: "C-101", presentationCode: "P-SAME" })
  ]);
  assert.strictEqual(samePresentationDifferentClients.presentationCount, 2);

  const validCustomerRows = [withoutSales, withoutSalesSameClient, duplicated, zeroSale, withSale];
  const filteredByClient = dashboard.applyFilters(validCustomerRows, { "Cliente SAP - Clave": "C-001" });
  const noSalesByClient = dashboard.getNoSalesAnalysis(filteredByClient);
  assert.strictEqual(noSalesByClient.rows.length, 3);
  assert.strictEqual(noSalesByClient.presentationCount, 2);
  assert.strictEqual(noSalesByClient.uniquePresentations.length, 2);
  assert.strictEqual(noSalesByClient.activityCount, 2);
  assert.strictEqual(noSalesByClient.clientCount, 1);
  assert.strictEqual(dashboard.computeKpis(filteredByClient, noSalesByClient).presentationsWithoutSales, 2);
  assert.strictEqual(sumChartValues(noSalesByClient.byCategory), noSalesByClient.presentationCount);
  assert.deepStrictEqual(plain(noSalesByClient.byCategory), [
    { label: "Hidratantes", value: 1 },
    { label: "Gaseosa", value: 1 }
  ]);
  assert.strictEqual(noSalesByClient.uniquePresentations.length, noSalesByClient.presentationCount);

  const positiveKpi = dashboard.computeKpis([
    normalizeKpiRow({ sales: "120", objectiveMonth: "100", yearMonth: "202607" })
  ]);
  assert.strictEqual(positiveKpi.objectiveDifference, 20);
  assert.strictEqual(dashboard.getObjectiveDifferenceState(positiveKpi.objectiveDifference).label, "Por encima del objetivo");
  assert.strictEqual(dashboard.formatSignedNumber(positiveKpi.objectiveDifference), "+20");

  const negativeKpi = dashboard.computeKpis([
    normalizeKpiRow({ sales: "80", objectiveMonth: "100", yearMonth: "202607" })
  ]);
  assert.strictEqual(negativeKpi.objectiveDifference, -20);
  assert.strictEqual(dashboard.getObjectiveDifferenceState(negativeKpi.objectiveDifference).label, "Por debajo del objetivo");
  assert.strictEqual(dashboard.formatSignedNumber(negativeKpi.objectiveDifference), "-20");

  const neutralKpi = dashboard.computeKpis([
    normalizeKpiRow({ sales: "100", objectiveMonth: "100", yearMonth: "202607" })
  ]);
  assert.strictEqual(neutralKpi.objectiveDifference, 0);
  assert.strictEqual(dashboard.getObjectiveDifferenceState(neutralKpi.objectiveDifference).label, "En objetivo");

  const december = normalize({
    "Año": "2025", "Mes": "DIC", "Año Mes": "12.2025", "Cliente SAP - Clave": "C-TIME",
    "Presentación AS400 de la venta - Clave": "P-TIME-1", "ID Actividad": "A-TIME", "TotalVentaMes": "90"
  });
  const january = normalize({
    "Año": "2026", "Mes": "ENE", "Año Mes": "1.2026", "Cliente SAP - Clave": "C-TIME",
    "Presentación AS400 de la venta - Clave": "P-TIME-2", "ID Actividad": "A-TIME", "TotalVentaMes": "110"
  });
  assert.strictEqual(december.__periodKey, 202512);
  assert.strictEqual(january.__periodKey, 202601);
  assert.strictEqual(app.getLatestYearMonthRows([january, december])[0].__periodKey, 202601);
  assert.deepStrictEqual(plain(dashboard.salesByCanonicalPeriod([january, december]).map((item) => item.label)), ["DIC 2025", "ENE 2026"]);

  const repeatedMonthlyTotal = [
    normalizeKpiRow({ clientId: "C-DEDUP", presentationCode: "P-0", sales: "0", objectiveMonth: "100" }),
    normalizeKpiRow({ clientId: "C-DEDUP", presentationCode: "P-1", sales: "279", objectiveMonth: "100" }),
    normalizeKpiRow({ clientId: "C-DEDUP", presentationCode: "P-2", sales: "279", objectiveMonth: "100" })
  ];
  const deduplicatedKpi = dashboard.computeKpis(repeatedMonthlyTotal);
  assert.strictEqual(deduplicatedKpi.salesMonth, 279);
  assert.deepStrictEqual(plain(deduplicatedKpi.salesResolution[0].sourceValues), [0, 279]);

  const conflictingSales = dashboard.computeKpis([
    normalizeKpiRow({ clientId: "C-CONFLICT", presentationCode: "P-C1", sales: "200" }),
    normalizeKpiRow({ clientId: "C-CONFLICT", presentationCode: "P-C2", sales: "300" })
  ]);
  assert.strictEqual(conflictingSales.salesMonth, null);
  assert.strictEqual(conflictingSales.salesResolution[0].status, "CONFLICTO");

  const objectiveOncePerActivity = dashboard.computeKpis([
    normalizeKpiRow({ clientId: "C-OBJ-KPI", activityId: "A-1", presentationCode: "P-O1", sales: "120", objectiveMonth: "1500" }),
    normalizeKpiRow({ clientId: "C-OBJ-KPI", activityId: "A-2", presentationCode: "P-O2", sales: "120", objectiveMonth: "1500" })
  ]);
  assert.strictEqual(objectiveOncePerActivity.objective, 3000);
  assert.strictEqual(objectiveOncePerActivity.performanceConsistency.consistent, true);
  assert.strictEqual(app.computeKpis([
    normalizeKpiRow({ clientId: "C-APP", activityId: "A-APP", sales: "80", objectiveMonth: "100" })
  ]).performanceConsistency.consistent, true);

  const conflictingObjective = dashboard.computeKpis([
    normalizeKpiRow({ clientId: "C-OBJ-C", activityId: "A-1", presentationCode: "P-OC1", sales: "120", objectiveMonth: "1500" }),
    normalizeKpiRow({ clientId: "C-OBJ-C", activityId: "A-1", presentationCode: "P-OC2", sales: "120", objectiveMonth: "1800" })
  ]);
  assert.strictEqual(conflictingObjective.objective, null);
  assert.strictEqual(conflictingObjective.activityAnalytics.objectivesByActivity[0].objectiveStatus, "OBJETIVO_CONFLICTIVO");
  assert.strictEqual(conflictingObjective.compliance, null);
  assert.strictEqual(conflictingObjective.objectiveDifference, null);

  const zeroObjective = dashboard.computeKpis([
    normalizeKpiRow({ clientId: "C-ZERO", sales: "10", objectiveMonth: "0" })
  ]);
  assert.strictEqual(zeroObjective.compliance, null);
  assert.strictEqual(zeroObjective.complianceStatus, "OBJETIVO_CERO");
  assert.strictEqual(dashboard.getComplianceState(1).className, "kpi-positive");
  assert.strictEqual(dashboard.getComplianceState(0.95).className, "kpi-attention");
  assert.strictEqual(dashboard.getComplianceState(0.89).className, "kpi-negative");
  assert.strictEqual(dashboard.getObjectiveDifferenceState(null).label, "Objetivo no comparable");

  const singleDimensionRows = [normalizeKpiRow({ clientId: "C-ONE", region: "Centro Sur", sales: "10" })];
  const singleAnalysis = dashboard.buildDashboardAnalyses(singleDimensionRows);
  const singleChartRules = Object.fromEntries(dashboard.getChartRegistry().map((definition) => [definition.id, definition.shouldRender(singleAnalysis)]));
  assert.strictEqual(singleChartRules.regions, false);
  assert.strictEqual(singleChartRules.clients, false);
  assert.strictEqual(singleChartRules.channels, false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(singleChartRules, "salesTrend"), false);
  assert.strictEqual(dashboard.getAvailableFilterConfigs(singleDimensionRows).length, 0);

  const variedRows = [
    normalizeKpiRow({ clientId: "C-A", region: "Costa", presentationCode: "P-A", sales: "10" }),
    normalizeKpiRow({ clientId: "C-B", region: "Centro Sur", presentationCode: "P-B", sales: "20" })
  ];
  const variedAnalysis = dashboard.buildDashboardAnalyses(variedRows);
  const variedChartRules = Object.fromEntries(dashboard.getChartRegistry().map((definition) => [definition.id, definition.shouldRender(variedAnalysis)]));
  assert.strictEqual(variedChartRules.regions, true);
  assert.strictEqual(variedChartRules.clients, true);
  assert(dashboard.getAvailableFilterConfigs(variedRows).some((config) => config.item.field === "Región SAP"));

  const sharedActivityRows = [
    normalizeActivityRow({ activityId: "A-SHARED", clientId: "C-A", clientName: "Cliente A", presentationCode: "P-SA", totalSales: "4000", objectiveMonth: "10000" }),
    normalizeActivityRow({ activityId: "A-SHARED", clientId: "C-B", clientName: "Cliente B", presentationCode: "P-SB", totalSales: "3500", objectiveMonth: "10000" }),
    normalizeActivityRow({ activityId: "A-SHARED", clientId: "C-C", clientName: "Cliente C", presentationCode: "P-SC", totalSales: "2000", objectiveMonth: "10000" })
  ];
  const sharedAnalytics = dashboard.buildActivityAnalytics(sharedActivityRows);
  const appSharedAnalytics = app.buildActivityAnalytics(sharedActivityRows);
  const sharedPerformance = sharedAnalytics.activityPerformance[0];
  assert.strictEqual(appSharedAnalytics.activityPerformance[0].totalSales, 9500);
  assert.strictEqual(sharedAnalytics.summary.sharedActivityCount, 1);
  assert.strictEqual(sharedPerformance.isSharedActivity, true);
  assert.strictEqual(sharedPerformance.associatedClientCount, 3);
  assert.strictEqual(sharedPerformance.objectiveMonthly, 10000);
  assert.strictEqual(sharedPerformance.totalSales, 9500);
  assert.strictEqual(sharedPerformance.achievement, 0.95);
  assert.strictEqual(sharedPerformance.gap, -500);
  assert.strictEqual(sharedPerformance.status, "OK");
  assert(Math.abs(sharedPerformance.contributionRows.reduce((sum, row) => sum + row.share, 0) - 1) < 1e-12);
  assert.deepStrictEqual(plain(sharedPerformance.contributionRows.map((row) => [row.clientId, row.sales, row.rank])), [
    ["C-A", 4000, 1], ["C-B", 3500, 2], ["C-C", 2000, 3]
  ]);

  const individualAnalytics = dashboard.buildActivityAnalytics([
    normalizeActivityRow({ activityId: "A-ONE", clientId: "C-ONE", totalSales: "80", objectiveMonth: "100" })
  ]);
  assert.strictEqual(individualAnalytics.summary.individualActivityCount, 1);
  assert.strictEqual(individualAnalytics.activityPerformance[0].isSharedActivity, false);
  assert.strictEqual(individualAnalytics.activityPerformance[0].achievement, 0.8);

  const multiActivityRows = [
    normalizeActivityRow({ activityId: "A-M1", clientId: "C-MULTI", presentationCode: "P-M1", totalSales: "100", physicalSales: "60", objectiveMonth: "100" }),
    normalizeActivityRow({ activityId: "A-M2", clientId: "C-MULTI", presentationCode: "P-M2", totalSales: "100", physicalSales: "40", objectiveMonth: "200" })
  ];
  const multiActivityAnalytics = dashboard.buildActivityAnalytics(multiActivityRows);
  const multiPerformance = multiActivityAnalytics.activityPerformance.sort((a, b) => a.activityId.localeCompare(b.activityId));
  assert.strictEqual(multiActivityAnalytics.summary.multipleActivityClientPeriods, 1);
  assert.deepStrictEqual(plain(multiPerformance.map((item) => item.totalSales)), [60, 40]);
  assert(multiPerformance.every((item) => item.contributionRows[0].source === "VENTAS_FISICAS_ACTIVIDAD"));
  assert.strictEqual(multiPerformance.reduce((sum, item) => sum + item.totalSales, 0), 100);
  const multiAggregate = dashboard.aggregateActivityPerformance(multiPerformance);
  assert.strictEqual(multiAggregate.objective, 300);
  assert.strictEqual(multiAggregate.sales, 100);
  assert.strictEqual(multiAggregate.achievement, 1 / 3);
  assert.notStrictEqual(multiAggregate.achievement, (0.6 + 0.2) / 2);
  const multiSelectionAnalysis = dashboard.buildDashboardAnalyses(multiActivityRows, dashboard.getNoSalesAnalysis(multiActivityRows), {
    scopeRows: multiActivityRows,
    filters: { "ID Actividad": ["A-M1", "A-M2"] }
  });
  assert.strictEqual(multiSelectionAnalysis.kpis.mode, "ACTIVITY_AGGREGATE");
  assert.strictEqual(multiSelectionAnalysis.kpis.compliance, 1 / 3);
  const multiSelectionModel = dashboard.buildContextualKpiModel(multiSelectionAnalysis, { "ID Actividad": ["A-M1", "A-M2"] });
  assert.strictEqual(multiSelectionModel.contextType, "MULTIPLE_ACTIVITIES");
  assert.strictEqual(multiSelectionModel.items.find((item) => item.id === "aggregateObjective").value, "300");
  assert.strictEqual(multiSelectionModel.items.find((item) => item.id === "aggregateDifference").value, "-200");
  assert(!multiSelectionModel.items.some((item) => /Contribución|Posición/.test(item.title)));
  assert(!multiSelectionModel.items.some((item) => item.id === "comparableActivities" || item.id === "analyticalCoverage"));
  assert(multiSelectionModel.items.find((item) => item.id === "comparableSales").description.includes("Cobertura: 2 de 2 actividades"));
  const globalMultiAnalysis = dashboard.buildDashboardAnalyses(multiActivityRows, dashboard.getNoSalesAnalysis(multiActivityRows), { scopeRows: multiActivityRows, filters: {} });
  const globalMultiModel = dashboard.buildContextualKpiModel(globalMultiAnalysis, {});
  assert.strictEqual(globalMultiModel.contextType, "GLOBAL");
  assert.deepStrictEqual(plain(globalMultiModel.items.map((item) => item.id)), [
    "periodSales", "latestSales", "comparableSales", "monthlyObjectives", "activityCompliance", "objectiveDifference", "withoutSales", "activeNegotiations"
  ]);
  assert.strictEqual(globalMultiModel.items.find((item) => item.id === "comparableSales").value, "100");
  assert.strictEqual(globalMultiModel.items.find((item) => item.id === "monthlyObjectives").value, "300");
  assert(globalMultiModel.items.find((item) => item.id === "periodSales").description.toLocaleLowerCase("es-CO").includes("venta general"));
  assert(globalMultiModel.items.find((item) => item.id === "activityCompliance").description.includes("Cobertura: 2 de 2 actividades"));
  assert(!globalMultiModel.items.some((item) => item.id === "comparableActivities"));
  const consistentPerformance = dashboard.reconcileComparablePerformance({ comparableSales: 100, comparableObjective: 300, compliance: 1 / 3, objectiveDifference: -200 });
  assert.strictEqual(consistentPerformance.consistent, true);
  assert.strictEqual(dashboard.reconcileComparablePerformance({ comparableSales: 100, comparableObjective: 300, compliance: 0.5, objectiveDifference: -200 }).complianceConsistent, false);
  assert.strictEqual(dashboard.reconcileComparablePerformance({ comparableSales: 10, comparableObjective: 0, compliance: null, objectiveDifference: null }).comparable, false);

  const granularConflictAnalytics = dashboard.buildActivityAnalytics([
    normalizeActivityRow({ activityId: "A-GC-1", clientId: "C-GC", presentationCode: "P-GC", totalSales: "100", physicalSales: "60", objectiveMonth: "100" }),
    normalizeActivityRow({ activityId: "A-GC-1", clientId: "C-GC", presentationCode: "P-GC", totalSales: "100", physicalSales: "70", objectiveMonth: "100" }),
    normalizeActivityRow({ activityId: "A-GC-2", clientId: "C-GC", presentationCode: "P-GC-2", totalSales: "100", physicalSales: "40", objectiveMonth: "100" })
  ]);
  assert(granularConflictAnalytics.activityPerformance.some((item) => item.status === "VENTA_CONFLICTIVA"));

  const ambiguousRows = [
    normalizeActivityRow({ activityId: "A-AMB-1", clientId: "C-AMB", presentationCode: "P-AMB-1", totalSales: "100", physicalSales: "60", objectiveMonth: "100" }),
    normalizeActivityRow({ activityId: "A-AMB-2", clientId: "C-AMB", presentationCode: "P-AMB-2", totalSales: "0", physicalSales: "0", objectiveMonth: "100", year: "", month: "", yearMonth: "" })
  ];
  const ambiguousAnalytics = dashboard.buildActivityAnalytics(ambiguousRows);
  const ambiguousPerformance = ambiguousAnalytics.activityPerformance.find((item) => item.activityId === "A-AMB-2");
  assert.strictEqual(ambiguousPerformance.status, "VENTA_ACTIVIDAD_AMBIGUA");
  assert.strictEqual(ambiguousPerformance.totalSales, null);
  assert.strictEqual(ambiguousPerformance.achievement, null);
  assert.strictEqual(ambiguousAnalytics.summary.ambiguousActivityPeriods, 1);

  const objectiveConflictAnalytics = dashboard.buildActivityAnalytics([
    normalizeActivityRow({ activityId: "A-OBJ-CONFLICT", clientId: "C-OC", presentationCode: "P-OC-1", totalSales: "10", objectiveMonth: "100" }),
    normalizeActivityRow({ activityId: "A-OBJ-CONFLICT", clientId: "C-OC", presentationCode: "P-OC-2", totalSales: "10", objectiveMonth: "120" })
  ]);
  assert.strictEqual(objectiveConflictAnalytics.objectivesByActivity[0].objectiveStatus, "OBJETIVO_CONFLICTIVO");
  assert.strictEqual(objectiveConflictAnalytics.activityPerformance[0].status, "OBJETIVO_CONFLICTIVO");
  const withoutObjectiveAnalytics = dashboard.buildActivityAnalytics([
    normalizeActivityRow({ activityId: "A-NO-OBJ", clientId: "C-NO-OBJ", totalSales: "10", objectiveMonth: "" })
  ]);
  assert.strictEqual(withoutObjectiveAnalytics.activityPerformance[0].status, "SIN_OBJETIVO");

  const dateConflictAnalytics = dashboard.buildActivityAnalytics([
    normalizeActivityRow({ activityId: "A-DATE", clientId: "C-DATE", presentationCode: "P-D1", totalSales: "10", startDate: "2026-01-01", endDate: "2026-12-31" }),
    normalizeActivityRow({ activityId: "A-DATE", clientId: "C-DATE", presentationCode: "P-D2", totalSales: "10", startDate: "2026-02-01", endDate: "2026-12-31" })
  ]);
  assert.strictEqual(dateConflictAnalytics.objectivesByActivity[0].dateStatus, "FECHAS_CONFLICTIVAS");
  assert.strictEqual(dateConflictAnalytics.activityPerformance[0].status, "FECHAS_CONFLICTIVAS");
  assert.strictEqual(dashboard.isActivityActiveInPeriod({ dateStatus: "OK", startDate: "2026-07-15", endDate: "2026-08-10" }, 202607), true);
  assert.strictEqual(dashboard.isActivityActiveInPeriod({ dateStatus: "OK", startDate: "2026-08-01", endDate: "2026-12-31" }, 202607), false);

  const clientRows = sharedActivityRows.filter((row) => row["Cliente SAP - Clave"] === "C-A");
  const clientAnalysis = dashboard.buildDashboardAnalyses(clientRows, dashboard.getNoSalesAnalysis(clientRows), {
    scopeRows: sharedActivityRows,
    filters: { "Cliente SAP - Clave": "C-A" }
  });
  assert.strictEqual(clientAnalysis.kpis.mode, "CLIENT_ACTIVITY");
  assert.strictEqual(clientAnalysis.kpis.selectedContributionSales, 4000);
  assert.strictEqual(clientAnalysis.kpis.relevantJointSales, 9500);
  assert.strictEqual(clientAnalysis.kpis.selectionContribution, 4000 / 9500);
  const clientKpiElement = makeElement();
  withDashboardElement("kpis", clientKpiElement, () => dashboard.renderKpis(clientRows, dashboard.getNoSalesAnalysis(clientRows), clientAnalysis));
  assert(/Contribuci.*n a la actividad/.test(clientKpiElement.innerHTML));
  assert(clientKpiElement.innerHTML.includes("Objetivo mensual de la actividad"));
  assert(clientKpiElement.innerHTML.includes("Cumplimiento de la actividad compartida"));
  assert(clientKpiElement.innerHTML.includes("Posición del cliente por aporte"));
  assert(!clientKpiElement.innerHTML.includes("Cumplimiento del cliente"));
  assert(!clientKpiElement.innerHTML.includes("Objetivo del cliente"));

  const sharedActivitySelectionAnalysis = dashboard.buildDashboardAnalyses(sharedActivityRows, dashboard.getNoSalesAnalysis(sharedActivityRows), {
    scopeRows: sharedActivityRows,
    filters: { "ID Actividad": "A-SHARED" }
  });
  const sharedActivityModel = dashboard.buildContextualKpiModel(sharedActivitySelectionAnalysis, { "ID Actividad": "A-SHARED" });
  assert.strictEqual(sharedActivityModel.contextType, "SINGLE_SHARED_ACTIVITY");
  assert.deepStrictEqual(plain(sharedActivityModel.items.map((item) => item.id)), [
    "activitySales", "activityObjective", "activityCompliance", "activityDifference",
    "associatedClients", "negotiatedPresentations", "activityStatus", "activityValidity"
  ]);
  assert(sharedActivityModel.items.every((item) => dashboard.resolveKpiIcon(item.icon) === item.icon));

  const individualRows = [
    normalizeActivityRow({ activityId: "A-ONE", clientId: "C-ONE", totalSales: "80", objectiveMonth: "100" })
  ];
  const individualActivityAnalysis = dashboard.buildDashboardAnalyses(individualRows, dashboard.getNoSalesAnalysis(individualRows), {
    scopeRows: individualRows,
    filters: { "ID Actividad": "A-ONE" }
  });
  const individualActivityModel = dashboard.buildContextualKpiModel(individualActivityAnalysis, { "ID Actividad": "A-ONE" });
  assert.strictEqual(individualActivityModel.contextType, "SINGLE_INDIVIDUAL_ACTIVITY");
  assert(individualActivityModel.items.some((item) => item.title === "Objetivo mensual de la actividad" && item.value === "100"));
  assert(!individualActivityModel.items.some((item) => /Contribución|Posición/.test(item.title)));
  assert(!individualActivityModel.items.some((item) => item.value === "100 %" || /1\.º de 1/.test(item.value)));
  assert.strictEqual(individualActivityModel.items.filter((item) => /Ventas/.test(item.title)).length, 1);

  const individualClientAnalysis = dashboard.buildDashboardAnalyses(individualRows, dashboard.getNoSalesAnalysis(individualRows), {
    scopeRows: individualRows,
    filters: { "Cliente SAP - Clave": "C-ONE" }
  });
  const individualClientModel = dashboard.buildContextualKpiModel(individualClientAnalysis, { "Cliente SAP - Clave": "C-ONE" });
  assert.strictEqual(individualClientModel.contextType, "SINGLE_CLIENT_INDIVIDUAL_ACTIVITY");
  assert.strictEqual(individualClientModel.items[0].title, "Ventas del cliente");
  assert(individualClientModel.items.some((item) => item.title === "Objetivo mensual de la actividad"));
  assert(!individualClientModel.items.some((item) => /Contribución|Posición|Ventas conjuntas|Clientes asociados/.test(item.title)));
  assert.strictEqual(individualClientModel.items.filter((item) => /Ventas del cliente|Ventas de la actividad/.test(item.title)).length, 1);

  const multiClientAnalysis = dashboard.buildDashboardAnalyses(multiActivityRows, dashboard.getNoSalesAnalysis(multiActivityRows), {
    scopeRows: multiActivityRows,
    filters: { "Cliente SAP - Clave": "C-MULTI" }
  });
  const multiClientModel = dashboard.buildContextualKpiModel(multiClientAnalysis, { "Cliente SAP - Clave": "C-MULTI" });
  assert.strictEqual(multiClientModel.contextType, "CLIENT_MULTIPLE_ACTIVITIES");
  assert.strictEqual(multiClientModel.items.find((item) => item.id === "aggregateObjective").value, "300");
  assert.strictEqual(multiClientModel.items.find((item) => item.id === "aggregateCompliance").value, dashboard.formatRatioPercent(1 / 3));
  assert.strictEqual(multiClientModel.items.find((item) => item.id === "aggregateDifference").value, "-200");
  assert(!multiClientModel.items.some((item) => /Contribución|Posición/.test(item.title)));

  const notStartedRows = [
    normalizeActivityRow({ activityId: "A-FUTURE", clientId: "C-FUTURE", totalSales: "25", objectiveMonth: "150", startDate: "2026-08-01", endDate: "2026-12-31" })
  ];
  const notStartedAnalysis = dashboard.buildDashboardAnalyses(notStartedRows, dashboard.getNoSalesAnalysis(notStartedRows), {
    scopeRows: notStartedRows,
    filters: { "ID Actividad": "A-FUTURE" }
  });
  const notStartedModel = dashboard.buildContextualKpiModel(notStartedAnalysis, { "ID Actividad": "A-FUTURE" });
  assert.strictEqual(notStartedModel.context.isActivityNotStarted, true);
  assert.strictEqual(notStartedModel.items.find((item) => item.id === "activityObjective").value, "150");
  assert.strictEqual(notStartedModel.items.find((item) => item.id === "activityCompliance").value, "No disponible");
  assert.strictEqual(notStartedModel.items.find((item) => item.id === "activityDifference").value, "No disponible");
  assert(notStartedModel.items.some((item) => item.title === "Ventas históricas relacionadas"));

  const conflictRows = [
    normalizeActivityRow({ activityId: "A-CONFLICT-KPI", clientId: "C-CONFLICT", presentationCode: "P-C1", totalSales: "10", objectiveMonth: "100" }),
    normalizeActivityRow({ activityId: "A-CONFLICT-KPI", clientId: "C-CONFLICT", presentationCode: "P-C2", totalSales: "10", objectiveMonth: "120" })
  ];
  const conflictAnalysis = dashboard.buildDashboardAnalyses(conflictRows, dashboard.getNoSalesAnalysis(conflictRows), {
    scopeRows: conflictRows,
    filters: { "ID Actividad": "A-CONFLICT-KPI" }
  });
  const conflictModel = dashboard.buildContextualKpiModel(conflictAnalysis, { "ID Actividad": "A-CONFLICT-KPI" });
  assert.strictEqual(conflictModel.items.find((item) => item.id === "activityObjective").value, "Revisar");
  assert.strictEqual(conflictModel.items.find((item) => item.id === "activityCompliance").value, "No disponible");

  const missingObjectiveRows = [
    normalizeActivityRow({ activityId: "A-MISSING-KPI", clientId: "C-MISSING", totalSales: "10", objectiveMonth: "" })
  ];
  const missingObjectiveAnalysis = dashboard.buildDashboardAnalyses(missingObjectiveRows, dashboard.getNoSalesAnalysis(missingObjectiveRows), {
    scopeRows: missingObjectiveRows,
    filters: { "ID Actividad": "A-MISSING-KPI" }
  });
  const missingObjectiveModel = dashboard.buildContextualKpiModel(missingObjectiveAnalysis, { "ID Actividad": "A-MISSING-KPI" });
  assert.strictEqual(missingObjectiveModel.items.find((item) => item.id === "activityObjective").value, "No disponible");
  const missingObjectiveGlobalAnalysis = dashboard.buildDashboardAnalyses(missingObjectiveRows, dashboard.getNoSalesAnalysis(missingObjectiveRows), { scopeRows: missingObjectiveRows, filters: {} });
  const missingObjectiveGlobalModel = dashboard.buildContextualKpiModel(missingObjectiveGlobalAnalysis, {});
  assert.strictEqual(missingObjectiveGlobalModel.items.find((item) => item.id === "comparableSales").value, "No disponible");
  assert.strictEqual(missingObjectiveGlobalModel.items.find((item) => item.id === "monthlyObjectives").value, "No disponible");

  const ambiguousAnalysisForKpi = dashboard.buildDashboardAnalyses(ambiguousRows, dashboard.getNoSalesAnalysis(ambiguousRows), {
    scopeRows: ambiguousRows,
    filters: { "ID Actividad": "A-AMB-2" }
  });
  const ambiguousModel = dashboard.buildContextualKpiModel(ambiguousAnalysisForKpi, { "ID Actividad": "A-AMB-2" });
  assert.strictEqual(ambiguousModel.items.find((item) => item.id === "activityCompliance").value, "No disponible");
  assert.strictEqual(dashboard.resolveKpiIcon("icono-inexistente"), "circle-dot");
  const analysisWithoutRowsAccess = Object.assign({}, individualActivityAnalysis);
  Object.defineProperty(analysisWithoutRowsAccess, "rows", { get() { throw new Error("El selector KPI no debe recorrer filas"); } });
  assert.strictEqual(dashboard.buildContextualKpiModel(analysisWithoutRowsAccess, { "ID Actividad": "A-ONE" }).contextType, "SINGLE_INDIVIDUAL_ACTIVITY");

  const iconFallbackElement = makeElement();
  withDashboardElement("kpis", iconFallbackElement, () => dashboard.renderKpis(individualRows, dashboard.getNoSalesAnalysis(individualRows), individualActivityAnalysis));
  assert(iconFallbackElement.innerHTML.includes("kpi-icon-fallback"));
  assert(!/<span class="kpi-icon">\s*<\/span>/.test(iconFallbackElement.innerHTML));
  assert.strictEqual((iconFallbackElement.innerHTML.match(/data-kpi-id=/g) || []).length, individualActivityModel.items.length);
  const originalLucide = dashboard.window.lucide;
  const scopedIconCalls = [];
  dashboard.window.lucide = { icons: {}, createIcons(options) { scopedIconCalls.push(options); } };
  withDashboardElement("kpis", makeElement(), () => dashboard.renderKpis(individualRows, dashboard.getNoSalesAnalysis(individualRows), individualActivityAnalysis));
  dashboard.window.lucide = originalLucide;
  assert.strictEqual(scopedIconCalls.length, 1);
  assert.strictEqual(scopedIconCalls[0].nameAttr, "data-kpi-icon");
  [
    sharedActivityModel, individualActivityModel, individualClientModel, multiClientModel,
    notStartedModel, conflictModel, missingObjectiveModel, ambiguousModel
  ].forEach((model) => {
    assert(model.items.every((item) => !/NaN|Infinity|undefined|null|\[object Object\]/.test(item.title + item.value + item.description)));
  });

  const selectionRows = sharedActivityRows.filter((row) => ["C-A", "C-B"].includes(row["Cliente SAP - Clave"]));
  const selectionAnalysis = dashboard.buildDashboardAnalyses(selectionRows, dashboard.getNoSalesAnalysis(selectionRows), {
    scopeRows: sharedActivityRows,
    filters: { "Cliente SAP - Clave": ["C-A", "C-B"] }
  });
  assert.strictEqual(selectionAnalysis.kpis.selectedContributionSales, 7500);
  assert.strictEqual(selectionAnalysis.kpis.selectionContribution, 7500 / 9500);

  const activityAnalysis = dashboard.buildDashboardAnalyses(sharedActivityRows, dashboard.getNoSalesAnalysis(sharedActivityRows), {
    scopeRows: sharedActivityRows,
    filters: { "ID Actividad": "A-SHARED" }
  });
  assert.strictEqual(activityAnalysis.kpis.mode, "ACTIVITY");
  const activityKpiElement = makeElement();
  withDashboardElement("kpis", activityKpiElement, () => dashboard.renderKpis(sharedActivityRows, dashboard.getNoSalesAnalysis(sharedActivityRows), activityAnalysis));
  assert(activityKpiElement.innerHTML.includes("Ventas conjuntas de la actividad"));
  assert(activityKpiElement.innerHTML.includes("Objetivo mensual de la actividad"));
  assert(activityKpiElement.innerHTML.includes("Actividad compartida entre 3 clientes"));

  const activityDetailConfig = dashboard.buildActivityContributionConfig(sharedPerformance);
  assert.strictEqual(activityDetailConfig.rows.length, 3);
  assert.strictEqual(activityDetailConfig.compact, true);
  assert(activityDetailConfig.subtitle.includes("COMPARTIDA ENTRE 3 CLIENTES"));
  assert(activityDetailConfig.columns.some((column) => column.id === "share"));
  assert(!activityDetailConfig.columns.some((column) => column.label === "Objetivo del cliente"));
  assert.strictEqual(activityDetailConfig.summary.filter((item) => item.primary).length, 4);
  assert.strictEqual(activityDetailConfig.summary.filter((item) => item.label === "Cumplimiento").length, 1);
  assert.strictEqual(activityDetailConfig.exportFilename, "contribucion_actividad_a_shared.csv");
  const contributionFallback = makeElement();
  withDashboardElement("chartActivityContribution", contributionFallback, () => {
    dashboard.renderChart("chartActivityContribution", "bar", sharedPerformance.contributionRows.map((row) => ({ label: row.clientId, value: row.sales })), false, true, null, {});
  });
  assert(contributionFallback.innerHTML.includes("native-chart"));
  const activityExplorerElements = makeDetailExplorerElements();
  withDashboardElements(activityExplorerElements, () => {
    dashboard.openActivityContributionDetail(sharedPerformance, makeElement(), { selectedClientIds: ["C-A"] });
    assert(activityExplorerElements.detailExplorerTitle.textContent.includes("A-SHARED"));
    assert(activityExplorerElements.detailExplorerSubtitle.textContent.includes("COMPARTIDA ENTRE 3 CLIENTES"));
    assert(activityExplorerElements.detailExplorerSummary.innerHTML.includes("Objetivo mensual"));
    assert(activityExplorerElements.detailExplorerSummary.innerHTML.includes("Ventas conjuntas"));
    assert(activityExplorerElements.detailExplorerSummary.innerHTML.includes("Estado analítico"));
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("Cliente A"));
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("Cliente B"));
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("Cliente C"));
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("Cliente seleccionado"));
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("contribution-share"));
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("Mostrando 3 de 3 clientes"));
    assert(!activityExplorerElements.detailExplorerBody.innerHTML.includes("presentación(es)"));
    let contributionCsv = "";
    let contributionFilename = "";
    const originalDownload = dashboard.downloadCsv;
    dashboard.downloadCsv = (csv, filename) => { contributionCsv = csv; contributionFilename = filename; };
    dashboard.exportDetailExplorerCsv();
    dashboard.downloadCsv = originalDownload;
    assert(contributionCsv.includes("ID Actividad"));
    assert(contributionCsv.includes("Tipo de actividad"));
    assert(contributionCsv.includes("Participación"));
    assert(!contributionCsv.includes("Objetivo mensual"));
    assert(contributionCsv.includes("Cliente A"));
    assert.strictEqual(contributionFilename, "contribucion_actividad_a_shared.csv");
    dashboard.selectDetailExplorerRow("C-A");
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("Volver a contribuciones"));
    assert(activityExplorerElements.detailExplorerBody.innerHTML.includes("Fuente de atribución"));
    dashboard.closeDetailExplorer();
  });

  const appIndexes = app.buildProcessedDataIndexes(sharedActivityRows);
  assert.strictEqual(appIndexes.sourceRows, sharedActivityRows);
  assert.strictEqual(appIndexes.rowsByActivity.get("A-SHARED").length, 3);
  assert.strictEqual(appIndexes.clientsByActivity.get("A-SHARED").size, 3);
  assert.strictEqual(app.initializeProcessedDataIndexes(sharedActivityRows), app.getProcessedDataIndexes());
  const replacementRows = [sharedActivityRows[0]];
  const replacementIndexes = app.initializeProcessedDataIndexes(replacementRows);
  assert.strictEqual(replacementIndexes.sourceRows, replacementRows);
  assert.notStrictEqual(replacementIndexes, appIndexes);
  app.clearProcessedDataIndexes();
  assert.strictEqual(app.getProcessedDataIndexes(), null);
  const indexesBefore = dashboard.getDashboardPerformanceSnapshot().counters.indexesBuilt;
  dashboard.initializeDashboardDataset(sharedActivityRows);
  const indexesAfter = dashboard.getDashboardPerformanceSnapshot().counters.indexesBuilt;
  assert.strictEqual(indexesAfter, indexesBefore + 1);
  const contributionModelsBefore = dashboard.getDashboardPerformanceSnapshot().counters.modalModelsBuilt;
  const cachedContributionA = dashboard.getActivityExplorerConfig(sharedPerformance, ["C-A"]);
  const cachedContributionB = dashboard.getActivityExplorerConfig(sharedPerformance, ["C-A"]);
  assert.strictEqual(cachedContributionA, cachedContributionB);
  assert.strictEqual(dashboard.getDashboardPerformanceSnapshot().counters.modalModelsBuilt, contributionModelsBefore + 1);
  assert.deepStrictEqual(plain(dashboard.normalizeFilterValues([null, "", " ", "A", "A", " B "])), ["A", "B"]);
  assert.deepStrictEqual(plain(dashboard.normalizeFilters({
    "ID Actividad": ["A-SHARED", "", null, "A-SHARED"],
    "Cliente SAP - Clave": [" ", "C-A"],
    desconocido: ["X"]
  })), { "Cliente SAP - Clave": ["C-A"], "ID Actividad": ["A-SHARED"] });
  assert.strictEqual(
    dashboard.areFiltersEqual({ "ID Actividad": ["B", "A"] }, { "ID Actividad": ["A", "B", ""] }),
    true
  );
  assert.strictEqual(
    dashboard.getComboboxSelectionText({ id: "activity", placeholder: "Seleccionar" }, []),
    "Seleccionar"
  );
  assert.strictEqual(
    dashboard.getComboboxSelectionText({ id: "activity", placeholder: "Seleccionar" }, ["947124"]),
    "1 actividad seleccionada"
  );
  assert.strictEqual(
    dashboard.getComboboxSelectionText({ id: "client", placeholder: "Seleccionar" }, ["1", "2"]),
    "2 clientes seleccionados"
  );
  const originalViewportWidth = dashboard.window.innerWidth;
  const originalViewportHeight = dashboard.window.innerHeight;
  dashboard.window.innerWidth = 1024;
  dashboard.window.innerHeight = 768;
  const lowerFilterRoot = {
    getBoundingClientRect() {
      return { left: 720, top: 640, bottom: 684, width: 360 };
    }
  };
  const portalPanel = { style: {}, dataset: {}, scrollHeight: 360 };
  dashboard.positionComboboxPanel(lowerFilterRoot, portalPanel);
  assert.strictEqual(portalPanel.dataset.placement, "top");
  assert.strictEqual(portalPanel.style.top, "272px");
  assert.strictEqual(portalPanel.style.left, "652px");
  assert.strictEqual(portalPanel.style.width, "360px");
  dashboard.window.innerWidth = originalViewportWidth;
  dashboard.window.innerHeight = originalViewportHeight;
  const activityComboboxShell = dashboard.buildMultiSelectComboboxShell({
    id: "activity", field: "ID Actividad", label: "Actividad", placeholder: "Seleccionar actividad(es)", searchPlaceholder: "Buscar actividad"
  });
  assert(activityComboboxShell.includes('role="combobox"'));
  assert(activityComboboxShell.includes('aria-expanded="false"'));
  assert(activityComboboxShell.includes('aria-controls="activityFilterListbox"'));
  assert(activityComboboxShell.includes('role="listbox"'));
  assert(activityComboboxShell.includes('aria-multiselectable="true"'));
  assert(!activityComboboxShell.includes("<select"));
  const otherFacetRow = normalizeActivityRow({ activityId: "A-OTHER", clientId: "C-X", clientName: "Cliente X", totalSales: "30", objectiveMonth: "50" });
  otherFacetRow["Región SAP"] = "Costa";
  const facetRows = sharedActivityRows.concat(otherFacetRow);
  dashboard.initializeDashboardDataset(facetRows);
  const indexesBeforeFacets = dashboard.getDashboardPerformanceSnapshot().counters.indexesBuilt;
  const activityFacets = dashboard.buildFacetedOptions({ "ID Actividad": ["A-SHARED"], "Región SAP": ["Costa"] }, facetRows);
  assert.strictEqual(dashboard.buildFacetedOptions({ "Región SAP": ["Costa"], "ID Actividad": ["A-SHARED"] }, facetRows), activityFacets);
  const activityFacetModels = plain(activityFacets.get("ID Actividad"));
  assert.strictEqual(activityFacetModels.find((item) => item.value === "A-OTHER").available, true);
  assert.strictEqual(activityFacetModels.find((item) => item.value === "A-SHARED").selected, true);
  assert.strictEqual(activityFacetModels.find((item) => item.value === "A-SHARED").available, false);
  const clientFacets = dashboard.buildFacetedOptions({ "Cliente SAP - Clave": ["C-A"], "Región SAP": ["Costa"] }, facetRows);
  const clientFacetModels = plain(clientFacets.get("Cliente SAP - Clave"));
  assert.strictEqual(clientFacetModels.find((item) => item.value === "C-X").available, true);
  assert.strictEqual(clientFacetModels.find((item) => item.value === "C-A").selected, true);
  assert.strictEqual(dashboard.getDashboardPerformanceSnapshot().counters.indexesBuilt, indexesBeforeFacets);
  assert(dashboard.getDashboardPerformanceSnapshot().caches.facets <= 12);
  dashboard.syncFilterControlsFromState({ refreshOptions: true });
  dashboard.setFilterComboboxQuery("activity", "other");
  assert.deepStrictEqual(plain(dashboard.getVisibleComboboxOptions({ id: "activity", field: "ID Actividad" }).map((item) => item.value)), ["A-OTHER"]);
  dashboard.setFilterComboboxQuery("client", "cliente x");
  assert.deepStrictEqual(plain(dashboard.getVisibleComboboxOptions({ id: "client", field: "Cliente SAP - Clave" }).map((item) => item.value)), ["C-X"]);
  dashboard.setFilterComboboxQuery("client", "900001");
  assert(dashboard.getVisibleComboboxOptions({ id: "client", field: "Cliente SAP - Clave" }).some((item) => item.value === "C-X"));
  dashboard.setFilterComboboxQuery("activity", "");
  dashboard.setFilterComboboxQuery("client", "");
  assert.strictEqual(
    dashboard.getFilterSignature({ Canal: ["B", "A"], Cedi: "Norte" }),
    dashboard.getFilterSignature({ Cedi: ["Norte"], Canal: ["A", "B"] })
  );
  const firstFiltered = dashboard.getFilteredRowsCached(sharedActivityRows, { "Cliente SAP - Clave": ["C-A"] }, "test");
  const secondFiltered = dashboard.getFilteredRowsCached(sharedActivityRows, { "Cliente SAP - Clave": ["C-A"] }, "test");
  assert.strictEqual(firstFiltered, secondFiltered);
  assert.strictEqual(firstFiltered.length, 1);
  const lru = dashboard.createLruCache(2);
  lru.set("a", 1); lru.set("b", 2); lru.get("a"); lru.set("c", 3);
  assert.strictEqual(lru.get("b"), undefined);
  assert.strictEqual(lru.size(), 2);
  const originalRequestAnimationFrame = dashboard.window.requestAnimationFrame;
  const originalCancelAnimationFrame = dashboard.window.cancelAnimationFrame;
  const scheduledFrames = [];
  const cancelledFrames = [];
  dashboard.window.requestAnimationFrame = (callback) => {
    scheduledFrames.push(callback);
    return scheduledFrames.length;
  };
  dashboard.window.cancelAnimationFrame = (id) => { cancelledFrames.push(id); };
  const schedulerBefore = dashboard.getDashboardPerformanceSnapshot().counters;
  dashboard.scheduleDashboardRender("test-first");
  dashboard.scheduleDashboardRender("test-second");
  const schedulerAfter = dashboard.getDashboardPerformanceSnapshot().counters;
  assert.strictEqual(scheduledFrames.length, 2);
  assert(cancelledFrames.includes(1));
  assert.strictEqual(schedulerAfter.rendersScheduled, schedulerBefore.rendersScheduled + 2);
  assert.strictEqual(schedulerAfter.rendersCancelled, schedulerBefore.rendersCancelled + 1);
  scheduledFrames[0]();
  dashboard.cancelPendingDashboardRender();
  dashboard.window.requestAnimationFrame = originalRequestAnimationFrame;
  dashboard.window.cancelAnimationFrame = originalCancelAnimationFrame;

  const filterFrames = [];
  const filterCancellations = [];
  dashboard.window.requestAnimationFrame = (callback) => { filterFrames.push(callback); return filterFrames.length; };
  dashboard.window.cancelAnimationFrame = (id) => { filterCancellations.push(id); };
  const filterRenderBefore = dashboard.getDashboardPerformanceSnapshot().counters.rendersScheduled;
  assert.strictEqual(dashboard.updateDashboardFilters({
    "ID Actividad": ["A-SHARED", "", "A-SHARED"],
    "Región SAP": ["Centro Sur"]
  }, { replace: true, reason: "test-central-filter" }), true);
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()), {
    "ID Actividad": ["A-SHARED"],
    "Región SAP": ["Centro Sur"]
  });
  assert.strictEqual(filterFrames.length, 1);
  assert.strictEqual(dashboard.updateDashboardFilters({
    "Región SAP": ["Centro Sur"],
    "ID Actividad": ["A-SHARED"]
  }, { replace: true }), false);
  assert.strictEqual(filterFrames.length, 1);
  const activeFilterElement = makeElement();
  withDashboardElement("activeFilters", activeFilterElement, () => dashboard.renderActiveFilters());
  assert(activeFilterElement.innerHTML.includes("Actividad: A-SHARED"));
  assert(activeFilterElement.innerHTML.includes("Región SAP: Centro Sur"));
  assert(!/Cliente:\s*</.test(activeFilterElement.innerHTML));
  dashboard.updateDashboardFilters({ "ID Actividad": [] }, { reason: "clear-activity-only" });
  dashboard.applyChartFilter("ID Actividad", "A-SHARED");
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()["ID Actividad"]), ["A-SHARED"]);
  assert.strictEqual(dashboard.getComboboxSelectionText({ id: "activity", placeholder: "" }, dashboard.getDashboardFilterState()["ID Actividad"]), "1 actividad seleccionada");
  dashboard.handleActiveFilterClick({
    target: { closest() { return { dataset: { filterChipField: "ID Actividad" } }; } }
  });
  assert.strictEqual(dashboard.getDashboardFilterState()["ID Actividad"], undefined);
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()["Región SAP"]), ["Centro Sur"]);
  dashboard.clearFilters();
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()), {});
  withDashboardElement("activeFilters", activeFilterElement, () => dashboard.renderActiveFilters());
  assert(activeFilterElement.innerHTML.includes("Sin filtros activos"));
  assert(dashboard.getDashboardPerformanceSnapshot().counters.rendersScheduled >= filterRenderBefore + 4);
  dashboard.cancelPendingDashboardRender();
  dashboard.window.requestAnimationFrame = originalRequestAnimationFrame;
  dashboard.window.cancelAnimationFrame = originalCancelAnimationFrame;

  dashboard.syncFilterControlsFromState({ refreshOptions: true });
  const comboboxRoot = {
    dataset: { comboboxId: "activity" },
    querySelector() { return null; }
  };
  const comboboxTrigger = {
    dataset: { filterAction: "toggle-combobox", comboboxId: "activity" },
    closest(selector) { return selector.includes("data-filter-action") ? this : comboboxRoot; }
  };
  let keyboardPrevented = false;
  dashboard.handleFilterPanelKeydown({ target: comboboxTrigger, key: "Enter", preventDefault() { keyboardPrevented = true; } });
  assert.strictEqual(keyboardPrevented, true);
  assert.strictEqual(dashboard.getFilterUiSnapshot().openComboboxId, "activity");
  dashboard.handleFilterPanelKeydown({ target: comboboxTrigger, key: "ArrowDown", preventDefault() {} });
  assert.strictEqual(dashboard.getFilterUiSnapshot().highlighted.activity, 0);
  dashboard.handleFilterPanelKeydown({ target: comboboxTrigger, key: "End", preventDefault() {} });
  assert(dashboard.getFilterUiSnapshot().highlighted.activity >= 0);
  const optionKeyboardFrames = [];
  dashboard.window.requestAnimationFrame = (callback) => { optionKeyboardFrames.push(callback); return optionKeyboardFrames.length; };
  dashboard.window.cancelAnimationFrame = () => {};
  const optionTarget = {
    dataset: { filterAction: "toggle-option", comboboxId: "activity", filterField: "ID Actividad", filterValue: "A-OTHER" },
    closest(selector) { return selector.includes("data-filter-action") ? this : comboboxRoot; }
  };
  dashboard.handleFilterPanelKeydown({ target: optionTarget, key: " ", preventDefault() {} });
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()["ID Actividad"]), ["A-OTHER"]);
  dashboard.setFilterComboboxQuery("activity", "shared");
  dashboard.handleFilterPanelClick({
    target: {
      dataset: { filterAction: "select-visible", comboboxId: "activity" },
      closest() { return this; }
    }
  });
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()["ID Actividad"]), ["A-OTHER", "A-SHARED"]);
  dashboard.handleFilterPanelKeydown({ target: optionTarget, key: "Tab", preventDefault() {} });
  assert.strictEqual(dashboard.getFilterUiSnapshot().openComboboxId, null);
  dashboard.cancelPendingDashboardRender();
  dashboard.window.requestAnimationFrame = originalRequestAnimationFrame;
  dashboard.window.cancelAnimationFrame = originalCancelAnimationFrame;
  dashboard.handleFilterPanelKeydown({ target: comboboxTrigger, key: "Escape", preventDefault() {} });
  assert.strictEqual(dashboard.getFilterUiSnapshot().openComboboxId, null);
  const filterPanelElement = makeElement();
  const filterChipDelegationElement = makeElement();
  withDashboardElements({ filtersGrid: filterPanelElement, activeFilters: filterChipDelegationElement }, () => {
    dashboard.bindFilterPanelEvents();
    const delegatedClicks = filterPanelElement.listenerCount("click");
    const delegatedInputs = filterPanelElement.listenerCount("input");
    dashboard.bindFilterPanelEvents();
    assert.strictEqual(filterPanelElement.listenerCount("click"), delegatedClicks);
    assert.strictEqual(filterPanelElement.listenerCount("input"), delegatedInputs);
    assert.strictEqual(delegatedClicks, 1);
  });
  const comboTriggerNode = makeElement();
  const comboPanelNode = makeElement();
  const comboValueNode = makeElement();
  const comboCountNode = makeElement();
  const comboInputNode = makeElement();
  const comboListNode = makeElement();
  const comboResultsNode = makeElement();
  const comboSelectedNode = makeElement();
  const comboRootNode = {
    querySelector(selector) {
      if (selector.includes("toggle-combobox")) return comboTriggerNode;
      if (selector.includes("data-combobox-panel")) return comboPanelNode;
      if (selector === ".multi-combobox-value") return comboValueNode;
      if (selector === ".multi-combobox-count") return comboCountNode;
      if (selector.includes("search-options")) return comboInputNode;
      if (selector.includes("data-combobox-list")) return comboListNode;
      if (selector.includes("data-filter-results-count")) return comboResultsNode;
      if (selector.includes("data-filter-selected-count")) return comboSelectedNode;
      return null;
    }
  };
  const originalDocumentQuerySelector = dashboard.document.querySelector;
  dashboard.document.querySelector = (selector) => selector.includes('data-combobox-id="activity"') ? comboRootNode : null;
  dashboard.syncMultiSelectCombobox({ id: "activity", field: "ID Actividad", placeholder: "Seleccionar actividad(es)", emptyText: "Sin resultados" });
  assert.strictEqual(comboTriggerNode.getAttribute("aria-expanded"), "false");
  assert(comboValueNode.textContent.includes("actividades seleccionadas"));
  assert(comboCountNode.textContent.includes("seleccionados"));
  assert(comboListNode.innerHTML.includes('role="option"'));
  dashboard.document.querySelector = originalDocumentQuerySelector;

  const pagedActivity = Object.assign({}, sharedPerformance, {
    activityId: "A-PAGED",
    contributionRows: Array.from({ length: 30 }, (_, index) => ({
      clientId: "C-" + index,
      clientName: "Cliente " + index,
      sales: 30 - index,
      share: (30 - index) / 465,
      rank: index + 1,
      presentationCount: 1,
      source: "CLIENT_PERIOD",
      status: "OK"
    }))
  });
  const pagedExplorerElements = makeDetailExplorerElements();
  withDashboardElements(pagedExplorerElements, () => {
    dashboard.openActivityContributionDetail(pagedActivity, makeElement());
    assert.strictEqual((pagedExplorerElements.detailExplorerBody.innerHTML.match(/<tr/g) || []).length, 26);
    assert.strictEqual((pagedExplorerElements.detailExplorerBody.innerHTML.match(/data-detail-row-key=/g) || []).length, 25);
    assert(pagedExplorerElements.detailExplorerBody.innerHTML.includes("Mostrando 1–25 de 30 clientes"));
    dashboard.closeDetailExplorer();
  });
  assert.strictEqual(dashboard.buildDetailExplorerFooter(1, 1, "cliente", "clientes").includes("1 de 1 cliente"), true);
  assert.strictEqual(dashboard.buildDetailExplorerFooter(2, 2, "cliente", "clientes").includes("2 de 2 clientes"), true);
  const searchExplorerElements = makeDetailExplorerElements();
  withDashboardElements(searchExplorerElements, () => {
    dashboard.openActivityContributionDetail(sharedPerformance, makeElement());
    const originalOrder = plain(dashboard.getDetailExplorerState().allRows.map((row) => row.clientId));
    dashboard.setDetailExplorerQuery("C-B");
    assert(searchExplorerElements.detailExplorerBody.innerHTML.includes("Cliente B"));
    assert(!searchExplorerElements.detailExplorerBody.innerHTML.includes("Cliente A"));
    let searchedCsv = "";
    const originalSearchDownload = dashboard.downloadCsv;
    dashboard.downloadCsv = (csv) => { searchedCsv = csv; };
    dashboard.exportDetailExplorerCsv();
    dashboard.downloadCsv = originalSearchDownload;
    assert(searchedCsv.includes("Cliente B"));
    assert(!searchedCsv.includes("Cliente A"));
    dashboard.setDetailExplorerQuery("cliente c");
    assert(searchExplorerElements.detailExplorerBody.innerHTML.includes("Cliente C"));
    dashboard.setDetailExplorerQuery("sin coincidencias");
    assert(searchExplorerElements.detailExplorerBody.innerHTML.includes("No hay clientes que coincidan"));
    dashboard.setDetailExplorerQuery("");
    dashboard.setDetailExplorerSort("sales", "asc");
    assert.strictEqual(dashboard.getDetailExplorerSortedRows()[0].clientId, "C-C");
    dashboard.setDetailExplorerSort("share", "desc");
    assert.strictEqual(dashboard.getDetailExplorerSortedRows()[0].clientId, "C-A");
    dashboard.setDetailExplorerSort("clientName", "asc");
    assert.strictEqual(dashboard.getDetailExplorerSortedRows()[0].clientName, "Cliente A");
    assert.deepStrictEqual(plain(dashboard.getDetailExplorerState().allRows.map((row) => row.clientId)), originalOrder);
    dashboard.closeDetailExplorer();
  });
  const tiedRows = [{ clientId: "T-1", sales: 50 }, { clientId: "T-2", sales: 50 }];
  dashboard.assignContributionRanks(tiedRows, 100);
  assert.deepStrictEqual(plain(tiedRows.map((row) => [row.rank, row.share])), [[1, 0.5], [1, 0.5]]);

  const originalMatchMediaForModal = dashboard.window.matchMedia;
  dashboard.window.matchMedia = () => ({ matches: true });
  const mobileExplorerElements = makeDetailExplorerElements();
  withDashboardElements(mobileExplorerElements, () => {
    dashboard.openActivityContributionDetail(sharedPerformance, makeElement());
    assert(mobileExplorerElements.detailExplorerBody.innerHTML.includes("detail-card-list"));
    assert(mobileExplorerElements.detailExplorerBody.innerHTML.includes("contribution-card"));
    assert(!mobileExplorerElements.detailExplorerBody.innerHTML.includes("contribution-table"));
    dashboard.closeDetailExplorer();
  });
  dashboard.window.matchMedia = originalMatchMediaForModal;
  const originalDashboardUrl = dashboard.URL;
  const originalDashboardBlob = dashboard.Blob;
  const originalCreateElementForCsv = dashboard.document.createElement;
  const originalBodyForCsv = dashboard.document.body;
  const originalTimeoutForCsv = dashboard.window.setTimeout;
  let revokedCsvUrl = "";
  let clickedCsvLink = false;
  dashboard.URL = { createObjectURL() { return "blob:contribution"; }, revokeObjectURL(url) { revokedCsvUrl = url; } };
  dashboard.Blob = function BlobMock() {};
  dashboard.document.createElement = () => ({ href: "", download: "", click() { clickedCsvLink = true; }, remove() {} });
  dashboard.document.body = { appendChild() {} };
  dashboard.window.setTimeout = (callback) => { callback(); return 1; };
  dashboard.downloadCsv("a,b", "contribucion_actividad_prueba.csv");
  assert.strictEqual(clickedCsvLink, true);
  assert.strictEqual(revokedCsvUrl, "blob:contribution");
  dashboard.URL = originalDashboardUrl;
  dashboard.Blob = originalDashboardBlob;
  dashboard.document.createElement = originalCreateElementForCsv;
  dashboard.document.body = originalBodyForCsv;
  dashboard.window.setTimeout = originalTimeoutForCsv;

  const individualPerformanceForDetail = individualAnalytics.activityPerformance[0];
  const individualContributionRule = dashboard.getChartRegistry().find((definition) => definition.id === "activityContribution");
  assert.strictEqual(individualContributionRule.shouldRender(individualActivityAnalysis), false);
  const individualExplorerElements = makeDetailExplorerElements();
  withDashboardElements(individualExplorerElements, () => {
    dashboard.openActivityContributionDetail(individualPerformanceForDetail, makeElement());
    assert.strictEqual(dashboard.getDetailExplorerState().type, "activityDetail");
    assert(individualExplorerElements.detailExplorerSubtitle.textContent.includes("ACTIVIDAD INDIVIDUAL"));
    assert(individualExplorerElements.detailExplorerBody.innerHTML.includes("Ventas atribuibles"));
    assert(individualExplorerElements.detailExplorerBody.innerHTML.includes("Objetivo mensual de la actividad"));
    assert(!individualExplorerElements.detailExplorerBody.innerHTML.includes("Participación"));
    assert(!individualExplorerElements.detailExplorerBody.innerHTML.includes("Posición"));
    assert(!individualExplorerElements.detailExplorerBody.innerHTML.includes("100 %"));
    assert(!individualExplorerElements.detailExplorerBody.innerHTML.includes("1.º de 1"));
    dashboard.closeDetailExplorer();
  });
  const delegatedExplorerElements = makeDetailExplorerElements();
  withDashboardElements(delegatedExplorerElements, () => {
    dashboard.bindDetailExplorerEvents();
    const clickListeners = delegatedExplorerElements.detailExplorerOverlay.listenerCount("click");
    const inputListeners = delegatedExplorerElements.detailExplorerOverlay.listenerCount("input");
    const wheelListeners = delegatedExplorerElements.detailExplorerOverlay.listenerCount("wheel");
    const touchStartListeners = delegatedExplorerElements.detailExplorerOverlay.listenerCount("touchstart");
    const touchMoveListeners = delegatedExplorerElements.detailExplorerOverlay.listenerCount("touchmove");
    assert.strictEqual(clickListeners, 1);
    assert.strictEqual(wheelListeners, 1);
    assert.strictEqual(touchStartListeners, 1);
    assert.strictEqual(touchMoveListeners, 1);
    dashboard.bindDetailExplorerEvents();
    assert.strictEqual(delegatedExplorerElements.detailExplorerOverlay.listenerCount("click"), clickListeners);
    assert.strictEqual(delegatedExplorerElements.detailExplorerOverlay.listenerCount("input"), inputListeners);
    assert.strictEqual(delegatedExplorerElements.detailExplorerOverlay.listenerCount("wheel"), wheelListeners);
    assert.strictEqual(delegatedExplorerElements.detailExplorerOverlay.listenerCount("touchstart"), touchStartListeners);
    assert.strictEqual(delegatedExplorerElements.detailExplorerOverlay.listenerCount("touchmove"), touchMoveListeners);
  });
  const firstFocusable = makeElement();
  const lastFocusable = makeElement();
  const focusDialog = makeElement();
  focusDialog.querySelectorAll = () => [firstFocusable, lastFocusable];
  withDashboardElement("detailExplorerDialog", focusDialog, () => {
    dashboard.document.activeElement = lastFocusable;
    let prevented = false;
    dashboard.trapDetailExplorerFocus({ shiftKey: false, preventDefault() { prevented = true; } });
    assert.strictEqual(prevented, true);
    assert.strictEqual(firstFocusable.focused, true);
  });

  const chartReuseElement = makeElement();
  const originalReuseEcharts = dashboard.window.echarts;
  let chartInitializations = 0;
  let chartSetOptions = 0;
  let chartDisposals = 0;
  const reusableChart = {
    setOption() { chartSetOptions += 1; },
    off() {},
    on() {},
    dispose() { chartDisposals += 1; },
    resize() {}
  };
  dashboard.window.echarts = { init() { chartInitializations += 1; return reusableChart; } };
  withDashboardElement("chartReuseTest", chartReuseElement, () => {
    dashboard.renderChart("chartReuseTest", "bar", [{ label: "A", value: 1 }], false, false, null, {});
    dashboard.renderChart("chartReuseTest", "bar", [{ label: "A", value: 1 }], false, false, null, {});
    dashboard.renderChart("chartReuseTest", "bar", [{ label: "A", value: 2 }], false, false, null, {});
  });
  assert.strictEqual(chartInitializations, 1);
  assert.strictEqual(chartSetOptions, 2);
  dashboard.disposeChartInstance("chartReuseTest");
  assert.strictEqual(chartDisposals, 1);
  dashboard.window.echarts = originalReuseEcharts;

  const kpiElement = makeElement();
  withDashboardElement("kpis", kpiElement, () => {
    dashboard.renderKpis([normalizeKpiRow({ sales: "120", objectiveMonth: "100", yearMonth: "202607" })]);
  });
  assert(kpiElement.innerHTML.includes("Ventas del período"));
  assert(kpiElement.innerHTML.includes("Diferencia atribuible frente al objetivo"));
  assert(kpiElement.innerHTML.includes("Por encima del objetivo"));
  assert(!kpiElement.innerHTML.includes("Cajas faltantes"));
  assert(!kpiElement.innerHTML.includes("Clientes SAP únicos"));
  assert(!kpiElement.innerHTML.includes("Descuento promedio"));
  assert(!/NaN|Infinity|undefined|null|\[object Object\]/.test(kpiElement.innerHTML));

  assert(dashboard.getSapRegionDepartments("Costa").includes("Atlántico"));
  assert(dashboard.getSapRegionDepartments("Centro Sur").includes("Bogotá D.C."));
  assert.strictEqual(dashboard.normalizeMapName("  BOYACÁ "), "boyaca");
  assert.strictEqual(dashboard.getSapRegionForDepartmentName("ATLANTICO"), "Costa");
  assert.strictEqual(dashboard.getSapRegionForDepartmentName("Archipiélago de San Andrés, Providencia y Santa Catalina"), "Costa");
  assert.strictEqual(dashboard.getSapRegionForDepartmentName("Valle"), "Occidente");

  const regionMapModel = dashboard.buildSapRegionMapModel([
    { label: "Costa", value: 120000 },
    { label: "Antioquia", value: 50000 },
    { label: "Región X", value: 7000 }
  ]);
  const costaZoneData = regionMapModel.zoneData.find((item) => item.sapRegion === "Costa");
  assert(costaZoneData);
  assert.strictEqual(costaZoneData.regionValue, 120000);
  assert.deepStrictEqual(plain(costaZoneData.value.slice(0, 2)), [-74.8, 10.4]);
  assert.strictEqual(costaZoneData.symbolSize, 46);
  assert.strictEqual(costaZoneData.color, dashboard.getSapRegionColor("Costa"));
  assert.strictEqual(regionMapModel.regionTotals.Costa, 120000);
  assert.strictEqual(regionMapModel.rankingItems.find((item) => item.label === "Costa").value, 120000);
  assert.strictEqual(regionMapModel.unmappedRegions[0].label, "Región X");
  assert(dashboard.getColombiaGeoJsonUrl().includes("geoBoundaries-COL-ADM1_simplified.geojson"));
  const regionMapOption = dashboard.buildRegionMapOption(regionMapModel);
  assert(regionMapOption.geo);
  assert.strictEqual(regionMapOption.geo.silent, true);
  assert(!regionMapOption.series.some((serie) => serie.type === "map"));
  assert(regionMapOption.series.some((serie) => serie.type === "scatter"));
  const costaTooltip = regionMapOption.tooltip.formatter({ data: costaZoneData });
  assert(costaTooltip.includes("Región SAP: Costa"));
  assert(costaTooltip.includes("Haz clic para filtrar"));
  assert(!costaTooltip.includes("Departamento"));

  const fakeGeoJson = { type: "FeatureCollection", features: [{ type: "Feature", properties: { name: "Colombia" }, geometry: { type: "Polygon", coordinates: [[[-77, 8], [-70, 8], [-70, 0], [-77, 0], [-77, 8]]] } }] };
  const mapElements = { chartRegion: makeElement(), chartRegionMap: makeElement() };
  const originalEcharts = dashboard.window.echarts;
  let registeredMap = null;
  let mapOption = null;
  let clickEventName = "";
  dashboard.window.echarts = {
    registerMap(name, geoJson) {
      registeredMap = { name, geoJson };
    },
    init() {
      return {
        setOption(option) {
          mapOption = option;
        },
        on(eventName) {
          clickEventName = eventName;
        },
        dispose() {}
      };
    }
  };
  withDashboardElements(mapElements, () => {
    dashboard.renderRegionMapWithGeoJson(mapElements.chartRegion, regionMapModel, fakeGeoJson);
  });
  dashboard.window.echarts = originalEcharts;
  assert.strictEqual(registeredMap.name, "colombiaSapRegions");
  assert.strictEqual(registeredMap.geoJson, fakeGeoJson);
  assert.strictEqual(mapOption.geo.silent, true);
  assert.strictEqual(clickEventName, "click");

  const regionChartElement = makeElement();
  withDashboardElement("chartRegion", regionChartElement, () => {
    dashboard.renderRegionSalesMap([
      normalizeKpiRow({ clientId: "C-REG-1", sales: "120000", yearMonth: "202607", region: "Costa" }),
      normalizeKpiRow({ clientId: "C-REG-2", sales: "50000", yearMonth: "202607", region: "Antioquia" })
    ]);
  });
  assert(regionChartElement.innerHTML.includes("Mapa no disponible"));
  assert(regionChartElement.innerHTML.includes("Ranking por Región SAP"));
  assert(regionChartElement.innerHTML.includes(dashboard.getSapRegionColor("Costa")));
  const costaFilterNode = regionChartElement.__children.find((node) => node.dataset.chartFilterValue === "Costa");
  assert(costaFilterNode, "El fallback debe mantener nodos clicables por Región SAP.");
  assert.strictEqual(costaFilterNode.dataset.chartFilterField, "Región SAP");

  const withoutRegionFilter = dashboard.applyFilters(validCustomerRows, {});
  assert.strictEqual(dashboard.getNoSalesAnalysis(withoutRegionFilter).presentationCount, 2);
  const selectedRegionFilter = dashboard.applyFilters(validCustomerRows, { "Región SAP": "Antioquia" });
  assert.strictEqual(dashboard.getNoSalesAnalysis(selectedRegionFilter).presentationCount, 0);
  assert.strictEqual(dashboard.matchesFilter("", ""), true);
  assert.strictEqual(dashboard.matchesFilter("", "Antioquia"), false);

  const rowsWithMissingCategory = validCustomerRows.concat(withoutSalesWithoutCategory);
  const missingCategoryByClient = dashboard.getNoSalesAnalysis(
    dashboard.applyFilters(rowsWithMissingCategory, { "Cliente SAP - Clave": "C-001" })
  );
  assert.strictEqual(missingCategoryByClient.presentationCount, 3);
  assert.strictEqual(missingCategoryByClient.uniquePresentations.length, 3);
  assert.strictEqual(missingCategoryByClient.presentationsWithoutCategory, 1);
  assert.strictEqual(sumChartValues(missingCategoryByClient.byCategory), 2);
  assert.strictEqual(missingCategoryByClient.uniquePresentations.length, 3);

  const alternateCategoryAnalysis = dashboard.getNoSalesAnalysis([withoutSalesAlternateCategory]);
  assert.strictEqual(alternateCategoryAnalysis.presentationCount, 1);
  assert.strictEqual(alternateCategoryAnalysis.presentationsWithoutCategory, 0);
  assert.deepStrictEqual(plain(alternateCategoryAnalysis.byCategory), [{ label: "Energizantes", value: 1 }]);

  const resolvedCategoryAnalysis = dashboard.getNoSalesAnalysis([
    withoutSalesResolvableCategory,
    relatedPresentationWithCategory
  ]);
  assert.strictEqual(resolvedCategoryAnalysis.presentationCount, 1);
  assert.strictEqual(resolvedCategoryAnalysis.presentationsWithoutCategory, 0);
  assert.deepStrictEqual(plain(resolvedCategoryAnalysis.byCategory), [{ label: "Gaseosa", value: 1 }]);

  const drilldownAnalysis = dashboard.getNoSalesAnalysis([
    withoutSales,
    withoutSalesSameClient,
    withoutSalesGaseosaHighObjective
  ]);
  const explorerElements = makeDetailExplorerElements();
  const opener = makeElement();
  dashboard.document.activeElement = opener;
  withDashboardElements(explorerElements, () => {
    dashboard.openNoSalesCategoryExplorer(opener, null, drilldownAnalysis);
    const categoryState = dashboard.getDetailExplorerState();
    assert.strictEqual(categoryState.type, "noSalesCategories");
    assert.strictEqual(categoryState.allRows.length, 2);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Ver presentaciones"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Porcentaje del total"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Actividades"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Clientes"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Página 1 de 1"));

    dashboard.openNoSalesCategoryDetail("Gaseosa", drilldownAnalysis, opener);

    const explorerState = dashboard.getDetailExplorerState();
    assert.strictEqual(explorerElements.detailExplorerOverlay.hidden, false);
    assert(explorerElements.detailExplorerTitle.textContent.includes("Gaseosa"));
    assert.strictEqual(explorerState.allRows.length, 2);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Manzana Pet 250x12"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Cola Max 400x12"));
    assert(!explorerElements.detailExplorerBody.innerHTML.includes("Squash Pet 500x12"));
    assert.strictEqual(countOccurrences(explorerElements.detailExplorerBody.innerHTML, "<th "), 11);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Motivo"));
    assert(explorerElements.detailExplorerToolbar.innerHTML.includes("Volver a categorías"));

    dashboard.setDetailExplorerQuery("Cola");
    assert.strictEqual(dashboard.getDetailExplorerSortedRows().length, 1);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Cola Max 400x12"));
    assert(!explorerElements.detailExplorerBody.innerHTML.includes("Manzana Pet 250x12"));

    dashboard.setDetailExplorerQuery("");
    dashboard.setDetailExplorerSort("objectiveTotal", "desc");
    assert.strictEqual(dashboard.getDetailExplorerSortedRows()[0]["Presentación AS400 de la venta - Texto"], "Cola Max 400x12");

    const selectedKey = dashboard.getDetailExplorerState().config.rowKey(dashboard.getDetailExplorerSortedRows()[0], 0);
    dashboard.selectDetailExplorerRow(selectedKey);
    assert(dashboard.getDetailExplorerState().selectedRow);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Detalle de presentación"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Objetivo cajas total"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Identificaci"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Objetivos"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Negociaci"));
    assert(!explorerElements.detailExplorerBody.innerHTML.includes("undefined"));
    assert(!explorerElements.detailExplorerBody.innerHTML.includes("NaN"));

    dashboard.handleDetailExplorerClick({
      target: {
        dataset: { detailAction: "back-list" },
        closest() {
          return this;
        }
      }
    });
    assert.strictEqual(dashboard.getDetailExplorerState().selectedRow, null);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Manzana Pet 250x12"));

    dashboard.openNoSalesCategoryDetail("Jugos", drilldownAnalysis, opener);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("No hay presentaciones disponibles"));

    dashboard.openNoSalesCategoryDetail("Gaseosa", drilldownAnalysis, opener);
    let exportedCsv = "";
    const originalDownloadCsv = dashboard.downloadCsv;
    dashboard.downloadCsv = function captureCsv(csv) {
      exportedCsv = csv;
    };
    dashboard.handleDetailExplorerClick({
      target: {
        dataset: { detailAction: "export-csv" },
        closest() {
          return this;
        }
      }
    });
    dashboard.downloadCsv = originalDownloadCsv;
    assert(exportedCsv.includes("Categoría"));
    assert(exportedCsv.includes("Motivo"));
    assert(exportedCsv.includes("Cola Max 400x12"));
    dashboard.handleDetailExplorerDocumentKeydown({
      key: "Escape",
      preventDefault() {}
    });
    assert.strictEqual(explorerElements.detailExplorerOverlay.hidden, true);
    assert(opener.focused);
  });

  assert.strictEqual(dashboard.groupUniqueTotalSalesByField([withoutSales], "Región SAP").length, 0);
  assert.deepStrictEqual(
    plain(dashboard.groupUniqueTotalSalesByField([withoutSales, zeroSale], "Región SAP")),
    []
  );

  const filteredByRegion = dashboard.applyFilters([withoutSales, zeroSale, withSale], { "Región SAP": "Antioquia" });
  assert.strictEqual(dashboard.computeKpis(filteredByRegion).presentationsWithoutSales, 0);

  const filteredByCategory = dashboard.applyFilters([withoutSales, zeroSale, withSale], {
    "Categoría AS400 de la venta": "Hidratantes"
  });
  assert.strictEqual(dashboard.computeKpis(filteredByCategory).presentationsWithoutSales, 1);

  const regionLabels = dashboard.groupUniqueTotalSalesByField([withoutSales, zeroSale, withSale], "Región SAP").map(
    (item) => item.label
  );
  assert(!regionLabels.includes("Sin dato"));

  const html = dashboard.generatedHtml({ rows: [withoutSales, zeroSale, withSale], metadata: {} });
  assert(html.includes("open-no-sales-explorer"));
  assert(html.includes("RESUMEN POR CATEGORÍA"));
  assert(!html.includes("chartSinVentasCategoria"));
  assert(html.includes("detailExplorerOverlay"));
  assert(html.includes('aria-describedby="detailExplorerSubtitle"'));
  assert(!html.includes("withoutSalesTable"));
  assert(!html.includes("Detalle de presentaciones sin ventas"));
  assert(!html.includes('id="detailTable"'));
  assert(!html.includes('id="pageSizeSelect"'));
  assert(!html.includes("Sin dato"));
  assert(html.includes("@media (max-width: 820px)"));
  assert(html.includes("@media (max-width: 560px)"));
  assert(html.includes("@media (max-width: 390px)"));
  assert(html.includes('[data-theme="dark"]'));
  assert(html.includes("grid-template-columns: repeat(12, minmax(0, 1fr))"));
  assert(html.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"));
  assert(html.includes(".kpi-grid { grid-template-columns: 1fr; }"));
  assert(html.includes("kpi-icon-fallback"));
  assert(html.includes("prefers-reduced-motion: reduce"));
  assert(html.includes('{ field: "ID Actividad", label: "Actividad" }'));
  assert(!html.includes("multiple size=\\\"5\\\""));
  assert(html.includes('role=\\\"combobox\\\"'));
  assert(html.includes('aria-multiselectable=\\\"true\\\"'));
  assert(html.includes("Seleccionar actividad(es)"));
  assert(html.includes("Buscar o seleccionar clientes"));
  assert(html.includes(".filter-control-wide { grid-column: span 6; }"));
  assert(html.includes("--content-max-width: 1640px"));
  assert(html.includes(".dashboard-content { width: min(100%, var(--content-max-width))"));
  assert(html.includes(".chart-featured"));
  assert(html.includes(".chart-standard"));
  assert(html.includes(".chart-compact"));
  assert(html.includes(".chart-timeline"));
  assert(html.includes(".empty-state-info"));
  assert(html.includes(".multi-combobox-panel {\n  position: fixed; z-index: 1000;"));
  assert(html.includes("document.body.appendChild(panel)"));
  assert(html.includes("getBoundingClientRect()"));
  assert(html.includes('window.addEventListener("scroll", repositionOpenComboboxPanel, true)'));
  assert(html.includes(".detail-explorer-overlay {"));
  assert(html.includes("z-index: 2000"));
  assert.strictEqual(countOccurrences(html, "echarts@5/dist/echarts.min.js"), 1);
  assert.strictEqual(countOccurrences(html, "unpkg.com/lucide@latest"), 1);
  assert.deepStrictEqual(findDuplicateHtmlIds(html), []);
  const inlineScripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g), (match) => match[1]);
  assert.strictEqual(inlineScripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(inlineScripts[0], { filename: "dashboard-descargado.html" }));

  const templateSource = fs.readFileSync(path.join(ROOT, "dashboard-template.js"), "utf8");
  assert.strictEqual(countOccurrences(templateSource, "function generateDashboardHtml"), 1);
  assert.strictEqual(countOccurrences(templateSource, "function dashboardCss"), 1);
  assert.strictEqual(countOccurrences(templateSource, "function dashboardScript"), 1);
  assert.strictEqual(countOccurrences(templateSource, 'window.addEventListener("resize", debouncedResizeCharts)'), 1);
  assert.strictEqual(countOccurrences(templateSource, 'window.addEventListener("beforeunload", destroyDashboard)'), 1);
  assert(templateSource.includes('if (chart.off) chart.off("click")'));
  assert(templateSource.includes("chartInstances[elementId]"));
  assert(templateSource.includes("function assignAdaptiveChartLayout"));
  assert(templateSource.includes("function assignAdaptiveFilterLayout"));
  assert(templateSource.includes("function getKpiGridLayoutMetadata"));
  assert(!templateSource.includes("body { overflow-x: hidden"));
  assert(!templateSource.includes("dashboard-shell"));
  assert(!templateSource.includes("kpiGrid"));
}

function runClientNegotiationModelTests() {
  const rows = [
    normalizeActivityRow({ activityId: "A-MODEL", clientId: "C-1", yearMonth: "52026", month: "MAY", presentationCode: "P-1", physicalSales: "40", totalSales: "100", objectiveMonth: "50", objectiveTotal: "100", startDate: "2026-05-01", endDate: "2026-06-30" }),
    normalizeActivityRow({ activityId: "A-MODEL", clientId: "C-1", yearMonth: "52026", month: "MAY", presentationCode: "P-2", physicalSales: "5", totalSales: "100", objectiveMonth: "50", objectiveTotal: "100", startDate: "2026-05-01", endDate: "2026-06-30" }),
    normalizeActivityRow({ activityId: "A-MODEL", clientId: "C-1", yearMonth: "62026", month: "JUN", presentationCode: "P-1", physicalSales: "30", totalSales: "120", objectiveMonth: "50", objectiveTotal: "100", startDate: "2026-05-01", endDate: "2026-06-30" }),
    normalizeActivityRow({ activityId: "A-MODEL", clientId: "C-1", yearMonth: "62026", month: "JUN", presentationCode: "P-2", physicalSales: "30", totalSales: "120", objectiveMonth: "50", objectiveTotal: "100", startDate: "2026-05-01", endDate: "2026-06-30" }),
    normalizeActivityRow({ activityId: "A-SHARED", clientId: "C-1", yearMonth: "62026", month: "JUN", presentationCode: "P-S1", physicalSales: "25", totalSales: "120", objectiveMonth: "100", objectiveTotal: "200", startDate: "2026-06-01", endDate: "2026-06-30" }),
    normalizeActivityRow({ activityId: "A-SHARED", clientId: "C-2", yearMonth: "62026", month: "JUN", presentationCode: "P-S2", physicalSales: "75", totalSales: "75", objectiveMonth: "100", objectiveTotal: "200", startDate: "2026-06-01", endDate: "2026-06-30" }),
    normalizeActivityRow({ activityId: "A-NO-PERIOD", clientId: "C-3", year: "", month: "", yearMonth: "", presentationCode: "P-NP", physicalSales: "0", totalSales: "", objectiveMonth: "20", objectiveTotal: "40", startDate: "2026-07-01", endDate: "2026-08-31" }),
    normalizeActivityRow({ activityId: "A-PAST", clientId: "C-4", yearMonth: "52026", month: "MAY", presentationCode: "P-PAST-1", physicalSales: "120", totalSales: "120", objectiveMonth: "100", objectiveTotal: "150", startDate: "2026-05-01", endDate: "2026-06-30" }),
    normalizeActivityRow({ activityId: "A-PAST", clientId: "C-4", yearMonth: "62026", month: "JUN", presentationCode: "P-PAST-2", physicalSales: "80", totalSales: "80", objectiveMonth: "100", objectiveTotal: "150", startDate: "2026-05-01", endDate: "2026-06-30" })
  ];
  rows.slice(0, 4).forEach((row) => {
    row.investmentPercentage = row["% De inversión"] = 0.15;
    row.monthlyDiscountPercentage = row["Porcentaje descuento mes"] = row.periodKey === 202605 ? 0.1 : 0.2;
    row.negotiationDiscountPercentage = row["Porcentaje descuento negociación"] = row.presentationCode === "P-1" ? 0.08 : 0.1;
    row.negotiationPeriod = row["Periodo negociacion"] = 2;
  });
  assert.strictEqual(rows[0].periodKey, 202605);
  assert.strictEqual(rows[0].periodLabel, "MAY 2026");
  assert.strictEqual(rows[2].periodKey, 202606);
  assert.strictEqual(rows[6].periodStatus, "SIN_PERIODO_DE_VENTA");

  const model = app.buildClientNegotiationModels(rows);
  assert.deepStrictEqual(plain(model.availablePeriods.map((period) => period.key)), [202605, 202606]);
  assert(model.summaryTableColumns.some((column) => column.id === "sales_202605" && column.label === "Venta MAY 2026"));
  assert(model.summaryTableColumns.some((column) => column.id === "discount_202606" && column.label === "Dcto. JUN 2026"));
  assert.strictEqual(model.clientActivitySummary.length, 5);
  const individual = model.clientActivitySummary.find((row) => row.clientSap === "C-1" && row.activityId === "A-MODEL");
  assert(individual);
  assert.deepStrictEqual(plain(individual.salesByMonth), { 202605: 100, 202606: 120 });
  assert.deepStrictEqual(plain(individual.attributableSalesByMonth), { 202605: 45, 202606: 60 });
  assert.strictEqual(individual.accumulatedGeneralSales, 220);
  assert.strictEqual(individual.accumulatedAttributableSales, 105);
  assert.strictEqual(individual.totalProgress, 1.05);
  assert.strictEqual(individual.totalDifference, 5);
  assert.deepStrictEqual(plain(individual.monthlyComplianceByMonth), { 202605: 0.9, 202606: 1.2 });
  assert.deepStrictEqual(plain(individual.monthlyStatusByMonth), { 202605: "NO_CUMPLE_MES", 202606: "CUMPLE_MES" });
  assert.strictEqual(individual.selectedStatusPeriod, 202606);
  assert.strictEqual(individual.selectedMonthlyCompliance, 1.2);
  assert.strictEqual(individual.selectedMonthlyStatus, "CUMPLE_MES");
  assert.strictEqual(individual.totalObjectiveStatus, "CUMPLIO_OBJETIVO_TOTAL");
  assert.strictEqual(individual.negotiationType, "INDIVIDUAL");
  assert.strictEqual(individual.investmentPercentage, 0.15);
  assert.strictEqual(individual.negotiationDiscount.status, "VARIOS");
  assert.deepStrictEqual(plain(individual.monthlyDiscountByMonth), { 202605: 0.1, 202606: 0.2 });
  const shared = model.clientActivitySummary.find((row) => row.clientSap === "C-1" && row.activityId === "A-SHARED");
  assert.strictEqual(shared.isSharedActivity, true);
  assert.strictEqual(shared.negotiationType, "COMPARTIDA");
  assert.strictEqual(shared.associatedClientCount, 2);
  assert.strictEqual(shared.jointActivitySalesByMonth[202606], 100);
  assert.strictEqual(shared.monthlyComplianceByMonth[202606], 1);
  assert.strictEqual(shared.monthlyStatusByMonth[202606], "CUMPLE_MES");
  assert.strictEqual(shared.totalProgress, 0.5);
  assert.strictEqual(shared.totalObjectiveStatus, "EN_PROGRESO_OBJETIVO_TOTAL");
  assert.notStrictEqual(shared.monthlyComplianceByMonth[202606], shared.attributableSalesByMonth[202606] / shared.monthlyObjective);
  const noPeriod = model.clientActivitySummary.find((row) => row.activityId === "A-NO-PERIOD");
  assert(noPeriod && noPeriod.selectedMonthlyStatus === "NO_EVALUABLE_MES");
  assert.strictEqual(noPeriod.totalObjectiveStatus, "NO_EVALUABLE_TOTAL");
  assert(noPeriod.warnings.includes("SIN_PERIODO_DE_VENTA"));
  const client = model.clientSummary.find((row) => row.clientSap === "C-1");
  assert.strictEqual(client.activityCount, 2);
  assert.strictEqual(client.accumulatedGeneralSales, 220);
  assert(Math.abs(client.monthlyComplianceByMonth[202606] - 160 / 150) < 1e-12);
  assert.notStrictEqual(client.monthlyComplianceByMonth[202606], (1.2 + 1) / 2);
  const past = model.clientActivitySummary.find((row) => row.activityId === "A-PAST");
  assert.strictEqual(past.monthlyStatusByMonth[202605], "CUMPLE_MES");
  assert.strictEqual(past.monthlyStatusByMonth[202606], "NO_CUMPLE_MES");
  assert.strictEqual(past.totalObjectiveStatus, "CUMPLIO_OBJETIVO_TOTAL");
  const mayModel = app.selectClientNegotiationModelPeriod(model, { filters: { Mes: "MAY", "AÃ±o": "2026" } });
  const mayIndividual = mayModel.clientActivitySummary.find((row) => row.activityId === "A-MODEL");
  assert.strictEqual(mayModel.selectedStatusPeriod, 202605);
  assert.strictEqual(mayIndividual.selectedMonthlyStatus, "NO_CUMPLE_MES");
  assert(mayModel.summaryTableColumns.find((column) => column.id === "selectedMonthlyStatus").label.includes("MAY 2026"));
  assert.strictEqual(model.diagnostics.rowsWithoutPeriod, 1);
  assert.deepStrictEqual(plain(model.diagnostics.monthlyStatusCountsByPeriod[202606]), { label: "JUN 2026", CUMPLE_MES: 3, NO_CUMPLE_MES: 1, NO_EVALUABLE_MES: 1 });
  assert.deepStrictEqual(plain(model.diagnostics.totalObjectiveStatusCounts), { CUMPLIO_OBJETIVO_TOTAL: 2, EN_PROGRESO_OBJETIVO_TOTAL: 2, NO_EVALUABLE_TOTAL: 1 });
  assert.strictEqual(model.summaryTableColumns.length, 17 + model.availablePeriods.length * 4);
  assert(model.summaryTableColumns.some((column) => column.id === "compliance_202605"));
  assert(model.summaryTableColumns.some((column) => column.id === "status_202606"));
  const generated = dashboard.generatedHtml({ rows, metadata: { clientNegotiationModels: model } });
  assert(generated.includes("clientNegotiationModels"));
  assert(!/>\s*(?:NaN|-?Infinity|undefined|\[object Object\])\s*</.test(generated));
  const analyses = dashboard.buildDashboardAnalyses(rows, dashboard.getNoSalesAnalysis(rows), { scopeRows: rows, filters: {}, clientNegotiationModels: model });
  assert.strictEqual(analyses.clientActivitySummary.length, model.clientActivitySummary.length);
  assert.strictEqual(analyses.clientSummary.length, model.clientSummary.length);
  assert.strictEqual(analyses.summaryTableColumns.length, model.summaryTableColumns.length);
  assert.strictEqual(dashboard.resolveClientModelSelectedPeriod(model, { Mes: "MAY" }).key, 202605);
  const mayAnalyses = dashboard.buildDashboardAnalyses(rows, dashboard.getNoSalesAnalysis(rows), { scopeRows: rows, filters: { Mes: "MAY" }, clientNegotiationModels: model });
  assert.strictEqual(mayAnalyses.clientNegotiationModels.selectedStatusPeriod, 202605);
}

function runClientTrackingTableTests() {
  const percentageCases = [["10", 0.1], ["10.00", 0.1], ["10,00", 0.1], ["10%", 0.1], ["10,50%", 0.105], ["0.10", 0.1], [0.10, 0.1], [10, 0.1]];
  percentageCases.forEach(([input, expected]) => assert(Math.abs(app.normalizePercentage(input) - expected) < 1e-12, "Porcentaje inválido: " + input));
  assert.strictEqual(app.normalizePercentage(""), null);
  assert.strictEqual(dashboard.normalizeText(dashboard.formatRatioPercent(app.normalizePercentage("10"))), "10 %");
  assert.strictEqual(dashboard.normalizeText(dashboard.formatRatioPercent(app.normalizePercentage("10.00"))), "10 %");
  assert.strictEqual(dashboard.normalizeText(dashboard.formatRatioPercent(app.normalizePercentage("10,50%"))), "10,5 %");
  assert.strictEqual(dashboard.normalizeText(dashboard.formatRatioPercent(app.normalizePercentage(0.10))), "10 %");
  assert.strictEqual(dashboard.normalizeText(dashboard.formatRatioPercent(app.normalizePercentage(10))), "10 %");
  assert.strictEqual(app.normalizePercentage(app.normalizePercentage("10")), 0.1, "No debe multiplicarse dos veces por 100");
  const variedDiscount = app.buildNegotiationDiscountSummary([{ negotiationDiscountPercentage: 0.1 }, { negotiationDiscountPercentage: 0.125 }]);
  assert.strictEqual(variedDiscount.status, "VARIOS");
  const periods = [{ key: 202605, label: "MAY 2026" }, { key: 202606, label: "JUN 2026" }];
  const base = {
    clientSap: "=C-001", clientName: "Cliente, Uno", clientNit: "900\n123", activityId: "A-001",
    region: "CENTRO", regions: ["CENTRO"], cedi: "CALI", cedis: ["CALI"], channel: "TRADICIONAL", channels: ["TRADICIONAL"],
    category: "GASEOSAS", categories: ["GASEOSAS"], typology: "TIPO A", typologies: ["TIPO A"],
    isSharedActivity: false, negotiationType: "INDIVIDUAL", associatedClientCount: 1,
    monthlyObjective: 100, totalObjective: 200, investmentPercentage: 0.15, negotiationPeriod: 2,
    startDate: "2026-05-01", endDate: "2026-06-30", dateStatus: "OK",
    negotiationDiscount: { status: "UNICO", values: [0.1] }, negotiationDiscountStatus: "UNICO",
    salesByMonth: { 202605: 120, 202606: 140 }, attributableSalesByMonth: { 202605: 90, 202606: 110 }, jointActivitySalesByMonth: {},
    monthlyDiscountByMonth: { 202605: 0.08, 202606: 0.09 }, monthlyDiscountStatusByMonth: { 202605: "OK", 202606: "OK" }, monthlyComplianceByMonth: { 202605: 0.9, 202606: 1.1 },
    monthlyStatusByMonth: { 202605: "NO_CUMPLE_MES", 202606: "CUMPLE_MES" }, selectedMonthlyCompliance: 1.1, selectedMonthlyStatus: "CUMPLE_MES", selectedStatusPeriod: 202606,
    accumulatedGeneralSales: 260, accumulatedAttributableSales: 200, accumulatedComparableSales: 200, totalProgress: 1, totalDifference: 0,
    totalObjectiveStatus: "CUMPLIO_OBJETIVO_TOTAL", warnings: []
  };
  const shared = Object.assign({}, base, {
    clientSap: "C-002", clientName: "Cliente Dos", activityId: "A-002", isSharedActivity: true, negotiationType: "COMPARTIDA", associatedClientCount: 2,
    attributableSalesByMonth: { 202605: 30, 202606: 40 }, jointActivitySalesByMonth: { 202605: 95, 202606: 120 }, accumulatedAttributableSales: 70,
    accumulatedComparableSales: 215, totalProgress: 1.075, totalDifference: 15
  });
  assert(dashboard.clientTrackingRelationMatchesFilters(base, { "Región SAP": ["CENTRO"], Canal: ["TRADICIONAL"], "Categoría AS400 de la venta": ["GASEOSAS"], Cedi: ["CALI"] }));
  assert(!dashboard.clientTrackingRelationMatchesFilters(base, { "Región SAP": ["NORTE"] }));
  assert.strictEqual(dashboard.getClientTrackingComparableSales(base, 202606), 110);
  assert.strictEqual(dashboard.getClientTrackingComparableSales(shared, 202606), 120, "La actividad compartida debe usar la venta conjunta");
  const detailModelCold = dashboard.getClientTrackingDetailModel(shared, periods);
  const detailModelCached = dashboard.getClientTrackingDetailModel(shared, periods);
  assert.strictEqual(detailModelCached, detailModelCold, "La apertura repetida debe reutilizar el modelo de detalle");
  assert.strictEqual(detailModelCold.periods.length, 2);
  assert.strictEqual(detailModelCold.periods[1].monthlyDiscount, 0.09);
  assert.strictEqual(dashboard.buildClientTrackingDetailConfig(detailModelCold).type, "clientTrackingDetail");
  const csv = dashboard.buildClientTrackingSummaryCsv([base, shared], periods, periods[1]);
  assert(csv.startsWith("\uFEFF"));
  assert(csv.includes("Venta MAY 2026") && csv.includes("Dcto. JUN 2026") && csv.includes("Cumplimiento JUN 2026") && csv.includes("Estado JUN 2026"));
  assert(csv.includes('"9 %"') && !csv.includes('"900 %"'), "El CSV debe formatear el descuento mensual normalizado");
  assert(csv.includes("'=C-001"), "El resumen debe conservar protección contra inyección CSV");
  assert.strictEqual((csv.match(/A-00[12]/g) || []).length, 2, "El CSV debe incluir todas las coincidencias, no una sola página");
  const detailCsv = dashboard.buildClientTrackingDetailCsv(shared, periods);
  assert(detailCsv.includes("Venta comparable de la negociación") && detailCsv.includes("Aporte atribuible del cliente"));
  assert(detailCsv.includes("MAY 2026") && detailCsv.includes("JUN 2026"));
  assert(detailCsv.includes('"9 %"'));
  const source = fs.readFileSync(path.join(ROOT, "dashboard-template.js"), "utf8");
  assert(source.includes('id="clientTracking"') && source.includes('data-tracking-action=\\\\"open-detail\\\\"'));
  assert(source.includes("clientTrackingCache: createLruCache(8)") && source.includes("rows.slice(start, start + tableState.pageSize)"));
  assert(source.includes("clientTrackingDetailCache: createLruCache(16)") && source.includes("clientTrackingRelationIndex: new Map()"));
  assert(source.includes("ensureClientTrackingRelationIndex(rows).get(rowKey)") && !source.includes("clientActivitySummary.find(function (item) { return getClientTrackingRowKey(item)"));
  assert.strictEqual((source.match(/panel\.addEventListener\("click"/g) || []).length, 1, "La tabla debe conservar un único listener delegado de clic");
  assert(source.includes("white-space: nowrap") && source.includes("client-tracking-table-wrap { max-width: 100%; overflow: auto"));
  assert(source.includes('const headers = ["Estado mes", "Estado total", "Cliente / CodSAP"'));
  assert(source.includes("getClientTrackingMonthlyDiscountDisplay(row, period && period.key)"));
  const controlsMarkup = dashboard.buildClientTrackingControlsMarkup();
  assert(!controlsMarkup.includes('type=\\"search\\"') && !controlsMarkup.includes("Buscar cliente"));
  assert(!source.includes("clientTrackingTable.query") && !source.includes("trackingSearchText") && !source.includes("clientTrackingSearchDebounced"));
  assert.deepStrictEqual(Object.keys(plain(dashboard.getClientTrackingTableState())).sort(), ["compactLayout", "monthlyStatus", "page", "pageSize", "selectedRowKey", "sortDirection", "sortField", "totalStatus"].sort());
  assert(source.includes('updateDashboardFilters(patch, { reason: action })'));
  assert(source.includes('@media (max-width: 820px)') && source.includes('client-tracking-cards'));
  assert(!source.includes("DASHBOARD_DATA.filter(function (row) { return getClientTracking"));
  runModalNavigationAndScrollTests(base, periods, source);
}

function runModalNavigationAndScrollTests(base, periods, source) {
  const elements = makeDetailExplorerElements();
  const originalScrollTo = dashboard.window.scrollTo;
  const originalScrollX = dashboard.window.scrollX;
  const originalScrollY = dashboard.window.scrollY;
  const scrollCalls = [];
  dashboard.window.scrollX = 12;
  dashboard.window.scrollY = 340;
  dashboard.window.scrollTo = (x, y) => scrollCalls.push([x, y]);
  withDashboardElements(elements, () => {
    const tableState = dashboard.getClientTrackingTableState();
    Object.assign(tableState, { page: 3, sortField: "clientName", sortDirection: "desc", selectedRowKey: dashboard.getClientTrackingRowKey(base) });
    const trackingConfig = dashboard.buildClientTrackingDetailConfig(dashboard.getClientTrackingDetailModel(base, periods));
    dashboard.openDetailExplorer(trackingConfig, null);
    assert.strictEqual(dashboard.getModalNavigationSnapshot().depth, 1);
    assert.strictEqual(elements.detailExplorerBack.hidden, false);
    elements.detailExplorerBody.scrollTop = 175;

    const contributionRows = [{ clientId: "C-1", clientName: "Cliente Uno", sales: 70, share: 1, rank: 1, presentationCount: 1 }];
    const contributionConfig = {
      type: "activityContribution", category: "A-001", title: "Contribución", subtitle: "ACTIVIDAD COMPARTIDA",
      rows: contributionRows, rowKey: (row) => row.clientId, searchFields: ["clientId"], columns: [],
      defaultSortField: "clientId", defaultSortDir: "asc", selectedClientIds: [], paginated: true,
      sortOptions: [{ field: "clientId", dir: "asc", label: "Cliente" }], summary: []
    };
    dashboard.openDetailExplorer(contributionConfig, null);
    assert.strictEqual(dashboard.getModalNavigationSnapshot().depth, 2);
    dashboard.selectDetailExplorerRow("C-1");
    assert.strictEqual(dashboard.getModalNavigationSnapshot().depth, 3);
    assert(dashboard.getDetailExplorerState().selectedRow);
    dashboard.navigateModalBack();
    assert.strictEqual(dashboard.getDetailExplorerState().type, "activityContribution");
    assert.strictEqual(dashboard.getDetailExplorerState().selectedRow, null);
    const scrollable = { scrollHeight: 900, clientHeight: 300, scrollTop: 120, parentElement: elements.detailExplorerDialog };
    const countersBeforeScroll = plain(dashboard.getDashboardPerformanceSnapshot().counters);
    dashboard.handleDetailExplorerWheel({ target: scrollable, deltaY: 40, preventDefault() { throw new Error("No debe bloquear el scroll interno disponible"); } });
    assert.deepStrictEqual(plain(dashboard.getDashboardPerformanceSnapshot().counters), countersBeforeScroll, "El scroll no debe recalcular análisis ni renderizar");
    scrollable.scrollTop = 0;
    let touchBoundaryPrevented = false;
    dashboard.handleDetailExplorerTouchStart({ touches: [{ clientY: 100 }] });
    dashboard.handleDetailExplorerTouchMove({ target: scrollable, touches: [{ clientY: 120 }], preventDefault() { touchBoundaryPrevented = true; } });
    assert.strictEqual(touchBoundaryPrevented, true, "El gesto en el límite no debe propagarse al documento");
    elements.detailExplorerBody.clientHeight = 400;
    elements.detailExplorerBody.scrollHeight = 1200;
    let keyboardPrevented = false;
    dashboard.handleDetailExplorerDocumentKeydown({ key: "PageDown", target: elements.detailExplorerDialog, preventDefault() { keyboardPrevented = true; } });
    assert.strictEqual(keyboardPrevented, true);
    dashboard.navigateModalBack();
    assert.strictEqual(dashboard.getDetailExplorerState().type, "clientTrackingDetail");
    assert.strictEqual(elements.detailExplorerBody.scrollTop, 175);
    dashboard.navigateModalBack();
    assert.strictEqual(dashboard.getDetailExplorerState().isOpen, false);
    assert.strictEqual(dashboard.getClientTrackingTableState().page, 3);
    assert.strictEqual(dashboard.getClientTrackingTableState().sortField, "clientName");
    assert.strictEqual(dashboard.getClientTrackingTableState().sortDirection, "desc");
    assert.strictEqual(dashboard.getClientTrackingTableState().selectedRowKey, dashboard.getClientTrackingRowKey(base));
    assert(scrollCalls.some((value) => value[0] === 12 && value[1] === 340));
  });

  const originalBody = dashboard.document.body;
  const originalRoot = dashboard.document.documentElement;
  const originalInnerWidth = dashboard.window.innerWidth;
  const originalComputedStyle = dashboard.window.getComputedStyle;
  const body = { style: { position: "", top: "", left: "", right: "", width: "", overflow: "", paddingRight: "4px" } };
  const classes = new Set();
  dashboard.document.body = body;
  dashboard.document.documentElement = { clientWidth: 1180, classList: { add(value) { classes.add(value); }, remove(value) { classes.delete(value); } } };
  dashboard.window.innerWidth = 1200;
  dashboard.window.scrollX = 7;
  dashboard.window.scrollY = 260;
  dashboard.window.getComputedStyle = () => ({ paddingRight: "4px" });
  dashboard.lockPageScroll();
  dashboard.lockPageScroll();
  assert.strictEqual(dashboard.getModalNavigationSnapshot().scrollLockCount, 2);
  assert.strictEqual(body.style.position, "fixed");
  assert.strictEqual(body.style.top, "-260px");
  assert.strictEqual(body.style.paddingRight, "24px");
  assert(classes.has("modal-scroll-locked"));
  dashboard.unlockPageScroll();
  assert.strictEqual(body.style.position, "fixed", "Un modal encadenado no debe desbloquear el fondo");
  dashboard.unlockPageScroll();
  assert.strictEqual(body.style.position, "");
  assert.strictEqual(body.style.paddingRight, "4px");
  assert(!classes.has("modal-scroll-locked"));
  assert(scrollCalls.some((value) => value[0] === 7 && value[1] === 260));
  dashboard.document.body = originalBody;
  dashboard.document.documentElement = originalRoot;
  dashboard.window.innerWidth = originalInnerWidth;
  dashboard.window.getComputedStyle = originalComputedStyle;
  dashboard.window.scrollTo = originalScrollTo;
  dashboard.window.scrollX = originalScrollX;
  dashboard.window.scrollY = originalScrollY;

  assert(source.includes('data-detail-action="navigate-back"'));
  assert(source.includes('overlay.addEventListener("wheel", handleDetailExplorerWheel, { passive: false })'));
  assert(source.includes('overlay.addEventListener("touchstart", handleDetailExplorerTouchStart, { passive: true })'));
  assert(!source.includes('overlay.addEventListener("scroll"'));
  assert(!source.includes("backdrop-filter: blur"));
  assert(source.includes("overscroll-behavior: contain"));
}

function runAttachedWorkbookValidation() {
  const workbookPath =
    process.env.PRUEBA_DASHBOARD_XLSX || path.join(os.homedir(), "Downloads", "PruebaDashboard.xlsx");
  if (!fs.existsSync(workbookPath)) {
    console.warn("PruebaDashboard.xlsx no encontrado; se omite validación del archivo adjunto.");
    return;
  }

  const matrix = readXlsxFirstSheet(workbookPath);
  assert.strictEqual(matrix[0].length, 25);
  const rows = processWorkbook(workbookPath);
  const statusCounts = rows.reduce((acc, row) => {
    acc[row.estadoInformacionVenta] = (acc[row.estadoInformacionVenta] || 0) + 1;
    return acc;
  }, {});
  const byCategory = app.groupPresentationsWithoutSalesByCategory(rows);
  const noSalesAnalysis = dashboard.getNoSalesAnalysis(rows);

  if (process.env.DEBUG_SALES_TEST) {
    console.log(statusCounts);
    console.log(
      rows.slice(0, 12).map((row) => ({
        estado: row.estadoInformacionVenta,
        venta: row["Ventas cajas físicas (sin rep)"],
        categoria: row["Categoría AS400 de la venta"],
        presentacion: row["Presentación AS400 de la venta - Texto"],
        clave: row["Presentación AS400 de la venta - Clave"],
        clienteSap: row["Cliente SAP - Clave"],
        actividad: row["ID Actividad"],
        anio: row["Año"],
        mes: row["Mes"],
        anioMes: row["Año Mes"],
        region: row["Región SAP"],
        canal: row["Canal"],
        nit: row["Nit cliente - Clave"],
        clienteAs400: row["Cliente AS400 - Texto"]
      }))
    );
  }

  assert.strictEqual(rows.length, 55);
  assert.strictEqual(statusCounts.SIN_INFORMACION_VENTA, 8);
  assert.strictEqual(statusCounts.VENTA_CERO, 42);
  assert.strictEqual(statusCounts.CON_VENTA, 5);
  assert.strictEqual(app.countUniquePresentationsWithoutSales(rows), 8);
  assert.strictEqual(noSalesAnalysis.presentationCount, 8);
  assert.strictEqual(noSalesAnalysis.uniquePresentations.length, 8);
  assert.strictEqual(noSalesAnalysis.activityCount, 2);
  assert.strictEqual(noSalesAnalysis.clientCount, 1);
  assert.strictEqual(noSalesAnalysis.presentationsWithoutCategory, 0);
  assert.strictEqual(sumChartValues(noSalesAnalysis.byCategory), 8);
  assert.deepStrictEqual(plain(byCategory), [
    { label: "Hidratantes", value: 5 },
    { label: "Gaseosa", value: 3 }
  ]);
  assert.deepStrictEqual(plain(noSalesAnalysis.byCategory), [
    { label: "Hidratantes", value: 5 },
    { label: "Gaseosa", value: 3 }
  ]);
  assert.strictEqual(noSalesAnalysis.uniquePresentations.length, 8);

  const noSalesClient = noSalesAnalysis.uniquePresentations[0]["Cliente SAP - Clave"];
  assert(noSalesClient);
  const filteredByNoSalesClient = dashboard.applyFilters(rows, { "Cliente SAP - Clave": noSalesClient });
  const noSalesClientAnalysis = dashboard.getNoSalesAnalysis(filteredByNoSalesClient);
  assert.strictEqual(noSalesClientAnalysis.presentationCount, 8);
  assert.strictEqual(noSalesClientAnalysis.activityCount, 2);
  assert.strictEqual(noSalesClientAnalysis.clientCount, 1);
  assert.strictEqual(sumChartValues(noSalesClientAnalysis.byCategory), 8);
  assert.deepStrictEqual(plain(noSalesClientAnalysis.byCategory), [
    { label: "Hidratantes", value: 5 },
    { label: "Gaseosa", value: 3 }
  ]);
  assert.strictEqual(dashboard.computeKpis(filteredByNoSalesClient, noSalesClientAnalysis).presentationsWithoutSales, 8);
  assert.strictEqual(noSalesClientAnalysis.uniquePresentations.length, 8);
  assert(!dashboard.groupUniqueTotalSalesByField(rows, "Región SAP").some((item) => item.label === "Sin dato"));

  assert.strictEqual(app.countUnique(rows, "Presentación AS400 de la venta - Clave"), 53);
  assert.strictEqual(app.countUnique(rows, "ID Actividad"), 3);
  assert.strictEqual(app.countUnique(rows, "Categoría AS400 de la venta"), 6);
  assert.strictEqual(app.countUnique(rows, "Mes"), 2);
  assert.strictEqual(app.countUnique(rows, "Cliente SAP - Clave"), 1);
  assert.strictEqual(app.countUnique(rows, "Región SAP"), 1);
  assert.strictEqual(app.countUnique(rows, "Canal"), 1);
  assert.strictEqual(app.countUnique(rows, "Cedi"), 1);
  assert.deepStrictEqual(plain(dashboard.salesByCanonicalPeriod(rows).map((item) => item.label)), ["MAY 2026", "JUN 2026"]);

  const workbookKpis = dashboard.computeKpis(rows, noSalesAnalysis);
  assert.strictEqual(workbookKpis.salesPeriod, 405);
  assert.strictEqual(workbookKpis.salesMonth, 279);
  assert.strictEqual(workbookKpis.objective, null);
  assert.strictEqual(workbookKpis.compliance, null);
  assert.strictEqual(workbookKpis.objectiveDifference, null);
  assert.deepStrictEqual(plain(workbookKpis.salesResolution[1].sourceValues), [279, 0]);

  const quality = app.buildDataQualityReport(rows);
  assert.strictEqual(quality.rowsWithoutNit, 8);
  assert.strictEqual(quality.rowsWithoutNitUnexpected, 0);
  assert.strictEqual(quality.totalSalesConflicts, 0);
  assert.strictEqual(quality.monthlyObjectiveConflicts, 0);
  assert.strictEqual(quality.unparseableMonthRows, 0);
  assert.strictEqual(quality.exactDuplicateRows, 0);
  assert.strictEqual(quality.rowsWithWarnings, 0);

  const workbookHtml = dashboard.generatedHtml({ rows, metadata: { qualityWarnings: quality } });
  assert(workbookHtml.includes('"__periodKey":202605'));
  assert(workbookHtml.includes('"__periodKey":202606'));
  assert.deepStrictEqual(findDuplicateHtmlIds(workbookHtml), []);
  const workbookInlineScript = Array.from(workbookHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g), (match) => match[1]);
  assert.strictEqual(workbookInlineScript.length, 1);
  assert.doesNotThrow(() => new vm.Script(workbookInlineScript[0], { filename: "dashboard-prueba-descargado.html" }));

  const workbookAnalysis = dashboard.buildDashboardAnalyses(rows, noSalesAnalysis);
  const workbookRules = Object.fromEntries(dashboard.getChartRegistry().map((definition) => [definition.id, definition.shouldRender(workbookAnalysis)]));
  assert.deepStrictEqual(plain(workbookRules), {
    negotiationTimeline: true,
    salesTarget: false,
    activityContribution: false,
    activityPerformance: false,
    presentationStatus: true,
    category: true,
    presentations: true,
    clients: false,
    regions: false,
    channels: false,
    cedi: false
  });
}

function runTimelineModelTests() {
  dashboard.initializeDashboardDataset([]);
  const rows = [
    normalizeActivityRow({ activityId: "TL-1", clientId: "TL-C", yearMonth: "202605", month: "MAY", totalSales: "40", physicalSales: "40", startDate: "2026-06-19", endDate: "2026-07-11" }),
    normalizeActivityRow({ activityId: "TL-1", clientId: "TL-C", yearMonth: "202606", month: "JUN", totalSales: "80", physicalSales: "80", startDate: "2026-06-19", endDate: "2026-07-11" }),
    normalizeActivityRow({ activityId: "TL-1", clientId: "TL-C", yearMonth: "202607", month: "JUL", totalSales: "", physicalSales: "", startDate: "2026-06-19", endDate: "2026-07-11" }),
    normalizeActivityRow({ activityId: "TL-1", clientId: "TL-C", yearMonth: "202608", month: "AGO", totalSales: "20", physicalSales: "20", startDate: "2026-06-19", endDate: "2026-07-11" })
  ];
  const analytics = dashboard.buildActivityAnalytics(rows);
  const analysis = dashboard.buildDashboardAnalyses(rows, dashboard.getNoSalesAnalysis(rows), { scopeRows: rows, filters: { "ID Actividad": "TL-1" }, activityAnalytics: analytics });
  const timeline = analysis.timeline;
  assert.strictEqual(timeline.mode, "SINGLE_ACTIVITY");
  assert.strictEqual(timeline.displayMode, "DETAIL");
  assert.strictEqual(timeline.activities[0].startDate, "2026-06-19");
  assert.strictEqual(timeline.activities[0].endDate, "2026-07-11");
  assert.strictEqual(timeline.periods.find((item) => item.periodKey === 202605).temporalStatus, "HISTORICO_PREVIO");
  assert.strictEqual(timeline.periods.find((item) => item.periodKey === 202606).temporalStatus, "PERIODO_COMPARABLE");
  assert.strictEqual(timeline.periods.find((item) => item.periodKey === 202607).temporalStatus, "VIGENTE_SIN_VENTA_ATRIBUIBLE");
  assert.strictEqual(timeline.periods.find((item) => item.periodKey === 202607).objective, 100);
  assert.strictEqual(timeline.periods.find((item) => item.periodKey === 202608).temporalStatus, "POSTERIOR_AL_FIN");
  assert.strictEqual(timeline.periods.find((item) => item.periodKey === 202605).comparable, false);
  assert.strictEqual(timeline.periods.find((item) => item.periodKey === 202608).objective, null);
  assert.strictEqual(timeline.comparablePeriodCount, 1);
  assert(timeline.accessibleSummary.includes("19/06/2026"));
  assert(timeline.accessibleSummary.includes("11/07/2026"));
  const timelineOption = dashboard.buildNegotiationTimelineOption(timeline);
  assert.strictEqual(timelineOption.series[0].type, "line");
  assert.strictEqual(timelineOption.series[0].smooth, 0.25);
  assert.strictEqual(timelineOption.series[0].showSymbol, true);
  assert.strictEqual(timelineOption.series[0].data[0].symbol, "emptyCircle");
  assert.strictEqual(timelineOption.series[0].data[3].symbol, "diamond");
  assert.strictEqual(timelineOption.series[1].type, "line");
  assert.strictEqual(timelineOption.series[1].lineStyle.type, "dashed");
  assert.strictEqual(timelineOption.series[1].data[0], null);
  assert.strictEqual(timelineOption.series[1].data[3], null);
  assert(timelineOption.series[0].markArea);
  assert.strictEqual(timelineOption.series[0].markLine.data.length, 2);
  const nativeTimelineElement = { innerHTML: "" };
  dashboard.renderNativeTimeline(nativeTimelineElement, timeline);
  assert(nativeTimelineElement.innerHTML.includes("native-timeline-list"));
  assert(nativeTimelineElement.innerHTML.includes("Histórico previo"));

  const noEndRows = [normalizeActivityRow({ activityId: "TL-NO-END", clientId: "C-NO-END", endDate: "" })];
  const noEndAnalytics = dashboard.buildActivityAnalytics(noEndRows);
  const noEndTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": "TL-NO-END" }, analyses: { activityAnalytics: noEndAnalytics } });
  assert.strictEqual(noEndTimeline.activities[0].dateStatus, "FECHA_FIN_AUSENTE");

  const dateConflictRows = [
    normalizeActivityRow({ activityId: "TL-DATE", clientId: "C-DATE", presentationCode: "P-1", startDate: "2026-01-01", endDate: "2026-12-31" }),
    normalizeActivityRow({ activityId: "TL-DATE", clientId: "C-DATE", presentationCode: "P-2", startDate: "2026-02-01", endDate: "2026-12-31" })
  ];
  const dateConflictAnalytics = dashboard.buildActivityAnalytics(dateConflictRows);
  const dateConflictTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": "TL-DATE" }, analyses: { activityAnalytics: dateConflictAnalytics } });
  assert.strictEqual(dateConflictTimeline.activities[0].dateStatus, "FECHAS_CONFLICTIVAS");
  assert(dateConflictTimeline.warnings.some((item) => item.includes("fechas conflictivas")));

  const noObjectiveRows = [normalizeActivityRow({ activityId: "TL-NO-OBJ", clientId: "C-NO-OBJ", objectiveMonth: "" })];
  const noObjectiveAnalytics = dashboard.buildActivityAnalytics(noObjectiveRows);
  const noObjectiveTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": "TL-NO-OBJ" }, analyses: { activityAnalytics: noObjectiveAnalytics } });
  assert.strictEqual(noObjectiveTimeline.periods[0].temporalStatus, "SIN_OBJETIVO");

  const objectiveConflictRows = [
    normalizeActivityRow({ activityId: "TL-OBJ", clientId: "C-OBJ", presentationCode: "P-1", objectiveMonth: "100" }),
    normalizeActivityRow({ activityId: "TL-OBJ", clientId: "C-OBJ", presentationCode: "P-2", objectiveMonth: "200" })
  ];
  const objectiveConflictAnalytics = dashboard.buildActivityAnalytics(objectiveConflictRows);
  const objectiveConflictTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": "TL-OBJ" }, analyses: { activityAnalytics: objectiveConflictAnalytics } });
  assert.strictEqual(objectiveConflictTimeline.periods[0].temporalStatus, "OBJETIVO_CONFLICTIVO");

  const ambiguousRows = [
    normalizeActivityRow({ activityId: "TL-AMB-1", clientId: "C-AMB", presentationCode: "P-1", totalSales: "100", physicalSales: "60" }),
    normalizeActivityRow({ activityId: "TL-AMB-2", clientId: "C-AMB", presentationCode: "P-2", totalSales: "0", physicalSales: "0", year: "", month: "", yearMonth: "" })
  ];
  const ambiguousAnalytics = dashboard.buildActivityAnalytics(ambiguousRows);
  assert.strictEqual(ambiguousAnalytics.activityPerformance.find((item) => item.activityId === "TL-AMB-2").status, "VENTA_ACTIVIDAD_AMBIGUA");
  const ambiguousTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": "TL-AMB-2" }, analyses: { activityAnalytics: ambiguousAnalytics } });
  const ambiguousPeriod = ambiguousTimeline.periods.find((item) => item.periodKey === 202607);
  assert.strictEqual(ambiguousPeriod.temporalStatus, "VENTA_ACTIVIDAD_AMBIGUA");
  assert.strictEqual(ambiguousPeriod.comparable, false);

  const manyRows = Array.from({ length: 9 }, (_, index) => normalizeActivityRow({ activityId: "TL-M-" + index, clientId: "TL-MC-" + index }));
  const manyAnalytics = dashboard.buildActivityAnalytics(manyRows);
  const fewTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": ["TL-M-0", "TL-M-1"] }, analyses: { activityAnalytics: manyAnalytics } });
  const manyTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": manyRows.map((row) => row["ID Actividad"]) }, analyses: { activityAnalytics: manyAnalytics } });
  assert.strictEqual(fewTimeline.displayMode, "GANTT");
  assert.strictEqual(manyTimeline.displayMode, "SUMMARY");
  assert.strictEqual(manyTimeline.visibleActivities.length, 8);
  assert.strictEqual(manyTimeline.hiddenActivityCount, 1);

  const globalTimeline = dashboard.buildNegotiationTimelineAnalysis({ filters: {}, analyses: { activityAnalytics: analytics } });
  assert.strictEqual(globalTimeline.shouldRender, false);
  assert.strictEqual(globalTimeline.mode, "NO_CONTEXT");
  const firstCached = dashboard.getNegotiationTimelineAnalysisCached({ filters: { "ID Actividad": "TL-1" }, analyses: { activityAnalytics: analytics }, datasetVersion: 900 });
  const secondCached = dashboard.getNegotiationTimelineAnalysisCached({ filters: { "ID Actividad": "TL-1" }, analyses: { activityAnalytics: analytics }, datasetVersion: 900 });
  assert.strictEqual(firstCached, secondCached);
  assert(dashboard.getDashboardPerformanceSnapshot().caches.timelines <= 8);
}

function runLayoutPresentationTests() {
  [4, 5, 6, 8].forEach((count) => {
    const metadata = plain(dashboard.getKpiGridLayoutMetadata(count));
    assert.strictEqual(metadata.count, count);
    assert.strictEqual(metadata.tail, count % 4);
    assert.strictEqual(metadata.odd, count % 2 === 1);
  });
  const one = dashboard.assignAdaptiveChartLayout([{ id: "one", layout: "standard" }]);
  assert(one[0].layoutClass.includes("chart-standard"));
  assert(one[0].layoutClass.includes("chart-row-fill"));
  const two = dashboard.assignAdaptiveChartLayout([{ id: "one", layout: "standard" }, { id: "two", layout: "compact" }]);
  assert(two.every((item) => !item.layoutClass.includes("chart-row-fill")));
  const odd = dashboard.assignAdaptiveChartLayout([
    { id: "one", layout: "standard" }, { id: "two", layout: "compact" }, { id: "three", layout: "standard" }
  ]);
  assert(!odd[0].layoutClass.includes("chart-row-fill"));
  assert(odd[2].layoutClass.includes("chart-row-fill"));
  const separated = dashboard.assignAdaptiveChartLayout([
    { id: "one", layout: "standard" }, { id: "timeline", layout: "timeline" }, { id: "two", layout: "standard" }
  ]);
  assert(separated[0].layoutClass.includes("chart-row-fill"));
  assert.strictEqual(separated[1].layoutClass, "chart-timeline");
  assert(separated[2].layoutClass.includes("chart-row-fill"));
  const registry = dashboard.getChartRegistry();
  assert.deepStrictEqual(plain(registry.slice(0, 2).map((item) => item.id)), ["salesTarget", "negotiationTimeline"]);
  assert.strictEqual(registry.find((item) => item.id === "negotiationTimeline").layout, "timeline");
  assert(registry.every((item) => ["compact", "standard", "featured", "timeline"].includes(item.layout)));
  assert.strictEqual(registry.find((item) => item.id === "presentationStatus").visualType, "donut");
  assert.strictEqual(registry.find((item) => item.id === "category").visualType, "treemap-or-bar");
  assert.strictEqual(registry.find((item) => item.id === "presentations").visualType, "lollipop");
  assert.strictEqual(registry.some((item) => item.id === "noSales" || item.elementId === "chartSinVentasCategoria"), false);
  assert.strictEqual(registry.find((item) => item.id === "salesTarget").visualType, "bar");
  assert.strictEqual(registry.some((item) => item.id === "salesTrend" || item.elementId === "chartMes" || item.title === "Evolución de ventas"), false);
  assert.strictEqual(dashboard.chooseCompositionChartType([{ label: "A", value: 2 }, { label: "B", value: 1 }], { donutLimit: 6, treemapLimit: 18 }), "donut");
  assert.strictEqual(dashboard.chooseCompositionChartType(Array.from({ length: 8 }, (_, index) => ({ label: String(index), value: index + 1 })), { donutLimit: 6, treemapLimit: 18 }), "treemap");
  assert.strictEqual(dashboard.chooseCompositionChartType(Array.from({ length: 20 }, (_, index) => ({ label: String(index), value: index + 1 })), { donutLimit: 6, treemapLimit: 18, fallbackType: "bar" }), "bar");
  const donutOption = dashboard.buildEChartOption("donut", [{ label: "Con venta", value: 8 }, { label: "Venta cero", value: 2 }], false, false, { integerValues: true });
  assert.strictEqual(donutOption.series[0].type, "pie");
  assert.strictEqual(typeof donutOption.tooltip.formatter, "function");
  const treemapOption = dashboard.buildEChartOption("treemap", [{ label: "A", value: 8 }, { label: "B", value: 2 }], false, true, {});
  assert.strictEqual(treemapOption.series[0].type, "treemap");
  assert.strictEqual(treemapOption.series[0].roam, false);
  const lollipopOption = dashboard.buildEChartOption("lollipop", [{ label: "A", value: 8 }, { label: "B", value: 2 }], false, true, { showLabels: true });
  assert.deepStrictEqual(plain(lollipopOption.series.map((series) => series.type)), ["bar", "scatter"]);
  assert.strictEqual(lollipopOption.series[0].silent, true);
  assert.strictEqual(lollipopOption.series[1].data[1].name, "A");
  const nativeTreemapElement = { innerHTML: "", querySelectorAll() { return []; } };
  const eighteenItems = Array.from({ length: 18 }, (_, index) => ({ label: "Categoría " + index, value: index + 1 }));
  dashboard.renderNativeTreemapChart(nativeTreemapElement, eighteenItems, false, null, {});
  assert(nativeTreemapElement.innerHTML.includes("Categoría 17"));
  const nativeLollipopElement = { innerHTML: "", querySelectorAll() { return []; } };
  dashboard.renderNativeLollipopChart(nativeLollipopElement, [{ label: "Presentación extensa", value: 8 }], false, null, {});
  assert(nativeLollipopElement.innerHTML.includes("native-lollipop-dot"));
  const filterConfigs = [
    { item: { field: "ID Actividad" } }, { item: { field: "Cliente SAP - Clave" } },
    { item: { field: "Mes" } }, { item: { field: "Región SAP" } }, { item: { field: "Canal" } }
  ];
  const filterLayout = plain(dashboard.assignAdaptiveFilterLayout(filterConfigs));
  assert(filterLayout[0].includes("filter-control-wide"));
  assert(filterLayout[1].includes("filter-control-wide"));
  assert(filterLayout.slice(2).every((item) => item.includes("filter-control-tail-3")));
  const templateSource = fs.readFileSync(path.join(ROOT, "dashboard-template.js"), "utf8");
  assert.strictEqual(countOccurrences(templateSource, 'window.addEventListener("resize", debouncedResizeCharts)'), 1);
  assert.strictEqual(countOccurrences(templateSource, 'charts.addEventListener("click", handleTimelineAction)'), 1);
  assert.strictEqual(countOccurrences(templateSource, 'container.addEventListener("click", handleFilterPanelClick)'), 1);
  assert(templateSource.includes('const debouncedResizeCharts = debounce(resizeCharts, 160)'));
  assert(!templateSource.includes("ResizeObserver"));
  assert(templateSource.includes('renderChart("chartPresentaciones", "lollipop"'));
  assert(templateSource.includes("renderNativeTreemapChart"));
  assert(templateSource.includes("renderNativeLollipopChart"));
  assert(templateSource.includes("openNoSalesCategoryExplorer"));
  assert(!templateSource.includes("renderNoSalesCategoryChart"));
  assert(!templateSource.includes("chartSinVentasCategoria"));
  assert(!templateSource.includes('id: "salesTrend"'));
  assert(!templateSource.includes('"chartMes"'));
  assert(!templateSource.includes('if (type === "line")'));
  assert(!templateSource.includes("Evolución de ventas"));
}

function runProductionHardeningTests() {
  const hostile = normalizeActivityRow({
    activityId: "SEC-1",
    clientId: "<img src=x onerror=alert(1)>",
    clientName: "</script><script>alert(1)</script>\u2028\u2029",
    presentationName: 'Producto "peligroso" <script>alert(2)</script>'
  });
  hostile["Cliente AS400 - Texto"] = "Separador\u2028de línea y párrafo\u2029";
  const hostileHtml = dashboard.generatedHtml({ rows: [hostile], metadata: { sourceFileName: "</script><script>alert(3)</script>" } });
  assert(!hostileHtml.includes("</script><script>alert(1)</script>"));
  assert(!hostileHtml.includes("</script><script>alert(3)</script>"));
  assert(hostileHtml.includes("\\u003c/script\\u003e"));
  assert(hostileHtml.includes("\\u2028"));
  assert(hostileHtml.includes("\\u2029"));
  assert.strictEqual(dashboard.escapeHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");

  assert.strictEqual(dashboard.protectCsvValue("=SUM(A1:A2)", "=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.strictEqual(dashboard.protectCsvValue("+CMD", "+CMD"), "'+CMD");
  assert.strictEqual(dashboard.protectCsvValue("@IMPORT", "@IMPORT"), "'@IMPORT");
  assert.strictEqual(dashboard.protectCsvValue("-texto", "-texto"), "'-texto");
  assert.strictEqual(dashboard.protectCsvValue(-559, -559), "-559");
  assert.strictEqual(dashboard.serializeCsvCell('A"B\nC;D', 'A"B\nC;D'), '"A""B\nC;D"');
  const csvRow = normalizeActivityRow({ presentationName: "=HYPERLINK(\"x\")", totalSales: "-5" });
  const hardenedCsv = dashboard.exportFilteredCsv([csvRow]);
  assert(hardenedCsv.startsWith("\uFEFF"));
  assert(hardenedCsv.includes("'=HYPERLINK"));
  assert(hardenedCsv.includes('"-5"'));

  const fullValidation = plain(app.validateColumns(REQUIRED_COLUMNS));
  assert.strictEqual(fullValidation.isValid, true);
  const missingRequired = plain(app.validateColumns(REQUIRED_COLUMNS.filter((column) => column !== "ID Actividad")));
  assert.strictEqual(missingRequired.isValid, false);
  assert(missingRequired.missing.includes("ID Actividad"));
  const missingOptional = plain(app.validateColumns(REQUIRED_COLUMNS.filter((column) => column !== "Categoría AS400 de la venta")));
  assert.strictEqual(missingOptional.isValid, true);
  assert(missingOptional.optionalMissing.includes("Categoría AS400 de la venta"));
  assert.strictEqual(app.protectCsvValue("=1+1", "=1+1"), "'=1+1");
  assert.strictEqual(app.protectCsvValue(-5, -5), "-5");
  const originalAppUrl = app.URL;
  const originalAppBlob = app.Blob;
  const originalAppCreateElement = app.document.createElement;
  const originalAppBody = app.document.body;
  const originalAppTimeout = app.window.setTimeout;
  let appDownloadClicked = false, appDownloadRevoked = "";
  app.URL = { createObjectURL() { return "blob:html"; }, revokeObjectURL(url) { appDownloadRevoked = url; } };
  app.Blob = function BlobMock() {};
  app.document.createElement = () => ({ click() { appDownloadClicked = true; }, remove() {} });
  app.document.body = { appendChild() {} };
  app.window.setTimeout = (callback) => { callback(); return 1; };
  assert.strictEqual(app.downloadHtml('archivo<invalido>.html', "<!doctype html>"), true);
  assert.strictEqual(appDownloadClicked, true);
  assert.strictEqual(appDownloadRevoked, "blob:html");
  app.URL = originalAppUrl;
  app.Blob = originalAppBlob;
  app.document.createElement = originalAppCreateElement;
  app.document.body = originalAppBody;
  app.window.setTimeout = originalAppTimeout;

  dashboard.initializeDashboardDataset([hostile]);
  const originalStressRaf = dashboard.window.requestAnimationFrame;
  const originalStressCancel = dashboard.window.cancelAnimationFrame;
  let stressFrameId = 0;
  dashboard.window.requestAnimationFrame = () => { stressFrameId += 1; return stressFrameId; };
  dashboard.window.cancelAnimationFrame = () => {};
  for (let index = 0; index < 50; index += 1) {
    dashboard.updateDashboardFilters({ "Cliente SAP - Clave": index % 2 ? [hostile["Cliente SAP - Clave"]] : [] }, { reason: "stress-filter" });
  }
  for (let index = 0; index < 20; index += 1) {
    dashboard.updateDashboardFilters({ "Cliente SAP - Clave": [hostile["Cliente SAP - Clave"]] }, { reason: "stress-before-clear" });
    dashboard.clearFilters();
  }
  const stressPerformance = plain(dashboard.getDashboardPerformanceSnapshot());
  assert(stressPerformance.counters.rendersScheduled >= 50);
  assert(stressPerformance.counters.rendersCancelled >= 49);
  dashboard.cancelPendingDashboardRender();
  dashboard.window.requestAnimationFrame = originalStressRaf;
  dashboard.window.cancelAnimationFrame = originalStressCancel;
  const stressAnalytics = dashboard.buildActivityAnalytics([hostile]);
  const stressActivity = stressAnalytics.activityPerformance[0];
  for (let index = 0; index < 20; index += 1) {
    dashboard.openActivityContributionDetail(stressActivity, null);
    dashboard.setDetailExplorerQuery("consulta " + index);
    dashboard.setDetailExplorerSort("clientId", index % 2 ? "desc" : "asc");
    dashboard.closeDetailExplorer();
  }
  for (let index = 0; index < 20; index += 1) {
    dashboard.buildNegotiationTimelineAnalysis({ filters: { "ID Actividad": "SEC-1" }, analyses: { activityAnalytics: stressAnalytics } });
  }
  for (let index = 0; index < 10; index += 1) dashboard.exportFilteredCsv([csvRow]);
  const boundedCache = dashboard.createLruCache(8);
  for (let index = 0; index < 50; index += 1) boundedCache.set("key-" + index, { value: index });
  assert.strictEqual(boundedCache.size(), 8);
  for (let index = 0; index < 55; index += 1) dashboard.reportDashboardDiagnostic(index % 3 ? "warning" : "error", "stress", new Error("error " + index), "diagnóstico " + index);
  const diagnostics = plain(dashboard.getDashboardDiagnosticsSnapshot());
  assert(diagnostics.errors.length <= 40);
  assert(diagnostics.warnings.length <= 40);
  assert.strictEqual(diagnostics.limit, 40);
  dashboard.initializeDashboardDataset([]);
  assert.deepStrictEqual(plain(dashboard.getDashboardDiagnosticsSnapshot()), { errors: [], warnings: [], limit: 40 });
  const snapshot = plain(dashboard.getDashboardPerformanceSnapshot());
  assert(snapshot.caches.filters <= 12 && snapshot.caches.analyses <= 8 && snapshot.caches.timelines <= 8);
  assert.strictEqual(snapshot.diagnostics.errors, 0);

  const originalLucide = dashboard.window.lucide;
  dashboard.window.lucide = undefined;
  assert.doesNotThrow(() => dashboard.refreshIcons());
  dashboard.window.lucide = { createIcons() { throw new Error("lucide fail"); } };
  assert.doesNotThrow(() => dashboard.refreshIcons());
  assert.strictEqual(dashboard.getDashboardDiagnosticsSnapshot().warnings.length, 1);
  dashboard.window.lucide = originalLucide;

  const templateSource = fs.readFileSync(path.join(ROOT, "dashboard-template.js"), "utf8");
  assert.strictEqual(countOccurrences(templateSource, "const RUNTIME_DIAGNOSTIC_LIMIT = 40"), 1);
  assert(templateSource.includes("function safelyRenderComponent"));
  assert(templateSource.includes("function reportDashboardDiagnostic"));
  assert(!templateSource.includes("console.warn("));
  assert(!templateSource.includes("console.error("));
}

function runSharedWorkbookValidation() {
  const workbookPath = process.env.INSUMO_DASHBOARD_XLSX || path.join(os.homedir(), "Downloads", "INSUMO DASHBOARD (3).xlsx");
  if (!fs.existsSync(workbookPath)) {
    console.warn("INSUMO DASHBOARD (3).xlsx no encontrado; se omite validación multicliente.");
    return;
  }
  const matrix = readXlsxFirstSheet(workbookPath);
  const rows = processWorkbook(workbookPath);
  if (matrix[0].length === 28) {
    assert(rows.length > 0);
    const model = app.buildClientNegotiationModels(rows);
    assert.strictEqual(model.diagnostics.workbookRows, rows.length);
    assert.strictEqual(model.diagnostics.clients, new Set(rows.map((row) => row.clientSap).filter(Boolean)).size);
    assert.strictEqual(model.diagnostics.activities, new Set(rows.map((row) => row.activityId).filter(Boolean)).size);
    assert(model.availablePeriods.length > 0);
    assert.strictEqual(model.summaryTableColumns.length, 17 + model.availablePeriods.length * 4);
    assert(model.clientActivitySummary.length >= model.clientSummary.length);
    assert(model.clientActivitySummary.every((row) => row.navigation.clientSap === row.clientSap && row.navigation.activityId === row.activityId));
    assert(model.clientActivitySummary.every((row) => ["CUMPLE_MES", "NO_CUMPLE_MES", "NO_EVALUABLE_MES"].includes(row.selectedMonthlyStatus)));
    assert(model.clientActivitySummary.every((row) => ["CUMPLIO_OBJETIVO_TOTAL", "EN_PROGRESO_OBJETIVO_TOTAL", "NO_EVALUABLE_TOTAL"].includes(row.totalObjectiveStatus)));
    assert(model.clientActivitySummary.every((row) => row.totalProgress === null || Number.isFinite(row.totalProgress)));
    assert(model.clientActivitySummary.every((row) => row.totalDifference === null || Number.isFinite(row.totalDifference)));
    const shared = model.clientActivitySummary.find((row) => row.isSharedActivity);
    assert(shared && shared.associatedClientCount > 1);
    assert(rows.some((row) => row.periodStatus === "SIN_PERIODO_DE_VENTA"));
    const activity947124 = model.clientActivitySummary.filter((row) => row.activityId === "947124");
    if (activity947124.length) assert(activity947124.every((row) => row.isSharedActivity));
    const activity874894 = model.clientActivitySummary.find((row) => row.activityId === "874894");
    if (activity874894) assert.strictEqual(activity874894.isSharedActivity, false);
    const client1002559342 = model.clientSummary.find((row) => row.clientSap === "1002559342");
    if (client1002559342) assert(client1002559342.activityCount >= 1);
    const dashboardHtml = dashboard.generatedHtml({ rows, metadata: { clientNegotiationModels: model } });
    const scripts = Array.from(dashboardHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g));
    assert.strictEqual(scripts.length, 1);
    assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
    return;
  }
  assert.strictEqual(matrix[0].length, 25);
  assert.strictEqual(rows.length, 18319);
  const analytics = app.buildActivityAnalytics(rows);
  assert.strictEqual(analytics.summary.activityCount, 370);
  assert.strictEqual(analytics.summary.individualActivityCount, 333);
  assert.strictEqual(analytics.summary.sharedActivityCount, 37);
  assert.strictEqual(analytics.summary.maximumClientsPerActivity, 14);
  assert.strictEqual(analytics.summary.multipleActivityClientPeriods, 12);
  assert.strictEqual(analytics.summary.ambiguousActivityPeriods, 3);
  assert.strictEqual(analytics.summary.objectiveConflictActivities, 0);
  assert.strictEqual(analytics.summary.totalObjectiveConflictActivities, 0);
  assert.strictEqual(analytics.summary.dateConflictActivities, 7);
  assert.strictEqual(analytics.activityPerformance.filter((item) => item.status === "VENTA_CONFLICTIVA").length, 0);
  assert.strictEqual(analytics.activityPerformance.filter((item) => item.status === "FECHAS_CONFLICTIVAS").length, 14);
  const latestAggregate = app.aggregateActivityPerformance(analytics.activityPerformance.filter((item) => item.period === 202606));
  assert.strictEqual(latestAggregate.comparableCount, 304);
  assert.strictEqual(latestAggregate.eligibleCount, 315);
  assert.strictEqual(latestAggregate.objectiveAll, 243629);
  assert.strictEqual(latestAggregate.objective, 242422);
  assert(Math.abs(latestAggregate.achievement - 1.0479397868180278) < 1e-12);
  const globalWorkbookAnalysis = dashboard.buildDashboardAnalyses(rows, dashboard.getNoSalesAnalysis(rows), { scopeRows: rows, filters: {}, activityAnalytics: analytics });
  const globalWorkbookKpiModel = dashboard.buildContextualKpiModel(globalWorkbookAnalysis, {});
  assert.strictEqual(globalWorkbookKpiModel.items.length, 8);
  assert.strictEqual(globalWorkbookKpiModel.items.find((item) => item.id === "comparableSales").value, dashboard.formatNumber(latestAggregate.sales));
  assert.strictEqual(globalWorkbookKpiModel.items.find((item) => item.id === "monthlyObjectives").value, dashboard.formatNumber(latestAggregate.objective));
  assert(globalWorkbookKpiModel.items.find((item) => item.id === "comparableSales").description.includes("304 de 324 actividades"));
  assert.strictEqual(globalWorkbookAnalysis.kpis.performanceConsistency.consistent, true);
  assert.notStrictEqual(globalWorkbookAnalysis.kpis.salesMonth, globalWorkbookAnalysis.kpis.comparableSales);
  assert.strictEqual(dashboard.getChartRegistry().some((definition) => definition.id === "salesTrend" || definition.elementId === "chartMes"), false);
  assert(analytics.activityPerformance.filter((item) => item.comparable && item.totalSales > 0).every((item) =>
    Math.abs(item.contributionRows.reduce((sum, row) => sum + row.share, 0) - 1) < 1e-9
  ));
  const sharedActivity = analytics.activityPerformance.find((item) => item.activityId === "880121" && item.period === 202606);
  assert(sharedActivity);
  assert.strictEqual(sharedActivity.associatedClientCount, 3);
  assert.strictEqual(sharedActivity.objectiveMonthly, 1376);
  assert.strictEqual(sharedActivity.totalSales, 1092.996);
  assert.strictEqual(sharedActivity.contributionRows[0].rank, 1);
  const activity947124 = analytics.activityPerformance.find((item) => item.activityId === "947124" && item.period === 202606);
  assert(activity947124);
  assert.strictEqual(activity947124.associatedClientCount, 2);
  assert.strictEqual(activity947124.totalSales, 541);
  assert.strictEqual(activity947124.objectiveMonthly, 1100);
  assert(Math.abs(activity947124.achievement - 541 / 1100) < 1e-12);
  assert.strictEqual(activity947124.gap, -559);
  assert.deepStrictEqual(plain(activity947124.contributionRows.map((item) => item.sales)), [371, 170]);
  dashboard.initializeDashboardDataset(rows);
  const activity947124Explorer = dashboard.buildActivityContributionConfig(activity947124, ["1000116858"]);
  assert.strictEqual(activity947124Explorer.compact, true);
  assert.strictEqual(activity947124Explorer.rows.length, 2);
  assert.strictEqual(activity947124Explorer.rows.reduce((sum, item) => sum + item.sales, 0), 541);
  assert(Math.abs(activity947124Explorer.rows.reduce((sum, item) => sum + item.share, 0) - 1) < 1e-12);
  assert.deepStrictEqual(plain(activity947124Explorer.rows.map((item) => [item.clientId, item.clientName, item.sales, item.rank])), [
    ["1000116858", "PLANTA SOACHA", 371, 1],
    ["1000134867", "PLANTA ARCILLA", 170, 2]
  ]);
  assert.strictEqual(activity947124Explorer.rows.filter((item) => item.isSelectedClient).length, 1);
  const realFilterClientRow = rows.find((row) => row["Cliente SAP - Clave"] === "1002559342");
  assert(realFilterClientRow);
  const realClientCatalog = dashboard.getCatalogOptionMetadata("Cliente SAP - Clave", "1002559342");
  assert.strictEqual(realClientCatalog.label, "1002559342");
  assert(realClientCatalog.description);
  assert(realClientCatalog.searchText.includes("1002559342"));
  const workbookFilterFrames = [];
  const originalWorkbookRaf = dashboard.window.requestAnimationFrame;
  const originalWorkbookCancelRaf = dashboard.window.cancelAnimationFrame;
  dashboard.window.requestAnimationFrame = (callback) => { workbookFilterFrames.push(callback); return workbookFilterFrames.length; };
  dashboard.window.cancelAnimationFrame = () => {};
  dashboard.updateDashboardFilters({ "ID Actividad": ["947124"] }, { replace: true, reason: "workbook-activity" });
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()), { "ID Actividad": ["947124"] });
  const workbookActivityFacets = dashboard.buildFacetedOptions(dashboard.getDashboardFilterState(), rows);
  assert.strictEqual(workbookActivityFacets.get("ID Actividad").find((item) => item.value === "947124").selected, true);
  dashboard.updateDashboardFilters({ "Cliente SAP - Clave": ["1002559342"] }, { reason: "workbook-client" });
  assert.deepStrictEqual(plain(dashboard.getDashboardFilterState()["Cliente SAP - Clave"]), ["1002559342"]);
  const workbookChipElement = makeElement();
  withDashboardElement("activeFilters", workbookChipElement, () => dashboard.renderActiveFilters());
  assert(workbookChipElement.innerHTML.includes("Actividad: 947124"));
  assert(workbookChipElement.innerHTML.includes("Cliente: 1002559342"));
  dashboard.updateDashboardFilters({ "Cliente SAP - Clave": ["NO-EXISTE"] }, { reason: "invalid-client" });
  assert.strictEqual(dashboard.getDashboardFilterState()["Cliente SAP - Clave"], undefined);
  dashboard.cancelPendingDashboardRender();
  dashboard.window.requestAnimationFrame = originalWorkbookRaf;
  dashboard.window.cancelAnimationFrame = originalWorkbookCancelRaf;
  const activity947124Rows = rows.filter((row) => row["ID Actividad"] === "947124");
  const activity947124Analysis = dashboard.buildDashboardAnalyses(activity947124Rows, dashboard.getNoSalesAnalysis(activity947124Rows), {
    scopeRows: rows,
    filters: { "ID Actividad": "947124" },
    activityAnalytics: analytics
  });
  const activity947124Model = dashboard.buildContextualKpiModel(activity947124Analysis, { "ID Actividad": "947124" });
  const activity947124Layout = dashboard.assignAdaptiveChartLayout(dashboard.getChartRegistry().filter((definition) => definition.shouldRender(activity947124Analysis)));
  assert.strictEqual(activity947124Model.items.length, 8);
  assert.strictEqual(activity947124Layout.find((item) => item.id === "negotiationTimeline").layoutClass, "chart-timeline");
  assert.strictEqual(activity947124Layout[0].id, "salesTarget");
  const activity947124Timeline = activity947124Analysis.timeline;
  const activity947124June = activity947124Timeline.periods.find((item) => item.periodKey === 202606);
  assert.strictEqual(activity947124Timeline.mode, "SINGLE_ACTIVITY");
  assert.strictEqual(activity947124Timeline.activities[0].isShared, true);
  assert.strictEqual(activity947124Timeline.activities[0].associatedClientCount, 2);
  assert.strictEqual(activity947124June.temporalStatus, "PERIODO_COMPARABLE");
  assert.strictEqual(activity947124June.sales, 541);
  assert.strictEqual(activity947124June.objective, 1100);
  assert(Math.abs(activity947124June.achievement - activity947124.achievement) < 1e-12);
  assert(activity947124Timeline.activities[0].startDate);
  assert(activity947124Timeline.activities[0].endDate);
  assert.strictEqual(activity947124Model.contextType, "SINGLE_SHARED_ACTIVITY");
  assert.strictEqual(activity947124Model.items.find((item) => item.id === "activityObjective").value, "1.100");
  assert.strictEqual(activity947124Model.items.find((item) => item.id === "associatedClients").value, "2");
  const activity947124ClientRows = activity947124Rows.filter((row) => row["Cliente SAP - Clave"] === "1000116858");
  const activity947124ClientAnalysis = dashboard.buildDashboardAnalyses(activity947124ClientRows, dashboard.getNoSalesAnalysis(activity947124ClientRows), {
    scopeRows: rows,
    filters: { "ID Actividad": "947124", "Cliente SAP - Clave": "1000116858" },
    activityAnalytics: analytics
  });
  const activity947124ClientModel = dashboard.buildContextualKpiModel(activity947124ClientAnalysis, { "ID Actividad": "947124", "Cliente SAP - Clave": "1000116858" });
  assert.strictEqual(activity947124ClientModel.contextType, "SINGLE_CLIENT_SHARED_ACTIVITY");
  assert.strictEqual(activity947124ClientModel.items.find((item) => item.id === "clientSales").value, "371");
  assert.strictEqual(activity947124ClientModel.items.find((item) => item.id === "activityObjective").value, "1.100");
  assert(activity947124ClientModel.items.some((item) => item.id === "clientContribution"));
  assert(activity947124ClientModel.items.some((item) => item.id === "clientRank"));
  const activity947124ClientTimeline = activity947124ClientAnalysis.timeline;
  const activity947124ClientJune = activity947124ClientTimeline.periods.find((item) => item.periodKey === 202606);
  assert.strictEqual(activity947124ClientJune.sales, 541);
  assert.strictEqual(activity947124ClientJune.clientContribution, 371);
  assert(!activity947124ClientJune.tooltipMessage.includes("cumplimiento del cliente"));
  const realIndividual = analytics.activityPerformance.find((item) => !item.isSharedActivity && item.comparable && item.period === 202606);
  assert(realIndividual);
  const realIndividualRows = rows.filter((row) => row["ID Actividad"] === realIndividual.activityId);
  const realIndividualAnalysis = dashboard.buildDashboardAnalyses(realIndividualRows, dashboard.getNoSalesAnalysis(realIndividualRows), {
    scopeRows: rows,
    filters: { "ID Actividad": realIndividual.activityId },
    activityAnalytics: analytics
  });
  const realIndividualModel = dashboard.buildContextualKpiModel(realIndividualAnalysis, { "ID Actividad": realIndividual.activityId });
  assert.strictEqual(realIndividualModel.contextType, "SINGLE_INDIVIDUAL_ACTIVITY");
  assert(realIndividualModel.items.some((item) => item.id === "activityObjective"));
  assert(!realIndividualModel.items.some((item) => item.id === "clientContribution" || item.id === "clientRank"));
  const realIndividualDetail = dashboard.buildIndividualActivityDetailConfig(realIndividual);
  assert.strictEqual(realIndividualDetail.type, "activityDetail");
  const individualDetailText = JSON.stringify(realIndividualDetail);
  assert(!individualDetailText.includes("Participación"));
  assert(!individualDetailText.includes("Posición"));
  assert(individualDetailText.includes("549,25"));
  assert(individualDetailText.includes("500"));
  const requiredIndividual = analytics.activityPerformance.find((item) => item.activityId === "874894" && item.period === 202606);
  assert(requiredIndividual);
  const requiredIndividualRows = rows.filter((row) => row["ID Actividad"] === "874894");
  const requiredIndividualAnalysis = dashboard.buildDashboardAnalyses(requiredIndividualRows, dashboard.getNoSalesAnalysis(requiredIndividualRows), {
    scopeRows: rows,
    filters: { "ID Actividad": "874894" },
    activityAnalytics: analytics
  });
  const requiredIndividualTimeline = requiredIndividualAnalysis.timeline;
  const requiredIndividualKpis = dashboard.buildContextualKpiModel(requiredIndividualAnalysis, { "ID Actividad": "874894" });
  const requiredIndividualLayout = dashboard.assignAdaptiveChartLayout(dashboard.getChartRegistry().filter((definition) => definition.shouldRender(requiredIndividualAnalysis)));
  assert.strictEqual(requiredIndividualKpis.items.length, 8);
  assert.strictEqual(requiredIndividualLayout.find((item) => item.id === "negotiationTimeline").layoutClass, "chart-timeline");
  assert(!requiredIndividualLayout.some((item) => item.id === "activityContribution"));
  const requiredIndividualJune = requiredIndividualTimeline.periods.find((item) => item.periodKey === 202606);
  assert.strictEqual(requiredIndividualTimeline.activities[0].isShared, false);
  assert.strictEqual(requiredIndividualJune.sales, 549.252);
  assert.strictEqual(requiredIndividualJune.objective, 500);
  assert(!requiredIndividualTimeline.accessibleSummary.includes("compartida"));
  const client1002559342Rows = rows.filter((row) => row["Cliente SAP - Clave"] === "1002559342");
  const client1002559342Analysis = dashboard.buildDashboardAnalyses(client1002559342Rows, dashboard.getNoSalesAnalysis(client1002559342Rows), {
    scopeRows: rows,
    filters: { "Cliente SAP - Clave": "1002559342" },
    activityAnalytics: analytics
  });
  const clientTimeline = client1002559342Analysis.timeline;
  const clientKpiModel = dashboard.buildContextualKpiModel(client1002559342Analysis, { "Cliente SAP - Clave": "1002559342" });
  const clientChartLayout = dashboard.assignAdaptiveChartLayout(dashboard.getChartRegistry().filter((definition) => definition.shouldRender(client1002559342Analysis)));
  assert(clientKpiModel.items.length > 0 && clientKpiModel.items.length <= 8);
  assert.strictEqual(clientChartLayout.find((item) => item.id === "negotiationTimeline").layoutClass, "chart-timeline");
  assert.strictEqual(clientTimeline.mode, "CLIENT_CONTEXT");
  assert.strictEqual(clientTimeline.activities.length, 2);
  assert.deepStrictEqual(plain(clientTimeline.activities.map((item) => item.activityId).sort()), ["965821", "965923"]);
  const clientMay = clientTimeline.periods.find((item) => item.periodKey === 202605);
  const clientJune = clientTimeline.periods.find((item) => item.periodKey === 202606);
  const clientJuly = clientTimeline.periods.find((item) => item.periodKey === 202607);
  assert.strictEqual(clientMay.temporalStatus, "HISTORICO_PREVIO");
  assert.strictEqual(clientJune.temporalStatus, "HISTORICO_PREVIO");
  assert.strictEqual(clientMay.sales, 53956);
  assert.strictEqual(clientJune.sales, 67401);
  assert.strictEqual(clientJuly.temporalStatus, "VIGENTE_SIN_VENTA_ATRIBUIBLE");
  assert.strictEqual(clientJuly.sales, null);
  assert.strictEqual(clientTimeline.nextStartDate, "2026-07-01");
  assert.strictEqual(clientTimeline.comparablePeriodCount, 0);
  assert(clientTimeline.accessibleSummary.includes("Períodos históricos: 2"));
  assert(clientTimeline.accessibleSummary.includes("01/07/2026"));
  const granularActivity = analytics.activityPerformance.find((item) => item.activityId === "949461" && item.period === 202606);
  assert(granularActivity);
  assert(granularActivity.contributionRows.every((row) => row.source === "VENTAS_FISICAS_ACTIVIDAD"));
  const quality = app.buildDataQualityReport(rows);
  assert.strictEqual(quality.sharedActivities, 37);
  assert.strictEqual(quality.ambiguousActivityPeriods, 3);
  assert.strictEqual(quality.conflictingActivityDates, 7);
  const dashboardHtml = dashboard.generatedHtml({ rows, metadata: { qualityWarnings: quality } });
  const inlineScripts = Array.from(dashboardHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g), (match) => match[1]);
  assert.strictEqual(inlineScripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(inlineScripts[0], { filename: "dashboard-multicliente.html" }));
  assert(!/Cumplimiento del cliente|Objetivo del cliente/.test(dashboardHtml));
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sumChartValues(items) {
  return items.reduce((acc, item) => acc + item.value, 0);
}

function makeElement() {
  let html = "";
  const listeners = {};
  const element = {
    id: "",
    style: {},
    dataset: {},
    hidden: false,
    textContent: "",
    value: "",
    disabled: false,
    offsetParent: {},
    focused: false,
    attributes: {},
    __children: [],
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    listenerCount(type) {
      return (listeners[type] || []).length;
    },
    setAttribute(name, value) {
      element.attributes[name] = String(value);
    },
    getAttribute(name) {
      return element.attributes[name];
    },
    dispatch(type, event = {}) {
      (listeners[type] || []).forEach((handler) =>
        handler(Object.assign({ target: element, preventDefault() {}, key: "", shiftKey: false }, event))
      );
    },
    focus() {
      element.focused = true;
      dashboard.document.activeElement = element;
    },
    querySelectorAll(selector) {
      if (selector.includes("data-chart")) {
        return element.__children.filter((node) => node.dataset.chartDrilldownValue || node.dataset.chartFilterField);
      }
      return [];
    }
  };
  Object.defineProperty(element, "innerHTML", {
    get() {
      return html;
    },
    set(value) {
      html = String(value);
      element.__children = parseInteractiveNodes(html);
    }
  });
  return element;
}

function makeDetailExplorerElements() {
  return {
    detailExplorerOverlay: makeElement(),
    detailExplorerDialog: makeElement(),
    detailExplorerTitle: makeElement(),
    detailExplorerSubtitle: makeElement(),
    detailExplorerBack: makeElement(),
    detailExplorerClose: makeElement(),
    detailExplorerSelectionMessage: makeElement(),
    detailExplorerSummary: makeElement(),
    detailExplorerToolbar: makeElement(),
    detailExplorerBody: makeElement()
  };
}

function withDashboardElement(id, element, callback) {
  withDashboardElements({ [id]: element }, callback);
}

function withDashboardElements(elements, callback) {
  const originalGetElementById = dashboard.document.getElementById;
  const originalActiveElement = dashboard.document.activeElement;
  Object.keys(elements).forEach((id) => {
    elements[id].id = id;
  });
  dashboard.document.getElementById = function getElementById(requestedId) {
    if (elements[requestedId]) {
      return elements[requestedId];
    }
    return originalGetElementById.call(this, requestedId);
  };
  try {
    callback();
  } finally {
    dashboard.document.getElementById = originalGetElementById;
    dashboard.document.activeElement = originalActiveElement;
  }
}

function parseInteractiveNodes(html) {
  const nodes = [];
  const drilldownRegex = /<[^>]*data-chart-drilldown-value="([^"]+)"[^>]*>/g;
  let match;
  while ((match = drilldownRegex.exec(html))) {
    nodes.push(makeInteractiveNode({ chartDrilldownValue: decodeHtml(match[1]) }));
  }
  const filterRegex = /<[^>]*data-chart-filter-field="([^"]+)"[^>]*data-chart-filter-value="([^"]+)"[^>]*>/g;
  while ((match = filterRegex.exec(html))) {
    nodes.push(makeInteractiveNode({ chartFilterField: decodeHtml(match[1]), chartFilterValue: decodeHtml(match[2]) }));
  }
  return nodes;
}

function makeInteractiveNode(dataset) {
  const listeners = {};
  return {
    dataset,
    style: {},
    disabled: false,
    offsetParent: {},
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    dispatch(type, event = {}) {
      (listeners[type] || []).forEach((handler) =>
        handler(Object.assign({ target: this, preventDefault() {}, key: "", shiftKey: false }, event))
      );
    }
  };
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function findDuplicateHtmlIds(html) {
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
  const seen = new Set();
  return ids.filter((id) => {
    if (seen.has(id)) {
      return true;
    }
    seen.add(id);
    return false;
  });
}

function countOccurrences(text, pattern) {
  return text.split(pattern).length - 1;
}

function normalize(overrides) {
  return app.normalizeRow(Object.assign(baseRawRow(), overrides));
}

function normalizeNoSalesObjective(options = {}) {
  return normalize({
    "Año Mes": options.month || "",
    "Categoría AS400 de la venta": options.category || "Gaseosa",
    "Presentación AS400 de la venta - Texto": options.presentationName || "Cola sin venta",
    "Presentación AS400 de la venta - Clave": options.presentationCode || "P-OBJ",
    "Cliente SAP - Clave": options.clientId || "C-OBJ",
    "ID Actividad": options.activityId || "A-OBJ",
    "Objetivo mes ": Object.prototype.hasOwnProperty.call(options, "objectiveMonth") ? options.objectiveMonth : "1.500",
    "Objetivo cajas total": Object.prototype.hasOwnProperty.call(options, "objectiveTotal") ? options.objectiveTotal : "36.000",
    "Fecha inicio": options.startDate || "2026-01-01",
    "Fecha fin": options.endDate || "2026-12-31",
    "Periodo negociacion": options.period || "12",
    "Ventas cajas físicas (sin rep)": "0"
  });
}

function normalizeKpiRow(options = {}) {
  return normalize({
    "Año": "2026",
    "Mes": "Julio",
    "Año Mes": options.yearMonth || "202607",
    "Centro - Clave": "001",
    "Canal": "Tradicional",
    "Región SAP": options.region || "Antioquia",
    "Categoría AS400 de la venta": "Gaseosa",
    "Nit cliente - Clave": options.nit || "900001",
    "Cliente AS400 - Texto": options.clientAs400 || "Cliente prueba",
    "Cliente SAP - Clave": options.clientId || "C-KPI",
    "Cliente AS400 - Nombre negocio (Texto)": options.clientName || "Negocio KPI",
    "Presentación AS400 de la venta - Texto": options.presentationName || "Cola KPI",
    "Presentación AS400 de la venta - Clave": options.presentationCode || "P-KPI",
    "ID Actividad": options.activityId || "A-KPI",
    "Ventas cajas físicas (sin rep)": Object.prototype.hasOwnProperty.call(options, "sales") ? options.sales : "120",
    "TotalVentaMes": Object.prototype.hasOwnProperty.call(options, "sales") ? options.sales : "120",
    "Objetivo mes ": Object.prototype.hasOwnProperty.call(options, "objectiveMonth") ? options.objectiveMonth : "100",
    "Objetivo cajas total": Object.prototype.hasOwnProperty.call(options, "objectiveTotal") ? options.objectiveTotal : "1200",
    "Fecha inicio": options.startDate || "2026-01-01",
    "Fecha fin": options.endDate || "2026-12-31"
  });
}

function normalizeActivityRow(options = {}) {
  return normalize({
    "Año": Object.prototype.hasOwnProperty.call(options, "year") ? options.year : "2026",
    "Mes": Object.prototype.hasOwnProperty.call(options, "month") ? options.month : "JUL",
    "Año Mes": Object.prototype.hasOwnProperty.call(options, "yearMonth") ? options.yearMonth : "202607",
    "Centro - Clave": "001",
    "Canal": "Tradicional",
    "Región SAP": "Centro Sur",
    "Categoría AS400 de la venta": options.category || "Gaseosa",
    "Nit cliente - Clave": options.nit || "900001",
    "Cliente AS400 - Texto": options.clientName || ("Cliente " + (options.clientId || "C-ACT")),
    "Cliente SAP - Clave": options.clientId || "C-ACT",
    "Cliente AS400 - Nombre negocio (Texto)": options.clientName || ("Negocio " + (options.clientId || "C-ACT")),
    "Presentación AS400 de la venta - Texto": options.presentationName || ("Presentación " + (options.presentationCode || "P-ACT")),
    "Presentación AS400 de la venta - Clave": options.presentationCode || "P-ACT",
    "ID Actividad": options.activityId || "A-ACT",
    "Ventas cajas físicas (sin rep)": Object.prototype.hasOwnProperty.call(options, "physicalSales") ? options.physicalSales : (options.totalSales || "0"),
    "TotalVentaMes": Object.prototype.hasOwnProperty.call(options, "totalSales") ? options.totalSales : "0",
    "Objetivo mes ": Object.prototype.hasOwnProperty.call(options, "objectiveMonth") ? options.objectiveMonth : "100",
    "Objetivo cajas total": Object.prototype.hasOwnProperty.call(options, "objectiveTotal") ? options.objectiveTotal : "1200",
    "Fecha inicio": Object.prototype.hasOwnProperty.call(options, "startDate") ? options.startDate : "2026-01-01",
    "Fecha fin": Object.prototype.hasOwnProperty.call(options, "endDate") ? options.endDate : "2026-12-31"
  });
}

function baseRawRow() {
  return REQUIRED_COLUMNS.reduce((row, column) => {
    row[column] = "";
    return row;
  }, {});
}

function processWorkbook(workbookPath) {
  const matrix = readXlsxFirstSheet(workbookPath);
  assert(matrix.length > 1, "El Excel debe contener encabezados y filas de datos.");
  const headers = matrix[0].map(app.normalizeCellText);
  const headerMap = app.buildHeaderMap(headers);
  return matrix
    .slice(1)
    .filter((row) => row && !row.every(app.isEmptyCell))
    .map((row) => {
      const rowObject = {};
      REQUIRED_COLUMNS.forEach((column) => {
        const actualIndex = app.getHeaderIndex(headerMap, column);
        rowObject[column] = actualIndex === undefined ? null : row[actualIndex];
      });
      return app.normalizeRow(rowObject);
    });
}

function readXlsxFirstSheet(workbookPath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-xlsx-"));
  try {
    childProcess.execFileSync("tar", ["-xf", workbookPath, "-C", tempDir], { stdio: "ignore" });
    const workbookXml = fs.readFileSync(path.join(tempDir, "xl", "workbook.xml"), "utf8");
    const firstSheet = workbookXml.match(/<sheet\b[^>]*r:id="([^"]+)"/);
    let sheetPath = path.join(tempDir, "xl", "worksheets", "sheet1.xml");

    if (firstSheet) {
      const relsXml = fs.readFileSync(path.join(tempDir, "xl", "_rels", "workbook.xml.rels"), "utf8");
      const relMatch = relsXml.match(new RegExp('<Relationship[^>]*Id="' + escapeRegExp(firstSheet[1]) + '"[^>]*Target="([^"]+)"'));
      if (relMatch) {
        const target = relMatch[1].replace(/^\/+/, "");
        sheetPath = path.join(tempDir, target.startsWith("xl/") ? target : path.join("xl", target));
      }
    }

    const sharedStringsPath = path.join(tempDir, "xl", "sharedStrings.xml");
    const sharedStrings = fs.existsSync(sharedStringsPath)
      ? parseSharedStrings(fs.readFileSync(sharedStringsPath, "utf8"))
      : [];
    return parseSheetRows(fs.readFileSync(sheetPath, "utf8"), sharedStrings);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function parseSharedStrings(xml) {
  return Array.from(xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map((match) => {
    const textParts = Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((textMatch) =>
      decodeXml(textMatch[1])
    );
    return textParts.join("");
  });
}

function parseSheetRows(xml, sharedStrings) {
  const matrix = [];
  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(getXmlAttribute(rowMatch[1], "r")) || matrix.length + 1;
    const row = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1] || cellMatch[2] || "";
      const body = cellMatch[3] || "";
      const ref = getXmlAttribute(attrs, "r");
      const columnIndex = columnLettersToIndex((ref.match(/[A-Z]+/) || ["A"])[0]);
      row[columnIndex] = parseCellValue(attrs, body, sharedStrings);
    }
    matrix[rowNumber - 1] = row;
  }
  return matrix.filter((row) => row && row.some((value) => value !== null && value !== undefined && String(value).trim() !== ""));
}

function parseCellValue(attrs, body, sharedStrings) {
  const type = getXmlAttribute(attrs, "t");
  const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
  if (type === "inlineStr") {
    const textMatch = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/);
    return textMatch ? decodeXml(textMatch[1]) : "";
  }
  if (!valueMatch) {
    return "";
  }
  const rawValue = decodeXml(valueMatch[1]);
  if (type === "s") {
    return sharedStrings[Number(rawValue)] ?? "";
  }
  if (type === "b") {
    return rawValue === "1";
  }
  const numeric = Number(rawValue);
  return Number.isFinite(numeric) ? numeric : rawValue;
}

function getXmlAttribute(attrs, name) {
  const match = attrs.match(new RegExp("\\b" + escapeRegExp(name) + '="([^"]*)"'));
  return match ? decodeXml(match[1]) : "";
}

function columnLettersToIndex(letters) {
  return letters.split("").reduce((acc, letter) => acc * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function decodeXml(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
