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
  "ID Actividad",
  "Fecha inicio",
  "Fecha fin",
  "Objetivo cajas total",
  "Tipo descuento",
  "Porcentaje descuento",
  "Periodo negociacion",
  "Cedi"
];

const app = loadAppContext();
const dashboard = loadDashboardContext();

runSyntheticTests();
runAttachedWorkbookValidation();

console.log("sales-information.test.js: OK");

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

  const onlyMissingCategory = dashboard.getNoSalesAnalysis([withoutSalesWithoutCategory]);
  const messageElement = makeElement();
  withDashboardElement("chartSinVentasCategoria", messageElement, () => {
    dashboard.renderNoSalesCategoryChart(onlyMissingCategory);
  });
  assert(messageElement.innerHTML.includes("categoría disponible"));

  const repeatedRenderElement = makeElement();
  withDashboardElement("chartSinVentasCategoria", repeatedRenderElement, () => {
    dashboard.renderNoSalesCategoryChart(noSalesByClient);
    const firstRender = repeatedRenderElement.innerHTML;
    dashboard.renderNoSalesCategoryChart(noSalesByClient);
    assert.strictEqual(repeatedRenderElement.innerHTML, firstRender);
    assert(!repeatedRenderElement.innerHTML.includes("No hay datos para mostrar"));
  });

  const drilldownAnalysis = dashboard.getNoSalesAnalysis([
    withoutSales,
    withoutSalesSameClient,
    withoutSalesGaseosaHighObjective
  ]);
  const explorerElements = makeDetailExplorerElements();
  const chartElement = makeElement();
  const opener = makeElement();
  dashboard.document.activeElement = opener;
  withDashboardElements(Object.assign({ chartSinVentasCategoria: chartElement }, explorerElements), () => {
    dashboard.renderNoSalesCategoryChart(drilldownAnalysis);
    const gaseosaNode = chartElement.__children.find((node) => node.dataset.chartDrilldownValue === "Gaseosa");
    assert(gaseosaNode, "El fallback nativo debe crear nodos clicables por categoría.");
    gaseosaNode.dispatch("click");

    const explorerState = dashboard.getDetailExplorerState();
    assert.strictEqual(explorerElements.detailExplorerOverlay.hidden, false);
    assert(explorerElements.detailExplorerTitle.textContent.includes("Gaseosa"));
    assert.strictEqual(explorerState.allRows.length, 2);
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Manzana Pet 250x12"));
    assert(explorerElements.detailExplorerBody.innerHTML.includes("Cola Max 400x12"));
    assert(!explorerElements.detailExplorerBody.innerHTML.includes("Squash Pet 500x12"));
    assert.strictEqual(countOccurrences(explorerElements.detailExplorerBody.innerHTML, "<th "), 5);
    assert(!explorerElements.detailExplorerBody.innerHTML.includes("Objetivo cajas total"));

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
    assert(exportedCsv.includes("Objetivo mes"));
    assert(exportedCsv.includes("Objetivo cajas total"));
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
    [{ label: "Antioquia", value: 0 }]
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
  assert(html.includes("Presentaciones sin ventas por categoría"));
  assert(html.includes("detailExplorerOverlay"));
  assert(!html.includes("withoutSalesTable"));
  assert(!html.includes("Detalle de presentaciones sin ventas"));
  assert(!html.includes("Sin dato"));
  assert.deepStrictEqual(findDuplicateHtmlIds(html), []);

  const templateSource = fs.readFileSync(path.join(ROOT, "dashboard-template.js"), "utf8");
  assert.strictEqual(countOccurrences(templateSource, "function generateDashboardHtml"), 1);
  assert.strictEqual(countOccurrences(templateSource, "function dashboardCss"), 1);
  assert.strictEqual(countOccurrences(templateSource, "function dashboardScript"), 1);
  assert(!templateSource.includes("dashboard-shell"));
  assert(!templateSource.includes("kpiGrid"));
}

function runAttachedWorkbookValidation() {
  const workbookPath =
    process.env.PRUEBA_DASHBOARD_XLSX || path.join(os.homedir(), "Downloads", "PruebaDashboard.xlsx");
  if (!fs.existsSync(workbookPath)) {
    console.warn("PruebaDashboard.xlsx no encontrado; se omite validación del archivo adjunto.");
    return;
  }

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
    __children: [],
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
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
