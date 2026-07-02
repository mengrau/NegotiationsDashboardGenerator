"use strict";

function generateDashboardHtml(payload) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const metadata = payload.metadata || {};
  const quality = payload.quality || {};
  const dataJson = safeJson(rows);
  const metadataJson = safeJson(metadata);
  const qualityJson = safeJson(quality);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Negociaciones</title>
    <style>
${dashboardCss()}
    </style>
  </head>
  <body>
    <header class="dash-header">
      <div>
        <p class="eyebrow">Resumen Ejecutivo</p>
        <h1>Negociaciones</h1>
        <p>Resumen interactivo de negociaciones</p>
      </div>
      <dl class="header-meta">
        <div><dt>Fuente</dt><dd id="sourceFileName">-</dd></div>
        <div><dt>Fecha de generación</dt><dd id="generatedAt">-</dd></div>
        <div><dt>Filas procesadas</dt><dd id="processedRows">0</dd></div>
      </dl>
    </header>

    <main class="dashboard-shell">
      <section class="filters-panel">
        <div class="section-heading">
          <h2>Filtros</h2>
          <button id="clearFiltersButton" class="button ghost" type="button">Limpiar filtros</button>
        </div>
        <div id="filtersGrid" class="filters-grid"></div>
      </section>

      <section id="kpiGrid" class="kpi-grid" aria-label="Indicadores principales"></section>

      <section class="charts-grid">
        <article class="chart-card"><h2>Ventas por Región SAP</h2><div id="chartRegion" class="chart"></div></article>
        <article class="chart-card"><h2>Ventas por Canal</h2><div id="chartCanal" class="chart"></div></article>
        <article class="chart-card"><h2>Ventas por Categoría</h2><div id="chartCategoria" class="chart"></div></article>
        <article class="chart-card"><h2>Top 10 clientes</h2><div id="chartClientes" class="chart"></div></article>
        <article class="chart-card"><h2>Top 10 presentaciones</h2><div id="chartPresentaciones" class="chart"></div></article>
        <article class="chart-card"><h2>Cumplimiento por Cedi</h2><div id="chartCedi" class="chart"></div></article>
        <article class="chart-card wide"><h2>Ventas por Mes o Año Mes</h2><div id="chartMes" class="chart vertical-chart"></div></article>
      </section>

      <section class="table-panel">
        <div class="section-heading">
          <h2>Tabla de detalle</h2>
          <button id="exportCsvButton" class="button primary" type="button">Exportar CSV</button>
        </div>
        <div class="table-tools">
          <label>Buscar <input id="searchInput" type="search" placeholder="Buscar en datos filtrados"></label>
          <label>Filas <select id="pageSizeSelect"><option>10</option><option>25</option><option>50</option><option>100</option></select></label>
        </div>
        <div class="table-wrap">
          <table id="detailTable"></table>
        </div>
        <div class="pagination">
          <button id="prevPageButton" class="button ghost" type="button">Anterior</button>
          <span id="pageInfo">Página 1</span>
          <button id="nextPageButton" class="button ghost" type="button">Siguiente</button>
        </div>
      </section>

      <section class="quality-panel">
        <div class="section-heading">
          <h2>Calidad de datos</h2>
          <span id="qualityGeneratedAt" class="pill">-</span>
        </div>
        <div id="qualityGrid" class="quality-grid"></div>
      </section>
    </main>

    <script>
const DASHBOARD_DATA = ${dataJson};
const DASHBOARD_META = ${metadataJson};
const DASHBOARD_QUALITY = ${qualityJson};
${dashboardScript()}
    <\/script>
  </body>
</html>`;
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function dashboardCss() {
  return `
:root {
  --bg: #f3f6f8;
  --panel: #ffffff;
  --ink: #17212f;
  --muted: #667085;
  --line: #d9e2ea;
  --brand: #0f766e;
  --brand-dark: #115e59;
  --blue: #2563eb;
  --green: #16803c;
  --amber: #b45309;
  --red: #b42318;
  --shadow: 0 14px 38px rgba(15, 23, 42, 0.08);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
}
button, input, select { font: inherit; }
.dash-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 480px);
  gap: 24px;
  align-items: end;
  padding: 30px clamp(18px, 4vw, 48px);
  background: #ffffff;
  border-bottom: 1px solid var(--line);
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--brand);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
h1, h2, p { margin-top: 0; }
h1 {
  margin-bottom: 10px;
  font-size: clamp(2rem, 3.6vw, 3.2rem);
  line-height: 1.05;
}
h2 {
  margin-bottom: 0;
  font-size: 1.03rem;
}
.dash-header p {
  margin-bottom: 0;
  color: var(--muted);
}
.header-meta {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fafc;
}
.header-meta div {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 10px;
}
.header-meta dt {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
.header-meta dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 800;
}
.dashboard-shell {
  width: min(1500px, calc(100% - 36px));
  margin: 24px auto 44px;
}
.filters-panel,
.chart-card,
.table-panel,
.quality-panel,
.kpi-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.filters-panel,
.table-panel,
.quality-panel {
  padding: 18px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
select,
input {
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  color: var(--ink);
  text-transform: none;
  font-weight: 600;
}
.button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 900;
}
.button.primary {
  background: var(--brand);
  color: #ffffff;
}
.button.ghost {
  border-color: var(--line);
  background: #ffffff;
  color: var(--ink);
}
.button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0;
}
.kpi-card {
  min-height: 118px;
  padding: 16px;
}
.kpi-card span {
  display: block;
  min-height: 34px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
.kpi-card strong {
  display: block;
  margin-top: 8px;
  font-size: 1.65rem;
  line-height: 1.1;
}
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.chart-card {
  min-height: 330px;
  padding: 18px;
}
.chart-card.wide {
  grid-column: 1 / -1;
}
.chart {
  display: grid;
  gap: 10px;
  min-height: 250px;
  margin-top: 16px;
}
.bar-row {
  display: grid;
  grid-template-columns: minmax(120px, 34%) minmax(0, 1fr) minmax(90px, auto);
  gap: 10px;
  align-items: center;
}
.bar-label {
  overflow: hidden;
  color: #344054;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-track {
  height: 18px;
  overflow: hidden;
  border-radius: 999px;
  background: #e9eef3;
}
.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--brand), var(--blue));
}
.bar-value {
  color: #344054;
  font-variant-numeric: tabular-nums;
  font-weight: 900;
  text-align: right;
}
.vertical-chart {
  display: flex;
  align-items: end;
  gap: 10px;
  min-height: 310px;
  padding-top: 22px;
  overflow-x: auto;
}
.vbar {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 8px;
  align-items: end;
  width: max(44px, calc(100% / 18));
  min-width: 44px;
  height: 280px;
}
.vbar-fill {
  width: 100%;
  min-height: 2px;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, var(--blue), var(--brand));
}
.vbar-label {
  overflow: hidden;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 900;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-panel {
  margin-top: 18px;
}
.table-tools {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 140px;
  gap: 12px;
  margin-bottom: 14px;
}
.table-wrap {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
}
table {
  width: 100%;
  min-width: 1300px;
  border-collapse: collapse;
}
th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  font-size: 0.88rem;
  text-align: left;
  vertical-align: top;
}
th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #eef4f7;
  color: #344054;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
tbody tr:hover {
  background: #f8fafc;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
  margin-top: 14px;
}
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef2f6;
  color: #475467;
  font-size: 0.78rem;
  font-weight: 900;
}
.quality-panel {
  margin-top: 18px;
}
.quality-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.quality-item {
  min-height: 86px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfdfe;
}
.quality-item span {
  display: block;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
.quality-item strong {
  display: block;
  margin-top: 8px;
  font-size: 1.35rem;
}
.no-data {
  display: grid;
  place-items: center;
  min-height: 180px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-weight: 800;
  text-align: center;
}
@media (max-width: 1100px) {
  .dash-header,
  .filters-grid,
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .kpi-grid,
  .quality-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .dashboard-shell {
    width: calc(100% - 24px);
  }
  .kpi-grid,
  .quality-grid,
  .table-tools {
    grid-template-columns: 1fr;
  }
  .header-meta div {
    grid-template-columns: 1fr;
  }
}
`;
}

function dashboardScript() {
  return `
const FILTER_FIELDS = [
  { field: "Año", label: "Año" },
  { field: "Mes", label: "Mes" },
  { field: "Región SAP", label: "Región SAP" },
  { field: "Canal", label: "Canal" },
  { field: "Categoría AS400 de la venta", label: "Categoría" },
  { field: "Cedi", label: "Cedi" },
  { field: "Estado de vigencia", label: "Estado de vigencia" }
];

const TABLE_COLUMNS = [
  "Año",
  "Mes",
  "Canal",
  "Categoría AS400 de la venta",
  "Región SAP",
  "Cedi",
  "Cliente AS400 - Texto",
  "Cliente SAP - Clave",
  "Presentación AS400 de la venta - Texto",
  "Ventas cajas físicas mes (sin rep)",
  "Ventas acumuladas negociacion",
  "Objetivo cajas total",
  "Porcentaje descuento",
  "Fecha inicio",
  "Fecha fin",
  "Estado de vigencia"
];

const NUMERIC_FIELDS = new Set([
  "Año",
  "Año Mes",
  "Ventas cajas físicas mes (sin rep)",
  "Ventas acumuladas negociacion",
  "Objetivo cajas total",
  "Porcentaje descuento"
]);

const state = {
  filters: {},
  filteredRows: [],
  search: "",
  page: 1,
  pageSize: 10,
  sortField: "Ventas cajas físicas mes (sin rep)",
  sortDir: "desc"
};

document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  document.getElementById("sourceFileName").textContent = DASHBOARD_META.sourceFileName || "-";
  document.getElementById("generatedAt").textContent = formatDateTime(DASHBOARD_META.generatedAt);
  document.getElementById("processedRows").textContent = formatInteger(DASHBOARD_DATA.length);
  populateFilters();
  bindDashboardEvents();
  renderQuality();
  renderAll();
}

