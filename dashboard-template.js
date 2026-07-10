"use strict";

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
const DASHBOARD_FAVICON_DATA_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230f766e'/%3E%3Cpath d='M17 45h30M21 37V27m11 10V18m11 19V24' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3Cpath d='M41 17h7v7' fill='none' stroke='%23ccfbf1' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

function generateDashboardHtml(payload) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const metadata = payload.metadata || {};

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Negociaciones</title>
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
            <input id="globalSearchInput" type="search" placeholder="Buscar cliente SAP, canal, cedi o presentación">
          </div>
          <div id="filtersGrid" class="filters-grid"></div>
        </section>

        <section id="charts" class="charts-grid">
          <article class="chart-card"><div><h2>Ventas por Región SAP</h2><p>Mapa aproximado por macrozonas comerciales. Las zonas se iluminan por Región SAP, no por venta departamental individual.</p></div><div id="chartRegion" class="chart region-map-host"></div></article>
          <article class="chart-card"><div><h2>Ventas por Canal</h2><p>Comparativo por canal comercial.</p></div><div id="chartCanal" class="chart"></div></article>
          <article class="chart-card"><div><h2>Ventas por Categoría</h2><p>Categorías AS400 con mayor volumen.</p></div><div id="chartCategoria" class="chart"></div></article>
          <article class="chart-card"><div><h2>Top 10 clientes SAP</h2><p>Clientes SAP con mayor total venta mes.</p></div><div id="chartClientes" class="chart"></div></article>
          <article class="chart-card"><div><h2>Top 10 presentaciones</h2><p>Presentaciones más relevantes por volumen.</p></div><div id="chartPresentaciones" class="chart"></div></article>
          <article class="chart-card"><div><h2>Cumplimiento por Cedi</h2><p>Total venta último mes frente a objetivo mes.</p></div><div id="chartCedi" class="chart"></div></article>
          <article class="chart-card chart-wide"><div><h2>Ventas por Mes / Año Mes</h2><p>Evolución temporal de total venta mes.</p></div><div id="chartMes" class="chart"></div></article>
          <article class="chart-card chart-wide"><div><h2>Presentaciones sin ventas por categoría</h2><p>Presentaciones negociadas para las que no se encontraron ventas dentro del periodo analizado.</p><p class="chart-action-hint"><i data-lucide="mouse-pointer-click"></i> Haz clic en una categoría para ver el detalle.</p></div><div id="chartSinVentasCategoria" class="chart"></div></article>
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
    <div id="detailExplorerOverlay" class="detail-explorer-overlay" hidden>
      <section id="detailExplorerDialog" class="detail-explorer-dialog" role="dialog" aria-modal="true" aria-labelledby="detailExplorerTitle" tabindex="-1">
        <header class="detail-explorer-header">
          <div>
            <p id="detailExplorerSubtitle" class="eyebrow">Exploración</p>
            <h2 id="detailExplorerTitle">Detalle</h2>
          </div>
          <button id="detailExplorerClose" class="icon-button" type="button" aria-label="Cerrar detalle"><i data-lucide="x"></i></button>
        </header>
        <div id="detailExplorerSelectionMessage" class="detail-selection-message" hidden></div>
        <div id="detailExplorerSummary" class="detail-summary"></div>
        <div id="detailExplorerToolbar" class="detail-toolbar"></div>
        <div id="detailExplorerBody" class="detail-body"></div>
      </section>
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
  --shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  --radius: 18px;
  --sidebar-bg: #ffffff;
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
  --shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  --sidebar-bg: #0f172a;
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
.icon-button {
  display: inline-grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--line); border-radius: 12px;
  background: var(--panel); color: var(--muted); cursor: pointer; transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.icon-button:hover { background: var(--primary-soft); color: var(--primary); transform: translateY(-1px); }
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
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
.kpi-card { min-width: 0; padding: 16px; border-left: 4px solid transparent; }
.kpi-card.kpi-attention { border-color: rgba(245, 158, 11, 0.42); background: linear-gradient(135deg, var(--panel), var(--amber-soft)); }
.kpi-card.kpi-attention .kpi-icon { background: var(--amber-soft); color: var(--amber); }
.kpi-card.kpi-positive { border-left-color: var(--emerald); background: linear-gradient(135deg, var(--panel), var(--emerald-soft)); }
.kpi-card.kpi-positive .kpi-icon { background: var(--emerald-soft); color: var(--emerald); }
.kpi-card.kpi-negative { border-left-color: var(--red); background: linear-gradient(135deg, var(--panel), var(--red-soft)); }
.kpi-card.kpi-negative .kpi-icon { background: var(--red-soft); color: var(--red); }
.kpi-card.kpi-neutral { border-left-color: var(--line); }
.kpi-card.kpi-secondary { background: var(--soft-bg); box-shadow: none; }
.kpi-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; margin-bottom: 14px; }
.kpi-icon { display: inline-grid; place-items: center; width: 38px; height: 38px; border-radius: 14px; background: var(--primary-soft); color: var(--primary); }
.kpi-value { display: block; margin-bottom: 6px; overflow-wrap: anywhere; font-size: clamp(1.35rem, 2vw, 1.85rem); font-weight: 800; letter-spacing: -0.04em; }
.kpi-status { display: inline-flex; align-items: center; min-height: 24px; margin-bottom: 8px; padding: 0 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 0.72rem; font-weight: 800; }
.kpi-positive .kpi-status { border-color: rgba(16, 185, 129, 0.32); color: var(--emerald); background: var(--emerald-soft); }
.kpi-negative .kpi-status { border-color: rgba(239, 68, 68, 0.32); color: var(--red); background: var(--red-soft); }
.kpi-description { margin: 0; color: var(--muted); font-size: 0.82rem; line-height: 1.42; }
.charts-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 18px; }
.chart-card { min-width: 0; min-height: 390px; padding: 18px; }
.chart-card p { margin: 6px 0 0; color: var(--muted); font-size: 0.9rem; }
.chart-action-hint { display: inline-flex; gap: 6px; align-items: center; font-weight: 800; color: var(--primary) !important; }
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
.native-row[role="button"], .native-column[role="button"], .native-donut-item[role="button"] { cursor: pointer; }
.native-row[role="button"]:focus-visible, .native-column[role="button"]:focus-visible, .native-donut-item[role="button"]:focus-visible {
  outline: 3px solid rgba(13, 148, 136, 0.32); outline-offset: 3px;
}
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
.region-map-host { height: auto; min-height: 340px; }
.region-map-layout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.75fr); gap: 16px; align-items: stretch; min-height: 340px; }
.region-map-canvas { min-height: 340px; border: 1px solid var(--line); border-radius: 14px; background: var(--soft-bg); }
.region-ranking { display: grid; align-content: start; gap: 10px; min-width: 0; }
.region-ranking-title { margin: 0; color: var(--muted); font-size: 0.73rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
.region-ranking-list { display: grid; gap: 9px; }
.region-ranking-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 9px 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); color: var(--ink); font-weight: 800; }
.region-ranking-row[role="button"] { cursor: pointer; }
.region-ranking-row:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.28); outline-offset: 2px; }
.region-ranking-name { display: inline-flex; gap: 8px; align-items: center; min-width: 0; }
.region-ranking-name span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.region-dot { width: 10px; height: 10px; border-radius: 999px; flex: 0 0 auto; background: var(--primary); }
.region-ranking-value { color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.region-map-note { margin: 0; color: var(--muted); font-size: 0.78rem; line-height: 1.4; }
.region-unmapped { padding: 9px 10px; border: 1px solid rgba(245, 158, 11, 0.32); border-radius: 12px; background: var(--amber-soft); color: var(--amber); font-size: 0.78rem; font-weight: 800; line-height: 1.4; }
.table-tools { display: flex; gap: 10px; align-items: end; }
.table-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 14px; }
table { width: 100%; min-width: 1400px; border-collapse: separate; border-spacing: 0; }
th, td { padding: 12px 13px; border-bottom: 1px solid var(--line); font-size: 0.86rem; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
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
.detail-explorer-overlay {
  position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 22px;
  background: rgba(15, 23, 42, 0.48); backdrop-filter: blur(4px);
}
.detail-explorer-overlay[hidden] { display: none; }
.detail-explorer-dialog {
  display: grid; grid-template-rows: auto auto auto auto minmax(0, 1fr); width: min(1120px, 100%); max-height: min(86vh, 860px);
  overflow: hidden; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); box-shadow: 0 28px 70px rgba(15, 23, 42, 0.26);
  animation: detailDialogIn 0.16s ease-out;
}
@keyframes detailDialogIn { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: none; } }
.detail-explorer-header { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; padding: 18px 20px 14px; border-bottom: 1px solid var(--line); }
.detail-explorer-header h2 { margin: 4px 0 0; font-size: 1.2rem; }
.detail-selection-message { margin: 14px 20px 0; padding: 12px 14px; border: 1px solid rgba(245, 158, 11, 0.32); border-radius: 12px; background: var(--amber-soft); color: var(--amber); font-weight: 800; }
.detail-summary { display: flex; flex-wrap: wrap; justify-content: center; gap: 0; padding: 12px 20px 0; color: var(--muted); text-align: center; }
.detail-metric { min-width: 118px; padding: 0 16px; border-right: 1px solid var(--line); }
.detail-metric:last-child { border-right: 0; }
.detail-metric span { display: block; color: var(--muted); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
.detail-metric strong { display: block; margin-top: 3px; color: var(--ink); font-size: 0.98rem; overflow-wrap: anywhere; }
.detail-toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) 170px auto auto auto; gap: 8px; align-items: end; padding: 12px 20px; }
.detail-toolbar .quick-search { margin: 0; min-height: 40px; }
.detail-toolbar label { min-width: 0; }
.detail-body { min-height: 0; padding: 0 20px 20px; overflow: auto; }
.detail-table-wrap { overflow: auto; max-height: min(48vh, 460px); border: 1px solid var(--line); border-radius: 14px; }
.detail-table { min-width: 760px; }
.detail-table tbody tr { cursor: pointer; }
.detail-table tbody tr:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.28); outline-offset: -3px; }
.detail-footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 12px; color: var(--muted); font-weight: 800; }
.detail-card-list { display: none; gap: 10px; }
.detail-card { display: grid; gap: 6px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--soft-bg); cursor: pointer; }
.detail-card:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.28); outline-offset: 3px; }
.detail-card strong { color: var(--ink); }
.detail-card span { color: var(--muted); font-size: 0.82rem; font-weight: 800; }
.presentation-detail { display: grid; gap: 14px; }
.detail-back-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
.detail-section { display: grid; gap: 10px; padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--soft-bg); }
.detail-section h3 { margin: 0; font-size: 0.92rem; }
.detail-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px 16px; }
.detail-field { min-width: 0; }
.detail-field span { display: block; color: var(--muted); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
.detail-field strong { display: block; margin-top: 5px; color: var(--ink); overflow-wrap: anywhere; }
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
  .region-map-layout { grid-template-columns: 1fr; }
  .region-map-canvas { min-height: 300px; }
}
@media (max-width: 820px) {
  .main { padding: 20px 12px 34px; }
  .executive-header, .panel-heading { display: grid; }
  .header-actions, .active-filters { justify-content: flex-start; max-width: none; }
  .filters-grid, .charts-grid, .sidebar-nav { grid-template-columns: 1fr; }
  .detail-explorer-overlay { padding: 8px; place-items: stretch; }
  .detail-explorer-dialog { width: 100%; max-height: calc(100vh - 16px); border-radius: 16px; }
  .detail-toolbar { grid-template-columns: 1fr; }
  .detail-table-wrap { display: none; }
  .detail-card-list { display: grid; }
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
const SALES_INFORMATION_STATUS = {
  WITHOUT_SALES_INFO: "SIN_INFORMACION_VENTA",
  ZERO_SALE: "VENTA_CERO",
  WITH_SALE: "CON_VENTA"
};
const TABLE_COLUMNS = [
  "Año", "Mes", "Canal", "Categoría AS400 de la venta", "Región SAP", "Cedi",
  "Cliente SAP - Clave", "Presentación AS400 de la venta - Texto",
  "Ventas cajas físicas (sin rep)", "TotalVentaMes", "Objetivo mes ", "Objetivo cajas total",
  "Porcentaje descuento", "Fecha inicio", "Fecha fin", "Estado de vigencia"
];
const WITHOUT_SALES_DETAIL_COLUMNS = [
  "Cliente SAP - Clave",
  "Cliente AS400 - Nombre negocio (Texto)",
  "Cliente AS400 - Texto",
  "ID Actividad",
  "Categoría AS400 de la venta",
  "Presentación AS400 de la venta - Texto",
  "Presentación AS400 de la venta - Clave",
  "Objetivo mes ",
  "Objetivo cajas total",
  "Tipo descuento",
  "Porcentaje descuento",
  "Fecha inicio",
  "Fecha fin",
  "Cedi"
];
const NO_SALES_EXPLORER_COLUMNS = [
  { id: "presentation", label: "Presentación" },
  { id: "client", label: "Cliente" },
  { id: "activity", label: "Actividad" },
  { id: "objectiveMonth", label: "Objetivo mes", numeric: true },
  { id: "endDate", label: "Fecha fin" }
];
const NO_SALES_EXPLORER_SORT_OPTIONS = [
  { field: "presentation", label: "Presentación", dir: "asc" },
  { field: "objectiveMonth", label: "Objetivo mes", dir: "desc" },
  { field: "objectiveTotal", label: "Objetivo total", dir: "desc" },
  { field: "endDate", label: "Fecha fin", dir: "asc" }
];
const DETAIL_EXPLORER_VISIBLE_STEP = 60;
const DETAIL_EXPLORER_FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
const SEARCH_FIELDS = Array.from(new Set(TABLE_COLUMNS.concat(WITHOUT_SALES_DETAIL_COLUMNS)));
const NUMERIC_FIELDS = new Set(["Año", "Año Mes", "Ventas cajas físicas (sin rep)", "TotalVentaMes", "Objetivo mes ", "Objetivo cajas total", "Porcentaje descuento"]);
const CATEGORY_FIELDS = [
  "Categoría AS400 de la venta",
  "Categoria AS400 de la venta",
  "Categoría AS400 de venta",
  "Categoria AS400 de venta",
  "Categoría AS400",
  "Categoria AS400",
  "Categoría",
  "Categoria"
];
const SAP_REGION_DEPARTMENT_MAP = {
  "Antioquia": ["Antioquia"],
  "Centro Norte": ["Santander", "Norte de Santander", "Boyacá"],
  "Centro Sur": ["Bogotá D.C.", "Cundinamarca", "Tolima", "Huila", "Caquetá"],
  "Costa": ["Atlántico", "Bolívar", "Cesar", "Córdoba", "La Guajira", "Magdalena", "Sucre", "San Andrés y Providencia"],
  "Occidente": ["Valle del Cauca", "Cauca", "Nariño", "Chocó", "Caldas", "Risaralda", "Quindío"],
  "Oriente": ["Arauca", "Casanare", "Meta", "Vichada", "Guainía", "Guaviare", "Vaupés", "Amazonas", "Putumayo"]
};
const SAP_REGION_COLORS = {
  "Antioquia": "#0f766e",
  "Centro Norte": "#2563eb",
  "Centro Sur": "#d97706",
  "Costa": "#e11d48",
  "Occidente": "#7c3aed",
  "Oriente": "#16a34a"
};
const SAP_REGION_ZONE_MARKERS = {
  "Costa": { coord: [-74.8, 10.4], size: 46 },
  "Antioquia": { coord: [-75.6, 6.3], size: 38 },
  "Centro Norte": { coord: [-73.1, 6.8], size: 40 },
  "Centro Sur": { coord: [-74.4, 3.8], size: 42 },
  "Occidente": { coord: [-76.3, 4.4], size: 44 },
  "Oriente": { coord: [-70.9, 4.2], size: 52 }
};
const COLOMBIA_MAP_NAME = "colombiaSapRegions";
const COLOMBIA_GEOJSON_URL = "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/COL/ADM1/geoBoundaries-COL-ADM1_simplified.geojson";
const DEPARTMENT_NAME_ALIASES = {
  "bogota": "Bogotá D.C.",
  "bogota dc": "Bogotá D.C.",
  "distrito capital": "Bogotá D.C.",
  "valle": "Valle del Cauca",
  "san andres": "San Andrés y Providencia",
  "san andres y providencia": "San Andrés y Providencia",
  "archipielago de san andres providencia y santa catalina": "San Andrés y Providencia"
};
const DASHBOARD_THEME_KEY = "negotiationsDashboardTheme";
const NO_SALES_WITHOUT_CATEGORY_MESSAGE = "Hay presentaciones sin ventas, pero no tienen una categoría disponible para realizar la agrupación.";
const chartInstances = {};
let colombiaGeoJsonCache = null;
let regionMapRenderToken = 0;
const debouncedResizeCharts = debounce(resizeCharts, 160);
const state = { filters: {}, filteredRows: [], noSalesAnalysis: getEmptyNoSalesAnalysis(), detailExplorer: getEmptyDetailExplorerState(), search: "", page: 1, pageSize: 10, sortField: "Ventas cajas físicas (sin rep)", sortDir: "desc" };
const chartDrilldowns = {
  noSalesByCategory: {
    open: function (category, sourceElement, analysis) {
      openNoSalesCategoryDetail(category, analysis || state.noSalesAnalysis, sourceElement);
    }
  }
};
document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  initTheme();
  initSidebar();
  renderHeaderContext();
  validateDashboardDataShape(DASHBOARD_DATA);
  populateFilters();
  bindEvents();
  window.addEventListener("resize", debouncedResizeCharts);
  window.addEventListener("beforeunload", disposeCharts);
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
  if (!document.documentElement || !document.documentElement.dataset) return "light";
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
  if (state.filteredRows.length) renderCharts(state.filteredRows, state.noSalesAnalysis);
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
  const requiredFields = ["Región SAP", "Canal", "Categoría AS400 de la venta", "Ventas cajas físicas (sin rep)", "TotalVentaMes", "Objetivo mes ", "estadoInformacionVenta"];
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
  bindDetailExplorerEvents();
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
  const filterConfigs = FILTER_FIELDS.map(function (item) {
    return { item: item, options: getUniqueOptions(DASHBOARD_DATA, item.field) };
  }).filter(function (config) {
    return config.options.length > 0;
  });
  container.innerHTML = filterConfigs.map(function (config) {
    const item = config.item;
    const options = config.options;
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
  state.noSalesAnalysis = getNoSalesAnalysis(state.filteredRows);
  renderActiveFilters();
  renderKpis(state.filteredRows, state.noSalesAnalysis);
  renderCharts(state.filteredRows, state.noSalesAnalysis);
  renderTable();
  syncOpenDetailExplorer();
  refreshIcons();
}
function renderActiveFilters() {
  const active = Object.keys(state.filters).filter(function (key) { return state.filters[key]; });
  document.getElementById("activeFilters").innerHTML = active.length ? active.map(function (field) {
    return "<span class=\\"filter-chip\\">" + escapeHtml(field) + ": " + escapeHtml(state.filters[field]) + "</span>";
  }).join("") : "<span class=\\"badge badge-muted\\">Sin filtros activos</span>";
}
function applyChartFilter(field, value) {
  if (!field || !value) return;
  if (state.filters[field] === value) {
    delete state.filters[field];
  } else {
    state.filters[field] = value;
  }
  document.querySelectorAll("[data-filter-field]").forEach(function (select) {
    if (select.dataset.filterField === field) select.value = state.filters[field] || "";
  });
  state.page = 1;
  renderAll();
}
function computeKpis(rows, noSalesAnalysis) {
  const salesPeriod = sumUniqueTotalSalesMonth(rows);
  const latestMonthRows = getLatestYearMonthRows(rows);
  const salesMonth = sumUniqueTotalSalesMonth(latestMonthRows);
  const objective = sumUniqueActivityObjective(rows);
  const discounts = rows.map(function (row) { return row["Porcentaje descuento"]; }).filter(isFiniteNumber);
  const analysis = noSalesAnalysis || getNoSalesAnalysis(rows);
  const negotiatedPresentationCount = countUniqueBy(rows.filter(hasNegotiatedPresentationReference), getNegotiatedPresentationKey);
  return {
    salesPeriod: salesPeriod,
    salesMonth: salesMonth,
    objective: objective,
    compliance: objective ? salesMonth / objective : null,
    objectiveDifference: salesMonth - objective,
    uniqueClients: countUnique(rows, "Cliente SAP - Clave"),
    uniquePresentations: countUnique(rows, "Presentación AS400 de la venta - Clave"),
    uniqueActivities: countUnique(rows, "ID Actividad"),
    averageDiscount: discounts.length ? discounts.reduce(function (acc, value) { return acc + value; }, 0) / discounts.length : null,
    activeNegotiations: rows.filter(function (row) { return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === "Vigente"; }).length,
    presentationsWithoutSales: analysis.presentationCount,
    percentPresentationsWithoutSales: negotiatedPresentationCount ? analysis.presentationCount / negotiatedPresentationCount : null,
    affectedActivities: analysis.activityCount || null,
    affectedClients: analysis.clientCount || null
  };
}
function renderKpis(rows, noSalesAnalysis) {
  const k = computeKpis(rows, noSalesAnalysis);
  const withoutSalesDescription = buildWithoutSalesKpiDescription(k);
  const differenceState = getObjectiveDifferenceState(k.objectiveDifference);
  const filterBadge = hasActiveDashboardFilters() ? "Filtros activos" : "Vista general";
  const items = [
    { icon: "shopping-bag", title: "Ventas del período", value: formatNumber(k.salesPeriod), description: "Ventas acumuladas dentro de los filtros actuales." },
    { icon: "calendar-days", title: "Ventas del último mes", value: formatNumber(k.salesMonth), description: "Valor del último Año Mes disponible en la selección." },
    { icon: "target", title: "Objetivo del mes", value: formatNumber(k.objective), description: "Meta mensual agregada una vez por actividad." },
    { icon: "gauge", title: "Cumplimiento del objetivo", value: k.compliance === null ? "N/A" : formatRatioPercent(k.compliance), description: "Avance de la venta del último mes frente al objetivo." },
    { icon: differenceState.icon, title: "Diferencia frente al objetivo", value: formatSignedNumber(k.objectiveDifference), description: "Ventas del último mes menos objetivo del mes.", className: differenceState.className, status: differenceState.label },
    { icon: "package-x", title: "Presentaciones sin ventas", value: formatInteger(k.presentationsWithoutSales), description: withoutSalesDescription, className: "kpi-attention kpi-secondary" },
    { icon: "calendar-check", title: "Negociaciones vigentes", value: formatInteger(k.activeNegotiations), description: "Registros con fechas vigentes a la fecha actual.", className: "kpi-secondary" }
  ];
  document.getElementById("kpis").innerHTML = items.map(function (item) {
    const className = item.className ? "kpi-card " + item.className : "kpi-card";
    const status = item.status ? "<span class=\\"kpi-status\\">" + escapeHtml(item.status) + "</span>" : "";
    return "<article class=\\"" + className + "\\"><div class=\\"kpi-top\\"><span class=\\"kpi-icon\\"><i data-lucide=\\"" + item.icon + "\\"></i></span><span class=\\"badge badge-muted\\">" + escapeHtml(filterBadge) + "</span></div><span class=\\"kpi-label\\">" + escapeHtml(item.title) + "</span><strong class=\\"kpi-value\\">" + escapeHtml(item.value) + "</strong>" + status + "<p class=\\"kpi-description\\">" + escapeHtml(item.description) + "</p></article>";
  }).join("");
}
function getObjectiveDifferenceState(value) {
  if (value > 0) return { label: "Por encima del objetivo", className: "kpi-positive", icon: "trending-up" };
  if (value < 0) return { label: "Por debajo del objetivo", className: "kpi-negative", icon: "trending-down" };
  return { label: "En objetivo", className: "kpi-neutral", icon: "minus" };
}
function hasActiveDashboardFilters() {
  return Object.keys(state.filters || {}).some(function (field) {
    return normalizeText(state.filters[field]);
  });
}
function buildWithoutSalesKpiDescription(kpi) {
  const details = [];
  if (isFiniteNumber(kpi.percentPresentationsWithoutSales)) {
    details.push(formatRatioPercent(kpi.percentPresentationsWithoutSales) + " de presentaciones negociadas");
  }
  if (kpi.affectedActivities) {
    details.push(formatInteger(kpi.affectedActivities) + " actividad(es)");
  }
  if (kpi.affectedClients) {
    details.push(formatInteger(kpi.affectedClients) + " cliente(s)");
  }
  return details.length ? details.join(" · ") : "Sin ventas encontradas dentro del periodo analizado";
}
function renderCharts(rows, noSalesAnalysis) {
  disposeCharts();
  if (!rows.length) {
    renderAllChartEmptyStates("No hay datos para mostrar con los filtros seleccionados.");
    return;
  }
  const monthField = getMonthChartField(rows);
  renderRegionSalesMap(rows);
  renderChart("chartCanal", "donut", groupUniqueTotalSalesByField(rows, "Canal", 10), false, false, "Canal");
  renderChartFromFields("chartCategoria", "bar", rows, "Categoría AS400 de la venta", "Ventas cajas físicas (sin rep)", false, true, 12);
  renderChart("chartClientes", "bar", groupUniqueTotalSalesByField(rows, "Cliente SAP - Clave", 10), false, true, "Cliente SAP - Clave");
  renderChartFromFields("chartPresentaciones", "bar", rows, "Presentación AS400 de la venta - Texto", "Ventas cajas físicas (sin rep)", false, true, 10);
  renderChart("chartCedi", "bar", groupComplianceByCedi(rows).slice(0, 12), true, true, "Cedi");
  renderChart("chartMes", "line", salesByMonth(rows), false, false, monthField);
  renderNoSalesCategoryChart(noSalesAnalysis || getNoSalesAnalysis(rows));
}
function renderNoSalesCategoryChart(noSalesAnalysis) {
  const analysis = noSalesAnalysis || getEmptyNoSalesAnalysis();
  if (analysis.presentationCount > 0 && !analysis.byCategory.length) {
    renderChartMessage("chartSinVentasCategoria", NO_SALES_WITHOUT_CATEGORY_MESSAGE);
    return;
  }
  renderChart("chartSinVentasCategoria", "bar", analysis.byCategory, false, true, null, {
    showLabels: true,
    integerValues: true,
    includePercentTooltip: true,
    tooltipNote: "Sin ventas significa que no se encontraron ventas dentro del periodo analizado.",
    onClick: function (category, eventInfo) {
      chartDrilldowns.noSalesByCategory.open(category, eventInfo && eventInfo.sourceElement, analysis);
    },
    actionLabel: "Ver presentaciones sin ventas de"
  });
}
function renderRegionSalesMap(rows) {
  const element = document.getElementById("chartRegion");
  if (!element) return;
  const renderToken = ++regionMapRenderToken;
  const regionItems = groupUniqueTotalSalesByField(rows, "Región SAP", 12);
  const model = buildSapRegionMapModel(regionItems);
  if (!hasRenderableChartData(model.rankingItems)) {
    disposeRegionMapChart();
    element.innerHTML = "<div class=\\"no-data\\">No hay datos para mostrar con los filtros seleccionados.</div>";
    return;
  }
  if (!window.echarts || !window.fetch) {
    renderRegionMapFallback(element, model, "Mapa no disponible; se muestra el ranking por Región SAP.");
    return;
  }
  renderRegionMapFallback(element, model, "Cargando mapa de Colombia; el ranking ya está disponible.");
  loadColombiaGeoJson().then(function (geoJson) {
    if (renderToken !== regionMapRenderToken) return;
    renderRegionMapWithGeoJson(element, model, geoJson);
  }).catch(function (error) {
    console.warn("No se pudo cargar el GeoJSON de Colombia. Se usa ranking nativo.", error);
    if (renderToken === regionMapRenderToken) renderRegionMapFallback(element, model, "Mapa no disponible; se muestra el ranking por Región SAP.");
  });
}
function renderRegionMapWithGeoJson(element, model, geoJson) {
  disposeRegionMapChart();
  element.innerHTML = "<div class=\\"region-map-layout\\"><div id=\\"chartRegionMap\\" class=\\"region-map-canvas\\" role=\\"img\\" aria-label=\\"Mapa aproximado de Colombia por Región SAP\\"></div>" + buildRegionRankingHtml(model, "") + "</div>";
  try {
    window.echarts.registerMap(COLOMBIA_MAP_NAME, geoJson);
    const chartElement = document.getElementById("chartRegionMap");
    const chart = window.echarts.init(chartElement, null, { renderer: "canvas" });
    chart.setOption(buildRegionMapOption(model), true);
    chart.on("click", function (params) {
      const data = params && params.data ? params.data : null;
      if (data && data.sapRegion) applyChartFilter("Región SAP", data.sapRegion);
    });
    chartInstances.chartRegionMap = chart;
    bindNativeChartInteractions(element, {});
  } catch (error) {
    console.warn("No se pudo renderizar el mapa de Colombia. Se usa ranking nativo.", error);
    delete chartInstances.chartRegionMap;
    renderRegionMapFallback(element, model, "Mapa no disponible; se muestra el ranking por Región SAP.");
  }
}
function loadColombiaGeoJson() {
  if (colombiaGeoJsonCache) return Promise.resolve(colombiaGeoJsonCache);
  return window.fetch(COLOMBIA_GEOJSON_URL)
    .then(function (response) {
      if (!response.ok) throw new Error("No se pudo cargar GeoJSON: " + response.status);
      return response.json();
    })
    .then(function (geoJson) {
      if (!geoJson || geoJson.type !== "FeatureCollection" || !Array.isArray(geoJson.features)) {
        throw new Error("GeoJSON de Colombia inválido.");
      }
      colombiaGeoJsonCache = geoJson;
      return geoJson;
    });
}
function renderRegionMapFallback(element, model, note) {
  disposeRegionMapChart();
  element.innerHTML = "<div class=\\"region-map-layout\\"><div class=\\"region-map-canvas no-data\\">" + escapeHtml(note) + "</div>" + buildRegionRankingHtml(model, note) + "</div>";
  bindNativeChartInteractions(element, {});
}
function disposeRegionMapChart() {
  if (!chartInstances.chartRegionMap) return;
  try {
    chartInstances.chartRegionMap.dispose();
  } catch (error) {
    console.warn("No se pudo destruir mapa previo", error);
  }
  delete chartInstances.chartRegionMap;
}
function buildRegionRankingHtml(model, note) {
  const max = Math.max.apply(null, model.rankingItems.map(function (item) { return Math.abs(item.value); })) || 1;
  const rows = model.rankingItems.map(function (item) {
    const color = getSapRegionColor(item.label);
    const width = Math.max(3, Math.min(100, Math.abs(item.value) / max * 100));
    const valueText = formatNumber(item.value);
    return "<div class=\\"region-ranking-row\\" title=\\"" + escapeHtml(item.label + ": " + valueText) + "\\" role=\\"button\\" tabindex=\\"0\\" data-chart-filter-field=\\"Región SAP\\" data-chart-filter-value=\\"" + escapeHtml(item.label) + "\\"><span class=\\"region-ranking-name\\"><span class=\\"region-dot\\" style=\\"background:" + escapeHtml(color) + "\\"></span><span>" + escapeHtml(item.label) + "</span></span><strong class=\\"region-ranking-value\\">" + escapeHtml(valueText) + "</strong><span class=\\"native-track\\" style=\\"grid-column:1 / -1\\"><span class=\\"native-fill\\" style=\\"width:" + width.toFixed(2) + "%;background:" + escapeHtml(color) + "\\"></span></span></div>";
  }).join("");
  const unmapped = model.unmappedRegions.length ? "<div class=\\"region-unmapped\\">Regiones no mapeadas: " + escapeHtml(model.unmappedRegions.map(function (item) { return item.label; }).join(", ")) + "</div>" : "";
  const noteText = note ? "<p class=\\"region-map-note\\">" + escapeHtml(note) + "</p>" : "<p class=\\"region-map-note\\">El ranking conserva la misma venta regional que alimenta el mapa.</p>";
  return "<aside class=\\"region-ranking\\"><p class=\\"region-ranking-title\\">Ranking por Región SAP</p><div class=\\"region-ranking-list\\">" + rows + "</div>" + unmapped + noteText + "</aside>";
}
function buildSapRegionMapModel(regionItems) {
  const rankingItems = normalizeChartItems(regionItems);
  const total = rankingItems.reduce(function (acc, item) { return acc + Math.max(0, item.value); }, 0);
  const knownRegionNames = Object.keys(SAP_REGION_DEPARTMENT_MAP);
  const knownRegions = knownRegionNames.reduce(function (acc, region) {
    acc[normalizeMapName(region)] = region;
    return acc;
  }, {});
  const regionTotals = {};
  const unmappedRegions = [];
  rankingItems.forEach(function (item) {
    const region = knownRegions[normalizeMapName(item.label)];
    if (region) regionTotals[region] = item.value;
    else unmappedRegions.push(item);
  });
  const zoneData = Object.keys(regionTotals).map(function (region) {
    const marker = SAP_REGION_ZONE_MARKERS[region];
    const value = regionTotals[region];
    if (!marker) return null;
    return {
      name: region,
      sapRegion: region,
      value: [marker.coord[0], marker.coord[1], value],
      regionValue: value,
      participation: total ? value / total : 0,
      color: getSapRegionColor(region),
      symbolSize: marker.size
    };
  }).filter(Boolean);
  return {
    rankingItems: rankingItems,
    zoneData: zoneData,
    unmappedRegions: unmappedRegions,
    regionTotals: regionTotals,
    total: total
  };
}
function buildRegionMapOption(model) {
  const theme = getChartThemeColors();
  return {
    tooltip: {
      trigger: "item",
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      textStyle: { color: theme.tooltipText, fontWeight: 700 },
      formatter: function (params) {
        const data = params && params.data ? params.data : {};
        if (!data.sapRegion) {
          return "Mapa base de Colombia<br><span style=\\"font-weight:600;color:" + theme.muted + "\\">Zonas comerciales aproximadas</span>";
        }
        return "Región SAP: " + escapeHtml(data.sapRegion) + "<br>Ventas de la región: " + escapeHtml(formatNumber(data.regionValue)) + " cajas<br>Participación: " + escapeHtml(formatRatioPercent(data.participation)) + "<br><span style=\\"font-weight:600;color:" + theme.muted + "\\">Haz clic para filtrar</span>";
      }
    },
    geo: {
      map: COLOMBIA_MAP_NAME,
      roam: false,
      silent: true,
      layoutCenter: ["50%", "52%"],
      layoutSize: "94%",
      itemStyle: {
        areaColor: getNeutralMapColor(),
        borderColor: getCurrentTheme() === "dark" ? "#334155" : "#cbd5e1",
        borderWidth: 1.2
      },
      emphasis: {
        disabled: true
      }
    },
    series: [{
      name: "Regiones SAP",
      type: "scatter",
      coordinateSystem: "geo",
      symbol: "circle",
      symbolSize: function (value, params) {
        return params && params.data ? params.data.symbolSize : 46;
      },
      data: model.zoneData,
      itemStyle: {
        color: function (params) {
          return params && params.data ? params.data.color : "#0f766e";
        },
        opacity: 0.72,
        borderColor: function (params) {
          return params && params.data ? params.data.color : "#0f766e";
        },
        borderWidth: 2
      },
      emphasis: {
        scale: true,
        itemStyle: { opacity: 0.52, shadowBlur: 12, shadowColor: "rgba(15, 23, 42, 0.22)" }
      }
    }, {
      name: "Centro de región",
      type: "scatter",
      coordinateSystem: "geo",
      symbol: "circle",
      symbolSize: 8,
      silent: true,
      tooltip: { show: false },
      data: model.zoneData,
      itemStyle: {
        color: function (params) {
          return params && params.data ? params.data.color : "#0f766e";
        },
        opacity: 0.9,
        borderColor: "#ffffff",
        borderWidth: 1
      }
    }]
  };
}
function renderChartFromFields(elementId, type, rows, groupField, valueField, asPercent, horizontal, limit) {
  if (!hasField(rows, groupField) || !hasField(rows, valueField)) {
    renderChartMessage(elementId, "No se encontró el campo necesario para esta gráfica.");
    return;
  }
  renderChart(elementId, type, groupBySum(rows, groupField, valueField, limit), asPercent, horizontal, groupField);
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
function renderChart(elementId, type, items, asPercent, horizontal, filterField, options) {
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
    renderNativeChart(element, type, chartItems, asPercent, horizontal, filterField, options || {});
    return;
  }
  if (chartInstances[elementId]) {
    try {
      chartInstances[elementId].dispose();
    } catch (error) {
      console.warn("No se pudo destruir grafica previa", elementId, error);
    }
    delete chartInstances[elementId];
  }
  element.innerHTML = "";
  try {
    const chart = window.echarts.init(element, null, { renderer: "canvas" });
    chart.setOption(buildEChartOption(type, chartItems, asPercent, horizontal, options || {}), true);
    if (chart.off) chart.off("click");
    if (options && typeof options.onClick === "function") {
      element.style.cursor = "pointer";
      chart.on("click", function (params) {
        if (!params || !params.name) return;
        if (params.componentType && params.componentType !== "series") return;
        options.onClick(String(params.name), { params: params, sourceElement: element });
      });
    } else if (filterField) {
      element.style.cursor = "pointer";
      chart.on("click", function (params) {
        if (params && params.name) applyChartFilter(filterField, String(params.name));
      });
    } else {
      element.style.cursor = "";
    }
    chartInstances[elementId] = chart;
  } catch (error) {
    console.warn("Error renderizando gráfica con ECharts. Se usa renderizado nativo para", elementId, error);
    delete chartInstances[elementId];
    renderNativeChart(element, type, chartItems, asPercent, horizontal, filterField, options || {});
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
function buildEChartOption(type, items, asPercent, horizontal, options) {
  options = options || {};
  const labels = items.map(function (item) { return item.label; });
  const values = items.map(function (item) { return roundChartValue(item.value, options); });
  const total = values.reduce(function (acc, value) { return acc + Math.max(0, numberForCalc(value)); }, 0);
  const theme = getChartThemeColors();
  const colors = theme.colors;
  const tooltip = {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    textStyle: { color: theme.tooltipText, fontWeight: 700 }
  };
  const valueFormatter = function (value) { return formatChartValue(value, asPercent, options); };
  if (type === "donut") {
    return {
      color: colors,
      tooltip: Object.assign({ trigger: "item", valueFormatter: valueFormatter }, tooltip),
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
      tooltip: Object.assign({ trigger: "axis", valueFormatter: valueFormatter }, tooltip),
      grid: { left: 18, right: 18, top: 28, bottom: 42, containLabel: true },
      xAxis: { type: "category", data: labels, axisLabel: { color: theme.muted, fontWeight: 700 }, axisLine: { lineStyle: { color: theme.grid } } },
      yAxis: { type: "value", axisLabel: { color: theme.muted, formatter: compactNumber }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } },
      series: [{ type: "line", smooth: true, symbolSize: 7, areaStyle: { opacity: 0.16 }, lineStyle: { width: 3 }, data: values }]
    };
  }
  const barTooltip = options.includePercentTooltip
    ? {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          const point = Array.isArray(params) ? params[0] : params;
          const value = numberForCalc(point && point.value);
          const percent = total ? value / total : 0;
          const label = point && point.name ? point.name : "";
          const note = options.tooltipNote ? "<br><span style=\\"font-weight:600;color:" + theme.muted + "\\">" + escapeHtml(options.tooltipNote) + "</span>" : "";
          return "<strong>" + escapeHtml(label) + "</strong><br>Cantidad: " + escapeHtml(formatChartValue(value, asPercent, options)) + "<br>Porcentaje: " + escapeHtml(formatRatioPercent(percent)) + note;
        }
      }
    : { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: valueFormatter };
  const barLabel = options.showLabels
    ? { show: true, position: horizontal ? "right" : "top", color: theme.text, fontWeight: 800, formatter: function (params) { return formatChartValue(params.value, asPercent, options); } }
    : undefined;
  return {
    color: colors,
    tooltip: Object.assign(barTooltip, tooltip),
    grid: { left: 18, right: 18, top: 24, bottom: 28, containLabel: true },
    xAxis: horizontal
      ? { type: "value", axisLabel: { color: theme.muted, formatter: function (value) { return asPercent ? formatRatioPercent(value) : compactNumber(value); } }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } }
      : { type: "category", data: labels, axisLabel: { color: theme.muted, fontWeight: 700, rotate: labels.length > 6 ? 28 : 0 }, axisLine: { lineStyle: { color: theme.grid } } },
    yAxis: horizontal
      ? { type: "category", data: labels.slice().reverse(), axisLabel: { color: theme.muted, fontWeight: 700, width: 120, overflow: "truncate" }, axisLine: { lineStyle: { color: theme.grid } } }
      : { type: "value", axisLabel: { color: theme.muted, formatter: function (value) { return asPercent ? formatRatioPercent(value) : compactNumber(value); } }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } },
    series: [{ type: "bar", barMaxWidth: 28, label: barLabel, itemStyle: { borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0] }, data: horizontal ? values.slice().reverse() : values }]
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
function debounce(fn, delay) {
  let timeout;
  return function () {
    const args = arguments;
    window.clearTimeout(timeout);
    timeout = window.setTimeout(function () {
      fn.apply(null, args);
    }, delay || 150);
  };
}
function resizeCharts() {
  if (document.hidden) {
    return;
  }
  Object.keys(chartInstances).forEach(function (key) {
    try {
      chartInstances[key].resize();
    } catch (error) {
      console.warn("No se pudo redimensionar gráfica", key, error);
    }
  });
}
function renderAllChartEmptyStates(message) {
  ["chartRegion", "chartCanal", "chartCategoria", "chartClientes", "chartPresentaciones", "chartCedi", "chartMes", "chartSinVentasCategoria"].forEach(function (id) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = "<div class=\\"no-data\\">" + escapeHtml(message) + "</div>";
  });
}
function normalizeChartItems(items) {
  return (items || [])
    .map(function (item) {
      return {
        label: normalizeText(item.label),
        value: numberForCalc(item.value)
      };
    })
    .filter(function (item) {
      return item.label && Number.isFinite(item.value);
    });
}
function hasRenderableChartData(items) {
  return items.length > 0 && items.some(function (item) {
    return Math.abs(item.value) > 0;
  });
}
function renderNativeChart(element, type, items, asPercent, horizontal, filterField, options) {
  options = options || {};
  if (type === "donut") {
    renderNativeDonutChart(element, items, asPercent, filterField, options);
    bindNativeChartInteractions(element, options);
    return;
  }
  renderNativeBarChart(element, items, asPercent, horizontal, filterField, options);
  bindNativeChartInteractions(element, options);
}
function renderNativeBarChart(element, items, asPercent, horizontal, filterField, options) {
  options = options || {};
  const max = Math.max.apply(null, items.map(function (item) { return Math.abs(item.value); })) || 1;
  const total = items.reduce(function (acc, item) { return acc + Math.max(0, item.value); }, 0);
  element.innerHTML = "<div class=\\"native-chart " + (horizontal ? "native-horizontal" : "native-vertical") + "\\">" + items.map(function (item) {
    const size = Math.max(3, Math.min(100, Math.abs(item.value) / max * 100));
    const valueText = formatChartValue(item.value, asPercent, options);
    const percentText = options.includePercentTooltip && total ? " · " + formatRatioPercent(item.value / total) : "";
    const titleText = item.label + ": " + valueText + percentText + (options.tooltipNote ? ". " + options.tooltipNote : "");
    const interactionAttrs = buildNativeChartInteractionAttrs(filterField, item.label, options);
    if (horizontal) {
      return "<div class=\\"native-row\\" title=\\"" + escapeHtml(titleText) + "\\"" + interactionAttrs + "><span class=\\"native-label\\">" + escapeHtml(item.label) + "</span><span class=\\"native-track\\"><span class=\\"native-fill\\" style=\\"width:" + size.toFixed(2) + "%\\"></span></span><strong>" + escapeHtml(valueText) + "</strong></div>";
    }
    return "<div class=\\"native-column\\" title=\\"" + escapeHtml(titleText) + "\\"" + interactionAttrs + "><span class=\\"native-column-fill\\" style=\\"height:" + size.toFixed(2) + "%\\"></span><small>" + escapeHtml(item.label) + "</small></div>";
  }).join("") + "</div>";
}
function renderNativeDonutChart(element, items, asPercent, filterField, options) {
  options = options || {};
  const total = items.reduce(function (acc, item) { return acc + Math.max(0, item.value); }, 0);
  const topItems = items.slice(0, 6);
  element.innerHTML = "<div class=\\"native-donut\\"><div class=\\"native-donut-center\\"><strong>" + escapeHtml(formatNumber(total)) + "</strong><span>Total</span></div><div class=\\"native-donut-list\\">" + topItems.map(function (item, index) {
    const valueText = formatChartValue(item.value, asPercent, options);
    const percent = total ? Math.max(0, item.value) / total * 100 : 0;
    const interactionAttrs = buildNativeChartInteractionAttrs(filterField, item.label, options);
    return "<div class=\\"native-donut-item\\"" + interactionAttrs + "><span class=\\"native-swatch swatch-" + index + "\\"></span><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(valueText) + "</strong><small>" + percent.toFixed(1) + "%</small></div>";
  }).join("") + "</div></div>";
}
function buildNativeChartInteractionAttrs(filterField, value, options) {
  const label = normalizeText(value);
  if (options && typeof options.onClick === "function") {
    const actionLabel = options.actionLabel || "Ver detalle de";
    return " role=\\"button\\" tabindex=\\"0\\" aria-label=\\"" + escapeHtml(actionLabel + " " + label) + "\\" data-chart-drilldown-value=\\"" + escapeHtml(label) + "\\"";
  }
  return filterField ? " role=\\"button\\" tabindex=\\"0\\" aria-label=\\"Filtrar por " + escapeHtml(label) + "\\" data-chart-filter-field=\\"" + escapeHtml(filterField) + "\\" data-chart-filter-value=\\"" + escapeHtml(label) + "\\"" : "";
}
function bindNativeChartInteractions(element, options) {
  element.querySelectorAll("[data-chart-filter-field], [data-chart-drilldown-value]").forEach(function (node) {
    const activate = function () {
      if (node.dataset.chartDrilldownValue && options && typeof options.onClick === "function") {
        options.onClick(node.dataset.chartDrilldownValue, { sourceElement: node });
      } else if (node.dataset.chartFilterField) {
        applyChartFilter(node.dataset.chartFilterField, node.dataset.chartFilterValue);
      }
    };
    node.addEventListener("click", activate);
    node.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}
function getEmptyDetailExplorerState() {
  return {
    isOpen: false,
    type: "",
    category: "",
    config: null,
    allRows: [],
    query: "",
    sortField: "presentation",
    sortDir: "asc",
    visibleCount: DETAIL_EXPLORER_VISIBLE_STEP,
    selectedKey: "",
    selectedRow: null,
    opener: null,
    message: ""
  };
}
function getDetailExplorerState() {
  return state.detailExplorer;
}
function setDetailExplorerQuery(query) {
  if (!state.detailExplorer.isOpen) return;
  state.detailExplorer.query = query || "";
  state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
  state.detailExplorer.selectedKey = "";
  state.detailExplorer.selectedRow = null;
  renderDetailExplorer();
}
function setDetailExplorerSort(field, dir) {
  if (!state.detailExplorer.isOpen) return;
  state.detailExplorer.sortField = field || state.detailExplorer.sortField;
  state.detailExplorer.sortDir = dir === "desc" ? "desc" : "asc";
  renderDetailExplorer();
}
function bindDetailExplorerEvents() {
  const overlay = document.getElementById("detailExplorerOverlay");
  if (!overlay) return;
  const closeButton = document.getElementById("detailExplorerClose");
  if (closeButton) closeButton.addEventListener("click", closeDetailExplorer);
  overlay.addEventListener("mousedown", function (event) {
    if (event.target === overlay) closeDetailExplorer();
  });
  overlay.addEventListener("input", function (event) {
    if (event.target && event.target.id === "detailExplorerSearch") {
      state.detailExplorer.query = event.target.value;
      state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
      state.detailExplorer.selectedKey = "";
      state.detailExplorer.selectedRow = null;
      renderDetailExplorer();
    }
  });
  overlay.addEventListener("change", function (event) {
    if (event.target && event.target.id === "detailExplorerSort") {
      const option = getDetailExplorerSortOption(event.target.value);
      state.detailExplorer.sortField = option.field;
      state.detailExplorer.sortDir = option.dir;
      state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
      renderDetailExplorer();
    }
  });
  overlay.addEventListener("click", handleDetailExplorerClick);
  overlay.addEventListener("keydown", handleDetailExplorerKeydown);
  document.addEventListener("keydown", handleDetailExplorerDocumentKeydown);
}
function handleDetailExplorerClick(event) {
  const target = event.target && event.target.closest ? event.target.closest("[data-detail-action], [data-detail-row-key]") : null;
  if (!target) return;
  const action = target.dataset.detailAction;
  if (action === "clear-search") {
    state.detailExplorer.query = "";
    state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
    renderDetailExplorer();
    return;
  }
  if (action === "show-more") {
    state.detailExplorer.visibleCount += DETAIL_EXPLORER_VISIBLE_STEP;
    renderDetailExplorer();
    return;
  }
  if (action === "back-list") {
    state.detailExplorer.selectedKey = "";
    state.detailExplorer.selectedRow = null;
    renderDetailExplorer();
    return;
  }
  if (action === "sort-dir") {
    state.detailExplorer.sortDir = state.detailExplorer.sortDir === "asc" ? "desc" : "asc";
    renderDetailExplorer();
    return;
  }
  if (action === "export-csv") {
    exportDetailExplorerCsv();
    return;
  }
  const rowKey = target.dataset.detailRowKey;
  if (rowKey) selectDetailExplorerRow(rowKey);
}
function handleDetailExplorerKeydown(event) {
  const target = event.target && event.target.closest ? event.target.closest("[data-detail-row-key]") : null;
  if (target && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    selectDetailExplorerRow(target.dataset.detailRowKey);
  }
}
function handleDetailExplorerDocumentKeydown(event) {
  if (!state.detailExplorer.isOpen) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeDetailExplorer();
    return;
  }
  if (event.key === "Tab") trapDetailExplorerFocus(event);
}
function openNoSalesCategoryDetail(category, noSalesAnalysis, opener, options) {
  const config = buildNoSalesCategoryDetailConfig(category, noSalesAnalysis || state.noSalesAnalysis);
  openDetailExplorer(config, opener || document.activeElement, options);
}
function syncOpenDetailExplorer() {
  if (!state.detailExplorer.isOpen || state.detailExplorer.type !== "noSalesCategory") return;
  const category = state.detailExplorer.category;
  const config = buildNoSalesCategoryDetailConfig(category, state.noSalesAnalysis);
  const message = config.rows.length ? "" : "La selección anterior ya no tiene datos con los filtros actuales.";
  openDetailExplorer(config, state.detailExplorer.opener, { preserveState: true, skipFocus: true, message: message });
}
function openDetailExplorer(config, opener, options) {
  options = options || {};
  const previous = state.detailExplorer;
  const preserve = options.preserveState && previous.isOpen && previous.type === config.type && previous.category === config.category;
  state.detailExplorer = {
    isOpen: true,
    type: config.type,
    category: config.category || "",
    config: config,
    allRows: (config.rows || []).slice(),
    query: preserve ? previous.query : "",
    sortField: preserve ? previous.sortField : config.defaultSortField,
    sortDir: preserve ? previous.sortDir : config.defaultSortDir,
    visibleCount: preserve ? previous.visibleCount : DETAIL_EXPLORER_VISIBLE_STEP,
    selectedKey: preserve ? previous.selectedKey : "",
    selectedRow: preserve ? previous.selectedRow : null,
    opener: opener || previous.opener || null,
    message: options.message || ""
  };
  if (state.detailExplorer.selectedKey) {
    state.detailExplorer.selectedRow = state.detailExplorer.allRows.find(function (row, index) {
      return config.rowKey(row, index) === state.detailExplorer.selectedKey;
    }) || null;
    if (!state.detailExplorer.selectedRow) state.detailExplorer.selectedKey = "";
  }
  renderDetailExplorer();
  const overlay = document.getElementById("detailExplorerOverlay");
  const dialog = document.getElementById("detailExplorerDialog");
  if (overlay) overlay.hidden = false;
  if (!options.skipFocus && dialog && dialog.focus) dialog.focus();
  refreshIcons();
}
function closeDetailExplorer() {
  const opener = state.detailExplorer.opener;
  state.detailExplorer = getEmptyDetailExplorerState();
  const overlay = document.getElementById("detailExplorerOverlay");
  if (overlay) overlay.hidden = true;
  ["detailExplorerSummary", "detailExplorerToolbar", "detailExplorerBody", "detailExplorerSelectionMessage"].forEach(function (id) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = "";
  });
  if (opener && opener.focus) opener.focus();
}
function renderDetailExplorer() {
  const explorer = state.detailExplorer;
  if (!explorer.isOpen || !explorer.config) return;
  const title = document.getElementById("detailExplorerTitle");
  const subtitle = document.getElementById("detailExplorerSubtitle");
  const message = document.getElementById("detailExplorerSelectionMessage");
  if (title) title.textContent = explorer.config.title;
  if (subtitle) subtitle.textContent = explorer.config.subtitle || "Exploración";
  if (message) {
    message.hidden = !explorer.message;
    message.textContent = explorer.message;
  }
  renderDetailExplorerSummary();
  renderDetailExplorerToolbar();
  if (explorer.selectedRow) renderDetailExplorerPresentationDetail();
  else renderDetailExplorerList();
  refreshIcons();
}
function renderDetailExplorerSummary() {
  const container = document.getElementById("detailExplorerSummary");
  if (!container) return;
  const summary = state.detailExplorer.config.summary || [];
  container.innerHTML = summary.map(function (item) {
    return "<article class=\\"detail-metric\\"><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong></article>";
  }).join("");
}
function renderDetailExplorerToolbar() {
  const container = document.getElementById("detailExplorerToolbar");
  if (!container) return;
  if (state.detailExplorer.selectedRow) {
    container.innerHTML = "";
    return;
  }
  const config = state.detailExplorer.config;
  const sortOptions = (config.sortOptions || []).map(function (option) {
    return "<option value=\\"" + escapeHtml(option.field) + "\\"" + (option.field === state.detailExplorer.sortField ? " selected" : "") + ">" + escapeHtml(option.label) + "</option>";
  }).join("");
  const directionIcon = state.detailExplorer.sortDir === "asc" ? "arrow-up-a-z" : "arrow-down-z-a";
  const directionLabel = state.detailExplorer.sortDir === "asc" ? "Ascendente" : "Descendente";
  container.innerHTML =
    "<div class=\\"quick-search\\"><i data-lucide=\\"search\\"></i><input id=\\"detailExplorerSearch\\" type=\\"search\\" value=\\"" + escapeHtml(state.detailExplorer.query) + "\\" placeholder=\\"" + escapeHtml(config.searchPlaceholder || "Buscar") + "\\"></div>" +
    "<label>Ordenar<select id=\\"detailExplorerSort\\">" + sortOptions + "</select></label>" +
    "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"sort-dir\\"><i data-lucide=\\"" + directionIcon + "\\"></i> " + directionLabel + "</button>" +
    "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"clear-search\\"><i data-lucide=\\"x-circle\\"></i> Limpiar</button>" +
    "<button class=\\"button button-primary\\" type=\\"button\\" data-detail-action=\\"export-csv\\"><i data-lucide=\\"download\\"></i> CSV</button>";
}
function renderDetailExplorerList() {
  const body = document.getElementById("detailExplorerBody");
  if (!body) return;
  const rows = getDetailExplorerSortedRows();
  const visibleRows = rows.slice(0, state.detailExplorer.visibleCount);
  const config = state.detailExplorer.config;
  if (!rows.length) {
    body.innerHTML = "<div class=\\"no-data\\">" + escapeHtml(config.emptyMessage || "No hay datos para mostrar.") + "</div>";
    return;
  }
  const header = "<thead><tr>" + config.columns.map(function (column) {
    return "<th data-detail-sort-field=\\"" + escapeHtml(column.id) + "\\">" + escapeHtml(column.label) + "</th>";
  }).join("") + "</tr></thead>";
  const tableRows = visibleRows.map(function (row, index) {
    const rowKey = config.rowKey(row, index);
    return "<tr tabindex=\\"0\\" data-detail-row-key=\\"" + escapeHtml(rowKey) + "\\">" + config.columns.map(function (column) {
      const numeric = column.numeric ? " numeric" : "";
      return "<td class=\\"" + numeric.trim() + "\\">" + escapeHtml(getDetailExplorerCellDisplay(row, column.id)) + "</td>";
    }).join("") + "</tr>";
  }).join("");
  const cards = visibleRows.map(function (row, index) {
    const rowKey = config.rowKey(row, index);
    const title = getDetailExplorerCellDisplay(row, "presentation");
    const code = getDetailExplorerCellDisplay(row, "presentationCode");
    const client = getDetailExplorerCellDisplay(row, "client");
    return "<article class=\\"detail-card\\" tabindex=\\"0\\" role=\\"button\\" data-detail-row-key=\\"" + escapeHtml(rowKey) + "\\"><strong>" + escapeHtml(title) + "</strong><span>" + escapeHtml(code ? "Código: " + code : "") + "</span><span>" + escapeHtml(client ? "Cliente: " + client : "") + "</span></article>";
  }).join("");
  const footer = "<div class=\\"detail-footer\\"><span>Mostrando " + formatInteger(visibleRows.length) + " de " + formatInteger(rows.length) + " presentación(es)</span>" + (visibleRows.length < rows.length ? "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"show-more\\">Ver más</button>" : "") + "</div>";
  body.innerHTML = "<div class=\\"detail-table-wrap\\"><table class=\\"detail-table\\">" + header + "<tbody>" + tableRows + "</tbody></table></div><div class=\\"detail-card-list\\">" + cards + "</div>" + footer;
}
function renderDetailExplorerPresentationDetail() {
  const body = document.getElementById("detailExplorerBody");
  if (!body) return;
  const row = state.detailExplorer.selectedRow;
  const sections = getNoSalesPresentationDetailFields(row);
  body.innerHTML = "<div class=\\"presentation-detail\\"><div class=\\"detail-back-row\\"><button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"back-list\\"><i data-lucide=\\"chevron-left\\"></i> Volver al listado</button><span class=\\"badge badge-muted\\">Detalle de presentación</span></div>" + sections.map(function (section) {
    return "<section class=\\"detail-section\\"><h3>" + escapeHtml(section.title) + "</h3><div class=\\"detail-fields\\">" + section.fields.map(function (field) {
      return "<article class=\\"detail-field\\"><span>" + escapeHtml(field.label) + "</span><strong>" + escapeHtml(field.value) + "</strong></article>";
    }).join("") + "</div></section>";
  }).join("") + "</div>";
}
function selectDetailExplorerRow(rowKey) {
  const config = state.detailExplorer.config;
  const row = state.detailExplorer.allRows.find(function (candidate, index) {
    return config.rowKey(candidate, index) === rowKey;
  });
  if (!row) return;
  state.detailExplorer.selectedKey = rowKey;
  state.detailExplorer.selectedRow = row;
  renderDetailExplorer();
}
function getDetailExplorerSortOption(field) {
  const options = state.detailExplorer.config && state.detailExplorer.config.sortOptions ? state.detailExplorer.config.sortOptions : NO_SALES_EXPLORER_SORT_OPTIONS;
  return options.find(function (option) { return option.field === field; }) || options[0];
}
function getDetailExplorerSortedRows() {
  const config = state.detailExplorer.config;
  const query = normalizeText(state.detailExplorer.query).toLocaleLowerCase("es-CO");
  const rows = state.detailExplorer.allRows.filter(function (row) {
    if (!query) return true;
    return config.searchFields.some(function (field) {
      return normalizeText(getDetailExplorerRawValue(row, field)).toLocaleLowerCase("es-CO").includes(query);
    });
  });
  rows.sort(function (a, b) {
    const aValue = getDetailExplorerSortValue(a, state.detailExplorer.sortField);
    const bValue = getDetailExplorerSortValue(b, state.detailExplorer.sortField);
    if (aValue < bValue) return state.detailExplorer.sortDir === "asc" ? -1 : 1;
    if (aValue > bValue) return state.detailExplorer.sortDir === "asc" ? 1 : -1;
    return 0;
  });
  return rows;
}
function getDetailExplorerCellDisplay(row, field) {
  const value = getDetailExplorerRawValue(row, field);
  if (field === "objectiveMonth" && row.__monthlyTargetConflict) return "Revisar";
  if (field === "objectiveTotal" && row.__totalTargetConflict) return "Revisar";
  if (value === null || value === undefined || value === "") return "";
  if (field === "objectiveMonth" || field === "objectiveTotal") return isFiniteNumber(value) ? formatNumber(value) : "";
  if (field === "discount") return isFiniteNumber(value) ? formatPercent(value) : "";
  return String(value);
}
function getDetailExplorerRawValue(row, field) {
  if (field === "category") {
    const analysis = state.detailExplorer.config && state.detailExplorer.config.analysis ? state.detailExplorer.config.analysis : state.noSalesAnalysis;
    return getResolvedCategory(row, analysis.categoryLookup);
  }
  if (field === "presentation") return normalizeText(row["Presentación AS400 de la venta - Texto"]);
  if (field === "presentationCode") return normalizeText(row["Presentación AS400 de la venta - Clave"]);
  if (field === "client") return normalizeText(row["Cliente SAP - Clave"]);
  if (field === "clientName") return normalizeText(row["Cliente AS400 - Nombre negocio (Texto)"]) || normalizeText(row["Cliente AS400 - Texto"]);
  if (field === "activity") return normalizeText(row["ID Actividad"]);
  if (field === "objectiveMonth") return isFiniteNumber(row["Objetivo mes "]) ? row["Objetivo mes "] : null;
  if (field === "objectiveTotal") return isFiniteNumber(row["Objetivo cajas total"]) ? row["Objetivo cajas total"] : null;
  if (field === "discount") return isFiniteNumber(row["Porcentaje descuento"]) ? row["Porcentaje descuento"] : null;
  if (field === "startDate") return normalizeText(row["Fecha inicio"]);
  if (field === "endDate") return normalizeText(row["Fecha fin"]);
  if (field === "discountType") return normalizeText(row["Tipo descuento"]);
  if (field === "period") return normalizeText(row["Periodo negociacion"]);
  if (field === "cedi") return normalizeText(row["Cedi"]);
  return normalizeText(row[field]);
}
function getDetailExplorerSortValue(row, field) {
  if (field === "objectiveTotal" || field === "objectiveMonth" || field === "discount") {
    const value = getDetailExplorerRawValue(row, field);
    return isFiniteNumber(value) ? value : -Number.MAX_VALUE;
  }
  if (field === "endDate" || field === "startDate") {
    const date = dateOnly(getDetailExplorerRawValue(row, field));
    return date ? date.getTime() : Number.MAX_VALUE;
  }
  return normalizeText(getDetailExplorerRawValue(row, field)).toLocaleLowerCase("es-CO");
}
function buildNoSalesCategoryDetailConfig(category, noSalesAnalysis) {
  const analysis = noSalesAnalysis || getEmptyNoSalesAnalysis();
  const rows = getNoSalesRowsForCategory(category, analysis);
  return {
    type: "noSalesCategory",
    category: category,
    analysis: analysis,
    title: "Presentaciones sin ventas — " + category,
    subtitle: "Seguimiento comercial",
    rows: rows,
    columns: NO_SALES_EXPLORER_COLUMNS,
    exportColumns: [
      { id: "presentation", label: "Presentación" },
      { id: "presentationCode", label: "Código de presentación" },
      { id: "client", label: "Cliente SAP" },
      { id: "clientName", label: "Nombre del cliente" },
      { id: "activity", label: "ID actividad" },
      { id: "category", label: "Categoría" },
      { id: "objectiveMonth", label: "Objetivo mes" },
      { id: "objectiveTotal", label: "Objetivo cajas total" },
      { id: "period", label: "Periodo negociación" },
      { id: "discountType", label: "Tipo descuento" },
      { id: "discount", label: "Porcentaje descuento" },
      { id: "startDate", label: "Fecha inicio" },
      { id: "endDate", label: "Fecha fin" },
      { id: "cedi", label: "CEDI" }
    ],
    sortOptions: NO_SALES_EXPLORER_SORT_OPTIONS,
    defaultSortField: "presentation",
    defaultSortDir: "asc",
    searchFields: ["presentation", "presentationCode", "client", "clientName", "activity"],
    searchPlaceholder: "Buscar presentación, código o cliente",
    emptyMessage: "No hay presentaciones disponibles para esta categoría con los filtros actuales.",
    summary: buildNoSalesCategorySummary(category, rows, analysis),
    rowKey: getNoSalesExplorerRowKey
  };
}
function getNoSalesRowsForCategory(category, noSalesAnalysis) {
  const selected = normalizeText(category);
  const lookup = noSalesAnalysis && noSalesAnalysis.categoryLookup ? noSalesAnalysis.categoryLookup : buildCategoryLookup(noSalesAnalysis ? noSalesAnalysis.uniquePresentations : []);
  return (noSalesAnalysis && noSalesAnalysis.uniquePresentations ? noSalesAnalysis.uniquePresentations : []).filter(function (row, index) {
    return normalizeText(getResolvedCategory(row, lookup, index)) === selected;
  });
}
function buildNoSalesCategorySummary(category, rows, noSalesAnalysis) {
  const objectiveMonth = sumField(rows, "Objetivo mes ");
  const participation = noSalesAnalysis && noSalesAnalysis.presentationCount ? rows.length / noSalesAnalysis.presentationCount : null;
  const summary = [
    { label: "Presentaciones", value: formatInteger(rows.length) },
    { label: "Clientes", value: formatInteger(countUniqueFromRows(rows, "Cliente SAP - Clave")) },
    { label: "Actividades", value: formatInteger(countUniqueFromRows(rows, "ID Actividad")) }
  ];
  if (objectiveMonth > 0) summary.push({ label: "Objetivo mes", value: formatNumber(objectiveMonth) });
  if (isFiniteNumber(participation)) summary.push({ label: "Participación", value: formatRatioPercent(participation) });
  return summary;
}
function getNoSalesExplorerRowKey(row, index) {
  return getNegotiatedPresentationKey(row, index);
}
function getNoSalesPresentationDetailFields(row) {
  const analysis = state.detailExplorer.config && state.detailExplorer.config.analysis ? state.detailExplorer.config.analysis : state.noSalesAnalysis;
  const sections = [
    {
      title: "Identificación",
      fields: [
        ["Presentación", getDetailExplorerRawValue(row, "presentation")],
        ["Código", getDetailExplorerRawValue(row, "presentationCode")],
        ["Categoría", getResolvedCategory(row, analysis.categoryLookup)],
        ["Cliente SAP", getDetailExplorerRawValue(row, "client")],
        ["Nombre del cliente", getDetailExplorerRawValue(row, "clientName")],
        ["ID actividad", getDetailExplorerRawValue(row, "activity")]
      ]
    },
    {
      title: "Objetivos",
      fields: [
        ["Objetivo mes", getDetailExplorerCellDisplay(row, "objectiveMonth")],
        ["Objetivo cajas total", getDetailExplorerCellDisplay(row, "objectiveTotal")],
        ["Periodo de negociación", getDetailExplorerRawValue(row, "period")],
        ["Filas fuente", row.__sourceRowCount > 1 ? formatInteger(row.__sourceRowCount) : ""],
        ["Valores objetivo mes", row.__monthlyTargetConflict ? row.__monthlyTargetValues.map(formatNumber).join(" / ") : ""]
      ]
    },
    {
      title: "Negociación",
      fields: [
        ["Tipo descuento", getDetailExplorerRawValue(row, "discountType")],
        ["Porcentaje descuento", getDetailExplorerCellDisplay(row, "discount")],
        ["Fecha inicio", getDetailExplorerRawValue(row, "startDate")],
        ["Fecha fin", getDetailExplorerRawValue(row, "endDate")],
        ["CEDI", getDetailExplorerRawValue(row, "cedi")]
      ]
    }
  ];
  const status = getReliableVigenciaStatus(row);
  const daysRemaining = getDaysRemainingText(row);
  if (status) sections[2].fields.push(["Estado de vigencia", status]);
  if (daysRemaining) sections[2].fields.push(["Días restantes", daysRemaining]);
  return sections.map(function (section) {
    return {
      title: section.title,
      fields: section.fields.map(function (field) {
        return { label: field[0], value: field[1] };
      }).filter(function (field) {
        return hasUsefulDisplayValue(field.value);
      })
    };
  }).filter(function (field) {
    return field.fields.length;
  });
}
function getReliableVigenciaStatus(row) {
  return dateOnly(row["Fecha inicio"]) && dateOnly(row["Fecha fin"]) ? getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) : "";
}
function getDaysRemainingText(row) {
  const end = dateOnly(row["Fecha fin"]);
  if (!end || getReliableVigenciaStatus(row) !== "Vigente") return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  return days >= 0 ? formatInteger(days) + " día(s)" : "";
}
function hasUsefulDisplayValue(value) {
  const text = normalizeText(value);
  return Boolean(text) && ["N/A", "NaN"].indexOf(text) === -1;
}
function exportDetailExplorerCsv() {
  const config = state.detailExplorer.config;
  if (!config) return;
  const rows = getDetailExplorerSortedRows();
  const columns = config.exportColumns || config.columns;
  const header = columns.map(function (column) { return column.label; });
  const body = rows.map(function (row) {
    return columns.map(function (column) {
      return "\\"" + String(getDetailExplorerCellDisplay(row, column.id)).replace(/"/g, "\\"\\"") + "\\"";
    }).join(",");
  });
  downloadCsv(header.join(",") + "\\n" + body.join("\\n"), "presentaciones_sin_ventas_" + normalizeFilenamePart(state.detailExplorer.category) + ".csv");
}
function normalizeFilenamePart(value) {
  return normalizeText(value).toLocaleLowerCase("es-CO").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "detalle";
}
function trapDetailExplorerFocus(event) {
  const dialog = document.getElementById("detailExplorerDialog");
  if (!dialog || !dialog.querySelectorAll) return;
  const focusable = Array.from(dialog.querySelectorAll(DETAIL_EXPLORER_FOCUSABLE)).filter(function (node) {
    return !node.disabled && node.offsetParent !== null;
  });
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
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
    return SEARCH_FIELDS.some(function (column) {
      return normalizeText(formatCell(row, column)).toLocaleLowerCase("es-CO").includes(state.search);
    });
  });
}
function applyFilters(rows, filters) {
  return rows.filter(function (row) {
    return Object.keys(filters).every(function (field) {
      const selected = filters[field];
      if (field === "Estado de vigencia") return matchesFilter(getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]), selected);
      return matchesFilter(row[field], selected);
    });
  });
}
function matchesFilter(rowValue, selected) {
  const selectedValues = (Array.isArray(selected) ? selected : [selected]).map(normalizeText).filter(Boolean);
  if (!selectedValues.length) return true;
  const normalizedValue = normalizeText(rowValue);
  if (!normalizedValue) return false;
  return selectedValues.indexOf(normalizedValue) !== -1;
}
function groupBySum(rows, groupField, valueField, limit) {
  const grouped = new Map();
  rows.forEach(function (row) {
    const key = normalizeText(row[groupField]);
    if (!key) return;
    grouped.set(key, (grouped.get(key) || 0) + numberForCalc(row[valueField], valueField));
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
function groupUniqueTotalSalesByField(rows, groupField, limit) {
  return groupByUniqueField(rows, groupField, getClientMonthKey, "TotalVentaMes", limit);
}
function groupUniqueObjectiveByField(rows, groupField, limit) {
  return groupByUniqueField(rows, groupField, getActivityKey, "Objetivo mes ", limit);
}
function getSapRegionDepartments(region) {
  const key = normalizeMapName(region);
  const regionName = Object.keys(SAP_REGION_DEPARTMENT_MAP).find(function (candidate) {
    return normalizeMapName(candidate) === key;
  });
  return regionName ? SAP_REGION_DEPARTMENT_MAP[regionName].slice() : [];
}
function buildDepartmentSapRegionLookup() {
  const lookup = {};
  Object.keys(SAP_REGION_DEPARTMENT_MAP).forEach(function (region) {
    SAP_REGION_DEPARTMENT_MAP[region].forEach(function (department) {
      const key = normalizeDepartmentName(department);
      if (!lookup[key]) lookup[key] = region;
    });
  });
  return lookup;
}
function getSapRegionForDepartmentName(department) {
  return buildDepartmentSapRegionLookup()[normalizeDepartmentName(department)] || "";
}
function normalizeDepartmentName(value) {
  const normalized = normalizeMapName(value);
  return normalizeMapName(DEPARTMENT_NAME_ALIASES[normalized] || value);
}
function normalizeMapName(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/&/g, " y ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLocaleLowerCase("es-CO");
}
function getSapRegionColor(region) {
  return SAP_REGION_COLORS[region] || "#64748b";
}
function getColombiaGeoJsonUrl() {
  return COLOMBIA_GEOJSON_URL;
}
function getNeutralMapColor() {
  return getCurrentTheme() === "dark" ? "#1f2937" : "#e5e7eb";
}
function groupByUniqueField(rows, groupField, uniqueKeyGetter, valueField, limit) {
  const grouped = new Map();
  const seen = new Set();
  rows.forEach(function (row, index) {
    const groupKey = normalizeText(row[groupField]);
    if (!groupKey) return;
    const uniqueKey = groupKey + "||" + uniqueKeyGetter(row, index);
    if (seen.has(uniqueKey)) return;
    seen.add(uniqueKey);
    grouped.set(groupKey, (grouped.get(groupKey) || 0) + numberForCalc(row[valueField], valueField));
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
function isWithoutSalesInformation(row) {
  return row && row.estadoInformacionVenta === SALES_INFORMATION_STATUS.WITHOUT_SALES_INFO;
}
function hasNegotiatedPresentationReference(row) {
  return Boolean(
    normalizeText(row["Presentación AS400 de la venta - Clave"]) ||
      normalizeText(row["Presentación AS400 de la venta - Texto"])
  );
}
function getNegotiatedPresentationKey(row, index) {
  const parts = [
    normalizeText(row["Cliente SAP - Clave"]),
    normalizeText(row["ID Actividad"]),
    normalizeText(row["Presentación AS400 de la venta - Clave"])
  ].filter(Boolean);
  if (parts.length) return parts.join("||");
  const fallback = [
    normalizeText(row["Nit cliente - Clave"]),
    normalizeText(row["Cliente AS400 - Texto"]),
    normalizeText(row["Presentación AS400 de la venta - Texto"]),
    normalizeText(row["Categoría AS400 de la venta"])
  ].filter(Boolean);
  return fallback.length ? fallback.join("||") : "fila-" + index;
}
function uniqueRowsByKey(rows, keyGetter) {
  const seen = new Set();
  return rows.filter(function (row, index) {
    const key = keyGetter(row, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function groupRowsByKey(rows, keyGetter) {
  const grouped = new Map();
  rows.forEach(function (row, index) {
    const key = keyGetter(row, index);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });
  return grouped;
}
function uniqueResolvedNoSalesPresentations(rows) {
  const grouped = groupRowsByKey(rows, getNegotiatedPresentationKey);
  return Array.from(grouped, function (entry) {
    return buildResolvedNoSalesPresentation(entry[1]);
  });
}
function buildResolvedNoSalesPresentation(rows) {
  const base = Object.assign({}, rows[0]);
  const monthlyResolution = resolveUniqueNumericField(rows, "Objetivo mes ");
  const totalResolution = resolveUniqueNumericField(rows, "Objetivo cajas total");
  base["Objetivo mes "] = monthlyResolution.value;
  base["Objetivo cajas total"] = totalResolution.value;
  base.__sourceRowCount = rows.length;
  base.__monthlyTargetConflict = monthlyResolution.conflict;
  base.__monthlyTargetValues = monthlyResolution.values;
  base.__totalTargetConflict = totalResolution.conflict;
  base.__totalTargetValues = totalResolution.values;
  return base;
}
function resolveUniqueNumericField(rows, field) {
  const values = [];
  rows.forEach(function (row) {
    const rawValue = row[field];
    const value = isFiniteNumber(rawValue) ? rawValue : parseNumberLike(rawValue, field);
    if (!isFiniteNumber(value)) return;
    if (values.indexOf(value) === -1) values.push(value);
  });
  if (!values.length) return { value: null, values: [], conflict: false };
  if (values.length === 1) return { value: values[0], values: values, conflict: false };
  return { value: null, values: values, conflict: true };
}
function getEmptyNoSalesAnalysis() {
  return {
    rows: [],
    uniquePresentations: [],
    byCategory: [],
    categoryLookup: new Map(),
    presentationCount: 0,
    activityCount: 0,
    clientCount: 0,
    presentationsWithoutCategory: 0
  };
}
function getNoSalesAnalysis(filteredRows) {
  const sourceRows = filteredRows || [];
  const rows = sourceRows.filter(isWithoutSalesInformation);
  const uniquePresentations = uniqueResolvedNoSalesPresentations(rows.filter(hasNegotiatedPresentationReference));
  const categoryLookup = buildCategoryLookup(sourceRows);
  const byCategory = groupNoSalesPresentationsByCategory(uniquePresentations, categoryLookup);
  const groupedPresentationCount = byCategory.reduce(function (acc, item) {
    return acc + numberForCalc(item.value);
  }, 0);
  return {
    rows: rows,
    uniquePresentations: uniquePresentations,
    byCategory: byCategory,
    categoryLookup: categoryLookup,
    presentationCount: uniquePresentations.length,
    activityCount: countUniqueFromRows(uniquePresentations, "ID Actividad"),
    clientCount: countUniqueFromRows(uniquePresentations, "Cliente SAP - Clave"),
    presentationsWithoutCategory: Math.max(0, uniquePresentations.length - groupedPresentationCount)
  };
}
function getUniquePresentationsWithoutSales(rows) {
  return getNoSalesAnalysis(rows).uniquePresentations;
}
function countUniqueBy(rows, keyGetter) {
  return uniqueRowsByKey(rows, keyGetter).length;
}
function countUniqueFromRows(rows, field) {
  return new Set(rows.map(function (row) { return normalizeText(row[field]); }).filter(Boolean)).size;
}
function groupNoSalesPresentationsByCategory(uniquePresentations, categoryLookup) {
  const grouped = new Map();
  const lookup = categoryLookup || buildCategoryLookup(uniquePresentations);
  uniquePresentations.forEach(function (row, index) {
    const category = getResolvedCategory(row, lookup, index);
    if (!category) return;
    grouped.set(category, (grouped.get(category) || 0) + 1);
  });
  return Array.from(grouped, function (entry) {
    return { label: entry[0], value: entry[1] };
  }).sort(function (a, b) {
    return b.value - a.value;
  });
}
function groupPresentationsWithoutSalesByCategory(rows) {
  return getNoSalesAnalysis(rows).byCategory;
}
function buildCategoryLookup(rows) {
  const lookup = new Map();
  (rows || []).forEach(function (row, index) {
    const category = getDirectCategory(row);
    if (!category) return;
    getCategoryLookupKeys(row, index).forEach(function (key) {
      if (!lookup.has(key)) lookup.set(key, category);
    });
  });
  return lookup;
}
function getResolvedCategory(row, categoryLookup, index) {
  const directCategory = getDirectCategory(row);
  if (directCategory) return directCategory;
  const lookup = categoryLookup || new Map();
  const keys = getCategoryLookupKeys(row, index);
  for (let i = 0; i < keys.length; i += 1) {
    const category = normalizeText(lookup.get(keys[i]));
    if (category) return category;
  }
  return "";
}
function getDirectCategory(row) {
  for (let i = 0; i < CATEGORY_FIELDS.length; i += 1) {
    const value = normalizeText(row[CATEGORY_FIELDS[i]]);
    if (value) return value;
  }
  return "";
}
function getCategoryLookupKeys(row, index) {
  const keys = [];
  const client = normalizeText(row["Cliente SAP - Clave"]);
  const activity = normalizeText(row["ID Actividad"]);
  const presentationKey = normalizeText(row["Presentación AS400 de la venta - Clave"]);
  const presentationText = normalizeText(row["Presentación AS400 de la venta - Texto"]);
  const negotiationKey = getNegotiatedPresentationKey(row, index);
  if (negotiationKey) keys.push("negotiation:" + negotiationKey);
  if (client && presentationKey) keys.push("client-presentation-key:" + client + "||" + presentationKey);
  if (client && presentationText) keys.push("client-presentation-text:" + client + "||" + presentationText);
  if (activity && presentationKey) keys.push("activity-presentation-key:" + activity + "||" + presentationKey);
  if (activity && presentationText) keys.push("activity-presentation-text:" + activity + "||" + presentationText);
  if (presentationKey) keys.push("presentation-key:" + presentationKey);
  if (presentationText) keys.push("presentation-text:" + presentationText);
  return keys;
}
function getUniqueOptions(rows, field) {
  return Array.from(new Set(rows.map(function (row) { return field === "Estado de vigencia" ? getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) : normalizeText(row[field]); }).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, "es"); });
}
function groupComplianceByCedi(rows) {
  const grouped = new Map();
  const latestMonthRows = getLatestYearMonthRows(rows);
  const seenSales = new Set();
  const seenObjectives = new Set();
  latestMonthRows.forEach(function (row, index) {
    const key = normalizeText(row["Cedi"]);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, { sales: 0, objective: 0 });
    const current = grouped.get(key);
    const salesKey = key + "||" + getClientMonthKey(row, index);
    if (!seenSales.has(salesKey)) {
      seenSales.add(salesKey);
      current.sales += numberForCalc(row["TotalVentaMes"], "TotalVentaMes");
    }
  });
  rows.forEach(function (row, index) {
    const key = normalizeText(row["Cedi"]);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, { sales: 0, objective: 0 });
    const current = grouped.get(key);
    const objectiveKey = key + "||" + getActivityKey(row, index);
    if (!seenObjectives.has(objectiveKey)) {
      seenObjectives.add(objectiveKey);
      current.objective += numberForCalc(row["Objetivo mes "], "Objetivo mes ");
    }
  });
  return Array.from(grouped, function (entry) {
    return { label: entry[0], value: entry[1].objective > 0 ? entry[1].sales / entry[1].objective : 0 };
  }).sort(function (a, b) { return b.value - a.value; });
}
function salesByMonth(rows) {
  const field = getMonthChartField(rows);
  return groupUniqueTotalSalesByField(rows, field).sort(function (a, b) {
    const an = Number(a.label), bn = Number(b.label);
    return Number.isFinite(an) && Number.isFinite(bn) ? an - bn : String(a.label).localeCompare(String(b.label), "es");
  });
}
function getMonthChartField(rows) {
  return rows.some(function (row) { return normalizeText(row["Año Mes"]); }) ? "Año Mes" : "Mes";
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
function sumField(rows, field) { return rows.reduce(function (acc, row) { return acc + numberForCalc(row[field], field); }, 0); }
function sumUniqueTotalSalesMonth(rows) { return sumUniqueField(rows, getClientMonthKey, "TotalVentaMes"); }
function sumUniqueActivityObjective(rows) { return sumUniqueField(rows, getActivityKey, "Objetivo mes "); }
function getLatestYearMonthRows(rows) {
  const latestValue = rows.reduce(function (latest, row) {
    const value = getYearMonthSortValue(row);
    return value === null || (latest !== null && value <= latest) ? latest : value;
  }, null);
  if (latestValue === null) return rows;
  return rows.filter(function (row) { return getYearMonthSortValue(row) === latestValue; });
}
function getYearMonthSortValue(row) {
  const value = normalizeText(row["Año Mes"]);
  if (!value) return null;
  const monthYear = value.match(/^(\\d{1,2})\\.(\\d{4})$/);
  if (monthYear) return Number(monthYear[2]) * 100 + Number(monthYear[1]);
  const yearMonth = value.match(/^(\\d{4})(\\d{2})$/);
  if (yearMonth) return Number(yearMonth[1]) * 100 + Number(yearMonth[2]);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
function sumUniqueField(rows, keyGetter, valueField) {
  const seen = new Set();
  return rows.reduce(function (acc, row, index) {
    const key = keyGetter(row, index);
    if (seen.has(key)) return acc;
    seen.add(key);
    return acc + numberForCalc(row[valueField], valueField);
  }, 0);
}
function getClientMonthKey(row, index) {
  const client = normalizeText(row["Cliente SAP - Clave"]) || "fila-" + index;
  const yearMonth = normalizeText(row["Año Mes"]) || normalizeText(row["Mes"]) || "fila-" + index;
  return client + "||" + yearMonth;
}
function getActivityKey(row, index) {
  return normalizeText(row["ID Actividad"]) || "fila-" + index;
}
function countUnique(rows, field) { return new Set(rows.map(function (row) { return normalizeText(row[field]); }).filter(Boolean)).size; }
function numberForCalc(value, field) {
  if (isFiniteNumber(value)) return value;
  if (value === null || value === undefined || value === "") return 0;
  const parsed = parseNumberLike(value, field);
  return isFiniteNumber(parsed) ? parsed : 0;
}
function isFiniteNumber(value) { return typeof value === "number" && Number.isFinite(value); }
function parseNumberLike(value, field) {
  let text = normalizeText(value);
  if (!text) return null;
  text = text.replace(/\\s/g, "").replace(/[^0-9,.-]/g, "");
  text = field === "TotalVentaMes" ? normalizeFlexibleDecimalNumberText(text) : normalizeNumberText(text);
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}
function isDotThousandsNumber(text) {
  return /^-?\\d{1,3}(\\.\\d{3})+$/.test(text);
}
function normalizeNumberText(text) {
  if (text.includes(",")) {
    return text.split(".").join("").replace(",", ".");
  }
  if (isDotThousandsNumber(text)) {
    return text.split(".").join("");
  }
  return text;
}
function normalizeFlexibleDecimalNumberText(text) {
  if (text.includes(",")) {
    return text.split(".").join("").replace(",", ".");
  }
  if ((text.match(/\\./g) || []).length > 1 && isDotThousandsNumber(text)) {
    return text.split(".").join("");
  }
  return text;
}
function dateOnly(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(value))) return null;
  const parts = String(value).split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(date.getTime()) ? null : date;
}
function normalizeText(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\\u00a0/g, " ").replace(/\\s+/g, " ").trim();
  return isBlankText(text) ? "" : text;
}
function isBlankText(value) {
  return ["", "-", "–", "—"].indexOf(String(value || "").replace(/\\u00a0/g, " ").replace(/\\s+/g, " ").trim()) !== -1;
}
function roundNumber(value) { return Math.round(numberForCalc(value) * 100) / 100; }
function roundChartValue(value, options) {
  return options && options.integerValues ? Math.round(numberForCalc(value)) : roundNumber(value);
}
function formatChartValue(value, asPercent, options) {
  if (asPercent) return formatRatioPercent(value);
  if (options && options.integerValues) return formatInteger(value);
  return formatNumber(value);
}
function compactNumber(value) { return new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(numberForCalc(value)); }
function formatInteger(value) { return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(numberForCalc(value)); }
function formatNumber(value) { return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(numberForCalc(value)); }
function formatSignedNumber(value) {
  const number = numberForCalc(value);
  const formatted = formatNumber(Math.abs(number));
  if (number > 0) return "+" + formatted;
  if (number < 0) return "-" + formatted;
  return formatted;
}
function formatPercent(value) {
  if (!isFiniteNumber(value)) return "N/A";
  const displayValue = Math.abs(value) > 1 ? value / 100 : value;
  return new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 2 }).format(displayValue);
}
function formatRatioPercent(value) {
  if (!isFiniteNumber(value)) return "N/A";
  return new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 2 }).format(value);
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
