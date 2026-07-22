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
          <a href="#kpis" title="Indicadores"><i data-lucide="gauge"></i><span class="sidebar-label">Indicadores</span></a>
          <a href="#charts" title="Análisis"><i data-lucide="bar-chart-3"></i><span class="sidebar-label">Análisis</span></a>
          <a href="#filters" title="Exploración"><i data-lucide="sliders-horizontal"></i><span class="sidebar-label">Exploración</span></a>
        </nav>
        <div class="sidebar-note">
          <i data-lucide="wifi"></i>
          <span>Las gráficas usan librerías visuales por CDN. Los datos ya están incrustados en este HTML.</span>
        </div>
      </aside>

      <main class="main">
        <div class="dashboard-content">
        <header class="executive-header">
          <div>
            <p class="eyebrow">Resumen Ejecutivo</p>
            <h1 id="dashboardTitle">Negociaciones</h1>
            <div id="headerContext" class="header-context" aria-label="Contexto actual"></div>
          </div>
          <div class="header-actions">
            <span id="healthBadge" class="badge badge-success"><i data-lucide="check-circle-2"></i> Datos cargados</span>
            <button id="themeToggle" class="button button-ghost theme-toggle" type="button" aria-label="Cambiar a modo oscuro"><i data-lucide="moon"></i> Oscuro</button>
          </div>
        </header>

        <section id="contextStrip" class="context-strip" aria-label="Contexto de la selección"></section>

        <section id="kpis" class="kpi-grid section-enter" aria-label="Indicadores principales" aria-live="polite"></section>

        <section id="filters" class="filter-panel section-enter">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Exploración</p>
              <h2>Filtros interactivos</h2>
            </div>
            <div class="active-filters-block"><span class="active-filters-label">Filtros activos</span><div id="activeFilters" class="active-filters" aria-live="polite"></div></div>
          </div>
          <div id="filtersGrid" class="filters-grid"></div>
        </section>

        <section id="clientTracking" class="client-tracking-panel section-enter" aria-labelledby="clientTrackingTitle">
          <div class="panel-heading client-tracking-heading">
            <div>
              <p class="eyebrow">Seguimiento comercial</p>
              <h2 id="clientTrackingTitle">Seguimiento de clientes y negociaciones</h2>
              <p>Resultado mensual y avance total por cliente y negociación.</p>
            </div>
            <div class="client-tracking-meta" aria-live="polite">
              <span id="clientTrackingPeriod" class="badge badge-muted">Período no disponible</span>
              <strong id="clientTrackingCount">0 relaciones</strong>
            </div>
          </div>
          <div id="clientTrackingControls" class="client-tracking-controls"></div>
          <div id="clientTrackingBody" aria-live="polite"></div>
          <div id="clientTrackingPagination" class="client-tracking-pagination"></div>
        </section>

        <section id="charts" class="charts-grid section-enter" aria-label="Análisis adaptativo"></section>

        <section id="chartEmptySummary" class="analysis-note" hidden></section>
        </div>
      </main>
    </div>
    <div id="detailExplorerOverlay" class="detail-explorer-overlay" hidden>
      <section id="detailExplorerDialog" class="detail-explorer-dialog" role="dialog" aria-modal="true" aria-labelledby="detailExplorerTitle" aria-describedby="detailExplorerSubtitle" tabindex="-1">
        <header class="detail-explorer-header">
          <div>
            <p id="detailExplorerSubtitle" class="eyebrow">Exploración</p>
            <h2 id="detailExplorerTitle">Detalle</h2>
          </div>
          <div class="detail-explorer-header-actions">
            <button id="detailExplorerBack" class="button button-ghost detail-modal-back" type="button" data-detail-action="navigate-back" hidden><span aria-hidden="true">←</span> Volver</button>
            <button id="detailExplorerClose" class="icon-button" type="button" aria-label="Cerrar detalle"><i data-lucide="x"></i></button>
          </div>
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
  --content-max-width: 1640px;
  --space-section: 20px;
  --space-grid: 16px;
  --space-card: 18px;
  --space-inline: clamp(16px, 2.6vw, 34px);
  --card-radius: 18px;
  --chart-height-compact: 280px;
  --chart-height-standard: 330px;
  --chart-height-featured: 380px;
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
.main { min-width: 0; padding: 26px var(--space-inline) 44px; }
.dashboard-content { width: min(100%, var(--content-max-width)); min-width: 0; margin-inline: auto; }
.dashboard-content > *, .executive-header > *, .panel-heading > *, .header-actions > * { min-width: 0; }
.executive-header {
  display: flex; justify-content: space-between; gap: var(--space-section); align-items: flex-start; margin-bottom: var(--space-section);
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
.filter-panel, .client-tracking-panel, .kpi-card, .chart-card, .table-card {
  border: 1px solid var(--line); border-radius: var(--card-radius); background: var(--panel); box-shadow: var(--shadow);
}
label, .kpi-label {
  display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
}
.filter-panel, .client-tracking-panel, .table-card { padding: var(--space-card); margin-bottom: var(--space-section); }
.panel-heading { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 14px; }
.client-tracking-heading p:not(.eyebrow) { max-width: 760px; margin: 7px 0 0; color: var(--muted); line-height: 1.5; }
.client-tracking-meta { display: grid; justify-items: end; gap: 8px; color: var(--muted); font-size: 0.82rem; white-space: nowrap; }
.client-tracking-controls { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 12px; align-items: end; margin-bottom: 14px; }
.client-tracking-controls > label { grid-column: span 2; }
.client-tracking-controls .tracking-sort { grid-column: span 3; }
.client-tracking-controls .tracking-page-size { grid-column: span 1; }
.client-tracking-actions { grid-column: span 4; display: flex; gap: 8px; justify-content: flex-end; }
.client-tracking-actions .button { white-space: nowrap; }
.client-tracking-table-wrap { max-width: 100%; overflow: auto; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); }
.client-tracking-table { width: 100%; min-width: 1320px; border-collapse: separate; border-spacing: 0; table-layout: auto; }
.client-tracking-table th, .client-tracking-table td { padding: 11px 10px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.client-tracking-table th { position: sticky; top: 0; z-index: 2; min-width: max-content; background: var(--soft-bg); color: var(--muted); font-size: 0.7rem; letter-spacing: 0.04em; line-height: 1.3; overflow-wrap: normal; text-align: left; text-transform: uppercase; white-space: nowrap; word-break: normal; }
.client-tracking-table tbody tr:hover { background: var(--primary-soft); }
.client-tracking-table td { font-size: 0.82rem; }
.client-tracking-table .numeric, .client-tracking-table .tracking-code, .client-tracking-table .tracking-action { text-align: right; white-space: nowrap; word-break: normal; font-variant-numeric: tabular-nums; }
.client-tracking-table .tracking-code { text-align: left; }
.client-tracking-table .tracking-action .button { white-space: nowrap; }
.tracking-client { display: grid; gap: 2px; min-width: 250px; max-width: 360px; }
.tracking-client small { color: var(--muted); }
.tracking-composition { display: grid; gap: 3px; min-width: 185px; font-size: .76rem; white-space: nowrap; }
.tracking-composition > span { color: var(--muted); }
.tracking-composition > span strong { color: var(--ink); }
.tracking-composition-warning { color: var(--amber); font-weight: 900; white-space: normal; }
.tracking-status { display: inline-flex; align-items: center; min-height: 28px; padding: 0 9px; border: 1px solid var(--line); border-radius: 999px; font-size: 0.72rem; font-weight: 900; white-space: nowrap; }
.tracking-status.is-positive { border-color: rgba(16,185,129,.34); background: var(--emerald-soft); color: var(--emerald); }
.tracking-status.is-negative { border-color: rgba(239,68,68,.34); background: var(--red-soft); color: var(--red); }
.tracking-status.is-progress { border-color: rgba(13,148,136,.3); background: var(--primary-soft); color: var(--primary); }
.tracking-status.is-neutral { background: var(--soft-bg); color: var(--muted); }
.tracking-status-cell { display: grid; gap: 5px; justify-items: start; min-width: 170px; }
.tracking-status-reason { max-width: 230px; color: var(--muted); font-size: 0.68rem; font-weight: 700; line-height: 1.35; }
.client-tracking-pagination { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 14px; color: var(--muted); font-size: 0.82rem; font-weight: 700; }
.client-tracking-pagination-actions { display: flex; gap: 8px; }
.client-tracking-cards { display: grid; gap: 10px; }
.client-tracking-card { display: grid; gap: 12px; padding: 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--soft-bg); }
.client-tracking-card-head, .client-tracking-card-actions { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.client-tracking-card-head > div { min-width: 0; }
.client-tracking-card-head strong, .client-tracking-card-head span { display: block; overflow-wrap: anywhere; }
.client-tracking-card-head span { color: var(--muted); font-size: 0.78rem; }
.client-tracking-card-statuses { display: flex; flex-wrap: wrap; gap: 7px; }
.client-tracking-card-metrics { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 9px; }
.client-tracking-card-metrics span { display: grid; gap: 3px; }
.client-tracking-card-metrics small { color: var(--muted); font-size: .68rem; font-weight: 800; text-transform: uppercase; }
.client-tracking-card-composition { display: grid; gap: 5px; padding: 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--soft-bg); }
.client-tracking-card-composition > small { color: var(--muted); font-size: .68rem; font-weight: 900; text-transform: uppercase; }
.client-tracking-detail-note { margin: 0; padding: 11px 13px; border-left: 4px solid var(--primary); border-radius: 8px; background: var(--primary-soft); color: var(--ink); }
.tracking-detail-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.client-tracking-detail .detail-table-wrap {
  max-height: none;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-gutter: stable;
}
.tracking-period-table {
  width: max-content;
  min-width: 1480px;
  table-layout: fixed;
}
.tracking-period-table th,
.tracking-period-table td {
  min-width: 128px;
  vertical-align: middle;
}
.tracking-period-table th {
  white-space: normal;
  word-break: normal;
  overflow-wrap: normal;
  hyphens: none;
}
.tracking-period-table th:first-child,
.tracking-period-table td:first-child { min-width: 92px; width: 92px; }
.tracking-period-table th:nth-child(2),
.tracking-period-table th:nth-child(3),
.tracking-period-table th:nth-child(4) { min-width: 170px; width: 170px; }
.tracking-period-table th:last-child,
.tracking-period-table td:last-child { min-width: 154px; width: 154px; }
.quick-search {
  display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: center;
  min-height: 46px; margin-bottom: 14px; padding: 0 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--soft-bg); color: var(--muted);
}
.quick-search input { border: 0; outline: 0; background: transparent; color: var(--ink); font-weight: 700; }
.filters-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 12px; overflow: visible; }
.filter-grid-actions { grid-column: span 3; display: flex; align-items: end; }
.filter-grid-actions .button { width: 100%; min-height: 44px; }
.filter-control { position: relative; display: grid; align-content: start; gap: 6px; min-width: 0; }
.filter-control-wide { grid-column: span 6; }
.filter-control-standard { grid-column: span 3; }
.filter-control-tail-1 { grid-column: 4 / span 6; }
.filter-control-tail-2 { grid-column: span 6; }
.filter-control-tail-3 { grid-column: span 4; }
.filter-control-label { color: var(--ink); font-size: 0.78rem; font-weight: 900; }
.multi-combobox-trigger {
  display: flex; justify-content: space-between; gap: 10px; align-items: center; width: 100%; min-height: 44px; padding: 0 12px;
  border: 1px solid var(--line); border-radius: 12px; background: var(--input-bg); color: var(--ink); text-align: left; cursor: pointer;
}
.multi-combobox-trigger:hover, .multi-combobox-trigger[aria-expanded="true"] { border-color: rgba(13, 148, 136, 0.48); box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1); }
.multi-combobox-trigger:focus-visible, .multi-combobox-option:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.28); outline-offset: 2px; }
.multi-combobox-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 800; }
.multi-combobox-count { flex: 0 0 auto; color: var(--muted); font-size: 0.74rem; font-weight: 900; }
.multi-combobox-panel {
  position: fixed; z-index: 1000; width: min(460px, calc(100vw - 24px)); max-height: min(72vh, 560px);
  overflow: hidden; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); box-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
  animation: sectionIn 0.18s ease both;
}
.multi-combobox-panel[hidden] { display: none; }
.multi-combobox-search { position: sticky; top: 0; z-index: 1; padding: 10px; border-bottom: 1px solid var(--line); background: var(--panel); }
.multi-combobox-search .quick-search { margin: 0; }
.multi-combobox-status { display: flex; justify-content: space-between; gap: 10px; padding: 8px 11px; color: var(--muted); font-size: 0.74rem; font-weight: 800; }
.multi-combobox-list { max-height: 280px; overflow-y: auto; padding: 4px; }
.multi-combobox-option {
  display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 9px; align-items: center; width: 100%; padding: 9px;
  border: 0; border-radius: 9px; background: transparent; color: var(--ink); text-align: left; cursor: pointer;
}
.multi-combobox-option:hover, .multi-combobox-option.is-highlighted { background: var(--primary-soft); }
.multi-combobox-option[aria-selected="true"] { background: var(--primary-soft); }
.multi-combobox-option:disabled { opacity: 0.48; cursor: not-allowed; }
.multi-combobox-check { display: inline-grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--line); border-radius: 5px; color: transparent; font-size: 0.74rem; }
.multi-combobox-option[aria-selected="true"] .multi-combobox-check { border-color: var(--primary); background: var(--primary); color: white; }
.multi-combobox-option-copy { display: grid; gap: 2px; min-width: 0; }
.multi-combobox-option-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.multi-combobox-option-copy small { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.multi-combobox-empty { padding: 18px 12px; color: var(--muted); text-align: center; }
.multi-combobox-footer { display: flex; justify-content: space-between; gap: 8px; padding: 9px; border-top: 1px solid var(--line); background: var(--soft-bg); }
.multi-combobox-footer .button { min-height: 34px; padding: 0 9px; font-size: 0.76rem; }
.filters-grid label small { display: block; margin-top: 2px; color: var(--muted); font-weight: 600; }
label { display: grid; gap: 6px; }
select, input[type="search"] {
  width: 100%; min-height: 40px; padding: 0 11px; border: 1px solid var(--line); border-radius: 12px; background: var(--input-bg); color: var(--ink); font-weight: 700;
}
.active-filters { display: flex; flex-wrap: wrap; gap: 7px; justify-content: flex-end; max-width: 55%; }
.active-filters-block { display: grid; justify-items: end; gap: 5px; }
.active-filters-label { color: var(--muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
.active-filters-block .active-filters { max-width: none; }
.filter-chip { display: inline-flex; gap: 6px; align-items: center; min-height: 30px; padding: 0 6px 0 10px; border: 0; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 0.78rem; font-weight: 800; cursor: pointer; }
.filter-chip > span:first-child { overflow-wrap: anywhere; }
.filter-chip:hover { box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.16); }
.filter-chip-remove { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 999px; background: var(--panel); }
.context-strip { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 var(--space-section); }
.context-item { display: inline-flex; align-items: center; gap: 7px; min-height: 34px; max-width: 100%; padding: 0 11px; border: 1px solid var(--line); border-radius: 10px; background: var(--soft-bg); color: var(--muted); font-size: 0.8rem; }
.context-item strong { color: var(--ink); font-weight: 800; }
.kpi-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--space-grid); margin-bottom: var(--space-section); }
.kpi-card { grid-column: span 3; min-width: 0; min-height: 178px; padding: 16px; border-left: 4px solid transparent; animation: sectionIn 0.22s ease both; }
.kpi-grid[data-tail="1"] .kpi-card:last-child { grid-column: 4 / span 6; }
.kpi-grid[data-tail="2"] .kpi-card:nth-last-child(-n + 2) { grid-column: span 6; }
.kpi-grid[data-tail="3"] .kpi-card:nth-last-child(-n + 3) { grid-column: span 4; }
.kpi-card.kpi-attention { border-color: rgba(245, 158, 11, 0.42); background: linear-gradient(135deg, var(--panel), var(--amber-soft)); }
.kpi-card.kpi-attention .kpi-icon { background: var(--amber-soft); color: var(--amber); }
.kpi-card.kpi-positive { border-left-color: var(--emerald); background: linear-gradient(135deg, var(--panel), var(--emerald-soft)); }
.kpi-card.kpi-positive .kpi-icon { background: var(--emerald-soft); color: var(--emerald); }
.kpi-card.kpi-negative { border-left-color: var(--red); background: linear-gradient(135deg, var(--panel), var(--red-soft)); }
.kpi-card.kpi-negative .kpi-icon { background: var(--red-soft); color: var(--red); }
.kpi-card.kpi-neutral { border-left-color: var(--line); }
.kpi-card.kpi-secondary { min-height: 148px; background: var(--soft-bg); box-shadow: none; }
.kpi-card[data-kpi-action] { cursor: pointer; }
.kpi-card[data-kpi-action]:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(15, 23, 42, 0.09); }
.kpi-card[data-kpi-action]:focus-visible { outline: 3px solid var(--primary-2); outline-offset: 3px; }
.kpi-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; margin-bottom: 14px; }
.kpi-icon { position: relative; display: inline-grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; border-radius: 14px; background: var(--primary-soft); color: var(--primary); }
.kpi-icon-fallback { display: inline-grid; place-items: center; width: 100%; height: 100%; font-size: 1.25rem; font-weight: 900; }
.kpi-icon svg ~ .kpi-icon-fallback { display: none; }
.kpi-value { display: block; margin-bottom: 6px; overflow-wrap: anywhere; font-size: clamp(1.28rem, 1.8vw, 1.82rem); font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.04em; line-height: 1.12; }
.kpi-status { display: inline-flex; align-items: center; min-height: 24px; margin-bottom: 8px; padding: 0 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 0.72rem; font-weight: 800; }
.kpi-positive .kpi-status { border-color: rgba(16, 185, 129, 0.32); color: var(--emerald); background: var(--emerald-soft); }
.kpi-negative .kpi-status { border-color: rgba(239, 68, 68, 0.32); color: var(--red); background: var(--red-soft); }
.kpi-description { margin: 0; color: var(--muted); font-size: 0.82rem; line-height: 1.42; }
.charts-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-grid); width: 100%; min-width: 0; margin-bottom: var(--space-section); align-items: stretch; }
.chart-card { min-width: 0; min-height: 0; padding: var(--space-card); animation: sectionIn 0.24s ease both; }
.chart-card p { margin: 6px 0 0; color: var(--muted); font-size: 0.9rem; }
.chart-action-hint { display: inline-flex; gap: 6px; align-items: center; font-weight: 800; color: var(--primary) !important; }
.chart-wide, .chart-featured, .chart-timeline, .chart-row-fill { grid-column: 1 / -1; }
.chart-compact { min-height: 330px; }
.chart-standard { min-height: 380px; }
.chart-featured { min-height: 420px; }
.chart-card.chart-empty { min-height: 220px; }
.chart-card.chart-empty .chart { height: auto; min-height: 210px; }
.chart { width: 100%; min-height: 320px; height: 320px; margin-top: 14px; }
.chart-compact .chart { min-height: var(--chart-height-compact); height: var(--chart-height-compact); }
.chart-standard .chart { min-height: var(--chart-height-standard); height: var(--chart-height-standard); }
.chart-featured .chart { min-height: var(--chart-height-featured); height: var(--chart-height-featured); }
.timeline-card { min-height: 0; }
.timeline-card-empty { min-height: 220px; }
.timeline-heading { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.timeline-action { flex: 0 0 auto; }
.timeline-context { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.timeline-context > span { min-width: 112px; padding: 9px 11px; border: 1px solid var(--line); border-radius: 11px; background: var(--soft-bg); }
.timeline-context small, .timeline-context strong { display: block; }
.timeline-context small { color: var(--muted); font-size: 0.67rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
.timeline-context strong { margin-top: 3px; color: var(--ink); font-size: 0.84rem; }
.timeline-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 12px; color: var(--muted); font-size: 0.76rem; font-weight: 800; }
.timeline-legend span { display: inline-flex; gap: 6px; align-items: center; }
.timeline-dot { width: 10px; height: 10px; border-radius: 3px; background: var(--subtle); }
.timeline-dot.is-history { border: 2px solid #64748b; border-radius: 50%; background: transparent; }
.timeline-dot.is-comparable { border-radius: 50%; background: #0d9488; }
.timeline-dot.is-post { border: 1px solid #94a3b8; border-radius: 2px; background: #cbd5e1; transform: rotate(45deg) scale(0.78); }
.timeline-dot.is-warning { background: #f59e0b; }
.timeline-mode-detail .timeline-chart { height: 390px; min-height: 390px; }
.timeline-mode-gantt .timeline-chart { height: auto; min-height: 0; max-height: 560px; overflow-y: auto; overscroll-behavior: contain; }
.timeline-mode-summary .timeline-chart { height: 300px; min-height: 300px; }
.timeline-mode-empty .timeline-chart { height: 120px; min-height: 120px; }
.timeline-empty { display: grid; place-items: center; align-content: center; gap: 7px; min-height: 120px; padding: 18px; border: 1px dashed var(--line); border-radius: 14px; background: var(--soft-bg); color: var(--muted); text-align: center; }
.timeline-empty svg { width: 28px; color: var(--primary); }
.timeline-empty strong { color: var(--ink); }
.timeline-conflict { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; align-items: start; min-height: 180px; padding: 24px; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 14px; background: var(--amber-soft); color: var(--amber); }
.timeline-conflict svg { width: 28px; }
.timeline-conflict strong { color: var(--ink); }
.timeline-conflict p { margin-top: 7px; color: var(--muted); line-height: 1.5; }
.timeline-client-history { display: flex; flex-wrap: wrap; gap: 9px; align-items: stretch; margin-bottom: 14px; }
.timeline-client-history > strong { display: flex; align-items: center; color: var(--ink); margin-right: 4px; }
.timeline-client-history span { min-width: 92px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--soft-bg); }
.timeline-client-history small, .timeline-client-history b { display: block; }
.timeline-client-history small { color: var(--muted); font-size: 0.68rem; }
.timeline-client-history b { margin-top: 3px; color: var(--ink); }
.timeline-gantt { display: grid; gap: 10px; }
.timeline-gantt-row { display: grid; grid-template-columns: 88px minmax(160px, 1fr); gap: 8px 12px; align-items: center; padding: 10px; border: 1px solid var(--line); border-radius: 11px; background: var(--soft-bg); }
.timeline-gantt-row > button { padding: 0; border: 0; background: transparent; color: var(--primary); font: inherit; font-weight: 900; text-align: left; cursor: pointer; }
.timeline-gantt-row > button:focus-visible, .timeline-action:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.3); outline-offset: 3px; border-radius: 5px; }
.timeline-gantt-row > small { grid-column: 2; color: var(--muted); line-height: 1.35; }
.timeline-gantt-track { position: relative; height: 18px; overflow: hidden; border-radius: 999px; background: var(--line); }
.timeline-gantt-track span { position: absolute; top: 2px; bottom: 2px; min-width: 5px; border-radius: 999px; background: linear-gradient(90deg, #2563eb, var(--primary)); }
.timeline-gantt-row.is-conflict { grid-template-columns: 88px minmax(0, 1fr); border-color: rgba(245, 158, 11, 0.35); color: var(--amber); }
.timeline-limit-note { color: var(--muted); font-size: 0.78rem; font-weight: 800; }
.timeline-summary-state { display: grid; align-content: center; gap: 16px; min-height: 260px; padding: 22px; border: 1px solid var(--line); border-radius: 14px; background: var(--soft-bg); }
.timeline-summary-state > strong { color: var(--ink); font-size: 1.08rem; }
.timeline-summary-state > div { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.timeline-summary-state span { padding: 12px; border: 1px solid var(--line); border-radius: 11px; background: var(--panel); color: var(--muted); }
.timeline-summary-state b { display: block; margin-top: 4px; color: var(--ink); font-size: 1.15rem; }
.native-timeline-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; align-content: center; min-height: 300px; }
.native-timeline-period { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; min-width: 0; padding: 11px; border: 1px solid var(--line); border-radius: 11px; background: var(--soft-bg); }
.native-timeline-period small, .native-timeline-period strong, .native-timeline-period span { display: block; }
.native-timeline-period small { color: var(--muted); font-weight: 900; }
.native-timeline-period strong { margin: 4px 0; color: var(--ink); font-size: 0.9rem; overflow-wrap: anywhere; }
.native-timeline-period div > span { color: var(--muted); font-size: 0.7rem; line-height: 1.3; }
.timeline-period-marker { width: 4px; height: 100%; border-radius: 999px; background: #94a3b8; }
.is-historico-previo .timeline-period-marker { background: #64748b; }
.is-periodo-comparable .timeline-period-marker { background: #0d9488; }
.is-venta-actividad-ambigua .timeline-period-marker, .is-fechas-conflictivas .timeline-period-marker, .is-objetivo-conflictivo .timeline-period-marker { background: #f59e0b; }
.analysis-note { padding: 16px 18px; border: 1px dashed var(--line); border-radius: 14px; color: var(--muted); background: var(--soft-bg); }
.section-enter { animation: sectionIn 0.24s ease both; }
@keyframes sectionIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
.no-data {
  display: grid; place-items: center; min-height: 260px; border: 1px dashed var(--line); border-radius: 14px; background: var(--soft-bg); color: var(--muted); font-weight: 800; text-align: center;
}
.empty-state { display: grid; place-items: center; align-content: center; gap: 8px; min-height: 210px; padding: 22px; border: 1px dashed var(--line); border-radius: 14px; background: var(--soft-bg); color: var(--muted); text-align: center; }
.empty-state svg { width: 28px; height: 28px; color: var(--primary); }
.empty-state-info { border-color: var(--line); }
.empty-state strong { color: var(--ink); font-size: 0.95rem; }
.empty-state span { max-width: 46ch; font-size: 0.82rem; line-height: 1.45; }
.empty-state-warning { border-color: rgba(245, 158, 11, 0.38); background: var(--amber-soft); }
.empty-state-warning svg { color: var(--amber); }
.empty-state-error { border-color: rgba(239, 68, 68, 0.34); background: var(--red-soft); }
.empty-state-error svg { color: var(--red); }
.native-chart { min-height: 305px; }
.native-horizontal { display: grid; gap: 10px; align-content: center; }
.native-row { display: grid; grid-template-columns: minmax(120px, 30%) minmax(0, 1fr) minmax(82px, auto); gap: 10px; align-items: center; }
.native-label { overflow: hidden; color: var(--ink); font-size: 0.84rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.native-track { height: 17px; overflow: hidden; border-radius: 999px; background: var(--chart-grid); }
.native-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--primary), #2563eb); }
.native-row strong { color: var(--ink); font-size: 0.84rem; font-variant-numeric: tabular-nums; text-align: right; }
.native-row[role="button"], .native-column[role="button"], .native-donut-item[role="button"], .native-treemap-item[role="button"], .native-lollipop-row[role="button"] { cursor: pointer; }
.native-row[role="button"]:focus-visible, .native-column[role="button"]:focus-visible, .native-donut-item[role="button"]:focus-visible, .native-treemap-item[role="button"]:focus-visible, .native-lollipop-row[role="button"]:focus-visible {
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
.native-treemap { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-rows: 72px; gap: 6px; min-height: 305px; align-content: center; }
.native-treemap-item { display: grid; align-content: end; min-width: 0; padding: 10px; border: 1px solid var(--line); border-radius: 11px; background: linear-gradient(145deg, rgba(13, 148, 136, 0.2), rgba(37, 99, 235, 0.12)); color: var(--ink); }
.native-treemap-item:nth-child(6n+2) { background: linear-gradient(145deg, rgba(37, 99, 235, 0.19), rgba(79, 70, 229, 0.11)); }
.native-treemap-item:nth-child(6n+3) { background: linear-gradient(145deg, rgba(5, 150, 105, 0.2), rgba(13, 148, 136, 0.1)); }
.native-treemap-item:nth-child(6n+4) { background: linear-gradient(145deg, rgba(79, 70, 229, 0.18), rgba(37, 99, 235, 0.1)); }
.native-treemap-item span { overflow: hidden; font-size: 0.78rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.native-treemap-item strong { margin-top: 3px; font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.native-lollipop { display: grid; gap: 9px; align-content: center; min-height: 305px; }
.native-lollipop-row { display: grid; grid-template-columns: minmax(110px, 31%) minmax(0, 1fr) minmax(76px, auto); gap: 10px; align-items: center; }
.native-lollipop-label { overflow: hidden; color: var(--ink); font-size: 0.8rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.native-lollipop-track { position: relative; height: 3px; border-radius: 999px; background: var(--chart-grid); }
.native-lollipop-stem { position: absolute; inset-block: 0; left: 0; border-radius: inherit; background: var(--primary); }
.native-lollipop-dot { position: absolute; top: 50%; width: 13px; height: 13px; border: 3px solid var(--panel); border-radius: 50%; background: #2563eb; box-shadow: 0 0 0 1px var(--primary); transform: translate(-50%, -50%); }
.native-lollipop-row strong { color: var(--ink); font-size: 0.82rem; font-variant-numeric: tabular-nums; text-align: right; }
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
  position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 22px;
  overflow: hidden; overscroll-behavior: none; background: rgba(15, 23, 42, 0.52);
}
.detail-explorer-overlay[hidden] { display: none; }
.detail-explorer-dialog {
  display: grid; grid-template-rows: auto auto auto auto minmax(0, 1fr); width: min(1060px, 100%); max-height: min(88vh, 860px);
  overflow: hidden; isolation: isolate; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); box-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
  animation: detailDialogIn 0.16s ease-out;
}
.detail-explorer-dialog[data-layout="compact"] { width: min(920px, 100%); }
.detail-explorer-dialog[data-layout="wide"] { width: min(1440px, 100%); }
@keyframes detailDialogIn { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: none; } }
.detail-explorer-header { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding: 18px 20px 14px; border-bottom: 1px solid var(--line); background: var(--panel); }
.detail-explorer-header h2 { margin: 4px 0 0; font-size: clamp(1.15rem, 2vw, 1.45rem); }
.detail-explorer-header .eyebrow { max-width: 720px; color: var(--primary); letter-spacing: 0.08em; }
.detail-explorer-header .icon-button { flex: 0 0 42px; width: 42px; height: 42px; }
.detail-explorer-header-actions { display: flex; flex: 0 0 auto; gap: 8px; align-items: center; }
.detail-modal-back { min-height: 40px; white-space: nowrap; }
.detail-selection-message { margin: 14px 20px 0; padding: 12px 14px; border: 1px solid rgba(245, 158, 11, 0.32); border-radius: 12px; background: var(--amber-soft); color: var(--amber); font-weight: 800; }
.detail-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; padding: 14px 20px 4px; color: var(--muted); }
.detail-metric { min-width: 0; padding: 11px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--soft-bg); }
.detail-metric.is-primary { background: linear-gradient(135deg, var(--panel), var(--primary-soft)); border-color: rgba(13, 148, 136, 0.2); }
.detail-metric span { display: block; color: var(--muted); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
.detail-metric strong { display: block; margin-top: 4px; color: var(--ink); font-size: 1rem; overflow-wrap: anywhere; }
.detail-metric.is-primary strong { font-size: 1.12rem; }
.detail-toolbar { display: grid; grid-template-columns: minmax(280px, 1fr) 170px auto auto auto; gap: 8px; align-items: end; padding: 12px 20px; }
.detail-toolbar .quick-search { margin: 0; min-height: 40px; }
.detail-toolbar label { min-width: 0; }
.detail-body { min-height: 0; padding: 2px 20px 20px; overflow: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
.detail-table-wrap { overflow: auto; max-height: min(52vh, 500px); overscroll-behavior: contain; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); }
.detail-table-wrap.is-short { max-height: none; overflow: visible; }
.detail-table { width: 100%; min-width: 720px; table-layout: auto; }
.detail-table th, .detail-table td { padding: 11px 12px; line-height: 1.35; }
.detail-table th { white-space: normal; }
.detail-table td:first-child { color: var(--ink); font-weight: 800; }
.detail-table td.numeric { white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
.detail-table thead th { position: sticky; top: 0; z-index: 1; background: var(--panel); }
.detail-table tbody tr.is-selected-client { background: var(--primary-soft); box-shadow: inset 3px 0 0 var(--primary); }
.negotiation-usage-table { min-width: 1380px; table-layout: fixed; }
.negotiation-usage-table th, .negotiation-usage-table td { overflow-wrap: normal; word-break: normal; }
.negotiation-usage-table td { white-space: nowrap; }
.negotiation-usage-table th:nth-child(1) { width: 120px; }
.negotiation-usage-table th:nth-child(2) { width: 190px; }
.negotiation-usage-table th:nth-child(3) { width: 120px; }
.negotiation-usage-table th:nth-child(4) { width: 190px; }
.negotiation-usage-table th:nth-child(5) { width: 150px; }
.negotiation-usage-table th:nth-child(6) { width: 190px; }
.negotiation-usage-table th:nth-child(7), .negotiation-usage-table th:nth-child(8) { width: 110px; }
.negotiation-usage-table th:nth-child(9) { width: 180px; }
.negotiation-usage-table td:nth-child(2), .negotiation-usage-table td:nth-child(4) { white-space: normal; }
.negotiation-usage-table td:last-child .button { width: 100%; white-space: nowrap; }
.client-identity { display: grid; gap: 2px; min-width: 140px; }
.client-identity strong { color: var(--ink); }
.client-identity span { color: var(--muted); font-size: 0.76rem; }
.selected-client-label { display: inline-flex; width: fit-content; margin-top: 3px; padding: 2px 6px; border-radius: 999px; background: var(--panel); color: var(--primary); font-size: 0.68rem; font-weight: 900; }
.contribution-share { display: grid; grid-template-columns: minmax(58px, auto) minmax(72px, 1fr); gap: 8px; align-items: center; min-width: 150px; }
.contribution-share progress { width: 100%; height: 7px; border: 0; border-radius: 999px; overflow: hidden; background: var(--line); }
.contribution-share progress::-webkit-progress-bar { background: var(--line); border-radius: 999px; }
.contribution-share progress::-webkit-progress-value { background: var(--primary); border-radius: 999px; }
.contribution-share progress::-moz-progress-bar { background: var(--primary); border-radius: 999px; }
.rank-badge { display: inline-grid; place-items: center; min-width: 34px; min-height: 28px; padding: 0 7px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-weight: 900; }
.row-detail-button { min-height: 34px; padding: 0 9px; white-space: nowrap; }
.detail-row-link { padding: 0; border: 0; background: transparent; color: var(--primary); font: inherit; font-weight: 800; text-align: left; cursor: pointer; }
.detail-row-link:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.28); outline-offset: 3px; border-radius: 4px; }
.detail-footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 12px; color: var(--muted); font-weight: 800; }
.detail-card-list { display: none; gap: 10px; }
.detail-card { display: grid; gap: 8px; contain: layout paint; padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--soft-bg); }
.detail-card.is-selected-client { border-color: rgba(13, 148, 136, 0.45); box-shadow: inset 3px 0 0 var(--primary); }
.detail-card:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.28); outline-offset: 3px; }
.detail-card strong { color: var(--ink); }
.detail-card span { color: var(--muted); font-size: 0.82rem; font-weight: 800; }
.negotiation-list { display: grid; gap: 12px; }
.negotiation-record { overflow: hidden; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); }
.negotiation-record-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--line); background: var(--soft-bg); }
.negotiation-record-identity { display: grid; gap: 5px; min-width: 0; }
.negotiation-record-identity small { color: var(--muted); font-size: 0.68rem; font-weight: 900; text-transform: uppercase; }
.negotiation-record-title { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.negotiation-record-title strong { color: var(--ink); font-size: 1rem; }
.negotiation-record-badge { display: inline-flex; align-items: center; min-height: 24px; padding: 0 8px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 0.7rem; font-weight: 900; }
.negotiation-record-badge.is-neutral { background: var(--subtle); color: var(--muted); }
.negotiation-record-header .button { flex: 0 0 auto; min-height: 36px; white-space: nowrap; }
.negotiation-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1px; background: var(--line); }
.negotiation-field { min-width: 0; padding: 12px 16px; background: var(--panel); }
.negotiation-field small { display: block; margin-bottom: 5px; color: var(--muted); font-size: 0.67rem; font-weight: 900; text-transform: uppercase; }
.negotiation-field strong { display: block; color: var(--ink); font-size: 0.86rem; line-height: 1.4; overflow-wrap: break-word; }
.negotiation-field-wide { grid-column: span 2; }
.contribution-card-head, .contribution-card-metrics { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.contribution-card-name { display: grid; gap: 2px; }
.contribution-card-metrics { padding-top: 8px; border-top: 1px solid var(--line); }
.contribution-card-metrics span { display: grid; gap: 2px; }
.contribution-card-metrics small { color: var(--muted); font-size: 0.68rem; text-transform: uppercase; }
.presentation-detail { display: grid; gap: 14px; }
.detail-back-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
.detail-section { display: grid; gap: 10px; contain: layout paint; padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--soft-bg); }
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
  .sidebar { position: static; height: auto; padding: 16px var(--space-inline); border-right: 0; border-bottom: 1px solid var(--line); }
  .sidebar-brand { margin-bottom: 14px; }
  .dashboard-app.sidebar-collapsed .sidebar { padding: 16px var(--space-inline); }
  .dashboard-app.sidebar-collapsed .sidebar-brand { grid-template-columns: auto minmax(0, 1fr) auto; justify-items: stretch; }
  .dashboard-app.sidebar-collapsed .sidebar-label { max-width: none; opacity: 1; transform: none; pointer-events: auto; }
  .dashboard-app.sidebar-collapsed .sidebar-nav a { justify-content: flex-start; padding: 0 12px; }
  .dashboard-app.sidebar-collapsed .sidebar-note { left: auto; right: auto; padding: 14px; justify-items: start; }
  .dashboard-app.sidebar-collapsed .sidebar-note span { display: inline; }
  .sidebar-nav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sidebar-note { position: static; margin-top: 12px; padding: 10px 12px; }
  .filters-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-control-standard, .filter-control-tail-1, .filter-control-tail-2, .filter-control-tail-3, .filter-grid-actions { grid-column: auto; }
  .filter-control-wide { grid-column: 1 / -1; }
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kpi-grid > .kpi-card,
  .kpi-grid[data-tail="1"] .kpi-card:last-child,
  .kpi-grid[data-tail="2"] .kpi-card:nth-last-child(-n + 2),
  .kpi-grid[data-tail="3"] .kpi-card:nth-last-child(-n + 3) { grid-column: auto; }
  .kpi-grid[data-odd="true"] .kpi-card:last-child { grid-column: 1 / -1; }
  .region-map-layout { grid-template-columns: 1fr; }
  .region-map-canvas { min-height: 300px; }
  .client-tracking-controls > label, .client-tracking-controls .tracking-sort { grid-column: span 4; }
  .client-tracking-actions { grid-column: 1 / -1; justify-content: flex-start; }
}
@media (max-width: 820px) {
  .main { padding: 20px 12px 34px; }
  .executive-header, .panel-heading { display: grid; }
  .header-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); justify-content: stretch; }
  .header-actions > * { width: 100%; min-width: 0; }
  .header-actions, .active-filters { max-width: none; }
  .active-filters-block { justify-items: start; }
  .filters-grid, .charts-grid { grid-template-columns: 1fr; }
  .sidebar-nav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .filter-control, .filter-control-wide, .filter-control-standard, .filter-control-tail-1, .filter-control-tail-2, .filter-control-tail-3, .filter-grid-actions { grid-column: auto; }
  .chart-wide, .chart-featured, .chart-timeline, .chart-row-fill { grid-column: auto; }
  .multi-combobox-panel { z-index: 1000; width: calc(100vw - 24px); max-width: none; max-height: min(72vh, 560px); }
  .multi-combobox-list { max-height: min(44vh, 340px); }
  .detail-explorer-overlay { padding: 8px; place-items: stretch; }
  .detail-explorer-dialog { width: 100%; max-height: calc(100vh - 16px); border-radius: 16px; }
  .detail-explorer-header { position: static; }
  .detail-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-toolbar { grid-template-columns: minmax(0, 1fr) minmax(140px, 0.45fr); }
  .detail-toolbar .quick-search { grid-column: 1 / -1; }
  .detail-table-wrap { display: none; }
  .detail-card-list { display: grid; }
  .negotiation-record-header { align-items: stretch; }
  .negotiation-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .timeline-heading { display: grid; }
  .timeline-action { width: 100%; }
  .timeline-summary-state > div { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .client-tracking-meta { justify-items: start; white-space: normal; }
  .client-tracking-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .client-tracking-controls > label, .client-tracking-controls .tracking-sort { grid-column: auto; }
  .client-tracking-actions { grid-column: 1 / -1; }
  .client-tracking-table-wrap { display: none; }
  .client-tracking-detail .detail-table-wrap { display: block; max-width: 100%; overflow-x: auto; }
}
@media (max-width: 560px) {
  .sidebar-note { display: none; }
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .kpi-card { min-height: 0; padding: 13px; }
  .negotiation-record-header { display: grid; }
  .negotiation-record-header .button { width: 100%; }
  .negotiation-fields { grid-template-columns: 1fr; }
  .negotiation-field-wide { grid-column: auto; }
  .kpi-card.kpi-secondary { min-height: 0; }
  .kpi-value { font-size: 1.25rem; }
  .chart-card, .chart-compact, .chart-standard, .chart-featured { min-height: 0; padding: 14px; }
  .chart, .chart-compact .chart, .chart-standard .chart, .chart-featured .chart { min-height: 290px; height: 290px; }
  .timeline-chart { height: auto; min-height: 330px; }
  .timeline-mode-gantt .timeline-chart { min-height: 0; max-height: 520px; }
  .timeline-mode-summary .timeline-chart { min-height: 260px; }
  .timeline-mode-empty .timeline-chart { min-height: 120px; }
  .timeline-context { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .timeline-context > span { min-width: 0; }
  .timeline-gantt-row { grid-template-columns: 1fr; }
  .timeline-gantt-row > small { grid-column: 1; }
  .timeline-gantt-track { min-width: 0; }
  .native-timeline-list { grid-template-columns: 1fr; min-height: 0; }
  .native-donut { grid-template-columns: 1fr; }
  .native-donut-center { width: 136px; height: 136px; border-width: 22px; }
  .native-treemap { grid-auto-rows: 64px; }
  .native-lollipop-row { grid-template-columns: minmax(90px, 35%) minmax(0, 1fr) minmax(62px, auto); gap: 7px; }
  .detail-explorer-overlay { padding: 8px; }
  .detail-explorer-dialog { width: 100%; max-height: 96vh; border-radius: 14px; }
  .detail-toolbar { grid-template-columns: 1fr; }
  .detail-toolbar .quick-search { grid-column: auto; }
  .detail-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .client-tracking-panel { padding: 14px; }
  .client-tracking-controls { grid-template-columns: 1fr; }
  .client-tracking-controls > label, .client-tracking-controls .tracking-sort, .client-tracking-actions { grid-column: auto; }
  .client-tracking-actions { display: grid; }
  .client-tracking-pagination { display: grid; }
  .client-tracking-pagination-actions { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 560px) {
  .detail-explorer-header { align-items: flex-start; }
  .detail-explorer-header-actions { flex-direction: column-reverse; align-items: flex-end; }
  .detail-modal-back { min-height: 38px; padding-inline: 10px; }
}
@media (max-width: 390px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .kpi-grid > .kpi-card, .kpi-grid[data-odd="true"] .kpi-card:last-child { grid-column: auto; }
  .header-actions { grid-template-columns: 1fr; }
  .context-item { width: 100%; justify-content: space-between; border-radius: 12px; }
  .filter-chip { max-width: 100%; }
  .filter-chip > span:first-child { min-width: 0; overflow-wrap: anywhere; }
  .detail-summary { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
}

function dashboardScript() {
  return `
const UI_COPY = Object.freeze({
  kpis: {
    global: {
      periodSales: { title: "Ventas totales", description: "Ventas registradas en cajas f\u00edsicas durante el per\u00edodo seleccionado." },
      latestSales: { title: "Ventas \u00faltimo mes", description: "Resultado en cajas f\u00edsicas del per\u00edodo m\u00e1s reciente." },
      comparableSales: { title: "Ventas comparables", description: "Ventas en cajas f\u00edsicas utilizadas para medir el cumplimiento." },
      monthlyObjective: { title: "Objetivo mensual", description: "Meta en cajas f\u00edsicas de las negociaciones evaluadas." },
      monthlyCompliance: { title: "Cumplimiento mensual", description: "Resultado de ventas en cajas f\u00edsicas frente al objetivo del mes en cajas f\u00edsicas." },
      objectiveGap: { title: "Diferencia frente al objetivo", positive: "Cajas f\u00edsicas por encima del objetivo.", negative: "Cajas f\u00edsicas pendientes para alcanzar el objetivo.", neutral: "Sin diferencia en cajas f\u00edsicas frente al objetivo." },
      withoutUse: { title: "Clientes negociados sin ventas", description: "Clientes negociados con venta total reportada en cero.", action: "Ver detalle" },
      activeNegotiations: { title: "Negociaciones vigentes", description: "Negociaciones activas a la fecha." }
    },
    shared: {
      sales: "Ventas conjuntas", objective: "Objetivo mensual", compliance: "Cumplimiento mensual", gap: "Diferencia frente al objetivo",
      clients: "Clientes asociados", presentations: "Presentaciones negociadas", status: "Estado", validity: "Vigencia"
    },
    individual: {
      sales: "Ventas del mes", objective: "Objetivo mensual", compliance: "Cumplimiento mensual", gap: "Diferencia frente al objetivo",
      presentations: "Presentaciones negociadas", status: "Estado", validity: "Vigencia", client: "Cliente"
    },
    sharedClient: {
      sales: "Ventas del cliente", objective: "Objetivo mensual", contribution: "Aporte a la negociaci\u00f3n",
      contributionDescription: "Participaci\u00f3n en la venta conjunta.", jointSales: "Ventas conjuntas",
      compliance: "Cumplimiento mensual", gap: "Diferencia frente al objetivo", clients: "Clientes asociados", rank: "Posici\u00f3n por aporte"
    }
  },
  charts: {
    negotiationTimeline: { title: "Evoluci\u00f3n de la negociaci\u00f3n", subtitle: "Ventas y objetivos en cajas f\u00edsicas, con su vigencia por per\u00edodo." },
    activityContribution: { title: "Contribuci\u00f3n por cliente", subtitle: "Participaci\u00f3n de cada cliente en la venta conjunta expresada en cajas f\u00edsicas." },
    activityPerformance: { title: "Cumplimiento por negociaci\u00f3n", subtitle: "Ventas en cajas f\u00edsicas frente a los objetivos de las negociaciones evaluadas." },
    presentationStatus: { title: "Estado de ventas por presentaci\u00f3n", subtitle: "Distribuci\u00f3n de presentaciones seg\u00fan sus ventas en cajas f\u00edsicas." },
    category: { title: "Ventas por categor\u00eda", subtitle: "Participaci\u00f3n de cada categor\u00eda en las ventas de cajas f\u00edsicas." },
    presentations: { title: "Presentaciones con mayor venta", subtitle: "Ranking por volumen de cajas f\u00edsicas." },
    clients: { title: "Ventas por cliente", subtitle: "Resultado en cajas f\u00edsicas por cliente." },
    regions: { title: "Ventas por regi\u00f3n", subtitle: "Resultado en cajas f\u00edsicas por regi\u00f3n comercial." },
    channels: { title: "Ventas por canal", subtitle: "Resultado en cajas f\u00edsicas por canal." },
    cedi: { title: "Ventas por CEDI", subtitle: "Resultado en cajas f\u00edsicas por centro de distribuci\u00f3n." }
  },
  tables: {
    tracking: ["Estado mensual", "Estado total", "Cliente", "Negociaci\u00f3n", "Objetivo mensual", "Venta del mes", "Mix de venta", "Dcto. mes", "Cumplimiento", "Avance total", "Inversi\u00f3n", "Acci\u00f3n"],
    monthly: ["Per\u00edodo", "Venta total", "Venta negociada", "Venta no negociada", "% negociada", "Dcto. mes", "Objetivo", "Cumplimiento", "Estado"],
    contribution: ["Posici\u00f3n", "Cliente", "Ventas", "Participaci\u00f3n", "Presentaciones", "Detalle"]
  },
  statuses: {
    monthly: { CUMPLE_MES: "Cumple", NO_CUMPLE_MES: "No cumple", NO_EVALUABLE_MES: "No evaluable" },
    total: { CUMPLIO_OBJETIVO_TOTAL: "Objetivo cumplido", EN_PROGRESO_OBJETIVO_TOTAL: "En progreso", NO_EVALUABLE_TOTAL: "No evaluable" }
  },
  tooltips: {
    salesMix: "Distribuci\u00f3n de la venta entre presentaciones negociadas y no negociadas.",
    monthlyCompliance: "El cumplimiento considera la venta total del cliente durante el per\u00edodo v\u00e1lido.",
    attributableSales: "Son las cajas registradas dentro del per\u00edodo vigente de la negociaci\u00f3n. Por eso pueden diferir de las ventas generales del per\u00edodo o de las ventas del \u00faltimo mes."
  },
  emptyStates: {
    filters: "No hay resultados para los filtros seleccionados.",
    negotiations: "No hay negociaciones evaluables en este per\u00edodo.",
    withoutUse: "No hay clientes negociados sin ventas.",
    visualization: "No fue posible cargar esta visualizaci\u00f3n.",
    unavailable: "Informaci\u00f3n no disponible."
  },
  actions: {
    detail: "Ver detalle", client: "Ver cliente", negotiation: "Ver negociaci\u00f3n", contribution: "Ver contribuci\u00f3n",
    back: "Volver", downloadCsv: "Descargar CSV"
  },
  modal: {
    summary: "Resumen de la negociaci\u00f3n", clientLocation: "Cliente y ubicaci\u00f3n", objectives: "Objetivos e inversi\u00f3n",
    monthlyResult: "Resultado mensual", salesComposition: "Composici\u00f3n de la venta", accumulated: "Avance acumulado", warnings: "Advertencias"
  },
  csv: {
    monthlyStatus: "Estado mensual", totalStatus: "Estado objetivo total", clientSap: "Cliente SAP", clientName: "Nombre del cliente",
    negotiationId: "ID negociaci\u00f3n", monthlyObjective: "Objetivo mensual", monthlySales: "Venta total del mes",
    negotiatedSales: "Venta negociada", nonNegotiatedSales: "Venta no negociada", negotiatedShare: "Porcentaje negociado",
    nonNegotiatedShare: "Porcentaje no negociado", monthlyDiscount: "Descuento del mes", monthlyCompliance: "Cumplimiento mensual",
    totalProgress: "Avance objetivo total", investment: "Porcentaje de inversi\u00f3n"
  }
});
function getUiCopy() { return UI_COPY; }
function getObjectiveGapDescription(value) {
  return value > 0 ? UI_COPY.kpis.global.objectiveGap.positive : value < 0 ? UI_COPY.kpis.global.objectiveGap.negative : UI_COPY.kpis.global.objectiveGap.neutral;
}
const FILTER_FIELDS = [
  { field: "ID Actividad", label: "Actividad" },
  { field: "Cliente SAP - Clave", label: "Cliente SAP" },
  { field: "Año", label: "Año" },
  { field: "Mes", label: "Mes" },
  { field: "Región SAP", label: "Región SAP" },
  { field: "Canal", label: "Canal" },
  { field: "Categoría AS400 de la venta", label: "Categoría" },
  { field: "Cedi", label: "Cedi" },
  { field: "Estado de vigencia", label: "Estado de vigencia" }
];
const MULTI_FILTER_CONFIGS = {
  activity: { id: "activity", field: "ID Actividad", label: "Actividad", placeholder: "Seleccionar actividad(es)", searchPlaceholder: "Buscar actividad", emptyText: "No hay actividades que coincidan con la búsqueda." },
  client: { id: "client", field: "Cliente SAP - Clave", label: "Cliente SAP", placeholder: "Buscar o seleccionar clientes", searchPlaceholder: "Buscar código, nombre, negocio o NIT", emptyText: "No hay clientes que coincidan con la búsqueda." }
};
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
const NEGOTIATION_USAGE_PRESENTATION_COLUMNS = [
  { id: "presentationCode", label: "Código" },
  { id: "presentation", label: "Presentación" },
  { id: "category", label: "Categoría" },
  { id: "activity", label: "Actividad" },
  { id: "client", label: "Cliente SAP" },
  { id: "clientName", label: "Nombre" },
  { id: "region", label: "Región" },
  { id: "channel", label: "Canal" },
  { id: "cedi", label: "CEDI" },
  { id: "period", label: "Período" },
  { id: "absenceReason", label: "Motivo" }
];
const NEGOTIATION_USAGE_PRESENTATION_SORT_OPTIONS = [
  { field: "presentation", label: "Presentación", dir: "asc" },
  { field: "objectiveMonth", label: "Objetivo mes", dir: "desc" },
  { field: "objectiveTotal", label: "Objetivo total", dir: "desc" },
  { field: "endDate", label: "Fecha fin", dir: "asc" }
];
// Conserva el analisis de calidad por presentacion para las visualizaciones existentes;
// ya no alimenta el KPI ni su modal.
const NO_SALES_EXPLORER_COLUMNS = NEGOTIATION_USAGE_PRESENTATION_COLUMNS;
const NO_SALES_EXPLORER_SORT_OPTIONS = NEGOTIATION_USAGE_PRESENTATION_SORT_OPTIONS;
const NEGOTIATION_USAGE_RELATION_COLUMNS = [
  { id: "clientSap", label: "Cliente SAP" }, { id: "clientName", label: "Nombre del cliente" },
  { id: "nit", label: "NIT" }, { id: "cedis", label: "CEDI" },
  { id: "activityCount", label: "Negociaciones asociadas", numeric: true },
  { id: "monthlyObjectiveCombined", label: "Objetivo mensual combinado", numeric: true },
  { id: "totalReportedSales", label: "Venta total", numeric: true },
  { id: "statusLabel", label: "Estado" }, { id: "actions", label: "Acciones" }
];
const NEGOTIATION_USAGE_SORT_OPTIONS = [
  { field: "clientName", label: "Cliente", dir: "asc" },
  { field: "clientSap", label: "Cliente SAP", dir: "asc" },
  { field: "monthlyObjectiveCombined", label: "Objetivo mensual combinado", dir: "desc" },
  { field: "activityCount", label: "Negociaciones asociadas", dir: "desc" },
  { field: "region", label: "Regi\\u00f3n", dir: "asc" }
];
const NEGOTIATION_USAGE_NEGOTIATION_COLUMNS = [
  { id: "activityId", label: "ID Actividad" }, { id: "negotiationType", label: "Tipo de negociaci\\u00f3n" },
  { id: "startDate", label: "Fecha inicio" }, { id: "endDate", label: "Fecha fin" },
  { id: "contractualStatusLabel", label: "Estado contractual" }, { id: "monthlyObjective", label: "Objetivo mensual", numeric: true },
  { id: "totalObjective", label: "Objetivo total", numeric: true }, { id: "negotiationDuration", label: "Duraci\\u00f3n de la negociaci\\u00f3n", numeric: true },
  { id: "investmentPercentage", label: "Porcentaje de inversi\\u00f3n", numeric: true }, { id: "cedi", label: "CEDI" },
  { id: "negotiatedPresentationCount", label: "Cantidad de presentaciones", numeric: true }, { id: "categoriesLabel", label: "Categor\\u00edas negociadas" },
  { id: "totalReportedSales", label: "Venta total reportada", numeric: true }, { id: "actions", label: "Acciones" }
];
const DETAIL_EXPLORER_VISIBLE_STEP = 25;
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
const PERFORMANCE_DEBUG = false;
const RUNTIME_DIAGNOSTIC_LIMIT = 40;
const TIMELINE_MAX_GANTT_ROWS = 8;
const TIMELINE_MAX_PERIODS = 36;
const chartInstances = {};
let colombiaGeoJsonCache = null;
let regionMapRenderToken = 0;
let detailExplorerEventsBound = false;
let detailSearchDebounced = null;
const pageScrollLock = {
  count: 0, scrollX: 0, scrollY: 0, touchY: null, bodyStyle: null
};
let filterPanelEventsBound = false;
let filterSearchDebounced = null;
let comboboxViewportEventsBound = false;
let dashboardInitialized = false;
const debouncedResizeCharts = debounce(resizeCharts, 160);
const state = {
  filters: {}, scopeRows: [], filteredRows: [], analyses: null, indexes: null, datasetVersion: 0,
  filterCache: createLruCache(12), analysisCache: createLruCache(8), negotiationUsageCache: createLruCache(8), contributionModelCache: createLruCache(8), facetedOptionsCache: createLruCache(12), timelineCache: createLruCache(8), clientTrackingCache: createLruCache(8), clientTrackingDetailCache: createLruCache(16),
  clientTrackingRelationIndex: new Map(), clientTrackingRelationIndexSource: null,
  activityAnalyticsCache: { key: "", value: null }, chartSignatures: new Map(), chartLayoutSignature: "",
  pendingRenderFrame: null, renderVersion: 0, syncingControls: false,
  filterUi: { openComboboxId: null, queries: { activity: "", client: "" }, highlighted: { activity: -1, client: -1 } },
  facetedOptions: null,
  performance: createPerformanceState(),
  runtimeDiagnostics: { errors: [], warnings: [] },
  clientTrackingTable: getEmptyClientTrackingTableState(),
  modalNavigation: { stack: [] },
  negotiationUsageAnalysis: getEmptyNegotiationUsageAnalysis(), detailExplorer: getEmptyDetailExplorerState(), search: "",
  page: 1, pageSize: 10, sortField: "Ventas cajas físicas (sin rep)", sortDir: "desc"
};
const chartDrilldowns = {
  activityContribution: {
    open: function (activity, sourceElement) { openActivityContributionDetail(activity, sourceElement); }
  }
};
const debouncedDashboardRender = debounce(function () { scheduleDashboardRender("debounced-input"); }, 160);
document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  if (dashboardInitialized) return;
  dashboardInitialized = true;
  initTheme();
  initSidebar();
  validateDashboardDataShape(DASHBOARD_DATA);
  initializeDashboardDataset(DASHBOARD_DATA);
  populateFilters();
  bindEvents();
  window.addEventListener("resize", debouncedResizeCharts);
  window.addEventListener("beforeunload", destroyDashboard);
  waitForECharts(function () { scheduleDashboardRender("initial-load"); });
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
    reportDashboardDiagnostic("warning", "theme-read", error, "No se pudo leer la preferencia de tema.");
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
      reportDashboardDiagnostic("warning", "theme-write", error, "No se pudo guardar la preferencia de tema.");
    }
  }
  updateThemeToggle(normalizedTheme);
}
function toggleTheme() {
  applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
  state.chartSignatures.clear();
  if (state.analyses) renderAdaptiveCharts(state.analyses);
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
    reportDashboardDiagnostic("warning", "sidebar", error, "No se pudo guardar el estado del sidebar.");
  }
}
function waitForECharts(callback, retries) {
  const remaining = typeof retries === "number" ? retries : 30;
  if (window.echarts) {
    callback();
    return;
  }
  if (remaining <= 0) {
    reportDashboardDiagnostic("warning", "echarts-cdn", null, "ECharts no cargó; se activó el fallback nativo.");
    callback();
    return;
  }
  window.setTimeout(function () {
    waitForECharts(callback, remaining - 1);
  }, 100);
}
function validateDashboardDataShape(rows) {
  if (!rows.length) {
    reportDashboardDiagnostic("warning", "dataset", null, "El dataset no contiene filas.");
    return false;
  }
  const requiredFields = ["Región SAP", "Canal", "Categoría AS400 de la venta", "Ventas cajas físicas (sin rep)", "TotalVentaMes", "Objetivo mes ", "estadoInformacionVenta"];
  requiredFields.forEach(function (field) {
    if (!(field in rows[0])) {
      reportDashboardDiagnostic("warning", "dataset-column", null, "No se encontró un campo requerido por el dashboard: " + field);
    }
  });
  return true;
}
function bindEvents() {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  bindDetailExplorerEvents();
  bindClientTrackingEvents();
  const clearButton = document.getElementById("clearFiltersButton");
  if (clearButton) clearButton.addEventListener("click", clearFilters);
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) searchInput.addEventListener("input", function (event) {
    state.search = event.target.value.trim().toLocaleLowerCase("es-CO");
    state.page = 1;
    debouncedDashboardRender();
  });
  const charts = document.getElementById("charts");
  if (charts) charts.addEventListener("click", handleTimelineAction);
  const kpis = document.getElementById("kpis");
  if (kpis) {
    kpis.addEventListener("click", handleKpiAction);
    kpis.addEventListener("keydown", handleKpiAction);
  }
}
function handleKpiAction(event) {
  const target = event.target && event.target.closest ? event.target.closest("[data-kpi-action]") : null;
  if (!target || target.dataset.kpiAction !== "open-negotiation-usage") return;
  if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
  if (event.type === "keydown") event.preventDefault();
  openNegotiationUsageExplorer(target);
}
function isDashboardDebugEnabled() {
  return PERFORMANCE_DEBUG || Boolean(window.__DASHBOARD_PERF_DEBUG__ || window.__DASHBOARD_DEBUG__);
}
function reportDashboardDiagnostic(level, component, error, message) {
  const bucket = level === "error" ? "errors" : "warnings";
  const diagnostic = {
    component: normalizeText(component) || "dashboard",
    message: normalizeText(message || (error && error.message) || "Incidencia técnica").slice(0, 240),
    name: normalizeText(error && error.name).slice(0, 80),
    at: new Date().toISOString()
  };
  state.runtimeDiagnostics[bucket].push(diagnostic);
  if (state.runtimeDiagnostics[bucket].length > RUNTIME_DIAGNOSTIC_LIMIT) state.runtimeDiagnostics[bucket].splice(0, state.runtimeDiagnostics[bucket].length - RUNTIME_DIAGNOSTIC_LIMIT);
  if (isDashboardDebugEnabled() && window.console) {
    const method = level === "error" ? "error" : "warn";
    if (typeof window.console[method] === "function") window.console[method]("Dashboard " + diagnostic.component + ": " + diagnostic.message);
  }
  return diagnostic;
}
function showDashboardRuntimeMessage(message, tone) {
  const element = document.getElementById("chartEmptySummary");
  if (!element) return;
  element.hidden = false;
  element.setAttribute("role", tone === "error" ? "alert" : "status");
  element.textContent = message;
}
function getDashboardDiagnosticsSnapshot() {
  return { errors: state.runtimeDiagnostics.errors.slice(), warnings: state.runtimeDiagnostics.warnings.slice(), limit: RUNTIME_DIAGNOSTIC_LIMIT };
}
function safelyRenderComponent(componentId, renderFn, fallbackFn) {
  try {
    return renderFn();
  } catch (error) {
    reportDashboardDiagnostic("error", componentId, error, "No se pudo renderizar el componente: " + normalizeText(error && error.message));
    return typeof fallbackFn === "function" ? fallbackFn(error) : undefined;
  }
}
function handleTimelineAction(event) {
  const target = event.target && event.target.closest ? event.target.closest("[data-timeline-action]") : null;
  if (!target) return;
  const action = target.dataset.timelineAction;
  if (action === "filter-activity" && target.dataset.timelineActivity) {
    updateDashboardFilters({ "ID Actividad": [target.dataset.timelineActivity] }, { reason: "timeline-activity" });
    return;
  }
  if ((action === "open-contribution" || action === "open-detail") && state.analyses && state.analyses.timeline) {
    const activityId = target.dataset.timelineActivity;
    const activity = state.analyses.activityPerformance.find(function (item) { return item.activityId === activityId; }) || state.analyses.kpis.selectedActivity || state.analyses.kpis.selectedActivityContract;
    if (activity) openActivityContributionDetail(activity, target);
  }
}
function renderHeaderContext() {
  const rows = state.filteredRows.length || hasActiveDashboardFilters() || state.search ? state.filteredRows : DASHBOARD_DATA;
  const context = getRegionContext(rows);
  const title = context.title;
  document.title = title;
  const titleElement = document.getElementById("dashboardTitle");
  if (titleElement) titleElement.textContent = title;
  const header = document.getElementById("headerContext");
  if (header) header.innerHTML = '<span class="badge badge-muted">' + escapeHtml(context.badge) + '</span>';
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
  if (!container) return;
  const filterConfigs = getAvailableFilterConfigs(DASHBOARD_DATA);
  const filterLayout = assignAdaptiveFilterLayout(filterConfigs.concat([{ item: { field: "__actions" } }]));
  const actionLayout = filterLayout.pop();
  container.innerHTML = filterConfigs.map(function (config, index) {
    const item = config.item;
    const layoutClass = filterLayout[index];
    if (item.field === "ID Actividad") return buildMultiSelectComboboxShell(MULTI_FILTER_CONFIGS.activity, layoutClass);
    if (item.field === "Cliente SAP - Clave") return buildMultiSelectComboboxShell(MULTI_FILTER_CONFIGS.client, layoutClass);
    return "<label class=\\"filter-control " + layoutClass + "\\"><span class=\\"filter-control-label\\">" + escapeHtml(item.label) + "</span><select data-filter-field=\\"" + escapeHtml(item.field) + "\\"><option value=\\"\\">Todos</option>" + config.options.map(function (option) {
      return "<option value=\\"" + escapeHtml(option) + "\\">" + escapeHtml(option) + "</option>";
    }).join("") + "</select></label>";
  }).join("") + "<div class=\\"filter-grid-actions " + actionLayout + "\\"><button id=\\"clearFiltersButton\\" class=\\"button button-ghost\\" type=\\"button\\"><i data-lucide=\\"filter-x\\"></i> Limpiar filtros</button></div>";
  bindFilterPanelEvents();
  state.facetedOptions = measurePerformance("facetedOptions", function () { return buildFacetedOptions(state.filters); });
  syncFilterControlsFromState({ refreshOptions: true });
}
function assignAdaptiveFilterLayout(configs) {
  const standardIndexes = [];
  const result = configs.map(function (config, index) {
    const wide = config.item.field === "ID Actividad" || config.item.field === "Cliente SAP - Clave";
    if (!wide) standardIndexes.push(index);
    return wide ? "filter-control-wide" : "filter-control-standard";
  });
  const tail = standardIndexes.length % 4;
  if (tail) standardIndexes.slice(-tail).forEach(function (index) { result[index] += " filter-control-tail-" + tail; });
  return result;
}
function buildMultiSelectComboboxShell(config, layoutClass) {
  const listId = config.id + "FilterListbox";
  return "<div class=\\"filter-control " + (layoutClass || "filter-control-wide") + " multi-combobox\\" data-combobox-id=\\"" + config.id + "\\"><span id=\\"" + config.id + "FilterLabel\\" class=\\"filter-control-label\\">" + escapeHtml(config.label) + "</span><button class=\\"multi-combobox-trigger\\" type=\\"button\\" role=\\"combobox\\" aria-expanded=\\"false\\" aria-haspopup=\\"listbox\\" aria-controls=\\"" + listId + "\\" aria-labelledby=\\"" + config.id + "FilterLabel\\" data-filter-action=\\"toggle-combobox\\" data-combobox-id=\\"" + config.id + "\\"><span class=\\"multi-combobox-value\\">" + escapeHtml(config.placeholder) + "</span><span class=\\"multi-combobox-count\\">0 seleccionados</span><i data-lucide=\\"chevron-down\\"></i></button><div class=\\"multi-combobox-panel\\" data-combobox-panel=\\"" + config.id + "\\" hidden><div class=\\"multi-combobox-search\\"><div class=\\"quick-search\\"><i data-lucide=\\"search\\"></i><input type=\\"search\\" autocomplete=\\"off\\" data-filter-action=\\"search-options\\" data-combobox-id=\\"" + config.id + "\\" placeholder=\\"" + escapeHtml(config.searchPlaceholder) + "\\" aria-label=\\"" + escapeHtml(config.searchPlaceholder) + "\\"></div></div><div class=\\"multi-combobox-status\\" aria-live=\\"polite\\"><span data-filter-results-count=\\"" + config.id + "\\"></span><span data-filter-selected-count=\\"" + config.id + "\\"></span></div><div id=\\"" + listId + "\\" class=\\"multi-combobox-list\\" role=\\"listbox\\" aria-multiselectable=\\"true\\" data-combobox-list=\\"" + config.id + "\\"></div><div class=\\"multi-combobox-footer\\"><button class=\\"button button-ghost\\" type=\\"button\\" data-filter-action=\\"select-visible\\" data-combobox-id=\\"" + config.id + "\\">Seleccionar visibles</button><button class=\\"button button-ghost\\" type=\\"button\\" data-filter-action=\\"clear-dimension\\" data-filter-field=\\"" + escapeHtml(config.field) + "\\">Limpiar</button></div></div></div>";
}
function getAvailableFilterConfigs(rows) {
  return FILTER_FIELDS.map(function (item) {
    const indexedValues = state.indexes && rows === state.indexes.rows && state.indexes.rowsByField.get(item.field);
    const options = indexedValues ? Array.from(indexedValues.keys()).sort(function (a, b) { return a.localeCompare(b, "es"); }) : getUniqueOptions(rows, item.field);
    return { item: item, options: options };
  }).filter(function (config) {
    return config.options.length > 1;
  });
}
function clearFilters() {
  state.filterUi.openComboboxId = null;
  state.filterUi.queries = { activity: "", client: "" };
  state.filterUi.highlighted = { activity: -1, client: -1 };
  if (filterSearchDebounced && filterSearchDebounced.cancel) filterSearchDebounced.cancel();
  state.search = "";
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) searchInput.value = "";
  updateDashboardFilters({}, { replace: true, reason: "clear-filters" });
}
function normalizeFilterValues(values) {
  const source = Array.isArray(values) ? values : [values];
  return Array.from(new Set(source.map(normalizeText).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, "es"); });
}
function normalizeFilters(filters) {
  const allowed = new Set(FILTER_FIELDS.map(function (item) { return item.field; }));
  return Object.keys(filters || {}).sort().reduce(function (result, field) {
    if (!allowed.has(field)) return result;
    const values = normalizeFilterValues(filters[field]);
    if (values.length) result[field] = values;
    return result;
  }, {});
}
function sanitizeFiltersAgainstCatalog(filters) {
  if (!state.indexes || !state.indexes.rowsByField) return normalizeFilters(filters);
  const normalized = normalizeFilters(filters);
  return Object.keys(normalized).reduce(function (result, field) {
    const catalog = state.indexes.rowsByField.get(field);
    const values = catalog ? normalized[field].filter(function (value) { return catalog.has(value); }) : normalized[field];
    if (values.length) result[field] = values;
    return result;
  }, {});
}
function areFiltersEqual(left, right) {
  return getFilterSignature(normalizeFilters(left)) === getFilterSignature(normalizeFilters(right));
}
function getDashboardFilterState() {
  return JSON.parse(JSON.stringify(normalizeFilters(state.filters)));
}
function getFilterUiSnapshot() {
  return JSON.parse(JSON.stringify(state.filterUi));
}
function updateDashboardFilters(patch, options) {
  options = options || {};
  const merged = options.replace ? patch || {} : Object.assign({}, state.filters, patch || {});
  const nextFilters = sanitizeFiltersAgainstCatalog(merged);
  if (areFiltersEqual(state.filters, nextFilters)) {
    syncFilterControlsFromState({ refreshOptions: false });
    return false;
  }
  state.filters = nextFilters;
  state.page = 1;
  state.clientTrackingTable.page = 1;
  if (!options.preserveOpenDropdown) state.filterUi.openComboboxId = null;
  syncFilterControlsFromState({ refreshOptions: false });
  scheduleDashboardRender(options.reason || "filter-change");
  return true;
}
function buildFacetedOptions(filters, baseRows) {
  const normalized = normalizeFilters(filters);
  const rows = baseRows || (state.indexes && state.indexes.rows) || DASHBOARD_DATA;
  const key = state.datasetVersion + "|" + getFilterSignature(normalized);
  const cached = state.facetedOptionsCache.get(key);
  if (cached) return cached;
  const fields = FILTER_FIELDS.map(function (item) { return item.field; });
  const fullRows = getFilteredRowsCached(rows, normalized, "facets:all");
  const availabilityByField = collectAvailableFilterValues(fullRows, fields);
  Object.keys(normalized).forEach(function (excludedField) {
    const otherFilters = Object.keys(normalized).reduce(function (result, field) {
      if (field !== excludedField) result[field] = normalized[field];
      return result;
    }, {});
    const facetRows = getFilteredRowsCached(rows, otherFilters, "facet:" + excludedField);
    availabilityByField.set(excludedField, collectAvailableFilterValues(facetRows, [excludedField]).get(excludedField));
  });
  const result = new Map();
  fields.forEach(function (field) {
    const catalogMap = state.indexes && state.indexes.rowsByField ? state.indexes.rowsByField.get(field) : null;
    const catalogValues = catalogMap ? Array.from(catalogMap.keys()) : getUniqueOptions(rows, field);
    const available = availabilityByField.get(field) || new Set();
    const selected = new Set(normalized[field] || []);
    result.set(field, catalogValues.sort(function (a, b) { return a.localeCompare(b, "es"); }).map(function (value) {
      const metadata = getCatalogOptionMetadata(field, value);
      return Object.assign({}, metadata, { value: value, selected: selected.has(value), available: available.has(value) });
    }));
  });
  return state.facetedOptionsCache.set(key, result);
}
function collectAvailableFilterValues(rows, fields) {
  const result = new Map(fields.map(function (field) { return [field, new Set()]; }));
  (rows || []).forEach(function (row) {
    fields.forEach(function (field) {
      const value = field === "Estado de vigencia" ? getIndexedVigenciaStatus(row) : normalizeText(row[field]);
      if (value) result.get(field).add(value);
    });
  });
  return result;
}
function getCatalogOptionMetadata(field, value) {
  if (state.indexes && state.indexes.catalogs) {
    if (field === "ID Actividad" && state.indexes.catalogs.activity.has(value)) return state.indexes.catalogs.activity.get(value);
    if (field === "Cliente SAP - Clave" && state.indexes.catalogs.client.has(value)) return state.indexes.catalogs.client.get(value);
  }
  return { value: value, label: value, description: "", searchText: normalizeSearchText(value) };
}
function syncFilterControlsFromState(options) {
  options = options || {};
  if (state.syncingControls) return;
  state.syncingControls = true;
  try {
    if (options.refreshOptions || !state.facetedOptions) state.facetedOptions = buildFacetedOptions(state.filters);
    if (document.querySelectorAll) {
      document.querySelectorAll("select[data-filter-field]").forEach(function (select) {
        const values = state.filters[select.dataset.filterField] || [];
        select.value = values[0] || "";
        Array.from(select.options || []).forEach(function (option) {
          if (!option.value) return;
          const model = (state.facetedOptions.get(select.dataset.filterField) || []).find(function (item) { return item.value === option.value; });
          option.disabled = Boolean(model && !model.available && !model.selected);
        });
      });
    }
    syncMultiSelectCombobox(MULTI_FILTER_CONFIGS.activity);
    syncMultiSelectCombobox(MULTI_FILTER_CONFIGS.client);
  } finally {
    state.syncingControls = false;
  }
}
function getComboboxRoot(id) {
  return document.querySelector ? document.querySelector('[data-combobox-id="' + id + '"].multi-combobox') : null;
}
function getComboboxPanel(id, root) {
  const selector = '[data-combobox-panel="' + id + '"]';
  return document.querySelector ? document.querySelector(selector) || (root && root.querySelector ? root.querySelector(selector) : null) : root && root.querySelector ? root.querySelector(selector) : null;
}
function portalComboboxPanel(root, panel) {
  if (!root || !panel || !document.body || !document.body.appendChild) return;
  if (!panel.__comboboxHome) panel.__comboboxHome = root;
  if (panel.parentNode !== document.body) document.body.appendChild(panel);
}
function restoreComboboxPanel(panel) {
  if (!panel || !panel.__comboboxHome || !panel.__comboboxHome.appendChild) return;
  if (panel.parentNode !== panel.__comboboxHome) panel.__comboboxHome.appendChild(panel);
}
function syncMultiSelectCombobox(config) {
  const root = getComboboxRoot(config.id);
  if (!root) return;
  const selected = state.filters[config.field] || [];
  const trigger = root.querySelector('[data-filter-action="toggle-combobox"]');
  const panel = getComboboxPanel(config.id, root);
  const value = root.querySelector(".multi-combobox-value");
  const count = root.querySelector(".multi-combobox-count");
  const isOpen = state.filterUi.openComboboxId === config.id;
  if (trigger) trigger.setAttribute("aria-expanded", String(isOpen));
  if (panel && isOpen) portalComboboxPanel(root, panel);
  if (panel) panel.hidden = !isOpen;
  if (value) value.textContent = getComboboxSelectionText(config, selected);
  if (count) count.textContent = selected.length + " seleccionados";
  const input = panel && panel.querySelector ? panel.querySelector('[data-filter-action="search-options"]') : null;
  if (input && input.value !== state.filterUi.queries[config.id]) input.value = state.filterUi.queries[config.id];
  renderComboboxOptions(config, root, panel);
  if (isOpen) positionComboboxPanel(root, panel);
  else if (panel) restoreComboboxPanel(panel);
}
function getComboboxSelectionText(config, selected) {
  const count = (selected || []).length;
  if (!count) return config.placeholder;
  if (config.id === "activity") return count + " " + (count === 1 ? "actividad seleccionada" : "actividades seleccionadas");
  return count + " " + (count === 1 ? "cliente seleccionado" : "clientes seleccionados");
}
function getVisibleComboboxOptions(config) {
  const query = normalizeSearchText(state.filterUi.queries[config.id]);
  const options = state.facetedOptions ? state.facetedOptions.get(config.field) || [] : [];
  return options.filter(function (option) { return !query || option.searchText.includes(query); });
}
function renderComboboxOptions(config, root, panel) {
  const candidatePanel = panel || getComboboxPanel(config.id, root);
  const scope = candidatePanel && candidatePanel.querySelector ? candidatePanel : root;
  const list = scope && scope.querySelector ? scope.querySelector('[data-combobox-list="' + config.id + '"]') : null;
  if (!list) return;
  const options = getVisibleComboboxOptions(config);
  const selectedCount = (state.filters[config.field] || []).length;
  const availableCount = options.filter(function (option) { return option.available; }).length;
  const results = scope.querySelector('[data-filter-results-count="' + config.id + '"]');
  const selected = scope.querySelector('[data-filter-selected-count="' + config.id + '"]');
  if (results) results.textContent = formatInteger(options.length) + " resultado(s)";
  if (selected) selected.textContent = formatInteger(selectedCount) + " seleccionado(s)";
  if (!options.length) {
    list.innerHTML = "<div class=\\"multi-combobox-empty\\">" + escapeHtml(config.emptyText) + "</div>";
    return;
  }
  if (!availableCount && !options.some(function (option) { return option.selected; })) {
    list.innerHTML = "<div class=\\"multi-combobox-empty\\">No hay opciones disponibles con los demás filtros aplicados.</div>";
    return;
  }
  const highlighted = state.filterUi.highlighted[config.id];
  list.innerHTML = options.map(function (option, index) {
    const unavailable = !option.available && !option.selected;
    const description = option.description + (!option.available && option.selected ? " · Seleccionada sin resultados con los demás filtros" : "");
    return "<button class=\\"multi-combobox-option" + (index === highlighted ? " is-highlighted" : "") + "\\" type=\\"button\\" role=\\"option\\" aria-selected=\\"" + String(option.selected) + "\\" data-filter-action=\\"toggle-option\\" data-combobox-id=\\"" + config.id + "\\" data-filter-field=\\"" + escapeHtml(config.field) + "\\" data-filter-value=\\"" + escapeHtml(option.value) + "\\" data-option-index=\\"" + index + "\\"" + (unavailable ? " disabled" : "") + "><span class=\\"multi-combobox-check\\" aria-hidden=\\"true\\">✓</span><span class=\\"multi-combobox-option-copy\\"><strong>" + escapeHtml(option.label) + "</strong>" + (description ? "<small>" + escapeHtml(description) + "</small>" : "") + "</span></button>";
  }).join("");
}
function positionComboboxPanel(root, panel) {
  if (!root || !panel || !root.getBoundingClientRect) return;
  const rect = root.getBoundingClientRect();
  const viewportWidth = Math.max(0, Number(window.innerWidth) || 0);
  const viewportHeight = Math.max(0, Number(window.innerHeight) || 0);
  if (!viewportWidth || !viewportHeight) return;
  const gap = 8, edge = 12;
  const width = Math.min(Math.max(rect.width, 320), Math.max(0, viewportWidth - edge * 2));
  const estimatedHeight = Math.min(panel.scrollHeight || 420, Math.max(160, viewportHeight - edge * 2));
  const opensUp = viewportHeight - rect.bottom < estimatedHeight + gap && rect.top > viewportHeight - rect.bottom;
  const top = opensUp ? Math.max(edge, rect.top - estimatedHeight - gap) : Math.min(viewportHeight - estimatedHeight - edge, rect.bottom + gap);
  const left = Math.max(edge, Math.min(rect.left, viewportWidth - width - edge));
  panel.style.width = Math.round(width) + "px";
  panel.style.maxHeight = Math.round(Math.max(160, viewportHeight - edge * 2)) + "px";
  panel.style.left = Math.round(left) + "px";
  panel.style.top = Math.round(top) + "px";
  panel.dataset.placement = opensUp ? "top" : "bottom";
}
function bindFilterPanelEvents() {
  if (filterPanelEventsBound) return;
  const container = document.getElementById("filtersGrid");
  if (!container) return;
  filterPanelEventsBound = true;
  filterSearchDebounced = debounce(function (id) {
    const config = MULTI_FILTER_CONFIGS[id];
    const root = config ? getComboboxRoot(id) : null;
    if (config && root) renderComboboxOptions(config, root, getComboboxPanel(id, root));
  }, 120);
  container.addEventListener("click", handleFilterPanelClick);
  container.addEventListener("input", handleFilterPanelInput);
  container.addEventListener("change", handleFilterPanelChange);
  container.addEventListener("keydown", handleFilterPanelKeydown);
  const chips = document.getElementById("activeFilters");
  if (chips) chips.addEventListener("click", handleActiveFilterClick);
  document.addEventListener("mousedown", handleFilterOutsideClick);
  document.addEventListener("click", handlePortalComboboxClick);
  document.addEventListener("input", handlePortalComboboxInput);
  document.addEventListener("keydown", handlePortalComboboxKeydown);
  if (!comboboxViewportEventsBound) {
    comboboxViewportEventsBound = true;
    window.addEventListener("scroll", repositionOpenComboboxPanel, true);
    window.addEventListener("resize", repositionOpenComboboxPanel);
  }
}
function isPortalComboboxEvent(event) {
  return Boolean(event && event.target && event.target.closest && event.target.closest("[data-combobox-panel]"));
}
function handlePortalComboboxClick(event) {
  if (isPortalComboboxEvent(event)) handleFilterPanelClick(event);
}
function handlePortalComboboxInput(event) {
  if (isPortalComboboxEvent(event)) handleFilterPanelInput(event);
}
function handlePortalComboboxKeydown(event) {
  if (isPortalComboboxEvent(event)) handleFilterPanelKeydown(event);
}
function repositionOpenComboboxPanel() {
  const id = state.filterUi.openComboboxId;
  if (!id) return;
  const root = getComboboxRoot(id);
  const panel = getComboboxPanel(id, root);
  if (root && panel && !panel.hidden) positionComboboxPanel(root, panel);
}
function handleFilterPanelClick(event) {
  const target = event.target && event.target.closest ? event.target.closest("[data-filter-action]") : null;
  if (!target) return;
  const action = target.dataset.filterAction;
  const id = target.dataset.comboboxId;
  const config = MULTI_FILTER_CONFIGS[id];
  if (action === "toggle-combobox" && config) {
    state.filterUi.openComboboxId = state.filterUi.openComboboxId === id ? null : id;
    state.filterUi.highlighted[id] = -1;
    syncFilterControlsFromState({ refreshOptions: false });
    if (state.filterUi.openComboboxId === id) {
      const root = getComboboxRoot(id);
      const panel = getComboboxPanel(id, root);
      const input = panel && panel.querySelector ? panel.querySelector('[data-filter-action="search-options"]') : null;
      if (input && input.focus) input.focus();
    }
    return;
  }
  if (action === "toggle-option" && config) {
    const values = state.filters[config.field] || [];
    const value = normalizeText(target.dataset.filterValue);
    const next = values.indexOf(value) === -1 ? values.concat(value) : values.filter(function (item) { return item !== value; });
    updateDashboardFilters({ [config.field]: next }, { reason: "combobox-option", preserveOpenDropdown: true });
    return;
  }
  if (action === "clear-dimension") {
    updateDashboardFilters({ [target.dataset.filterField]: [] }, { reason: "clear-filter-dimension", preserveOpenDropdown: true });
    return;
  }
  if (action === "select-visible" && config) {
    const visible = getVisibleComboboxOptions(config).filter(function (option) { return option.available || option.selected; }).map(function (option) { return option.value; });
    updateDashboardFilters({ [config.field]: (state.filters[config.field] || []).concat(visible) }, { reason: "select-visible-options", preserveOpenDropdown: true });
  }
}
function handleFilterPanelInput(event) {
  const target = event.target;
  if (!target || target.dataset.filterAction !== "search-options") return;
  const id = target.dataset.comboboxId;
  setFilterComboboxQuery(id, target.value || "");
  filterSearchDebounced(id);
}
function setFilterComboboxQuery(id, query) {
  if (!MULTI_FILTER_CONFIGS[id]) return;
  state.filterUi.queries[id] = query || "";
  state.filterUi.highlighted[id] = -1;
}
function handleFilterPanelChange(event) {
  const target = event.target;
  if (!target || !target.dataset.filterField || state.syncingControls) return;
  updateDashboardFilters({ [target.dataset.filterField]: target.value }, { reason: "filter-select" });
}
function handleFilterPanelKeydown(event) {
  const target = event.target;
  const root = target && target.closest ? target.closest("[data-combobox-id].multi-combobox") : null;
  const panel = target && target.closest ? target.closest("[data-combobox-panel]") : null;
  if (!root && !panel) return;
  const id = root ? root.dataset.comboboxId : panel.dataset.comboboxPanel;
  const config = MULTI_FILTER_CONFIGS[id];
  if (!config) return;
  if ((event.key === "Enter" || event.key === " ") && target.dataset.filterAction === "toggle-combobox") {
    event.preventDefault(); handleFilterPanelClick({ target: target }); return;
  }
  if ((event.key === "Enter" || event.key === " ") && target.dataset.filterAction === "toggle-option") {
    event.preventDefault(); handleFilterPanelClick({ target: target }); return;
  }
  if (event.key === "Escape") {
    state.filterUi.openComboboxId = null; syncFilterControlsFromState({ refreshOptions: false }); return;
  }
  if (event.key === "Tab") {
    state.filterUi.openComboboxId = null;
    syncFilterControlsFromState({ refreshOptions: false });
    return;
  }
  if (["ArrowDown", "ArrowUp", "Home", "End"].indexOf(event.key) === -1) return;
  event.preventDefault();
  if (state.filterUi.openComboboxId !== id) state.filterUi.openComboboxId = id;
  const options = getVisibleComboboxOptions(config);
  if (!options.length) return;
  let index = state.filterUi.highlighted[id];
  if (event.key === "Home") index = 0;
  else if (event.key === "End") index = options.length - 1;
  else if (event.key === "ArrowDown") index = Math.min(options.length - 1, index + 1);
  else index = Math.max(0, index < 0 ? options.length - 1 : index - 1);
  state.filterUi.highlighted[id] = index;
  syncMultiSelectCombobox(config);
  const panelElement = getComboboxPanel(id, root);
  const current = panelElement && panelElement.querySelector ? panelElement.querySelector('[data-option-index="' + index + '"]') : null;
  if (current && current.focus) current.focus();
}
function handleFilterOutsideClick(event) {
  if (!state.filterUi.openComboboxId) return;
  const target = event.target;
  if (target && target.closest && (target.closest(".multi-combobox") || target.closest("[data-combobox-panel]"))) return;
  state.filterUi.openComboboxId = null;
  syncFilterControlsFromState({ refreshOptions: false });
}
function handleActiveFilterClick(event) {
  const target = event.target && event.target.closest ? event.target.closest("[data-filter-chip-field]") : null;
  if (!target) return;
  updateDashboardFilters({ [target.dataset.filterChipField]: [] }, { reason: "remove-filter-chip" });
}
function createPerformanceState() {
  return { stages: {}, counters: { indexesBuilt: 0, analysesExecuted: 0, negotiationUsageModelsBuilt: 0, negotiationUsageCacheHits: 0, rendersScheduled: 0, rendersCompleted: 0, rendersCancelled: 0, chartUpdates: 0, chartInitializations: 0, chartDisposals: 0, timelineModelsBuilt: 0, timelineCacheHits: 0, timelineUpdates: 0, timelineInitializations: 0, modalRowsRendered: 0, modalModelsBuilt: 0, clientTrackingProjectionsBuilt: 0, clientTrackingCacheHits: 0, clientTrackingRowsRendered: 0, clientTrackingDetailModelsBuilt: 0, clientTrackingDetailCacheHits: 0 } };
}
function performanceNow() {
  return window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
}
function measurePerformance(name, callback) {
  const startedAt = performanceNow();
  const value = callback();
  const elapsed = performanceNow() - startedAt;
  const stage = state.performance.stages[name] || { count: 0, totalMs: 0, maxMs: 0, lastMs: 0 };
  stage.count += 1; stage.totalMs += elapsed; stage.maxMs = Math.max(stage.maxMs, elapsed); stage.lastMs = elapsed;
  state.performance.stages[name] = stage;
  return value;
}
function isPerformanceDebugEnabled() {
  return isDashboardDebugEnabled();
}
function getDashboardPerformanceSnapshot() {
  return {
    rows: state.indexes && state.indexes.rows ? state.indexes.rows.length : DASHBOARD_DATA.length,
    indexes: state.indexes ? state.indexes.stats : null,
    stages: JSON.parse(JSON.stringify(state.performance.stages)),
    counters: Object.assign({}, state.performance.counters),
    caches: { filters: state.filterCache.size(), analyses: state.analysisCache.size(), negotiationUsage: state.negotiationUsageCache.size(), contributions: state.contributionModelCache.size(), facets: state.facetedOptionsCache.size(), timelines: state.timelineCache.size(), clientTracking: state.clientTrackingCache.size(), clientTrackingDetails: state.clientTrackingDetailCache.size(), charts: state.chartSignatures.size },
    diagnostics: { errors: state.runtimeDiagnostics.errors.length, warnings: state.runtimeDiagnostics.warnings.length, limit: RUNTIME_DIAGNOSTIC_LIMIT }
  };
}
function createLruCache(limit) {
  const values = new Map();
  return {
    get: function (key) { if (!values.has(key)) return undefined; const value = values.get(key); values.delete(key); values.set(key, value); return value; },
    set: function (key, value) { if (values.has(key)) values.delete(key); values.set(key, value); while (values.size > limit) values.delete(values.keys().next().value); return value; },
    clear: function () { values.clear(); },
    size: function () { return values.size; }
  };
}
function initializeDashboardDataset(rows) {
  state.runtimeDiagnostics = { errors: [], warnings: [] };
  if (state.detailExplorer && state.detailExplorer.isOpen) closeDetailExplorer({ restoreFocus: false });
  else if (pageScrollLock.count) unlockPageScroll(true);
  state.modalNavigation.stack = [];
  cancelPendingDashboardRender();
  disposeCharts();
  if (detailSearchDebounced && detailSearchDebounced.cancel) detailSearchDebounced.cancel();
  state.datasetVersion += 1;
  state.filterCache.clear(); state.analysisCache.clear(); state.negotiationUsageCache.clear(); state.contributionModelCache.clear(); state.facetedOptionsCache.clear(); state.timelineCache.clear(); state.clientTrackingCache.clear(); state.clientTrackingDetailCache.clear(); state.chartSignatures.clear();
  state.clientTrackingRelationIndex = new Map(); state.clientTrackingRelationIndexSource = null;
  state.filters = {};
  state.scopeRows = []; state.filteredRows = []; state.analyses = null; state.search = "";
  state.negotiationUsageAnalysis = getEmptyNegotiationUsageAnalysis(); state.detailExplorer = getEmptyDetailExplorerState(); state.facetedOptions = null;
  state.clientTrackingTable = getEmptyClientTrackingTableState();
  state.chartLayoutSignature = ""; state.renderVersion += 1; state.pendingRenderFrame = null;
  state.performance = createPerformanceState();
  state.filterUi = { openComboboxId: null, queries: { activity: "", client: "" }, highlighted: { activity: -1, client: -1 } };
  state.activityAnalyticsCache = { key: "", value: null };
  state.indexes = measurePerformance("indexConstruction", function () { return buildDashboardIndexes(rows); });
  state.performance.counters.indexesBuilt += 1;
  window.__getDashboardPerformance = getDashboardPerformanceSnapshot;
  window.__getDashboardDiagnostics = getDashboardDiagnosticsSnapshot;
}
function buildDashboardIndexes(rows) {
  const rowsByField = new Map(), fields = FILTER_FIELDS.map(function (item) { return item.field; });
  const rowsByPeriod = new Map(), clientsByActivity = new Map(), activitiesByClient = new Map(), presentationsByActivity = new Map(), vigenciaByRow = new WeakMap();
  const clientMetadata = new Map(), enrichmentByClient = new Map(), enrichmentByRelation = new Map();
  const enrichmentFields = ["Cliente AS400 - Nombre negocio (Texto)", "Cliente AS400 - Texto", "Nit cliente - Clave", "Regi\u00f3n SAP", "Cedi", "Canal", "Tipolog\u00eda"];
  const collectEnrichment = function (map, key, row) {
    if (!key) return;
    if (!map.has(key)) map.set(key, new Map());
    const valuesByField = map.get(key);
    enrichmentFields.forEach(function (field) {
      const value = normalizeText(row[field]);
      if (!value) return;
      if (!valuesByField.has(field)) valuesByField.set(field, new Set());
      valuesByField.get(field).add(value);
    });
  };
  fields.forEach(function (field) { rowsByField.set(field, new Map()); });
  rows.forEach(function (row) {
    fields.forEach(function (field) {
      const value = field === "Estado de vigencia" ? getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) : normalizeText(row[field]);
      if (field === "Estado de vigencia") vigenciaByRow.set(row, value);
      if (!value) return;
      const byValue = rowsByField.get(field);
      if (!byValue.has(value)) byValue.set(value, new Set());
      byValue.get(value).add(row);
    });
    const period = getYearMonthSortValue(row), activityId = normalizeText(row["ID Actividad"]), clientId = normalizeText(row["Cliente SAP - Clave"]), presentationId = normalizeText(row["Presentación AS400 de la venta - Clave"]);
    collectEnrichment(enrichmentByClient, clientId, row);
    collectEnrichment(enrichmentByRelation, clientId && activityId ? clientId + "||" + activityId : "", row);
    if (period !== null) { if (!rowsByPeriod.has(period)) rowsByPeriod.set(period, []); rowsByPeriod.get(period).push(row); }
    if (activityId && clientId) {
      if (!clientsByActivity.has(activityId)) clientsByActivity.set(activityId, new Set()); clientsByActivity.get(activityId).add(clientId);
      if (!activitiesByClient.has(clientId)) activitiesByClient.set(clientId, new Set()); activitiesByClient.get(clientId).add(activityId);
      if (!clientMetadata.has(clientId)) clientMetadata.set(clientId, { name: "", businessName: "", nit: "", as400: "" });
      const client = clientMetadata.get(clientId);
      client.name = client.name || normalizeText(row["Cliente AS400 - Nombre negocio (Texto)"]);
      client.businessName = client.businessName || normalizeText(row["Cliente AS400 - Texto"]);
      client.nit = client.nit || normalizeText(row["Nit cliente - Clave"]);
      client.as400 = client.as400 || normalizeText(row["Cliente AS400 - Texto"]);
    }
    if (activityId && presentationId) { if (!presentationsByActivity.has(activityId)) presentationsByActivity.set(activityId, new Set()); presentationsByActivity.get(activityId).add(presentationId); }
  });
  const categoryLookup = buildCategoryLookup(rows);
  const activityCatalog = new Map(Array.from(rowsByField.get("ID Actividad").keys(), function (activityId) {
    const clientCount = (clientsByActivity.get(activityId) || new Set()).size;
    const description = clientCount > 1 ? "Compartida · " + clientCount + " clientes" : "Individual · 1 cliente";
    return [activityId, { value: activityId, label: activityId, description: description, searchText: normalizeSearchText(activityId + " " + description) }];
  }));
  const clientCatalog = new Map(Array.from(rowsByField.get("Cliente SAP - Clave").keys(), function (clientId) {
    const meta = clientMetadata.get(clientId) || {};
    const label = meta.name || meta.businessName || meta.as400 || clientId;
    const description = label === clientId ? "" : label;
    return [clientId, {
      value: clientId, label: clientId, description: description,
      searchText: normalizeSearchText([clientId, meta.name, meta.businessName, meta.nit, meta.as400].filter(Boolean).join(" "))
    }];
  }));
  return {
    rows: rows, rowsByField: rowsByField, rowsByActivity: rowsByField.get("ID Actividad"), rowsByClient: rowsByField.get("Cliente SAP - Clave"),
    rowsByPeriod: rowsByPeriod, clientsByActivity: clientsByActivity, activitiesByClient: activitiesByClient, presentationsByActivity: presentationsByActivity, vigenciaByRow: vigenciaByRow, categoryLookup: categoryLookup,
    catalogs: { activity: activityCatalog, client: clientCatalog }, clientMetadata: clientMetadata,
    enrichmentByClient: enrichmentByClient, enrichmentByRelation: enrichmentByRelation,
    stats: { fields: rowsByField.size, activities: clientsByActivity.size, clients: activitiesByClient.size, periods: rowsByPeriod.size, rowReferences: Array.from(rowsByField.values()).reduce(function (sum, map) { return sum + Array.from(map.values()).reduce(function (inner, set) { return inner + set.size; }, 0); }, 0) }
  };
}
function getFilterSignature(filters) {
  return JSON.stringify(Object.keys(filters || {}).sort().map(function (field) {
    const values = (Array.isArray(filters[field]) ? filters[field] : [filters[field]]).map(normalizeText).filter(Boolean).sort();
    return [field, values];
  }).filter(function (entry) { return entry[1].length; }));
}
function getFilteredRowsCached(baseRows, filters, namespace) {
  const key = state.datasetVersion + "|" + namespace + "|" + getFilterSignature(filters);
  const cached = state.filterCache.get(key);
  if (cached) return cached;
  return state.filterCache.set(key, measurePerformance("filterApplication", function () { return filterRowsUsingIndexes(baseRows, filters, state.indexes); }));
}
function getDashboardAnalysisCached(signature, build) {
  const cached = state.analysisCache.get(signature);
  if (cached) return cached;
  return state.analysisCache.set(signature, measurePerformance("analysisConstruction", function () {
    state.performance.counters.analysesExecuted += 1;
    return build();
  }));
}
function filterRowsUsingIndexes(baseRows, filters, indexes) {
  const candidateSets = [];
  Object.keys(filters || {}).forEach(function (field) {
    const selected = (Array.isArray(filters[field]) ? filters[field] : [filters[field]]).map(normalizeText).filter(Boolean);
    const byValue = indexes && indexes.rowsByField.get(field);
    if (!selected.length || !byValue) return;
    const union = new Set(); selected.forEach(function (value) { (byValue.get(value) || []).forEach(function (row) { union.add(row); }); });
    candidateSets.push(union);
  });
  candidateSets.sort(function (a, b) { return a.size - b.size; });
  let candidates = candidateSets.length ? Array.from(candidateSets[0]) : baseRows.slice();
  if (indexes && baseRows !== indexes.rows) { const allowed = new Set(baseRows); candidates = candidates.filter(function (row) { return allowed.has(row); }); }
  return applyFilters(candidates, filters);
}
function getNegotiationUsageAnalysisCached(signature, rows) {
  const cached = state.negotiationUsageCache.get(signature);
  if (cached) { state.performance.counters.negotiationUsageCacheHits += 1; return cached; }
  state.performance.counters.negotiationUsageModelsBuilt += 1;
  return state.negotiationUsageCache.set(signature, measurePerformance("negotiationUsageAnalysis", function () { return buildNegotiationUsageAnalysis(rows); }));
}
function scheduleDashboardRender(reason) {
  state.renderVersion += 1;
  const version = state.renderVersion;
  state.performance.counters.rendersScheduled += 1;
  if (state.pendingRenderFrame !== null) {
    if (window.cancelAnimationFrame) window.cancelAnimationFrame(state.pendingRenderFrame);
    else if (window.clearTimeout) window.clearTimeout(state.pendingRenderFrame);
    state.performance.counters.rendersCancelled += 1;
  }
  const callback = function () {
    if (version !== state.renderVersion) { state.performance.counters.rendersCancelled += 1; return; }
    state.pendingRenderFrame = null;
    safelyRenderComponent("dashboard-render", function () { renderAll(reason); }, renderDashboardFailureState);
  };
  if (window.requestAnimationFrame) state.pendingRenderFrame = window.requestAnimationFrame(callback);
  else { callback(); state.pendingRenderFrame = null; }
}
function cancelPendingDashboardRender() {
  if (state.pendingRenderFrame === null) return;
  if (window.cancelAnimationFrame) window.cancelAnimationFrame(state.pendingRenderFrame);
  else if (window.clearTimeout) window.clearTimeout(state.pendingRenderFrame);
  state.pendingRenderFrame = null;
}
function renderDashboardFailureState() {
  const summary = document.getElementById("chartEmptySummary");
  if (!summary) return;
  summary.hidden = false;
  summary.setAttribute("role", "alert");
  summary.textContent = "No se pudo actualizar el dashboard. Los datos no fueron reemplazados; intenta limpiar los filtros o recargar el archivo.";
}
function renderAll(reason) {
  const renderStartedAt = performanceNow();
  const scopeFilters = getScopeFilters(state.filters), scopeSignature = getFilterSignature(scopeFilters);
  state.scopeRows = getFilteredRowsCached(DASHBOARD_DATA, scopeFilters, "scope");
  state.filteredRows = applySearch(getFilteredRowsCached(state.scopeRows, getEntityFilters(state.filters), "entity:" + scopeSignature));
  const analysisSignature = getFilterSignature(state.filters) + "|search:" + normalizeText(state.search);
  const withoutSalesFilters = getNegotiationUsageCompatibleFilters(state.filters);
  const withoutSalesSignature = "without-sales|" + getFilterSignature(withoutSalesFilters) + "|search:" + normalizeText(state.search);
  const withoutSalesRows = applySearch(getFilteredRowsCached(DASHBOARD_DATA, withoutSalesFilters, "without-sales"));
  state.negotiationUsageAnalysis = getNegotiationUsageAnalysisCached(withoutSalesSignature, withoutSalesRows);
  const activityAnalytics = getCachedActivityAnalytics(state.scopeRows, state.filters);
  state.analyses = getDashboardAnalysisCached(analysisSignature, function () {
    return buildDashboardAnalyses(state.filteredRows, state.negotiationUsageAnalysis, { scopeRows: state.scopeRows, filters: state.filters, activityAnalytics: activityAnalytics, indexes: state.indexes });
  });
  state.facetedOptions = measurePerformance("facetedOptions", function () { return buildFacetedOptions(state.filters); });
  syncFilterControlsFromState({ refreshOptions: false });
  safelyRenderComponent("header", renderHeaderContext);
  safelyRenderComponent("context", function () { renderContextStrip(state.analyses); });
  safelyRenderComponent("data-health", renderDataHealth);
  safelyRenderComponent("active-filters", renderActiveFilters);
  measurePerformance("kpiRender", function () { safelyRenderComponent("kpis", function () { renderKpis(state.filteredRows, state.negotiationUsageAnalysis, state.analyses); }, renderKpiFailureState); });
  measurePerformance("clientTrackingRender", function () { safelyRenderComponent("client-tracking", renderClientTrackingTable, renderClientTrackingFailureState); });
  measurePerformance("chartRender", function () { safelyRenderComponent("charts", function () { renderAdaptiveCharts(state.analyses); }, renderChartFailureState); });
  safelyRenderComponent("detail-explorer", syncOpenDetailExplorer, renderDetailExplorerFailureState);
  safelyRenderComponent("icons", function () { refreshIcons(document.getElementById("dashboardApp")); });
  state.performance.counters.rendersCompleted += 1;
  const elapsed = performanceNow() - renderStartedAt;
  const totalStage = state.performance.stages.totalRender || { count: 0, totalMs: 0, maxMs: 0, lastMs: 0 };
  totalStage.count += 1; totalStage.totalMs += elapsed; totalStage.maxMs = Math.max(totalStage.maxMs, elapsed); totalStage.lastMs = elapsed; state.performance.stages.totalRender = totalStage;
  if (isPerformanceDebugEnabled()) console.debug("Dashboard performance", reason || "render", getDashboardPerformanceSnapshot());
}
function renderKpiFailureState() {
  const container = document.getElementById("kpis");
  if (container) container.innerHTML = '<article class="kpi-card kpi-neutral"><span class="kpi-label">Indicadores</span><strong class="kpi-value">No disponible</strong><p class="kpi-description">Ocurrió un error técnico al presentar los KPI. Los cálculos no fueron sustituidos.</p></article>';
}
function renderChartFailureState() {
  const container = document.getElementById("charts");
  if (container) container.innerHTML = '<article class="chart-card chart-wide chart-empty"><div><h2>Análisis no disponible</h2><p>Ocurrió un error técnico al presentar las visualizaciones.</p></div><div class="empty-state empty-state-error" role="alert"><strong>No se pudo mostrar el análisis</strong><span>Los datos no fueron reemplazados por valores estimados.</span></div></article>';
}
function renderDetailExplorerFailureState() {
  const body = document.getElementById("detailExplorerBody");
  if (body) body.innerHTML = '<div class="empty-state empty-state-error" role="alert"><strong>Detalle no disponible</strong><span>El explorador puede cerrarse con el botón o la tecla Escape.</span></div>';
}
function getEmptyClientTrackingTableState() {
  return { monthlyStatus: "ALL", totalStatus: "ALL", sortField: "selectedMonthlyStatus", sortDirection: "asc", page: 1, pageSize: 10, selectedRowKey: "", compactLayout: null };
}
function getClientTrackingTableState() {
  return state.clientTrackingTable;
}
function getClientTrackingRowKey(row) {
  return normalizeText(row && row.clientSap) + "||" + normalizeText(row && row.activityId);
}
function getClientTrackingPeriod() {
  const models = state.analyses || {};
  const periods = models.availablePeriods || [];
  const selectedKey = models.clientNegotiationModels && models.clientNegotiationModels.selectedStatusPeriod
    || (periods.length ? periods[periods.length - 1].key : null);
  return periods.find(function (period) { return period.key === selectedKey; }) || null;
}
function bindClientTrackingEvents() {
  const panel = document.getElementById("clientTracking");
  if (!panel || panel.dataset.eventsBound === "true") return;
  panel.dataset.eventsBound = "true";
  panel.addEventListener("change", function (event) {
    const target = event.target;
    if (!target) return;
    if (target.id === "clientTrackingMonthlyStatus") state.clientTrackingTable.monthlyStatus = target.value;
    else if (target.id === "clientTrackingTotalStatus") state.clientTrackingTable.totalStatus = target.value;
    else if (target.id === "clientTrackingSort") state.clientTrackingTable.sortField = target.value;
    else if (target.id === "clientTrackingPageSize") state.clientTrackingTable.pageSize = [10, 25, 50, 100].indexOf(Number(target.value)) !== -1 ? Number(target.value) : 10;
    else return;
    state.clientTrackingTable.page = 1;
    renderClientTrackingTable();
  });
  panel.addEventListener("click", function (event) {
    const target = event.target && event.target.closest ? event.target.closest("[data-tracking-action]") : null;
    if (!target) return;
    const action = target.dataset.trackingAction;
    if (action === "sort-direction") state.clientTrackingTable.sortDirection = state.clientTrackingTable.sortDirection === "asc" ? "desc" : "asc";
    else if (action === "page-prev") state.clientTrackingTable.page -= 1;
    else if (action === "page-next") state.clientTrackingTable.page += 1;
    else if (action === "clear-local") state.clientTrackingTable = Object.assign(getEmptyClientTrackingTableState(), { compactLayout: state.clientTrackingTable.compactLayout });
    else if (action === "export-summary") { exportClientTrackingSummaryCsv(); return; }
    else if (action === "open-detail") { openClientTrackingDetail(target.dataset.trackingRowKey, target); return; }
    else return;
    renderClientTrackingTable();
  });
}
function clientTrackingRelationMatchesFilters(row, filters) {
  const mappings = {
    "ID Actividad": [row.activityId],
    "Cliente SAP - Clave": [row.clientSap],
    "Región SAP": row.regions || [row.region],
    "Canal": row.channels || [row.channel],
    "Categoría AS400 de la venta": row.categories || [row.category],
    "Cedi": row.cedis || [row.cedi]
  };
  return Object.keys(mappings).every(function (field) {
    const selected = (filters && filters[field] || []).map(normalizeText).filter(Boolean);
    if (!selected.length) return true;
    const available = new Set((mappings[field] || []).map(normalizeText).filter(Boolean));
    return selected.some(function (value) { return available.has(value); });
  });
}
function getClientTrackingProjection() {
  const tableState = state.clientTrackingTable;
  const period = getClientTrackingPeriod();
  const key = [state.datasetVersion, getFilterSignature(state.filters), period ? period.key : "", tableState.monthlyStatus, tableState.totalStatus, tableState.sortField, tableState.sortDirection].join("|");
  const cached = state.clientTrackingCache.get(key);
  if (cached) {
    state.performance.counters.clientTrackingCacheHits += 1;
    return cached;
  }
  const source = state.analyses && Array.isArray(state.analyses.clientActivitySummary) ? state.analyses.clientActivitySummary : [];
  const globalRows = source.filter(function (row) { return clientTrackingRelationMatchesFilters(row, state.filters); });
  const rows = globalRows.filter(function (row) {
    if (tableState.monthlyStatus !== "ALL" && row.selectedMonthlyStatus !== tableState.monthlyStatus) return false;
    if (tableState.totalStatus !== "ALL" && row.totalObjectiveStatus !== tableState.totalStatus) return false;
    return true;
  }).slice();
  rows.sort(function (left, right) {
    const a = getClientTrackingSortValue(left, tableState.sortField, period);
    const b = getClientTrackingSortValue(right, tableState.sortField, period);
    const direction = tableState.sortDirection === "desc" ? -1 : 1;
    if (a < b) return -1 * direction;
    if (a > b) return direction;
    return getClientTrackingRowKey(left).localeCompare(getClientTrackingRowKey(right), "es");
  });
  state.performance.counters.clientTrackingProjectionsBuilt += 1;
  return state.clientTrackingCache.set(key, { rows: rows, globalCount: globalRows.length, sourceCount: source.length, period: period });
}
function getClientTrackingSortValue(row, field, period) {
  const periodKey = period && period.key;
  const values = {
    selectedMonthlyStatus: { CUMPLE_MES: 1, NO_CUMPLE_MES: 2, NO_EVALUABLE_MES: 3 }[row.selectedMonthlyStatus] || 9,
    totalObjectiveStatus: { CUMPLIO_OBJETIVO_TOTAL: 1, EN_PROGRESO_OBJETIVO_TOTAL: 2, NO_EVALUABLE_TOTAL: 3 }[row.totalObjectiveStatus] || 9,
    clientName: normalizeSearchText(row.clientName || row.clientSap), activityId: normalizeSearchText(row.activityId),
    monthlyObjective: row.monthlyObjective, monthlySales: getClientTrackingComparableSales(row, periodKey), selectedMonthlyCompliance: row.selectedMonthlyCompliance,
    accumulatedComparableSales: row.accumulatedComparableSales, totalObjective: row.totalObjective, totalProgress: row.totalProgress,
    investmentPercentage: row.investmentPercentage, region: normalizeSearchText(row.region), cedi: normalizeSearchText(row.cedi)
  };
  const value = values[field];
  return isFiniteNumber(value) ? value : typeof value === "string" ? value : -Number.MAX_VALUE;
}
function getClientTrackingComparableSales(row, periodKey) {
  if (!periodKey) return null;
  const source = row.comparableSalesByMonth || (row.isSharedActivity ? row.jointActivitySalesByMonth : row.salesByMonth);
  return source && isFiniteNumber(source[periodKey]) ? source[periodKey] : null;
}
function getClientTrackingComposition(row, periodKey) {
  return {
    negotiated: row.negotiatedPresentationSalesByMonth && row.negotiatedPresentationSalesByMonth[periodKey],
    nonNegotiated: row.nonNegotiatedPresentationSalesByMonth && row.nonNegotiatedPresentationSalesByMonth[periodKey],
    negotiatedShare: row.negotiatedSalesShareByMonth && row.negotiatedSalesShareByMonth[periodKey],
    nonNegotiatedShare: row.nonNegotiatedSalesShareByMonth && row.nonNegotiatedSalesShareByMonth[periodKey],
    status: row.compositionStatusByMonth && row.compositionStatusByMonth[periodKey] || "COMPOSICION_NO_DISPONIBLE"
  };
}
function buildClientTrackingCompositionMarkup(row, periodKey) {
  const composition = getClientTrackingComposition(row, periodKey);
  const warning = composition.status === "DESCUADRE_COMPOSICION_VENTA" ? "<small class=\\"tracking-composition-warning\\">Revisar descuadre de fuentes</small>" : "";
  return "<span class=\\"tracking-composition\\" title=\\"" + escapeHtml(UI_COPY.tooltips.salesMix) + "\\"><span>Negociadas: <strong>" + escapeHtml(formatAvailableMetric(composition.negotiated)) + "</strong> &middot; " + escapeHtml(formatAvailablePercent(composition.negotiatedShare)) + "</span><span>No negociadas: <strong>" + escapeHtml(formatAvailableMetric(composition.nonNegotiated)) + "</strong> &middot; " + escapeHtml(formatAvailablePercent(composition.nonNegotiatedShare)) + "</span>" + warning + "</span>";
}
function getClientTrackingMonthlyDiscountDisplay(row, periodKey) {
  if (!periodKey || !row) return "No disponible";
  const status = row.monthlyDiscountStatusByMonth && row.monthlyDiscountStatusByMonth[periodKey];
  if (status === "DESCUENTO_MENSUAL_CONFLICTIVO") return "Revisar";
  const value = row.monthlyDiscountByMonth && row.monthlyDiscountByMonth[periodKey];
  return isFiniteNumber(value) ? formatRatioPercent(value) : "No disponible";
}
function ensureClientTrackingRelationIndex(rows) {
  if (state.clientTrackingRelationIndexSource === rows) return state.clientTrackingRelationIndex;
  state.clientTrackingRelationIndex = new Map();
  (rows || []).forEach(function (row) { state.clientTrackingRelationIndex.set(getClientTrackingRowKey(row), row); });
  state.clientTrackingRelationIndexSource = rows;
  return state.clientTrackingRelationIndex;
}
function getClientTrackingDetailModel(row, periods) {
  if (!row) return null;
  const availablePeriods = periods || state.analyses && state.analyses.availablePeriods || [];
  const periodSignature = availablePeriods.map(function (period) { return period.key; }).join(",") + "|selected:" + (row.selectedStatusPeriod || "");
  const key = state.datasetVersion + "|" + getClientTrackingRowKey(row) + "|" + periodSignature;
  const cached = state.clientTrackingDetailCache.get(key);
  if (cached) {
    state.performance.counters.clientTrackingDetailCacheHits += 1;
    return cached;
  }
  const model = {
    key: getClientTrackingRowKey(row),
    row: row,
    periods: availablePeriods.map(function (period) {
      return {
        key: period.key, label: period.label,
        generalSales: row.salesByMonth && row.salesByMonth[period.key],
        negotiatedSales: row.negotiatedPresentationSalesByMonth && row.negotiatedPresentationSalesByMonth[period.key],
        nonNegotiatedSales: row.nonNegotiatedPresentationSalesByMonth && row.nonNegotiatedPresentationSalesByMonth[period.key],
        negotiatedShare: row.negotiatedSalesShareByMonth && row.negotiatedSalesShareByMonth[period.key],
        nonNegotiatedShare: row.nonNegotiatedSalesShareByMonth && row.nonNegotiatedSalesShareByMonth[period.key],
        compositionStatus: row.compositionStatusByMonth && row.compositionStatusByMonth[period.key],
        comparableSales: getClientTrackingComparableSales(row, period.key),
        jointNegotiatedSales: row.jointNegotiatedPresentationSalesByMonth && row.jointNegotiatedPresentationSalesByMonth[period.key],
        jointNonNegotiatedSales: row.jointNonNegotiatedPresentationSalesByMonth && row.jointNonNegotiatedPresentationSalesByMonth[period.key],
        difference: row.monthlyDifferenceByMonth && row.monthlyDifferenceByMonth[period.key],
        monthlyDiscount: row.monthlyDiscountByMonth && row.monthlyDiscountByMonth[period.key],
        monthlyDiscountStatus: row.monthlyDiscountStatusByMonth && row.monthlyDiscountStatusByMonth[period.key] || "SIN_DATO",
        compliance: row.monthlyComplianceByMonth && row.monthlyComplianceByMonth[period.key],
        status: row.monthlyStatusByMonth && row.monthlyStatusByMonth[period.key] || "NO_EVALUABLE_MES",
        evaluationReason: row.monthlyEvaluationReasonByMonth && row.monthlyEvaluationReasonByMonth[period.key] || ""
      };
    })
  };
  state.performance.counters.clientTrackingDetailModelsBuilt += 1;
  return state.clientTrackingDetailCache.set(key, model);
}
function renderClientTrackingTable() {
  const projection = getClientTrackingProjection();
  const tableState = state.clientTrackingTable;
  const controls = document.getElementById("clientTrackingControls");
  const body = document.getElementById("clientTrackingBody");
  const pagination = document.getElementById("clientTrackingPagination");
  const count = document.getElementById("clientTrackingCount");
  const periodBadge = document.getElementById("clientTrackingPeriod");
  if (!controls || !body || !pagination) return;
  ensureClientTrackingRelationIndex(state.analyses && state.analyses.clientActivitySummary || []);
  if (count) count.textContent = formatInteger(projection.rows.length) + " de " + formatInteger(projection.globalCount) + " relaciones";
  if (periodBadge) periodBadge.textContent = projection.period ? UI_COPY.tables.tracking[0] + " · " + projection.period.label : UI_COPY.emptyStates.unavailable;
  controls.innerHTML = buildClientTrackingControlsMarkup();
  const pageCount = Math.max(1, Math.ceil(projection.rows.length / tableState.pageSize));
  tableState.page = Math.max(1, Math.min(pageCount, tableState.page));
  const start = (tableState.page - 1) * tableState.pageSize;
  const visibleRows = projection.rows.slice(start, start + tableState.pageSize);
  const compact = Boolean(window.matchMedia && window.matchMedia("(max-width: 820px)").matches);
  tableState.compactLayout = compact;
  if (!projection.rows.length) body.innerHTML = buildClientTrackingEmptyState(projection);
  else body.innerHTML = compact ? buildClientTrackingCards(visibleRows, projection.period) : buildClientTrackingDesktopTable(visibleRows, projection.period);
  pagination.innerHTML = buildClientTrackingPagination(projection.rows.length, start, visibleRows.length, pageCount);
  state.performance.counters.clientTrackingRowsRendered += visibleRows.length;
  refreshIcons(document.getElementById("clientTracking"));
}
function buildClientTrackingControlsMarkup() {
  const value = state.clientTrackingTable;
  const monthly = [["ALL", "Todos"], ["CUMPLE_MES", "Cumple mes"], ["NO_CUMPLE_MES", "No cumple mes"], ["NO_EVALUABLE_MES", "No evaluable"]];
  const totals = [["ALL", "Todos"], ["CUMPLIO_OBJETIVO_TOTAL", "Objetivo total cumplido"], ["EN_PROGRESO_OBJETIVO_TOTAL", "En progreso"], ["NO_EVALUABLE_TOTAL", "No evaluable"]];
  const sorts = [["selectedMonthlyStatus", "Estado mensual"], ["totalObjectiveStatus", "Estado total"], ["clientName", "Cliente"], ["activityId", "Actividad"], ["monthlyObjective", "Objetivo mensual"], ["monthlySales", "Venta del mes"], ["selectedMonthlyCompliance", "Cumplimiento mensual"], ["accumulatedComparableSales", "Ventas acumuladas"], ["totalObjective", "Objetivo total"], ["totalProgress", "Avance total"], ["investmentPercentage", "% inversión"], ["region", "Región"], ["cedi", "CEDI"]];
  const optionMarkup = function (options, selected) { return options.map(function (item) { return "<option value=\\"" + item[0] + "\\"" + (item[0] === selected ? " selected" : "") + ">" + escapeHtml(item[1]) + "</option>"; }).join(""); };
  return "<label>Estado mensual<select id=\\"clientTrackingMonthlyStatus\\">" + optionMarkup(monthly, value.monthlyStatus) + "</select></label>" +
    "<label>Estado objetivo total<select id=\\"clientTrackingTotalStatus\\">" + optionMarkup(totals, value.totalStatus) + "</select></label>" +
    "<label class=\\"tracking-sort\\">Ordenar por<select id=\\"clientTrackingSort\\">" + optionMarkup(sorts, value.sortField) + "</select></label>" +
    "<label class=\\"tracking-page-size\\">Filas<select id=\\"clientTrackingPageSize\\">" + [10, 25, 50, 100].map(function (size) { return "<option value=\\"" + size + "\\"" + (size === value.pageSize ? " selected" : "") + ">" + size + "</option>"; }).join("") + "</select></label>" +
    "<div class=\\"client-tracking-actions\\"><button class=\\"button button-ghost\\" type=\\"button\\" data-tracking-action=\\"sort-direction\\"><i data-lucide=\\"" + (value.sortDirection === "asc" ? "arrow-up" : "arrow-down") + "\\"></i> " + (value.sortDirection === "asc" ? "Ascendente" : "Descendente") + "</button><button class=\\"button button-primary\\" type=\\"button\\" data-tracking-action=\\"export-summary\\"><i data-lucide=\\"download\\"></i> " + UI_COPY.actions.downloadCsv + "</button></div>";
}
function buildClientTrackingDesktopTable(rows, period) {
  const headers = UI_COPY.tables.tracking;
  return "<div class=\\"client-tracking-table-wrap\\"><table class=\\"client-tracking-table\\"><thead><tr>" + headers.map(function (label) { return "<th scope=\\"col\\">" + escapeHtml(label) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (row) {
    const key = getClientTrackingRowKey(row);
    return "<tr><td>" + clientTrackingMonthlyBadge(row.selectedMonthlyStatus, row.selectedMonthlyEvaluationReason) + "</td><td>" + clientTrackingTotalBadge(row.totalObjectiveStatus, row.totalEvaluationReason) + "</td><td><span class=\\"tracking-client\\"><strong>" + escapeHtml(row.clientName || row.clientSap) + "</strong><small>" + escapeHtml(row.clientSap) + (row.clientNit ? " · " + escapeHtml(row.clientNit) : "") + "</small></span></td><td class=\\"tracking-code\\"><strong>" + escapeHtml(row.activityId) + "</strong></td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(row.monthlyObjective)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(getClientTrackingComparableSales(row, period && period.key))) + "</td><td>" + buildClientTrackingCompositionMarkup(row, period && period.key) + "</td><td class=\\"numeric\\">" + escapeHtml(getClientTrackingMonthlyDiscountDisplay(row, period && period.key)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailablePercent(row.selectedMonthlyCompliance)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailablePercent(row.totalProgress)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailablePercent(row.investmentPercentage)) + "</td><td class=\\"tracking-action\\"><button class=\\"button button-ghost\\" type=\\"button\\" data-tracking-action=\\"open-detail\\" data-tracking-row-key=\\"" + escapeHtml(key) + "\\">" + UI_COPY.actions.detail + "</button></td></tr>";
  }).join("") + "</tbody></table></div>";
}
function buildClientTrackingCards(rows, period) {
  return "<div class=\\"client-tracking-cards\\">" + rows.map(function (row) {
    const key = getClientTrackingRowKey(row);
    return "<article class=\\"client-tracking-card\\"><div class=\\"client-tracking-card-head\\"><div><strong>" + escapeHtml(row.clientName || row.clientSap) + "</strong><span>" + escapeHtml(row.clientSap + " · Negociación " + row.activityId) + "</span></div><span class=\\"badge badge-muted\\">" + escapeHtml(row.negotiationType === "COMPARTIDA" ? "Compartida" : "Individual") + "</span></div><div class=\\"client-tracking-card-statuses\\">" + clientTrackingMonthlyBadge(row.selectedMonthlyStatus, row.selectedMonthlyEvaluationReason) + clientTrackingTotalBadge(row.totalObjectiveStatus, row.totalEvaluationReason) + "</div><div class=\\"client-tracking-card-metrics\\"><span><small>Venta del mes " + escapeHtml(period ? period.label : "") + "</small><strong>" + escapeHtml(formatAvailableMetric(getClientTrackingComparableSales(row, period && period.key))) + "</strong></span><span><small>Objetivo mensual</small><strong>" + escapeHtml(formatAvailableMetric(row.monthlyObjective)) + "</strong></span><span><small>Dcto. mes</small><strong>" + escapeHtml(getClientTrackingMonthlyDiscountDisplay(row, period && period.key)) + "</strong></span><span><small>Cumplimiento</small><strong>" + escapeHtml(formatAvailablePercent(row.selectedMonthlyCompliance)) + "</strong></span><span><small>Avance total</small><strong>" + escapeHtml(formatAvailablePercent(row.totalProgress)) + "</strong></span></div><div class=\\"client-tracking-card-composition\\"><small>Mix de venta</small>" + buildClientTrackingCompositionMarkup(row, period && period.key) + "</div><div class=\\"client-tracking-card-actions\\"><small>" + escapeHtml([row.region, row.cedi].filter(Boolean).join(" · ") || UI_COPY.emptyStates.unavailable) + "</small><button class=\\"button button-primary\\" type=\\"button\\" data-tracking-action=\\"open-detail\\" data-tracking-row-key=\\"" + escapeHtml(key) + "\\">" + UI_COPY.actions.detail + "</button></div></article>";
  }).join("") + "</div>";
}
function buildClientTrackingPagination(total, start, visibleCount, pageCount) {
  const from = total ? start + 1 : 0, to = start + visibleCount;
  return "<span>Mostrando " + formatInteger(from) + "–" + formatInteger(to) + " de " + formatInteger(total) + " relaciones cliente–negociación</span><div class=\\"client-tracking-pagination-actions\\"><button class=\\"button button-ghost\\" type=\\"button\\" data-tracking-action=\\"page-prev\\"" + (state.clientTrackingTable.page <= 1 ? " disabled" : "") + "><i data-lucide=\\"chevron-left\\"></i> Anterior</button><span class=\\"badge badge-muted\\">Página " + formatInteger(state.clientTrackingTable.page) + " de " + formatInteger(pageCount) + "</span><button class=\\"button button-ghost\\" type=\\"button\\" data-tracking-action=\\"page-next\\"" + (state.clientTrackingTable.page >= pageCount ? " disabled" : "") + ">Siguiente <i data-lucide=\\"chevron-right\\"></i></button></div>";
}
function buildClientTrackingEmptyState(projection) {
  let title = UI_COPY.emptyStates.filters;
  if (state.clientTrackingTable.monthlyStatus === "CUMPLE_MES") title = "No hay clientes con cumplimiento en el período seleccionado.";
  else if (projection.globalCount && (state.clientTrackingTable.monthlyStatus !== "ALL" || state.clientTrackingTable.totalStatus !== "ALL")) title = "No hay resultados para los estados seleccionados.";
  return "<div class=\\"empty-state empty-state-info\\" role=\\"status\\"><i data-lucide=\\"info\\"></i><strong>" + escapeHtml(title) + "</strong><button class=\\"button button-ghost\\" type=\\"button\\" data-tracking-action=\\"clear-local\\">Limpiar filtros de la tabla</button></div>";
}
function formatEvaluationReason(reason) {
  const messages = {
    FECHAS_CONFLICTIVAS: "Las fechas de la negociación son conflictivas.",
    ACTIVIDAD_AUN_NO_INICIADA: "La negociación aún no ha iniciado.",
    ACTIVIDAD_FINALIZADA: "El período está después del fin de la negociación.",
    FUERA_DE_VIGENCIA: "El período está fuera de la vigencia de la negociación.",
    OBJETIVO_CONFLICTIVO: "Hay conflicto entre los objetivos mensuales informados.",
    OBJETIVO_TOTAL_CONFLICTIVO: "Hay conflicto entre los objetivos totales informados.",
    SIN_OBJETIVO_MENSUAL_VALIDO: "No hay un objetivo mensual válido.",
    SIN_OBJETIVO_TOTAL_VALIDO: "No hay un objetivo total válido.",
    REQUIERE_DISTRIBUCION_MULTIACTIVIDAD: "La venta requiere distribución entre varias negociaciones activas.",
    VENTA_CONFLICTIVA: "La fuente contiene valores de venta conflictivos.",
    VENTA_ACTIVIDAD_AMBIGUA: "La venta atribuible a la negociación es ambigua.",
    SIN_VENTAS: "No hay información de venta confiable para evaluar.",
    SIN_VENTA_ATRIBUIBLE: "No hay venta atribuible confiable dentro de la vigencia.",
    ATRIBUCION_NO_CONFIABLE: "La atribución de ventas no es confiable.",
    SIN_PERIODOS_COMPARABLES: "No existen períodos vigentes y comparables.",
    PERIODOS_NO_EVALUABLES: "Existen períodos vigentes que no pueden evaluarse.",
    SIN_PERIODO_SELECCIONADO: "No hay un período disponible para evaluar."
  };
  return messages[reason] || (reason ? formatClientTrackingWarning(reason) : "");
}
function buildTrackingStatusMarkup(badge, status, nonEvaluableStatus, reason) {
  if (status !== nonEvaluableStatus) return badge;
  const message = formatEvaluationReason(reason);
  return message ? "<span class=\\"tracking-status-cell\\">" + badge + "<small class=\\"tracking-status-reason\\">" + escapeHtml(message) + "</small></span>" : badge;
}
function clientTrackingMonthlyBadge(status, reason) {
  const map = { CUMPLE_MES: [UI_COPY.statuses.monthly.CUMPLE_MES, "is-positive", "check-circle-2"], NO_CUMPLE_MES: [UI_COPY.statuses.monthly.NO_CUMPLE_MES, "is-negative", "x-circle"], NO_EVALUABLE_MES: [UI_COPY.statuses.monthly.NO_EVALUABLE_MES, "is-neutral", "circle-help"] };
  const item = map[status] || map.NO_EVALUABLE_MES;
  const badge = "<span class=\\"tracking-status " + item[1] + "\\"><i data-lucide=\\"" + item[2] + "\\"></i>" + item[0] + "</span>";
  return buildTrackingStatusMarkup(badge, status, "NO_EVALUABLE_MES", reason);
}
function clientTrackingTotalBadge(status, reason) {
  const map = { CUMPLIO_OBJETIVO_TOTAL: [UI_COPY.statuses.total.CUMPLIO_OBJETIVO_TOTAL, "is-positive", "badge-check"], EN_PROGRESO_OBJETIVO_TOTAL: [UI_COPY.statuses.total.EN_PROGRESO_OBJETIVO_TOTAL, "is-progress", "clock-3"], NO_EVALUABLE_TOTAL: [UI_COPY.statuses.total.NO_EVALUABLE_TOTAL, "is-neutral", "circle-help"] };
  const item = map[status] || map.NO_EVALUABLE_TOTAL;
  const badge = "<span class=\\"tracking-status " + item[1] + "\\"><i data-lucide=\\"" + item[2] + "\\"></i>" + item[0] + "</span>";
  return buildTrackingStatusMarkup(badge, status, "NO_EVALUABLE_TOTAL", reason);
}
function renderClientTrackingFailureState() {
  const body = document.getElementById("clientTrackingBody");
  if (body) body.innerHTML = '<div class="empty-state empty-state-error" role="alert"><strong>' + escapeHtml(UI_COPY.emptyStates.visualization) + '</strong></div>';
}
function getCachedActivityAnalytics(scopeRows, filters) {
  const scopeFilters = getScopeFilters(filters);
  const key = getFilterSignature(scopeFilters);
  if (state.activityAnalyticsCache.key === key && state.activityAnalyticsCache.value) return state.activityAnalyticsCache.value;
  const value = buildActivityAnalytics(scopeRows);
  state.activityAnalyticsCache = { key: key, value: value };
  return value;
}
function getScopeFilters(filters) {
  const result = {};
  Object.keys(filters || {}).forEach(function (field) {
    if (field !== "ID Actividad" && field !== "Cliente SAP - Clave") result[field] = filters[field];
  });
  return result;
}
function getEntityFilters(filters) {
  const result = {};
  ["ID Actividad", "Cliente SAP - Clave"].forEach(function (field) {
    if (filters && filters[field]) result[field] = filters[field];
  });
  return result;
}
function getSelectedFilterValues(filters, field) {
  const value = filters && filters[field];
  return (Array.isArray(value) ? value : [value]).map(normalizeText).filter(Boolean);
}
function renderDataHealth() {
  const badge = document.getElementById("healthBadge");
  if (!badge) return;
  const quality = DASHBOARD_META && DASHBOARD_META.qualityWarnings ? DASHBOARD_META.qualityWarnings : null;
  const issueCount = quality
    ? numberForCalc(quality.invalidDateRows) + numberForCalc(quality.unparseableMonthRows) + numberForCalc(quality.totalSalesConflicts) + numberForCalc(quality.monthlyObjectiveConflicts) + numberForCalc(quality.totalObjectiveConflicts) + numberForCalc(quality.conflictingActivityDates) + numberForCalc(quality.ambiguousActivityPeriods) + numberForCalc(quality.exactDuplicateRows)
    : 0;
  badge.className = "badge " + (issueCount ? "badge-warn" : "badge-success");
  badge.innerHTML = issueCount
    ? '<i data-lucide="triangle-alert"></i> ' + formatInteger(issueCount) + " incidencia(s) de calidad"
    : '<i data-lucide="check-circle-2"></i> Datos consistentes';
  badge.title = "Los registros sin información de venta no se consideran datos corruptos.";
}
function renderActiveFilters() {
  const normalized = normalizeFilters(state.filters);
  const active = Object.keys(normalized);
  const element = document.getElementById("activeFilters");
  if (!element) return;
  element.innerHTML = active.length ? active.map(function (field) {
    const values = normalized[field];
    const label = getFilterDisplayLabel(field, values.length > 1);
    const valueText = values.length === 1 ? values[0] : formatInteger(values.length);
    return "<button class=\\"filter-chip\\" type=\\"button\\" data-filter-chip-field=\\"" + escapeHtml(field) + "\\" aria-label=\\"Quitar filtro " + escapeHtml(label) + "\\"><span>" + escapeHtml(label) + ": " + escapeHtml(valueText) + "</span><span class=\\"filter-chip-remove\\" aria-hidden=\\"true\\">×</span></button>";
  }).join("") : "<span class=\\"badge badge-muted\\">Sin filtros activos</span>";
}
function getFilterDisplayLabel(field, plural) {
  if (field === "ID Actividad") return plural ? "Actividades" : "Actividad";
  if (field === "Cliente SAP - Clave") return plural ? "Clientes" : "Cliente";
  const config = FILTER_FIELDS.find(function (item) { return item.field === field; });
  return config ? config.label : field;
}
function applyChartFilter(field, value) {
  const normalizedValue = normalizeText(value);
  if (!field || !normalizedValue) return;
  const current = state.filters[field] || [];
  const supportsMultiple = field === "ID Actividad" || field === "Cliente SAP - Clave";
  const next = supportsMultiple
    ? current.indexOf(normalizedValue) === -1 ? current.concat(normalizedValue) : current.filter(function (item) { return item !== normalizedValue; })
    : current.length === 1 && current[0] === normalizedValue ? [] : [normalizedValue];
  updateDashboardFilters({ [field]: next }, { reason: "chart-filter" });
}
function computeKpis(rows, negotiationUsageAnalysis, options) {
  options = options || {};
  const scopeRows = options.scopeRows || rows;
  const filters = options.filters || {};
  const latestMonthRows = getLatestYearMonthRows(rows);
  const salesPeriodResolution = resolveMetricGroups(rows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true });
  const salesMonthResolution = resolveMetricGroups(latestMonthRows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true });
  const salesPeriod = sumResolvedMetricGroups(salesPeriodResolution);
  const salesMonth = sumResolvedMetricGroups(salesMonthResolution);
  const activityAnalytics = options.activityAnalytics || buildActivityAnalytics(scopeRows);
  const latestScopeRows = getLatestYearMonthRows(scopeRows);
  const latestPeriod = latestScopeRows.length ? getYearMonthSortValue(latestScopeRows[0]) : null;
  const selectedActivityIds = getSelectedFilterValues(filters, "ID Actividad");
  const selectedClientIds = getSelectedFilterValues(filters, "Cliente SAP - Clave");
  let relevantPerformance = activityAnalytics.activityPerformance.filter(function (item) { return item.period === latestPeriod; });
  if (selectedActivityIds.length) relevantPerformance = relevantPerformance.filter(function (item) { return selectedActivityIds.indexOf(item.activityId) !== -1; });
  else if (selectedClientIds.length) relevantPerformance = relevantPerformance.filter(function (item) {
    return item.associatedClientIds.some(function (clientId) { return selectedClientIds.indexOf(clientId) !== -1; });
  });
  const activityAggregate = aggregateActivityPerformance(relevantPerformance);
  const clientAggregateEligible = selectedClientIds.length === 1 && relevantPerformance.length > 1
    && relevantPerformance.every(function (item) {
      return item.objectiveStatus === "OK" && item.dateStatus === "OK"
        && (item.status === "OK" || item.status === "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD");
    });
  const clientAggregateObjective = clientAggregateEligible
    ? relevantPerformance.reduce(function (sum, item) { return sum + item.objectiveMonthly; }, 0)
    : null;
  const clientAggregateSales = clientAggregateEligible && isFiniteNumber(salesMonth) ? salesMonth : null;
  const clientAggregate = {
    sales: clientAggregateSales,
    objective: clientAggregateObjective,
    achievement: isFiniteNumber(clientAggregateSales) && clientAggregateObjective > 0 ? clientAggregateSales / clientAggregateObjective : null,
    gap: isFiniteNumber(clientAggregateSales) && clientAggregateObjective > 0 ? clientAggregateSales - clientAggregateObjective : null
  };
  const performanceConsistency = reconcileComparablePerformance({
    comparableSales: activityAggregate.sales,
    comparableObjective: activityAggregate.objective,
    compliance: activityAggregate.achievement,
    objectiveDifference: activityAggregate.gap
  });
  const selectedActivity = relevantPerformance.length === 1 ? relevantPerformance[0] : null;
  const selectedObjective = selectedActivityIds.length === 1
    ? activityAnalytics.objectivesByActivity.find(function (item) { return item.activityId === selectedActivityIds[0]; }) || null
    : null;
  const selectedContractClientIds = selectedObjective
    ? Array.from(activityAnalytics.activityClientRelations.activityClients.get(selectedObjective.activityId) || [])
    : [];
  const selectedActivityContract = selectedObjective ? {
    activityId: selectedObjective.activityId,
    period: latestPeriod,
    isSharedActivity: selectedContractClientIds.length > 1,
    associatedClientCount: selectedContractClientIds.length,
    associatedClientIds: selectedContractClientIds,
    objectiveMonthly: selectedObjective.objectiveMonthly,
    objectiveStatus: selectedObjective.objectiveStatus,
    objectiveTotal: selectedObjective.objectiveTotal,
    totalSales: null,
    attributedSales: null,
    achievement: null,
    gap: null,
    comparable: false,
    status: getActivityContractStatus(selectedObjective, latestPeriod),
    ambiguityReasons: [],
    contributionRows: [],
    dateStatus: selectedObjective.dateStatus,
    startDate: selectedObjective.startDate,
    endDate: selectedObjective.endDate
  } : null;
  const selectedContributions = relevantPerformance.reduce(function (all, item) {
    return all.concat(item.contributionRows.filter(function (row) { return selectedClientIds.indexOf(row.clientId) !== -1; }).map(function (row) {
      return Object.assign({ activityId: item.activityId, period: item.period, activityTotalSales: item.totalSales, activityComparable: item.comparable }, row);
    }));
  }, []);
  const contributionSalesValid = selectedContributions.length && selectedContributions.every(function (item) { return isFiniteNumber(item.sales); });
  const selectedContributionSales = contributionSalesValid ? selectedContributions.reduce(function (sum, item) { return sum + item.sales; }, 0) : null;
  const comparableSelectedContributions = selectedContributions.filter(function (item) { return item.activityComparable && isFiniteNumber(item.sales); });
  const selectedComparableContributionSales = comparableSelectedContributions.length
    ? comparableSelectedContributions.reduce(function (sum, item) { return sum + item.sales; }, 0)
    : null;
  const relevantJointSales = relevantPerformance.every(function (item) { return isFiniteNumber(item.totalSales); })
    ? relevantPerformance.reduce(function (sum, item) { return sum + item.totalSales; }, 0)
    : null;
  const selectionContribution = isFiniteNumber(selectedContributionSales) && isFiniteNumber(relevantJointSales) && relevantJointSales > 0
    ? selectedContributionSales / relevantJointSales : null;
  let mode = "GLOBAL";
  if (selectedClientIds.length && (relevantPerformance.length === 1 || selectedActivityIds.length === 1)) mode = "CLIENT_ACTIVITY";
  else if (selectedClientIds.length) mode = "CLIENT_AGGREGATE";
  else if (selectedActivityIds.length === 1) mode = "ACTIVITY";
  else if (selectedActivityIds.length > 1) mode = "ACTIVITY_AGGREGATE";
  const usageAnalysis = negotiationUsageAnalysis && Object.prototype.hasOwnProperty.call(negotiationUsageAnalysis, "totalUniqueClients") ? negotiationUsageAnalysis : buildNegotiationUsageAnalysis(rows);
  const negotiatedActivityIds = selectedActivityIds.length
    ? selectedActivityIds
    : relevantPerformance.map(function (item) { return item.activityId; });
  return {
    mode: mode,
    salesPeriod: salesPeriod,
    salesMonth: salesMonth,
    objective: activityAggregate.eligibleCount ? activityAggregate.objectiveAll : null,
    comparableSales: activityAggregate.sales,
    comparableObjective: activityAggregate.objective,
    compliance: activityAggregate.achievement,
    complianceStatus: activityAggregate.objective > 0 ? "OK" : relevantPerformance.some(function (item) { return item.objectiveMonthly === 0; }) ? "OBJETIVO_CERO" : "OBJETIVO_AUSENTE",
    objectiveDifference: activityAggregate.gap,
    uniqueClients: countUnique(rows, "Cliente SAP - Clave"),
    uniquePresentations: countUnique(rows, "Presentación AS400 de la venta - Clave"),
    uniqueActivities: countUnique(rows, "ID Actividad"),
    activeNegotiations: countUniqueBy(rows.filter(function (row) { return getIndexedVigenciaStatus(row) === "Vigente"; }), getActivityKey),
    clientsWithoutMonthlySales: usageAnalysis.totalUniqueClients,
    affectedActivities: usageAnalysis.activityCount || null,
    affectedClients: usageAnalysis.clientCount || null,
    presentationsWithoutSales: negotiationUsageAnalysis && isFiniteNumber(negotiationUsageAnalysis.presentationCount) ? negotiationUsageAnalysis.presentationCount : getNoSalesAnalysis(rows).presentationCount,
    salesResolution: salesPeriodResolution,
    activityAnalytics: activityAnalytics,
    activityPerformance: relevantPerformance,
    activityAggregate: activityAggregate,
    clientAggregate: clientAggregate,
    performanceConsistency: performanceConsistency,
    selectedActivity: selectedActivity,
    selectedActivityContract: selectedActivityContract,
    selectedActivityIds: selectedActivityIds,
    selectedClientIds: selectedClientIds,
    selectedContributions: selectedContributions,
    selectedContributionSales: selectedContributionSales,
    selectedComparableContributionSales: selectedComparableContributionSales,
    selectionContribution: selectionContribution,
    relevantJointSales: relevantJointSales,
    associatedClientCount: new Set(relevantPerformance.reduce(function (ids, item) { return ids.concat(item.associatedClientIds); }, [])).size,
    negotiatedPresentations: countUniqueBy(scopeRows.filter(function (row) {
      return !negotiatedActivityIds.length || negotiatedActivityIds.indexOf(normalizeText(row["ID Actividad"])) !== -1;
    }).filter(hasNegotiatedPresentationReference), getNegotiatedPresentationKey)
  };
}
function getActivityContractStatus(objective, period) {
  if (!objective) return "SIN_ACTIVIDAD_COMPARABLE_EN_PERIODO";
  if (objective.dateStatus !== "OK") return "FECHAS_CONFLICTIVAS";
  const start = dateOnly(objective.startDate);
  if (!start || period === null) return "SIN_ACTIVIDAD_COMPARABLE_EN_PERIODO";
  const year = Math.floor(period / 100), month = period % 100;
  if (start > new Date(year, month, 0)) return "ACTIVIDAD_AUN_NO_INICIADA";
  return "SIN_ACTIVIDAD_COMPARABLE_EN_PERIODO";
}
function renderKpis(rows, negotiationUsageAnalysis, analyses) {
  const sourceAnalysis = analyses && analyses.kpis ? analyses : { kpis: computeKpis(rows, negotiationUsageAnalysis), filters: {} };
  const model = buildContextualKpiModel(sourceAnalysis, sourceAnalysis.filters || {});
  const container = document.getElementById("kpis");
  if (!container) return;
  const gridLayout = getKpiGridLayoutMetadata(model.items.length);
  container.dataset.count = String(gridLayout.count);
  container.dataset.tail = String(gridLayout.tail);
  container.dataset.odd = String(gridLayout.odd);
  container.innerHTML = model.items.map(function (item) {
    const secondary = (item.className || "").indexOf("kpi-secondary") !== -1;
    const className = "kpi-card " + (secondary ? "" : "kpi-primary ") + (item.className || "");
    const status = item.status ? "<span class=\\"kpi-status\\">" + escapeHtml(item.status) + "</span>" : "";
    const icon = resolveKpiIcon(item.icon);
    const actionAttrs = (item.action ? " data-kpi-action=\\\"" + escapeHtml(item.action) + "\\\" role=\\\"button\\\" tabindex=\\\"0\\\" aria-label=\\\"" + escapeHtml(item.actionLabel || item.title) + "\\\"" : "") + (item.tooltip ? " title=\\\"" + escapeHtml(item.tooltip) + "\\\"" : "");
    return "<article class=\\"" + className + "\\" data-kpi-id=\\"" + escapeHtml(item.id) + "\\"" + actionAttrs + "><div class=\\"kpi-top\\"><span class=\\"kpi-icon\\"><i data-kpi-icon=\\"" + icon + "\\"></i><span class=\\"kpi-icon-fallback\\" aria-hidden=\\"true\\">•</span></span><span class=\\"badge badge-muted\\">" + escapeHtml(model.filterBadge) + "</span></div><span class=\\"kpi-label\\">" + escapeHtml(item.title) + "</span><strong class=\\"kpi-value\\">" + escapeHtml(item.value) + "</strong>" + status + "<p class=\\"kpi-description\\">" + escapeHtml(item.description) + "</p></article>";
  }).join("");
  refreshIcons(container, "data-kpi-icon");
}
function getKpiGridLayoutMetadata(count) {
  const normalized = Math.max(0, Number(count) || 0);
  return { count: normalized, tail: normalized % 4, odd: normalized % 2 === 1 };
}
const KPI_ICON_FALLBACK = "circle-dot";
const VALID_KPI_ICONS = new Set(["shopping-bag", "package-check", "target", "pie-chart", "gauge", "trending-up", "trending-down", "minus", "users", "user-x", "boxes", "list-ordered", "circle-check", "calendar-check", "clipboard-list", "badge-check", "package-x", "calendar-days", "circle-help", "circle-dot"]);
function resolveKpiIcon(iconName) {
  return VALID_KPI_ICONS.has(iconName) ? iconName : KPI_ICON_FALLBACK;
}
function buildContextualKpiModel(analysis, filters) {
  const context = resolveKpiContext(analysis, filters);
  let items;
  if (context.type === "SINGLE_SHARED_ACTIVITY") items = buildSharedActivityKpis(context);
  else if (context.type === "SINGLE_INDIVIDUAL_ACTIVITY") items = buildIndividualActivityKpis(context);
  else if (context.type === "SINGLE_CLIENT_SHARED_ACTIVITY") items = buildSharedActivityClientKpis(context);
  else if (context.type === "SINGLE_CLIENT_INDIVIDUAL_ACTIVITY") items = buildIndividualActivityClientKpis(context);
  else if (context.type === "CLIENT_MULTIPLE_ACTIVITIES") items = buildMultipleActivitiesClientKpis(context);
  else if (context.type === "MULTIPLE_ACTIVITIES") items = buildMultipleActivitiesKpis(context);
  else items = buildExecutiveKpis(context);
  return {
    contextType: context.type,
    context: context,
    filterBadge: hasActiveFilters(filters) ? "Filtros activos" : "Vista general",
    items: items.filter(function (item) { return !item.shouldRender || item.shouldRender(context); }).map(function (item) {
      return Object.assign({}, item, { icon: resolveKpiIcon(item.icon) });
    })
  };
}
function resolveKpiContext(analysis, filters) {
  const k = analysis.kpis;
  const activity = k.selectedActivity || k.selectedActivityContract;
  const activityCount = k.activityPerformance.length;
  const hasClientSelection = k.selectedClientIds.length > 0;
  const hasSingleActivity = Boolean(activity && (k.selectedActivityIds.length === 1 || (hasClientSelection && activityCount === 1)));
  let type = "GLOBAL";
  if (hasClientSelection && hasSingleActivity) type = activity.isSharedActivity ? "SINGLE_CLIENT_SHARED_ACTIVITY" : "SINGLE_CLIENT_INDIVIDUAL_ACTIVITY";
  else if (hasClientSelection && activityCount > 1) type = "CLIENT_MULTIPLE_ACTIVITIES";
  else if (!hasClientSelection && hasSingleActivity) type = activity.isSharedActivity ? "SINGLE_SHARED_ACTIVITY" : "SINGLE_INDIVIDUAL_ACTIVITY";
  else if (k.selectedActivityIds.length > 1) type = "MULTIPLE_ACTIVITIES";
  return {
    type: type,
    kpis: k,
    filters: filters || {},
    activity: activity,
    isContractOnly: Boolean(activity && !k.selectedActivity),
    isActivityNotStarted: Boolean(activity && activity.status === "ACTIVIDAD_AUN_NO_INICIADA"),
    selectedContribution: k.selectedContributions.length === 1 ? k.selectedContributions[0] : null
  };
}
function buildSharedActivityKpis(context) {
  const k = context.kpis, activity = context.activity;
  return [
    buildActivitySalesKpi(activity, k, true, false),
    buildObjectiveKpi(activity, false),
    buildComplianceKpi(activity, UI_COPY.kpis.shared.compliance, UI_COPY.kpis.global.monthlyCompliance.description),
    buildDifferenceKpi(activity),
    { id: "associatedClients", icon: "users", title: UI_COPY.kpis.shared.clients, value: formatInteger(activity.associatedClientCount), description: "Clientes vinculados a la negociación." },
    buildPresentationsKpi(k),
    buildActivityStatusKpi(activity),
    buildActivityValidityKpi(activity)
  ];
}
function buildIndividualActivityKpis(context) {
  const k = context.kpis, activity = context.activity;
  return [
    buildActivitySalesKpi(activity, k, false, false),
    buildObjectiveKpi(activity, false),
    buildComplianceKpi(activity, UI_COPY.kpis.individual.compliance, UI_COPY.kpis.global.monthlyCompliance.description),
    buildDifferenceKpi(activity),
    buildPresentationsKpi(k),
    buildActivityStatusKpi(activity),
    buildActivityValidityKpi(activity),
    { id: "associatedClient", icon: "users", title: UI_COPY.kpis.individual.client, value: activity.associatedClientIds[0] || "No disponible", description: "Cliente vinculado a la negociación.", className: "kpi-secondary" }
  ];
}
function buildSharedActivityClientKpis(context) {
  const k = context.kpis, activity = context.activity, contribution = context.selectedContribution;
  return [
    { id: "clientSales", icon: "shopping-bag", title: UI_COPY.kpis.sharedClient.sales, value: formatAvailableMetric(k.selectedContributionSales), description: "Resultado del cliente en cajas físicas durante el período." },
    buildObjectiveKpi(activity, true),
    { id: "clientContribution", icon: "pie-chart", title: UI_COPY.kpis.sharedClient.contribution, value: formatAvailablePercent(k.selectionContribution), description: UI_COPY.kpis.sharedClient.contributionDescription, shouldRender: function () { return activity.associatedClientCount > 1 && isFiniteNumber(k.selectionContribution); } },
    { id: "jointActivitySales", icon: "package-check", title: UI_COPY.kpis.sharedClient.jointSales, value: formatAvailableMetric(k.relevantJointSales), description: "Resultado conjunto en cajas físicas de los clientes asociados." },
    buildComplianceKpi(activity, UI_COPY.kpis.sharedClient.compliance, UI_COPY.kpis.global.monthlyCompliance.description),
    buildDifferenceKpi(activity),
    { id: "associatedClients", icon: "users", title: UI_COPY.kpis.sharedClient.clients, value: formatInteger(activity.associatedClientCount), description: "Clientes vinculados a la negociación." },
    { id: "clientRank", icon: "list-ordered", title: UI_COPY.kpis.sharedClient.rank, value: contribution && contribution.rank ? contribution.rank + ".º de " + activity.associatedClientCount : "No disponible", description: "Lugar del cliente según su aporte.", className: "kpi-secondary", shouldRender: function () { return activity.associatedClientCount > 1 && Boolean(contribution && contribution.rank); } }
  ];
}
function buildIndividualActivityClientKpis(context) {
  const k = context.kpis, activity = context.activity;
  const clientSales = isFiniteNumber(k.selectedContributionSales) ? k.selectedContributionSales : context.isContractOnly ? k.salesPeriod : null;
  return [
    { id: "clientSales", icon: "shopping-bag", title: UI_COPY.kpis.sharedClient.sales, value: formatAvailableMetric(clientSales), description: context.isContractOnly ? "Resultado histórico en cajas físicas." : "Resultado del cliente en cajas físicas durante el período." },
    buildObjectiveKpi(activity, true),
    buildComplianceKpi(activity, UI_COPY.kpis.individual.compliance, UI_COPY.kpis.global.monthlyCompliance.description),
    buildDifferenceKpi(activity),
    buildPresentationsKpi(k),
    buildActivityStatusKpi(activity),
    buildActivityValidityKpi(activity),
    { id: "relatedActivity", icon: "clipboard-list", title: "Actividad relacionada", value: activity.activityId, description: "Única actividad relacionada con el cliente en el contexto seleccionado.", className: "kpi-secondary" }
  ];
}
function buildMultipleActivitiesClientKpis(context) {
  const k = context.kpis;
  const aggregate = k.clientAggregate || {};
  return buildAggregateActivityKpis(k, aggregate.sales, aggregate.objective, aggregate.achievement, aggregate.gap, "Venta total comparable del cliente", true).concat([
    { id: "relatedClients", icon: "users", title: "Clientes relacionados", value: formatInteger(k.associatedClientCount), description: "Clientes vinculados a las actividades del contexto.", className: "kpi-secondary" }
  ]).slice(0, 8);
}
function buildMultipleActivitiesKpis(context) {
  const k = context.kpis;
  return buildAggregateActivityKpis(k, k.comparableSales, k.comparableObjective, k.compliance, k.objectiveDifference, "Ventas comparables de las actividades").concat([
    { id: "relatedClients", icon: "users", title: "Clientes relacionados", value: formatInteger(k.associatedClientCount), description: "Clientes únicos vinculados a las actividades seleccionadas.", className: "kpi-secondary" }
  ]).slice(0, 8);
}
function buildAggregateActivityKpis(k, sales, objective, achievement, gap, salesTitle, forceComparable) {
  const compliance = getComplianceState(achievement, objective > 0 ? "OK" : "OBJETIVO_AUSENTE");
  const difference = getObjectiveDifferenceState(gap);
  const hasComparablePopulation = forceComparable || k.activityAggregate.comparableCount > 0;
  const comparableSales = hasComparablePopulation && objective > 0 && isFiniteNumber(sales) ? sales : null;
  const comparableObjective = hasComparablePopulation && objective > 0 ? objective : null;
  const coverage = buildComparableCoverageText(k.activityAggregate);
  return [
    { id: "comparableSales", icon: "package-check", title: UI_COPY.kpis.global.comparableSales.title, value: formatAvailableMetric(comparableSales), description: isFiniteNumber(comparableSales) ? UI_COPY.kpis.global.comparableSales.description + " " + coverage : UI_COPY.emptyStates.negotiations + " " + coverage, tooltip: UI_COPY.tooltips.attributableSales },
    { id: "aggregateObjective", icon: "target", title: UI_COPY.kpis.global.monthlyObjective.title, value: formatAvailableMetric(comparableObjective), description: UI_COPY.kpis.global.monthlyObjective.description },
    { id: "aggregateCompliance", icon: "gauge", title: UI_COPY.kpis.global.monthlyCompliance.title, value: formatAvailablePercent(achievement), description: UI_COPY.kpis.global.monthlyCompliance.description + " " + coverage, className: compliance.className, status: compliance.label },
    { id: "aggregateDifference", icon: difference.icon, title: UI_COPY.kpis.global.objectiveGap.title, value: isFiniteNumber(gap) ? formatSignedNumber(gap) : "No disponible", description: isFiniteNumber(gap) ? getObjectiveGapDescription(gap) : UI_COPY.emptyStates.unavailable, className: difference.className, status: difference.label },
    { id: "selectedActivities", icon: "clipboard-list", title: k.selectedActivityIds.length > 1 ? "Actividades seleccionadas" : "Actividades relacionadas", value: formatInteger(k.activityAggregate.totalCount), description: "Actividades evaluadas en el período.", className: "kpi-secondary" }
  ];
}
function buildExecutiveKpis(context) {
  const k = context.kpis;
  const compliance = getComplianceState(k.compliance, k.complianceStatus);
  const difference = getObjectiveDifferenceState(k.objectiveDifference);
  const comparableSales = k.activityAggregate.comparableCount > 0 && k.comparableObjective > 0 ? k.comparableSales : null;
  const comparableObjective = k.activityAggregate.comparableCount > 0 && k.comparableObjective > 0 ? k.comparableObjective : null;
  const coverage = buildComparableCoverageText(k.activityAggregate);
  return [
    { id: "periodSales", icon: "shopping-bag", title: UI_COPY.kpis.global.periodSales.title, value: formatAvailableMetric(k.salesPeriod), description: UI_COPY.kpis.global.periodSales.description },
    { id: "latestSales", icon: "calendar-days", title: UI_COPY.kpis.global.latestSales.title, value: formatAvailableMetric(k.salesMonth), description: UI_COPY.kpis.global.latestSales.description },
    { id: "comparableSales", icon: "package-check", title: UI_COPY.kpis.global.comparableSales.title, value: formatAvailableMetric(comparableSales), description: isFiniteNumber(comparableSales) ? UI_COPY.kpis.global.comparableSales.description : UI_COPY.emptyStates.negotiations, tooltip: UI_COPY.tooltips.attributableSales },
    { id: "monthlyObjectives", icon: "target", title: UI_COPY.kpis.global.monthlyObjective.title, value: formatAvailableMetric(comparableObjective), description: UI_COPY.kpis.global.monthlyObjective.description },
    { id: "activityCompliance", icon: "gauge", title: UI_COPY.kpis.global.monthlyCompliance.title, value: formatAvailablePercent(k.compliance), description: UI_COPY.kpis.global.monthlyCompliance.description + " " + coverage, className: compliance.className, status: compliance.label },
    { id: "objectiveDifference", icon: difference.icon, title: UI_COPY.kpis.global.objectiveGap.title, value: isFiniteNumber(k.objectiveDifference) ? formatSignedNumber(k.objectiveDifference) : "No disponible", description: isFiniteNumber(k.objectiveDifference) ? getObjectiveGapDescription(k.objectiveDifference) : UI_COPY.emptyStates.unavailable, className: difference.className, status: difference.label },
    { id: "clientsWithoutMonthlySales", icon: "user-x", title: UI_COPY.kpis.global.withoutUse.title, value: formatInteger(k.clientsWithoutMonthlySales), description: UI_COPY.kpis.global.withoutUse.description + " " + UI_COPY.kpis.global.withoutUse.action, tooltip: "Estos registros no tienen un per\u00edodo de venta informado en la fuente.", className: "kpi-attention kpi-secondary", action: "open-negotiation-usage", actionLabel: UI_COPY.actions.detail },
    { id: "activeNegotiations", icon: "calendar-check", title: UI_COPY.kpis.global.activeNegotiations.title, value: formatInteger(k.activeNegotiations), description: UI_COPY.kpis.global.activeNegotiations.description, className: "kpi-secondary" }
  ];
}
function buildActivitySalesKpi(activity, k, shared, clientSelected) {
  const contractOnly = !isFiniteNumber(activity.totalSales);
  return {
    id: "activitySales", icon: shared ? "package-check" : "shopping-bag",
    title: contractOnly ? "Ventas históricas" : shared ? UI_COPY.kpis.shared.sales : clientSelected ? UI_COPY.kpis.sharedClient.sales : UI_COPY.kpis.individual.sales,
    value: formatAvailableMetric(contractOnly ? k.salesPeriod : activity.totalSales),
    description: contractOnly ? "Resultado anterior en cajas físicas." : shared ? "Resultado conjunto en cajas físicas de los clientes asociados." : "Resultado en cajas físicas del período evaluado."
  };
}
function buildObjectiveKpi(activity, clientContext) {
  const display = getObjectiveDisplay(activity);
  return {
    id: "activityObjective", icon: "target", title: UI_COPY.kpis.global.monthlyObjective.title, value: display.value,
    description: display.description || UI_COPY.kpis.global.monthlyObjective.description,
    className: display.className
  };
}
function getObjectiveDisplay(activity) {
  if (!activity || activity.objectiveStatus === "SIN_OBJETIVO") return { value: "No disponible", description: "No hay un objetivo mensual válido en cajas físicas.", className: "kpi-neutral" };
  if (activity.objectiveStatus === "OBJETIVO_CONFLICTIVO") return { value: "Revisar", description: "Hay más de un objetivo mensual en cajas físicas.", className: "kpi-attention" };
  if (activity.status === "ACTIVIDAD_AUN_NO_INICIADA") return { value: formatAvailableMetric(activity.objectiveMonthly), description: "Objetivo contractual en cajas físicas, aún no comparable.", className: "kpi-secondary" };
  return { value: formatAvailableMetric(activity.objectiveMonthly), description: "", className: "" };
}
function buildComplianceKpi(activity, title, description) {
  const state = getComplianceState(activity.achievement, activity.objectiveStatus === "OK" ? "OK" : "OBJETIVO_AUSENTE");
  return { id: "activityCompliance", icon: "gauge", title: title, value: formatAvailablePercent(activity.achievement), description: isFiniteNumber(activity.achievement) ? description : getNonComparableDescription(activity), className: state.className, status: state.label };
}
function buildDifferenceKpi(activity) {
  const state = getObjectiveDifferenceState(activity.gap);
  return { id: "activityDifference", icon: state.icon, title: UI_COPY.kpis.global.objectiveGap.title, value: isFiniteNumber(activity.gap) ? formatSignedNumber(activity.gap) : "No disponible", description: isFiniteNumber(activity.gap) ? getObjectiveGapDescription(activity.gap) : getNonComparableDescription(activity), className: state.className, status: state.label };
}
function getNonComparableDescription(activity) {
  if (!activity) return "No existe una actividad comparable en el período.";
  if (activity.status === "ACTIVIDAD_AUN_NO_INICIADA") return "La actividad aún no había iniciado en el período analizado.";
  if (activity.status === "OBJETIVO_CONFLICTIVO") return "No se calcula porque el objetivo mensual es conflictivo.";
  if (activity.status === "SIN_OBJETIVO") return "No se calcula porque falta un objetivo mensual válido.";
  if (activity.status === "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD") return "No se calcula por actividad porque la venta total del cliente requiere una regla verificable de distribución.";
  if (activity.status === "VENTA_ACTIVIDAD_AMBIGUA") return "No se calcula porque la venta atribuible de la actividad es ambigua.";
  return "La actividad no es comparable con la información disponible.";
}
function buildPresentationsKpi(k) {
  return { id: "negotiatedPresentations", icon: "boxes", title: UI_COPY.kpis.shared.presentations, value: formatInteger(k.negotiatedPresentations), description: "Presentaciones incluidas en la negociación.", className: "kpi-secondary" };
}
function buildActivityStatusKpi(activity) {
  return { id: "activityStatus", icon: activity.status === "OK" ? "circle-check" : "circle-dot", title: UI_COPY.kpis.shared.status, value: formatActivityStatus(activity.status), description: activity.status === "OK" ? "Negociación evaluable." : getNonComparableDescription(activity), className: activity.status === "OK" ? "kpi-positive kpi-secondary" : "kpi-attention kpi-secondary" };
}
function buildActivityValidityKpi(activity) {
  return { id: "activityValidity", icon: "calendar-check", title: "Vigencia", value: formatActivityValidity(activity), description: formatCanonicalPeriod(activity.period) + " · " + formatDateRange(activity.startDate, activity.endDate), className: "kpi-secondary" };
}
function formatAvailableMetric(value) { return isFiniteNumber(value) ? formatNumber(value) : "No disponible"; }
function formatAvailablePercent(value) { return isFiniteNumber(value) ? formatRatioPercent(value) : "No disponible"; }
function getObjectiveDifferenceState(value) {
  if (!isFiniteNumber(value)) return { label: "Objetivo no comparable", className: "kpi-neutral", icon: "circle-help" };
  if (value > 0) return { label: "Por encima del objetivo", className: "kpi-positive", icon: "trending-up" };
  if (value < 0) return { label: "Por debajo del objetivo", className: "kpi-negative", icon: "trending-down" };
  return { label: "En objetivo", className: "kpi-neutral", icon: "minus" };
}
function hasActiveDashboardFilters() {
  return hasActiveFilters(state.filters);
}
function hasActiveFilters(filters) {
  return Object.keys(filters || {}).some(function (field) {
    const value = filters[field];
    return (Array.isArray(value) ? value : [value]).some(function (item) { return Boolean(normalizeText(item)); });
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
function getComplianceState(value, status) {
  if (!isFiniteNumber(value)) {
    return { label: status === "OBJETIVO_CERO" ? "Objetivo igual a cero" : "Objetivo no disponible", className: "kpi-neutral" };
  }
  if (value >= 1) return { label: "Favorable · 100 % o más", className: "kpi-positive" };
  if (value >= 0.9) return { label: "Atención · entre 90 % y 99,99 %", className: "kpi-attention" };
  return { label: "Desfavorable · menos de 90 %", className: "kpi-negative" };
}
function resolveClientModelSelectedPeriod(model, filters) {
  const periods = model && model.availablePeriods ? model.availablePeriods : [];
  if (!periods.length) return null;
  const first = function (value) { return Array.isArray(value) ? value[0] : value; };
  const yearText = normalizeText(first(filters && filters["AÃ±o"]));
  const yearValue = yearText ? Number(yearText) : null;
  const monthText = normalizeText(first(filters && filters.Mes)).toLocaleUpperCase("es-CO").replace(/\\./g, "");
  const monthNames = { ENE: 1, ENERO: 1, FEB: 2, FEBRERO: 2, MAR: 3, MARZO: 3, ABR: 4, ABRIL: 4, MAY: 5, MAYO: 5, JUN: 6, JUNIO: 6, JUL: 7, JULIO: 7, AGO: 8, AGOSTO: 8, SEP: 9, SEPT: 9, SEPTIEMBRE: 9, OCT: 10, OCTUBRE: 10, NOV: 11, NOVIEMBRE: 11, DIC: 12, DICIEMBRE: 12 };
  const monthValue = monthNames[monthText] || Number(monthText) || null;
  const candidates = periods.filter(function (period) {
    return (!yearValue || Math.floor(period.key / 100) === yearValue) && (!monthValue || period.key % 100 === monthValue);
  });
  return candidates.length ? candidates[candidates.length - 1] : periods[periods.length - 1];
}
function projectClientNegotiationModelPeriod(model, filters) {
  const selected = resolveClientModelSelectedPeriod(model, filters || {});
  const project = function (row) {
    const status = selected && row.monthlyStatusByMonth ? row.monthlyStatusByMonth[selected.key] : "NO_EVALUABLE_MES";
    return Object.assign({}, row, {
      selectedMonthlyCompliance: selected && row.monthlyComplianceByMonth ? row.monthlyComplianceByMonth[selected.key] : null,
      selectedMonthlyStatus: status || "NO_EVALUABLE_MES",
      selectedMonthlyEvaluationReason: selected && row.monthlyEvaluationReasonByMonth ? row.monthlyEvaluationReasonByMonth[selected.key] || "" : "SIN_PERIODO_SELECCIONADO",
      selectedStatusPeriod: selected ? selected.key : null
    });
  };
  const columns = (model.summaryTableColumns || []).map(function (column) {
    return column.id === "selectedMonthlyStatus" ? Object.assign({}, column, { label: "Estado mensual" + (selected ? " â€” " + selected.label : "") }) : column;
  });
  return Object.assign({}, model, {
    selectedStatusPeriod: selected ? selected.key : null,
    selectedStatusPeriodLabel: selected ? selected.label : "",
    clientActivitySummary: (model.clientActivitySummary || []).map(project),
    clientSummary: (model.clientSummary || []).map(project),
    summaryTableColumns: columns
  });
}
function buildDashboardAnalyses(rows, negotiationUsageAnalysis, options) {
  options = options || {};
  const sourceRows = rows || [];
  const scopeRows = options.scopeRows || sourceRows;
  const usageAnalysis = negotiationUsageAnalysis && Object.prototype.hasOwnProperty.call(negotiationUsageAnalysis, "totalUniqueClients") ? negotiationUsageAnalysis : buildNegotiationUsageAnalysis(sourceRows);
  const dimensionFields = ["Región SAP", "Canal", "Categoría AS400 de la venta", "Cliente SAP - Clave", "Cedi"];
  const dimensions = {};
  dimensionFields.forEach(function (field) {
    const values = getUniqueOptions(sourceRows, field);
    dimensions[field] = { values: values, count: values.length };
  });
  const periods = salesByCanonicalPeriod(sourceRows);
  const presentationStatus = buildPresentationStatusAnalysis(sourceRows);
  const activityAnalytics = options.activityAnalytics || buildActivityAnalytics(scopeRows);
  // La tabla de la siguiente fase consumirá este modelo ya construido por el
  // generador; los renders, búsquedas y páginas no vuelven a recorrer el Excel.
  const rawClientNegotiationModels = options.clientNegotiationModels
    || (DASHBOARD_META && DASHBOARD_META.clientNegotiationModels)
    || { availablePeriods: [], clientActivitySummary: [], clientSummary: [], summaryTableColumns: [], diagnostics: {} };
  const clientNegotiationModels = projectClientNegotiationModelPeriod(rawClientNegotiationModels, options.filters || {});
  const kpis = computeKpis(sourceRows, usageAnalysis, { scopeRows: scopeRows, filters: options.filters || {}, activityAnalytics: activityAnalytics });
  const chartData = {
    regions: groupUniqueTotalSalesByField(sourceRows, "Región SAP", 12),
    channels: groupUniqueTotalSalesByField(sourceRows, "Canal", 10),
    clients: groupUniqueTotalSalesByField(sourceRows, "Cliente SAP - Clave", 10),
    cediCompliance: buildActivityDimensionCompliance(scopeRows, kpis.activityPerformance, "Cedi")
  };
  const result = {
    rows: sourceRows,
    filters: options.filters || {},
    rowCount: sourceRows.length,
    negotiationUsageAnalysis: usageAnalysis,
    dimensions: dimensions,
    periods: periods,
    presentationStatus: presentationStatus,
    presentationSales: groupBySum(sourceRows, "Presentación AS400 de la venta - Texto", "Ventas cajas físicas (sin rep)", 10),
    categorySales: groupBySum(sourceRows, "Categoría AS400 de la venta", "Ventas cajas físicas (sin rep)", 12),
    kpis: kpis,
    activityAnalytics: activityAnalytics,
    clientNegotiationModels: clientNegotiationModels,
    clientActivitySummary: clientNegotiationModels.clientActivitySummary || [],
    clientSummary: clientNegotiationModels.clientSummary || [],
    availablePeriods: clientNegotiationModels.availablePeriods || [],
    summaryTableColumns: clientNegotiationModels.summaryTableColumns || [],
    activityPerformance: kpis.activityPerformance,
    chartData: chartData
  };
  result.timeline = getNegotiationTimelineAnalysisCached({
    filters: result.filters,
    analyses: result,
    indexes: options.indexes || state.indexes,
    datasetVersion: state.datasetVersion
  });
  return result;
}
function buildComparableCoverageText(aggregate) {
  const comparable = aggregate ? aggregate.comparableCount : 0;
  const total = aggregate ? aggregate.totalCount : 0;
  return "Cobertura: " + formatInteger(comparable) + " de " + formatInteger(total) + " actividades.";
}
function reconcileComparablePerformance(metrics, tolerance) {
  const epsilon = isFiniteNumber(tolerance) && tolerance > 0 ? tolerance : 1e-9;
  const sales = metrics && metrics.comparableSales;
  const objective = metrics && metrics.comparableObjective;
  const compliance = metrics && metrics.compliance;
  const difference = metrics && metrics.objectiveDifference;
  if (!isFiniteNumber(sales) || !isFiniteNumber(objective) || objective <= 0 || !isFiniteNumber(compliance) || !isFiniteNumber(difference)) {
    return { comparable: false, differenceConsistent: null, complianceConsistent: null, consistent: null };
  }
  const expectedDifference = sales - objective;
  const expectedCompliance = sales / objective;
  const differenceConsistent = Math.abs(expectedDifference - difference) < epsilon;
  const complianceConsistent = Math.abs(expectedCompliance - compliance) < epsilon;
  return { comparable: true, expectedDifference: expectedDifference, expectedCompliance: expectedCompliance, differenceConsistent: differenceConsistent, complianceConsistent: complianceConsistent, consistent: differenceConsistent && complianceConsistent };
}
function getNegotiationTimelineAnalysisCached(input) {
  input = input || {};
  const analyses = input.analyses || {};
  const analytics = analyses.activityAnalytics || {};
  const filters = input.filters || analyses.filters || {};
  const signature = [
    input.datasetVersion === undefined ? state.datasetVersion : input.datasetVersion,
    getFilterSignature(filters),
    analytics.objectivesByActivity ? analytics.objectivesByActivity.length : 0,
    analytics.activityPerformance ? analytics.activityPerformance.length : 0,
    analytics.salesByClientPeriod ? analytics.salesByClientPeriod.length : 0
  ].join("|");
  const cached = state.timelineCache.get(signature);
  if (cached) {
    state.performance.counters.timelineCacheHits += 1;
    return cached;
  }
  const model = measurePerformance("timelineModel", function () {
    state.performance.counters.timelineModelsBuilt += 1;
    return buildNegotiationTimelineAnalysis({ filters: filters, analyses: analyses, indexes: input.indexes });
  });
  model.cacheSignature = signature;
  return state.timelineCache.set(signature, model);
}
function buildNegotiationTimelineAnalysis(input) {
  input = input || {};
  const filters = input.filters || {};
  const analyses = input.analyses || {};
  const analytics = analyses.activityAnalytics || {};
  const objectives = analytics.objectivesByActivity || [];
  const relations = analytics.activityClientRelations || { activityClients: new Map(), periods: [] };
  const performances = analytics.activityPerformance || [];
  const clientSales = analytics.salesByClientPeriod || [];
  const selectedActivityIds = getSelectedFilterValues(filters, "ID Actividad");
  const selectedClientIds = getSelectedFilterValues(filters, "Cliente SAP - Clave");
  const selectedClientId = selectedClientIds.length === 1 ? selectedClientIds[0] : null;
  let activityIds = selectedActivityIds.slice();
  if (!activityIds.length && selectedClientId) {
    activityIds = objectives.filter(function (objective) {
      return (relations.activityClients.get(objective.activityId) || new Set()).has(selectedClientId);
    }).map(function (objective) { return objective.activityId; });
  }
  activityIds = Array.from(new Set(activityIds));
  let mode = "NO_CONTEXT";
  if (activityIds.length === 1) mode = "SINGLE_ACTIVITY";
  else if (selectedClientId && activityIds.length > 1) mode = "CLIENT_CONTEXT";
  else if (activityIds.length > 1) mode = "MULTIPLE_ACTIVITIES";
  const selectedObjectives = activityIds.map(function (activityId) {
    return objectives.find(function (item) { return item.activityId === activityId; });
  }).filter(Boolean);
  const latestSalesPeriod = Math.max.apply(null, [0].concat(relations.periods || [])) || null;
  const activities = selectedObjectives.map(function (objective) {
    const clients = Array.from(relations.activityClients.get(objective.activityId) || []);
    const status = resolveTimelineActivityStatus(objective, latestSalesPeriod);
    return {
      activityId: objective.activityId,
      startDate: objective.startDate,
      endDate: objective.endDate,
      dateStatus: resolveTimelineDateStatus(objective),
      datePairs: (objective.datePairs || []).slice(),
      isShared: clients.length > 1,
      associatedClientCount: clients.length,
      associatedClientIds: clients,
      objectiveMonthly: objective.objectiveMonthly,
      objectiveStatus: objective.objectiveStatus,
      currentStatus: status,
      statusInLatestPeriod: status
    };
  });
  const relevantSalesPeriods = selectedClientId
    ? clientSales.filter(function (item) { return item.clientId === selectedClientId; }).map(function (item) { return item.period; })
    : activityIds.length === 1 && activities[0] && !activities[0].isShared
      ? clientSales.filter(function (item) { return activities[0].associatedClientIds.indexOf(item.clientId) !== -1; }).map(function (item) { return item.period; })
      : (relations.periods || []).slice();
  const periodSequence = buildTimelinePeriodSequence(activities, relevantSalesPeriods);
  const performanceLookup = new Map(performances.filter(function (item) { return activityIds.indexOf(item.activityId) !== -1; }).map(function (item) {
    return [item.activityId + "||" + item.period, item];
  }));
  const clientSalesLookup = new Map(clientSales.map(function (item) { return [item.clientId + "||" + item.period, item]; }));
  const periods = periodSequence.periods.map(function (period) {
    return buildTimelinePeriodModel(period, activities, performanceLookup, clientSalesLookup, selectedClientId);
  });
  const validStarts = activities.map(function (item) { return item.dateStatus === "OK" ? item.startDate : null; }).filter(Boolean).sort();
  const validEnds = activities.map(function (item) { return item.dateStatus === "OK" ? item.endDate : null; }).filter(Boolean).sort();
  const warnings = [];
  if (activities.some(function (item) { return item.dateStatus === "FECHAS_CONFLICTIVAS"; })) warnings.push("Existen actividades con fechas conflictivas; no se dibuja una vigencia falsa.");
  if (activities.some(function (item) { return item.dateStatus === "FECHA_FIN_AUSENTE"; })) warnings.push("Existen actividades sin fecha final válida; la banda queda incompleta.");
  if (activities.some(function (item) { return item.objectiveStatus === "OBJETIVO_CONFLICTIVO"; })) warnings.push("Existen objetivos conflictivos; no se muestra una referencia única.");
  if (periodSequence.truncated) warnings.push("El rango se limitó a " + TIMELINE_MAX_PERIODS + " meses para conservar legibilidad.");
  const model = {
    mode: mode,
    shouldRender: activityIds.length > 0 && (selectedActivityIds.length > 0 || selectedClientIds.length === 1),
    selectedClientId: selectedClientId,
    periodRange: periods.length ? {
      firstPeriodKey: periods[0].periodKey,
      lastPeriodKey: periods[periods.length - 1].periodKey,
      firstPeriodLabel: periods[0].periodLabel,
      lastPeriodLabel: periods[periods.length - 1].periodLabel
    } : null,
    periods: periods,
    activities: activities,
    visibleActivities: activities.slice(0, TIMELINE_MAX_GANTT_ROWS),
    hiddenActivityCount: Math.max(0, activities.length - TIMELINE_MAX_GANTT_ROWS),
    displayMode: activities.length > TIMELINE_MAX_GANTT_ROWS ? "SUMMARY" : activities.length > 1 ? "GANTT" : "DETAIL",
    latestSalesPeriod: latestSalesPeriod,
    nextStartDate: validStarts.find(function (date) { return latestSalesPeriod && periodFromIsoDate(date) > latestSalesPeriod; }) || null,
    firstStartDate: validStarts[0] || null,
    lastEndDate: validEnds.length ? validEnds[validEnds.length - 1] : null,
    comparablePeriodCount: periods.filter(function (item) { return item.comparable; }).length,
    historicalPeriodCount: periods.filter(function (item) { return item.temporalStatus === "HISTORICO_PREVIO"; }).length,
    postPeriodCount: periods.filter(function (item) { return item.temporalStatus === "POSTERIOR_AL_FIN"; }).length,
    warnings: warnings,
    maxGanttRows: TIMELINE_MAX_GANTT_ROWS,
    maxPeriods: TIMELINE_MAX_PERIODS,
    rangeTruncated: periodSequence.truncated
  };
  model.accessibleSummary = buildTimelineAccessibleSummary(model);
  return model;
}
function resolveTimelineDateStatus(objective) {
  if (objective.dateStatus === "OK") return "OK";
  if ((objective.datePairs || []).length === 1) {
    const parts = objective.datePairs[0].split("||");
    if (dateOnly(parts[0]) && !dateOnly(parts[1])) return "FECHA_FIN_AUSENTE";
  }
  return "FECHAS_CONFLICTIVAS";
}
function resolveTimelineActivityStatus(objective, period) {
  const dateStatus = resolveTimelineDateStatus(objective);
  if (dateStatus !== "OK") return dateStatus;
  if (objective.objectiveStatus !== "OK") return objective.objectiveStatus;
  if (!period) return "SIN_PERIODO_VENTA";
  const startPeriod = periodFromIsoDate(objective.startDate), endPeriod = periodFromIsoDate(objective.endDate);
  if (period < startPeriod) return "ACTIVIDAD_AUN_NO_INICIADA";
  if (period > endPeriod) return "ACTIVIDAD_FINALIZADA";
  return "ACTIVIDAD_VIGENTE";
}
function periodFromIsoDate(value) {
  const date = dateOnly(value);
  return date ? date.getFullYear() * 100 + date.getMonth() + 1 : null;
}
function addCanonicalMonths(period, amount) {
  const year = Math.floor(period / 100), month = period % 100;
  const date = new Date(year, month - 1 + amount, 1);
  return date.getFullYear() * 100 + date.getMonth() + 1;
}
function canonicalMonthDistance(first, last) {
  return (Math.floor(last / 100) - Math.floor(first / 100)) * 12 + (last % 100) - (first % 100);
}
function buildTimelinePeriodSequence(activities, salesPeriods) {
  const candidates = (salesPeriods || []).filter(Boolean);
  activities.forEach(function (activity) {
    if (activity.dateStatus !== "OK") return;
    candidates.push(periodFromIsoDate(activity.startDate), periodFromIsoDate(activity.endDate));
  });
  if (!candidates.length) return { periods: [], truncated: false };
  let first = Math.min.apply(null, candidates), last = Math.max.apply(null, candidates);
  const total = canonicalMonthDistance(first, last) + 1;
  let truncated = total > TIMELINE_MAX_PERIODS;
  if (truncated) {
    const latestData = Math.max.apply(null, (salesPeriods || []).filter(Boolean).concat([first]));
    first = addCanonicalMonths(latestData, -Math.floor((TIMELINE_MAX_PERIODS - 1) / 2));
    last = addCanonicalMonths(first, TIMELINE_MAX_PERIODS - 1);
  }
  const periods = [];
  for (let period = first, guard = 0; period <= last && guard < TIMELINE_MAX_PERIODS; period = addCanonicalMonths(period, 1), guard += 1) periods.push(period);
  return { periods: periods, truncated: truncated };
}
function buildTimelinePeriodModel(period, activities, performanceLookup, clientSalesLookup, selectedClientId) {
  const validActivities = activities.filter(function (activity) { return activity.dateStatus === "OK"; });
  const active = validActivities.filter(function (activity) {
    return period >= periodFromIsoDate(activity.startDate) && period <= periodFromIsoDate(activity.endDate);
  });
  const allBefore = validActivities.length && validActivities.every(function (activity) { return period < periodFromIsoDate(activity.startDate); });
  const allAfter = validActivities.length && validActivities.every(function (activity) { return period > periodFromIsoDate(activity.endDate); });
  const singleActivity = activities.length === 1 ? activities[0] : null;
  const performance = singleActivity ? performanceLookup.get(singleActivity.activityId + "||" + period) : null;
  const contextClientId = selectedClientId || (singleActivity && !singleActivity.isShared ? singleActivity.associatedClientIds[0] : null);
  const clientSale = contextClientId ? clientSalesLookup.get(contextClientId + "||" + period) : null;
  let temporalStatus = "SIN_INFORMACION";
  let sales = null, salesSource = "SIN_FUENTE", objective = null, comparable = false, ambiguityStatus = "OK", clientContribution = null;
  if (singleActivity && active.length && singleActivity.objectiveStatus === "OK" && isFiniteNumber(singleActivity.objectiveMonthly)) objective = singleActivity.objectiveMonthly;
  if (!validActivities.length && activities.some(function (activity) { return activity.dateStatus === "FECHAS_CONFLICTIVAS"; })) temporalStatus = "FECHAS_CONFLICTIVAS";
  else if (allBefore) {
    temporalStatus = "HISTORICO_PREVIO";
    if (clientSale && isFiniteNumber(clientSale.value)) { sales = clientSale.value; salesSource = "TOTAL_VENTA_CLIENTE_PERIODO"; }
  } else if (allAfter) {
    temporalStatus = "POSTERIOR_AL_FIN";
    if (clientSale && isFiniteNumber(clientSale.value)) { sales = clientSale.value; salesSource = "TOTAL_VENTA_CLIENTE_PERIODO"; }
  } else if (singleActivity && singleActivity.objectiveStatus === "OBJETIVO_CONFLICTIVO") temporalStatus = "OBJETIVO_CONFLICTIVO";
  else if (singleActivity && singleActivity.objectiveStatus !== "OK") temporalStatus = "SIN_OBJETIVO";
  else if (performance && performance.status === "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD") {
    temporalStatus = "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD";
    ambiguityStatus = performance.status;
  } else if (performance && (performance.status === "VENTA_ACTIVIDAD_AMBIGUA" || performance.status === "VENTA_CONFLICTIVA")) {
    temporalStatus = "VENTA_ACTIVIDAD_AMBIGUA";
    ambiguityStatus = performance.status;
  } else if (performance && performance.comparable) {
    temporalStatus = "PERIODO_COMPARABLE";
    sales = performance.totalSales;
    salesSource = singleActivity.isShared ? "VENTAS_CONJUNTAS_ACTIVIDAD" : "VENTA_ATRIBUIBLE_ACTIVIDAD";
    objective = performance.objectiveMonthly;
    comparable = true;
    if (selectedClientId) {
      const contribution = performance.contributionRows.find(function (item) { return item.clientId === selectedClientId; });
      clientContribution = contribution && isFiniteNumber(contribution.sales) ? contribution.sales : null;
    }
  } else if (active.length) temporalStatus = "VIGENTE_SIN_VENTA_ATRIBUIBLE";
  const activityStatus = performance ? performance.status : active.length ? "ACTIVIDAD_VIGENTE" : temporalStatus;
  const model = {
    periodKey: period,
    periodLabel: formatCanonicalPeriod(period),
    sales: sales,
    salesSource: salesSource,
    clientContribution: clientContribution,
    objective: objective,
    achievement: comparable && objective > 0 ? sales / objective : null,
    temporalStatus: temporalStatus,
    activityStatus: activityStatus,
    comparable: comparable,
    ambiguityStatus: ambiguityStatus
  };
  model.tooltipMessage = buildTimelineTooltip(model);
  return model;
}
function buildTimelineTooltip(period) {
  const labels = {
    HISTORICO_PREVIO: "Histórico previo",
    PERIODO_COMPARABLE: "Actividad vigente",
    VIGENTE_SIN_VENTA_ATRIBUIBLE: "Vigente sin venta atribuible",
    VENTA_ACTIVIDAD_AMBIGUA: "Venta no atribuible con certeza",
    REQUIERE_DISTRIBUCION_MULTIACTIVIDAD: "Requiere distribución multiactividad",
    POSTERIOR_AL_FIN: "Posterior al fin de la actividad",
    FECHAS_CONFLICTIVAS: "Fechas conflictivas",
    SIN_OBJETIVO: "Sin objetivo",
    OBJETIVO_CONFLICTIVO: "Objetivo conflictivo",
    SIN_INFORMACION: "Sin información"
  };
  const lines = [period.periodLabel];
  if (isFiniteNumber(period.sales)) lines.push("Venta: " + formatNumber(period.sales));
  if (isFiniteNumber(period.clientContribution)) lines.push("Aporte del cliente seleccionado: " + formatNumber(period.clientContribution));
  if (isFiniteNumber(period.objective)) lines.push("Objetivo mensual: " + formatNumber(period.objective));
  if (isFiniteNumber(period.achievement)) lines.push("Cumplimiento: " + formatRatioPercent(period.achievement));
  lines.push("Estado: " + (labels[period.temporalStatus] || period.temporalStatus));
  if (!period.comparable) lines.push(period.temporalStatus === "HISTORICO_PREVIO" ? "La negociación aún no había iniciado; no participa en el cumplimiento." : "El período no participa en el cumplimiento.");
  return lines.join("\\n");
}
function buildTimelineAccessibleSummary(model) {
  if (!model.shouldRender) return "Selecciona una actividad o un cliente para explorar su línea de tiempo.";
  const subject = model.activities.length === 1 ? "la actividad " + model.activities[0].activityId : model.activities.length + " actividades";
  const parts = ["Línea de tiempo de " + subject + "."];
  if (model.periodRange) parts.push("Rango de " + model.periodRange.firstPeriodLabel + " a " + model.periodRange.lastPeriodLabel + ".");
  if (model.firstStartDate) parts.push("Inicio: " + formatIsoDate(model.firstStartDate) + ".");
  if (model.lastEndDate) parts.push("Fin: " + formatIsoDate(model.lastEndDate) + ".");
  parts.push("Períodos históricos: " + model.historicalPeriodCount + ". Períodos comparables: " + model.comparablePeriodCount + ".");
  if (!model.comparablePeriodCount && model.nextStartDate) parts.push("La actividad aún no había iniciado en los períodos con ventas disponibles.");
  if (model.warnings.length) parts.push(model.warnings.join(" "));
  return parts.join(" ");
}
function buildActivityDimensionCompliance(rows, performance, field) {
  const dimensionByActivity = new Map(), invalidActivities = new Set();
  rows.forEach(function (row) {
    const activityId = normalizeText(row["ID Actividad"]), value = normalizeText(row[field]);
    if (!activityId || !value || invalidActivities.has(activityId)) return;
    if (!dimensionByActivity.has(activityId)) dimensionByActivity.set(activityId, value);
    else if (dimensionByActivity.get(activityId) !== value) { dimensionByActivity.delete(activityId); invalidActivities.add(activityId); }
  });
  const grouped = new Map();
  (performance || []).forEach(function (item) {
    const label = dimensionByActivity.get(item.activityId);
    if (!label) return;
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label).push(item);
  });
  return Array.from(grouped, function (entry) {
    const aggregate = aggregateActivityPerformance(entry[1]);
    return { label: entry[0], value: aggregate.achievement, valid: isFiniteNumber(aggregate.achievement), sales: aggregate.sales, objective: aggregate.objective };
  }).filter(function (item) { return item.valid; }).sort(function (a, b) { return b.value - a.value; });
}
function renderContextStrip(analysis) {
  const element = document.getElementById("contextStrip");
  if (!element) return;
  if (!analysis || !analysis.rowCount) {
    element.innerHTML = '<span class="context-item"><strong>Sin registros</strong> para la selección actual</span>';
    return;
  }
  const items = [];
  if (analysis.periods.length) {
    const first = analysis.periods[0].label;
    const last = analysis.periods[analysis.periods.length - 1].label;
    items.push(["Período", first === last ? first : first + " a " + last]);
  }
  if (analysis.kpis && analysis.kpis.selectedActivity) {
    items.push(["Actividad", analysis.kpis.selectedActivity.activityId]);
    items.push(["Tipo", analysis.kpis.selectedActivity.isSharedActivity ? "Compartida entre " + analysis.kpis.selectedActivity.associatedClientCount + " clientes" : "Individual"]);
  }
  [
    ["Cliente", "Cliente SAP - Clave"], ["Región", "Región SAP"], ["Canal", "Canal"], ["CEDI", "Cedi"]
  ].forEach(function (item) {
    const dimension = analysis.dimensions[item[1]];
    if (dimension && dimension.count === 1) items.push([item[0], dimension.values[0]]);
  });
  items.push(["Registros", formatInteger(analysis.rowCount)]);
  element.innerHTML = items.map(function (item) {
    return '<span class="context-item"><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + '</strong></span>';
  }).join("");
}
function getChartRegistry() {
  return [
    { id: "negotiationTimeline", elementId: "chartNegotiationTimeline", title: UI_COPY.charts.negotiationTimeline.title, subtitle: UI_COPY.charts.negotiationTimeline.subtitle, visualType: "smooth-line-or-gantt", layout: "timeline", height: "timeline", shouldRender: function () { return true; } },
    { id: "activityContribution", elementId: "chartActivityContribution", title: UI_COPY.charts.activityContribution.title, subtitle: UI_COPY.charts.activityContribution.subtitle, action: UI_COPY.actions.contribution, visualType: "bar", layout: "featured", height: "featured", shouldRender: function (a) { return Boolean(a.kpis.selectedActivity && a.kpis.selectedActivity.contributionRows.filter(function (row) { return isFiniteNumber(row.sales); }).length >= 2); } },
    { id: "activityPerformance", elementId: "chartActivityPerformance", title: UI_COPY.charts.activityPerformance.title, subtitle: UI_COPY.charts.activityPerformance.subtitle, visualType: "bar", layout: "standard", height: "standard", shouldRender: function (a) { return a.activityPerformance.filter(function (item) { return item.comparable; }).length >= 2; } },
    { id: "presentationStatus", elementId: "chartPresentationStatus", title: UI_COPY.charts.presentationStatus.title, subtitle: UI_COPY.charts.presentationStatus.subtitle, visualType: "donut", layout: "compact", height: "compact", shouldRender: function (a) { return a.presentationStatus.filter(function (item) { return item.value > 0; }).length >= 2; } },
    { id: "category", elementId: "chartCategoria", title: UI_COPY.charts.category.title, subtitle: UI_COPY.charts.category.subtitle, visualType: "treemap-or-bar", layout: "standard", height: "standard", shouldRender: function (a) { return a.categorySales.length >= 2 && hasRenderableChartData(a.categorySales); } },
    { id: "presentations", elementId: "chartPresentaciones", title: UI_COPY.charts.presentations.title, subtitle: UI_COPY.charts.presentations.subtitle, visualType: "lollipop", layout: "standard", height: "standard", shouldRender: function (a) { return a.presentationSales.length >= 2 && hasRenderableChartData(a.presentationSales); } },
    { id: "clients", elementId: "chartClientes", title: UI_COPY.charts.clients.title, subtitle: UI_COPY.charts.clients.subtitle, visualType: "bar", layout: "standard", height: "standard", shouldRender: function (a) { return a.dimensions["Cliente SAP - Clave"].count >= 2; } },
    { id: "regions", elementId: "chartRegion", title: UI_COPY.charts.regions.title, subtitle: UI_COPY.charts.regions.subtitle, visualType: "map-and-ranking", layout: "featured", height: "featured", shouldRender: function (a) { return a.dimensions["Región SAP"].count >= 2; } },
    { id: "channels", elementId: "chartCanal", title: UI_COPY.charts.channels.title, subtitle: UI_COPY.charts.channels.subtitle, visualType: "bar", layout: "standard", height: "standard", shouldRender: function (a) { return a.dimensions.Canal.count >= 2; } },
    { id: "cedi", elementId: "chartCedi", title: UI_COPY.charts.cedi.title, subtitle: UI_COPY.charts.cedi.subtitle, visualType: "bar", layout: "standard", height: "standard", shouldRender: function (a) { return a.chartData.cediCompliance.length >= 2; } }
  ];
}
function assignAdaptiveChartLayout(definitions) {
  const prepared = definitions.map(function (definition) {
    const layout = definition.layout || "standard";
    return Object.assign({}, definition, { layoutClass: "chart-" + layout });
  });
  let segment = [];
  function closeSegment() {
    if (segment.length % 2 === 1) prepared[segment[segment.length - 1]].layoutClass += " chart-row-fill";
    segment = [];
  }
  prepared.forEach(function (definition, index) {
    if (definition.layout === "standard" || definition.layout === "compact") segment.push(index);
    else closeSegment();
  });
  closeSegment();
  return prepared;
}
function renderAdaptiveCharts(analysis) {
  const container = document.getElementById("charts");
  const summary = document.getElementById("chartEmptySummary");
  if (!container) return;
  if (!analysis || !analysis.rowCount) {
    disposeCharts();
    state.chartLayoutSignature = "";
    container.innerHTML = "";
    if (summary) {
      summary.hidden = false;
      summary.textContent = UI_COPY.emptyStates.filters;
    }
    return;
  }
  const visible = assignAdaptiveChartLayout(getChartRegistry().filter(function (definition) { return definition.shouldRender(analysis); }));
  const layoutSignature = visible.map(function (definition) { return definition.id + ":" + definition.layoutClass; }).join("|");
  if (layoutSignature !== state.chartLayoutSignature) {
    disposeCharts();
    container.innerHTML = visible.map(function (definition, index) {
      if (definition.id === "negotiationTimeline") return buildTimelineCardMarkup(analysis.timeline, index, definition.layoutClass);
      const action = definition.action ? '<p class="chart-action-hint"><i data-lucide="mouse-pointer-click"></i> ' + escapeHtml(definition.action) + '</p>' : "";
      return '<article class="chart-card ' + escapeHtml(definition.layoutClass) + '" data-chart-layout="' + escapeHtml(definition.layout) + '" style="animation-delay:' + Math.min(index * 35, 210) + 'ms"><div><h2>' + escapeHtml(definition.title) + '</h2><p>' + escapeHtml(definition.subtitle) + '</p>' + action + '</div><div id="' + definition.elementId + '" class="chart" role="img" aria-label="' + escapeHtml(definition.title + ". " + definition.subtitle) + '"></div></article>';
    }).join("");
    state.chartLayoutSignature = layoutSignature;
  }
  if (summary) {
    summary.hidden = visible.length > 0;
    summary.textContent = visible.length ? "" : UI_COPY.emptyStates.visualization;
  }
  syncTimelineCardMarkup(analysis.timeline);
  visible.forEach(function (definition) { renderRegisteredChart(definition.id, analysis); });
}
function buildTimelineCardMarkup(model, index, layoutClass) {
  const shouldRender = model && model.shouldRender;
  const compact = shouldRender ? "" : " timeline-card-empty";
  const title = model && model.activities.length === 1
    ? "Línea de tiempo · Actividad " + model.activities[0].activityId
    : model && model.selectedClientId
      ? "Línea de tiempo · Cliente " + model.selectedClientId
      : UI_COPY.charts.negotiationTimeline.title;
  const subtitle = shouldRender
    ? UI_COPY.charts.negotiationTimeline.subtitle
    : "Selecciona una negociación o un cliente para ver su evolución.";
  const summary = shouldRender ? buildTimelineContextMarkup(model) : "";
  const legend = shouldRender ? '<div class="timeline-legend" aria-label="Estados de la línea de tiempo"><span><i class="timeline-dot is-history"></i>Histórico</span><span><i class="timeline-dot is-comparable"></i>Período vigente</span><span><i class="timeline-dot is-post"></i>Posterior</span><span><i class="timeline-dot is-warning"></i>Revisar</span></div>' : "";
  const modeClass = getTimelineLayoutModeClass(model);
  return '<article id="negotiationTimelineCard" class="chart-card ' + escapeHtml(layoutClass || "chart-timeline") + ' timeline-card ' + modeClass + compact + '" data-chart-layout="timeline" style="animation-delay:' + Math.min(index * 35, 210) + 'ms"><div class="timeline-heading"><div><h2 id="negotiationTimelineTitle">' + escapeHtml(title) + '</h2><p id="negotiationTimelineSubtitle">' + escapeHtml(subtitle) + '</p></div><div id="negotiationTimelineAction">' + buildTimelineActionMarkup(model) + '</div></div><div id="negotiationTimelineContext">' + summary + '</div><div id="negotiationTimelineLegend">' + legend + '</div><div id="chartNegotiationTimeline" class="chart timeline-chart" role="img" aria-label="' + escapeHtml(model ? model.accessibleSummary : subtitle) + '"></div></article>';
}
function getTimelineLayoutModeClass(model) {
  if (!model || !model.shouldRender) return "timeline-mode-empty";
  if (model.displayMode === "GANTT") return "timeline-mode-gantt";
  if (model.displayMode === "SUMMARY") return "timeline-mode-summary";
  return "timeline-mode-detail";
}
function syncTimelineCardMarkup(model) {
  const card = document.getElementById("negotiationTimelineCard");
  if (!card) return;
  const shouldRender = Boolean(model && model.shouldRender);
  const title = model && model.activities.length === 1
    ? "Línea de tiempo · Actividad " + model.activities[0].activityId
    : model && model.selectedClientId ? "Evolución · Cliente " + model.selectedClientId : UI_COPY.charts.negotiationTimeline.title;
  const subtitle = shouldRender
    ? UI_COPY.charts.negotiationTimeline.subtitle
    : "Selecciona una negociación o un cliente para ver su evolución.";
  const titleElement = document.getElementById("negotiationTimelineTitle");
  const subtitleElement = document.getElementById("negotiationTimelineSubtitle");
  const actionElement = document.getElementById("negotiationTimelineAction");
  const contextElement = document.getElementById("negotiationTimelineContext");
  const legendElement = document.getElementById("negotiationTimelineLegend");
  const chartElement = document.getElementById("chartNegotiationTimeline");
  ["timeline-mode-empty", "timeline-mode-gantt", "timeline-mode-summary", "timeline-mode-detail"].forEach(function (className) { card.classList.remove(className); });
  card.classList.add(getTimelineLayoutModeClass(model));
  card.classList.toggle("timeline-card-empty", !shouldRender);
  if (titleElement) titleElement.textContent = title;
  if (subtitleElement) subtitleElement.textContent = subtitle;
  if (actionElement) actionElement.innerHTML = shouldRender ? buildTimelineActionMarkup(model) : "";
  if (contextElement) contextElement.innerHTML = shouldRender ? buildTimelineContextMarkup(model) : "";
  if (legendElement) legendElement.innerHTML = shouldRender ? '<div class="timeline-legend" aria-label="Estados de la línea de tiempo"><span><i class="timeline-dot is-history"></i>Histórico</span><span><i class="timeline-dot is-comparable"></i>Período vigente</span><span><i class="timeline-dot is-post"></i>Posterior</span><span><i class="timeline-dot is-warning"></i>Revisar</span></div>' : "";
  if (chartElement) chartElement.setAttribute("aria-label", model ? model.accessibleSummary : subtitle);
}
function buildTimelineContextMarkup(model) {
  const items = [];
  if (model.firstStartDate) items.push(["Inicio", formatIsoDate(model.firstStartDate)]);
  if (model.lastEndDate) items.push(["Fin", formatIsoDate(model.lastEndDate)]);
  items.push(["Históricos", formatInteger(model.historicalPeriodCount)]);
  items.push(["Comparables", formatInteger(model.comparablePeriodCount)]);
  if (model.activities.length === 1) items.push(["Tipo", model.activities[0].isShared ? "Compartida · " + model.activities[0].associatedClientCount + " clientes" : "Individual"]);
  else items.push(["Actividades", formatInteger(model.activities.length)]);
  return '<div class="timeline-context">' + items.map(function (item) { return '<span><small>' + escapeHtml(item[0]) + '</small><strong>' + escapeHtml(item[1]) + '</strong></span>'; }).join("") + '</div>';
}
function buildTimelineActionMarkup(model) {
  if (!model || !model.shouldRender || model.activities.length !== 1) return "";
  const activity = model.activities[0];
  const action = activity.isShared ? "open-contribution" : "open-detail";
  const label = activity.isShared ? "Ver contribución de clientes" : "Ver detalle de la actividad";
  return '<button class="button button-ghost timeline-action" type="button" data-timeline-action="' + action + '" data-timeline-activity="' + escapeHtml(activity.activityId) + '"><i data-lucide="' + (activity.isShared ? "users" : "list-search") + '"></i>' + escapeHtml(label) + '</button>';
}
function renderNegotiationTimeline(model) {
  const element = document.getElementById("chartNegotiationTimeline");
  if (!element) return;
  const signature = JSON.stringify({ model: model, theme: getCurrentTheme(), echarts: Boolean(window.echarts) });
  if (state.chartSignatures.get("chartNegotiationTimeline") === signature) return;
  if (!model || !model.shouldRender) {
    disposeChartInstance("chartNegotiationTimeline");
    element.innerHTML = '<div class="timeline-empty"><i data-lucide="calendar-range"></i><strong>Explora una negociación en el tiempo</strong><span>Usa los filtros de actividad o cliente para activar esta vista.</span></div>';
    state.chartSignatures.set("chartNegotiationTimeline", signature);
    return;
  }
  if (model.activities.some(function (item) { return item.dateStatus === "FECHAS_CONFLICTIVAS"; }) && model.activities.length === 1) {
    disposeChartInstance("chartNegotiationTimeline");
    element.innerHTML = buildTimelineConflictMarkup(model.activities[0]);
    state.chartSignatures.set("chartNegotiationTimeline", signature);
    return;
  }
  if (model.displayMode !== "DETAIL" || !window.echarts) {
    disposeChartInstance("chartNegotiationTimeline");
    renderNativeTimeline(element, model);
    state.chartSignatures.set("chartNegotiationTimeline", signature);
    state.performance.counters.timelineUpdates += 1;
    return;
  }
  try {
    let chart = chartInstances.chartNegotiationTimeline;
    if (!chart) {
      element.innerHTML = "";
      chart = window.echarts.init(element, null, { renderer: "canvas" });
      chartInstances.chartNegotiationTimeline = chart;
      state.performance.counters.chartInitializations += 1;
      state.performance.counters.timelineInitializations += 1;
    }
    chart.setOption(buildNegotiationTimelineOption(model), { notMerge: true, lazyUpdate: true });
    state.chartSignatures.set("chartNegotiationTimeline", signature);
    state.performance.counters.chartUpdates += 1;
    state.performance.counters.timelineUpdates += 1;
  } catch (error) {
    reportDashboardDiagnostic("warning", "timeline-echarts", error, "Se activó el fallback nativo de timeline.");
    disposeChartInstance("chartNegotiationTimeline");
    renderNativeTimeline(element, model);
    state.chartSignatures.set("chartNegotiationTimeline", signature);
  }
}
function buildNegotiationTimelineOption(model) {
  const theme = getChartThemeColors();
  const activity = model.activities[0];
  const labels = model.periods.map(function (item) { return item.periodLabel; });
  const startPeriod = formatCanonicalPeriod(periodFromIsoDate(activity.startDate));
  const endPeriod = formatCanonicalPeriod(periodFromIsoDate(activity.endDate));
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colors = {
    HISTORICO_PREVIO: "#64748b", PERIODO_COMPARABLE: "#0d9488", POSTERIOR_AL_FIN: "#94a3b8",
    VIGENTE_SIN_VENTA_ATRIBUIBLE: "#cbd5e1", VENTA_ACTIVIDAD_AMBIGUA: "#f59e0b", REQUIERE_DISTRIBUCION_MULTIACTIVIDAD: "#f59e0b",
    SIN_OBJETIVO: "#60a5fa", OBJETIVO_CONFLICTIVO: "#f59e0b", SIN_INFORMACION: "#cbd5e1"
  };
  const dataZoom = labels.length > 12 ? [
    { type: "inside", start: 0, end: Math.min(100, 1200 / labels.length) },
    { type: "slider", height: 18, bottom: 2, start: 0, end: Math.min(100, 1200 / labels.length), borderColor: theme.grid, textStyle: { color: theme.muted } }
  ] : [];
  return {
    animation: !reducedMotion,
    animationDuration: reducedMotion ? 0 : Math.min(240, model.periods.length > 20 ? 180 : 240),
    color: ["#0d9488", "#f59e0b"],
    tooltip: {
      trigger: "axis", axisPointer: { type: "line" }, backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder,
      textStyle: { color: theme.tooltipText }, formatter: function (params) {
        const index = Array.isArray(params) && params[0] ? params[0].dataIndex : 0;
        return escapeHtml(model.periods[index].tooltipMessage).replace(/\\n/g, "<br>");
      }
    },
    legend: { show: false },
    grid: { left: 22, right: 22, top: 34, bottom: labels.length > 12 ? 58 : 34, containLabel: true },
    dataZoom: dataZoom,
    xAxis: { type: "category", data: labels, axisLabel: { color: theme.muted, fontWeight: 700, interval: labels.length > 18 ? 2 : labels.length > 10 ? 1 : 0 }, axisLine: { lineStyle: { color: theme.grid } } },
    yAxis: { type: "value", axisLabel: { color: theme.muted, formatter: compactNumber }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } },
    series: [
      {
        name: activity.isShared ? "Venta conjunta" : "Venta",
        type: "line", smooth: 0.25, connectNulls: false, showSymbol: true, symbol: "circle", symbolSize: 9,
        lineStyle: { color: "#0d9488", width: 3 }, areaStyle: { color: "rgba(13, 148, 136, 0.12)" },
        data: model.periods.map(function (period) { return isFiniteNumber(period.sales) ? { value: roundNumber(period.sales), itemStyle: { color: colors[period.temporalStatus] || "#94a3b8", borderColor: getCurrentTheme() === "dark" ? "#0f172a" : "#ffffff", borderWidth: 2 }, symbol: period.temporalStatus === "HISTORICO_PREVIO" ? "emptyCircle" : period.temporalStatus === "POSTERIOR_AL_FIN" ? "diamond" : "circle" } : null; }),
        markArea: activity.dateStatus === "OK" ? { silent: true, itemStyle: { color: "rgba(13, 148, 136, 0.09)" }, data: [[{ name: "Vigencia", xAxis: startPeriod }, { xAxis: endPeriod }]] } : undefined,
        markLine: activity.dateStatus === "OK" ? { silent: true, symbol: ["none", "none"], label: { color: theme.muted, fontWeight: 800 }, lineStyle: { type: "dashed", width: 2 }, data: [{ name: "Inicio " + formatIsoDate(activity.startDate), xAxis: startPeriod, lineStyle: { color: "#2563eb" } }, { name: "Fin " + formatIsoDate(activity.endDate), xAxis: endPeriod, lineStyle: { color: "#64748b" } }] } : undefined
      },
      {
        name: "Objetivo mensual", type: "line", smooth: false, connectNulls: false, symbol: "none",
        lineStyle: { color: "#f59e0b", width: 2, type: "dashed" }, itemStyle: { color: "#f59e0b" },
        data: model.periods.map(function (period) { return isFiniteNumber(period.objective) ? roundNumber(period.objective) : null; })
      }
    ]
  };
}
function renderNativeTimeline(element, model) {
  if (model.displayMode === "SUMMARY") {
    const latest = model.latestSalesPeriod;
    const counts = { active: 0, future: 0, ended: 0, conflict: 0 };
    model.activities.forEach(function (activity) {
      if (activity.dateStatus !== "OK") counts.conflict += 1;
      else if (latest && latest < periodFromIsoDate(activity.startDate)) counts.future += 1;
      else if (latest && latest > periodFromIsoDate(activity.endDate)) counts.ended += 1;
      else counts.active += 1;
    });
    element.innerHTML = '<div class="timeline-summary-state"><strong>Selección amplia: ' + formatInteger(model.activities.length) + ' actividades</strong><div><span>Vigentes: <b>' + formatInteger(counts.active) + '</b></span><span>Aún no iniciadas: <b>' + formatInteger(counts.future) + '</b></span><span>Finalizadas: <b>' + formatInteger(counts.ended) + '</b></span><span>Fechas conflictivas: <b>' + formatInteger(counts.conflict) + '</b></span></div><p>Se muestra un resumen porque la selección supera el límite de ' + formatInteger(model.maxGanttRows) + ' filas detalladas.</p></div>';
    return;
  }
  if (model.displayMode === "GANTT") {
    element.innerHTML = buildNativeTimelineHistory(model) + '<div class="timeline-gantt">' + model.visibleActivities.map(function (activity) { return buildNativeGanttRow(activity, model); }).join("") + '</div>' + (model.hiddenActivityCount ? '<p class="timeline-limit-note">' + formatInteger(model.hiddenActivityCount) + ' actividad(es) adicionales no se dibujan.</p>' : "");
    return;
  }
  element.innerHTML = '<div class="native-timeline-list">' + model.periods.map(function (period) {
    const sale = isFiniteNumber(period.sales) ? '<strong>' + escapeHtml(formatNumber(period.sales)) + '</strong>' : '<strong>Sin ventas disponibles</strong>';
    return '<article class="native-timeline-period is-' + period.temporalStatus.toLocaleLowerCase("es-CO").replace(/_/g, "-") + '"><span class="timeline-period-marker" aria-hidden="true"></span><div><small>' + escapeHtml(period.periodLabel) + '</small>' + sale + '<span>' + escapeHtml(formatTimelineStatusLabel(period.temporalStatus)) + '</span></div></article>';
  }).join("") + '</div>';
}
function buildNativeTimelineHistory(model) {
  const historical = model.periods.filter(function (item) { return item.temporalStatus === "HISTORICO_PREVIO" && isFiniteNumber(item.sales); });
  if (!historical.length) return "";
  return '<div class="timeline-client-history"><strong>Histórico de ventas del cliente</strong>' + historical.map(function (item) { return '<span><small>' + escapeHtml(item.periodLabel) + '</small><b>' + escapeHtml(formatNumber(item.sales)) + '</b></span>'; }).join("") + '</div>';
}
function buildNativeGanttRow(activity, model) {
  if (activity.dateStatus === "FECHAS_CONFLICTIVAS") return '<article class="timeline-gantt-row is-conflict"><button type="button" data-timeline-action="filter-activity" data-timeline-activity="' + escapeHtml(activity.activityId) + '">' + escapeHtml(activity.activityId) + '</button><div>Fechas conflictivas · sin banda</div></article>';
  if (activity.dateStatus !== "OK" || !model.periodRange) return '<article class="timeline-gantt-row is-conflict"><button type="button" data-timeline-action="filter-activity" data-timeline-activity="' + escapeHtml(activity.activityId) + '">' + escapeHtml(activity.activityId) + '</button><div>Fecha final no disponible · vigencia incompleta</div></article>';
  const rangeMonths = Math.max(1, canonicalMonthDistance(model.periodRange.firstPeriodKey, model.periodRange.lastPeriodKey) + 1);
  const left = Math.max(0, canonicalMonthDistance(model.periodRange.firstPeriodKey, periodFromIsoDate(activity.startDate))) / rangeMonths * 100;
  const right = Math.min(rangeMonths, canonicalMonthDistance(model.periodRange.firstPeriodKey, periodFromIsoDate(activity.endDate)) + 1) / rangeMonths * 100;
  const width = Math.max(2, right - left);
  return '<article class="timeline-gantt-row"><button type="button" data-timeline-action="filter-activity" data-timeline-activity="' + escapeHtml(activity.activityId) + '" aria-label="Filtrar por actividad ' + escapeHtml(activity.activityId) + '">' + escapeHtml(activity.activityId) + '</button><div class="timeline-gantt-track"><span style="left:' + left.toFixed(2) + '%;width:' + width.toFixed(2) + '%"></span></div><small>' + escapeHtml(formatIsoDate(activity.startDate) + " – " + formatIsoDate(activity.endDate) + " · " + (activity.isShared ? "Compartida · " + activity.associatedClientCount + " clientes" : "Individual") + " · Objetivo " + formatAvailableMetric(activity.objectiveMonthly)) + '</small></article>';
}
function buildTimelineConflictMarkup(activity) {
  return '<div class="timeline-conflict"><i data-lucide="triangle-alert"></i><div><strong>No se puede construir una línea de tiempo confiable.</strong><p>La actividad ' + escapeHtml(activity.activityId) + ' contiene más de una combinación de fechas de inicio o finalización. No se dibuja una banda falsa.</p></div></div>';
}
function formatTimelineStatusLabel(status) {
  const labels = { HISTORICO_PREVIO: "Histórico previo · no participa en cumplimiento", PERIODO_COMPARABLE: "Período comparable", VIGENTE_SIN_VENTA_ATRIBUIBLE: "Vigente sin venta atribuible", VENTA_ACTIVIDAD_AMBIGUA: "Venta ambigua", REQUIERE_DISTRIBUCION_MULTIACTIVIDAD: "Requiere distribución multiactividad", POSTERIOR_AL_FIN: "Posterior al fin", FECHAS_CONFLICTIVAS: "Fechas conflictivas", SIN_OBJETIVO: "Sin objetivo", OBJETIVO_CONFLICTIVO: "Objetivo conflictivo", SIN_INFORMACION: "Sin información" };
  return labels[status] || status;
}
function renderRegisteredChart(id, analysis) {
  if (id === "negotiationTimeline") return renderNegotiationTimeline(analysis.timeline);
  if (id === "activityContribution") return renderChart("chartActivityContribution", "bar", analysis.kpis.selectedActivity.contributionRows.filter(function (row) { return isFiniteNumber(row.sales); }).map(function (row) {
    return { label: row.clientId, value: row.sales };
  }), false, true, null, { showLabels: true, onClick: function (clientId, eventInfo) { chartDrilldowns.activityContribution.open(analysis.kpis.selectedActivity, eventInfo && eventInfo.sourceElement); }, actionLabel: "Explorar contribuciones de la actividad" });
  if (id === "activityPerformance") return renderChart("chartActivityPerformance", "bar", analysis.activityPerformance.filter(function (item) { return item.comparable; }).sort(function (a, b) { return b.achievement - a.achievement; }).slice(0, 12).map(function (item) {
    return { label: item.activityId, value: item.achievement };
  }), true, true, "ID Actividad");
  if (id === "presentationStatus") return renderChart("chartPresentationStatus", "donut", analysis.presentationStatus, false, false, null, { integerValues: true });
  if (id === "category") return renderChart("chartCategoria", chooseCompositionChartType(analysis.categorySales, { treemapLimit: 12, fallbackType: "bar" }), analysis.categorySales, false, true, "Categoría AS400 de la venta");
  if (id === "presentations") return renderChart("chartPresentaciones", "lollipop", analysis.presentationSales, false, true, "Presentación AS400 de la venta - Texto");
  if (id === "clients") return renderChart("chartClientes", "bar", analysis.chartData.clients, false, true, "Cliente SAP - Clave");
  if (id === "regions") return renderRegionSalesMap(analysis.rows, analysis.chartData.regions);
  if (id === "channels") return renderChart("chartCanal", "bar", analysis.chartData.channels, false, true, "Canal");
  if (id === "cedi") return renderChart("chartCedi", "bar", analysis.chartData.cediCompliance.slice(0, 12), true, true, "Cedi");
}
function renderRegionSalesMap(rows, preparedItems) {
  const element = document.getElementById("chartRegion");
  if (!element) return;
  const regionItems = preparedItems || groupUniqueTotalSalesByField(rows, "Región SAP", 12);
  const model = buildSapRegionMapModel(regionItems);
  const signature = JSON.stringify({ items: model.rankingItems, theme: getCurrentTheme(), echarts: Boolean(window.echarts), fetch: Boolean(window.fetch) });
  if (state.chartSignatures.get("region:model") === signature) return;
  state.chartSignatures.set("region:model", signature);
  const renderToken = ++regionMapRenderToken;
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
    reportDashboardDiagnostic("warning", "map-cdn", error, "No se pudo cargar el mapa; se usa ranking nativo.");
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
    chart.setOption(buildRegionMapOption(model), { notMerge: true, lazyUpdate: true });
    chart.on("click", function (params) {
      const data = params && params.data ? params.data : null;
      if (data && data.sapRegion) applyChartFilter("Región SAP", data.sapRegion);
    });
    chartInstances.chartRegionMap = chart;
    state.performance.counters.chartInitializations += 1;
    state.performance.counters.chartUpdates += 1;
    bindNativeChartInteractions(element, {});
  } catch (error) {
    reportDashboardDiagnostic("warning", "map-render", error, "No se pudo renderizar el mapa; se usa ranking nativo.");
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
    reportDashboardDiagnostic("warning", "map-dispose", error, "No se pudo liberar la instancia previa del mapa.");
  }
  delete chartInstances.chartRegionMap;
  state.performance.counters.chartDisposals += 1;
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
function renderChartMessage(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    disposeChartInstance(elementId);
    setChartCardEmptyState(element, true);
    element.innerHTML = buildEmptyStateMarkup(message, "info");
    state.chartSignatures.set(elementId, "message:" + message);
  } else {
    reportDashboardDiagnostic("warning", "chart-container", null, "No se encontró el contenedor " + elementId + ".");
  }
}
function setChartCardEmptyState(element, empty) {
  const card = element && element.closest ? element.closest(".chart-card") : null;
  if (card && card.classList) card.classList.toggle("chart-empty", Boolean(empty));
}
function buildEmptyStateMarkup(message, tone) {
  const normalizedTone = tone === "warning" || tone === "error" ? tone : "info";
  const icon = normalizedTone === "warning" ? "triangle-alert" : normalizedTone === "error" ? "circle-x" : "circle-help";
  const title = normalizedTone === "warning" ? "Revisión necesaria" : normalizedTone === "error" ? "No se pudo mostrar" : "Información no disponible";
  return "<div class=\\"empty-state empty-state-" + normalizedTone + "\\"><i data-lucide=\\"" + icon + "\\" aria-hidden=\\"true\\"></i><strong>" + title + "</strong><span>" + escapeHtml(message) + "</span></div>";
}
function renderChart(elementId, type, items, asPercent, horizontal, filterField, options) {
  const element = document.getElementById(elementId);
  if (!element) {
    reportDashboardDiagnostic("warning", "chart-container", null, "No se encontró el contenedor " + elementId + ".");
    return;
  }
  options = options || {};
  const chartItems = normalizeChartItems(items);
  const signature = JSON.stringify({
    type: type, items: chartItems, asPercent: Boolean(asPercent), horizontal: Boolean(horizontal),
    filterField: filterField || "", theme: getCurrentTheme(),
    integerValues: Boolean(options.integerValues), showLabels: Boolean(options.showLabels),
    includePercentTooltip: Boolean(options.includePercentTooltip), tooltipNote: options.tooltipNote || "",
    actionLabel: options.actionLabel || "", hasCustomClick: typeof options.onClick === "function"
  });
  if (state.chartSignatures.get(elementId) === signature) return;
  if (!hasRenderableChartData(chartItems)) {
    disposeChartInstance(elementId);
    setChartCardEmptyState(element, true);
    element.innerHTML = buildEmptyStateMarkup("No hay datos para mostrar con los filtros seleccionados.", "info");
    state.chartSignatures.set(elementId, signature);
    return;
  }
  setChartCardEmptyState(element, false);
  if (!window.echarts) {
    reportDashboardDiagnostic("warning", "chart-fallback", null, "Se usa fallback nativo para " + elementId + ".");
    renderNativeChart(element, type, chartItems, asPercent, horizontal, filterField, options);
    state.chartSignatures.set(elementId, signature);
    state.performance.counters.chartUpdates += 1;
    return;
  }
  try {
    let chart = chartInstances[elementId];
    if (!chart) {
      element.innerHTML = "";
      chart = window.echarts.init(element, null, { renderer: "canvas" });
      chartInstances[elementId] = chart;
      state.performance.counters.chartInitializations += 1;
    }
    chart.setOption(buildEChartOption(type, chartItems, asPercent, horizontal, options), { notMerge: true, lazyUpdate: true });
    if (chart.off) chart.off("click");
    if (typeof options.onClick === "function") {
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
    state.chartSignatures.set(elementId, signature);
    state.performance.counters.chartUpdates += 1;
  } catch (error) {
    reportDashboardDiagnostic("warning", "chart-render", error, "Se usa fallback nativo para " + elementId + ".");
    disposeChartInstance(elementId);
    renderNativeChart(element, type, chartItems, asPercent, horizontal, filterField, options);
    state.chartSignatures.set(elementId, signature);
  }
}
function disposeChartInstance(elementId) {
  if (!chartInstances[elementId]) {
    state.chartSignatures.delete(elementId);
    return;
  }
  try {
    chartInstances[elementId].dispose();
  } catch (error) {
    reportDashboardDiagnostic("warning", "chart-dispose", error, "No se pudo liberar " + elementId + ".");
  }
  delete chartInstances[elementId];
  state.chartSignatures.delete(elementId);
  state.performance.counters.chartDisposals += 1;
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
function chooseCompositionChartType(items, options) {
  options = options || {};
  const count = normalizeChartItems(items).filter(function (item) { return item.value > 0; }).length;
  if (options.donutLimit && count >= 2 && count <= options.donutLimit) return "donut";
  if (options.treemapLimit && count >= 2 && count <= options.treemapLimit) return "treemap";
  return options.fallbackType || "bar";
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
      tooltip: Object.assign({ trigger: "item", formatter: function (params) {
        const value = numberForCalc(params && params.value);
        const percent = total ? value / total : 0;
        const note = options.tooltipNote ? "<br><span style=\\"font-weight:600;color:" + theme.muted + "\\">" + escapeHtml(options.tooltipNote) + "</span>" : "";
        return "<strong>" + escapeHtml(params && params.name ? params.name : "") + "</strong><br>Valor: " + escapeHtml(valueFormatter(value)) + "<br>Participación: " + escapeHtml(formatRatioPercent(percent)) + note;
      } }, tooltip),
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
  if (type === "treemap") {
    return {
      color: colors,
      tooltip: Object.assign({ trigger: "item", formatter: function (params) {
        const value = numberForCalc(params && params.value);
        const percent = total ? value / total : 0;
        const note = options.tooltipNote ? "<br><span style=\\"font-weight:600;color:" + theme.muted + "\\">" + escapeHtml(options.tooltipNote) + "</span>" : "";
        return "<strong>" + escapeHtml(params && params.name ? params.name : "") + "</strong><br>Valor: " + escapeHtml(valueFormatter(value)) + "<br>Participación: " + escapeHtml(formatRatioPercent(percent)) + note;
      } }, tooltip),
      series: [{
        type: "treemap", roam: false, nodeClick: false, breadcrumb: { show: false }, visibleMin: 1,
        top: 8, right: 8, bottom: 8, left: 8,
        label: { show: true, color: "#ffffff", fontWeight: 800, overflow: "truncate", formatter: function (params) { return params.name + "\\n" + valueFormatter(params.value); } },
        upperLabel: { show: false }, itemStyle: { borderColor: theme.tooltipBg, borderWidth: 3, gapWidth: 2, borderRadius: 7 },
        emphasis: { label: { show: true }, itemStyle: { shadowBlur: 10, shadowColor: "rgba(15, 23, 42, 0.22)" } },
        data: items.map(function (item) { return { name: item.label, value: roundChartValue(item.value, options) }; })
      }]
    };
  }
  if (type === "lollipop") {
    const ranked = items.slice().reverse();
    const rankedLabels = ranked.map(function (item) { return item.label; });
    const rankedValues = ranked.map(function (item) { return roundChartValue(item.value, options); });
    return {
      color: colors,
      tooltip: Object.assign({ trigger: "item", formatter: function (params) {
        const data = params && params.data ? params.data : {};
        return "<strong>" + escapeHtml(data.name || params.name || "") + "</strong><br>Ventas: " + escapeHtml(valueFormatter(data.rawValue));
      } }, tooltip),
      grid: { left: 18, right: 28, top: 18, bottom: 22, containLabel: true },
      xAxis: { type: "value", axisLabel: { color: theme.muted, formatter: compactNumber }, splitLine: { lineStyle: { color: theme.grid, type: "dashed" } } },
      yAxis: { type: "category", data: rankedLabels, axisLabel: { color: theme.muted, fontWeight: 700, width: 132, overflow: "truncate" }, axisLine: { lineStyle: { color: theme.grid } } },
      series: [{
        type: "bar", silent: true, tooltip: { show: false }, barWidth: 3, itemStyle: { color: theme.grid }, data: rankedValues
      }, {
        type: "scatter", symbol: "circle", symbolSize: 13,
        itemStyle: { color: colors[0], borderColor: theme.tooltipBg, borderWidth: 2 },
        label: options.showLabels ? { show: true, position: "right", color: theme.text, fontWeight: 800, formatter: function (params) { return valueFormatter(params.data.rawValue); } } : undefined,
        data: ranked.map(function (item) { return { name: item.label, value: [roundChartValue(item.value, options), item.label], rawValue: item.value }; })
      }]
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
    disposeChartInstance(key);
  });
  state.chartSignatures.clear();
}
function debounce(fn, delay) {
  let timeout;
  const debounced = function () {
    const args = arguments;
    window.clearTimeout(timeout);
    timeout = window.setTimeout(function () {
      timeout = null;
      fn.apply(null, args);
    }, delay || 150);
  };
  debounced.cancel = function () {
    if (timeout !== null && timeout !== undefined) window.clearTimeout(timeout);
    timeout = null;
  };
  return debounced;
}
function resizeCharts() {
  if (document.hidden) {
    return;
  }
  Object.keys(chartInstances).forEach(function (key) {
    try {
      chartInstances[key].resize();
    } catch (error) {
      reportDashboardDiagnostic("warning", "chart-resize", error, "No se pudo redimensionar " + key + ".");
    }
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
  if (type === "treemap") {
    renderNativeTreemapChart(element, items, asPercent, filterField, options);
    bindNativeChartInteractions(element, options);
    return;
  }
  if (type === "lollipop") {
    renderNativeLollipopChart(element, items, asPercent, filterField, options);
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
function renderNativeTreemapChart(element, items, asPercent, filterField, options) {
  options = options || {};
  const total = items.reduce(function (acc, item) { return acc + Math.max(0, item.value); }, 0) || 1;
  element.innerHTML = "<div class=\\"native-treemap\\">" + items.map(function (item) {
    const columns = Math.max(3, Math.min(12, Math.round(Math.max(0, item.value) / total * 24)));
    const valueText = formatChartValue(item.value, asPercent, options);
    const interactionAttrs = buildNativeChartInteractionAttrs(filterField, item.label, options);
    return "<div class=\\"native-treemap-item\\" style=\\"grid-column:span " + columns + "\\" title=\\"" + escapeHtml(item.label + ": " + valueText) + "\\"" + interactionAttrs + "><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(valueText) + "</strong></div>";
  }).join("") + "</div>";
}
function renderNativeLollipopChart(element, items, asPercent, filterField, options) {
  options = options || {};
  const max = Math.max.apply(null, items.map(function (item) { return Math.abs(item.value); })) || 1;
  element.innerHTML = "<div class=\\"native-lollipop\\">" + items.map(function (item) {
    const size = Math.max(2, Math.min(100, Math.abs(item.value) / max * 100));
    const valueText = formatChartValue(item.value, asPercent, options);
    const interactionAttrs = buildNativeChartInteractionAttrs(filterField, item.label, options);
    return "<div class=\\"native-lollipop-row\\" title=\\"" + escapeHtml(item.label + ": " + valueText) + "\\"" + interactionAttrs + "><span class=\\"native-lollipop-label\\">" + escapeHtml(item.label) + "</span><span class=\\"native-lollipop-track\\"><span class=\\"native-lollipop-stem\\" style=\\"width:" + size.toFixed(2) + "%\\"></span><i class=\\"native-lollipop-dot\\" style=\\"left:" + size.toFixed(2) + "%\\"></i></span><strong>" + escapeHtml(valueText) + "</strong></div>";
  }).join("") + "</div>";
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
    page: 1,
    selectedKey: "",
    selectedRow: null,
    selectedClientIds: [],
    opener: null,
    message: "",
    searchTexts: [],
    viewCache: null
  };
}
function getWindowScrollPosition() {
  return {
    x: typeof window !== "undefined" ? Number(window.scrollX || window.pageXOffset || 0) : 0,
    y: typeof window !== "undefined" ? Number(window.scrollY || window.pageYOffset || 0) : 0
  };
}
function lockPageScroll() {
  pageScrollLock.count += 1;
  if (pageScrollLock.count > 1) return;
  const body = document && document.body;
  const root = document && document.documentElement;
  if (!body || !body.style) return;
  const position = getWindowScrollPosition();
  pageScrollLock.scrollX = position.x;
  pageScrollLock.scrollY = position.y;
  pageScrollLock.bodyStyle = {
    position: body.style.position, top: body.style.top, left: body.style.left,
    right: body.style.right, width: body.style.width, overflow: body.style.overflow,
    paddingRight: body.style.paddingRight
  };
  const scrollbarWidth = root && typeof window !== "undefined" ? Math.max(0, window.innerWidth - root.clientWidth) : 0;
  const computedPadding = typeof window !== "undefined" && window.getComputedStyle
    ? parseFloat(window.getComputedStyle(body).paddingRight) || 0
    : parseFloat(body.style.paddingRight) || 0;
  body.style.position = "fixed";
  body.style.top = "-" + pageScrollLock.scrollY + "px";
  body.style.left = "-" + pageScrollLock.scrollX + "px";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  if (scrollbarWidth) body.style.paddingRight = (computedPadding + scrollbarWidth) + "px";
  if (root && root.classList) root.classList.add("modal-scroll-locked");
}
function unlockPageScroll(force) {
  if (force) pageScrollLock.count = Math.min(pageScrollLock.count, 1);
  if (pageScrollLock.count <= 0) return;
  pageScrollLock.count -= 1;
  if (pageScrollLock.count > 0) return;
  const body = document && document.body;
  const root = document && document.documentElement;
  const saved = pageScrollLock.bodyStyle;
  if (body && body.style && saved) Object.keys(saved).forEach(function (property) { body.style[property] = saved[property]; });
  if (root && root.classList) root.classList.remove("modal-scroll-locked");
  if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(pageScrollLock.scrollX, pageScrollLock.scrollY);
  pageScrollLock.bodyStyle = null;
  pageScrollLock.touchY = null;
}
function isNavigableModalType(type) {
  return type === "clientTrackingDetail" || type === "activityContribution" || type === "activityDetail" || type === "negotiationUsageRelations" || type === "negotiationUsageNegotiations" || type === "negotiationUsagePresentations";
}
function cloneDetailExplorerForNavigation(explorer) {
  return Object.assign({}, explorer, {
    allRows: explorer.allRows,
    selectedClientIds: (explorer.selectedClientIds || []).slice(),
    searchTexts: explorer.searchTexts,
    viewCache: explorer.viewCache
  });
}
function captureModalScrollState() {
  const body = document.getElementById("detailExplorerBody");
  const tableWrap = body && body.querySelector ? body.querySelector(".detail-table-wrap") : null;
  return { bodyTop: body ? Number(body.scrollTop || 0) : 0, bodyLeft: body ? Number(body.scrollLeft || 0) : 0, tableTop: tableWrap ? Number(tableWrap.scrollTop || 0) : 0, tableLeft: tableWrap ? Number(tableWrap.scrollLeft || 0) : 0 };
}
function restoreModalScrollState(scrollState) {
  const body = document.getElementById("detailExplorerBody");
  const tableWrap = body && body.querySelector ? body.querySelector(".detail-table-wrap") : null;
  if (body) { body.scrollTop = scrollState.bodyTop || 0; body.scrollLeft = scrollState.bodyLeft || 0; }
  if (tableWrap) { tableWrap.scrollTop = scrollState.tableTop || 0; tableWrap.scrollLeft = scrollState.tableLeft || 0; }
}
function captureClientTrackingTableView() {
  const wrap = document.querySelector ? document.querySelector(".client-tracking-table-wrap") : null;
  return {
    tableState: Object.assign({}, state.clientTrackingTable),
    tableScrollLeft: wrap ? Number(wrap.scrollLeft || 0) : 0,
    windowScroll: getWindowScrollPosition()
  };
}
function pushModalNavigationSnapshot() {
  const stack = state.modalNavigation.stack;
  if (state.detailExplorer.isOpen) {
    stack.push({ kind: "modal", explorer: cloneDetailExplorerForNavigation(state.detailExplorer), scroll: captureModalScrollState() });
  } else {
    const tableView = captureClientTrackingTableView();
    stack.push({ kind: "dashboard", tableState: tableView.tableState, tableScrollLeft: tableView.tableScrollLeft, windowScroll: tableView.windowScroll });
  }
  if (stack.length > 12) stack.shift();
}
function syncModalBackButton() {
  const button = document.getElementById("detailExplorerBack");
  if (button) button.hidden = !state.modalNavigation.stack.length;
}
function navigateModalBack() {
  const snapshot = state.modalNavigation.stack.pop();
  if (!snapshot) {
    closeDetailExplorer();
    return;
  }
  if (snapshot.kind === "dashboard") {
    state.clientTrackingTable = Object.assign(getEmptyClientTrackingTableState(), snapshot.tableState || {});
    closeDetailExplorer({ preserveNavigation: true, restoreFocus: false });
    renderClientTrackingTable();
    const restoreDashboardView = function () {
      const wrap = document.querySelector ? document.querySelector(".client-tracking-table-wrap") : null;
      if (wrap) wrap.scrollLeft = snapshot.tableScrollLeft || 0;
      if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(snapshot.windowScroll && snapshot.windowScroll.x || 0, snapshot.windowScroll && snapshot.windowScroll.y || 0);
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(restoreDashboardView); else restoreDashboardView();
    return;
  }
  state.detailExplorer = cloneDetailExplorerForNavigation(snapshot.explorer);
  renderDetailExplorer();
  const overlay = document.getElementById("detailExplorerOverlay");
  const dialog = document.getElementById("detailExplorerDialog");
  if (overlay) overlay.hidden = false;
  if (dialog && dialog.dataset) dialog.dataset.layout = state.detailExplorer.config && state.detailExplorer.config.compact ? "compact" : state.detailExplorer.config && state.detailExplorer.config.wide ? "wide" : "standard";
  const restoreModalView = function () { restoreModalScrollState(snapshot.scroll || {}); if (dialog && dialog.focus) dialog.focus(); };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(restoreModalView); else restoreModalView();
}
function getDetailExplorerState() {
  return state.detailExplorer;
}
function getModalNavigationSnapshot() {
  return { depth: state.modalNavigation.stack.length, scrollLockCount: pageScrollLock.count, savedScrollX: pageScrollLock.scrollX, savedScrollY: pageScrollLock.scrollY };
}
function setDetailExplorerQuery(query) {
  if (!state.detailExplorer.isOpen) return;
  state.detailExplorer.query = query || "";
  state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
  state.detailExplorer.page = 1;
  state.detailExplorer.selectedKey = "";
  state.detailExplorer.selectedRow = null;
  state.detailExplorer.viewCache = null;
  renderDetailExplorer();
}
function setDetailExplorerSort(field, dir) {
  if (!state.detailExplorer.isOpen) return;
  state.detailExplorer.sortField = field || state.detailExplorer.sortField;
  state.detailExplorer.sortDir = dir === "desc" ? "desc" : "asc";
  state.detailExplorer.page = 1;
  state.detailExplorer.viewCache = null;
  renderDetailExplorer();
}
function bindDetailExplorerEvents() {
  const overlay = document.getElementById("detailExplorerOverlay");
  if (!overlay || detailExplorerEventsBound) return;
  detailExplorerEventsBound = true;
  const closeButton = document.getElementById("detailExplorerClose");
  if (closeButton) closeButton.addEventListener("click", closeDetailExplorer);
  overlay.addEventListener("mousedown", function (event) {
    if (event.target === overlay) closeDetailExplorer();
  });
  detailSearchDebounced = debounce(function (value) {
    if (!state.detailExplorer.isOpen) return;
    state.detailExplorer.query = value;
    state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
    state.detailExplorer.page = 1;
    state.detailExplorer.selectedKey = "";
    state.detailExplorer.selectedRow = null;
    state.detailExplorer.viewCache = null;
    renderDetailExplorer();
  }, 150);
  overlay.addEventListener("input", function (event) {
    if (event.target && event.target.id === "detailExplorerSearch") {
      detailSearchDebounced(event.target.value);
    }
  });
  overlay.addEventListener("change", function (event) {
    if (event.target && event.target.id === "detailExplorerSort") {
      const option = getDetailExplorerSortOption(event.target.value);
      state.detailExplorer.sortField = option.field;
      state.detailExplorer.sortDir = option.dir;
      state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
      state.detailExplorer.page = 1;
      state.detailExplorer.viewCache = null;
      renderDetailExplorer();
    }
  });
  overlay.addEventListener("click", handleDetailExplorerClick);
  overlay.addEventListener("keydown", handleDetailExplorerKeydown);
  overlay.addEventListener("wheel", handleDetailExplorerWheel, { passive: false });
  overlay.addEventListener("touchstart", handleDetailExplorerTouchStart, { passive: true });
  overlay.addEventListener("touchmove", handleDetailExplorerTouchMove, { passive: false });
  document.addEventListener("keydown", handleDetailExplorerDocumentKeydown);
}
function findModalScroller(target, deltaY) {
  const dialog = document.getElementById("detailExplorerDialog");
  let node = target;
  while (node && node !== dialog) {
    if (node.scrollHeight > node.clientHeight) {
      const canMoveUp = deltaY < 0 && node.scrollTop > 0;
      const canMoveDown = deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      if (canMoveUp || canMoveDown || deltaY === 0) return node;
    }
    node = node.parentElement;
  }
  return null;
}
function handleDetailExplorerWheel(event) {
  if (!state.detailExplorer.isOpen || event.deltaY === 0) return;
  if (!findModalScroller(event.target, event.deltaY)) event.preventDefault();
}
function handleDetailExplorerTouchStart(event) {
  const touch = event.touches && event.touches[0];
  pageScrollLock.touchY = touch ? touch.clientY : null;
}
function handleDetailExplorerTouchMove(event) {
  if (!state.detailExplorer.isOpen) return;
  const touch = event.touches && event.touches[0];
  if (!touch || pageScrollLock.touchY === null) return;
  const deltaY = pageScrollLock.touchY - touch.clientY;
  pageScrollLock.touchY = touch.clientY;
  if (!findModalScroller(event.target, deltaY)) event.preventDefault();
}
function handleDetailExplorerClick(event) {
  const target = event.target && event.target.closest ? event.target.closest("[data-detail-action], [data-detail-row-key]") : null;
  if (!target) return;
  const action = target.dataset.detailAction;
  if (action === "navigate-back") {
    navigateModalBack();
    return;
  }
  if (action === "clear-search") {
    state.detailExplorer.query = "";
    state.detailExplorer.visibleCount = DETAIL_EXPLORER_VISIBLE_STEP;
    state.detailExplorer.page = 1;
    state.detailExplorer.viewCache = null;
    renderDetailExplorer();
    return;
  }
  if (action === "show-more") {
    state.detailExplorer.visibleCount += DETAIL_EXPLORER_VISIBLE_STEP;
    renderDetailExplorer();
    return;
  }
  if (action === "page-prev" || action === "page-next") {
    const total = getDetailExplorerSortedRows().length;
    const pageCount = Math.max(1, Math.ceil(total / DETAIL_EXPLORER_VISIBLE_STEP));
    state.detailExplorer.page = Math.max(1, Math.min(pageCount, state.detailExplorer.page + (action === "page-next" ? 1 : -1)));
    renderDetailExplorer();
    return;
  }
  if (action === "usage-view-negotiations") {
    const client = state.detailExplorer.allRows.find(function (row) { return row.clientKey === target.dataset.clientKey; });
    if (client) openNegotiationUsagePresentations(client, target);
    return;
  }
  if (action === "usage-view-presentations") {
    const negotiation = state.detailExplorer.allRows.find(function (row) { return row.relationKey === target.dataset.relationKey; });
    const client = state.detailExplorer.config && state.detailExplorer.config.exportContext;
    if (client && negotiation) openNegotiationUsageNegotiationPresentations(client, negotiation, target);
    return;
  }
  if (action === "usage-view-client" || action === "usage-view-activity") {
    navigateFromNegotiationUsage(target.dataset.relationKey, action);
    return;
  }
  if (action === "open-category") {
    openNoSalesCategoryDetail(target.dataset.detailCategory, state.detailExplorer.config.analysis, state.detailExplorer.opener, { skipFocus: true });
    return;
  }
  if (action === "back-categories") {
    openNoSalesCategoryExplorer(state.detailExplorer.opener, { skipFocus: true }, state.detailExplorer.config.analysis);
    return;
  }
  if (action === "back-list") {
    if (state.modalNavigation.stack.length && isNavigableModalType(state.detailExplorer.type)) {
      navigateModalBack();
      return;
    }
    state.detailExplorer.selectedKey = "";
    state.detailExplorer.selectedRow = null;
    renderDetailExplorer();
    return;
  }
  if (action === "sort-dir") {
    state.detailExplorer.sortDir = state.detailExplorer.sortDir === "asc" ? "desc" : "asc";
    state.detailExplorer.viewCache = null;
    renderDetailExplorer();
    return;
  }
  if (action === "export-csv") {
    exportDetailExplorerCsv();
    return;
  }
  if (action === "tracking-detail-csv") {
    exportClientTrackingDetailCsv(state.detailExplorer.config && state.detailExplorer.config.trackingRow);
    return;
  }
  if (action === "tracking-view-client" || action === "tracking-view-activity") {
    navigateFromClientTrackingDetail(action);
    return;
  }
  if (action === "tracking-open-contribution") {
    openClientTrackingContribution(target);
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
  const target = event.target;
  const interactive = target && (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].indexOf(target.tagName) !== -1 || target.isContentEditable);
  if (!interactive && ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].indexOf(event.key) !== -1) {
    const body = document.getElementById("detailExplorerBody");
    if (body) {
      const amount = event.key === "ArrowUp" ? -48 : event.key === "ArrowDown" ? 48 : event.key === "PageUp" ? -Math.max(120, body.clientHeight * 0.8) : event.key === "PageDown" || event.key === " " ? Math.max(120, body.clientHeight * 0.8) : 0;
      if (event.key === "Home") body.scrollTop = 0;
      else if (event.key === "End") body.scrollTop = body.scrollHeight;
      else if (body.scrollBy) body.scrollBy({ top: amount, behavior: "auto" });
      else body.scrollTop += amount;
      event.preventDefault();
      return;
    }
  }
  if (event.key === "Tab") trapDetailExplorerFocus(event);
}
function openNegotiationUsageExplorer(opener, options, analysis) {
  openDetailExplorer(buildNegotiationUsageExplorerConfig(analysis || state.negotiationUsageAnalysis), opener || document.activeElement, options);
}
function getNegotiationUsageCompatibleFilters(filters) {
  const result = {};
  Object.keys(filters || {}).forEach(function (field) {
    if (["A\u00f1o", "Mes", "A\u00f1o Mes"].indexOf(field) === -1) result[field] = filters[field];
  });
  return result;
}
function openNegotiationUsagePresentations(client, opener, options) {
  openDetailExplorer(buildNegotiationUsagePresentationConfig(client), opener || document.activeElement, options);
}
function openNegotiationUsageNegotiationPresentations(client, negotiation, opener, options) {
  openDetailExplorer(buildNegotiationUsageNegotiationPresentationsConfig(client, negotiation), opener || document.activeElement, options);
}
function openNoSalesCategoryExplorer(opener, options, analysis) {
  openDetailExplorer(buildNoSalesCategoryExplorerConfig(analysis || getEmptyNoSalesAnalysis()), opener || document.activeElement, options);
}
function openNoSalesCategoryDetail(category, analysis, opener, options) {
  openDetailExplorer(buildNoSalesCategoryDetailConfig(category, analysis || getEmptyNoSalesAnalysis()), opener || document.activeElement, options);
}
function syncOpenDetailExplorer() {
  if (!state.detailExplorer.isOpen) return;
  if (state.detailExplorer.type === "clientTrackingDetail") {
    const key = state.detailExplorer.category;
    const rows = state.analyses && state.analyses.clientActivitySummary || [];
    const row = ensureClientTrackingRelationIndex(rows).get(key);
    if (row) openDetailExplorer(buildClientTrackingDetailConfig(getClientTrackingDetailModel(row)), state.detailExplorer.opener, { preserveState: true, skipFocus: true });
    else closeDetailExplorer();
    return;
  }
  if (state.detailExplorer.type === "activityContribution" || state.detailExplorer.type === "activityDetail") {
    const activity = state.analyses && state.analyses.activityPerformance.find(function (item) {
      return item.activityId === state.detailExplorer.category;
    });
    if (activity) openActivityContributionDetail(activity, state.detailExplorer.opener, { preserveState: true, skipFocus: true });
    return;
  }
  if (state.detailExplorer.type !== "negotiationUsageRelations") return;
  const config = buildNegotiationUsageExplorerConfig(state.negotiationUsageAnalysis);
  const message = config.rows.length ? "" : "La selección anterior ya no tiene datos con los filtros actuales.";
  openDetailExplorer(config, state.detailExplorer.opener, { preserveState: true, skipFocus: true, message: message });
}
function openDetailExplorer(config, opener, options) {
  options = options || {};
  const previous = state.detailExplorer;
  const wasOpen = previous.isOpen;
  if (!options.preserveState && !options.skipNavigation && isNavigableModalType(config && config.type)) pushModalNavigationSnapshot();
  const preserve = options.preserveState && previous.isOpen && previous.type === config.type && previous.category === config.category;
  const allRows = (config.rows || []).slice();
  state.detailExplorer = {
    isOpen: true,
    type: config.type,
    category: config.category || "",
    config: config,
    allRows: allRows,
    query: preserve ? previous.query : "",
    sortField: preserve ? previous.sortField : config.defaultSortField,
    sortDir: preserve ? previous.sortDir : config.defaultSortDir,
    visibleCount: preserve ? previous.visibleCount : DETAIL_EXPLORER_VISIBLE_STEP,
    page: preserve ? previous.page : 1,
    selectedKey: preserve ? previous.selectedKey : "",
    selectedRow: preserve ? previous.selectedRow : null,
    selectedClientIds: (config.selectedClientIds || []).slice(),
    opener: opener || previous.opener || null,
    message: options.message || config.message || "",
    searchTexts: allRows.map(function (row) {
      return (config.searchFields || []).map(function (field) {
        return normalizeText(getDetailExplorerRawValueForConfig(row, field, config)).toLocaleLowerCase("es-CO");
      }).join("\u0000");
    }),
    viewCache: null
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
  if (dialog && dialog.dataset) dialog.dataset.layout = config.compact ? "compact" : config.wide ? "wide" : "standard";
  if (!wasOpen) lockPageScroll();
  if (!options.skipFocus && dialog && dialog.focus) dialog.focus();
}
function closeDetailExplorer(options) {
  options = options || {};
  const wasOpen = state.detailExplorer.isOpen;
  const opener = state.detailExplorer.opener;
  if (detailSearchDebounced && detailSearchDebounced.cancel) detailSearchDebounced.cancel();
  state.detailExplorer = getEmptyDetailExplorerState();
  if (!options.preserveNavigation) state.modalNavigation.stack = [];
  const overlay = document.getElementById("detailExplorerOverlay");
  if (overlay) overlay.hidden = true;
  ["detailExplorerSummary", "detailExplorerToolbar", "detailExplorerBody", "detailExplorerSelectionMessage"].forEach(function (id) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = "";
  });
  syncModalBackButton();
  if (wasOpen) unlockPageScroll();
  if (options.restoreFocus !== false && opener && opener.focus) opener.focus();
}
function renderDetailExplorer() {
  return safelyRenderComponent("detail-explorer-render", renderDetailExplorerUnsafe, renderDetailExplorerFailureState);
}
function renderDetailExplorerUnsafe() {
  const explorer = state.detailExplorer;
  if (!explorer.isOpen || !explorer.config) return;
  syncModalBackButton();
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
  if (explorer.config.type === "clientTrackingDetail") renderClientTrackingDetail();
  else if (configIsStandaloneDetail(explorer.config)) renderStandaloneActivityDetail();
  else if (explorer.selectedRow) renderDetailExplorerPresentationDetail();
  else renderDetailExplorerList();
  refreshIcons();
}
function renderDetailExplorerSummary() {
  const container = document.getElementById("detailExplorerSummary");
  if (!container) return;
  const summary = state.detailExplorer.config.summary || [];
  container.innerHTML = summary.map(function (item) {
    return "<article class=\\"detail-metric" + (item.primary ? " is-primary" : "") + "\\"><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong>" + (item.note ? "<small>" + escapeHtml(item.note) + "</small>" : "") + "</article>";
  }).join("");
}
function renderDetailExplorerToolbar() {
  const container = document.getElementById("detailExplorerToolbar");
  if (!container) return;
  if (state.detailExplorer.selectedRow || configIsStandaloneDetail(state.detailExplorer.config)) {
    container.innerHTML = "";
    return;
  }
  const config = state.detailExplorer.config;
  const sortOptions = (config.sortOptions || []).map(function (option) {
    return "<option value=\\"" + escapeHtml(option.field) + "\\"" + (option.field === state.detailExplorer.sortField ? " selected" : "") + ">" + escapeHtml(option.label) + "</option>";
  }).join("");
  const directionIcon = state.detailExplorer.sortDir === "asc" ? "arrow-up-a-z" : "arrow-down-z-a";
  const directionLabel = state.detailExplorer.sortDir === "asc" ? "Ascendente" : "Descendente";
  const backButton = config.backToCategories ? "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"back-categories\\"><i data-lucide=\\"chevron-left\\"></i> Volver a categorías</button>" : "";
  container.innerHTML =
    "<div class=\\"quick-search\\"><i data-lucide=\\"search\\"></i><input id=\\"detailExplorerSearch\\" type=\\"search\\" value=\\"" + escapeHtml(state.detailExplorer.query) + "\\" placeholder=\\"" + escapeHtml(config.searchPlaceholder || "Buscar") + "\\"></div>" +
    "<label>Ordenar<select id=\\"detailExplorerSort\\">" + sortOptions + "</select></label>" +
    "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"sort-dir\\"><i data-lucide=\\"" + directionIcon + "\\"></i> " + directionLabel + "</button>" +
    "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"clear-search\\" aria-label=\\"Limpiar búsqueda del explorador\\"><i data-lucide=\\"x-circle\\"></i> Limpiar búsqueda</button>" +
    backButton +
    "<button class=\\"button button-primary\\" type=\\"button\\" data-detail-action=\\"export-csv\\"><i data-lucide=\\"download\\"></i> CSV</button>";
}
function renderDetailExplorerList() {
  const body = document.getElementById("detailExplorerBody");
  if (!body) return;
  if (state.detailExplorer.config.type === "activityContribution") {
    renderActivityContributionList(body);
    return;
  }
  if (state.detailExplorer.config.type === "negotiationUsageRelations") {
    renderNegotiationUsageRelationList(body);
    return;
  }
  if (state.detailExplorer.config.type === "negotiationUsageNegotiations") {
    renderNegotiationUsageNegotiationList(body);
    return;
  }
  if (state.detailExplorer.config.type === "negotiationUsagePresentations") {
    renderNegotiationUsagePresentationList(body);
    return;
  }
  if (state.detailExplorer.config.type === "noSalesCategories") {
    renderNoSalesCategoryList(body);
    return;
  }
  const rows = getDetailExplorerSortedRows();
  const paginated = Boolean(state.detailExplorer.config.paginated);
  const page = paginated ? state.detailExplorer.page : 1;
  const start = paginated ? (page - 1) * DETAIL_EXPLORER_VISIBLE_STEP : 0;
  const visibleRows = paginated ? rows.slice(start, start + DETAIL_EXPLORER_VISIBLE_STEP) : rows.slice(0, state.detailExplorer.visibleCount);
  const config = state.detailExplorer.config;
  if (!rows.length) {
    body.innerHTML = "<div class=\\"no-data\\">" + escapeHtml(state.detailExplorer.query ? config.searchEmptyMessage || "No hay resultados para la búsqueda." : config.emptyMessage || "No hay datos para mostrar.") + "</div>";
    return;
  }
  const compactLayout = Boolean(window.matchMedia && window.matchMedia("(max-width: 820px)").matches);
  const header = "<thead><tr>" + config.columns.map(function (column) {
    return "<th scope=\\"col\\" data-detail-sort-field=\\"" + escapeHtml(column.id) + "\\">" + escapeHtml(column.label) + "</th>";
  }).join("") + "</tr></thead>";
  const tableRows = compactLayout ? "" : visibleRows.map(function (row, index) {
    const rowKey = config.rowKey(row, index);
    return "<tr>" + config.columns.map(function (column, columnIndex) {
      const numeric = column.numeric ? " numeric" : "";
      const display = escapeHtml(getDetailExplorerCellDisplay(row, column.id));
      const content = columnIndex === 0 ? "<button class=\\"detail-row-link\\" type=\\"button\\" data-detail-row-key=\\"" + escapeHtml(rowKey) + "\\">" + display + "</button>" : display;
      return "<td class=\\"" + numeric.trim() + "\\">" + content + "</td>";
    }).join("") + "</tr>";
  }).join("");
  const cards = compactLayout ? visibleRows.map(function (row, index) {
    const rowKey = config.rowKey(row, index);
    const title = getDetailExplorerCellDisplay(row, config.cardTitleField || "presentation");
    const code = getDetailExplorerCellDisplay(row, config.cardSubtitleField || "presentationCode");
    const client = getDetailExplorerCellDisplay(row, config.cardMetaField || "client");
    return "<article class=\\"detail-card\\"><strong>" + escapeHtml(title) + "</strong><span>" + escapeHtml(code ? "Código: " + code : "") + "</span><span>" + escapeHtml(client ? "Cliente: " + client : "") + "</span><button class=\\"button button-ghost row-detail-button\\" type=\\"button\\" data-detail-row-key=\\"" + escapeHtml(rowKey) + "\\">Ver detalle</button></article>";
  }).join("") : "";
  const footer = buildDetailExplorerFooter(visibleRows.length, rows.length, config.entitySingular || "presentación", config.entityPlural || "presentaciones", paginated ? page : null);
  body.innerHTML = compactLayout
    ? "<div class=\\"detail-card-list\\">" + cards + "</div>" + footer
    : "<div class=\\"detail-table-wrap\\"><table class=\\"detail-table\\">" + header + "<tbody>" + tableRows + "</tbody></table></div>" + footer;
  state.performance.counters.modalRowsRendered += visibleRows.length;
}
function renderNegotiationUsageRelationList(body) {
  const explorer = state.detailExplorer, rows = getDetailExplorerSortedRows();
  const pageCount = Math.max(1, Math.ceil(rows.length / DETAIL_EXPLORER_VISIBLE_STEP));
  explorer.page = Math.max(1, Math.min(pageCount, explorer.page));
  const start = (explorer.page - 1) * DETAIL_EXPLORER_VISIBLE_STEP, visibleRows = rows.slice(start, start + DETAIL_EXPLORER_VISIBLE_STEP);
  if (!rows.length) { body.innerHTML = "<div class='no-data'>" + escapeHtml(explorer.query ? "No hay clientes que coincidan con la b\\u00fasqueda." : "No hay clientes negociados sin ventas para los filtros actuales.") + "</div>"; return; }
  const header = "<thead><tr>" + NEGOTIATION_USAGE_RELATION_COLUMNS.map(function (column) { return "<th scope='col'>" + escapeHtml(column.label) + "</th>"; }).join("") + "</tr></thead>";
  const tableRows = visibleRows.map(function (row) {
    const values = NEGOTIATION_USAGE_RELATION_COLUMNS.slice(0, -1).map(function (column) { return "<td class='" + (column.numeric ? "numeric" : "") + "'>" + escapeHtml(getDetailExplorerCellDisplay(row, column.id)) + "</td>"; }).join("");
    const key = escapeHtml(row.clientKey);
    const actionLabel = row.activityCount === 1 ? "Ver negociaci\u00f3n" : "Ver negociaciones";
    const actions = "<td><button class='button button-primary' type='button' data-detail-action='usage-view-negotiations' data-client-key='" + key + "'>" + actionLabel + "</button></td>";
    return "<tr data-client-row='" + key + "'>" + values + actions + "</tr>";
  }).join("");
  body.innerHTML = "<div class='detail-table-wrap'><table class='detail-table negotiation-usage-table'>" + header + "<tbody>" + tableRows + "</tbody></table></div>" + buildDetailExplorerFooter(visibleRows.length, rows.length, "cliente", "clientes", explorer.page);
  state.performance.counters.modalRowsRendered += visibleRows.length;
}
function renderNegotiationUsageNegotiationList(body) {
  const explorer = state.detailExplorer, rows = getDetailExplorerSortedRows();
  const pageCount = Math.max(1, Math.ceil(rows.length / DETAIL_EXPLORER_VISIBLE_STEP));
  explorer.page = Math.max(1, Math.min(pageCount, explorer.page));
  const start = (explorer.page - 1) * DETAIL_EXPLORER_VISIBLE_STEP, visibleRows = rows.slice(start, start + DETAIL_EXPLORER_VISIBLE_STEP);
  if (!rows.length) { body.innerHTML = "<div class='no-data'>No hay negociaciones asociadas para este cliente.</div>"; return; }
  const records = visibleRows.map(function (row) {
    const key = escapeHtml(row.relationKey);
    const display = function (field, fallback) {
      const value = getDetailExplorerCellDisplay(row, field);
      return value === "" ? fallback || "No disponible" : value;
    };
    const field = function (label, value, wide) {
      return "<div class='negotiation-field" + (wide ? " negotiation-field-wide" : "") + "'><small>" + escapeHtml(label) + "</small><strong>" + escapeHtml(value) + "</strong></div>";
    };
    const duration = isFiniteNumber(row.negotiationDuration) ? formatInteger(row.negotiationDuration) + (row.negotiationDuration === 1 ? " mes" : " meses") : "No disponible";
    const statusClass = row.contractualStatus === "VIGENTE_HOY" ? "" : " is-neutral";
    const fields = [
      field("Fecha inicio", display("startDate")), field("Fecha fin", display("endDate")),
      field("Objetivo mensual", display("monthlyObjective")), field("Objetivo total", display("totalObjective")),
      field("Duraci\u00f3n", duration), field("Inversi\u00f3n", display("investmentPercentage")),
      field("CEDI", display("cedi")), field("Presentaciones", display("negotiatedPresentationCount")),
      field("Venta total reportada", display("totalReportedSales")), field("Categor\u00edas negociadas", display("categoriesLabel"), true)
    ].join("");
    return "<article class='negotiation-record' data-relation-row='" + key + "'><header class='negotiation-record-header'><div class='negotiation-record-identity'><small>ID Actividad</small><div class='negotiation-record-title'><strong>" + escapeHtml(row.activityId) + "</strong><span class='negotiation-record-badge'>" + escapeHtml(row.negotiationType) + "</span><span class='negotiation-record-badge" + statusClass + "'>" + escapeHtml(row.contractualStatusLabel) + "</span></div></div><button class='button button-primary' type='button' data-detail-action='usage-view-presentations' data-relation-key='" + key + "'><i data-lucide='boxes'></i> Ver presentaciones</button></header><div class='negotiation-fields'>" + fields + "</div></article>";
  }).join("");
  body.innerHTML = "<div class='negotiation-list'>" + records + "</div>" + buildDetailExplorerFooter(visibleRows.length, rows.length, "negociaci\\u00f3n", "negociaciones", explorer.page);
  state.performance.counters.modalRowsRendered += visibleRows.length;
}
function renderNegotiationUsagePresentationList(body) {
  const explorer = state.detailExplorer, rows = getDetailExplorerSortedRows();
  const pageCount = Math.max(1, Math.ceil(rows.length / DETAIL_EXPLORER_VISIBLE_STEP));
  explorer.page = Math.max(1, Math.min(pageCount, explorer.page));
  const start = (explorer.page - 1) * DETAIL_EXPLORER_VISIBLE_STEP, visibleRows = rows.slice(start, start + DETAIL_EXPLORER_VISIBLE_STEP);
  if (!rows.length) { body.innerHTML = "<div class='no-data'>No hay presentaciones negociadas para esta relaci\\u00f3n.</div>"; return; }
  const columns = explorer.config.columns;
  const header = "<thead><tr>" + columns.map(function (column) { return "<th scope='col'>" + escapeHtml(column.label) + "</th>"; }).join("") + "</tr></thead>";
  const tableRows = visibleRows.map(function (row) { return "<tr>" + columns.map(function (column) { return "<td class='" + (column.numeric ? "numeric" : "") + "'>" + escapeHtml(getDetailExplorerCellDisplay(row, column.id)) + "</td>"; }).join("") + "</tr>"; }).join("");
  body.innerHTML = "<div class='detail-table-wrap'><table class='detail-table'>" + header + "<tbody>" + tableRows + "</tbody></table></div>" + buildDetailExplorerFooter(visibleRows.length, rows.length, "presentaci\\u00f3n", "presentaciones", explorer.page);
  state.performance.counters.modalRowsRendered += visibleRows.length;
}
function navigateFromNegotiationUsage(relationKey, action) {
  const row = state.detailExplorer.allRows.find(function (item) { return item.relationKey === relationKey; });
  if (!row) return;
  const patch = action === "usage-view-client" ? { "Cliente SAP - Clave": [row.clientSap], "ID Actividad": [] } : { "ID Actividad": [row.activityId], "Cliente SAP - Clave": [] };
  closeDetailExplorer();
  updateDashboardFilters(patch, { reason: action });
}
function renderNoSalesCategoryList(body) {
  const explorer = state.detailExplorer;
  const rows = getDetailExplorerSortedRows();
  const pageCount = Math.max(1, Math.ceil(rows.length / DETAIL_EXPLORER_VISIBLE_STEP));
  explorer.page = Math.max(1, Math.min(pageCount, explorer.page));
  const start = (explorer.page - 1) * DETAIL_EXPLORER_VISIBLE_STEP;
  const visibleRows = rows.slice(start, start + DETAIL_EXPLORER_VISIBLE_STEP);
  if (!rows.length) {
    body.innerHTML = "<div class=\\"no-data\\">" + escapeHtml(explorer.query ? "No hay categorías que coincidan con la búsqueda." : "No hay presentaciones sin información de venta para los filtros actuales.") + "</div>";
    return;
  }
  const header = "<thead><tr><th scope=\\"col\\">Categoría</th><th scope=\\"col\\">Presentaciones sin información de venta</th><th scope=\\"col\\">Porcentaje del total</th><th scope=\\"col\\">Actividades</th><th scope=\\"col\\">Clientes</th><th scope=\\"col\\">Acción</th></tr></thead>";
  const tableRows = visibleRows.map(function (row) {
    return "<tr><td><strong>" + escapeHtml(row.category) + "</strong></td><td class=\\"numeric\\">" + escapeHtml(formatInteger(row.presentationCount)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatRatioPercent(row.percent)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatInteger(row.activityCount)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatInteger(row.clientCount)) + "</td><td><button class=\\"button button-ghost row-detail-button\\" type=\\"button\\" data-detail-action=\\"open-category\\" data-detail-category=\\"" + escapeHtml(row.category) + "\\">Ver presentaciones</button></td></tr>";
  }).join("");
  body.innerHTML = "<div class=\\"detail-table-wrap\\"><table class=\\"detail-table\\">" + header + "<tbody>" + tableRows + "</tbody></table></div>" + buildDetailExplorerFooter(visibleRows.length, rows.length, "categoría", "categorías", explorer.page);
  state.performance.counters.modalRowsRendered += visibleRows.length;
}
function buildDetailExplorerFooter(visibleCount, totalCount, singular, plural, page) {
  const noun = totalCount === 1 ? singular : plural;
  const pageCount = Math.max(1, Math.ceil(totalCount / DETAIL_EXPLORER_VISIBLE_STEP));
  if (page) {
    const first = totalCount ? (page - 1) * DETAIL_EXPLORER_VISIBLE_STEP + 1 : 0;
    const last = totalCount ? first + visibleCount - 1 : 0;
    const text = "Mostrando " + formatInteger(first) + "–" + formatInteger(last) + " de " + formatInteger(totalCount) + " " + noun + " · Página " + formatInteger(page) + " de " + formatInteger(pageCount);
    return "<div class=\\"detail-footer\\"><span>" + escapeHtml(text) + "</span><div><button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"page-prev\\"" + (page <= 1 ? " disabled" : "") + ">Anterior</button><button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"page-next\\"" + (page >= pageCount ? " disabled" : "") + ">Siguiente</button></div></div>";
  }
  const range = visibleCount ? "1–" + formatInteger(visibleCount) : "0";
  const text = visibleCount === totalCount ? "Mostrando " + formatInteger(totalCount) + " de " + formatInteger(totalCount) + " " + noun : "Mostrando " + range + " de " + formatInteger(totalCount) + " " + noun;
  return "<div class=\\"detail-footer\\"><span>" + escapeHtml(text) + "</span>" + (visibleCount < totalCount ? "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"show-more\\">Ver más</button>" : "") + "</div>";
}
function formatOrdinal(rank) {
  return isFiniteNumber(rank) ? formatInteger(rank) + ".º" : "—";
}
function renderActivityContributionList(body) {
  const explorer = state.detailExplorer;
  const config = explorer.config;
  const rows = getDetailExplorerSortedRows();
  const visibleRows = rows.slice(0, explorer.visibleCount);
  if (!rows.length) {
    body.innerHTML = "<div class=\\"no-data\\">" + escapeHtml(explorer.query ? "No hay clientes que coincidan con la búsqueda." : config.emptyMessage) + "</div>";
    return;
  }
  const compactLayout = Boolean(window.matchMedia && window.matchMedia("(max-width: 820px)").matches);
  const selected = new Set(explorer.selectedClientIds || []);
  const selectedLabel = function (row) {
    return selected.has(row.clientId) ? "<span class=\\"selected-client-label\\">Cliente seleccionado</span>" : "";
  };
  const shareMarkup = function (row) {
    const share = isFiniteNumber(row.share) ? Math.max(0, Math.min(1, row.share)) : 0;
    const label = isFiniteNumber(row.share) ? formatRatioPercent(row.share) : "No disponible";
    return "<div class=\\"contribution-share\\"><span>" + escapeHtml(label) + "</span><progress max=\\"1\\" value=\\"" + share.toFixed(6) + "\\" aria-label=\\"Participación " + escapeHtml(label) + "\\"></progress></div>";
  };
  const footer = buildDetailExplorerFooter(visibleRows.length, rows.length, "cliente", "clientes");
  if (compactLayout) {
    const cards = visibleRows.map(function (row, index) {
      const rowKey = config.rowKey(row, index);
      const className = "detail-card contribution-card" + (selected.has(row.clientId) ? " is-selected-client" : "");
      return "<article class=\\"" + className + "\\"><div class=\\"contribution-card-head\\"><span class=\\"rank-badge\\">" + escapeHtml(formatOrdinal(row.rank)) + "</span><div class=\\"contribution-card-name\\"><strong>" + escapeHtml(row.clientName || "Cliente sin nombre") + "</strong><span>" + escapeHtml(row.clientId) + "</span>" + selectedLabel(row) + "</div></div><div class=\\"contribution-card-metrics\\"><span><small>Ventas</small><strong>" + escapeHtml(formatAvailableMetric(row.sales)) + "</strong></span><span><small>Participación</small><strong>" + escapeHtml(formatAvailablePercent(row.share)) + "</strong></span></div><button class=\\"button button-ghost row-detail-button\\" type=\\"button\\" data-detail-row-key=\\"" + escapeHtml(rowKey) + "\\" aria-label=\\"Ver detalle del cliente " + escapeHtml(row.clientId) + "\\">" + UI_COPY.actions.detail + "</button></article>";
    }).join("");
    body.innerHTML = "<div class=\\"detail-card-list\\">" + cards + "</div>" + footer;
  } else {
    const headers = UI_COPY.tables.contribution;
    const tableRows = visibleRows.map(function (row, index) {
      const rowKey = config.rowKey(row, index);
      const className = selected.has(row.clientId) ? " class=\\"is-selected-client\\"" : "";
      return "<tr" + className + "><td><span class=\\"rank-badge\\">" + escapeHtml(formatOrdinal(row.rank)) + "</span></td><td><div class=\\"client-identity\\"><strong>" + escapeHtml(row.clientName || row.clientId) + "</strong><small>" + escapeHtml(row.clientId) + "</small>" + selectedLabel(row) + "</div></td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(row.sales)) + "</td><td>" + shareMarkup(row) + "</td><td class=\\"numeric\\">" + escapeHtml(formatInteger(row.presentationCount)) + "</td><td><button class=\\"button button-ghost row-detail-button\\" type=\\"button\\" data-detail-row-key=\\"" + escapeHtml(rowKey) + "\\" aria-label=\\"Ver detalle del cliente " + escapeHtml(row.clientId) + "\\">" + UI_COPY.actions.detail + "</button></td></tr>";
    }).join("");
    const shortClass = config.compact ? " is-short" : "";
    body.innerHTML = "<div class=\\"detail-table-wrap contribution-table-wrap" + shortClass + "\\"><table class=\\"detail-table contribution-table\\"><thead><tr>" + headers.map(function (label) { return "<th scope=\\"col\\">" + label + "</th>"; }).join("") + "</tr></thead><tbody>" + tableRows + "</tbody></table></div>" + footer;
  }
  state.performance.counters.modalRowsRendered += visibleRows.length;
}
function renderStandaloneActivityDetail() {
  const body = document.getElementById("detailExplorerBody");
  const config = state.detailExplorer.config;
  if (!body || !config) return;
  const sections = config.standaloneSections || [];
  body.innerHTML = "<div class=\\"presentation-detail activity-standalone-detail\\">" + sections.map(function (section) {
    return "<section class=\\"detail-section\\"><h3>" + escapeHtml(section.title) + "</h3><div class=\\"detail-fields\\">" + section.fields.map(function (field) {
      return "<article class=\\"detail-field\\"><span>" + escapeHtml(field.label) + "</span><strong>" + escapeHtml(field.value) + "</strong></article>";
    }).join("") + "</div></section>";
  }).join("") + "</div>";
}
function openClientTrackingDetail(rowKey, opener) {
  const rows = state.analyses && state.analyses.clientActivitySummary || [];
  const row = ensureClientTrackingRelationIndex(rows).get(rowKey);
  if (!row) {
    showDashboardRuntimeMessage("La relación cliente–negociación ya no está disponible con los filtros actuales.", "warning");
    return;
  }
  state.clientTrackingTable.selectedRowKey = rowKey;
  openDetailExplorer(buildClientTrackingDetailConfig(getClientTrackingDetailModel(row)), opener || document.activeElement);
}
function buildClientTrackingDetailConfig(detailModelOrRow) {
  const detailModel = detailModelOrRow && detailModelOrRow.row ? detailModelOrRow : getClientTrackingDetailModel(detailModelOrRow, state.analyses && state.analyses.availablePeriods || []);
  const row = detailModel && detailModel.row;
  if (!row) return null;
  return {
    type: "clientTrackingDetail",
    category: getClientTrackingRowKey(row),
    trackingRow: row,
    trackingDetailModel: detailModel,
    compact: false,
    wide: true,
    standaloneDetail: true,
    title: UI_COPY.modal.summary,
    subtitle: "Cliente " + row.clientSap + " · Negociación " + row.activityId,
    rows: [], defaultSortField: "client", defaultSortDir: "asc", searchFields: [],
    summary: [
      { label: "Estado mensual", value: formatClientTrackingMonthlyStatus(row.selectedMonthlyStatus), primary: true, note: row.selectedMonthlyStatus === "NO_EVALUABLE_MES" ? formatEvaluationReason(row.selectedMonthlyEvaluationReason) : row.selectedStatusPeriod ? formatCanonicalPeriod(row.selectedStatusPeriod) : "Período no disponible" },
      { label: "Cumplimiento", value: formatAvailablePercent(row.selectedMonthlyCompliance), primary: true },
      { label: "Avance objetivo total", value: formatAvailablePercent(row.totalProgress), primary: true },
      { label: "Estado objetivo total", value: formatClientTrackingTotalStatus(row.totalObjectiveStatus), primary: true, note: row.totalObjectiveStatus === "NO_EVALUABLE_TOTAL" ? formatEvaluationReason(row.totalEvaluationReason) : "" }
    ]
  };
}
function renderClientTrackingDetail() {
  const body = document.getElementById("detailExplorerBody");
  const detailModel = state.detailExplorer.config && state.detailExplorer.config.trackingDetailModel;
  const row = detailModel && detailModel.row;
  if (!body || !row) return;
  const contribution = row.accumulatedGeneralSales;
  const joint = row.accumulatedComparableSales;
  const participation = row.isSharedActivity && isFiniteNumber(contribution) && isFiniteNumber(joint) && joint !== 0 ? contribution / joint : null;
  const monthlyRows = detailModel.periods.map(function (period) {
    const discountDisplay = period.monthlyDiscountStatus === "DESCUENTO_MENSUAL_CONFLICTIVO" ? "Revisar" : isFiniteNumber(period.monthlyDiscount) ? formatRatioPercent(period.monthlyDiscount) : "No disponible";
    return "<tr><td><strong>" + escapeHtml(period.label) + "</strong></td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(period.generalSales)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(period.negotiatedSales)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(period.nonNegotiatedSales)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailablePercent(period.negotiatedShare)) + "</td>" + (row.isSharedActivity ? "<td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(period.comparableSales)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(period.jointNegotiatedSales)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(period.jointNonNegotiatedSales)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(row.clientContributionSalesByMonth && row.clientContributionSalesByMonth[period.key])) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailablePercent(isFiniteNumber(period.comparableSales) && period.comparableSales !== 0 && isFiniteNumber(row.clientContributionSalesByMonth && row.clientContributionSalesByMonth[period.key]) ? row.clientContributionSalesByMonth[period.key] / period.comparableSales : null)) + "</td>" : "") + "<td class=\\"numeric\\">" + escapeHtml(discountDisplay) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailableMetric(row.monthlyObjective)) + "</td><td class=\\"numeric\\">" + escapeHtml(formatAvailablePercent(period.compliance)) + "</td><td>" + clientTrackingMonthlyBadge(period.status, period.evaluationReason) + "</td></tr>";
  }).join("");
  const warnings = (row.warnings || []).length ? "<section class=\\"detail-section\\"><h3>" + UI_COPY.modal.warnings + "</h3><div class=\\"extra-columns\\">" + row.warnings.map(function (warning) { return "<span class=\\"extra-chip\\">" + escapeHtml(formatClientTrackingWarning(warning)) + "</span>"; }).join("") + "</div></section>" : "";
  const sharedFields = row.isSharedActivity ? [
    { label: "Aporte del cliente", value: formatAvailableMetric(contribution) },
    { label: "Venta conjunta", value: formatAvailableMetric(joint) },
    { label: "Participación", value: formatAvailablePercent(participation) },
    { label: "Resultado de la negociación", value: formatClientTrackingMonthlyStatus(row.selectedMonthlyStatus) }
  ] : [];
  const sections = [
    { title: UI_COPY.modal.clientLocation, fields: [
      { label: "Cliente SAP", value: row.clientSap }, { label: "Nombre", value: row.clientName || "No disponible" }, { label: "NIT", value: row.clientNit || "No disponible" },
      { label: "ID Actividad", value: row.activityId }, { label: "Tipo", value: row.isSharedActivity ? "Actividad compartida" : "Actividad individual" }, { label: "Clientes asociados", value: formatInteger(row.associatedClientCount) },
      { label: "Región", value: row.region || "Sin información" }, { label: "CEDI", value: row.cedi || "Sin información" }, { label: "Canal", value: row.channel || "Sin información" }, { label: "Tipología", value: row.typology || "Sin información" },
      { label: "Fecha inicio", value: formatClientTrackingDate(row.startDate) }, { label: "Fecha fin", value: formatClientTrackingDate(row.endDate) }, { label: "Estado de fechas", value: formatClientTrackingWarning(row.dateStatus) }
    ] },
    { title: UI_COPY.modal.objectives, fields: [
      { label: "Objetivo mensual", value: formatAvailableMetric(row.monthlyObjective) }, { label: "Objetivo total", value: formatAvailableMetric(row.totalObjective) },
      { label: "Período de negociación", value: isFiniteNumber(row.negotiationPeriod) ? formatInteger(row.negotiationPeriod) + " meses" : "No disponible" },
      { label: "% de inversión", value: formatAvailablePercent(row.investmentPercentage) }, { label: "% descuento negociación", value: formatNegotiationDiscountSummary(row.negotiationDiscount) },
      { label: "Estado descuento", value: formatClientTrackingWarning(row.negotiationDiscountStatus) }
    ] },
    { title: UI_COPY.modal.accumulated, fields: sharedFields.concat([
      { label: "Ventas generales acumuladas", value: formatAvailableMetric(row.accumulatedGeneralSales) },
      { label: "Venta de presentaciones negociadas acumulada", value: formatAvailableMetric(row.accumulatedAttributableSales) },
      { label: "Numerador comparable acumulado", value: formatAvailableMetric(row.accumulatedComparableSales) },
      { label: "Objetivo total", value: formatAvailableMetric(row.totalObjective) }, { label: "Avance objetivo total", value: formatAvailablePercent(row.totalProgress) },
      { label: "Diferencia frente al objetivo total", value: isFiniteNumber(row.totalDifference) ? formatSignedNumber(row.totalDifference) : "No disponible" },
      { label: "Estado objetivo total", value: formatClientTrackingTotalStatus(row.totalObjectiveStatus) }
    ]) }
  ];
  const renderSection = function (section) { return "<section class=\\"detail-section\\"><h3>" + escapeHtml(section.title) + "</h3><div class=\\"detail-fields\\">" + section.fields.map(function (field) { return "<article class=\\"detail-field\\"><span>" + escapeHtml(field.label) + "</span><strong>" + escapeHtml(field.value) + "</strong></article>"; }).join("") + "</div></section>"; };
  const identificationMarkup = sections.slice(0, 2).map(renderSection).join("");
  const accumulatedMarkup = renderSection(sections[2]);
  const sharedAction = row.isSharedActivity ? "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"tracking-open-contribution\\"><i data-lucide=\\"users\\"></i> " + UI_COPY.actions.contribution + "</button>" : "";
  const renderMonthlyHeaders = function (labels) { return labels.map(function (label) { return "<th scope=\\"col\\">" + escapeHtml(label) + "</th>"; }).join(""); };
  const sharedHeaders = row.isSharedActivity ? "<th scope=\\"col\\">Venta conjunta</th><th scope=\\"col\\">Venta negociada conjunta</th><th scope=\\"col\\">Venta no negociada conjunta</th><th scope=\\"col\\">Aporte del cliente</th><th scope=\\"col\\">Participación</th>" : "";
  const monthlyHeaders = renderMonthlyHeaders(UI_COPY.tables.monthly.slice(0, 5)) + sharedHeaders + renderMonthlyHeaders(UI_COPY.tables.monthly.slice(5));
  body.innerHTML = "<div class=\\"presentation-detail client-tracking-detail\\"><p class=\\"client-tracking-detail-note\\">" + escapeHtml(UI_COPY.tooltips.monthlyCompliance) + "</p><div class=\\"tracking-detail-actions\\"><button class=\\"button button-primary\\" type=\\"button\\" data-detail-action=\\"tracking-view-client\\"><i data-lucide=\\"user-round\\"></i> " + UI_COPY.actions.client + "</button><button class=\\"button button-primary\\" type=\\"button\\" data-detail-action=\\"tracking-view-activity\\"><i data-lucide=\\"briefcase-business\\"></i> " + UI_COPY.actions.negotiation + "</button>" + sharedAction + "<button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"tracking-detail-csv\\"><i data-lucide=\\"download\\"></i> " + UI_COPY.actions.downloadCsv + "</button></div>" + identificationMarkup + "<section class=\\"detail-section\\"><h3>" + UI_COPY.modal.monthlyResult + "</h3><div class=\\"detail-table-wrap\\"><table class=\\"detail-table tracking-period-table\\"><thead><tr>" + monthlyHeaders + "</tr></thead><tbody>" + monthlyRows + "</tbody></table></div></section>" + accumulatedMarkup + warnings + "</div>";
}
function navigateFromClientTrackingDetail(action) {
  const row = state.detailExplorer.config && state.detailExplorer.config.trackingRow;
  if (!row) return;
  const patch = action === "tracking-view-client"
    ? { "Cliente SAP - Clave": [row.clientSap], "ID Actividad": [] }
    : { "ID Actividad": [row.activityId], "Cliente SAP - Clave": [] };
  closeDetailExplorer();
  updateDashboardFilters(patch, { reason: action });
  const section = document.getElementById("kpis");
  if (section && section.scrollIntoView) section.scrollIntoView({ behavior: "smooth", block: "start" });
}
function openClientTrackingContribution(opener) {
  const row = state.detailExplorer.config && state.detailExplorer.config.trackingRow;
  if (!row || !row.isSharedActivity) return;
  const activities = state.analyses && state.analyses.activityPerformance || [];
  const activity = activities.find(function (item) { return item.activityId === row.activityId && item.period === row.selectedStatusPeriod; }) || activities.find(function (item) { return item.activityId === row.activityId; });
  if (!activity) {
    state.detailExplorer.message = "La contribución no está disponible para el período y los filtros actuales.";
    renderDetailExplorer();
    return;
  }
  openActivityContributionDetail(activity, opener || document.activeElement, { selectedClientIds: [row.clientSap] });
}
function formatClientTrackingMonthlyStatus(status) {
  return UI_COPY.statuses.monthly[status] || UI_COPY.statuses.monthly.NO_EVALUABLE_MES;
}
function formatClientTrackingTotalStatus(status) {
  return UI_COPY.statuses.total[status] || UI_COPY.statuses.total.NO_EVALUABLE_TOTAL;
}
function formatClientTrackingWarning(value) {
  const text = normalizeText(value);
  if (!text) return "Sin información";
  return text.replace(/_/g, " ").replace(/:(\d{6})$/, function (_, period) { return " · " + formatCanonicalPeriod(Number(period)); }).toLocaleLowerCase("es-CO").replace(/^./, function (letter) { return letter.toLocaleUpperCase("es-CO"); });
}
function formatClientTrackingDate(value) {
  const date = dateOnly(value);
  return date ? new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date) : "No disponible";
}
function formatNegotiationDiscountSummary(summary) {
  if (!summary || summary.status === "SIN_DATO") return "No disponible";
  if (summary.status === "VARIOS") return "Varios (" + (summary.values || []).map(formatRatioPercent).join(", ") + ")";
  return isFiniteNumber(summary.values && summary.values[0]) ? formatRatioPercent(summary.values[0]) : isFiniteNumber(summary.value) ? formatRatioPercent(summary.value) : "No disponible";
}
function renderDetailExplorerPresentationDetail() {
  const body = document.getElementById("detailExplorerBody");
  if (!body) return;
  const row = state.detailExplorer.selectedRow;
  const sections = state.detailExplorer.config.detailFields ? state.detailExplorer.config.detailFields(row) : getNoSalesPresentationDetailFields(row);
  const detailLabel = state.detailExplorer.config.detailLabel || "Detalle de presentación";
  const backLabel = state.detailExplorer.config.backLabel || "Volver al listado";
  body.innerHTML = "<div class=\\"presentation-detail\\"><div class=\\"detail-back-row\\"><button class=\\"button button-ghost\\" type=\\"button\\" data-detail-action=\\"back-list\\"><i data-lucide=\\"chevron-left\\"></i> " + escapeHtml(backLabel) + "</button><span class=\\"badge badge-muted\\">" + escapeHtml(detailLabel) + "</span></div>" + sections.map(function (section) {
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
  if (isNavigableModalType(state.detailExplorer.type)) pushModalNavigationSnapshot();
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
  const cacheKey = query + "|" + state.detailExplorer.sortField + "|" + state.detailExplorer.sortDir;
  if (state.detailExplorer.viewCache && state.detailExplorer.viewCache.key === cacheKey) {
    return state.detailExplorer.viewCache.rows;
  }
  const rows = state.detailExplorer.allRows.filter(function (row, index) {
    if (!query) return true;
    return (state.detailExplorer.searchTexts[index] || "").includes(query);
  });
  rows.sort(function (a, b) {
    const aValue = getDetailExplorerSortValue(a, state.detailExplorer.sortField);
    const bValue = getDetailExplorerSortValue(b, state.detailExplorer.sortField);
    if (aValue < bValue) return state.detailExplorer.sortDir === "asc" ? -1 : 1;
    if (aValue > bValue) return state.detailExplorer.sortDir === "asc" ? 1 : -1;
    return 0;
  });
  state.detailExplorer.viewCache = { key: cacheKey, rows: rows };
  return rows;
}
function configIsStandaloneDetail(config) {
  return Boolean(config && config.standaloneDetail);
}
function getDetailExplorerRawValueForConfig(row, field, config) {
  if (field === "category") {
    if (Object.prototype.hasOwnProperty.call(row, "category")) return normalizeText(row.category);
    const analysis = config && config.analysis ? config.analysis : getEmptyNoSalesAnalysis();
    return getResolvedCategory(row, analysis.categoryLookup);
  }
  return getDetailExplorerRawValue(row, field);
}
function getDetailExplorerCellDisplay(row, field) {
  const value = getDetailExplorerRawValue(row, field);
  if (field === "objectiveMonth" && row.__monthlyTargetConflict) return "Revisar";
  if (field === "objectiveTotal" && row.__totalTargetConflict) return "Revisar";
  if (value === null || value === undefined || value === "") return "";
  if (["objectiveMonth", "objectiveTotal", "monthlyObjective", "totalObjective", "monthlyObjectiveCombined", "totalClientSales", "negotiatedPresentationSales", "totalReportedSales", "physicalSales"].indexOf(field) !== -1) return isFiniteNumber(value) ? formatNumber(value) : "N/A";
  if (["discount", "investmentPercentage", "negotiationDiscountPercentage"].indexOf(field) !== -1) return isFiniteNumber(value) ? formatPercent(value) : "";
  if (field === "sales") return isFiniteNumber(value) ? formatNumber(value) : "N/A";
  if (field === "share") return isFiniteNumber(value) ? formatRatioPercent(value) : "N/A";
  if (field === "rank" || field === "presentationCount" || field === "activityCount" || field === "clientCount" || field === "negotiatedPresentationCount" || field === "negotiationDuration") return isFiniteNumber(value) ? formatInteger(value) : "N/A";
  if (field === "percent") return isFiniteNumber(value) ? formatRatioPercent(value) : "N/A";
  return String(value);
}
function getDetailExplorerRawValue(row, field) {
  if (Object.prototype.hasOwnProperty.call(row, field)) return row[field];
  if (field === "category") {
    if (Object.prototype.hasOwnProperty.call(row, "category")) return normalizeText(row.category);
    const analysis = state.detailExplorer.config && state.detailExplorer.config.analysis ? state.detailExplorer.config.analysis : { categoryLookup: new Map() };
    return getResolvedCategory(row, analysis.categoryLookup);
  }
  if (field === "presentation") return normalizeText(row["Presentación AS400 de la venta - Texto"]);
  if (field === "presentationCode") return normalizeText(row["Presentación AS400 de la venta - Clave"]);
  if (field === "client") return normalizeText(row.clientId) || normalizeText(row["Cliente SAP - Clave"]);
  if (field === "clientName") return normalizeText(row.clientName) || normalizeText(row["Cliente AS400 - Nombre negocio (Texto)"]) || normalizeText(row["Cliente AS400 - Texto"]);
  if (field === "businessName") return normalizeText(row.businessName);
  if (field === "nit") return normalizeText(row.nit);
  if (field === "activityId") return normalizeText(row.activityId);
  if (field === "activityType") return normalizeText(row.activityType);
  if (field === "activity") return normalizeText(row["ID Actividad"]);
  if (field === "objectiveMonth") return isFiniteNumber(row["Objetivo mes "]) ? row["Objetivo mes "] : null;
  if (field === "objectiveTotal") return isFiniteNumber(row["Objetivo cajas total"]) ? row["Objetivo cajas total"] : null;
  if (field === "discount") return isFiniteNumber(row["Porcentaje descuento"]) ? row["Porcentaje descuento"] : null;
  if (field === "startDate") return normalizeText(row["Fecha inicio"]);
  if (field === "endDate") return normalizeText(row["Fecha fin"]);
  if (field === "discountType") return normalizeText(row["Tipo descuento"]);
  if (field === "period") return normalizeText(row["Periodo negociacion"]);
  if (field === "cedi") return normalizeText(row["Cedi"]);
  if (field === "region") return normalizeText(row["Región SAP"]);
  if (field === "channel") return normalizeText(row.Canal);
  if (field === "absenceReason") return getNoSalesAbsenceReason(row);
  if (field === "sales" || field === "share" || field === "rank" || field === "presentationCount" || field === "activityCount" || field === "clientCount" || field === "percent") return row[field];
  if (field === "source" || field === "status") return normalizeText(row[field]);
  return normalizeText(row[field]);
}
function getDetailExplorerSortValue(row, field) {
  if (["objectiveTotal", "objectiveMonth", "monthlyObjective", "totalObjective", "monthlyObjectiveCombined", "totalClientSales", "negotiatedPresentationSales", "totalReportedSales", "physicalSales", "investmentPercentage", "negotiationDiscountPercentage", "negotiationDuration", "negotiatedPresentationCount", "discount", "sales", "share", "rank", "presentationCount", "activityCount", "clientCount", "percent"].indexOf(field) !== -1) {
    const value = getDetailExplorerRawValue(row, field);
    return isFiniteNumber(value) ? value : -Number.MAX_VALUE;
  }
  if (field === "endDate" || field === "startDate") {
    const date = dateOnly(getDetailExplorerRawValue(row, field));
    return date ? date.getTime() : Number.MAX_VALUE;
  }
  return normalizeText(getDetailExplorerRawValue(row, field)).toLocaleLowerCase("es-CO");
}
function openActivityContributionDetail(activity, opener, options) {
  if (!activity) return;
  options = options || {};
  const selectedClientIds = options.selectedClientIds || (state.analyses && state.analyses.kpis ? state.analyses.kpis.selectedClientIds : []);
  openDetailExplorer(getActivityExplorerConfig(activity, selectedClientIds), opener || document.activeElement, options);
}
function getActivityExplorerConfig(activity, selectedClientIds) {
  const selection = (selectedClientIds || []).map(normalizeText).filter(Boolean).sort();
  const key = state.datasetVersion + "|" + activity.activityId + "|" + activity.period + "|" + activity.status + "|" + selection.join(",");
  const cached = state.contributionModelCache.get(key);
  if (cached) return cached;
  const config = activity.isSharedActivity ? buildActivityContributionConfig(activity, selection) : buildIndividualActivityDetailConfig(activity);
  return state.contributionModelCache.set(key, config);
}
function buildActivityContributionConfig(activity, selectedClientIds) {
  const metadata = buildActivityClientMetadata(activity.activityId);
  const rows = activity.contributionRows.map(function (row) {
    return Object.assign({}, row, metadata.get(row.clientId) || {}, {
      activityId: activity.activityId,
      activityType: "Actividad compartida",
      isSelectedClient: (selectedClientIds || []).indexOf(row.clientId) !== -1
    });
  });
  state.performance.counters.modalModelsBuilt += 1;
  return {
    type: "activityContribution",
    category: activity.activityId,
    activity: activity,
    selectedClientIds: (selectedClientIds || []).slice(),
    compact: rows.length >= 2 && rows.length <= 4,
    title: UI_COPY.charts.activityContribution.title,
    subtitle: UI_COPY.charts.activityContribution.subtitle,
    rows: rows,
    columns: [
      { id: "rank", label: "Posición" }, { id: "client", label: "Cliente" }, { id: "clientName", label: "Nombre del cliente" },
      { id: "sales", label: "Ventas", numeric: true }, { id: "share", label: "Participación", numeric: true },
      { id: "presentationCount", label: "Presentaciones", numeric: true }
    ],
    exportColumns: [
      { id: "activityId", label: "ID Actividad" }, { id: "activityType", label: "Tipo de actividad" },
      { id: "client", label: "Cliente SAP" }, { id: "clientName", label: "Nombre del cliente" },
      { id: "sales", label: "Ventas" }, { id: "share", label: "Participación" },
      { id: "rank", label: "Posición por aporte" }, { id: "presentationCount", label: "Presentaciones relacionadas" },
      { id: "source", label: "Fuente de atribución" }
    ],
    sortOptions: [
      { field: "sales", label: "Ventas", dir: "desc" }, { field: "share", label: "Participación", dir: "desc" },
      { field: "clientName", label: "Nombre", dir: "asc" }, { field: "client", label: "Código SAP", dir: "asc" },
      { field: "rank", label: "Posición", dir: "asc" }
    ],
    defaultSortField: "sales",
    defaultSortDir: "desc",
    searchFields: ["client", "clientName", "businessName", "nit"],
    searchPlaceholder: "Buscar por código o nombre",
    emptyMessage: getActivityContributionEmptyMessage(activity),
    message: getActivityContributionNotice(activity),
    searchEmptyMessage: "No hay clientes que coincidan con la búsqueda.",
    entitySingular: "cliente",
    entityPlural: "clientes",
    summary: [
      { label: "Ventas conjuntas", value: formatAvailableMetric(activity.totalSales), primary: true },
      { label: "Objetivo mensual", value: getObjectiveDisplay(activity).value, primary: true },
      { label: "Cumplimiento", value: formatAvailablePercent(activity.achievement), primary: true },
      { label: "Diferencia", value: isFiniteNumber(activity.gap) ? formatSignedNumber(activity.gap) : "No disponible", primary: true },
      { label: "Clientes asociados", value: formatInteger(activity.associatedClientCount) },
      { label: "Vigencia", value: formatActivityValidity(activity) },
      { label: "Estado", value: formatActivityStatus(activity.status) }
    ],
    rowKey: function (row, index) { return row.clientId || "cliente-" + index; },
    cardTitleField: "clientName",
    cardSubtitleField: "sales",
    cardMetaField: "share",
    detailLabel: "Detalle del aporte del cliente",
    backLabel: UI_COPY.actions.back,
    detailFields: buildActivityClientDetailFields,
    exportFilename: "contribucion_actividad_" + normalizeFilenamePart(activity.activityId) + ".csv"
  };
}
function buildActivityClientMetadata(activityId) {
  const metadata = new Map();
  const indexedRows = state.indexes && state.indexes.rowsByActivity ? state.indexes.rowsByActivity.get(activityId) : null;
  const rows = indexedRows ? Array.from(indexedRows) : [];
  rows.forEach(function (row) {
    const clientId = normalizeText(row["Cliente SAP - Clave"]);
    if (!clientId) return;
    if (!metadata.has(clientId)) metadata.set(clientId, { nit: "", businessName: "", categories: new Set(), periods: new Set() });
    const item = metadata.get(clientId);
    item.nit = item.nit || normalizeText(row["Nit cliente - Clave"]);
    item.businessName = item.businessName || normalizeText(row["Cliente AS400 - Nombre negocio (Texto)"]) || normalizeText(row["Cliente AS400 - Texto"]);
    const category = normalizeText(row["Categoría AS400 de la venta"]);
    const period = getYearMonthSortValue(row);
    if (category) item.categories.add(category);
    if (period !== null) item.periods.add(formatCanonicalPeriod(period));
  });
  return new Map(Array.from(metadata, function (entry) {
    return [entry[0], {
      nit: entry[1].nit,
      businessName: entry[1].businessName,
      categories: Array.from(entry[1].categories).sort(function (a, b) { return a.localeCompare(b, "es"); }),
      periods: Array.from(entry[1].periods)
    }];
  }));
}
function getActivityContributionEmptyMessage(activity) {
  if (!activity.associatedClientCount) return "La actividad no tiene clientes asociados válidos.";
  if (activity.status === "VENTA_ACTIVIDAD_AMBIGUA") return "La contribución no puede calcularse porque la venta es ambigua.";
  if (activity.status === "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD") return "La contribución requiere una regla verificable de distribución entre actividades.";
  if (activity.status === "FECHAS_CONFLICTIVAS") return "La actividad tiene fechas conflictivas.";
  if (!activity.contributionRows.some(function (row) { return isFiniteNumber(row.sales); })) return "No existe información atribuible para el período seleccionado.";
  return "No hay contribuciones atribuibles para esta actividad.";
}
function getActivityContributionNotice(activity) {
  if (activity.status === "VENTA_ACTIVIDAD_AMBIGUA") return "La contribución no puede calcularse porque la venta es ambigua.";
  if (activity.status === "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD") return "La contribución requiere una regla verificable de distribución entre actividades.";
  if (activity.status === "FECHAS_CONFLICTIVAS") return "La actividad tiene fechas conflictivas.";
  if (!activity.contributionRows.some(function (row) { return isFiniteNumber(row.sales); })) return "No existe información atribuible para el período seleccionado.";
  return "";
}
function buildIndividualActivityDetailConfig(activity) {
  const row = activity.contributionRows[0] || {};
  state.performance.counters.modalModelsBuilt += 1;
  return {
    type: "activityDetail",
    category: activity.activityId,
    activity: activity,
    compact: true,
    standaloneDetail: true,
    title: "Actividad " + activity.activityId,
    subtitle: "DETALLE DE ACTIVIDAD INDIVIDUAL",
    rows: [],
    selectedClientIds: [],
    defaultSortField: "client",
    defaultSortDir: "asc",
    searchFields: [],
    summary: [
      { label: "Ventas de la actividad", value: formatAvailableMetric(activity.totalSales), primary: true },
      { label: "Objetivo mensual", value: getObjectiveDisplay(activity).value, primary: true },
      { label: "Cumplimiento", value: formatAvailablePercent(activity.achievement), primary: true },
      { label: "Diferencia", value: isFiniteNumber(activity.gap) ? formatSignedNumber(activity.gap) : "No disponible", primary: true },
      { label: "Vigencia", value: formatActivityValidity(activity) },
      { label: "Estado analítico", value: formatActivityStatus(activity.status) }
    ],
    standaloneSections: [
      { title: "Cliente asociado", fields: [
        { label: "Cliente SAP", value: row.clientId || "No disponible" },
        { label: "Nombre", value: row.clientName || "No disponible" },
        { label: "Presentaciones relacionadas", value: formatInteger(row.presentationCount) }
      ] },
      { title: "Negociación", fields: [
        { label: "Ventas del mes", value: formatAvailableMetric(activity.totalSales) },
        { label: "Objetivo mensual", value: getObjectiveDisplay(activity).value },
        { label: "Cumplimiento mensual", value: formatAvailablePercent(activity.achievement) },
        { label: "Diferencia frente al objetivo", value: isFiniteNumber(activity.gap) ? formatSignedNumber(activity.gap) : "No disponible" }
      ] }
    ]
  };
}
function buildActivityClientDetailFields(row) {
  return [
    { title: "Cliente", fields: [
      { label: "Cliente SAP", value: row.clientId }, { label: "Nombre", value: row.clientName || "N/A" },
      { label: "Nombre del negocio", value: row.businessName || "N/A" }, { label: "NIT", value: row.nit || "N/A" },
      { label: "Posición por aporte", value: isFiniteNumber(row.rank) ? formatInteger(row.rank) : "N/A" }
    ] },
    { title: "Contribución", fields: [
      { label: "Ventas del cliente", value: formatMetric(row.sales) },
      { label: "Participación en las ventas de la negociación", value: formatMetricPercent(row.share) },
      { label: "Presentaciones relacionadas", value: formatInteger(row.presentationCount) },
      { label: "Categorías", value: row.categories && row.categories.length ? row.categories.join(", ") : "N/A" },
      { label: "Períodos", value: row.periods && row.periods.length ? row.periods.join(", ") : "N/A" },
      { label: "Fuente de atribución", value: row.source || "N/A" },
      { label: "Estado", value: formatActivityStatus(row.status) }
    ] }
  ];
}
function buildNegotiationUsageExplorerConfig(analysis) {
  const model = analysis || getEmptyNegotiationUsageAnalysis();
  return {
    type: "negotiationUsageRelations", title: "Clientes negociados sin ventas",
    subtitle: "Clientes negociados con venta total reportada en cero.",
    rows: model.clients || [], columns: NEGOTIATION_USAGE_RELATION_COLUMNS,
    exportColumns: [
      { id: "clientSap", label: "Cliente SAP" }, { id: "clientName", label: "Nombre del cliente" }, { id: "nit", label: "NIT" },
      { id: "region", label: "Regi\\u00f3n" }, { id: "cedis", label: "CEDI" }, { id: "channel", label: "Canal" },
      { id: "totalReportedSales", label: "Venta total reportada" }, { id: "activityCount", label: "Cantidad de negociaciones" },
      { id: "monthlyObjectiveCombined", label: "Objetivo mensual combinado" }, { id: "statusLabel", label: "Estado" },
      { id: "activityIds", label: "IDs de actividades" }
    ],
    sortOptions: NEGOTIATION_USAGE_SORT_OPTIONS, defaultSortField: "clientName", defaultSortDir: "asc",
    searchFields: ["clientSap", "clientName", "nit", "region", "cedis"], searchPlaceholder: "Buscar cliente, NIT, regi\\u00f3n o CEDI",
    paginated: true, wide: true, entitySingular: "cliente", entityPlural: "clientes",
    emptyMessage: "No hay clientes negociados con venta total reportada en cero para los filtros actuales.",
    summary: [
      { label: "Clientes sin ventas", value: formatInteger(model.totalUniqueClients), primary: true },
      { label: "Negociaciones asociadas", value: formatInteger(model.relationCount) }, { label: "Registros con venta cero", value: formatInteger(model.totalZeroRows) }
    ],
    rowKey: function (row) { return row.clientKey; }, exportFilename: "clientes_negociados_sin_ventas.csv"
  };
}
function buildNegotiationUsagePresentationConfig(client) {
  const negotiations = client.negotiations || [];
  const negotiationCount = negotiations.length;
  const negotiationLabel = negotiationCount === 1 ? "Negociaci\u00f3n" : "Negociaciones";
  const clientName = normalizeText(client.clientName);
  return {
    type: "negotiationUsageNegotiations", title: negotiationCount === 1 ? "Negociaci\u00f3n asociada" : "Negociaciones asociadas",
    rows: negotiations,
    subtitle: clientName && clientName !== "No disponible" ? client.clientSap + " \\u00b7 " + clientName : client.clientSap,
    columns: NEGOTIATION_USAGE_NEGOTIATION_COLUMNS,
    exportColumns: [
      { id: "clientSap", label: "Cliente SAP" }, { id: "clientName", label: "Nombre del cliente" }, { id: "activityId", label: "ID Actividad" },
      { id: "negotiationType", label: "Tipo de negociaci\\u00f3n" }, { id: "startDate", label: "Fecha inicio" }, { id: "endDate", label: "Fecha fin" },
      { id: "contractualStatusLabel", label: "Estado contractual" }, { id: "monthlyObjective", label: "Objetivo mensual" }, { id: "totalObjective", label: "Objetivo total" },
      { id: "negotiationDuration", label: "Duraci\\u00f3n de la negociaci\\u00f3n" }, { id: "investmentPercentage", label: "Porcentaje de inversi\\u00f3n" },
      { id: "cedi", label: "CEDI" }, { id: "negotiatedPresentationCount", label: "Cantidad de presentaciones" },
      { id: "totalReportedSales", label: "Venta total reportada" }, { id: "salesStatusLabel", label: "Estado de venta" }
    ],
    exportContext: client, sortOptions: [
      { field: "activityId", label: "ID Actividad", dir: "asc" }, { field: "contractualStatusLabel", label: "Estado contractual", dir: "asc" },
      { field: "monthlyObjective", label: "Objetivo mensual", dir: "desc" }, { field: "negotiatedPresentationCount", label: "Cantidad de presentaciones", dir: "desc" }
    ], defaultSortField: "activityId", defaultSortDir: "asc",
    searchFields: ["activityId", "negotiationType", "contractualStatusLabel", "cedi", "categoriesLabel"], paginated: true, wide: true,
    entitySingular: "negociaci\\u00f3n", entityPlural: "negociaciones", rowKey: function (row) { return row.relationKey; },
    summary: [
      { label: "Cliente SAP", value: client.clientSap }, { label: negotiationLabel, value: formatInteger(negotiationCount), primary: true },
      { label: "Venta total reportada", value: "0" }, { label: "Estado", value: "Sin ventas" }
    ],
    exportFilename: "negociaciones_cliente_sin_ventas_" + normalizeFilenamePart(client.clientSap) + ".csv"
  };
}
function buildNegotiationUsageNegotiationPresentationsConfig(client, negotiation) {
  return {
    type: "negotiationUsagePresentations", title: "Presentaciones de la negociaci\\u00f3n",
    subtitle: client.clientSap + " \\u00b7 " + negotiation.activityId,
    rows: negotiation.presentations || [],
    columns: [
      { id: "presentationCode", label: "C\\u00f3digo de presentaci\\u00f3n" }, { id: "presentation", label: "Descripci\\u00f3n" },
      { id: "category", label: "Categor\\u00eda" }, { id: "negotiationDiscountPercentage", label: "Porcentaje de descuento de negociaci\\u00f3n", numeric: true },
      { id: "physicalSales", label: "Venta f\\u00edsica", numeric: true }
    ],
    sortOptions: NEGOTIATION_USAGE_PRESENTATION_SORT_OPTIONS, defaultSortField: "presentation", defaultSortDir: "asc",
    searchFields: ["presentationCode", "presentation", "category"], paginated: true,
    entitySingular: "presentaci\\u00f3n", entityPlural: "presentaciones", rowKey: function (row) { return row.presentationKey; },
    summary: [
      { label: "Cliente SAP", value: client.clientSap }, { label: "ID Actividad", value: negotiation.activityId },
      { label: "Presentaciones", value: formatInteger(negotiation.negotiatedPresentationCount), primary: true }, { label: "Venta total reportada", value: "0" }
    ]
  };
}
function buildNoSalesCategoryExplorerConfig(noSalesAnalysis) {
  const analysis = noSalesAnalysis || getEmptyNoSalesAnalysis();
  const rows = buildNoSalesCategoryExplorerRows(analysis);
  return {
    type: "noSalesCategories",
    category: "",
    analysis: analysis,
    title: "Calidad de venta por presentación",
    subtitle: "RESUMEN POR CATEGORÍA",
    rows: rows,
    columns: [],
    exportColumns: [
      { id: "category", label: "Categoría" },
      { id: "presentationCount", label: "Presentaciones sin información de venta" },
      { id: "percent", label: "Porcentaje del total" },
      { id: "activityCount", label: "Actividades relacionadas" },
      { id: "clientCount", label: "Clientes relacionados" }
    ],
    sortOptions: [
      { field: "presentationCount", label: "Presentaciones sin información de venta", dir: "desc" },
      { field: "percent", label: "Porcentaje del total", dir: "desc" },
      { field: "category", label: "Categoría", dir: "asc" },
      { field: "activityCount", label: "Actividades", dir: "desc" },
      { field: "clientCount", label: "Clientes", dir: "desc" }
    ],
    defaultSortField: "presentationCount",
    defaultSortDir: "desc",
    searchFields: ["category"],
    searchPlaceholder: "Buscar categoría",
    emptyMessage: "No hay presentaciones sin información de venta con los filtros actuales.",
    entitySingular: "categoría",
    entityPlural: "categorías",
    paginated: true,
    summary: [
      { label: "Presentaciones sin información de venta", value: formatInteger(analysis.presentationCount), primary: true },
      { label: "Categorías", value: formatInteger(rows.length) },
      { label: "Actividades", value: formatInteger(analysis.activityCount) },
      { label: "Clientes", value: formatInteger(analysis.clientCount) }
    ],
    rowKey: function (row) { return row.category; },
    exportFilename: "resumen_presentaciones_sin_ventas.csv"
  };
}
function buildNoSalesCategoryExplorerRows(analysis) {
  const grouped = new Map();
  const total = analysis.presentationCount || 0;
  (analysis.uniquePresentations || []).forEach(function (row, index) {
    const category = getResolvedCategory(row, analysis.categoryLookup, index) || "Sin categoría disponible";
    if (!grouped.has(category)) grouped.set(category, { category: category, presentationCount: 0, activityIds: new Set(), clientIds: new Set() });
    const item = grouped.get(category);
    item.presentationCount += 1;
    const activity = normalizeText(row["ID Actividad"]);
    const client = normalizeText(row["Cliente SAP - Clave"]);
    if (activity) item.activityIds.add(activity);
    if (client) item.clientIds.add(client);
  });
  return Array.from(grouped.values()).map(function (item) {
    return {
      category: item.category,
      presentationCount: item.presentationCount,
      percent: total ? item.presentationCount / total : 0,
      activityCount: item.activityIds.size,
      clientCount: item.clientIds.size
    };
  });
  const compact = Boolean(window.matchMedia && window.matchMedia("(max-width: 820px)").matches);
  if (state.analyses && state.clientTrackingTable.compactLayout !== compact) renderClientTrackingTable();
}
function buildNoSalesCategoryDetailConfig(category, noSalesAnalysis) {
  const analysis = noSalesAnalysis || getEmptyNoSalesAnalysis();
  const rows = getNoSalesRowsForCategory(category, analysis);
  return {
    type: "noSalesCategory",
    category: category,
    analysis: analysis,
    title: "Calidad de venta por presentación — " + category,
    subtitle: "DETALLE DE PRESENTACIONES",
    rows: rows,
    columns: NO_SALES_EXPLORER_COLUMNS,
    exportColumns: [
      { id: "presentation", label: "Presentación" },
      { id: "presentationCode", label: "Código de presentación" },
      { id: "client", label: "Cliente SAP" },
      { id: "clientName", label: "Nombre del cliente" },
      { id: "activity", label: "ID actividad" },
      { id: "category", label: "Categoría" },
      { id: "region", label: "Región" },
      { id: "channel", label: "Canal" },
      { id: "cedi", label: "CEDI" },
      { id: "absenceReason", label: "Motivo de ausencia de venta" },
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
    searchFields: ["presentation", "presentationCode", "category", "client", "clientName", "activity", "region", "channel", "cedi", "period", "absenceReason"],
    searchPlaceholder: "Buscar presentación, código o cliente",
    emptyMessage: "No hay presentaciones disponibles para esta categoría con los filtros actuales.",
    summary: buildNoSalesCategorySummary(category, rows, analysis),
    rowKey: getNoSalesExplorerRowKey,
    paginated: true,
    backToCategories: true,
    exportFilename: "presentaciones_sin_ventas_" + normalizeFilenamePart(category) + ".csv"
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
  const objectiveMonth = buildObjectivesByActivity(rows).filter(function (item) { return item.objectiveStatus === "OK"; }).reduce(function (sum, item) { return sum + item.objectiveMonthly; }, 0);
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
function getNoSalesAbsenceReason(row) {
  const status = normalizeText(row.estadoInformacionVenta);
  if (status === "SIN_INFORMACION_VENTA") return "Sin información de venta";
  if (status === "VENTA_CERO") return "Venta cero";
  return status ? status.replace(/_/g, " ") : "Sin información de venta";
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
  sections[0].fields.push(["Región", getDetailExplorerRawValue(row, "region")], ["Canal", getDetailExplorerRawValue(row, "channel")], ["Período", getDetailExplorerRawValue(row, "period")], ["Motivo de ausencia de venta", getNoSalesAbsenceReason(row)]);
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
  const header = columns.map(function (column) { return serializeCsvCell(column.label, column.label); });
  const body = rows.map(function (row) {
    const exportRow = Object.assign({}, config.exportContext || {}, row);
    return columns.map(function (column) {
      return serializeCsvCell(getDetailExplorerCellDisplay(exportRow, column.id), getDetailExplorerRawValue(exportRow, column.id));
    }).join(",");
  });
  downloadCsv("\\uFEFF" + header.join(",") + "\\n" + body.join("\\n"), config.exportFilename || "clientes_negociados_sin_ventas.csv");
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
      if (field === "Estado de vigencia") return matchesFilter(getIndexedVigenciaStatus(row), selected);
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
  const grouped = new Map();
  rows.forEach(function (row) {
    const label = normalizeText(row[groupField]), clientPeriodKey = getClientPeriodKey(row);
    if (!label || !clientPeriodKey) return;
    if (!grouped.has(label)) grouped.set(label, new Map());
    const periods = grouped.get(label);
    if (!periods.has(clientPeriodKey)) periods.set(clientPeriodKey, []);
    const value = isFiniteNumber(row.TotalVentaMes) ? row.TotalVentaMes : parseNumberLike(row.TotalVentaMes, "TotalVentaMes");
    if (isFiniteNumber(value) && periods.get(clientPeriodKey).indexOf(value) === -1) periods.get(clientPeriodKey).push(value);
  });
  let result = Array.from(grouped, function (entry) {
    let total = 0, valid = true;
    entry[1].forEach(function (values) {
      const candidates = values.some(function (value) { return value !== 0; }) ? values.filter(function (value) { return value !== 0; }) : values;
      if (candidates.length !== 1) valid = false;
      else total += candidates[0];
    });
    return { label: entry[0], value: valid ? total : null, valid: valid };
  }).filter(function (item) { return item.valid; }).sort(function (a, b) { return b.value - a.value; });
  return limit ? result.slice(0, limit) : result;
}
function destroyDashboard() {
  cancelPendingDashboardRender();
  disposeCharts();
  if (state.detailExplorer && state.detailExplorer.isOpen) closeDetailExplorer({ restoreFocus: false });
  else if (pageScrollLock.count) unlockPageScroll(true);
  window.removeEventListener("resize", debouncedResizeCharts);
  window.removeEventListener("resize", repositionOpenComboboxPanel);
  window.removeEventListener("scroll", repositionOpenComboboxPanel, true);
  window.removeEventListener("beforeunload", destroyDashboard);
  document.removeEventListener("keydown", handleDetailExplorerDocumentKeydown);
  document.removeEventListener("click", handlePortalComboboxClick);
  document.removeEventListener("input", handlePortalComboboxInput);
  document.removeEventListener("keydown", handlePortalComboboxKeydown);
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
function resolveEnrichedText(rows, field, clientSap, activityId, alternateField) {
  const fields = [field].concat(alternateField ? [alternateField] : []);
  for (let index = 0; index < fields.length; index += 1) {
    const currentField = fields[index];
    const ownValues = Array.from(new Set((rows || []).map(function (row) { return normalizeText(row[currentField]); }).filter(Boolean)));
    if (ownValues.length === 1) return ownValues[0];
    const clientValues = state.indexes && state.indexes.enrichmentByClient && state.indexes.enrichmentByClient.get(clientSap);
    const clientCandidates = clientValues && clientValues.get(currentField);
    if (clientCandidates && clientCandidates.size === 1) return Array.from(clientCandidates)[0];
    const relationValues = state.indexes && state.indexes.enrichmentByRelation && state.indexes.enrichmentByRelation.get(clientSap + "||" + activityId);
    const relationCandidates = relationValues && relationValues.get(currentField);
    if (relationCandidates && relationCandidates.size === 1) return Array.from(relationCandidates)[0];
  }
  return "No disponible";
}
function getEmptyNegotiationUsageAnalysis() {
  return { totalUniqueClients: 0, totalZeroRows: 0, relationCount: 0, multiActivityClientCount: 0, clients: [], buildMs: 0 };
}
function hasExplicitZeroTotalMonthlySales(row) {
  if (!row) return false;
  const rawValue = row.TotalVentaMes;
  const hasExplicitValue = rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== "";
  if (!hasExplicitValue) return false;
  const value = isFiniteNumber(rawValue) ? rawValue : parseNumberLike(rawValue, "TotalVentaMes");
  return isFiniteNumber(value) && value === 0;
}
function buildNegotiationUsageAnalysis(filteredRows) {
  const startedAt = performanceNow();
  const sourceRows = filteredRows || [];
  const zeroRows = sourceRows.filter(hasExplicitZeroTotalMonthlySales);
  const clientsByActivity = state.indexes && state.indexes.clientsByActivity
    ? new Map(Array.from(state.indexes.clientsByActivity, function (entry) { return [entry[0], new Set(entry[1])]; }))
    : new Map();
  sourceRows.forEach(function (row) {
    const activityId = normalizeText(row["ID Actividad"]), clientSap = normalizeText(row["Cliente SAP - Clave"]);
    if (!activityId || !clientSap) return;
    if (!clientsByActivity.has(activityId)) clientsByActivity.set(activityId, new Set());
    clientsByActivity.get(activityId).add(clientSap);
  });
  const relationGroups = groupRowsByKey(zeroRows, function (row) {
    const clientSap = normalizeText(row["Cliente SAP - Clave"]), activityId = normalizeText(row["ID Actividad"]);
    return clientSap && activityId ? clientSap + "||" + activityId : "";
  });
  const negotiationsByClient = new Map();
  relationGroups.forEach(function (relationRows, relationKey) {
    if (!relationKey) return;
    const relation = buildNegotiationUsageRelation(relationRows, clientsByActivity);
    if (!negotiationsByClient.has(relation.clientSap)) negotiationsByClient.set(relation.clientSap, []);
    negotiationsByClient.get(relation.clientSap).push(relation);
  });
  const clients = Array.from(negotiationsByClient, function (entry) { return buildClientWithoutMonthlySales(entry[0], entry[1]); });
  return {
    totalUniqueClients: clients.length, totalZeroRows: zeroRows.length, relationCount: relationGroups.size,
    multiActivityClientCount: clients.filter(function (item) { return item.activityCount > 1; }).length,
    clients: clients,
    buildMs: performanceNow() - startedAt
  };
}
function buildNegotiationUsageRelation(rows, clientsByActivity) {
  const first = rows[0] || {};
  const clientSap = normalizeText(first["Cliente SAP - Clave"]), activityId = normalizeText(first["ID Actividad"]);
  const datePairs = Array.from(new Set(rows.map(function (row) {
    const start = normalizeText(row["Fecha inicio"]), end = normalizeText(row["Fecha fin"]);
    return start || end ? start + "||" + end : "";
  }).filter(Boolean)));
  const pair = datePairs.length === 1 ? datePairs[0].split("||") : [];
  const startDate = pair[0] || "", endDate = pair[1] || "";
  const dateStatus = !datePairs.length ? "FECHAS_NO_DISPONIBLES" : datePairs.length > 1 || !dateOnly(startDate) || !dateOnly(endDate) ? "FECHAS_CONFLICTIVAS" : "OK";
  const objective = resolveUniqueNumericField(rows, "Objetivo mes ");
  const totalObjective = resolveUniqueNumericField(rows, "Objetivo cajas total");
  const investment = resolveUniqueNumericField(rows, "% De inversi\u00f3n");
  const duration = resolveUniqueNumericField(rows, "Periodo negociacion");
  const presentationGroups = groupRowsByKey(rows.filter(hasNegotiatedPresentationReference), function (row, index) {
    return normalizeText(row["Presentaci\\u00f3n AS400 de la venta - Clave"]) || normalizeText(row["Presentaci\\u00f3n AS400 de la venta - Texto"]) || "fila-" + index;
  });
  const presentations = Array.from(presentationGroups, function (entry) { return buildNegotiationUsagePresentation(entry[1], entry[0]); });
  const categories = Array.from(new Set(presentations.map(function (item) { return item.category; }).filter(Boolean))).sort();
  const contractualStatus = getContractualStatusWithoutSalesPeriod(dateStatus, startDate, endDate);
  return {
    relationKey: clientSap + "||" + activityId, clientSap: clientSap, activityId: activityId,
    negotiationType: (clientsByActivity.get(activityId) || new Set()).size > 1 ? "Compartida" : "Individual",
    startDate: startDate, endDate: endDate, monthlyObjective: objective.conflict ? null : objective.value,
    totalObjective: totalObjective.conflict ? null : totalObjective.value,
    investmentPercentage: investment.conflict ? null : investment.value,
    negotiationDuration: duration.conflict ? null : duration.value,
    cedi: resolveEnrichedText(rows, "Cedi", clientSap, activityId), negotiatedPresentationCount: presentations.length,
    categories: categories, categoriesLabel: categories.length ? categories.join(" | ") : "No disponible", presentations: presentations,
    contractualStatus: contractualStatus.status, contractualStatusLabel: contractualStatus.label,
    totalReportedSales: 0, salesStatusLabel: "Sin ventas", sourceRows: rows
  };
}
function buildNegotiationUsagePresentation(rows, presentationKey) {
  const first = rows[0] || {};
  const physicalSales = resolveUniqueNumericField(rows, "Ventas cajas f\u00edsicas (sin rep)");
  const discount = resolveUniqueNumericField(rows, "Porcentaje descuento negociaci\u00f3n");
  return {
    presentationKey: presentationKey,
    presentationCode: normalizeText(first["Presentaci\\u00f3n AS400 de la venta - Clave"]),
    presentation: normalizeText(first["Presentaci\\u00f3n AS400 de la venta - Texto"]),
    category: getDirectCategory(first), negotiationDiscountPercentage: discount.conflict ? null : discount.value,
    physicalSales: physicalSales.conflict ? null : physicalSales.value
  };
}
function getContractualStatusWithoutSalesPeriod(dateStatus, startDate, endDate) {
  if (dateStatus === "FECHAS_NO_DISPONIBLES") return { status: dateStatus, label: "Fechas no disponibles" };
  if (dateStatus === "FECHAS_CONFLICTIVAS") return { status: dateStatus, label: "Fechas conflictivas" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = dateOnly(startDate), end = dateOnly(endDate);
  if (today < start) return { status: "PLANEADA", label: "Planeada" };
  if (today > end) return { status: "FINALIZADA", label: "Finalizada" };
  return { status: "VIGENTE_HOY", label: "Vigente hoy" };
}
function buildClientWithoutMonthlySales(clientSap, negotiations) {
  const objectives = negotiations.map(function (item) { return item.monthlyObjective; });
  const combinedMonthlyObjective = objectives.length && objectives.every(isFiniteNumber)
    ? objectives.reduce(function (sum, value) { return sum + value; }, 0)
    : null;
  const sourceRows = negotiations.reduce(function (all, item) { return all.concat(item.sourceRows || []); }, []);
  const relationRows = sourceRows.length ? sourceRows : ((state.indexes && state.indexes.rowsByClient && state.indexes.rowsByClient.get(clientSap)) ? Array.from(state.indexes.rowsByClient.get(clientSap)) : []);
  const firstActivity = negotiations[0] && negotiations[0].activityId || "";
  const enrichmentActivity = negotiations.length === 1 ? firstActivity : "";
  const cedis = Array.from(new Set(negotiations.map(function (item) { return item.cedi; }).filter(function (value) { return value && value !== "No disponible"; }))).sort();
  return {
    clientKey: clientSap, clientSap: clientSap,
    clientName: resolveEnrichedText(relationRows, "Cliente AS400 - Nombre negocio (Texto)", clientSap, enrichmentActivity, "Cliente AS400 - Texto"),
    nit: resolveEnrichedText(relationRows, "Nit cliente - Clave", clientSap, enrichmentActivity),
    region: resolveEnrichedText(relationRows, "Regi\\u00f3n SAP", clientSap, enrichmentActivity),
    cedis: cedis.length ? cedis.join(" | ") : resolveEnrichedText(relationRows, "Cedi", clientSap, enrichmentActivity),
    channel: resolveEnrichedText(relationRows, "Canal", clientSap, enrichmentActivity),
    totalMonthlySales: 0, totalReportedSales: 0, status: "CLIENTE_NEGOCIADO_SIN_VENTAS", statusLabel: "Sin ventas",
    activityCount: negotiations.length, monthlyObjectiveCombined: combinedMonthlyObjective,
    negotiations: negotiations, activityIds: negotiations.map(function (item) { return item.activityId; }).join(" | ")
  };
}
function getEmptyNoSalesAnalysis() {
  return { rows: [], uniquePresentations: [], byCategory: [], categoryLookup: new Map(), presentationCount: 0, activityCount: 0, clientCount: 0, presentationsWithoutCategory: 0 };
}
function getNoSalesAnalysis(filteredRows, preparedCategoryLookup) {
  const sourceRows = filteredRows || [];
  const rows = sourceRows.filter(function (row) { return row && row.estadoInformacionVenta === SALES_INFORMATION_STATUS.WITHOUT_SALES_INFO; });
  const grouped = groupRowsByKey(rows.filter(hasNegotiatedPresentationReference), getNegotiatedPresentationKey);
  const uniquePresentations = Array.from(grouped, function (entry) {
    const base = Object.assign({}, entry[1][0]);
    const monthly = resolveUniqueNumericField(entry[1], "Objetivo mes "), total = resolveUniqueNumericField(entry[1], "Objetivo cajas total");
    base["Objetivo mes "] = monthly.value; base["Objetivo cajas total"] = total.value;
    base.__sourceRowCount = entry[1].length; base.__monthlyTargetConflict = monthly.conflict; base.__monthlyTargetValues = monthly.values;
    base.__totalTargetConflict = total.conflict; base.__totalTargetValues = total.values;
    return base;
  });
  const categoryLookup = preparedCategoryLookup || buildCategoryLookup(sourceRows), categories = new Map();
  uniquePresentations.forEach(function (row, index) {
    const category = getResolvedCategory(row, categoryLookup, index);
    if (category) categories.set(category, (categories.get(category) || 0) + 1);
  });
  const byCategory = Array.from(categories, function (entry) { return { label: entry[0], value: entry[1] }; }).sort(function (a, b) { return b.value - a.value; });
  return {
    rows: rows, uniquePresentations: uniquePresentations, byCategory: byCategory, categoryLookup: categoryLookup,
    presentationCount: uniquePresentations.length, activityCount: countUniqueFromRows(uniquePresentations, "ID Actividad"),
    clientCount: countUniqueFromRows(uniquePresentations, "Cliente SAP - Clave"),
    presentationsWithoutCategory: Math.max(0, uniquePresentations.length - byCategory.reduce(function (sum, item) { return sum + item.value; }, 0))
  };
}
function countUniqueBy(rows, keyGetter) {
  return uniqueRowsByKey(rows, keyGetter).length;
}
function countUniqueFromRows(rows, field) {
  return new Set(rows.map(function (row) { return normalizeText(row[field]); }).filter(Boolean)).size;
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
  return Array.from(new Set(rows.map(function (row) { return field === "Estado de vigencia" ? getIndexedVigenciaStatus(row) : normalizeText(row[field]); }).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, "es"); });
}
function groupComplianceByCedi(rows) {
  return getUniqueOptions(rows, "Cedi").map(function (label) {
    const groupedRows = rows.filter(function (row) { return normalizeText(row.Cedi) === label; });
    const analytics = buildActivityAnalytics(groupedRows);
    const latestRows = getLatestYearMonthRows(groupedRows);
    const period = latestRows.length ? getYearMonthSortValue(latestRows[0]) : null;
    const aggregate = aggregateActivityPerformance(analytics.activityPerformance.filter(function (item) { return item.period === period; }));
    const valid = isFiniteNumber(aggregate.achievement);
    return { label: label, value: aggregate.achievement, valid: valid, sales: aggregate.sales, objective: aggregate.objective };
  }).sort(function (a, b) { return numberForCalc(b.value) - numberForCalc(a.value); });
}
function activityDimensionIsExclusive(rows, field) {
  const valuesByActivity = new Map();
  rows.forEach(function (row) {
    const activityId = normalizeText(row["ID Actividad"]), value = normalizeText(row[field]);
    if (!activityId || !value) return;
    if (!valuesByActivity.has(activityId)) valuesByActivity.set(activityId, new Set());
    valuesByActivity.get(activityId).add(value);
  });
  return Array.from(valuesByActivity.values()).every(function (values) { return values.size <= 1; });
}
function exportClientTrackingSummaryCsv() {
  const projection = getClientTrackingProjection();
  const periods = state.analyses && state.analyses.availablePeriods || [];
  if (!projection.rows.length) {
    showDashboardRuntimeMessage("No hay relaciones para exportar con los filtros actuales.", "warning");
    return false;
  }
  const periodPart = projection.period ? projection.period.label : "sin_periodo";
  return downloadCsv(buildClientTrackingSummaryCsv(projection.rows, periods, projection.period), "seguimiento_clientes_negociaciones_" + normalizeFilenamePart(periodPart) + ".csv");
}
function buildClientTrackingSummaryCsv(rows, periods, selectedPeriod) {
  const baseColumns = [
    [UI_COPY.csv.monthlyStatus, function (row) { return formatClientTrackingMonthlyStatus(row.selectedMonthlyStatus); }],
    ["Período evaluado", function () { return selectedPeriod ? selectedPeriod.label : "No disponible"; }],
    [UI_COPY.csv.totalStatus, function (row) { return formatClientTrackingTotalStatus(row.totalObjectiveStatus); }],
    ["Región", function (row) { return row.region; }], ["CEDI", function (row) { return row.cedi; }], [UI_COPY.csv.clientSap, function (row) { return row.clientSap; }],
    [UI_COPY.csv.clientName, function (row) { return row.clientName; }], ["NIT", function (row) { return row.clientNit; }], [UI_COPY.csv.negotiationId, function (row) { return row.activityId; }],
    ["Tipo de negociación", function (row) { return row.isSharedActivity ? "Compartida" : "Individual"; }],
    [UI_COPY.csv.monthlyObjective, function (row) { return row.monthlyObjective; }],
    [UI_COPY.csv.monthlySales, function (row) { return row.salesByMonth && row.salesByMonth[selectedPeriod && selectedPeriod.key]; }],
    [UI_COPY.csv.negotiatedSales, function (row) { return row.negotiatedPresentationSalesByMonth && row.negotiatedPresentationSalesByMonth[selectedPeriod && selectedPeriod.key]; }],
    [UI_COPY.csv.nonNegotiatedSales, function (row) { return row.nonNegotiatedPresentationSalesByMonth && row.nonNegotiatedPresentationSalesByMonth[selectedPeriod && selectedPeriod.key]; }],
    [UI_COPY.csv.negotiatedShare, function (row) { return formatAvailablePercent(row.negotiatedSalesShareByMonth && row.negotiatedSalesShareByMonth[selectedPeriod && selectedPeriod.key]); }],
    [UI_COPY.csv.nonNegotiatedShare, function (row) { return formatAvailablePercent(row.nonNegotiatedSalesShareByMonth && row.nonNegotiatedSalesShareByMonth[selectedPeriod && selectedPeriod.key]); }],
    [UI_COPY.csv.monthlyDiscount, function (row) { return getClientTrackingMonthlyDiscountDisplay(row, selectedPeriod && selectedPeriod.key); }],
    [UI_COPY.csv.monthlyCompliance, function (row) { return formatAvailablePercent(row.selectedMonthlyCompliance); }],
    ["Diferencia mensual", function (row) { return row.monthlyDifferenceByMonth && row.monthlyDifferenceByMonth[selectedPeriod && selectedPeriod.key]; }],
    ["Venta acumulada", function (row) { return row.accumulatedGeneralSales; }],
    ["Objetivo total", function (row) { return row.totalObjective; }],
    [UI_COPY.csv.totalProgress, function (row) { return formatAvailablePercent(row.totalProgress); }], ["Diferencia frente al objetivo total", function (row) { return row.totalDifference; }],
    [UI_COPY.csv.investment, function (row) { return formatAvailablePercent(row.investmentPercentage); }], ["Descuento de la negociación", function (row) { return formatNegotiationDiscountSummary(row.negotiationDiscount); }]
  ];
  const dynamicColumns = [];
  (periods || []).forEach(function (period) {
    dynamicColumns.push(["Venta total " + period.label, function (row) { return row.salesByMonth && row.salesByMonth[period.key]; }]);
    dynamicColumns.push(["Venta negociada " + period.label, function (row) { return row.negotiatedPresentationSalesByMonth && row.negotiatedPresentationSalesByMonth[period.key]; }]);
    dynamicColumns.push(["% negociada " + period.label, function (row) { return formatAvailablePercent(row.negotiatedSalesShareByMonth && row.negotiatedSalesShareByMonth[period.key]); }]);
    dynamicColumns.push(["Venta no negociada " + period.label, function (row) { return row.nonNegotiatedPresentationSalesByMonth && row.nonNegotiatedPresentationSalesByMonth[period.key]; }]);
    dynamicColumns.push(["% no negociada " + period.label, function (row) { return formatAvailablePercent(row.nonNegotiatedSalesShareByMonth && row.nonNegotiatedSalesShareByMonth[period.key]); }]);
    dynamicColumns.push(["Dcto. " + period.label, function (row) { return getClientTrackingMonthlyDiscountDisplay(row, period.key); }]);
    dynamicColumns.push(["Cumplimiento " + period.label, function (row) { return formatAvailablePercent(row.monthlyComplianceByMonth && row.monthlyComplianceByMonth[period.key]); }]);
    dynamicColumns.push(["Estado " + period.label, function (row) { return formatClientTrackingMonthlyStatus(row.monthlyStatusByMonth && row.monthlyStatusByMonth[period.key]); }]);
  });
  const columns = baseColumns.concat(dynamicColumns);
  return ["\uFEFF" + columns.map(function (column) { return serializeCsvCell(column[0], column[0]); }).join(",")].concat((rows || []).map(function (row) {
    return columns.map(function (column) {
      const value = column[1](row);
      const safeValue = normalizeTrackingCsvValue(value);
      return serializeCsvCell(safeValue, safeValue);
    }).join(",");
  })).join("\\n");
}
function exportClientTrackingDetailCsv(row) {
  if (!row) return false;
  const periods = state.analyses && state.analyses.availablePeriods || [];
  const csv = buildClientTrackingDetailCsv(row, periods);
  return downloadCsv(csv, "detalle_" + normalizeFilenamePart(row.clientSap) + "_" + normalizeFilenamePart(row.activityId) + ".csv");
}
function buildClientTrackingDetailCsv(row, periods) {
  const metadata = [
    ["Cliente SAP", row.clientSap], ["Nombre", row.clientName], ["NIT", row.clientNit], ["ID Actividad", row.activityId],
    ["Tipo de negociación", row.isSharedActivity ? "Compartida" : "Individual"], ["Clientes asociados", row.associatedClientCount],
    ["Región", row.region], ["CEDI", row.cedi], ["Canal", row.channel], ["Tipología", row.typology],
    ["Fecha inicio", formatClientTrackingDate(row.startDate)], ["Fecha fin", formatClientTrackingDate(row.endDate)], ["Estado fechas", formatClientTrackingWarning(row.dateStatus)],
    ["Objetivo mensual", row.monthlyObjective], ["Objetivo total", row.totalObjective], ["Período negociación", row.negotiationPeriod],
    ["% inversión", formatAvailablePercent(row.investmentPercentage)], ["% descuento negociación", formatNegotiationDiscountSummary(row.negotiationDiscount)],
    ["Ventas generales acumuladas", row.accumulatedGeneralSales], ["Venta negociada acumulada del cliente", row.accumulatedAttributableSales],
    ["Venta comparable acumulada de la negociación", row.accumulatedComparableSales], ["Avance objetivo total", formatAvailablePercent(row.totalProgress)], ["Diferencia objetivo total", row.totalDifference],
    ["Estado objetivo total", formatClientTrackingTotalStatus(row.totalObjectiveStatus)], ["Advertencias", (row.warnings || []).map(formatClientTrackingWarning).join(" | ") || "Ninguna"]
  ];
  const lines = ["\uFEFF" + ["Campo", "Valor"].map(function (value) { return serializeCsvCell(value, value); }).join(",")]
    .concat(metadata.map(function (item) {
      const value = normalizeTrackingCsvValue(item[1]);
      return serializeCsvCell(item[0], item[0]) + "," + serializeCsvCell(value, value);
    }));
  lines.push("");
  const headers = UI_COPY.tables.monthly.slice();
  if (row.isSharedActivity) headers.splice(5, 0, "Venta conjunta", "Venta negociada conjunta", "Venta no negociada conjunta", "Aporte del cliente", "Participación");
  lines.push(headers.map(function (value) { return serializeCsvCell(value, value); }).join(","));
  (periods || []).forEach(function (period) {
    const comparable = getClientTrackingComparableSales(row, period.key);
    const contribution = row.clientContributionSalesByMonth && row.clientContributionSalesByMonth[period.key];
    const values = [
      period.label, row.salesByMonth && row.salesByMonth[period.key],
      row.negotiatedPresentationSalesByMonth && row.negotiatedPresentationSalesByMonth[period.key],
      row.nonNegotiatedPresentationSalesByMonth && row.nonNegotiatedPresentationSalesByMonth[period.key],
      formatAvailablePercent(row.negotiatedSalesShareByMonth && row.negotiatedSalesShareByMonth[period.key]),
      getClientTrackingMonthlyDiscountDisplay(row, period.key),
      row.monthlyObjective, formatAvailablePercent(row.monthlyComplianceByMonth && row.monthlyComplianceByMonth[period.key]),
      formatClientTrackingMonthlyStatus(row.monthlyStatusByMonth && row.monthlyStatusByMonth[period.key])
    ];
    if (row.isSharedActivity) values.splice(5, 0,
      row.jointActivitySalesByMonth && row.jointActivitySalesByMonth[period.key],
      row.jointNegotiatedPresentationSalesByMonth && row.jointNegotiatedPresentationSalesByMonth[period.key],
      row.jointNonNegotiatedPresentationSalesByMonth && row.jointNonNegotiatedPresentationSalesByMonth[period.key],
      contribution,
      formatAvailablePercent(isFiniteNumber(comparable) && comparable !== 0 && isFiniteNumber(contribution) ? contribution / comparable : null)
    );
    lines.push(values.map(function (value) {
      const safeValue = normalizeTrackingCsvValue(value);
      return serializeCsvCell(safeValue, safeValue);
    }).join(","));
  });
  return lines.join("\\n");
}
function normalizeTrackingCsvValue(value) {
  if (value === null || value === undefined || value === "") return "No disponible";
  return isFiniteNumber(value) ? roundNumber(value) : value;
}
function exportFilteredCsv(rows) {
  return ["\\uFEFF" + TABLE_COLUMNS.map(function (column) { return serializeCsvCell(column, column); }).join(",")].concat(rows.map(function (row) {
    return TABLE_COLUMNS.map(function (column) { return serializeCsvCell(formatCell(row, column), row[column]); }).join(",");
  })).join("\\n");
}
function protectCsvValue(value, originalValue) {
  const text = String(value === null || value === undefined ? "" : value);
  return typeof originalValue === "string" && /^[=+@-]/.test(text) ? "'" + text : text;
}
function serializeCsvCell(value, originalValue) {
  return "\\"" + protectCsvValue(value, originalValue).replace(/"/g, "\\"\\"") + "\\"";
}
function downloadCsv(csv, filename) {
  let url = "";
  try {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = normalizeDownloadFilename(filename, "datos.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    return true;
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    reportDashboardDiagnostic("error", "csv-download", error, "No se pudo exportar el CSV.");
    showDashboardRuntimeMessage("No se pudo exportar el CSV. Inténtalo nuevamente.", "error");
    return false;
  }
}
function normalizeDownloadFilename(filename, fallback) {
  const safe = normalizeText(filename).replace(/[<>:"/\\\\|?*\\u0000-\\u001f]/g, "_").slice(0, 180);
  return safe || fallback;
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
function sumUniqueTotalSalesMonth(rows) { return sumResolvedMetricGroups(resolveMetricGroups(rows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true })); }
function sumUniqueActivityObjective(rows) { return sumResolvedMetricGroups(resolveMetricGroups(getLatestYearMonthRows(rows), getClientPeriodKey, "Objetivo mes ")); }
function getLatestYearMonthRows(rows) {
  const latestValue = rows.reduce(function (latest, row) {
    const value = getYearMonthSortValue(row);
    return value === null || (latest !== null && value <= latest) ? latest : value;
  }, null);
  if (latestValue === null) return rows;
  return rows.filter(function (row) { return getYearMonthSortValue(row) === latestValue; });
}
function getYearMonthSortValue(row) {
  if (Number.isInteger(row.__periodKey)) return row.__periodKey;
  const year = parseCanonicalYear(row["Año"]);
  const month = parseCanonicalMonth(row["Mes"]);
  if (year && month) return year * 100 + month;
  const value = normalizeText(row["Año Mes"]).replace(/\\s/g, "");
  const monthYear = value.match(/^(\\d{1,2})[.\\/-]?(\\d{4})$/);
  if (monthYear && Number(monthYear[1]) >= 1 && Number(monthYear[1]) <= 12) return Number(monthYear[2]) * 100 + Number(monthYear[1]);
  const yearMonth = value.match(/^(\\d{4})[.\\/-]?(\\d{1,2})$/);
  if (yearMonth && Number(yearMonth[2]) >= 1 && Number(yearMonth[2]) <= 12) return Number(yearMonth[1]) * 100 + Number(yearMonth[2]);
  return null;
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
  return getClientPeriodKey(row, index) || "fila-" + index;
}
function getIndexedVigenciaStatus(row) {
  return state.indexes && state.indexes.vigenciaByRow && state.indexes.vigenciaByRow.has(row)
    ? state.indexes.vigenciaByRow.get(row)
    : getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]);
}
function getClientPeriodKey(row) {
  const client = normalizeText(row["Cliente SAP - Clave"]);
  const period = getYearMonthSortValue(row);
  return client && period !== null ? client + "||" + period : "";
}
function getActivityKey(row, index) {
  return normalizeText(row["ID Actividad"]) || "fila-" + index;
}
function parseCanonicalYear(value) {
  const number = typeof value === "number" ? value : Number(normalizeText(value));
  return Number.isInteger(number) && number >= 1900 && number <= 2200 ? number : null;
}
function parseCanonicalMonth(value) {
  const months = { ENE: 1, ENERO: 1, FEB: 2, FEBRERO: 2, MAR: 3, MARZO: 3, ABR: 4, ABRIL: 4, MAY: 5, MAYO: 5, JUN: 6, JUNIO: 6, JUL: 7, JULIO: 7, AGO: 8, AGOSTO: 8, SEP: 9, SEPT: 9, SEPTIEMBRE: 9, OCT: 10, OCTUBRE: 10, NOV: 11, NOVIEMBRE: 11, DIC: 12, DICIEMBRE: 12 };
  const text = normalizeText(value).toLocaleUpperCase("es-CO").replace(/\\./g, "");
  if (months[text]) return months[text];
  const number = Number(text);
  return Number.isInteger(number) && number >= 1 && number <= 12 ? number : null;
}
function resolveMetricGroups(rows, keyGetter, valueField, options) {
  options = options || {};
  const grouped = new Map();
  rows.forEach(function (row, index) {
    const key = keyGetter(row, index);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    const value = isFiniteNumber(row[valueField]) ? row[valueField] : parseNumberLike(row[valueField], valueField);
    if (isFiniteNumber(value) && grouped.get(key).indexOf(value) === -1) grouped.get(key).push(value);
  });
  return Array.from(grouped, function (entry) {
    const sourceValues = entry[1];
    const candidates = options.preferNonZero && sourceValues.some(function (value) { return value !== 0; })
      ? sourceValues.filter(function (value) { return value !== 0; })
      : sourceValues.slice();
    if (!candidates.length) return { key: entry[0], value: null, status: "AUSENTE", sourceValues: sourceValues };
    if (candidates.length > 1) return { key: entry[0], value: null, status: "CONFLICTO", sourceValues: sourceValues };
    return { key: entry[0], value: candidates[0], status: candidates[0] === 0 ? "CERO" : "OK", sourceValues: sourceValues };
  });
}
function sumResolvedMetricGroups(groups) {
  if (!groups.length || groups.some(function (group) { return group.value === null || group.status === "CONFLICTO"; })) return null;
  return groups.reduce(function (sum, group) { return sum + group.value; }, 0);
}
function salesByCanonicalPeriod(rows) {
  const periodKeys = Array.from(new Set(rows.map(getYearMonthSortValue).filter(function (value) { return value !== null; }))).sort(function (a, b) { return a - b; });
  return periodKeys.map(function (period) {
    const periodRows = rows.filter(function (row) { return getYearMonthSortValue(row) === period; });
    const value = sumResolvedMetricGroups(resolveMetricGroups(periodRows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true }));
    return { label: formatCanonicalPeriod(period), value: value, periodKey: period, valid: isFiniteNumber(value) };
  }).filter(function (item) { return item.valid; });
}
function formatCanonicalPeriod(period) {
  const monthLabels = ["", "ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const year = Math.floor(period / 100);
  const month = period % 100;
  return (monthLabels[month] || String(month)) + " " + year;
}
function buildPresentationStatusAnalysis(rows) {
  const priority = { SIN_INFORMACION_VENTA: 1, VENTA_CERO: 2, CON_VENTA: 3 };
  const grouped = new Map();
  rows.filter(hasNegotiatedPresentationReference).forEach(function (row, index) {
    const key = getNegotiatedPresentationKey(row, index);
    const status = normalizeText(row.estadoInformacionVenta);
    if (!grouped.has(key) || (priority[status] || 0) > (priority[grouped.get(key)] || 0)) grouped.set(key, status);
  });
  const counts = { CON_VENTA: 0, VENTA_CERO: 0, SIN_INFORMACION_VENTA: 0 };
  grouped.forEach(function (status) { if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1; });
  return [
    { label: "Con venta", value: counts.CON_VENTA },
    { label: "Venta cero", value: counts.VENTA_CERO },
    { label: "Sin información de venta", value: counts.SIN_INFORMACION_VENTA }
  ];
}
function buildActivityAnalytics(rows) {
  const sourceRows = rows || [];
  const salesByClientPeriod = buildSalesByClientPeriod(sourceRows);
  const objectivesByActivity = buildObjectivesByActivity(sourceRows);
  const relations = buildActivityClientRelations(sourceRows, objectivesByActivity);
  const granularSales = buildGranularActivitySales(sourceRows);
  const activityPerformance = buildActivityPerformance(sourceRows, salesByClientPeriod, objectivesByActivity, relations, granularSales);
  return {
    salesByClientPeriod: salesByClientPeriod,
    objectivesByActivity: objectivesByActivity,
    activityClientRelations: relations,
    granularSalesByActivity: granularSales,
    activityPerformance: activityPerformance,
    summary: summarizeActivityAnalytics(objectivesByActivity, relations, activityPerformance)
  };
}
function buildSalesByClientPeriod(rows) {
  return resolveMetricGroups(rows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true }).map(function (group) {
    const parts = group.key.split("||");
    return Object.assign({}, group, { clientId: parts[0], period: Number(parts[1]) });
  });
}
function buildObjectivesByActivity(rows) {
  const grouped = new Map();
  rows.forEach(function (row) {
    const activityId = normalizeText(row["ID Actividad"]);
    if (!activityId) return;
    if (!grouped.has(activityId)) grouped.set(activityId, []);
    grouped.get(activityId).push(row);
  });
  return Array.from(grouped, function (entry) {
    const activityId = entry[0], activityRows = entry[1];
    const monthly = resolveActivityNumericField(activityRows, "Objetivo mes ");
    const total = resolveActivityNumericField(activityRows, "Objetivo cajas total");
    const datePairs = Array.from(new Set(activityRows.map(function (row) {
      const start = normalizeText(row["Fecha inicio"]), end = normalizeText(row["Fecha fin"]);
      return start || end ? start + "||" + end : "";
    }).filter(Boolean)));
    const dateParts = datePairs.length === 1 ? datePairs[0].split("||") : [];
    const datesValid = dateParts.length === 2 && dateOnly(dateParts[0]) && dateOnly(dateParts[1]);
    return {
      activityId: activityId,
      objectiveMonthly: monthly.value,
      objectiveStatus: monthly.status,
      objectiveSourceValues: monthly.sourceValues,
      objectiveTotal: total.value,
      objectiveTotalStatus: total.status,
      objectiveTotalSourceValues: total.sourceValues,
      dateStatus: datePairs.length > 1 || !datesValid ? "FECHAS_CONFLICTIVAS" : "OK",
      datePairs: datePairs,
      startDate: datesValid ? dateParts[0] : null,
      endDate: datesValid ? dateParts[1] : null
    };
  });
}
function resolveActivityNumericField(rows, field) {
  const sourceValues = [];
  rows.forEach(function (row) {
    const value = isFiniteNumber(row[field]) ? row[field] : parseNumberLike(row[field], field);
    if (isFiniteNumber(value) && sourceValues.indexOf(value) === -1) sourceValues.push(value);
  });
  if (!sourceValues.length) return { value: null, status: "SIN_OBJETIVO", sourceValues: sourceValues };
  if (sourceValues.length > 1) return { value: null, status: "OBJETIVO_CONFLICTIVO", sourceValues: sourceValues };
  return { value: sourceValues[0], status: "OK", sourceValues: sourceValues };
}
function buildActivityClientRelations(rows, objectivesByActivity) {
  const activityClients = new Map(), clientNames = new Map();
  rows.forEach(function (row) {
    const activityId = normalizeText(row["ID Actividad"]), clientId = normalizeText(row["Cliente SAP - Clave"]);
    if (!activityId || !clientId) return;
    if (!activityClients.has(activityId)) activityClients.set(activityId, new Set());
    activityClients.get(activityId).add(clientId);
    if (!clientNames.has(clientId)) clientNames.set(clientId, normalizeText(row["Cliente AS400 - Nombre negocio (Texto)"]) || normalizeText(row["Cliente AS400 - Texto"]));
  });
  const periods = Array.from(new Set(rows.map(getYearMonthSortValue).filter(function (period) { return period !== null; }))).sort(function (a, b) { return a - b; });
  const activeActivitiesByClientPeriod = new Map();
  objectivesByActivity.forEach(function (objective) {
    if (objective.dateStatus !== "OK") return;
    periods.forEach(function (period) {
      if (!isActivityActiveInPeriod(objective, period)) return;
      (activityClients.get(objective.activityId) || []).forEach(function (clientId) {
        const key = clientId + "||" + period;
        if (!activeActivitiesByClientPeriod.has(key)) activeActivitiesByClientPeriod.set(key, new Set());
        activeActivitiesByClientPeriod.get(key).add(objective.activityId);
      });
    });
  });
  return { activityClients: activityClients, clientNames: clientNames, periods: periods, activeActivitiesByClientPeriod: activeActivitiesByClientPeriod };
}
function isActivityActiveInPeriod(activity, period) {
  if (!activity || activity.dateStatus !== "OK") return false;
  const start = dateOnly(activity.startDate), end = dateOnly(activity.endDate);
  if (!start || !end) return false;
  const year = Math.floor(period / 100), month = period % 100;
  return start <= new Date(year, month, 0) && end >= new Date(year, month - 1, 1);
}
function buildGranularActivitySales(rows) {
  const byPresentation = new Map();
  rows.forEach(function (row, index) {
    const clientId = normalizeText(row["Cliente SAP - Clave"]), activityId = normalizeText(row["ID Actividad"]), period = getYearMonthSortValue(row);
    if (!clientId || !activityId || period === null) return;
    const presentationId = normalizeText(row["Presentación AS400 de la venta - Clave"]) || "fila-" + index;
    const key = clientId + "||" + period + "||" + activityId + "||" + presentationId;
    if (!byPresentation.has(key)) byPresentation.set(key, []);
    const value = isFiniteNumber(row["Ventas cajas físicas (sin rep)"]) ? row["Ventas cajas físicas (sin rep)"] : parseNumberLike(row["Ventas cajas físicas (sin rep)"], "Ventas cajas físicas (sin rep)");
    if (isFiniteNumber(value) && byPresentation.get(key).indexOf(value) === -1) byPresentation.get(key).push(value);
  });
  const aggregates = new Map();
  byPresentation.forEach(function (values, key) {
    const aggregateKey = key.split("||").slice(0, 3).join("||");
    if (!aggregates.has(aggregateKey)) aggregates.set(aggregateKey, { value: 0, status: "OK", presentationCount: 0, conflictKeys: [] });
    const aggregate = aggregates.get(aggregateKey);
    aggregate.presentationCount += 1;
    if (values.length !== 1) {
      aggregate.value = null;
      aggregate.status = "VENTA_CONFLICTIVA";
      aggregate.conflictKeys.push(key);
    } else if (aggregate.status === "OK") aggregate.value += values[0];
  });
  return aggregates;
}
function buildActivityPerformance(rows, salesByClientPeriod, objectivesByActivity, relations, granularSales) {
  const salesLookup = new Map(salesByClientPeriod.map(function (item) { return [item.key, item]; }));
  const performance = [];
  objectivesByActivity.forEach(function (objective) {
    relations.periods.forEach(function (period) {
      if (objective.dateStatus === "OK" && !isActivityActiveInPeriod(objective, period)) return;
      const associatedClientIds = Array.from(relations.activityClients.get(objective.activityId) || []);
      const contributionRows = associatedClientIds.map(function (clientId) {
        const clientPeriodKey = clientId + "||" + period;
        const clientSale = salesLookup.get(clientPeriodKey);
        const activeActivities = relations.activeActivitiesByClientPeriod.get(clientPeriodKey) || new Set();
        const granular = granularSales.get(clientId + "||" + period + "||" + objective.activityId);
        let sales = null, status = "SIN_VENTAS", source = "SIN_FUENTE";
        if (clientSale && clientSale.status === "CONFLICTO") status = "VENTA_CONFLICTIVA";
        else if (activeActivities.size <= 1 && clientSale && isFiniteNumber(clientSale.value)) {
          sales = clientSale.value; status = "OK"; source = "TOTAL_VENTA_CLIENTE_PERIODO";
        } else if (activeActivities.size > 1) status = "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD";
        return {
          clientId: clientId, clientName: relations.clientNames.get(clientId) || "", sales: sales,
          totalClientSales: clientSale && isFiniteNumber(clientSale.value) ? clientSale.value : null,
          negotiatedPresentationSales: granular && granular.status === "OK" ? granular.value : null,
          status: status, source: source, activeActivityCount: activeActivities.size,
          presentationCount: granular ? granular.presentationCount : 0, share: null, rank: null
        };
      });
      const invalidContribution = contributionRows.find(function (item) { return item.status !== "OK"; });
      const totalSales = invalidContribution ? null : contributionRows.reduce(function (sum, item) { return sum + item.sales; }, 0);
      const attributedSales = contributionRows.reduce(function (sum, item) { return sum + (isFiniteNumber(item.sales) ? item.sales : 0); }, 0);
      const negotiatedSales = contributionRows.every(function (item) { return isFiniteNumber(item.negotiatedPresentationSales); })
        ? contributionRows.reduce(function (sum, item) { return sum + item.negotiatedPresentationSales; }, 0)
        : null;
      let status = "OK";
      if (objective.dateStatus !== "OK") status = "FECHAS_CONFLICTIVAS";
      else if (objective.objectiveStatus === "OBJETIVO_CONFLICTIVO") status = "OBJETIVO_CONFLICTIVO";
      else if (objective.objectiveStatus !== "OK") status = "SIN_OBJETIVO";
      else if (contributionRows.some(function (item) { return item.status === "VENTA_CONFLICTIVA"; })) status = "VENTA_CONFLICTIVA";
      else if (contributionRows.some(function (item) { return item.status === "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD"; })) status = "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD";
      else if (contributionRows.some(function (item) { return item.status === "SIN_VENTAS"; })) status = "SIN_VENTAS";
      if (isFiniteNumber(totalSales) && totalSales > 0) assignContributionRanks(contributionRows, totalSales);
      const comparable = status === "OK" && isFiniteNumber(objective.objectiveMonthly) && objective.objectiveMonthly > 0;
      performance.push({
        activityId: objective.activityId, period: period, isSharedActivity: associatedClientIds.length > 1,
        associatedClientCount: associatedClientIds.length, associatedClientIds: associatedClientIds,
        objectiveMonthly: objective.objectiveMonthly, objectiveStatus: objective.objectiveStatus, objectiveTotal: objective.objectiveTotal,
        totalSales: totalSales, attributedSales: attributedSales,
        negotiatedPresentationSales: negotiatedSales,
        nonNegotiatedPresentationSales: isFiniteNumber(totalSales) && isFiniteNumber(negotiatedSales) ? totalSales - negotiatedSales : null,
        salesStatus: invalidContribution ? invalidContribution.status : "OK",
        achievement: comparable ? totalSales / objective.objectiveMonthly : null, gap: comparable ? totalSales - objective.objectiveMonthly : null,
        comparable: comparable, status: status,
        ambiguityReasons: contributionRows.filter(function (item) { return item.status !== "OK"; }).map(function (item) { return item.clientId + ": " + item.status; }),
        contributionRows: contributionRows, dateStatus: objective.dateStatus, startDate: objective.startDate, endDate: objective.endDate
      });
    });
  });
  return performance;
}
function assignContributionRanks(rows, totalSales) {
  rows.sort(function (a, b) { return b.sales - a.sales || a.clientId.localeCompare(b.clientId, "es"); });
  let previousSales = null, previousRank = 0;
  rows.forEach(function (row, index) {
    row.share = totalSales ? row.sales / totalSales : null;
    row.rank = previousSales !== null && row.sales === previousSales ? previousRank : index + 1;
    previousSales = row.sales; previousRank = row.rank;
  });
}
function summarizeActivityAnalytics(objectives, relations, performance) {
  const shared = objectives.filter(function (item) { return (relations.activityClients.get(item.activityId) || new Set()).size > 1; });
  return {
    activityCount: objectives.length, individualActivityCount: objectives.length - shared.length, sharedActivityCount: shared.length,
    maximumClientsPerActivity: Math.max.apply(null, [0].concat(Array.from(relations.activityClients.values(), function (clients) { return clients.size; }))),
    singleActivityClientPeriods: Array.from(relations.activeActivitiesByClientPeriod.values()).filter(function (items) { return items.size === 1; }).length,
    multipleActivityClientPeriods: Array.from(relations.activeActivitiesByClientPeriod.values()).filter(function (items) { return items.size > 1; }).length,
    ambiguousActivityPeriods: performance.filter(function (item) { return item.status === "VENTA_ACTIVIDAD_AMBIGUA"; }).length,
    nonComparableActivityPeriods: performance.filter(function (item) { return !item.comparable; }).length,
    objectiveConflictActivities: objectives.filter(function (item) { return item.objectiveStatus === "OBJETIVO_CONFLICTIVO"; }).length,
    totalObjectiveConflictActivities: objectives.filter(function (item) { return item.objectiveTotalStatus === "OBJETIVO_CONFLICTIVO"; }).length,
    dateConflictActivities: objectives.filter(function (item) { return item.dateStatus === "FECHAS_CONFLICTIVAS"; }).length
  };
}
function aggregateActivityPerformance(performance) {
  const eligible = performance.filter(function (item) { return item.objectiveStatus === "OK" && item.dateStatus === "OK"; });
  const comparable = eligible.filter(function (item) { return item.comparable; });
  const sales = comparable.reduce(function (sum, item) { return sum + item.totalSales; }, 0);
  const objective = comparable.reduce(function (sum, item) { return sum + item.objectiveMonthly; }, 0);
  return {
    sales: sales, objective: objective,
    objectiveAll: eligible.reduce(function (sum, item) { return sum + item.objectiveMonthly; }, 0),
    achievement: objective > 0 ? sales / objective : null, gap: objective > 0 ? sales - objective : null,
    comparableCount: comparable.length, eligibleCount: eligible.length, totalCount: performance.length
  };
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
function normalizeSearchText(value) {
  return normalizeText(value).toLocaleLowerCase("es-CO").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
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
function formatMetric(value) { return isFiniteNumber(value) ? formatNumber(value) : "N/A"; }
function formatMetricPercent(value) { return isFiniteNumber(value) ? formatRatioPercent(value) : "N/A"; }
function formatActivityStatus(status) {
  const labels = {
    OK: "Válida", SIN_OBJETIVO: "Sin objetivo", SIN_VENTAS: "Sin ventas",
    OBJETIVO_CONFLICTIVO: "Objetivo conflictivo", VENTA_CONFLICTIVA: "Venta conflictiva",
    VENTA_ACTIVIDAD_AMBIGUA: "Venta de actividad ambigua", REQUIERE_DISTRIBUCION_MULTIACTIVIDAD: "Requiere distribución multiactividad", FECHAS_CONFLICTIVAS: "Fechas conflictivas",
    ACTIVIDAD_AUN_NO_INICIADA: "Actividad aún no iniciada",
    SIN_ACTIVIDAD_COMPARABLE_EN_PERIODO: "Sin actividad comparable en el período"
  };
  return labels[status] || status || "N/A";
}
function formatActivityValidity(activity) {
  if (!activity || activity.dateStatus !== "OK") return "Revisar fechas";
  if (activity.status === "ACTIVIDAD_AUN_NO_INICIADA") return "Aún no iniciada";
  return isActivityActiveInPeriod(activity, activity.period) ? "Vigente en el período" : "Fuera del período";
}
function formatDateRange(start, end) {
  return formatIsoDate(start) + " a " + formatIsoDate(end);
}
function formatIsoDate(value) {
  const date = dateOnly(value);
  return date ? new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date) : "N/A";
}
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
  return formatRatioPercent(displayValue);
}
function formatRatioPercent(value) {
  if (!isFiniteNumber(value)) return "N/A";
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value * 100) + " %";
}
function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("es-CO");
}
function refreshIcons(root, nameAttr) {
  if (!window.lucide) return;
  try {
    if (root && nameAttr) window.lucide.createIcons({ icons: window.lucide.icons, nameAttr: nameAttr });
    else window.lucide.createIcons();
  } catch (error) {
    reportDashboardDiagnostic("warning", "lucide", error, "No se pudieron actualizar algunos iconos; se conservan los fallbacks.");
  }
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
`;
}