function bindDashboardEvents() {
  document.getElementById("clearFiltersButton").addEventListener("click", function () {
    state.filters = {};
    document.querySelectorAll("[data-filter-field]").forEach(function (select) {
      select.value = "";
    });
    state.page = 1;
    renderAll();
  });

  document.getElementById("searchInput").addEventListener("input", function (event) {
    state.search = event.target.value.trim().toLocaleLowerCase("es-CO");
    state.page = 1;
    renderTable();
  });

  document.getElementById("pageSizeSelect").addEventListener("change", function (event) {
    state.pageSize = Number(event.target.value) || 10;
    state.page = 1;
    renderTable();
  });

  document.getElementById("prevPageButton").addEventListener("click", function () {
    state.page = Math.max(1, state.page - 1);
    renderTable();
  });

  document.getElementById("nextPageButton").addEventListener("click", function () {
    const totalPages = getTotalPages(getTableRows());
    state.page = Math.min(totalPages, state.page + 1);
    renderTable();
  });

  document.getElementById("exportCsvButton").addEventListener("click", function () {
    const csv = exportFilteredCsv(getTableRows());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "datos_filtrados.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

function populateFilters() {
  const container = document.getElementById("filtersGrid");
  container.innerHTML = FILTER_FIELDS.map(function (item) {
    const options = item.field === "Estado de vigencia"
      ? ["Vigente", "No vigente", "Sin fechas"]
      : getUniqueOptions(DASHBOARD_DATA, item.field);
    return "<label>" + escapeHtml(item.label) +
      "<select data-filter-field=\\"" + escapeHtml(item.field) + "\\">" +
      "<option value=\\"\\">Todos</option>" +
      options.map(function (option) {
        return "<option value=\\"" + escapeHtml(option) + "\\">" + escapeHtml(option) + "</option>";
      }).join("") +
      "</select></label>";
  }).join("");

  container.querySelectorAll("select").forEach(function (select) {
    select.addEventListener("change", function (event) {
      const field = event.target.dataset.filterField;
      state.filters[field] = event.target.value;
      state.page = 1;
      renderAll();
    });
  });
}

function renderAll() {
  state.filteredRows = applySearch(applyFilters(DASHBOARD_DATA, state.filters));
  renderKpis(state.filteredRows);
  renderCharts(state.filteredRows);
  renderTable();
}

function computeKpis(rows) {
  const salesMonth = sumField(rows, "Ventas cajas físicas mes (sin rep)");
  const accumulatedSales = sumField(rows, "Ventas acumuladas negociacion");
  const objective = sumField(rows, "Objetivo cajas total");
  const discounts = rows.map(function (row) {
    return row["Porcentaje descuento"];
  }).filter(function (value) {
    return typeof value === "number" && Number.isFinite(value);
  });

  return {
    salesMonth: salesMonth,
    accumulatedSales: accumulatedSales,
    objective: objective,
    compliance: objective ? accumulatedSales / objective : null,
    missingBoxes: objective - accumulatedSales,
    uniqueClients: countUnique(rows, "Nit cliente - Clave"),
    uniquePresentations: countUnique(rows, "Presentación AS400 de la venta - Clave"),
    uniqueActivities: countUnique(rows, "ID Actividad"),
    averageDiscount: discounts.length ? discounts.reduce(function (acc, value) { return acc + value; }, 0) / discounts.length : null,
    activeNegotiations: rows.filter(function (row) { return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === "Vigente"; }).length
  };
}

function renderKpis(rows) {
  const kpis = computeKpis(rows);
  const items = [
    ["Total ventas cajas físicas mes", formatNumber(kpis.salesMonth)],
    ["Total ventas acumuladas negociación", formatNumber(kpis.accumulatedSales)],
    ["Total objetivo cajas", formatNumber(kpis.objective)],
    ["Cumplimiento", kpis.compliance === null ? "N/A" : formatPercent(kpis.compliance)],
    ["Cajas faltantes", formatNumber(kpis.missingBoxes)],
    ["Clientes únicos", formatInteger(kpis.uniqueClients)],
    ["Presentaciones únicas", formatInteger(kpis.uniquePresentations)],
    ["Actividades únicas", formatInteger(kpis.uniqueActivities)],
    ["Descuento promedio", kpis.averageDiscount === null ? "N/A" : formatPercent(kpis.averageDiscount)],
    ["Negociaciones vigentes", formatInteger(kpis.activeNegotiations)]
  ];

  document.getElementById("kpiGrid").innerHTML = items.map(function (item) {
    return "<article class=\\"kpi-card\\"><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></article>";
  }).join("");
}

function renderCharts(rows) {
  renderBarChart("chartRegion", groupBySum(rows, "Región SAP", "Ventas cajas físicas mes (sin rep)").slice(0, 12), false);
  renderBarChart("chartCanal", groupBySum(rows, "Canal", "Ventas cajas físicas mes (sin rep)").slice(0, 12), false);
  renderBarChart("chartCategoria", groupBySum(rows, "Categoría AS400 de la venta", "Ventas cajas físicas mes (sin rep)").slice(0, 12), false);
  renderBarChart("chartClientes", groupBySum(rows, "Cliente AS400 - Texto", "Ventas cajas físicas mes (sin rep)").slice(0, 10), false);
  renderBarChart("chartPresentaciones", groupBySum(rows, "Presentación AS400 de la venta - Texto", "Ventas cajas físicas mes (sin rep)").slice(0, 10), false);
  renderBarChart("chartCedi", complianceByField(rows, "Cedi").slice(0, 12), true);
  renderVerticalChart("chartMes", salesByMonth(rows));
}

function renderBarChart(elementId, items, asPercent) {
  const element = document.getElementById(elementId);
  if (!items.length) {
    element.innerHTML = "<div class=\\"no-data\\">No hay datos para mostrar con los filtros seleccionados.</div>";
    return;
  }

  const max = Math.max.apply(null, items.map(function (item) { return Math.abs(item.value); })) || 1;
  element.innerHTML = items.map(function (item) {
    const width = Math.max(2, Math.min(100, Math.abs(item.value) / max * 100));
    const valueText = asPercent ? formatPercent(item.value) : formatNumber(item.value);
    return "<div class=\\"bar-row\\" title=\\"" + escapeHtml(item.label + ": " + valueText) + "\\">" +
      "<div class=\\"bar-label\\">" + escapeHtml(item.label) + "</div>" +
      "<div class=\\"bar-track\\"><div class=\\"bar-fill\\" style=\\"width:" + width.toFixed(2) + "%\\"></div></div>" +
      "<div class=\\"bar-value\\">" + escapeHtml(valueText) + "</div>" +
      "</div>";
  }).join("");
}

function renderVerticalChart(elementId, items) {
  const element = document.getElementById(elementId);
  if (!items.length) {
    element.innerHTML = "<div class=\\"no-data\\">No hay datos para mostrar con los filtros seleccionados.</div>";
    return;
  }

  const max = Math.max.apply(null, items.map(function (item) { return item.value; })) || 1;
  element.innerHTML = items.map(function (item) {
    const height = Math.max(2, Math.min(100, item.value / max * 100));
    const valueText = formatNumber(item.value);
    return "<div class=\\"vbar\\" title=\\"" + escapeHtml(item.label + ": " + valueText) + "\\">" +
      "<div class=\\"vbar-fill\\" style=\\"height:" + height.toFixed(2) + "%\\"></div>" +
      "<div class=\\"vbar-label\\">" + escapeHtml(item.label) + "</div>" +
      "</div>";
  }).join("");
}

function renderTable() {
  const table = document.getElementById("detailTable");
  const rows = getTableRows();
  const totalPages = getTotalPages(rows);
  state.page = Math.min(state.page, totalPages);

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);
  const header = "<thead><tr>" + TABLE_COLUMNS.map(function (column) {
    const marker = state.sortField === column ? (state.sortDir === "asc" ? " ▲" : " ▼") : "";
    return "<th data-sort-field=\\"" + escapeHtml(column) + "\\">" + escapeHtml(column + marker) + "</th>";
  }).join("") + "</tr></thead>";

  const body = pageRows.length
    ? "<tbody>" + pageRows.map(function (row) {
        return "<tr>" + TABLE_COLUMNS.map(function (column) {
          return "<td>" + escapeHtml(formatCell(row, column)) + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody>"
    : "<tbody><tr><td colspan=\\"" + TABLE_COLUMNS.length + "\\">No hay datos para mostrar con los filtros seleccionados.</td></tr></tbody>";

  table.innerHTML = header + body;
  table.querySelectorAll("th").forEach(function (th) {
    th.addEventListener("click", function () {
      const field = th.dataset.sortField;
      if (state.sortField === field) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortField = field;
        state.sortDir = NUMERIC_FIELDS.has(field) ? "desc" : "asc";
      }
      renderTable();
    });
  });

  document.getElementById("pageInfo").textContent = "Página " + state.page + " de " + totalPages + " · " + formatInteger(rows.length) + " fila(s)";
  document.getElementById("prevPageButton").disabled = state.page <= 1;
  document.getElementById("nextPageButton").disabled = state.page >= totalPages;
}

function getTableRows() {
  const searched = state.search
    ? state.filteredRows.filter(function (row) {
        return TABLE_COLUMNS.some(function (column) {
          return normalizeText(formatCell(row, column)).toLocaleLowerCase("es-CO").includes(state.search);
        });
      })
    : state.filteredRows.slice();

  searched.sort(function (a, b) {
    const aValue = valueForSort(a, state.sortField);
    const bValue = valueForSort(b, state.sortField);
    if (aValue < bValue) {
      return state.sortDir === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return state.sortDir === "asc" ? 1 : -1;
    }
    return 0;
  });

  return searched;
}

function applyFilters(rows, filters) {
  return rows.filter(function (row) {
    return Object.keys(filters).every(function (field) {
      const selected = filters[field];
      if (!selected) {
        return true;
      }
      if (field === "Estado de vigencia") {
        return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === selected;
      }
      return normalizeText(row[field]) === selected;
    });
  });
}

function groupBySum(rows, groupField, valueField) {
  const grouped = new Map();
  rows.forEach(function (row) {
    const key = normalizeText(row[groupField]) || "Sin dato";
    grouped.set(key, (grouped.get(key) || 0) + numberForCalc(row[valueField]));
  });
  return Array.from(grouped, function (entry) {
    return { label: entry[0], value: entry[1] };
  }).sort(function (a, b) {
    return b.value - a.value;
  });
}

function getUniqueOptions(rows, field) {
  return Array.from(new Set(rows.map(function (row) {
    return normalizeText(row[field]);
  }).filter(Boolean))).sort(function (a, b) {
    return a.localeCompare(b, "es");
  });
}

function complianceByField(rows, field) {
  const grouped = new Map();
  rows.forEach(function (row) {
    const key = normalizeText(row[field]) || "Sin dato";
    if (!grouped.has(key)) {
      grouped.set(key, { accumulated: 0, objective: 0 });
    }
    const current = grouped.get(key);
    current.accumulated += numberForCalc(row["Ventas acumuladas negociacion"]);
    current.objective += numberForCalc(row["Objetivo cajas total"]);
  });
  return Array.from(grouped, function (entry) {
    return {
      label: entry[0],
      value: entry[1].objective ? entry[1].accumulated / entry[1].objective : 0
    };
  }).sort(function (a, b) {
    return b.value - a.value;
  });
}

function salesByMonth(rows) {
  const field = rows.some(function (row) { return row["Año Mes"] !== null && row["Año Mes"] !== undefined; }) ? "Año Mes" : "Mes";
  const grouped = groupBySum(rows, field, "Ventas cajas físicas mes (sin rep)");
  return grouped.sort(function (a, b) {
    const aNumber = Number(a.label);
    const bNumber = Number(b.label);
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      return aNumber - bNumber;
    }
    return String(a.label).localeCompare(String(b.label), "es");
  });
}

function exportFilteredCsv(rows) {
  const csvRows = [TABLE_COLUMNS.join(",")].concat(rows.map(function (row) {
    return TABLE_COLUMNS.map(function (column) {
      return "\\"" + String(formatCell(row, column)).replace(/"/g, "\\"\\"") + "\\"";
    }).join(",");
  }));
  return csvRows.join("\\n");
}

function renderQuality() {
  const items = [
    ["Filas totales", DASHBOARD_QUALITY.totalRows || DASHBOARD_DATA.length],
    ["Filas ignoradas por estar vacías", DASHBOARD_QUALITY.ignoredEmptyRows || 0],
    ["Filas con fecha inválida", DASHBOARD_QUALITY.invalidDateRows || 0],
    ["Filas sin NIT cliente", DASHBOARD_QUALITY.rowsWithoutNit || 0],
    ["Filas sin cliente SAP", DASHBOARD_QUALITY.rowsWithoutSapClient || 0],
    ["Filas sin presentación", DASHBOARD_QUALITY.rowsWithoutPresentation || 0],
    ["Filas sin objetivo", DASHBOARD_QUALITY.rowsWithoutObjective || 0],
    ["Filas sin ventas", DASHBOARD_QUALITY.rowsWithoutSales || 0],
    ["Columnas extra detectadas", (DASHBOARD_QUALITY.extraColumns || []).length],
    ["Fecha y hora de generación", formatDateTime(DASHBOARD_QUALITY.generatedAt || DASHBOARD_META.generatedAt)]
  ];
  document.getElementById("qualityGeneratedAt").textContent = formatDateTime(DASHBOARD_QUALITY.generatedAt || DASHBOARD_META.generatedAt);
  document.getElementById("qualityGrid").innerHTML = items.map(function (item) {
    return "<div class=\\"quality-item\\"><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(String(item[1])) + "</strong></div>";
  }).join("");
}

function getVigenciaStatus(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return "Sin fechas";
  }
  const start = dateOnly(fechaInicio);
  const end = dateOnly(fechaFin);
  if (!start || !end) {
    return "Sin fechas";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= start && today <= end ? "Vigente" : "No vigente";
}

function formatCell(row, column) {
  if (column === "Estado de vigencia") {
    return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]);
  }
  const value = row[column];
  if (value === null || value === undefined) {
    return "";
  }
  if (NUMERIC_FIELDS.has(column)) {
    if (column === "Porcentaje descuento") {
      return formatPercent(value);
    }
    return formatNumber(value);
  }
  return String(value);
}

function valueForSort(row, field) {
  if (field === "Estado de vigencia") {
    return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]);
  }
  const value = row[field];
  if (NUMERIC_FIELDS.has(field)) {
    return typeof value === "number" && Number.isFinite(value) ? value : -Number.MAX_VALUE;
  }
  return normalizeText(value);
}

function getTotalPages(rows) {
  return Math.max(1, Math.ceil(rows.length / state.pageSize));
}

function sumField(rows, field) {
  return rows.reduce(function (acc, row) {
    return acc + numberForCalc(row[field]);
  }, 0);
}

function countUnique(rows, field) {
  return new Set(rows.map(function (row) {
    return normalizeText(row[field]);
  }).filter(Boolean)).size;
}

function numberForCalc(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateOnly(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(value))) {
    return null;
  }
  const parts = String(value).split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/\\s+/g, " ").trim();
}

function formatInteger(value) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value || 0);
}

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }
  const displayValue = Math.abs(value) > 1 ? value / 100 : value;
  return new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 2 }).format(displayValue);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("es-CO");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
`;
}

const DASHBOARD_LOGO_DATA_URI = "data:image/png;base64,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";

const DASHBOARD_FAVICON_DATA_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230f766e'/%3E%3Cpath d='M17 45h30M21 37V27m11 10V18m11 19V24' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3Cpath d='M41 17h7v7' fill='none' stroke='%23ccfbf1' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

/* Executive redesign overrides. The functions below intentionally replace the first version above. */
function generateDashboardHtml(payload) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const metadata = payload.metadata || {};

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dashb</title>
    <link rel="icon" type="image/svg+xml" href="${DASHBOARD_FAVICON_DATA_URI}">
    <link rel="shortcut icon" type="image/svg+xml" href="${DASHBOARD_FAVICON_DATA_URI}">
    <link rel="apple-touch-icon" href="${DASHBOARD_FAVICON_DATA_URI}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js" defer></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js" defer></script>
    <style>${dashboardCss()}</style>
  </head>
  <body>
    <div id="dashboardApp" class="dashboard-app">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="sidebar-logo" aria-hidden="true">
            <svg class="sidebar-logo-mark" viewBox="0 0 64 64" focusable="false">
              <rect width="64" height="64" rx="16"></rect>
              <path d="M17 45h30M21 37V27m11 10V18m11 19V24"></path>
              <path d="M41 17h7v7"></path>
            </svg>
          </span>
          <strong class="sidebar-label">Dashboard</strong>
          <button id="sidebarToggle" class="sidebar-toggle" type="button" aria-label="Colapsar menú" aria-expanded="true">
            <i data-lucide="panel-left-close"></i>
          </button>
        </div>
        <nav class="sidebar-nav" aria-label="Secciones">
          <a href="#kpis" title="KPIs"><i data-lucide="gauge"></i><span class="sidebar-label">KPIs</span></a>
          <a href="#charts" title="Gráficas"><i data-lucide="bar-chart-3"></i><span class="sidebar-label">Gráficas</span></a>
          <a href="#detail" title="Detalle"><i data-lucide="table-2"></i><span class="sidebar-label">Detalle</span></a>
        </nav>
        <div class="sidebar-note">
          <i data-lucide="wifi"></i>
          <span>Las gráficas usan librerías visuales por CDN. Los datos ya están incrustados en este HTML.</span>
        </div>
      </aside>

      <main class="main">
        <header class="executive-header">
          <div>
            <p class="eyebrow">Resumen Ejecutivo</p>
            <h1 id="dashboardTitle">Negociaciones</h1>
            <div class="header-context">
              <span id="regionBadge" class="badge badge-muted">Región no disponible</span>
            </div>
          </div>
          <div class="header-actions">
            <span id="healthBadge" class="badge badge-success"><i data-lucide="check-circle-2"></i> Datos cargados</span>
            <button id="themeToggle" class="button button-ghost theme-toggle" type="button" aria-label="Cambiar a modo oscuro"><i data-lucide="moon"></i> Oscuro</button>
            <button id="exportCsvButton" class="button button-primary" type="button"><i data-lucide="download"></i> Exportar CSV</button>
            <button id="clearFiltersButton" class="button button-ghost" type="button"><i data-lucide="filter-x"></i> Limpiar filtros</button>
          </div>
        </header>

        <section id="kpis" class="kpi-grid" aria-label="Indicadores principales"></section>

        <section class="filter-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Exploración</p>
              <h2>Filtros interactivos</h2>
            </div>
            <div id="activeFilters" class="active-filters"></div>
          </div>
          <div class="quick-search">
            <i data-lucide="search"></i>
            <input id="globalSearchInput" type="search" placeholder="Buscar cliente, canal, cedi o presentación">
          </div>
          <div id="filtersGrid" class="filters-grid"></div>
        </section>

        <section id="charts" class="charts-grid">
          <article class="chart-card"><div><h2>Ventas por Región SAP</h2><p>Distribución de cajas físicas por región.</p></div><div id="chartRegion" class="chart"></div></article>
          <article class="chart-card"><div><h2>Ventas por Canal</h2><p>Comparativo por canal comercial.</p></div><div id="chartCanal" class="chart"></div></article>
          <article class="chart-card"><div><h2>Ventas por Categoría</h2><p>Categorías AS400 con mayor volumen.</p></div><div id="chartCategoria" class="chart"></div></article>
          <article class="chart-card"><div><h2>Top 10 clientes</h2><p>Clientes con más cajas físicas del mes.</p></div><div id="chartClientes" class="chart"></div></article>
          <article class="chart-card"><div><h2>Top 10 presentaciones</h2><p>Presentaciones más relevantes por volumen.</p></div><div id="chartPresentaciones" class="chart"></div></article>
          <article class="chart-card"><div><h2>Cumplimiento por Cedi</h2><p>Ventas acumuladas frente al objetivo total.</p></div><div id="chartCedi" class="chart"></div></article>
          <article class="chart-card chart-wide"><div><h2>Ventas por Mes / Año Mes</h2><p>Evolución temporal de ventas en cajas físicas.</p></div><div id="chartMes" class="chart"></div></article>
        </section>

        <section id="detail" class="table-card">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Detalle operativo</p>
              <h2>Tabla de detalle</h2>
            </div>
            <div class="table-tools">
              <label>Filas
                <select id="pageSizeSelect"><option>10</option><option>25</option><option>50</option><option>100</option></select>
              </label>
            </div>
          </div>
          <div class="table-wrap">
            <table id="detailTable"></table>
          </div>
          <div class="pagination">
            <button id="prevPageButton" class="button button-ghost" type="button"><i data-lucide="chevron-left"></i> Anterior</button>
            <span id="pageInfo">Página 1</span>
            <button id="nextPageButton" class="button button-ghost" type="button">Siguiente <i data-lucide="chevron-right"></i></button>
          </div>
        </section>
      </main>
    </div>

    <script>
const DASHBOARD_DATA = ${safeJson(rows)};
const DASHBOARD_META = ${safeJson(metadata)};
${dashboardScript()}
    <\/script>
  </body>
</html>`;
}

function dashboardCss() {
  return `
:root {
  --bg: #f6f8fb;
  --panel: #ffffff;
  --ink: #0f172a;
  --muted: #64748b;
  --subtle: #94a3b8;
  --line: #e2e8f0;
  --primary: #0f766e;
  --primary-2: #0d9488;
  --primary-soft: #ccfbf1;
  --emerald: #059669;
  --emerald-soft: #dcfce7;
  --amber: #b45309;
  --amber-soft: #fef3c7;
  --red: #dc2626;
  --red-soft: #fee2e2;
  --indigo: #4f46e5;
  --sky: #0284c7;
  --shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
  --radius: 18px;
  --sidebar-bg: rgba(255, 255, 255, 0.76);
  --soft-bg: #f8fafc;
  --input-bg: #ffffff;
  --button-bg: #ffffff;
  --badge-muted-bg: #f8fafc;
  --badge-muted-text: #475569;
  --tooltip-bg: #ffffff;
  --chart-grid: #e2e8f0;
  --chart-text: #64748b;
  --sidebar-link: #334155;
  --sidebar-link-hover: #0f766e;
  --sidebar-link-hover-bg: #f0fdfa;
  --sidebar-toggle-bg: #ffffff;
  --sidebar-toggle-text: #475569;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #020617;
  --panel: #0f172a;
  --ink: #f8fafc;
  --muted: #cbd5e1;
  --subtle: #94a3b8;
  --line: rgba(148, 163, 184, 0.24);
  --primary: #2dd4bf;
  --primary-2: #14b8a6;
  --primary-soft: rgba(45, 212, 191, 0.16);
  --emerald-soft: rgba(16, 185, 129, 0.16);
  --amber-soft: rgba(245, 158, 11, 0.16);
  --red-soft: rgba(239, 68, 68, 0.16);
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.36);
  --sidebar-bg: rgba(15, 23, 42, 0.86);
  --soft-bg: #111827;
  --input-bg: #0b1220;
  --button-bg: #111827;
  --badge-muted-bg: #111827;
  --badge-muted-text: #cbd5e1;
  --tooltip-bg: #020617;
  --chart-grid: rgba(148, 163, 184, 0.18);
  --chart-text: #cbd5e1;
  --sidebar-link: #cbd5e1;
  --sidebar-link-hover: #f8fafc;
  --sidebar-link-hover-bg: rgba(45, 212, 191, 0.14);
  --sidebar-toggle-bg: #111827;
  --sidebar-toggle-text: #e2e8f0;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(13, 148, 136, 0.13), transparent 34rem), var(--bg);
  color: var(--ink);
  font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
}
button, input, select { font: inherit; }
button { cursor: pointer; }
svg { width: 18px; height: 18px; stroke-width: 2.2; }
body, .sidebar, .filter-panel, .kpi-card, .chart-card, .table-card, .button, .badge, input, select, th, tbody tr {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.dashboard-app { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; transition: grid-template-columns 0.22s ease; }
.dashboard-app.sidebar-collapsed { grid-template-columns: 84px minmax(0, 1fr); }
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 22px;
  border-right: 1px solid var(--line);
  background: var(--sidebar-bg);
  backdrop-filter: blur(16px);
  overflow: hidden;
}
.sidebar-brand { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; margin-bottom: 28px; font-weight: 800; }
.sidebar-brand .sidebar-logo {
  display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex: 0 0 auto;
  overflow: hidden; border-radius: 14px; background: #fff; box-shadow: 0 10px 24px rgba(15, 118, 110, 0.14);
}
.sidebar-logo-mark {
  display: block; width: 44px; height: 44px; margin: 0;
}
.sidebar-logo-mark rect {
  fill: var(--primary);
}
.sidebar-logo-mark path {
  fill: none; stroke: #fff; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round;
}
.sidebar-logo-mark path:last-child {
  stroke: var(--primary-soft); stroke-width: 5;
}
.sidebar-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
  transition: opacity 0.16s ease, transform 0.16s ease, max-width 0.2s ease;
}
.sidebar-toggle {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--sidebar-toggle-bg);
  color: var(--sidebar-toggle-text);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease;
}
.sidebar-toggle:hover { background: var(--sidebar-link-hover-bg); color: var(--sidebar-link-hover); transform: translateY(-1px); }
.sidebar-nav { display: grid; gap: 8px; }
.sidebar-nav a {
  display: flex; gap: 10px; align-items: center; min-height: 42px; padding: 0 12px;
  border: 1px solid transparent; border-radius: 12px; color: var(--sidebar-link); font-weight: 800; text-decoration: none;
}
.sidebar-nav a svg { flex: 0 0 auto; }
.sidebar-nav a:hover { border-color: var(--line); background: var(--sidebar-link-hover-bg); color: var(--sidebar-link-hover); }
.sidebar-note {
  position: absolute; left: 22px; right: 22px; bottom: 22px; display: grid; gap: 9px;
  padding: 14px; border: 1px solid var(--line); border-radius: 16px; background: var(--soft-bg); color: var(--muted); font-size: 0.82rem; line-height: 1.45;
}
.dashboard-app.sidebar-collapsed .sidebar { padding-inline: 16px; }
.dashboard-app.sidebar-collapsed .sidebar-brand { grid-template-columns: 1fr; justify-items: center; gap: 12px; }
.dashboard-app.sidebar-collapsed .sidebar-brand > span { width: 44px; height: 44px; }
.dashboard-app.sidebar-collapsed .sidebar-toggle { width: 38px; height: 38px; }
.dashboard-app.sidebar-collapsed .sidebar-label {
  max-width: 0;
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
}
.dashboard-app.sidebar-collapsed .sidebar-nav a {
  justify-content: center;
  padding: 0;
}
.dashboard-app.sidebar-collapsed .sidebar-note {
  left: 16px;
  right: 16px;
  padding: 10px;
  justify-items: center;
}
.dashboard-app.sidebar-collapsed .sidebar-note span { display: none; }
.main { min-width: 0; padding: 26px clamp(18px, 3vw, 34px) 44px; }
.executive-header {
  display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 16px;
}
.eyebrow {
  margin: 0 0 8px; color: var(--primary); font-size: 0.74rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
}
h1, h2, p { margin-top: 0; }
h1 { margin-bottom: 10px; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.03; letter-spacing: -0.04em; }
h2 { margin-bottom: 0; font-size: 1.05rem; letter-spacing: -0.02em; }
.header-context { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.header-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.button, .badge {
  display: inline-flex; gap: 8px; justify-content: center; align-items: center; border-radius: 12px; font-weight: 800;
}
.button { min-height: 40px; padding: 0 14px; border: 1px solid transparent; }
.button-primary { background: linear-gradient(135deg, var(--primary), var(--primary-2)); color: #fff; box-shadow: 0 12px 24px rgba(15,118,110,0.18); }
.button-ghost { border-color: var(--line); background: var(--button-bg); color: var(--ink); }
.button:disabled { opacity: 0.5; cursor: not-allowed; }
.theme-toggle { gap: 7px; min-width: 96px; }
.theme-toggle:focus-visible,
.button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.18);
}
.badge { min-height: 30px; padding: 0 10px; border: 1px solid transparent; font-size: 0.78rem; }
.badge-success { border-color: rgba(16, 185, 129, 0.32); background: var(--emerald-soft); color: var(--primary); }
.badge-muted { border-color: var(--line); background: var(--badge-muted-bg); color: var(--badge-muted-text); }
.badge-warn { border-color: rgba(245, 158, 11, 0.32); background: var(--amber-soft); color: var(--amber); }
.badge-danger { border-color: rgba(239, 68, 68, 0.32); background: var(--red-soft); color: var(--red); }
.filter-panel, .kpi-card, .chart-card, .table-card {
  border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); box-shadow: var(--shadow);
}
label, .kpi-label {
  display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
}
.filter-panel, .table-card { padding: 18px; margin-bottom: 18px; }
.panel-heading { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 14px; }
.quick-search {
  display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: center;
  min-height: 46px; margin-bottom: 14px; padding: 0 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--soft-bg); color: var(--muted);
}
.quick-search input { border: 0; outline: 0; background: transparent; color: var(--ink); font-weight: 700; }
.filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
label { display: grid; gap: 6px; }
select, input[type="search"] {
  width: 100%; min-height: 40px; padding: 0 11px; border: 1px solid var(--line); border-radius: 12px; background: var(--input-bg); color: var(--ink); font-weight: 700;
}
.active-filters { display: flex; flex-wrap: wrap; gap: 7px; justify-content: flex-end; max-width: 55%; }
.filter-chip { display: inline-flex; gap: 6px; align-items: center; min-height: 28px; padding: 0 9px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 0.78rem; font-weight: 800; }
.kpi-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
.kpi-card { min-width: 0; padding: 16px; }
.kpi-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; margin-bottom: 18px; }
.kpi-icon { display: inline-grid; place-items: center; width: 38px; height: 38px; border-radius: 14px; background: var(--primary-soft); color: var(--primary); }
.kpi-value { display: block; margin-bottom: 6px; overflow-wrap: anywhere; font-size: clamp(1.35rem, 2vw, 1.85rem); font-weight: 800; letter-spacing: -0.04em; }
.kpi-description { margin: 0; color: var(--muted); font-size: 0.82rem; line-height: 1.42; }
.charts-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 18px; }
.chart-card { min-width: 0; min-height: 390px; padding: 18px; }
.chart-card p { margin: 6px 0 0; color: var(--muted); font-size: 0.9rem; }
.chart-wide { grid-column: 1 / -1; }
.chart { width: 100%; min-height: 320px; height: 320px; margin-top: 14px; }
.no-data {
  display: grid; place-items: center; min-height: 260px; border: 1px dashed var(--line); border-radius: 14px; background: var(--soft-bg); color: var(--muted); font-weight: 800; text-align: center;
}
.native-chart { min-height: 305px; }
.native-horizontal { display: grid; gap: 10px; align-content: center; }
.native-row { display: grid; grid-template-columns: minmax(120px, 30%) minmax(0, 1fr) minmax(82px, auto); gap: 10px; align-items: center; }
.native-label { overflow: hidden; color: var(--ink); font-size: 0.84rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.native-track { height: 17px; overflow: hidden; border-radius: 999px; background: var(--chart-grid); }
.native-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--primary), #2563eb); }
.native-row strong { color: var(--ink); font-size: 0.84rem; font-variant-numeric: tabular-nums; text-align: right; }
.native-vertical { display: flex; gap: 10px; align-items: end; min-height: 305px; padding-top: 18px; overflow-x: auto; }
.native-column { display: grid; grid-template-rows: 1fr auto; gap: 8px; align-items: end; width: max(42px, calc(100% / 16)); min-width: 42px; height: 285px; }
.native-column-fill { display: block; width: 100%; min-height: 3px; border-radius: 9px 9px 0 0; background: linear-gradient(180deg, #2563eb, var(--primary)); }
.native-column small { overflow: hidden; color: var(--muted); font-size: 0.72rem; font-weight: 800; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.native-donut { display: grid; grid-template-columns: minmax(160px, 0.8fr) minmax(0, 1.2fr); gap: 18px; align-items: center; min-height: 305px; }
.native-donut-center { display: grid; place-items: center; width: 172px; height: 172px; margin: 0 auto; border: 28px solid #0d9488; border-radius: 50%; background: var(--panel); box-shadow: inset 0 0 0 1px var(--line); }
.native-donut-center strong { font-size: 1.15rem; letter-spacing: -0.03em; }
.native-donut-center span { color: var(--muted); font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }
.native-donut-list { display: grid; gap: 9px; }
.native-donut-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: 8px; align-items: center; color: var(--ink); font-size: 0.82rem; font-weight: 800; }
.native-donut-item span:nth-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.native-donut-item small { color: var(--muted); font-weight: 800; }
.native-swatch { width: 10px; height: 10px; border-radius: 999px; background: var(--primary); }
.swatch-1 { background: #2563eb; }
.swatch-2 { background: #059669; }
.swatch-3 { background: #4f46e5; }
.swatch-4 { background: #0284c7; }
.swatch-5 { background: #14b8a6; }
.table-tools { display: flex; gap: 10px; align-items: end; }
.table-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 14px; }
table { width: 100%; min-width: 1400px; border-collapse: separate; border-spacing: 0; }
th, td { padding: 12px 13px; border-bottom: 1px solid var(--line); font-size: 0.86rem; text-align: left; vertical-align: top; }
th {
  position: sticky; top: 0; z-index: 1; background: var(--soft-bg); color: var(--muted); cursor: pointer; font-size: 0.73rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase;
}
td.numeric { text-align: right; font-variant-numeric: tabular-nums; }
tbody tr:nth-child(even) { background: rgba(148, 163, 184, 0.08); }
tbody tr:hover { background: var(--primary-soft); }
.status-pill { display: inline-flex; min-height: 26px; align-items: center; padding: 0 9px; border-radius: 999px; font-size: 0.78rem; font-weight: 900; }
.status-vigente { background: var(--emerald-soft); color: var(--primary); }
.status-no-vigente { background: var(--soft-bg); color: var(--muted); }
.status-sin-fechas { background: var(--amber-soft); color: var(--amber); }
.pagination { display: flex; justify-content: flex-end; gap: 12px; align-items: center; margin-top: 14px; color: var(--muted); font-weight: 800; }
.extra-columns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.extra-chip { display: inline-flex; min-height: 28px; align-items: center; padding: 0 9px; border-radius: 999px; background: var(--amber-soft); color: var(--amber); font-size: 0.78rem; font-weight: 800; }
@media (max-width: 1180px) {
  .dashboard-app,
  .dashboard-app.sidebar-collapsed { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--line); }
  .dashboard-app.sidebar-collapsed .sidebar { padding: 22px; }
  .dashboard-app.sidebar-collapsed .sidebar-brand { grid-template-columns: auto minmax(0, 1fr) auto; justify-items: stretch; }
  .dashboard-app.sidebar-collapsed .sidebar-label { max-width: none; opacity: 1; transform: none; pointer-events: auto; }
  .dashboard-app.sidebar-collapsed .sidebar-nav a { justify-content: flex-start; padding: 0 12px; }
  .dashboard-app.sidebar-collapsed .sidebar-note { left: auto; right: auto; padding: 14px; justify-items: start; }
  .dashboard-app.sidebar-collapsed .sidebar-note span { display: inline; }
  .sidebar-nav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sidebar-note { position: static; margin-top: 18px; }
  .filters-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 820px) {
  .main { padding: 20px 12px 34px; }
  .executive-header, .panel-heading { display: grid; }
  .header-actions, .active-filters { justify-content: flex-start; max-width: none; }
  .filters-grid, .charts-grid, .sidebar-nav { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
`;
}

function dashboardScript() {
  return `
const FILTER_FIELDS = [
  { field: "Año", label: "Año" },
  { field: "Mes", label: "Mes" },
  { field: "Región SAP", label: "Región SAP" },
  { field: "Canal", label: "Canal" },
  { field: "Categoría AS400 de la venta", label: "Categoría" },
  { field: "Cedi", label: "Cedi" },
  { field: "Estado de vigencia", label: "Estado de vigencia" }
];
const TABLE_COLUMNS = [
  "Año", "Mes", "Canal", "Categoría AS400 de la venta", "Región SAP", "Cedi",
  "Cliente AS400 - Texto", "Cliente SAP - Clave", "Presentación AS400 de la venta - Texto",
  "Ventas cajas físicas mes (sin rep)", "Ventas acumuladas negociacion", "Objetivo cajas total",
  "Porcentaje descuento", "Fecha inicio", "Fecha fin", "Estado de vigencia"
];
const NUMERIC_FIELDS = new Set(["Año", "Año Mes", "Ventas cajas físicas mes (sin rep)", "Ventas acumuladas negociacion", "Objetivo cajas total", "Porcentaje descuento"]);
const DASHBOARD_THEME_KEY = "negotiationsDashboardTheme";
const chartInstances = {};
const state = { filters: {}, filteredRows: [], search: "", page: 1, pageSize: 10, sortField: "Ventas cajas físicas mes (sin rep)", sortDir: "desc" };
document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  initTheme();
  initSidebar();
  renderHeaderContext();
  validateDashboardDataShape(DASHBOARD_DATA);
  populateFilters();
  bindEvents();
  window.addEventListener("resize", resizeCharts);
  waitForECharts(renderAll);
  refreshIcons();
}
function initTheme() {
  applyTheme(getPreferredTheme(), false);
}
function getPreferredTheme() {
  try {
    const saved = window.localStorage.getItem(DASHBOARD_THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (error) {
    console.warn("No se pudo leer la preferencia de tema.", error);
  }
  if (DASHBOARD_META && (DASHBOARD_META.initialTheme === "light" || DASHBOARD_META.initialTheme === "dark")) {
    return DASHBOARD_META.initialTheme;
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getCurrentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function applyTheme(theme, persist) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalizedTheme;
  if (persist !== false) {
    try {
      window.localStorage.setItem(DASHBOARD_THEME_KEY, normalizedTheme);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de tema.", error);
    }
  }
  updateThemeToggle(normalizedTheme);
}
function toggleTheme() {
  applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
  if (state.filteredRows.length) renderCharts(state.filteredRows);
  refreshIcons();
}
function updateThemeToggle(theme) {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const icon = theme === "dark" ? "sun" : "moon";
  const label = theme === "dark" ? "Claro" : "Oscuro";
  toggle.setAttribute("aria-label", "Cambiar a modo " + (nextTheme === "dark" ? "oscuro" : "claro"));
  toggle.innerHTML = '<i data-lucide="' + icon + '"></i> ' + label;
  refreshIcons();
}
function initSidebar() {
  const app = document.getElementById("dashboardApp");
  const toggle = document.getElementById("sidebarToggle");
  if (!app || !toggle) return;
  const saved = getSidebarCollapsedPreference();
  setSidebarCollapsed(saved);
  toggle.addEventListener("click", function () {
    setSidebarCollapsed(!app.classList.contains("sidebar-collapsed"));
  });
}
function setSidebarCollapsed(collapsed) {
  const app = document.getElementById("dashboardApp");
  const toggle = document.getElementById("sidebarToggle");
  if (!app || !toggle) return;
  app.classList.toggle("sidebar-collapsed", collapsed);
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.setAttribute("aria-label", collapsed ? "Expandir menú" : "Colapsar menú");
  toggle.innerHTML = collapsed ? '<i data-lucide="panel-left-open"></i>' : '<i data-lucide="panel-left-close"></i>';
  setSidebarCollapsedPreference(collapsed);
  refreshIcons();
  window.setTimeout(resizeCharts, 260);
}
function getSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem("negotiationsSidebarCollapsed") === "true";
  } catch (error) {
    return false;
  }
}
function setSidebarCollapsedPreference(collapsed) {
  try {
    window.localStorage.setItem("negotiationsSidebarCollapsed", String(collapsed));
  } catch (error) {
    console.warn("No se pudo guardar el estado del sidebar.", error);
  }
}
function waitForECharts(callback, retries) {
  const remaining = typeof retries === "number" ? retries : 30;
  if (window.echarts) {
    callback();
    return;
  }
  if (remaining <= 0) {
    console.warn("ECharts no cargó. Usando fallback nativo.");
    callback();
    return;
  }
  window.setTimeout(function () {
    waitForECharts(callback, remaining - 1);
  }, 100);
}
function validateDashboardDataShape(rows) {
  if (!rows.length) {
    console.warn("DASHBOARD_DATA no contiene filas.");
    return false;
  }
  const requiredFields = ["Región SAP", "Canal", "Categoría AS400 de la venta", "Ventas cajas físicas mes (sin rep)", "Ventas acumuladas negociacion", "Objetivo cajas total"];
  requiredFields.forEach(function (field) {
    if (!(field in rows[0])) {
      console.warn("Campo no encontrado en DASHBOARD_DATA:", field);
    }
  });
  return true;
}
function bindEvents() {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  document.getElementById("clearFiltersButton").addEventListener("click", clearFilters);
  document.getElementById("globalSearchInput").addEventListener("input", function (event) {
    state.search = event.target.value.trim().toLocaleLowerCase("es-CO");
    state.page = 1;
    renderAll();
  });
  document.getElementById("pageSizeSelect").addEventListener("change", function (event) {
    state.pageSize = Number(event.target.value) || 10;
    state.page = 1;
    renderTable();
  });
  document.getElementById("prevPageButton").addEventListener("click", function () {
    state.page = Math.max(1, state.page - 1);
    renderTable();
  });
  document.getElementById("nextPageButton").addEventListener("click", function () {
    state.page = Math.min(getTotalPages(getTableRows()), state.page + 1);
    renderTable();
  });
  document.getElementById("exportCsvButton").addEventListener("click", function () {
    downloadCsv(exportFilteredCsv(getTableRows()), "datos_filtrados.csv");
  });
}
function renderHeaderContext() {
  const context = getRegionContext(DASHBOARD_DATA);
  const title = context.title;
  document.title = title;
  document.getElementById("dashboardTitle").textContent = title;
  document.getElementById("regionBadge").textContent = context.badge;
}
function getRegionContext(rows) {
  const regions = getUniqueOptions(rows, "Región SAP");
  if (!regions.length) {
    return { title: "Negociaciones", badge: "Región no disponible" };
  }
  if (regions.length === 1) {
    return { title: "Negociaciones " + regions[0], badge: "Región: " + regions[0] };
  }
  const visibleRegions = regions.slice(0, 3).join(", ");
  const remaining = regions.length > 3 ? " +" + (regions.length - 3) : "";
  return {
    title: "Negociaciones múltiples regiones",
    badge: "Regiones: " + visibleRegions + remaining
  };
}
function populateFilters() {
  const container = document.getElementById("filtersGrid");
  container.innerHTML = FILTER_FIELDS.map(function (item) {
    const options = item.field === "Estado de vigencia" ? ["Vigente", "No vigente", "Sin fechas"] : getUniqueOptions(DASHBOARD_DATA, item.field);
    return "<label>" + escapeHtml(item.label) + "<select data-filter-field=\\"" + escapeHtml(item.field) + "\\"><option value=\\"\\">Todos</option>" + options.map(function (option) {
      return "<option value=\\"" + escapeHtml(option) + "\\">" + escapeHtml(option) + "</option>";
    }).join("") + "</select></label>";
  }).join("");
  container.querySelectorAll("select").forEach(function (select) {
    select.addEventListener("change", function (event) {
      state.filters[event.target.dataset.filterField] = event.target.value;
      state.page = 1;
      renderAll();
    });
  });
}
function clearFilters() {
  state.filters = {};
  state.search = "";
  document.getElementById("globalSearchInput").value = "";
  document.querySelectorAll("[data-filter-field]").forEach(function (select) { select.value = ""; });
  state.page = 1;
  renderAll();
}
function renderAll() {
  state.filteredRows = applySearch(applyFilters(DASHBOARD_DATA, state.filters));
  renderActiveFilters();
  renderKpis(state.filteredRows);
  renderCharts(state.filteredRows);
  renderTable();
  refreshIcons();
}
function renderActiveFilters() {
  const active = Object.keys(state.filters).filter(function (key) { return state.filters[key]; });
  document.getElementById("activeFilters").innerHTML = active.length ? active.map(function (field) {
    return "<span class=\\"filter-chip\\">" + escapeHtml(field) + ": " + escapeHtml(state.filters[field]) + "</span>";
  }).join("") : "<span class=\\"badge badge-muted\\">Sin filtros activos</span>";
}
function computeKpis(rows) {
  const salesMonth = sumField(rows, "Ventas cajas físicas mes (sin rep)");
  const accumulatedSales = sumField(rows, "Ventas acumuladas negociacion");
  const objective = sumField(rows, "Objetivo cajas total");
  const discounts = rows.map(function (row) { return row["Porcentaje descuento"]; }).filter(isFiniteNumber);
  return {
    salesMonth: salesMonth,
    accumulatedSales: accumulatedSales,
    objective: objective,
    compliance: objective ? accumulatedSales / objective : null,
    missingBoxes: objective - accumulatedSales,
    uniqueClients: countUnique(rows, "Nit cliente - Clave"),
    uniquePresentations: countUnique(rows, "Presentación AS400 de la venta - Clave"),
    uniqueActivities: countUnique(rows, "ID Actividad"),
    averageDiscount: discounts.length ? discounts.reduce(function (acc, value) { return acc + value; }, 0) / discounts.length : null,
    activeNegotiations: rows.filter(function (row) { return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === "Vigente"; }).length
  };
}
function renderKpis(rows) {
  const k = computeKpis(rows);
  const items = [
    ["shopping-bag", "Total ventas cajas físicas mes", formatNumber(k.salesMonth), "Suma de ventas del mes"],
    ["trending-up", "Ventas acumuladas negociación", formatNumber(k.accumulatedSales), "Avance acumulado negociado"],
    ["target", "Objetivo cajas total", formatNumber(k.objective), "Meta total del periodo"],
    ["gauge", "Cumplimiento", k.compliance === null ? "N/A" : formatPercent(k.compliance), "Avance sobre objetivo"],
    ["package-minus", "Cajas faltantes", formatNumber(k.missingBoxes), "Objetivo menos acumulado"],
    ["users", "Clientes únicos", formatInteger(k.uniqueClients), "NIT cliente distintos"],
    ["boxes", "Presentaciones únicas", formatInteger(k.uniquePresentations), "Claves de presentación"],
    ["badge-check", "Actividades únicas", formatInteger(k.uniqueActivities), "ID Actividad distintos"],
    ["percent", "Descuento promedio", k.averageDiscount === null ? "N/A" : formatPercent(k.averageDiscount), "Promedio válido"],
    ["calendar-check", "Negociaciones vigentes", formatInteger(k.activeNegotiations), "Filas activas hoy"]
  ];
  document.getElementById("kpis").innerHTML = items.map(function (item) {
    return "<article class=\\"kpi-card\\"><div class=\\"kpi-top\\"><span class=\\"kpi-icon\\"><i data-lucide=\\"" + item[0] + "\\"></i></span><span class=\\"badge badge-muted\\">Filtrado</span></div><span class=\\"kpi-label\\">" + escapeHtml(item[1]) + "</span><strong class=\\"kpi-value\\">" + escapeHtml(item[2]) + "</strong><p class=\\"kpi-description\\">" + escapeHtml(item[3]) + "</p></article>";
  }).join("");
}
function renderCharts(rows) {
  disposeCharts();
  if (!rows.length) {
    renderAllChartEmptyStates("No hay datos para mostrar con los filtros seleccionados.");
    return;
  }
  renderChartFromFields("chartRegion", "bar", rows, "Región SAP", "Ventas cajas físicas mes (sin rep)", false, true, 12);
  renderChartFromFields("chartCanal", "donut", rows, "Canal", "Ventas cajas físicas mes (sin rep)", false, false, 10);
  renderChartFromFields("chartCategoria", "bar", rows, "Categoría AS400 de la venta", "Ventas cajas físicas mes (sin rep)", false, true, 12);
  renderChartFromFields("chartClientes", "bar", rows, "Cliente AS400 - Texto", "Ventas cajas físicas mes (sin rep)", false, true, 10);
  renderChartFromFields("chartPresentaciones", "bar", rows, "Presentación AS400 de la venta - Texto", "Ventas cajas físicas mes (sin rep)", false, true, 10);
  renderChart("chartCedi", "bar", groupComplianceByCedi(rows).slice(0, 12), true, true);
  renderChart("chartMes", "line", salesByMonth(rows), false, false);
}
function renderChartFromFields(elementId, type, rows, groupField, valueField, asPercent, horizontal, limit) {
  if (!hasField(rows, groupField) || !hasField(rows, valueField)) {
    renderChartMessage(elementId, "No se encontró el campo necesario para esta gráfica.");
    return;
  }
  renderChart(elementId, type, groupBySum(rows, groupField, valueField, limit), asPercent, horizontal);
}
function hasField(rows, field) {
  return rows.some(function (row) {
    return Object.prototype.hasOwnProperty.call(row, field);
  });
}
function renderChartMessage(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = "<div class=\\"no-data\\">" + escapeHtml(message) + "</div>";
  } else {
    console.warn("No se encontró el contenedor de gráfica:", elementId);
  }
}
function renderChart(elementId, type, items, asPercent, horizontal) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn("No se encontró el contenedor de gráfica:", elementId);
    return;
  }
  const chartItems = normalizeChartItems(items);
  if (!hasRenderableChartData(chartItems)) {
    element.innerHTML = "<div class=\\"no-data\\">No hay datos para mostrar con los filtros seleccionados.</div>";
    return;
  }
  if (!window.echarts) {
    console.warn("ECharts no está disponible. Se usa renderizado nativo para", elementId);
    renderNativeChart(element, type, chartItems, asPercent, horizontal);
    return;
  }
  element.innerHTML = "";
  try {
    const chart = window.echarts.init(element, null, { renderer: "canvas" });
    chart.setOption(buildEChartOption(type, chartItems, asPercent, horizontal), true);
    chartInstances[elementId] = chart;
  } catch (error) {
    console.warn("Error renderizando gráfica con ECharts. Se usa renderizado nativo para", elementId, error);
    delete chartInstances[elementId];
    renderNativeChart(element, type, chartItems, asPercent, horizontal);
  }
}
function getChartThemeColors() {
  const isDark = getCurrentTheme() === "dark";
  return {
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#cbd5e1" : "#64748b",
    grid: isDark ? "rgba(148, 163, 184, 0.18)" : "#e2e8f0",
    tooltipBg: isDark ? "#020617" : "#ffffff",
    tooltipBorder: isDark ? "rgba(148, 163, 184, 0.28)" : "#e2e8f0",
    tooltipText: isDark ? "#f8fafc" : "#0f172a",
    colors: isDark ? ["#2dd4bf", "#60a5fa", "#34d399", "#a78bfa", "#38bdf8", "#5eead4"] : ["#0d9488", "#2563eb", "#059669", "#4f46e5", "#0284c7", "#14b8a6"]
  };
}
function buildEChartOption(type, items, asPercent, horizontal) {
  const labels = items.map(function (item) { return item.label; });
  const values = items.map(function (item) { return roundNumber(item.value); });
  const theme = getChartThemeColors();
  const colors = theme.colors;
  const tooltip = {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    textStyle: { color: theme.tooltipText, fontWeight: 700 }
  };
  if (type === "donut") {
    return {
      color: colors,
      tooltip: Object.assign({ trigger: "item", valueFormatter: function (value) { return formatNumber(value); } }, tooltip),
      legend: { type: "scroll", bottom: 0, textStyle: { color: theme.muted, fontWeight: 700 } },
      series: [{
        type: "pie",
        radius: ["52%", "72%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: true,
        label: { show: false },
        data: items.map(function (item) { return { name: item.label, value: roundNumber(item.value) }; })
      }]
    };
  }
  if (type === "line") {
    return {
      color: colors,
      tooltip: Object.assign({ trigger: "axis", valueFormatter: function (value) { return formatNumber(value); } }, tooltip),
      grid: { left: 18, right: 18, top: 28, bottom: 42, containLabel: true },
      xAxis: { type: "category", data: labels, axisLabel: { color: theme.muted, fontWeight: 700 }, axisLine: { lineStyle: { color: theme.grid } } },
      yAxis: { type: "value", axisLabel: { color: theme.muted, formatter: compactNumber }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } },
      series: [{ type: "line", smooth: true, symbolSize: 7, areaStyle: { opacity: 0.16 }, lineStyle: { width: 3 }, data: values }]
    };
  }
  return {
    color: colors,
    tooltip: Object.assign({ trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: function (value) { return asPercent ? formatPercent(value) : formatNumber(value); } }, tooltip),
    grid: { left: 18, right: 18, top: 24, bottom: 28, containLabel: true },
    xAxis: horizontal
      ? { type: "value", axisLabel: { color: theme.muted, formatter: function (value) { return asPercent ? formatPercent(value) : compactNumber(value); } }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } }
      : { type: "category", data: labels, axisLabel: { color: theme.muted, fontWeight: 700, rotate: labels.length > 6 ? 28 : 0 }, axisLine: { lineStyle: { color: theme.grid } } },
    yAxis: horizontal
      ? { type: "category", data: labels.slice().reverse(), axisLabel: { color: theme.muted, fontWeight: 700, width: 120, overflow: "truncate" }, axisLine: { lineStyle: { color: theme.grid } } }
      : { type: "value", axisLabel: { color: theme.muted, formatter: function (value) { return asPercent ? formatPercent(value) : compactNumber(value); } }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } },
    series: [{ type: "bar", barMaxWidth: 28, itemStyle: { borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0] }, data: horizontal ? values.slice().reverse() : values }]
  };
}
function disposeCharts() {
  Object.keys(chartInstances).forEach(function (key) {
    try {
      chartInstances[key].dispose();
    } catch (error) {
      console.warn("No se pudo destruir gráfica", key, error);
    }
    delete chartInstances[key];
  });
}
function resizeCharts() {
  Object.keys(chartInstances).forEach(function (key) {
    try {
      chartInstances[key].resize();
    } catch (error) {
      console.warn("No se pudo redimensionar gráfica", key, error);
    }
  });
}
function renderAllChartEmptyStates(message) {
  ["chartRegion", "chartCanal", "chartCategoria", "chartClientes", "chartPresentaciones", "chartCedi", "chartMes"].forEach(function (id) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = "<div class=\\"no-data\\">" + escapeHtml(message) + "</div>";
  });
}
function normalizeChartItems(items) {
  return (items || [])
    .map(function (item) {
      return {
        label: normalizeText(item.label) || "Sin dato",
        value: numberForCalc(item.value)
      };
    })
    .filter(function (item) {
      return Number.isFinite(item.value);
    });
}
function hasRenderableChartData(items) {
  return items.length > 0 && items.some(function (item) {
    return Math.abs(item.value) > 0;
  });
}
function renderNativeChart(element, type, items, asPercent, horizontal) {
  if (type === "donut") {
    renderNativeDonutChart(element, items, asPercent);
    return;
  }
  renderNativeBarChart(element, items, asPercent, horizontal);
}
function renderNativeBarChart(element, items, asPercent, horizontal) {
  const max = Math.max.apply(null, items.map(function (item) { return Math.abs(item.value); })) || 1;
  element.innerHTML = "<div class=\\"native-chart " + (horizontal ? "native-horizontal" : "native-vertical") + "\\">" + items.map(function (item) {
    const size = Math.max(3, Math.min(100, Math.abs(item.value) / max * 100));
    const valueText = asPercent ? formatPercent(item.value) : formatNumber(item.value);
    if (horizontal) {
      return "<div class=\\"native-row\\" title=\\"" + escapeHtml(item.label + ": " + valueText) + "\\"><span class=\\"native-label\\">" + escapeHtml(item.label) + "</span><span class=\\"native-track\\"><span class=\\"native-fill\\" style=\\"width:" + size.toFixed(2) + "%\\"></span></span><strong>" + escapeHtml(valueText) + "</strong></div>";
    }
    return "<div class=\\"native-column\\" title=\\"" + escapeHtml(item.label + ": " + valueText) + "\\"><span class=\\"native-column-fill\\" style=\\"height:" + size.toFixed(2) + "%\\"></span><small>" + escapeHtml(item.label) + "</small></div>";
  }).join("") + "</div>";
}
function renderNativeDonutChart(element, items, asPercent) {
  const total = items.reduce(function (acc, item) { return acc + Math.max(0, item.value); }, 0);
  const topItems = items.slice(0, 6);
  element.innerHTML = "<div class=\\"native-donut\\"><div class=\\"native-donut-center\\"><strong>" + escapeHtml(formatNumber(total)) + "</strong><span>Total</span></div><div class=\\"native-donut-list\\">" + topItems.map(function (item, index) {
    const valueText = asPercent ? formatPercent(item.value) : formatNumber(item.value);
    const percent = total ? Math.max(0, item.value) / total * 100 : 0;
    return "<div class=\\"native-donut-item\\"><span class=\\"native-swatch swatch-" + index + "\\"></span><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(valueText) + "</strong><small>" + percent.toFixed(1) + "%</small></div>";
  }).join("") + "</div></div>";
}
function renderTable() {
  const table = document.getElementById("detailTable");
  const rows = getTableRows();
  const totalPages = getTotalPages(rows);
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);
  const header = "<thead><tr>" + TABLE_COLUMNS.map(function (column) {
    const marker = state.sortField === column ? (state.sortDir === "asc" ? " ▲" : " ▼") : "";
    return "<th data-sort-field=\\"" + escapeHtml(column) + "\\">" + escapeHtml(column + marker) + "</th>";
  }).join("") + "</tr></thead>";
  const body = pageRows.length ? "<tbody>" + pageRows.map(function (row) {
    return "<tr>" + TABLE_COLUMNS.map(function (column) {
      const numeric = NUMERIC_FIELDS.has(column) && column !== "Año";
      if (column === "Estado de vigencia") return "<td>" + statusBadge(getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"])) + "</td>";
      return "<td class=\\"" + (numeric ? "numeric" : "") + "\\">" + escapeHtml(formatCell(row, column)) + "</td>";
    }).join("") + "</tr>";
  }).join("") + "</tbody>" : "<tbody><tr><td colspan=\\"" + TABLE_COLUMNS.length + "\\"><div class=\\"no-data\\">No hay datos para mostrar con los filtros seleccionados.</div></td></tr></tbody>";
  table.innerHTML = header + body;
  table.querySelectorAll("th").forEach(function (th) {
    th.addEventListener("click", function () {
      const field = th.dataset.sortField;
      if (state.sortField === field) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      else { state.sortField = field; state.sortDir = NUMERIC_FIELDS.has(field) ? "desc" : "asc"; }
      renderTable();
    });
  });
  document.getElementById("pageInfo").textContent = "Página " + state.page + " de " + totalPages + " · " + formatInteger(rows.length) + " fila(s)";
  document.getElementById("prevPageButton").disabled = state.page <= 1;
  document.getElementById("nextPageButton").disabled = state.page >= totalPages;
  refreshIcons();
}
function getTableRows() {
  const searched = state.filteredRows.slice();
  searched.sort(function (a, b) {
    const aValue = valueForSort(a, state.sortField);
    const bValue = valueForSort(b, state.sortField);
    if (aValue < bValue) return state.sortDir === "asc" ? -1 : 1;
    if (aValue > bValue) return state.sortDir === "asc" ? 1 : -1;
    return 0;
  });
  return searched;
}
function applySearch(rows) {
  if (!state.search) return rows;
  return rows.filter(function (row) {
    return TABLE_COLUMNS.some(function (column) {
      return normalizeText(formatCell(row, column)).toLocaleLowerCase("es-CO").includes(state.search);
    });
  });
}
function applyFilters(rows, filters) {
  return rows.filter(function (row) {
    return Object.keys(filters).every(function (field) {
      const selected = filters[field];
      if (!selected) return true;
      if (field === "Estado de vigencia") return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === selected;
      return normalizeText(row[field]) === selected;
    });
  });
}
function groupBySum(rows, groupField, valueField, limit) {
  const grouped = new Map();
  rows.forEach(function (row) {
    const rawKey = row[groupField];
    const key = rawKey === null || rawKey === undefined || String(rawKey).trim() === "" ? "Sin dato" : String(rawKey).trim();
    grouped.set(key, (grouped.get(key) || 0) + numberForCalc(row[valueField]));
  });
  let result = Array.from(grouped, function (entry) {
    return { label: entry[0], value: numberForCalc(entry[1]) };
  }).filter(function (item) {
    return Number.isFinite(item.value);
  }).sort(function (a, b) {
    return b.value - a.value;
  });
  if (limit) result = result.slice(0, limit);
  return result;
}
function getUniqueOptions(rows, field) {
  return Array.from(new Set(rows.map(function (row) { return field === "Estado de vigencia" ? getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) : normalizeText(row[field]); }).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, "es"); });
}
function groupComplianceByCedi(rows) {
  const grouped = new Map();
  rows.forEach(function (row) {
    const key = normalizeText(row["Cedi"]) || "Sin dato";
    if (!grouped.has(key)) grouped.set(key, { sales: 0, objective: 0 });
    const current = grouped.get(key);
    current.sales += numberForCalc(row["Ventas acumuladas negociacion"]);
    current.objective += numberForCalc(row["Objetivo cajas total"]);
  });
  return Array.from(grouped, function (entry) {
    return { label: entry[0], value: entry[1].objective > 0 ? entry[1].sales / entry[1].objective : 0 };
  }).sort(function (a, b) { return b.value - a.value; });
}
function salesByMonth(rows) {
  const field = rows.some(function (row) { return row["Año Mes"] !== null && row["Año Mes"] !== undefined; }) ? "Año Mes" : "Mes";
  return groupBySum(rows, field, "Ventas cajas físicas mes (sin rep)").sort(function (a, b) {
    const an = Number(a.label), bn = Number(b.label);
    return Number.isFinite(an) && Number.isFinite(bn) ? an - bn : String(a.label).localeCompare(String(b.label), "es");
  });
}
function exportFilteredCsv(rows) {
  return [TABLE_COLUMNS.join(",")].concat(rows.map(function (row) {
    return TABLE_COLUMNS.map(function (column) { return "\\"" + String(formatCell(row, column)).replace(/"/g, "\\"\\"") + "\\""; }).join(",");
  })).join("\\n");
}
function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function statusBadge(status) {
  const className = status === "Vigente" ? "status-vigente" : status === "No vigente" ? "status-no-vigente" : "status-sin-fechas";
  return "<span class=\\"status-pill " + className + "\\">" + escapeHtml(status) + "</span>";
}
function getVigenciaStatus(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return "Sin fechas";
  const start = dateOnly(fechaInicio), end = dateOnly(fechaFin);
  if (!start || !end) return "Sin fechas";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return today >= start && today <= end ? "Vigente" : "No vigente";
}
function formatCell(row, column) {
  if (column === "Estado de vigencia") return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]);
  const value = row[column];
  if (value === null || value === undefined || value === "") return "—";
  if (NUMERIC_FIELDS.has(column)) return column === "Porcentaje descuento" ? formatPercent(value) : formatNumber(value);
  return String(value);
}
function valueForSort(row, field) {
  if (field === "Estado de vigencia") return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]);
  const value = row[field];
  return NUMERIC_FIELDS.has(field) ? (isFiniteNumber(value) ? value : -Number.MAX_VALUE) : normalizeText(value);
}
function getTotalPages(rows) { return Math.max(1, Math.ceil(rows.length / state.pageSize)); }
function sumField(rows, field) { return rows.reduce(function (acc, row) { return acc + numberForCalc(row[field]); }, 0); }
function countUnique(rows, field) { return new Set(rows.map(function (row) { return normalizeText(row[field]); }).filter(Boolean)).size; }
function numberForCalc(value) {
  if (isFiniteNumber(value)) return value;
  if (value === null || value === undefined || value === "") return 0;
  const parsed = parseNumberLike(value);
  return isFiniteNumber(parsed) ? parsed : 0;
}
function isFiniteNumber(value) { return typeof value === "number" && Number.isFinite(value); }
function parseNumberLike(value) {
  let text = String(value).trim();
  if (!text || text === "-") return null;
  text = text.replace(/\\s/g, "").replace(/[^0-9,.-]/g, "");
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    text = text.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma > -1) {
    text = normalizeSingleSeparatorNumber(text, ",");
  } else if (lastDot > -1) {
    text = normalizeSingleSeparatorNumber(text, ".");
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}
function normalizeSingleSeparatorNumber(text, separator) {
  const parts = text.split(separator);
  if (parts.length === 1) return text;
  const last = parts[parts.length - 1];
  if (parts.length > 2 || last.length > 2) return parts.join("");
  return parts.slice(0, -1).join("") + "." + last;
}
function dateOnly(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(value))) return null;
  const parts = String(value).split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(date.getTime()) ? null : date;
}
function normalizeText(value) { return value === null || value === undefined ? "" : String(value).replace(/\\s+/g, " ").trim(); }
function roundNumber(value) { return Math.round(numberForCalc(value) * 100) / 100; }
function compactNumber(value) { return new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(numberForCalc(value)); }
function formatInteger(value) { return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(numberForCalc(value)); }
function formatNumber(value) { return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(numberForCalc(value)); }
function formatPercent(value) {
  if (!isFiniteNumber(value)) return "N/A";
  const displayValue = Math.abs(value) > 1 ? value / 100 : value;
  return new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 2 }).format(displayValue);
}
function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("es-CO");
}
function refreshIcons() { if (window.lucide) window.lucide.createIcons(); }
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
`;
}
