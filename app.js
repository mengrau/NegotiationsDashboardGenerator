"use strict";

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

const NUMERIC_COLUMNS = new Set([
  "Año",
  "Año Mes",
  "Ventas cajas físicas (sin rep)",
  "TotalVentaMes",
  "Objetivo mes ",
  "Objetivo cajas total",
  "% De inversión",
  "Porcentaje descuento negociación",
  "Porcentaje descuento venta",
  "Porcentaje descuento mes"
]);

const ZERO_WHEN_EMPTY_NUMERIC_COLUMNS = new Set(["Ventas cajas físicas (sin rep)"]);
const PERCENTAGE_COLUMNS = new Set([
  "% De inversión",
  "Porcentaje descuento negociación",
  "Porcentaje descuento venta",
  "Porcentaje descuento mes"
]);
const FLEXIBLE_DECIMAL_NUMERIC_COLUMNS = new Set([
  "TotalVentaMes",
  "% De inversión",
  "Porcentaje descuento negociación",
  "Porcentaje descuento venta",
  "Porcentaje descuento mes"
]);
const MONTH_INDEX = new Map([
  ["ENE", 1], ["ENERO", 1], ["FEB", 2], ["FEBRERO", 2], ["MAR", 3], ["MARZO", 3],
  ["ABR", 4], ["ABRIL", 4], ["MAY", 5], ["MAYO", 5], ["JUN", 6], ["JUNIO", 6],
  ["JUL", 7], ["JULIO", 7], ["AGO", 8], ["AGOSTO", 8], ["SEP", 9], ["SEPT", 9],
  ["SEPTIEMBRE", 9], ["OCT", 10], ["OCTUBRE", 10], ["NOV", 11], ["NOVIEMBRE", 11],
  ["DIC", 12], ["DICIEMBRE", 12]
]);

const TEXT_COLUMNS = new Set([
  "Mes",
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
  "ID Actividad",
  "Tipo descuento",
  "Periodo negociacion",
  "Cedi"
]);

const DATE_COLUMNS = new Set(["Fecha inicio", "Fecha fin"]);
const SALES_INFORMATION_STATUS = {
  WITHOUT_SALES_INFO: "SIN_INFORMACION_VENTA",
  ZERO_SALE: "VENTA_CERO",
  WITH_SALE: "CON_VENTA"
};
const SALES_VALUE_COLUMN = "Ventas cajas físicas (sin rep)";
const PRESENTATION_ID_FIELDS = [
  "Presentación AS400 de la venta - Texto",
  "Presentación AS400 de la venta - Clave"
];
const BLOCKING_COLUMNS = [
  "Año", "Mes", "Cliente SAP - Clave", "Ventas cajas físicas (sin rep)", "TotalVentaMes",
  "Objetivo mes ", "ID Actividad", "Fecha inicio", "Fecha fin"
];
const OPTIONAL_ANALYTIC_COLUMNS = [
  "Año Mes", "Canal", "Categoría AS400 de la venta", "Presentación AS400 de la venta - Texto",
  "Presentación AS400 de la venta - Clave", "Región SAP", "Objetivo cajas total", "Cedi"
];
const INFORMATIONAL_COLUMNS = REQUIRED_COLUMNS.filter((column) => BLOCKING_COLUMNS.indexOf(column) === -1 && OPTIONAL_ANALYTIC_COLUMNS.indexOf(column) === -1);
const NEGOTIATION_ID_FIELDS = [
  "Cliente SAP - Clave",
  "ID Actividad",
  "Presentación AS400 de la venta - Clave"
];
const SALES_CONTEXT_FIELDS = [
  "Año",
  "Mes",
  "Año Mes",
  "Centro - Clave",
  "Canal",
  "Nit cliente - Clave",
  "Región SAP",
  "Tipología",
  "Cliente AS400 - Texto",
  "Cliente AS400 - Nombre negocio (Texto)"
];
const BLANK_TEXT_MARKERS = new Set(["", "-", "–", "—"]);
const HEADER_ALIASES = new Map([
  ["Categoría AS400 de la venta", ["Categoria AS400 de la venta", "Categoría AS400 de venta", "Categoria AS400 de venta", "Categoría AS400", "Categoria AS400", "Categoría", "Categoria"]],
  ["Ventas cajas físicas (sin rep)", ["Ventas cajas físicas mes (sin rep)"]],
  ["Objetivo mes ", ["Objetivo mes"]],
  ["% De inversión", ["% De inversion", "Porcentaje de inversión", "Porcentaje de inversion"]],
  ["Porcentaje descuento negociación", ["Porcentaje descuento", "Porcentaje descuento negociacion"]],
  ["Porcentaje descuento venta", ["Porcentaje de descuento venta"]],
  ["Porcentaje descuento mes", ["Porcentaje de descuento mes"]],
  ["TotalVentaMes", ["Total venta mes", "Total Venta Mes", "Total ventas mes", "Total Ventas Mes"]]
]);
const THEME_KEY = "dashboardTheme";
const RUNTIME_DIAGNOSTIC_LIMIT = 40;

const state = {
  file: null,
  workbook: null,
  sheetName: "",
  headers: [],
  rowsRaw: [],
  ignoredEmptyRows: 0,
  validation: null,
  processedRows: [],
  clientNegotiationModels: null,
  indexes: null,
  quality: null,
  generatedHtml: "",
  previewObjectUrl: "",
  previewVisible: false,
  loadVersion: 0,
  processVersion: 0,
  processing: false,
  runtimeDiagnostics: { errors: [], warnings: [] }
};

const els = {};

function isGeneratorDebugEnabled() {
  return Boolean(window.__DASHBOARD_DEBUG__ || window.__DASHBOARD_PERF_DEBUG__);
}
function reportGeneratorDiagnostic(level, component, error, message) {
  const bucket = level === "error" ? "errors" : "warnings";
  const diagnostic = {
    component: normalizeCellText(component) || "generator",
    message: normalizeCellText(message || (error && error.message) || "Incidencia técnica").slice(0, 240),
    name: normalizeCellText(error && error.name).slice(0, 80),
    at: new Date().toISOString()
  };
  state.runtimeDiagnostics[bucket].push(diagnostic);
  if (state.runtimeDiagnostics[bucket].length > RUNTIME_DIAGNOSTIC_LIMIT) state.runtimeDiagnostics[bucket].splice(0, state.runtimeDiagnostics[bucket].length - RUNTIME_DIAGNOSTIC_LIMIT);
  if (isGeneratorDebugEnabled() && window.console) {
    const method = level === "error" ? "error" : "warn";
    if (typeof window.console[method] === "function") window.console[method]("Generator " + diagnostic.component + ": " + diagnostic.message);
  }
  return diagnostic;
}
function getGeneratorDiagnosticsSnapshot() {
  return { errors: state.runtimeDiagnostics.errors.slice(), warnings: state.runtimeDiagnostics.warnings.slice(), limit: RUNTIME_DIAGNOSTIC_LIMIT };
}

document.addEventListener("DOMContentLoaded", () => {
  window.__getGeneratorDiagnostics = getGeneratorDiagnosticsSnapshot;
  cacheElements();
  initTheme();
  bindEvents();
  refreshIcons();
  updateStepper("upload");
});

function cacheElements() {
  Object.assign(els, {
    dropZone: document.getElementById("dropZone"),
    fileInput: document.getElementById("fileInput"),
    selectFileButton: document.getElementById("selectFileButton"),
    sheetSelect: document.getElementById("sheetSelect"),
    sheetField: document.getElementById("sheetField"),
    fileName: document.getElementById("fileName"),
    fileSize: document.getElementById("fileSize"),
    fileExtension: document.getElementById("fileExtension"),
    uploadStateBadge: document.getElementById("uploadStateBadge"),
    flowBadge: document.getElementById("flowBadge"),
    statusMessage: document.getElementById("statusMessage"),
    processButton: document.getElementById("processButton"),
    downloadButton: document.getElementById("downloadButton"),
    clearButton: document.getElementById("clearButton"),
    openPreviewButton: document.getElementById("openPreviewButton"),
    fileLoadedMetric: document.getElementById("fileLoadedMetric"),
    sheetsCount: document.getElementById("sheetsCount"),
    rowsRead: document.getElementById("rowsRead"),
    validRows: document.getElementById("validRows"),
    warningRows: document.getElementById("warningRows"),
    columnsCount: document.getElementById("columnsCount"),
    detectedColumns: document.getElementById("detectedColumns"),
    extraColumnsBadge: document.getElementById("extraColumnsBadge"),
    validationBadge: document.getElementById("validationBadge"),
    validationDetails: document.getElementById("validationDetails"),
    qualityBadge: document.getElementById("qualityBadge"),
    qualitySummary: document.getElementById("qualitySummary"),
    previewBadge: document.getElementById("previewBadge"),
    previewEmpty: document.getElementById("previewEmpty"),
    previewWindow: document.getElementById("previewWindow"),
    previewFrame: document.getElementById("previewFrame"),
    themeToggle: document.getElementById("themeToggle")
  });
}

function bindEvents() {
  els.selectFileButton.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) {
      handleFile(file);
    }
  });

  els.dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.dropZone.classList.add("drag-over");
  });

  els.dropZone.addEventListener("dragleave", () => {
    els.dropZone.classList.remove("drag-over");
  });

  els.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("drag-over");
    const [file] = event.dataTransfer.files;
    if (file) {
      handleFile(file);
    }
  });

  els.dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.fileInput.click();
    }
  });

  els.sheetSelect.addEventListener("change", () => {
    state.sheetName = els.sheetSelect.value;
    readSelectedSheet();
  });

  els.processButton.addEventListener("click", processCurrentSheet);
  els.downloadButton.addEventListener("click", () => {
    if (!state.generatedHtml) {
      return;
    }
    downloadHtml(buildDashboardFilename(), state.generatedHtml);
  });
  els.openPreviewButton?.addEventListener("click", togglePreviewDashboard);
  els.clearButton.addEventListener("click", resetState);
  els.themeToggle?.addEventListener("click", toggleTheme);
}

function initTheme() {
  applyTheme(getPreferredTheme(), false);
}

function getPreferredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (error) {
    reportGeneratorDiagnostic("warning", "theme-read", error, "No se pudo leer la preferencia de tema.");
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getCurrentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme, persist = true) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalizedTheme;
  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, normalizedTheme);
    } catch (error) {
      reportGeneratorDiagnostic("warning", "theme-write", error, "No se pudo guardar la preferencia de tema.");
    }
  }
  updateThemeToggle(normalizedTheme);
}

function toggleTheme() {
  applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
}

function updateThemeToggle(theme) {
  if (!els.themeToggle) {
    return;
  }
  const nextTheme = theme === "dark" ? "light" : "dark";
  const icon = theme === "dark" ? "sun" : "moon";
  const label = theme === "dark" ? "Claro" : "Oscuro";
  els.themeToggle.setAttribute("aria-label", `Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}`);
  els.themeToggle.innerHTML = `<i data-lucide="${icon}"></i><span>${label}</span>`;
  refreshIcons();
}

async function handleFile(file) {
  resetState(false);
  const loadVersion = state.loadVersion;
  state.file = file;
  els.fileName.textContent = file.name;
  els.fileSize.textContent = formatFileSize(file.size);
  els.fileExtension.textContent = getFileExtension(file.name).toUpperCase();
  els.fileLoadedMetric.textContent = "Sí";
  els.dropZone.classList.add("has-file");
  setBadge(els.uploadStateBadge, "Archivo cargado", "success");
  updateStepper("validate");
  setStatus("info", "Leyendo archivo Excel...");

  try {
    const workbook = await parseExcelFile(file);
    if (loadVersion !== state.loadVersion) return;
    state.workbook = workbook;
    if (!state.workbook.SheetNames.length) {
      throw new Error("El archivo no contiene hojas.");
    }
    populateSheetSelect(state.workbook.SheetNames);
    els.sheetsCount.textContent = formatInteger(state.workbook.SheetNames.length);
    state.sheetName = state.workbook.SheetNames[0];
    els.sheetSelect.value = state.sheetName;
    readSelectedSheet();
  } catch (error) {
    if (loadVersion !== state.loadVersion) return;
    reportGeneratorDiagnostic("error", "workbook-read", error, "No se pudo leer el archivo Excel.");
    setStatus("error", "No se pudo leer el archivo Excel. Verifica que sea un archivo .xlsx o .xls válido.");
    updateStepper("upload", "error");
    els.processButton.disabled = true;
  }
}

function populateSheetSelect(sheetNames) {
  els.sheetSelect.innerHTML = "";
  sheetNames.forEach((sheetName) => {
    const option = document.createElement("option");
    option.value = sheetName;
    option.textContent = sheetName;
    els.sheetSelect.appendChild(option);
  });
  els.sheetSelect.disabled = sheetNames.length <= 1;
  els.sheetField?.classList.remove("is-hidden");
}

function readSelectedSheet() {
  if (!state.workbook || !state.sheetName) {
    return;
  }

  const worksheet = state.workbook.Sheets[state.sheetName];
  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: true,
    dateNF: "yyyy-mm-dd",
    blankrows: false
  });

  resetProcessedOutput();

  if (!matrix.length || !Array.isArray(matrix[0]) || matrix[0].every(isEmptyCell)) {
    state.headers = [];
    state.rowsRaw = [];
    state.validation = { missing: BLOCKING_COLUMNS.slice(), optionalMissing: OPTIONAL_ANALYTIC_COLUMNS.slice(), informationalMissing: INFORMATIONAL_COLUMNS.slice(), extras: [], isValid: false };
    renderSheetValidation();
    setStatus("error", "La primera fila no contiene encabezados.");
    setPreviewState("error");
    updateStepper("validate", "error");
    return;
  }

  state.headers = matrix[0].map((header) => normalizeCellText(header));
  const rawDataRows = matrix.slice(1);
  const rows = [];
  let ignoredEmptyRows = 0;

  rawDataRows.forEach((row) => {
    if (!row || row.every(isEmptyCell)) {
      ignoredEmptyRows += 1;
      return;
    }
    rows.push(row);
  });

  state.rowsRaw = rows;
  state.ignoredEmptyRows = ignoredEmptyRows;
  state.validation = validateColumns(state.headers);
  renderSheetValidation();

  if (!rows.length) {
    setStatus("error", "El archivo no contiene filas de datos.");
    setPreviewState("error");
    updateStepper("validate", "error");
    els.processButton.disabled = true;
    return;
  }

  if (!state.validation.isValid) {
    setStatus("error", "Faltan columnas obligatorias en el archivo.");
    setPreviewState("error");
    updateStepper("validate", "error");
    els.processButton.disabled = true;
    return;
  }

  const hasNonBlockingWarnings = state.validation.extras.length || state.validation.optionalMissing.length;
  const extraMessage = hasNonBlockingWarnings
    ? `Estructura procesable con ${state.validation.optionalMissing.length} columna(s) analítica(s) opcional(es) ausente(s) y ${state.validation.extras.length} extra(s).`
    : "Estructura válida. Puedes procesar el archivo.";
  setStatus(hasNonBlockingWarnings ? "warning" : "success", extraMessage);
  updateStepper("process");
  els.processButton.disabled = false;
}

function renderSheetValidation() {
  els.rowsRead.textContent = formatInteger(state.rowsRaw.length);
  els.validRows.textContent = "0";
  els.warningRows.textContent = "0";
  els.columnsCount.textContent = formatInteger(state.headers.length);

  if (!state.headers.length) {
    els.detectedColumns.className = "structure-summary empty-state compact";
    els.detectedColumns.innerHTML = '<i data-lucide="columns-3"></i><span>Aún no se ha leído ningún archivo.</span>';
  } else {
    const validation = state.validation || { missing: [], extras: [] };
    const requiredDetected = BLOCKING_COLUMNS.length - validation.missing.length;
    const summaryTone = validation.missing.length ? "is-invalid" : validation.extras.length ? "is-warning" : "is-valid";
    const summaryIcon = validation.missing.length ? "circle-alert" : validation.extras.length ? "triangle-alert" : "check-circle-2";
    const summaryTitle = validation.missing.length ? "Estructura incompleta" : "Estructura validada";
    const extraText = validation.extras.length
      ? `${validation.extras.length} columna(s) extra detectada(s)`
      : "Sin columnas extra";
    els.detectedColumns.className = `structure-summary ${summaryTone}`;
    els.detectedColumns.innerHTML = `
      <span class="structure-icon"><i data-lucide="${summaryIcon}"></i></span>
      <div>
        <strong>${summaryTitle}</strong>
        <span>${formatInteger(requiredDetected)} de ${formatInteger(BLOCKING_COLUMNS.length)} columnas obligatorias detectadas</span>
        <small>${validation.missing.length ? `${formatInteger(validation.missing.length)} columna(s) faltante(s)` : "Sin columnas faltantes"} · ${extraText}</small>
      </div>`;
  }

  const validation = state.validation || { missing: [], optionalMissing: [], informationalMissing: [], extras: [], isValid: false };
  els.validationDetails.className = "validation-details";
  els.extraColumnsBadge.textContent = validation.extras.length
    ? `${validation.extras.length} extra(s)`
    : "Sin extras";
  els.extraColumnsBadge.className = `badge ${validation.extras.length ? "badge-warn" : "badge-success"}`;
  els.validationBadge.textContent = validation.isValid ? "Válida" : "Con errores";
  els.validationBadge.className = `badge ${validation.isValid ? "badge-success" : "badge-bad"}`;

  const missingHtml = validation.missing.length
    ? `<div class="validation-alert validation-alert-error"><strong>Columnas faltantes</strong><ul>${validation.missing
        .map((column) => `<li class="missing-item">${escapeHtml(column)}</li>`)
        .join("")}</ul></div>`
    : '<div class="validation-alert validation-alert-success"><strong>Columnas requeridas completas</strong><p>No faltan columnas obligatorias.</p></div>';
  const extraHtml = validation.extras.length
    ? `<div class="validation-alert validation-alert-warning"><strong>Columnas extra</strong><p>${formatInteger(
        validation.extras.length
      )} columna(s) adicional(es) detectada(s). Se conservará la validación y se procesarán las columnas requeridas.</p></div>`
    : '<div class="validation-alert validation-alert-success"><strong>Sin columnas extra</strong><p>La estructura coincide con el formato esperado.</p></div>';
  const optionalHtml = validation.optionalMissing.length
    ? '<div class="validation-alert validation-alert-warning"><strong>Funciones analíticas no disponibles</strong><p>Faltan: ' + validation.optionalMissing.map(escapeHtml).join(", ") + '. El dashboard continuará sin esas dimensiones.</p></div>'
    : '<div class="validation-alert validation-alert-success"><strong>Columnas analíticas completas</strong><p>Las dimensiones opcionales están disponibles.</p></div>';
  els.validationDetails.innerHTML = missingHtml + optionalHtml + extraHtml;
  refreshIcons();
}

function processCurrentSheet() {
  if (state.processing || !state.validation || !state.validation.isValid || !state.rowsRaw.length) {
    return;
  }
  state.processing = true;
  state.processVersion += 1;
  const processVersion = state.processVersion;

  state.generatedHtml = "";
  closePreviewDashboard({ nextState: "loading" });
  els.downloadButton.hidden = true;
  setStatus("info", "Procesando " + formatInteger(state.rowsRaw.length) + " registros...");
  updateStepper("process");
  els.processButton.disabled = true;
  els.processButton.classList.add("is-loading");

  window.setTimeout(() => {
    if (processVersion !== state.processVersion) return;
    try {
      const headerMap = buildHeaderMap(state.headers);
      state.processedRows = state.rowsRaw.map((row) => {
        const rowObject = {};
        REQUIRED_COLUMNS.forEach((requiredColumn) => {
          const actualIndex = getHeaderIndex(headerMap, requiredColumn);
          rowObject[requiredColumn] = actualIndex === undefined ? null : row[actualIndex];
        });
        return normalizeRow(rowObject);
      });
      initializeProcessedDataIndexes(state.processedRows);
      state.clientNegotiationModels = buildClientNegotiationModels(state.processedRows);

      state.quality = buildDataQualityReport(state.processedRows, {
        ignoredEmptyRows: state.ignoredEmptyRows,
        extraColumns: state.validation.extras,
        sourceFileName: state.file ? state.file.name : "",
        detectedColumns: state.headers
      });

      const metadata = buildMetadata();
      state.generatedHtml = generateDashboardHtml({
        rows: state.processedRows,
        metadata,
        quality: state.quality
      });

      renderQualitySummary(state.quality);
      setPreviewState("ready");
      els.validRows.textContent = formatInteger(state.processedRows.length);
      els.warningRows.textContent = formatInteger(state.quality.rowsWithWarnings);
      els.downloadButton.hidden = false;
      updateStepper("download");
      setStatus("success", "Dashboard generado correctamente. Puedes descargarlo o abrir la vista previa.");
    } catch (error) {
      reportGeneratorDiagnostic("error", "dashboard-generation", error, "No se pudo generar el dashboard.");
      updateStepper("process", "error");
      setStatus("error", "No se pudo generar el dashboard. Revisa el archivo e inténtalo de nuevo.");
      setPreviewState("error");
    } finally {
      if (processVersion === state.processVersion) {
        state.processing = false;
        els.processButton.disabled = false;
        els.processButton.classList.remove("is-loading");
      }
    }
  }, 60);
}

function buildHeaderMap(headers) {
  const map = new Map();
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (normalized && !map.has(normalized)) {
      map.set(normalized, index);
    }
  });
  return map;
}

function normalizeHeader(header) {
  return normalizeCellText(header).replace(/\s+/g, " ").trim().toLocaleLowerCase("es-CO");
}

function getHeaderVariants(column) {
  return [column].concat(HEADER_ALIASES.get(column) || []);
}

function getHeaderIndex(headerMap, column) {
  const variants = getHeaderVariants(column);
  for (const variant of variants) {
    const actualIndex = headerMap.get(normalizeHeader(variant));
    if (actualIndex !== undefined) {
      return actualIndex;
    }
  }
  return undefined;
}

function validateColumns(headers) {
  const normalizedHeaders = new Set(headers.map(normalizeHeader).filter(Boolean));
  const expectedHeaders = new Set(
    REQUIRED_COLUMNS.reduce((columns, column) => columns.concat(getHeaderVariants(column)), []).map(normalizeHeader)
  );

  const missing = BLOCKING_COLUMNS.filter((column) => {
    return !getHeaderVariants(column).some((variant) => normalizedHeaders.has(normalizeHeader(variant)));
  });
  const optionalMissing = OPTIONAL_ANALYTIC_COLUMNS.filter((column) => !getHeaderVariants(column).some((variant) => normalizedHeaders.has(normalizeHeader(variant))));
  const informationalMissing = INFORMATIONAL_COLUMNS.filter((column) => !getHeaderVariants(column).some((variant) => normalizedHeaders.has(normalizeHeader(variant))));
  const extras = headers.filter((header) => {
    const normalized = normalizeHeader(header);
    return normalized && !expectedHeaders.has(normalized);
  });

  return {
    missing,
    optionalMissing,
    informationalMissing,
    extras,
    isValid: missing.length === 0
  };
}

async function parseExcelFile(file) {
  if (!window.XLSX) {
    throw new Error("SheetJS no está disponible.");
  }
  const data = await file.arrayBuffer();
  return XLSX.read(data, {
    type: "array",
    cellDates: true,
    dense: false
  });
}

function parseNumber(value, column = "") {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined) {
    return null;
  }

  let text = normalizeCellText(value);
  if (isBlankText(text)) {
    return null;
  }

  let isNegative = false;
  if (/^\(.+\)$/.test(text)) {
    isNegative = true;
    text = text.slice(1, -1);
  }

  text = text
    .replace(/\s/g, "")
    .replace(/[^0-9,.\-]/g, "");

  if (!text || text === "-") {
    return null;
  }

  text = FLEXIBLE_DECIMAL_NUMERIC_COLUMNS.has(column) ? normalizeFlexibleDecimalNumberText(text) : normalizeNumberText(text);

  const number = Number(text);
  if (!Number.isFinite(number)) {
    return null;
  }
  return isNegative ? -number : number;
}

function isDotThousandsNumber(text) {
  return /^-?\d{1,3}(\.\d{3})+$/.test(text);
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
  if ((text.match(/\./g) || []).length > 1 && isDotThousandsNumber(text)) {
    return text.split(".").join("");
  }
  return text;
}

function normalizePercentage(value) {
  if (value === null || value === undefined || isEmptyCell(value)) return null;
  const containsPercent = typeof value === "string" && value.includes("%");
  let numericValue;
  if (typeof value === "number") {
    numericValue = Number.isFinite(value) ? value : null;
  } else {
    let text = normalizeCellText(value).replace(/%/g, "").replace(/\s/g, "");
    let negative = false;
    if (/^\(.+\)$/.test(text)) {
      negative = true;
      text = text.slice(1, -1);
    }
    text = text.replace(/[^0-9,\.\-+]/g, "");
    if (!text || text === "-" || text === "+") return null;
    if (text.includes(",") && text.includes(".")) return null;
    const separator = text.includes(",") ? "," : ".";
    if (text.split(separator).length - 1 > 1) return null;
    numericValue = Number(text.replace(",", "."));
    if (negative) numericValue = -numericValue;
  }
  if (!Number.isFinite(numericValue)) return null;
  return containsPercent || Math.abs(numericValue) > 1 ? numericValue / 100 : numericValue;
}

function parseDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toIsoDate(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0) {
      return null;
    }
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + Math.floor(value) * 86400000);
    return toIsoDate(date);
  }

  if (value === null || value === undefined) {
    return null;
  }

  const text = normalizeCellText(value);
  if (isBlankText(text)) {
    return null;
  }

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return buildIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const dayFirstMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (dayFirstMatch) {
    return buildIsoDate(normalizeYear(Number(dayFirstMatch[3])), Number(dayFirstMatch[2]), Number(dayFirstMatch[1]));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : toIsoDate(parsed);
}

function normalizeRow(row) {
  const normalized = {
    __warnings: []
  };

  REQUIRED_COLUMNS.forEach((column) => {
    const value = getWorkbookColumnValue(row, column);
    if (NUMERIC_COLUMNS.has(column)) {
      normalized[column] = PERCENTAGE_COLUMNS.has(column)
        ? normalizePercentage(value)
        : ZERO_WHEN_EMPTY_NUMERIC_COLUMNS.has(column) && isEmptyCell(value) ? 0 : parseNumber(value, column);
    } else if (DATE_COLUMNS.has(column)) {
      const parsedDate = parseDate(value);
      normalized[column] = parsedDate;
      if (!isEmptyCell(value) && !parsedDate) {
        normalized.__warnings.push(`Fecha inválida: ${column}`);
      }
    } else if (TEXT_COLUMNS.has(column)) {
      normalized[column] = normalizeCellText(value);
    } else {
      normalized[column] = value ?? "";
    }
  });

  const period = getCanonicalPeriod(normalized);
  normalized.__periodKey = period.key;
  normalized.__periodLabel = period.label;
  normalized.__periodSource = period.source;
  normalized.__periodOrder = period.key;
  normalized.__periodDate = period.key ? `${Math.floor(period.key / 100)}-${pad2(period.key % 100)}-01` : null;
  normalized.estadoInformacionVenta = classifySalesInformation(normalized);

  // Contrato interno estable. Las claves originales se conservan para no alterar
  // las vistas existentes mientras el adaptador desacopla el análisis del Excel.
  defineInternalWorkbookFields(normalized, buildInternalWorkbookRow(normalized, period));
  normalized["Porcentaje descuento"] = normalized["Porcentaje descuento negociación"];

  const withoutSalesInformation = isWithoutSalesInformation(normalized);
  if (!withoutSalesInformation && !normalized["Nit cliente - Clave"]) {
    normalized.__warnings.push("Sin NIT cliente");
  }
  if (!withoutSalesInformation && !normalized["Cliente SAP - Clave"]) {
    normalized.__warnings.push("Sin cliente SAP");
  }
  if (!normalized["Presentación AS400 de la venta - Clave"]) {
    normalized.__warnings.push("Sin presentación");
  }
  if (normalized["Objetivo mes "] === null) {
    normalized.__warnings.push("Sin objetivo");
  }
  if (normalized["Ventas cajas físicas (sin rep)"] === null) {
    normalized.__warnings.push("Ventas inválidas");
  }
  if (normalized["TotalVentaMes"] === null) {
    normalized.__warnings.push("Total venta mes inválido");
  }
  if (hasTemporalSource(normalized) && period.key === null) {
    normalized.__warnings.push("Mes no interpretable");
  }

  normalized["Estado de vigencia"] = getVigenciaStatus(normalized["Fecha inicio"], normalized["Fecha fin"]);
  return normalized;
}

function normalizeWorkbookRow(row) {
  return normalizeRow(row);
}

function defineInternalWorkbookFields(target, fields) {
  Object.keys(fields).forEach((field) => {
    Object.defineProperty(target, field, {
      value: fields[field],
      writable: true,
      configurable: true,
      enumerable: false
    });
  });
  return target;
}

function getWorkbookColumnValue(row, column) {
  if (row && Object.prototype.hasOwnProperty.call(row, column)) {
    return row[column];
  }
  const aliases = HEADER_ALIASES.get(column) || [];
  for (const alias of aliases) {
    if (row && Object.prototype.hasOwnProperty.call(row, alias)) {
      return row[alias];
    }
  }
  return undefined;
}

function buildInternalWorkbookRow(row, period) {
  const clientName = normalizeCellText(row["Cliente AS400 - Nombre negocio (Texto)"])
    || normalizeCellText(row["Cliente AS400 - Texto"])
    || normalizeCellText(row["Cliente SAP - Clave"]);
  const hasNegotiation = Boolean(normalizeCellText(row["Cliente SAP - Clave"]) && normalizeCellText(row["ID Actividad"]));
  const withoutPeriod = hasNegotiation && !period.key;
  return {
    year: parseCanonicalYear(row["Año"]),
    month: parseCanonicalMonth(row["Mes"]),
    periodKey: period.key,
    periodLabel: period.key ? formatBusinessPeriodLabel(period.key) : "",
    periodDate: period.key ? `${Math.floor(period.key / 100)}-${pad2(period.key % 100)}-01` : null,
    periodOrder: period.key,
    periodStatus: withoutPeriod ? "SIN_PERIODO_DE_VENTA" : period.key ? "CON_PERIODO" : "SIN_PERIODO",
    evaluationStatus: withoutPeriod ? "NO_EVALUABLE" : null,
    centerCode: normalizeCellText(row["Centro - Clave"]),
    channel: normalizeCellText(row["Canal"]),
    category: normalizeCellText(row["Categoría AS400 de la venta"]),
    clientNit: normalizeCellText(row["Nit cliente - Clave"]),
    presentationName: normalizeCellText(row["Presentación AS400 de la venta - Texto"]),
    presentationCode: normalizeCellText(row["Presentación AS400 de la venta - Clave"]),
    region: normalizeCellText(row["Región SAP"]),
    typology: normalizeCellText(row["Tipología"]),
    clientAs400: normalizeCellText(row["Cliente AS400 - Texto"]),
    clientSap: normalizeCellText(row["Cliente SAP - Clave"]),
    clientName,
    physicalSales: row["Ventas cajas físicas (sin rep)"],
    monthlyObjective: row["Objetivo mes "],
    investmentPercentage: row["% De inversión"],
    activityId: normalizeCellText(row["ID Actividad"]),
    startDate: row["Fecha inicio"],
    endDate: row["Fecha fin"],
    totalObjective: row["Objetivo cajas total"],
    discountType: normalizeCellText(row["Tipo descuento"]),
    negotiationDiscountPercentage: row["Porcentaje descuento negociación"],
    saleDiscountPercentage: row["Porcentaje descuento venta"],
    monthlyDiscountPercentage: row["Porcentaje descuento mes"],
    negotiationPeriod: parseNumber(row["Periodo negociacion"], "Periodo negociacion"),
    cedi: normalizeCellText(row.Cedi),
    totalMonthlySales: row.TotalVentaMes
  };
}

function formatBusinessPeriodLabel(periodKey) {
  if (!Number.isInteger(periodKey)) return "";
  const year = Math.floor(periodKey / 100);
  const month = periodKey % 100;
  const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return month >= 1 && month <= 12 ? `${monthNames[month - 1]} ${year}` : "";
}

function getCanonicalPeriod(row) {
  const year = parseCanonicalYear(row["Año"]);
  const month = parseCanonicalMonth(row["Mes"]);
  if (year && month) {
    return buildCanonicalPeriod(year, month, "Año + Mes");
  }

  const source = normalizeCellText(row["Año Mes"]).replace(/\s/g, "");
  if (!source) {
    return { key: null, label: "", source: "AUSENTE" };
  }
  const monthYear = source.match(/^(\d{1,2})[./-]?(\d{4})$/);
  if (monthYear) {
    return buildCanonicalPeriod(Number(monthYear[2]), Number(monthYear[1]), "Año Mes");
  }
  const yearMonth = source.match(/^(\d{4})[./-]?(\d{1,2})$/);
  if (yearMonth) {
    return buildCanonicalPeriod(Number(yearMonth[1]), Number(yearMonth[2]), "Año Mes");
  }
  return { key: null, label: "", source: "INVALIDO" };
}

function parseCanonicalYear(value) {
  const number = typeof value === "number" ? value : Number(normalizeCellText(value));
  return Number.isInteger(number) && number >= 1900 && number <= 2200 ? number : null;
}

function parseCanonicalMonth(value) {
  const text = normalizeCellText(value).toLocaleUpperCase("es-CO").replace(/\./g, "");
  if (MONTH_INDEX.has(text)) {
    return MONTH_INDEX.get(text);
  }
  const number = Number(text);
  return Number.isInteger(number) && number >= 1 && number <= 12 ? number : null;
}

function buildCanonicalPeriod(year, month, source) {
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    return { key: null, label: "", source: "INVALIDO" };
  }
  return { key: year * 100 + month, label: `${year}-${pad2(month)}`, source };
}

function hasTemporalSource(row) {
  return hasUsableValue(row["Año"]) || hasUsableValue(row["Mes"]) || hasUsableValue(row["Año Mes"]);
}

function classifySalesInformation(row) {
  const sales = numberForCalc(row[SALES_VALUE_COLUMN]);
  if (sales > 0) {
    return SALES_INFORMATION_STATUS.WITH_SALE;
  }

  const hasPresentation = PRESENTATION_ID_FIELDS.some((field) => hasUsableValue(row[field]));
  const hasNegotiationReference = NEGOTIATION_ID_FIELDS.some((field) => hasUsableValue(row[field]));
  const hasSalesContext = SALES_CONTEXT_FIELDS.some((field) => hasUsableValue(row[field]));

  if (hasPresentation && hasNegotiationReference && !hasSalesContext) {
    return SALES_INFORMATION_STATUS.WITHOUT_SALES_INFO;
  }

  return SALES_INFORMATION_STATUS.ZERO_SALE;
}

function isWithoutSalesInformation(row) {
  return row && row.estadoInformacionVenta === SALES_INFORMATION_STATUS.WITHOUT_SALES_INFO;
}

function getNegotiatedPresentationKey(row, index = 0) {
  const parts = NEGOTIATION_ID_FIELDS.map((field) => normalizeCellText(row[field])).filter(Boolean);
  if (parts.length) {
    return parts.join("||");
  }
  const fallback = [
    normalizeCellText(row["Cliente AS400 - Texto"]),
    normalizeCellText(row["Presentación AS400 de la venta - Texto"]),
    normalizeCellText(row["Categoría AS400 de la venta"])
  ].filter(Boolean);
  return fallback.length ? fallback.join("||") : `fila-${index}`;
}

function uniqueRowsByKey(rows, keyGetter) {
  const seen = new Set();
  return rows.filter((row, index) => {
    const key = keyGetter(row, index);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getUniquePresentationsWithoutSales(rows) {
  return uniqueRowsByKey(rows.filter(isWithoutSalesInformation), getNegotiatedPresentationKey);
}

function countUniquePresentationsWithoutSales(rows) {
  return getUniquePresentationsWithoutSales(rows).length;
}

function groupPresentationsWithoutSalesByCategory(rows) {
  const grouped = new Map();
  getUniquePresentationsWithoutSales(rows).forEach((row) => {
    const category = normalizeCellText(row["Categoría AS400 de la venta"]);
    if (!category) {
      return;
    }
    grouped.set(category, (grouped.get(category) || 0) + 1);
  });
  return Array.from(grouped, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function buildDataQualityReport(rows, context = {}) {
  const totalSalesResolution = resolveMetricGroups(rows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true });
  const activityAnalytics = context.activityAnalytics || buildActivityAnalytics(rows);
  return {
    totalRows: rows.length,
    ignoredEmptyRows: context.ignoredEmptyRows || 0,
    invalidDateRows: rows.filter((row) => row.__warnings.some((warning) => warning.startsWith("Fecha inválida"))).length,
    rowsWithoutNit: rows.filter((row) => !row["Nit cliente - Clave"]).length,
    rowsWithoutSapClient: rows.filter((row) => !row["Cliente SAP - Clave"]).length,
    rowsWithoutPresentation: rows.filter((row) => !row["Presentación AS400 de la venta - Clave"]).length,
    rowsWithoutObjective: rows.filter((row) => row["Objetivo mes "] === null).length,
    rowsWithoutSales: rows.filter((row) => row["Ventas cajas físicas (sin rep)"] === null).length,
    rowsWithoutSalesInformation: rows.filter(isWithoutSalesInformation).length,
    rowsWithoutNitUnexpected: rows.filter((row) => !isWithoutSalesInformation(row) && !row["Nit cliente - Clave"]).length,
    unparseableMonthRows: rows.filter((row) => row.__warnings.includes("Mes no interpretable")).length,
    totalSalesConflicts: totalSalesResolution.filter((group) => group.status === "CONFLICTO").length,
    monthlyObjectiveConflicts: activityAnalytics.summary.objectiveConflictActivities,
    totalObjectiveConflicts: activityAnalytics.summary.totalObjectiveConflictActivities,
    conflictingActivityDates: activityAnalytics.summary.dateConflictActivities,
    sharedActivities: activityAnalytics.summary.sharedActivityCount,
    multipleActivityClientPeriods: activityAnalytics.summary.multipleActivityClientPeriods,
    ambiguousActivityPeriods: activityAnalytics.summary.ambiguousActivityPeriods,
    exactDuplicateRows: countExactDuplicateRows(rows),
    uniquePresentationsWithoutSales: countUniquePresentationsWithoutSales(rows),
    rowsWithWarnings: rows.filter((row) => row.__warnings.length).length,
    extraColumns: context.extraColumns || [],
    detectedColumns: context.detectedColumns || [],
    sourceFileName: context.sourceFileName || "",
    generatedAt: new Date().toISOString()
  };
}

function computeKpis(rows) {
  const latestMonthRows = getLatestYearMonthRows(rows);
  const salesPeriodResolution = resolveMetricGroups(rows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true });
  const salesMonthResolution = resolveMetricGroups(latestMonthRows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true });
  const activityAnalytics = buildActivityAnalytics(rows);
  const latestPeriod = latestMonthRows.length ? getYearMonthSortValue(latestMonthRows[0]) : null;
  const latestPerformance = activityAnalytics.activityPerformance.filter((item) => item.period === latestPeriod);
  const activityAggregate = aggregateActivityPerformance(latestPerformance);
  const salesPeriod = sumResolvedMetricGroups(salesPeriodResolution);
  const salesMonth = sumResolvedMetricGroups(salesMonthResolution);
  const objective = activityAggregate.eligibleCount ? activityAggregate.objectiveAll : null;
  const compliance = activityAggregate.achievement;
  const objectiveDifference = activityAggregate.gap;
  const performanceConsistency = reconcileComparablePerformance({
    comparableSales: activityAggregate.sales,
    comparableObjective: activityAggregate.objective,
    compliance,
    objectiveDifference
  });
  return {
    salesPeriod,
    salesMonth,
    objective,
    compliance,
    objectiveDifference,
    missingBoxes: objectiveDifference === null ? null : -objectiveDifference,
    uniqueClients: countUnique(rows, "Cliente SAP - Clave"),
    uniquePresentations: countUnique(rows, "Presentación AS400 de la venta - Clave"),
    uniqueActivities: countUnique(rows, "ID Actividad"),
    activeNegotiations: countUniqueBy(
      rows.filter((row) => getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === "Vigente"),
      getActivityKey
    ),
    salesResolution: salesPeriodResolution,
    comparableSales: activityAggregate.sales,
    comparableObjective: activityAggregate.objective,
    comparableActivities: activityAggregate.comparableCount,
    eligibleActivities: activityAggregate.eligibleCount,
    performanceConsistency,
    activityAnalytics
  };
}

function groupBySum(rows, groupField, valueField) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = normalizeCellText(row[groupField]);
    if (!key) {
      return;
    }
    grouped.set(key, (grouped.get(key) || 0) + numberForCalc(row[valueField]));
  });
  return Array.from(grouped, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function sumUniqueTotalSalesMonth(rows) {
  return sumResolvedMetricGroups(resolveMetricGroups(rows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true }));
}

function getLatestYearMonthRows(rows) {
  const latestValue = rows.reduce((latest, row) => {
    const value = getYearMonthSortValue(row);
    return value === null || (latest !== null && value <= latest) ? latest : value;
  }, null);
  if (latestValue === null) {
    return rows;
  }
  return rows.filter((row) => getYearMonthSortValue(row) === latestValue);
}

function getYearMonthSortValue(row) {
  if (Number.isInteger(row.__periodKey)) {
    return row.__periodKey;
  }
  return getCanonicalPeriod(row).key;
}

function sumUniqueActivityObjective(rows) {
  const analytics = buildActivityAnalytics(rows);
  const latestRows = getLatestYearMonthRows(rows);
  const latestPeriod = latestRows.length ? getYearMonthSortValue(latestRows[0]) : null;
  return aggregateActivityPerformance(analytics.activityPerformance.filter((item) => item.period === latestPeriod)).objectiveAll;
}

function sumUniqueField(rows, keyGetter, valueField) {
  const seen = new Set();
  return rows.reduce((acc, row, index) => {
    const key = keyGetter(row, index);
    if (seen.has(key)) {
      return acc;
    }
    seen.add(key);
    return acc + numberForCalc(row[valueField]);
  }, 0);
}

function getClientMonthKey(row, index) {
  return getClientPeriodKey(row, index) || `fila-${index}`;
}

function getClientPeriodKey(row) {
  const client = normalizeCellText(row["Cliente SAP - Clave"]);
  const period = getYearMonthSortValue(row);
  return client && period !== null ? `${client}||${period}` : "";
}

function getActivityKey(row, index) {
  return normalizeCellText(row["ID Actividad"]) || `fila-${index}`;
}

function resolveMetricGroups(rows, keyGetter, valueField, options = {}) {
  const grouped = new Map();
  rows.forEach((row, index) => {
    const key = keyGetter(row, index);
    if (!key) {
      return;
    }
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    const value = row[valueField];
    if (typeof value === "number" && Number.isFinite(value) && !grouped.get(key).includes(value)) {
      grouped.get(key).push(value);
    }
  });
  return Array.from(grouped, ([key, sourceValues]) => {
    const candidates = options.preferNonZero && sourceValues.some((value) => value !== 0)
      ? sourceValues.filter((value) => value !== 0)
      : sourceValues.slice();
    if (!candidates.length) {
      return { key, value: null, status: "AUSENTE", sourceValues };
    }
    if (candidates.length > 1) {
      return { key, value: null, status: "CONFLICTO", sourceValues };
    }
    return { key, value: candidates[0], status: candidates[0] === 0 ? "CERO" : "OK", sourceValues };
  });
}

function sumResolvedMetricGroups(groups) {
  if (!groups.length || groups.some((group) => group.status === "CONFLICTO" || group.value === null)) {
    return null;
  }
  return groups.reduce((sum, group) => sum + group.value, 0);
}

function isFiniteMetric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function countUniqueBy(rows, keyGetter) {
  return new Set(rows.map((row, index) => keyGetter(row, index)).filter(Boolean)).size;
}

function countExactDuplicateRows(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = JSON.stringify(REQUIRED_COLUMNS.map((column) => row[column]));
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.values()).reduce((duplicates, count) => duplicates + Math.max(0, count - 1), 0);
}

function buildActivityAnalytics(rows) {
  const sourceRows = rows || [];
  const salesByClientPeriod = buildSalesByClientPeriod(sourceRows);
  const objectivesByActivity = buildObjectivesByActivity(sourceRows);
  const relations = buildActivityClientRelations(sourceRows, objectivesByActivity);
  const granularSales = buildGranularActivitySales(sourceRows);
  const activityPerformance = buildActivityPerformance(
    sourceRows,
    salesByClientPeriod,
    objectivesByActivity,
    relations,
    granularSales
  );
  return {
    salesByClientPeriod,
    objectivesByActivity,
    activityClientRelations: relations,
    granularSalesByActivity: granularSales,
    activityPerformance,
    summary: summarizeActivityAnalytics(objectivesByActivity, relations, activityPerformance)
  };
}

function buildSalesByClientPeriod(rows) {
  return resolveMetricGroups(rows, getClientPeriodKey, "TotalVentaMes", { preferNonZero: true }).map((group) => {
    const [clientId, periodText] = group.key.split("||");
    return { ...group, clientId, period: Number(periodText) };
  });
}

function buildObjectivesByActivity(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const activityId = normalizeCellText(row["ID Actividad"]);
    if (!activityId) return;
    if (!grouped.has(activityId)) grouped.set(activityId, []);
    grouped.get(activityId).push(row);
  });
  return Array.from(grouped, ([activityId, activityRows]) => {
    const monthly = resolveActivityNumericField(activityRows, "Objetivo mes ");
    const total = resolveActivityNumericField(activityRows, "Objetivo cajas total");
    const datePairs = Array.from(new Set(activityRows.map((row) => {
      const start = normalizeCellText(row["Fecha inicio"]);
      const end = normalizeCellText(row["Fecha fin"]);
      return start || end ? `${start}||${end}` : "";
    }).filter(Boolean)));
    const datesValid = datePairs.length === 1 && dateOnly(datePairs[0].split("||")[0]) && dateOnly(datePairs[0].split("||")[1]);
    return {
      activityId,
      objectiveMonthly: monthly.value,
      objectiveStatus: monthly.status,
      objectiveSourceValues: monthly.sourceValues,
      objectiveTotal: total.value,
      objectiveTotalStatus: total.status,
      objectiveTotalSourceValues: total.sourceValues,
      dateStatus: datePairs.length > 1 || !datesValid ? "FECHAS_CONFLICTIVAS" : "OK",
      datePairs,
      startDate: datesValid ? datePairs[0].split("||")[0] : null,
      endDate: datesValid ? datePairs[0].split("||")[1] : null
    };
  });
}

function resolveActivityNumericField(rows, field) {
  const sourceValues = [];
  rows.forEach((row) => {
    const value = row[field];
    if (typeof value === "number" && Number.isFinite(value) && !sourceValues.includes(value)) sourceValues.push(value);
  });
  if (!sourceValues.length) return { value: null, status: "SIN_OBJETIVO", sourceValues };
  if (sourceValues.length > 1) return { value: null, status: "OBJETIVO_CONFLICTIVO", sourceValues };
  return { value: sourceValues[0], status: "OK", sourceValues };
}

function buildActivityClientRelations(rows, objectivesByActivity = buildObjectivesByActivity(rows)) {
  const activityClients = new Map();
  const clientNames = new Map();
  rows.forEach((row) => {
    const activityId = normalizeCellText(row["ID Actividad"]);
    const clientId = normalizeCellText(row["Cliente SAP - Clave"]);
    if (!activityId || !clientId) return;
    if (!activityClients.has(activityId)) activityClients.set(activityId, new Set());
    activityClients.get(activityId).add(clientId);
    if (!clientNames.has(clientId)) {
      clientNames.set(clientId, normalizeCellText(row["Cliente AS400 - Nombre negocio (Texto)"]) || normalizeCellText(row["Cliente AS400 - Texto"]));
    }
  });
  const periods = Array.from(new Set(rows.map(getYearMonthSortValue).filter((period) => period !== null))).sort((a, b) => a - b);
  const activeActivitiesByClientPeriod = new Map();
  objectivesByActivity.forEach((objective) => {
    if (objective.dateStatus !== "OK") return;
    periods.forEach((period) => {
      if (!isActivityActiveInPeriod(objective, period)) return;
      (activityClients.get(objective.activityId) || []).forEach((clientId) => {
        const key = `${clientId}||${period}`;
        if (!activeActivitiesByClientPeriod.has(key)) activeActivitiesByClientPeriod.set(key, new Set());
        activeActivitiesByClientPeriod.get(key).add(objective.activityId);
      });
    });
  });
  return { activityClients, clientNames, periods, activeActivitiesByClientPeriod };
}

function isActivityActiveInPeriod(activity, period) {
  if (!activity || activity.dateStatus !== "OK") return false;
  const start = dateOnly(activity.startDate);
  const end = dateOnly(activity.endDate);
  if (!start || !end) return false;
  const year = Math.floor(period / 100);
  const month = period % 100;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  return start <= monthEnd && end >= monthStart;
}

function buildGranularActivitySales(rows) {
  const byPresentation = new Map();
  rows.forEach((row, index) => {
    const clientId = normalizeCellText(row["Cliente SAP - Clave"]);
    const activityId = normalizeCellText(row["ID Actividad"]);
    const period = getYearMonthSortValue(row);
    if (!clientId || !activityId || period === null) return;
    const presentationId = normalizeCellText(row["Presentación AS400 de la venta - Clave"]) || `fila-${index}`;
    const key = `${clientId}||${period}||${activityId}||${presentationId}`;
    if (!byPresentation.has(key)) byPresentation.set(key, []);
    const value = row["Ventas cajas físicas (sin rep)"];
    if (typeof value === "number" && Number.isFinite(value) && !byPresentation.get(key).includes(value)) byPresentation.get(key).push(value);
  });
  const byClientActivityPeriod = new Map();
  byPresentation.forEach((values, key) => {
    const parts = key.split("||");
    const aggregateKey = parts.slice(0, 3).join("||");
    if (!byClientActivityPeriod.has(aggregateKey)) byClientActivityPeriod.set(aggregateKey, { value: 0, status: "OK", presentationCount: 0, conflictKeys: [] });
    const aggregate = byClientActivityPeriod.get(aggregateKey);
    aggregate.presentationCount += 1;
    if (values.length !== 1) {
      aggregate.value = null;
      aggregate.status = "VENTA_CONFLICTIVA";
      aggregate.conflictKeys.push(key);
    } else if (aggregate.status === "OK") {
      aggregate.value += values[0];
    }
  });
  return byClientActivityPeriod;
}

function buildActivityPerformance(rows, salesByClientPeriod, objectivesByActivity, relations, granularSales) {
  const salesLookup = new Map(salesByClientPeriod.map((item) => [item.key, item]));
  const performance = [];
  objectivesByActivity.forEach((objective) => {
    relations.periods.forEach((period) => {
      const active = isActivityActiveInPeriod(objective, period);
      if (objective.dateStatus === "OK" && !active) return;
      const associatedClientIds = Array.from(relations.activityClients.get(objective.activityId) || []);
      const contributionRows = associatedClientIds.map((clientId) => {
        const clientPeriodKey = `${clientId}||${period}`;
        const clientSale = salesLookup.get(clientPeriodKey);
        const activeActivities = relations.activeActivitiesByClientPeriod.get(clientPeriodKey) || new Set();
        const granularKey = `${clientId}||${period}||${objective.activityId}`;
        const granular = granularSales.get(granularKey);
        let sales = null;
        let status = "SIN_VENTAS";
        let source = "SIN_FUENTE";
        if (clientSale && clientSale.status === "CONFLICTO") {
          status = "VENTA_CONFLICTIVA";
        } else if (activeActivities.size <= 1 && clientSale && isFiniteMetric(clientSale.value)) {
          sales = clientSale.value;
          status = "OK";
          source = "TOTAL_VENTA_CLIENTE_PERIODO";
        } else if (activeActivities.size > 1) {
          status = "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD";
        }
        return {
          clientId,
          clientName: relations.clientNames.get(clientId) || "",
          sales,
          totalClientSales: clientSale && isFiniteMetric(clientSale.value) ? clientSale.value : null,
          negotiatedPresentationSales: granular && granular.status === "OK" ? granular.value : null,
          status,
          source,
          activeActivityCount: activeActivities.size,
          presentationCount: granular ? granular.presentationCount : 0,
          share: null,
          rank: null
        };
      });
      const invalidContribution = contributionRows.find((item) => item.status !== "OK");
      const totalSales = invalidContribution ? null : contributionRows.reduce((sum, item) => sum + item.sales, 0);
      const attributedSales = contributionRows.reduce((sum, item) => sum + (isFiniteMetric(item.sales) ? item.sales : 0), 0);
      const negotiatedSales = contributionRows.every((item) => isFiniteMetric(item.negotiatedPresentationSales))
        ? contributionRows.reduce((sum, item) => sum + item.negotiatedPresentationSales, 0)
        : null;
      let status = "OK";
      const ambiguityReasons = [];
      if (objective.dateStatus !== "OK") status = "FECHAS_CONFLICTIVAS";
      else if (objective.objectiveStatus === "OBJETIVO_CONFLICTIVO") status = "OBJETIVO_CONFLICTIVO";
      else if (objective.objectiveStatus !== "OK") status = "SIN_OBJETIVO";
      else if (contributionRows.some((item) => item.status === "VENTA_CONFLICTIVA")) status = "VENTA_CONFLICTIVA";
      else if (contributionRows.some((item) => item.status === "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD")) status = "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD";
      else if (contributionRows.some((item) => item.status === "SIN_VENTAS")) status = "SIN_VENTAS";
      contributionRows.filter((item) => item.status !== "OK").forEach((item) => ambiguityReasons.push(`${item.clientId}: ${item.status}`));
      if (isFiniteMetric(totalSales) && totalSales > 0) assignContributionRanks(contributionRows, totalSales);
      const comparable = status === "OK" && isFiniteMetric(objective.objectiveMonthly) && objective.objectiveMonthly > 0;
      performance.push({
        activityId: objective.activityId,
        period,
        isSharedActivity: associatedClientIds.length > 1,
        associatedClientCount: associatedClientIds.length,
        associatedClientIds,
        objectiveMonthly: objective.objectiveMonthly,
        objectiveStatus: objective.objectiveStatus,
        objectiveTotal: objective.objectiveTotal,
        totalSales,
        attributedSales,
        negotiatedPresentationSales: negotiatedSales,
        nonNegotiatedPresentationSales: isFiniteMetric(totalSales) && isFiniteMetric(negotiatedSales) ? totalSales - negotiatedSales : null,
        salesStatus: invalidContribution ? invalidContribution.status : "OK",
        achievement: comparable ? totalSales / objective.objectiveMonthly : null,
        gap: comparable ? totalSales - objective.objectiveMonthly : null,
        comparable,
        status,
        ambiguityReasons,
        contributionRows,
        dateStatus: objective.dateStatus,
        startDate: objective.startDate,
        endDate: objective.endDate
      });
    });
  });
  return performance;
}

function assignContributionRanks(rows, totalSales) {
  rows.sort((a, b) => b.sales - a.sales || a.clientId.localeCompare(b.clientId, "es"));
  let previousSales = null;
  let previousRank = 0;
  rows.forEach((row, index) => {
    row.share = totalSales ? row.sales / totalSales : null;
    row.rank = previousSales !== null && row.sales === previousSales ? previousRank : index + 1;
    previousSales = row.sales;
    previousRank = row.rank;
  });
}

function summarizeActivityAnalytics(objectives, relations, performance) {
  const sharedActivities = objectives.filter((item) => (relations.activityClients.get(item.activityId) || new Set()).size > 1);
  const multipleClientPeriods = Array.from(relations.activeActivitiesByClientPeriod.values()).filter((activities) => activities.size > 1);
  return {
    activityCount: objectives.length,
    individualActivityCount: objectives.length - sharedActivities.length,
    sharedActivityCount: sharedActivities.length,
    maximumClientsPerActivity: Math.max(0, ...Array.from(relations.activityClients.values(), (clients) => clients.size)),
    singleActivityClientPeriods: Array.from(relations.activeActivitiesByClientPeriod.values()).filter((activities) => activities.size === 1).length,
    multipleActivityClientPeriods: multipleClientPeriods.length,
    ambiguousActivityPeriods: performance.filter((item) => item.status === "VENTA_ACTIVIDAD_AMBIGUA").length,
    nonComparableActivityPeriods: performance.filter((item) => !item.comparable).length,
    objectiveConflictActivities: objectives.filter((item) => item.objectiveStatus === "OBJETIVO_CONFLICTIVO").length,
    totalObjectiveConflictActivities: objectives.filter((item) => item.objectiveTotalStatus === "OBJETIVO_CONFLICTIVO").length,
    dateConflictActivities: objectives.filter((item) => item.dateStatus === "FECHAS_CONFLICTIVAS").length
  };
}

function getMonthlyEvaluationReason({ objective, period, active, performance, activeActivities, numerator, periodAttributionReliable }) {
  if (!objective || objective.dateStatus !== "OK") return "FECHAS_CONFLICTIVAS";
  if (!active) {
    const start = dateOnly(objective.startDate);
    const end = dateOnly(objective.endDate);
    const year = Math.floor(period / 100);
    const month = period % 100;
    if (start && start > new Date(year, month, 0)) return "ACTIVIDAD_AUN_NO_INICIADA";
    if (end && end < new Date(year, month - 1, 1)) return "ACTIVIDAD_FINALIZADA";
    return "FUERA_DE_VIGENCIA";
  }
  if (objective.objectiveStatus === "OBJETIVO_CONFLICTIVO") return "OBJETIVO_CONFLICTIVO";
  if (objective.objectiveStatus !== "OK" || !isFiniteMetric(objective.objectiveMonthly) || objective.objectiveMonthly <= 0) return "SIN_OBJETIVO_MENSUAL_VALIDO";
  if (activeActivities.size > 1) return "REQUIERE_DISTRIBUCION_MULTIACTIVIDAD";
  if (performance && performance.status && performance.status !== "OK") return performance.status;
  if (!isFiniteMetric(numerator)) return "SIN_VENTA_ATRIBUIBLE";
  if (!periodAttributionReliable) return "ATRIBUCION_NO_CONFIABLE";
  return "";
}

function getTotalEvaluationReason(objective, monthlyReasons, comparableSales, hasUnreliableActivePeriod) {
  if (!objective || objective.dateStatus !== "OK") return "FECHAS_CONFLICTIVAS";
  if (objective.objectiveTotalStatus === "OBJETIVO_CONFLICTIVO") return "OBJETIVO_TOTAL_CONFLICTIVO";
  if (objective.objectiveTotalStatus !== "OK" || !isFiniteMetric(objective.objectiveTotal) || objective.objectiveTotal <= 0) return "SIN_OBJETIVO_TOTAL_VALIDO";
  const reasons = Object.values(monthlyReasons).filter(Boolean);
  if (reasons.length && reasons.every((reason) => reason === "ACTIVIDAD_AUN_NO_INICIADA")) return "ACTIVIDAD_AUN_NO_INICIADA";
  if (hasUnreliableActivePeriod) {
    return reasons.find((reason) => !["ACTIVIDAD_AUN_NO_INICIADA", "ACTIVIDAD_FINALIZADA", "FUERA_DE_VIGENCIA"].includes(reason)) || "PERIODOS_NO_EVALUABLES";
  }
  if (!comparableSales.length) return "SIN_PERIODOS_COMPARABLES";
  return "PERIODOS_NO_EVALUABLES";
}

function buildClientNegotiationModels(rows, options = {}) {
  const sourceRows = rows || [];
  const startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const availablePeriods = Array.from(new Set(sourceRows.map((row) => row.periodKey || getYearMonthSortValue(row)).filter(Number.isInteger)))
    .sort((a, b) => a - b)
    .map((key) => ({ key, label: formatBusinessPeriodLabel(key), date: `${Math.floor(key / 100)}-${pad2(key % 100)}-01`, order: key }));
  const selectedStatusPeriod = resolveSelectedModelPeriod(availablePeriods, options);
  const activityAnalytics = buildActivityAnalytics(sourceRows);
  const activityRows = groupRowsByInternalKey(sourceRows, (row) => row.activityId || normalizeCellText(row["ID Actividad"]));
  const relationRows = groupRowsByInternalKey(sourceRows, (row) => {
    const clientSap = row.clientSap || normalizeCellText(row["Cliente SAP - Clave"]);
    const activityId = row.activityId || normalizeCellText(row["ID Actividad"]);
    return clientSap && activityId ? `${clientSap}||${activityId}` : "";
  });
  const objectiveLookup = new Map(activityAnalytics.objectivesByActivity.map((item) => [item.activityId, item]));
  const generalSalesLookup = new Map(activityAnalytics.salesByClientPeriod.map((item) => [item.key, item]));
  const activitySettings = new Map();
  activityRows.forEach((rowsForActivity, activityId) => {
    const investment = resolveDistinctNumeric(rowsForActivity, "investmentPercentage", "% De inversión", "SIN_INVERSION", "INVERSION_CONFLICTIVA");
    const negotiationPeriod = resolveDistinctNumeric(rowsForActivity, "negotiationPeriod", "Periodo negociacion", "SIN_PERIODO_NEGOCIACION", "PERIODO_NEGOCIACION_CONFLICTIVO");
    const objective = objectiveLookup.get(activityId);
    const formulaWarning = objective && objective.objectiveStatus === "OK" && objective.objectiveTotalStatus === "OK" && negotiationPeriod.status === "OK"
      && Math.abs(objective.objectiveMonthly * negotiationPeriod.value - objective.objectiveTotal) > 1e-7;
    activitySettings.set(activityId, {
      investment,
      negotiationPeriod,
      negotiationDiscount: buildNegotiationDiscountSummary(rowsForActivity),
      totalObjectiveFormulaWarning: formulaWarning
    });
  });
  const monthlyDiscounts = buildResolvedMonthlyDiscounts(sourceRows);
  const activityPerformanceLookup = new Map(activityAnalytics.activityPerformance.map((item) => [`${item.activityId}||${item.period}`, item]));
  const clientActivitySummary = [];

  relationRows.forEach((rowsForRelation, relationKey) => {
    const splitIndex = relationKey.indexOf("||");
    const clientSap = relationKey.slice(0, splitIndex);
    const activityId = relationKey.slice(splitIndex + 2);
    const objective = objectiveLookup.get(activityId) || {};
    const settings = activitySettings.get(activityId) || {};
    const clients = activityAnalytics.activityClientRelations.activityClients.get(activityId) || new Set();
    const isSharedActivity = clients.size > 1;
    const salesByMonth = {};
    const attributableSalesByMonth = {};
    const jointActivitySalesByMonth = {};
    const jointNegotiatedPresentationSalesByMonth = {};
    const jointNonNegotiatedPresentationSalesByMonth = {};
    const comparableSalesByMonth = {};
    const negotiatedPresentationSalesByMonth = {};
    const nonNegotiatedPresentationSalesByMonth = {};
    const negotiatedSalesShareByMonth = {};
    const nonNegotiatedSalesShareByMonth = {};
    const compositionStatusByMonth = {};
    const monthlyDifferenceByMonth = {};
    const clientContributionSalesByMonth = {};
    const monthlyDiscountByMonth = {};
    const monthlyDiscountStatusByMonth = {};
    const monthlyComplianceByMonth = {};
    const monthlyStatusByMonth = {};
    const monthlyEvaluationReasonByMonth = {};
    const comparableSales = [];
    const warnings = [];
    let hasUnreliableActivePeriod = false;

    availablePeriods.forEach((period) => {
      const general = generalSalesLookup.get(`${clientSap}||${period.key}`);
      if (general && isFiniteMetric(general.value)) salesByMonth[period.key] = general.value;
      else if (general && general.status === "CONFLICTO") warnings.push(`VENTA_MENSUAL_CONFLICTIVA:${period.key}`);
      const granular = activityAnalytics.granularSalesByActivity.get(`${clientSap}||${period.key}||${activityId}`);
      if (granular && granular.status === "OK") {
        attributableSalesByMonth[period.key] = granular.value;
        negotiatedPresentationSalesByMonth[period.key] = granular.value;
      }
      else if (granular && granular.status !== "OK") {
        warnings.push(`VENTA_ACTIVIDAD_AMBIGUA:${period.key}`);
      }
      const performance = activityPerformanceLookup.get(`${activityId}||${period.key}`);
      const contribution = performance && performance.contributionRows.find((item) => item.clientId === clientSap);
      if (contribution && isFiniteMetric(contribution.totalClientSales)) clientContributionSalesByMonth[period.key] = contribution.totalClientSales;
      if (performance && isFiniteMetric(performance.totalSales)) jointActivitySalesByMonth[period.key] = performance.totalSales;
      if (performance && isFiniteMetric(performance.negotiatedPresentationSales)) jointNegotiatedPresentationSalesByMonth[period.key] = performance.negotiatedPresentationSales;
      if (performance && isFiniteMetric(performance.nonNegotiatedPresentationSales)) jointNonNegotiatedPresentationSalesByMonth[period.key] = performance.nonNegotiatedPresentationSales;
      const discount = monthlyDiscounts.get(`${clientSap}||${activityId}||${period.key}`);
      monthlyDiscountStatusByMonth[period.key] = discount ? discount.status : "SIN_DATO";
      if (discount && isFiniteMetric(discount.value)) monthlyDiscountByMonth[period.key] = discount.value;
      else if (discount && discount.status === "DESCUENTO_MENSUAL_CONFLICTIVO") warnings.push(`${discount.status}:${period.key}`);

      const active = isActivityActiveInPeriod(objective, period.key);
      const activeActivities = activityAnalytics.activityClientRelations.activeActivitiesByClientPeriod.get(`${clientSap}||${period.key}`) || new Set();
      const numerator = isSharedActivity ? jointActivitySalesByMonth[period.key] : salesByMonth[period.key];
      const periodAttributionReliable = Boolean(performance && performance.status === "OK" && isFiniteMetric(numerator) && activeActivities.size <= 1);
      const comparable = active && objective.dateStatus === "OK" && objective.objectiveStatus === "OK" && objective.objectiveMonthly > 0 && isFiniteMetric(numerator) && periodAttributionReliable;
      const compliance = comparable ? numerator / objective.objectiveMonthly : null;
      monthlyEvaluationReasonByMonth[period.key] = comparable ? "" : getMonthlyEvaluationReason({
        objective,
        period: period.key,
        active,
        performance,
        activeActivities,
        numerator,
        periodAttributionReliable
      });
      if (comparable) comparableSalesByMonth[period.key] = numerator;
      monthlyDifferenceByMonth[period.key] = comparable ? numerator - objective.objectiveMonthly : null;
      monthlyComplianceByMonth[period.key] = compliance;
      monthlyStatusByMonth[period.key] = !comparable ? "NO_EVALUABLE_MES" : compliance >= 1 ? "CUMPLE_MES" : "NO_CUMPLE_MES";
      if (comparable) comparableSales.push(numerator);
      if (active && !comparable) hasUnreliableActivePeriod = true;
      if (activeActivities.size > 1) warnings.push(`REQUIERE_DISTRIBUCION_MULTIACTIVIDAD:${period.key}`);

      const totalClientSales = salesByMonth[period.key];
      const negotiatedSales = negotiatedPresentationSalesByMonth[period.key];
      if (isFiniteMetric(totalClientSales) && isFiniteMetric(negotiatedSales)) {
        nonNegotiatedPresentationSalesByMonth[period.key] = totalClientSales - negotiatedSales;
        if (negotiatedSales > totalClientSales + 1e-9) {
          compositionStatusByMonth[period.key] = "DESCUADRE_COMPOSICION_VENTA";
          warnings.push(`DESCUADRE_COMPOSICION_VENTA:${period.key}`);
        } else {
          compositionStatusByMonth[period.key] = totalClientSales === 0 ? "PORCENTAJES_NO_DISPONIBLES" : "OK";
        }
        negotiatedSalesShareByMonth[period.key] = totalClientSales !== 0 ? negotiatedSales / totalClientSales : null;
        nonNegotiatedSalesShareByMonth[period.key] = totalClientSales !== 0 ? (totalClientSales - negotiatedSales) / totalClientSales : null;
      } else {
        compositionStatusByMonth[period.key] = "COMPOSICION_NO_DISPONIBLE";
        negotiatedSalesShareByMonth[period.key] = null;
        nonNegotiatedSalesShareByMonth[period.key] = null;
      }
    });

    const accumulatedGeneralSales = sumFiniteObjectValues(salesByMonth);
    const accumulatedAttributableSales = sumFiniteObjectValues(attributableSalesByMonth);
    const accumulatedComparableAttributableSales = comparableSales.length ? comparableSales.reduce((sum, value) => sum + value, 0) : null;
    const totalComparable = isFiniteMetric(accumulatedComparableAttributableSales) && objective.objectiveTotalStatus === "OK" && objective.objectiveTotal > 0 && objective.dateStatus === "OK" && !hasUnreliableActivePeriod;
    const totalProgress = totalComparable ? accumulatedComparableAttributableSales / objective.objectiveTotal : null;
    const totalDifference = totalComparable ? accumulatedComparableAttributableSales - objective.objectiveTotal : null;
    const totalObjectiveStatus = !totalComparable ? "NO_EVALUABLE_TOTAL" : totalProgress >= 1 ? "CUMPLIO_OBJETIVO_TOTAL" : "EN_PROGRESO_OBJETIVO_TOTAL";
    const totalEvaluationReason = totalComparable ? "" : getTotalEvaluationReason(objective, monthlyEvaluationReasonByMonth, comparableSales, hasUnreliableActivePeriod);
    const selectedMonthlyCompliance = selectedStatusPeriod ? monthlyComplianceByMonth[selectedStatusPeriod.key] : null;
    const selectedMonthlyStatus = selectedStatusPeriod ? monthlyStatusByMonth[selectedStatusPeriod.key] : "NO_EVALUABLE_MES";
    const selectedMonthlyEvaluationReason = selectedStatusPeriod ? monthlyEvaluationReasonByMonth[selectedStatusPeriod.key] || "SIN_PERIODO_SELECCIONADO" : "SIN_PERIODO_SELECCIONADO";
    if (settings.totalObjectiveFormulaWarning) warnings.push("OBJETIVO_TOTAL_NO_COINCIDE_CON_FORMULA");
    if (!rowsForRelation.some((row) => Number.isInteger(row.periodKey || getYearMonthSortValue(row)))) warnings.push("SIN_PERIODO_DE_VENTA");
    if (objective.objectiveStatus && objective.objectiveStatus !== "OK") warnings.push(objective.objectiveStatus);
    if (objective.objectiveTotalStatus && objective.objectiveTotalStatus !== "OK") warnings.push(objective.objectiveTotalStatus);
    if (objective.dateStatus && objective.dateStatus !== "OK") warnings.push(objective.dateStatus);
    if (settings.investment && settings.investment.status !== "OK") warnings.push(settings.investment.status);

    const regionSummary = resolveDescriptiveValue(rowsForRelation, "region", "Región SAP");
    const cediSummary = resolveDescriptiveValue(rowsForRelation, "cedi", "Cedi");
    const channelSummary = resolveDescriptiveValue(rowsForRelation, "channel", "Canal");
    const categorySummary = resolveDescriptiveValue(rowsForRelation, "category", "Categoría AS400 de la venta");
    const typologySummary = resolveDescriptiveValue(rowsForRelation, "typology", "Tipología");
    const clientName = resolveClientName(rowsForRelation);
    const clientNit = resolveDescriptiveValue(rowsForRelation, "clientNit", "Nit cliente - Clave").value;

    clientActivitySummary.push({
      clientSap,
      clientName,
      clientNit,
      activityId,
      region: regionSummary.value,
      regions: regionSummary.values,
      cedi: cediSummary.value,
      cedis: cediSummary.values,
      channel: channelSummary.value,
      channels: channelSummary.values,
      category: categorySummary.value,
      categories: categorySummary.values,
      typology: typologySummary.value,
      typologies: typologySummary.values,
      isSharedActivity,
      negotiationType: isSharedActivity ? "COMPARTIDA" : "INDIVIDUAL",
      associatedClientCount: clients.size,
      monthlyObjective: objective.objectiveMonthly,
      monthlyObjectiveStatus: objective.objectiveStatus || "SIN_OBJETIVO",
      totalObjective: objective.objectiveTotal,
      totalObjectiveValueStatus: objective.objectiveTotalStatus || "SIN_OBJETIVO",
      investmentPercentage: settings.investment && settings.investment.value,
      investmentStatus: settings.investment && settings.investment.status,
      negotiationPeriod: settings.negotiationPeriod && settings.negotiationPeriod.value,
      startDate: objective.startDate || null,
      endDate: objective.endDate || null,
      dateStatus: objective.dateStatus || "FECHAS_CONFLICTIVAS",
      negotiationDiscount: settings.negotiationDiscount || buildNegotiationDiscountSummary([]),
      negotiationDiscountStatus: settings.negotiationDiscount ? settings.negotiationDiscount.status : "SIN_DATO",
      salesByMonth,
      totalClientSalesByMonth: salesByMonth,
      attributableSalesByMonth,
      negotiatedPresentationSalesByMonth,
      nonNegotiatedPresentationSalesByMonth,
      negotiatedSalesShareByMonth,
      nonNegotiatedSalesShareByMonth,
      compositionStatusByMonth,
      comparableSalesByMonth,
      monthlyDifferenceByMonth,
      clientContributionSalesByMonth,
      jointActivitySalesByMonth,
      jointNegotiatedPresentationSalesByMonth,
      jointNonNegotiatedPresentationSalesByMonth,
      monthlyDiscountByMonth,
      monthlyDiscountStatusByMonth,
      accumulatedGeneralSales,
      accumulatedAttributableSales,
      accumulatedComparableAttributableSales,
      accumulatedComparableSales: accumulatedComparableAttributableSales,
      progressAgainstTotalObjective: totalProgress,
      totalProgress,
      totalDifference,
      monthlyCompliance: monthlyComplianceByMonth,
      monthlyComplianceByMonth,
      monthlyStatusByMonth,
      monthlyEvaluationReasonByMonth,
      selectedMonthlyCompliance,
      selectedMonthlyStatus,
      selectedMonthlyEvaluationReason,
      selectedStatusPeriod: selectedStatusPeriod ? selectedStatusPeriod.key : null,
      totalCompliance: totalProgress,
      totalObjectiveStatus,
      totalEvaluationReason,
      warnings: Array.from(new Set(warnings)),
      navigation: { clientSap, activityId }
    });
  });

  clientActivitySummary.sort((a, b) => a.clientSap.localeCompare(b.clientSap, "es") || a.activityId.localeCompare(b.activityId, "es"));
  const clientSummary = buildClientSummaryFromRelations(clientActivitySummary, availablePeriods, selectedStatusPeriod);
  const summaryTableColumns = buildSummaryTableColumns(availablePeriods, selectedStatusPeriod);
  const elapsed = (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startedAt;
  return {
    availablePeriods,
    salesByClientPeriod: activityAnalytics.salesByClientPeriod,
    clientActivitySummary,
    clientSummary,
    summaryTableColumns,
    selectedStatusPeriod: selectedStatusPeriod ? selectedStatusPeriod.key : null,
    selectedStatusPeriodLabel: selectedStatusPeriod ? selectedStatusPeriod.label : "",
    diagnostics: summarizeClientNegotiationModels(sourceRows, clientActivitySummary, clientSummary, activitySettings, monthlyDiscounts, activityAnalytics),
    performance: { coldBuildMs: elapsed }
  };
}

function groupRowsByInternalKey(rows, keyGetter) {
  const grouped = new Map();
  rows.forEach((row, index) => {
    const key = keyGetter(row, index);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });
  return grouped;
}

function resolveDistinctNumeric(rows, internalField, legacyField, missingStatus, conflictStatus, preferNonZero) {
  const values = [];
  rows.forEach((row) => {
    const value = isFiniteMetric(row[internalField]) ? row[internalField] : row[legacyField];
    if (isFiniteMetric(value) && values.indexOf(value) === -1) values.push(value);
  });
  const candidates = preferNonZero && values.some((value) => value > 0) ? values.filter((value) => value > 0) : values;
  if (!candidates.length) return { value: null, status: missingStatus, sourceValues: values };
  if (candidates.length > 1) return { value: null, status: conflictStatus, sourceValues: values };
  return { value: candidates[0], status: "OK", sourceValues: values };
}

function resolveDescriptiveValue(rows, internalField, legacyField) {
  const values = Array.from(new Set(rows.map((row) => normalizeCellText(row[internalField] || row[legacyField])).filter(Boolean)));
  return { value: !values.length ? "Sin información" : values.length === 1 ? values[0] : "VARIOS", values, status: !values.length ? "SIN_INFORMACION" : values.length === 1 ? "UNICO" : "VARIOS" };
}

function resolveClientName(rows) {
  const preferred = rows.map((row) => normalizeCellText(row.clientName || row["Cliente AS400 - Nombre negocio (Texto)"])).filter(Boolean);
  if (preferred.length) return preferred[0];
  const secondary = rows.map((row) => normalizeCellText(row.clientAs400 || row["Cliente AS400 - Texto"])).filter(Boolean);
  return secondary[0] || normalizeCellText(rows[0] && (rows[0].clientSap || rows[0]["Cliente SAP - Clave"]));
}

function buildResolvedMonthlyDiscounts(rows) {
  const grouped = groupRowsByInternalKey(rows, (row) => {
    const client = row.clientSap || normalizeCellText(row["Cliente SAP - Clave"]);
    const activity = row.activityId || normalizeCellText(row["ID Actividad"]);
    const period = row.periodKey || getYearMonthSortValue(row);
    return client && activity && period ? `${client}||${activity}||${period}` : "";
  });
  const result = new Map();
  grouped.forEach((groupRows, key) => {
    result.set(key, resolveDistinctNumeric(groupRows, "monthlyDiscountPercentage", "Porcentaje descuento mes", "SIN_DATO", "DESCUENTO_MENSUAL_CONFLICTIVO", true));
  });
  return result;
}

function buildNegotiationDiscountSummary(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = isFiniteMetric(row.negotiationDiscountPercentage) ? row.negotiationDiscountPercentage : row["Porcentaje descuento negociación"];
    if (isFiniteMetric(value)) counts.set(value, (counts.get(value) || 0) + 1);
  });
  const values = Array.from(counts.keys()).sort((a, b) => a - b);
  const predominant = values.length ? values.slice().sort((a, b) => counts.get(b) - counts.get(a) || a - b)[0] : null;
  return { status: !values.length ? "SIN_DATO" : values.length === 1 ? "UNICO" : "VARIOS", values, min: values.length ? values[0] : null, max: values.length ? values[values.length - 1] : null, predominant };
}

function buildJointActivitySalesLookup(granularSales) {
  const result = new Map();
  granularSales.forEach((item, key) => {
    const parts = key.split("||");
    const aggregateKey = `${parts[2]}||${parts[1]}`;
    if (!result.has(aggregateKey)) result.set(aggregateKey, { value: 0, status: "OK" });
    const aggregate = result.get(aggregateKey);
    if (item.status !== "OK" || !isFiniteMetric(item.value)) {
      aggregate.value = null;
      aggregate.status = "VENTA_ACTIVIDAD_AMBIGUA";
    } else if (aggregate.status === "OK") aggregate.value += item.value;
  });
  return result;
}

function sumFiniteObjectValues(values) {
  return Object.values(values).reduce((sum, value) => sum + (isFiniteMetric(value) ? value : 0), 0);
}

function resolveSelectedModelPeriod(availablePeriods, options = {}) {
  if (!availablePeriods.length) return null;
  const filters = options.filters || options;
  const explicit = options.selectedPeriod !== undefined ? options.selectedPeriod : filters.selectedPeriod;
  const explicitPeriod = getCanonicalPeriod({ "Año": "", "Mes": "", "Año Mes": explicit }).key;
  if (explicitPeriod) {
    const match = availablePeriods.find((period) => period.key === explicitPeriod);
    if (match) return match;
  }
  const periodFilter = firstFilterValue(filters["Año Mes"]);
  const filteredPeriod = getCanonicalPeriod({ "Año": "", "Mes": "", "Año Mes": periodFilter }).key;
  if (filteredPeriod) {
    const match = availablePeriods.find((period) => period.key === filteredPeriod);
    if (match) return match;
  }
  const selectedMonth = parseCanonicalMonth(firstFilterValue(filters.Mes));
  const selectedYear = parseCanonicalYear(firstFilterValue(filters["Año"]));
  const candidates = availablePeriods.filter((period) => {
    return (!selectedMonth || period.key % 100 === selectedMonth) && (!selectedYear || Math.floor(period.key / 100) === selectedYear);
  });
  return candidates.length ? candidates[candidates.length - 1] : availablePeriods[availablePeriods.length - 1];
}

function firstFilterValue(value) {
  if (Array.isArray(value)) return value.length ? value[0] : "";
  return value === null || value === undefined ? "" : value;
}

function selectClientNegotiationModelPeriod(model, selection = {}) {
  const availablePeriods = model && model.availablePeriods ? model.availablePeriods : [];
  const selected = resolveSelectedModelPeriod(availablePeriods, selection);
  const applySelection = (row) => ({
    ...row,
    selectedMonthlyCompliance: selected ? row.monthlyComplianceByMonth[selected.key] : null,
    selectedMonthlyStatus: selected ? row.monthlyStatusByMonth[selected.key] : "NO_EVALUABLE_MES",
    selectedMonthlyEvaluationReason: selected && row.monthlyEvaluationReasonByMonth ? row.monthlyEvaluationReasonByMonth[selected.key] || "" : "SIN_PERIODO_SELECCIONADO",
    selectedStatusPeriod: selected ? selected.key : null
  });
  return {
    ...model,
    selectedStatusPeriod: selected ? selected.key : null,
    selectedStatusPeriodLabel: selected ? selected.label : "",
    clientActivitySummary: (model.clientActivitySummary || []).map(applySelection),
    clientSummary: (model.clientSummary || []).map(applySelection),
    summaryTableColumns: buildSummaryTableColumns(availablePeriods, selected)
  };
}

function buildClientSummaryFromRelations(relations, availablePeriods, selectedStatusPeriod) {
  const grouped = groupRowsByInternalKey(relations, (row) => row.clientSap);
  return Array.from(grouped, ([clientSap, clientRelations]) => {
    const first = clientRelations[0];
    const activityIds = clientRelations.map((row) => row.activityId);
    const salesByMonth = {};
    const monthlyDiscountByMonth = {};
    const monthlyComplianceByMonth = {};
    const monthlyStatusByMonth = {};
    availablePeriods.forEach((period) => {
      const sales = clientRelations.map((row) => row.salesByMonth[period.key]).filter(isFiniteMetric);
      if (sales.length) salesByMonth[period.key] = sales[0];
      const discounts = Array.from(new Set(clientRelations.map((row) => row.monthlyDiscountByMonth[period.key]).filter(isFiniteMetric)));
      monthlyDiscountByMonth[period.key] = !discounts.length ? null : discounts.length === 1 ? discounts[0] : "VARIOS";
      const activeRelations = clientRelations.filter((row) => isActivityActiveInPeriod({
        dateStatus: row.dateStatus, startDate: row.startDate, endDate: row.endDate
      }, period.key));
      const allEvaluable = activeRelations.length > 0 && activeRelations.every((row) => row.dateStatus === "OK" && row.monthlyObjectiveStatus === "OK" && isFiniteMetric(row.monthlyObjective));
      const comparableSales = sales.length ? sales[0] : null;
      const comparableObjective = activeRelations.reduce((sum, row) => sum + (isFiniteMetric(row.monthlyObjective) ? row.monthlyObjective : 0), 0);
      const compliance = allEvaluable && isFiniteMetric(comparableSales) && comparableObjective > 0 ? comparableSales / comparableObjective : null;
      monthlyComplianceByMonth[period.key] = compliance;
      monthlyStatusByMonth[period.key] = !isFiniteMetric(compliance) ? "NO_EVALUABLE_MES" : compliance >= 1 ? "CUMPLE_MES" : "NO_CUMPLE_MES";
    });
    const totalEvaluable = clientRelations.length > 0 && clientRelations.every((row) => row.totalObjectiveStatus !== "NO_EVALUABLE_TOTAL");
    const comparable = totalEvaluable ? clientRelations : [];
    const accumulatedComparableSales = comparable.reduce((sum, row) => sum + row.accumulatedComparableAttributableSales, 0);
    const accumulatedObjective = comparable.reduce((sum, row) => sum + row.totalObjective, 0);
    const totalProgress = accumulatedObjective > 0 ? accumulatedComparableSales / accumulatedObjective : null;
    const totalObjectiveStatus = totalProgress === null ? "NO_EVALUABLE_TOTAL" : totalProgress >= 1 ? "CUMPLIO_OBJETIVO_TOTAL" : "EN_PROGRESO_OBJETIVO_TOTAL";
    const selectedMonthlyCompliance = selectedStatusPeriod ? monthlyComplianceByMonth[selectedStatusPeriod.key] : null;
    const selectedMonthlyStatus = selectedStatusPeriod ? monthlyStatusByMonth[selectedStatusPeriod.key] : "NO_EVALUABLE_MES";
    return {
      clientSap,
      clientName: first.clientName,
      clientNit: first.clientNit,
      regions: Array.from(new Set(clientRelations.map((row) => row.region).filter((value) => value && value !== "Sin información"))),
      cedis: Array.from(new Set(clientRelations.map((row) => row.cedi).filter((value) => value && value !== "Sin información"))),
      activityIds,
      activityCount: activityIds.length,
      sharedActivityCount: clientRelations.filter((row) => row.isSharedActivity).length,
      individualActivityCount: clientRelations.filter((row) => !row.isSharedActivity).length,
      monthlyObjectivesUnique: Object.fromEntries(clientRelations.map((row) => [row.activityId, row.monthlyObjective])),
      totalObjectivesUnique: Object.fromEntries(clientRelations.map((row) => [row.activityId, row.totalObjective])),
      salesByMonth,
      monthlyDiscountByMonth,
      monthlyComplianceByMonth,
      monthlyStatusByMonth,
      selectedMonthlyCompliance,
      selectedMonthlyStatus,
      selectedStatusPeriod: selectedStatusPeriod ? selectedStatusPeriod.key : null,
      accumulatedGeneralSales: sumFiniteObjectValues(salesByMonth),
      accumulatedComparableSales: accumulatedObjective > 0 ? accumulatedComparableSales : null,
      accumulatedObjective: accumulatedObjective > 0 ? accumulatedObjective : null,
      totalObjective: accumulatedObjective > 0 ? accumulatedObjective : null,
      totalProgress,
      totalDifference: totalProgress === null ? null : accumulatedComparableSales - accumulatedObjective,
      totalObjectiveStatus,
      investmentSummary: buildValueSummary(clientRelations.map((row) => row.investmentPercentage).filter(isFiniteMetric)),
      warnings: Array.from(new Set(clientRelations.flatMap((row) => row.warnings))),
      relations: clientRelations.map((row) => ({ clientSap: row.clientSap, activityId: row.activityId }))
    };
  }).sort((a, b) => a.clientSap.localeCompare(b.clientSap, "es"));
}

function buildValueSummary(values) {
  const unique = Array.from(new Set(values)).sort((a, b) => a - b);
  return { status: !unique.length ? "SIN_DATO" : unique.length === 1 ? "UNICO" : "VARIOS", values: unique, value: unique.length === 1 ? unique[0] : null };
}

function buildSummaryTableColumns(availablePeriods, selectedStatusPeriod) {
  const base = [
    ["selectedMonthlyStatus", `Estado mensual${selectedStatusPeriod ? ` — ${selectedStatusPeriod.label}` : ""}`],
    ["selectedMonthlyCompliance", "Cumplimiento del mes"], ["region", "Región"], ["cedi", "CEDI"], ["clientSap", "CodSAP"],
    ["clientName", "Nombre del cliente"], ["activityId", "ID Actividad"], ["negotiationType", "Tipo de negociación"],
    ["monthlyObjective", "Objetivo mes"], ["totalObjective", "Objetivo total"], ["investmentPercentage", "% de inversión"],
    ["negotiationDiscount", "% descuento negociación"], ["accumulatedGeneralSales", "Ventas acumuladas"],
    ["accumulatedComparableSales", "Ventas comparables acumuladas"], ["totalProgress", "Avance objetivo total"],
    ["totalObjectiveStatus", "Estado objetivo total"], ["totalDifference", "Diferencia frente al objetivo total"]
  ].map(([id, label]) => ({ id, label, kind: "base" }));
  availablePeriods.forEach((period) => {
    base.push({ id: `sales_${period.key}`, label: `Venta total ${period.label}`, kind: "periodSales", periodKey: period.key });
    base.push({ id: `negotiatedSales_${period.key}`, label: `Venta negociada ${period.label}`, kind: "periodNegotiatedSales", periodKey: period.key });
    base.push({ id: `negotiatedShare_${period.key}`, label: `% negociada ${period.label}`, kind: "periodNegotiatedShare", periodKey: period.key });
    base.push({ id: `nonNegotiatedSales_${period.key}`, label: `Venta no negociada ${period.label}`, kind: "periodNonNegotiatedSales", periodKey: period.key });
    base.push({ id: `nonNegotiatedShare_${period.key}`, label: `% no negociada ${period.label}`, kind: "periodNonNegotiatedShare", periodKey: period.key });
    base.push({ id: `discount_${period.key}`, label: `Dcto. ${period.label}`, kind: "periodDiscount", periodKey: period.key });
    base.push({ id: `compliance_${period.key}`, label: `Cumplimiento ${period.label}`, kind: "periodCompliance", periodKey: period.key });
    base.push({ id: `status_${period.key}`, label: `Estado ${period.label}`, kind: "periodStatus", periodKey: period.key });
  });
  return base;
}

function summarizeClientNegotiationModels(rows, relations, clients, activitySettings, monthlyDiscounts, activityAnalytics) {
  const periodKeys = Array.from(new Set(rows.map((row) => row.periodKey).filter(Number.isInteger))).sort((a, b) => a - b);
  const monthlyStatusCountsByPeriod = {};
  periodKeys.forEach((periodKey) => {
    const counts = { CUMPLE_MES: 0, NO_CUMPLE_MES: 0, NO_EVALUABLE_MES: 0 };
    relations.forEach((row) => { counts[row.monthlyStatusByMonth[periodKey] || "NO_EVALUABLE_MES"] += 1; });
    monthlyStatusCountsByPeriod[periodKey] = { label: formatBusinessPeriodLabel(periodKey), ...counts };
  });
  const totalObjectiveStatusCounts = { CUMPLIO_OBJETIVO_TOTAL: 0, EN_PROGRESO_OBJETIVO_TOTAL: 0, NO_EVALUABLE_TOTAL: 0 };
  relations.forEach((row) => { totalObjectiveStatusCounts[row.totalObjectiveStatus] += 1; });
  return {
    workbookRows: rows.length,
    clients: clients.length,
    activities: activitySettings.size,
    availablePeriods: Array.from(new Set(rows.map((row) => row.periodKey).filter(Number.isInteger))).length,
    clientActivityRelations: relations.length,
    sharedActivities: new Set(relations.filter((row) => row.isSharedActivity).map((row) => row.activityId)).size,
    multiActivityClients: clients.filter((row) => row.activityCount > 1).length,
    rowsWithoutPeriod: rows.filter((row) => row.periodStatus === "SIN_PERIODO_DE_VENTA").length,
    monthlySalesConflicts: (activityAnalytics.salesByClientPeriod || []).filter((item) => item.status === "CONFLICTO").length,
    objectiveConflicts: relations.filter((row) => row.monthlyObjectiveStatus === "OBJETIVO_CONFLICTIVO" || row.totalObjectiveValueStatus === "OBJETIVO_CONFLICTIVO").length,
    investmentConflicts: Array.from(activitySettings.values()).filter((item) => item.investment.status === "INVERSION_CONFLICTIVA").length,
    monthlyDiscountConflicts: Array.from(monthlyDiscounts.values()).filter((item) => item.status === "DESCUENTO_MENSUAL_CONFLICTIVO").length,
    monthlyStatusCountsByPeriod,
    totalObjectiveStatusCounts
  };
}

function aggregateActivityPerformance(performance) {
  const eligible = performance.filter((item) => item.objectiveStatus === "OK" && item.dateStatus === "OK");
  const comparable = eligible.filter((item) => item.comparable);
  const sales = comparable.reduce((sum, item) => sum + item.totalSales, 0);
  const objective = comparable.reduce((sum, item) => sum + item.objectiveMonthly, 0);
  const objectiveAll = eligible.reduce((sum, item) => sum + item.objectiveMonthly, 0);
  return {
    sales,
    objective,
    objectiveAll,
    achievement: objective > 0 ? sales / objective : null,
    gap: objective > 0 ? sales - objective : null,
    comparableCount: comparable.length,
    eligibleCount: eligible.length,
    totalCount: performance.length
  };
}

function reconcileComparablePerformance(metrics, tolerance = 1e-9) {
  const sales = metrics && metrics.comparableSales;
  const objective = metrics && metrics.comparableObjective;
  const compliance = metrics && metrics.compliance;
  const difference = metrics && metrics.objectiveDifference;
  if (![sales, objective, compliance, difference].every(Number.isFinite) || objective <= 0) {
    return { comparable: false, differenceConsistent: null, complianceConsistent: null, consistent: null };
  }
  const expectedDifference = sales - objective;
  const expectedCompliance = sales / objective;
  const differenceConsistent = Math.abs(expectedDifference - difference) < tolerance;
  const complianceConsistent = Math.abs(expectedCompliance - compliance) < tolerance;
  return { comparable: true, expectedDifference, expectedCompliance, differenceConsistent, complianceConsistent, consistent: differenceConsistent && complianceConsistent };
}

function getUniqueOptions(rows, field) {
  return Array.from(new Set(rows.map((row) => normalizeCellText(row[field])).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    Object.entries(filters).every(([field, selected]) => {
      if (!selected) {
        return true;
      }
      if (field === "Estado de vigencia") {
        return getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === selected;
      }
      return normalizeCellText(row[field]) === selected;
    })
  );
}

function togglePreviewDashboard() {
  if (!state.generatedHtml) {
    return;
  }
  if (state.previewVisible) {
    closePreviewDashboard();
    return;
  }
  renderPreviewDashboard();
}

function renderPreviewDashboard() {
  if (!state.generatedHtml) {
    setPreviewState("pending");
    return;
  }
  revokePreviewUrl();
  try {
    const blob = new Blob([state.generatedHtml], { type: "text/html;charset=utf-8" });
    state.previewObjectUrl = URL.createObjectURL(blob);
    els.previewFrame.removeAttribute("srcdoc");
    els.previewFrame.src = state.previewObjectUrl;
    els.previewFrame.hidden = false;
    els.previewWindow.hidden = false;
    els.previewEmpty.hidden = true;
    state.previewVisible = true;
    updatePreviewToggle();
    els.previewBadge.textContent = "Interactivo";
    els.previewBadge.className = "badge badge-success";
    refreshIcons();
  } catch (error) {
    reportGeneratorDiagnostic("error", "preview", error, "No se pudo abrir la vista previa.");
    closePreviewDashboard({ nextState: "error" });
  }
}

function closePreviewDashboard(options = {}) {
  clearPreviewFrame();
  revokePreviewUrl();
  state.previewVisible = false;
  els.previewWindow.hidden = true;
  updatePreviewToggle();
  setPreviewState(options.nextState || (state.generatedHtml ? "ready" : state.file ? "pending" : "initial"));
}

function clearPreviewFrame() {
  els.previewFrame.hidden = true;
  els.previewFrame.removeAttribute("srcdoc");
  if (els.previewFrame.getAttribute("src")) {
    els.previewFrame.src = "about:blank";
  }
  els.previewFrame.removeAttribute("src");
}

function updatePreviewToggle() {
  if (!els.openPreviewButton) {
    return;
  }
  const canPreview = Boolean(state.generatedHtml);
  const isVisible = canPreview && state.previewVisible;
  els.openPreviewButton.disabled = !canPreview;
  els.openPreviewButton.setAttribute("aria-expanded", String(isVisible));
  els.openPreviewButton.innerHTML = `<i data-lucide="${isVisible ? "eye-off" : "eye"}"></i>${isVisible ? "Ocultar vista previa" : "Ver vista previa"}`;
}

function downloadHtml(filename, htmlContent) {
  let url = "";
  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = normalizeDownloadFilename(filename, "dashboard.html");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    reportGeneratorDiagnostic("error", "html-download", error, "No se pudo descargar el dashboard.");
    setStatus("error", "No se pudo descargar el dashboard. Inténtalo nuevamente.");
    return false;
  }
}

function exportFilteredCsv(rows) {
  const columns = REQUIRED_COLUMNS.concat(["Estado de vigencia"]);
  const csv = ["\uFEFF" + columns.map((column) => serializeCsvCell(column, column)).join(",")]
    .concat(
      rows.map((row) =>
        columns
          .map((column) => {
            const value = column === "Estado de vigencia" ? getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) : row[column];
            return serializeCsvCell(value, value);
          })
          .join(",")
      )
    )
    .join("\n");
  return csv;
}

function renderQualitySummary(quality) {
  const items = [
    ["Filas totales", quality.totalRows],
    ["Filas ignoradas por estar vacías", quality.ignoredEmptyRows],
    ["Filas con fecha inválida", quality.invalidDateRows],
    ["Filas sin NIT cliente", quality.rowsWithoutNit],
    ["Filas sin cliente SAP", quality.rowsWithoutSapClient],
    ["Filas sin presentación", quality.rowsWithoutPresentation],
    ["Filas sin objetivo", quality.rowsWithoutObjective],
    ["Filas sin ventas", quality.rowsWithoutSales],
    ["Filas sin información de venta", quality.rowsWithoutSalesInformation],
    ["Presentaciones sin ventas", quality.uniquePresentationsWithoutSales],
    ["Conflictos de venta mensual", quality.totalSalesConflicts],
    ["Conflictos de objetivo mensual", quality.monthlyObjectiveConflicts],
    ["Conflictos de objetivo total", quality.totalObjectiveConflicts],
    ["Actividades con fechas conflictivas", quality.conflictingActivityDates],
    ["Actividades compartidas", quality.sharedActivities],
    ["Cliente-periodo con varias actividades", quality.multipleActivityClientPeriods],
    ["Actividad-periodo con venta ambigua", quality.ambiguousActivityPeriods],
    ["Meses no interpretables", quality.unparseableMonthRows],
    ["Filas duplicadas exactas", quality.exactDuplicateRows],
    ["Columnas extra detectadas", quality.extraColumns.length],
    ["Fecha y hora de generación", new Date(quality.generatedAt).toLocaleString("es-CO")]
  ];

  els.qualitySummary.innerHTML = items
    .map(
      ([label, value], index) =>
        `<div class="quality-item"><span class="quality-icon">${qualityIcon(index)}</span><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`
    )
    .join("");
  els.qualityBadge.textContent = quality.rowsWithWarnings ? `${quality.rowsWithWarnings} con advertencias` : "Sin advertencias";
  els.qualityBadge.className = `badge ${quality.rowsWithWarnings ? "badge-warn" : "badge-success"}`;
  refreshIcons();
}

function buildMetadata() {
  return {
    sourceFileName: state.file ? state.file.name : "",
    generatedAt: state.quality ? state.quality.generatedAt : new Date().toISOString(),
    initialTheme: getCurrentTheme(),
    processedRows: state.processedRows.length,
    detectedColumns: state.headers,
    extraColumns: state.validation ? state.validation.extras : [],
    optionalMissingColumns: state.validation ? state.validation.optionalMissing : [],
    informationalMissingColumns: state.validation ? state.validation.informationalMissing : [],
    qualityWarnings: state.quality || null,
    clientNegotiationModels: state.clientNegotiationModels || null
  };
}

function buildDashboardFilename() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(
    now.getMinutes()
  )}`;
  return `dashboard_negociacion_${stamp}.html`;
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

function resetState(clearFileInput = true) {
  state.loadVersion += 1;
  state.processVersion += 1;
  state.processing = false;
  state.runtimeDiagnostics = { errors: [], warnings: [] };
  state.file = null;
  state.workbook = null;
  state.sheetName = "";
  state.headers = [];
  state.rowsRaw = [];
  state.ignoredEmptyRows = 0;
  state.validation = null;
  resetProcessedOutput();
  if (clearFileInput) {
    els.fileInput.value = "";
    els.fileName.textContent = "Ningún archivo cargado";
    els.fileSize.textContent = "-";
    els.fileExtension.textContent = "-";
  }
  els.dropZone.classList.remove("has-file", "drag-over");
  els.processButton.classList.remove("is-loading");
  els.fileLoadedMetric.textContent = "No";
  els.sheetsCount.textContent = "0";
  setBadge(els.uploadStateBadge, "Sin archivo", "muted");
  setBadge(els.flowBadge, "Pendiente", "muted");
  els.sheetField?.classList.add("is-hidden");
  els.sheetSelect.innerHTML = '<option value="">Sin hojas cargadas</option>';
  els.sheetSelect.disabled = true;
  els.rowsRead.textContent = "0";
  els.columnsCount.textContent = "0";
  els.detectedColumns.className = "structure-summary empty-state compact";
  els.detectedColumns.innerHTML = '<i data-lucide="columns-3"></i><span>Aún no se ha leído ningún archivo.</span>';
  els.extraColumnsBadge.textContent = "Sin archivo";
  els.extraColumnsBadge.className = "badge badge-muted";
  els.validationBadge.textContent = "Pendiente";
  els.validationBadge.className = "badge badge-muted";
  els.validationDetails.className = "validation-details empty-state compact";
  els.validationDetails.innerHTML = '<i data-lucide="clipboard-check"></i><span>Carga un archivo para ver columnas faltantes, extras y advertencias.</span>';
  updateStepper("upload");
  setStatus("info", "Carga un Excel para validar su estructura.");
  refreshIcons();
}

function resetProcessedOutput() {
  state.processVersion += 1;
  state.processing = false;
  state.runtimeDiagnostics = { errors: [], warnings: [] };
  state.processedRows = [];
  state.clientNegotiationModels = null;
  clearProcessedDataIndexes();
  state.quality = null;
  state.generatedHtml = "";
  state.previewVisible = false;
  clearPreviewFrame();
  revokePreviewUrl();
  els.validRows.textContent = "0";
  els.warningRows.textContent = "0";
  els.downloadButton.hidden = true;
  updatePreviewToggle();
  els.qualityBadge.textContent = "Sin procesar";
  els.qualityBadge.className = "badge badge-muted";
  els.qualitySummary.innerHTML = '<div class="empty-state"><i data-lucide="sparkles"></i><span>El resumen aparecerá después de procesar el archivo.</span></div>';
  els.previewBadge.textContent = "No disponible";
  els.previewBadge.className = "badge badge-muted";
  els.previewWindow.hidden = true;
  setPreviewState(state.file ? "pending" : "initial");
  refreshIcons();
}

function setPreviewState(mode) {
  const contentByMode = {
    initial: {
      icon: "file-spreadsheet",
      title: "Carga un archivo Excel para comenzar",
      text: "La vista previa aparecerá aquí después de validar y procesar el archivo."
    },
    pending: {
      icon: "panel-top",
      title: "Procesa el archivo para generar la vista previa",
      text: "La estructura ya puede validarse; ejecuta el procesamiento para construir el HTML compartible."
    },
    loading: {
      icon: "loader-2",
      title: "Generando dashboard",
      text: "Estamos preparando KPIs, filtros, gráficas y tabla dentro del HTML final."
    },
    ready: {
      icon: "circle-check",
      title: "Dashboard generado correctamente",
      text: "Puedes descargarlo o abrir la vista previa cuando lo necesites."
    },
    error: {
      icon: "circle-alert",
      title: "Vista previa no disponible",
      text: "Corrige los errores de validación o revisa el archivo antes de procesarlo nuevamente."
    }
  };
  const content = contentByMode[mode] || contentByMode.initial;
  state.previewVisible = false;
  clearPreviewFrame();
  els.previewWindow.hidden = true;
  els.previewEmpty.hidden = false;
  els.previewEmpty.innerHTML = `<span class="preview-empty-icon"><i data-lucide="${content.icon}"></i></span><strong>${escapeHtml(content.title)}</strong><p>${escapeHtml(content.text)}</p>`;
  els.previewEmpty.classList.toggle("is-loading-preview", mode === "loading");
  revokePreviewUrl();
  updatePreviewToggle();
  if (mode === "ready") {
    els.previewBadge.textContent = "Generado";
    els.previewBadge.className = "badge badge-success";
  } else if (mode === "loading") {
    els.previewBadge.textContent = "Preparando";
    els.previewBadge.className = "badge badge-soft";
  } else if (mode === "error") {
    els.previewBadge.textContent = "No disponible";
    els.previewBadge.className = "badge badge-bad";
  } else {
    els.previewBadge.textContent = "No disponible";
    els.previewBadge.className = "badge badge-muted";
  }
  refreshIcons();
}

function revokePreviewUrl() {
  if (state.previewObjectUrl) {
    URL.revokeObjectURL(state.previewObjectUrl);
    state.previewObjectUrl = "";
  }
}

function setStatus(type, message) {
  const iconByType = {
    info: "info",
    success: "check-circle-2",
    warning: "triangle-alert",
    error: "circle-alert"
  };
  els.statusMessage.className = `alert alert-${type}`;
  els.statusMessage.innerHTML = `<i data-lucide="${iconByType[type] || "info"}"></i><span>${escapeHtml(message)}</span>`;
  if (type === "error") {
    setBadge(els.flowBadge, "Revisar archivo", "bad");
  } else if (type === "success") {
    setBadge(els.flowBadge, state.generatedHtml ? "Listo para descargar" : "Validado", "success");
  } else if (type === "warning") {
    setBadge(els.flowBadge, "Con advertencias", "warn");
  } else if (!state.file) {
    setBadge(els.flowBadge, "Pendiente", "muted");
  } else {
    setBadge(els.flowBadge, "En curso", "soft");
  }
  refreshIcons();
}

function updateStepper(activeStep, forcedState = "") {
  const order = ["upload", "validate", "process", "download"];
  const activeIndex = order.indexOf(activeStep);
  document.querySelectorAll("[data-step]").forEach((step) => {
    const stepName = step.dataset.step;
    const stepIndex = order.indexOf(stepName);
    step.classList.remove("is-active", "is-complete", "is-error");
    if (forcedState === "error" && stepName === activeStep) {
      step.classList.add("is-error");
    } else if (stepIndex < activeIndex) {
      step.classList.add("is-complete");
    } else if (stepName === activeStep) {
      step.classList.add("is-active");
    }
  });
}

function setBadge(element, text, type = "muted") {
  if (!element) {
    return;
  }
  const classByType = {
    muted: "badge-muted",
    soft: "badge-soft",
    success: "badge-success",
    warn: "badge-warn",
    bad: "badge-bad"
  };
  element.textContent = text;
  element.className = `badge ${classByType[type] || "badge-muted"}`;
}

function refreshIcons() {
  if (!window.lucide) return;
  try {
    window.lucide.createIcons();
  } catch (error) {
    reportGeneratorDiagnostic("warning", "lucide", error, "No se pudieron actualizar los iconos; los controles conservan texto accesible.");
  }
}
function protectCsvValue(value, originalValue) {
  const text = String(value ?? "");
  return typeof originalValue === "string" && /^[=+@-]/.test(text) ? "'" + text : text;
}
function serializeCsvCell(value, originalValue) {
  return `"${protectCsvValue(value, originalValue).replace(/"/g, '""')}"`;
}
function normalizeDownloadFilename(filename, fallback) {
  const safe = normalizeCellText(filename).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 180);
  return safe || fallback;
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getFileExtension(filename) {
  const parts = String(filename || "").split(".");
  return parts.length > 1 ? parts.pop() : "-";
}

function qualityIcon(index) {
  const icons = [
    "rows-3",
    "trash-2",
    "calendar-x",
    "id-card",
    "badge-user",
    "package",
    "target",
    "chart-no-axes-column",
    "file-question",
    "package-x",
    "columns-3",
    "clock"
  ];
  return `<i data-lucide="${icons[index] || "sparkles"}"></i>`;
}

function buildProcessedDataIndexes(rows) {
  const filterFields = ["Año", "Año Mes", "Región SAP", "Canal", "Subcanal", "Cedi", "Cliente SAP - Clave", "ID Actividad"];
  const rowsByField = new Map(filterFields.map((field) => [field, new Map()]));
  const rowsByActivity = new Map();
  const rowsByClient = new Map();
  const rowsByPeriod = new Map();
  const clientsByActivity = new Map();
  const activitiesByClient = new Map();
  const presentationsByActivity = new Map();
  const addToArrayMap = (map, key, row) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  };
  const addToSetMap = (map, key, value) => {
    if (!key || !value) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(value);
  };
  (rows || []).forEach((row) => {
    filterFields.forEach((field) => {
      const key = normalizeCellText(row[field]);
      addToArrayMap(rowsByField.get(field), key, row);
    });
    const activity = normalizeCellText(row["ID Actividad"]);
    const client = normalizeCellText(row["Cliente SAP - Clave"]);
    const periodInfo = getCanonicalPeriod(row);
    const period = periodInfo && periodInfo.valid ? periodInfo.key : "";
    const presentation = normalizeCellText(row["Presentación AS400 de la venta - Clave"]) || normalizeCellText(row["Presentación AS400 de la venta - Texto"]);
    addToArrayMap(rowsByActivity, activity, row);
    addToArrayMap(rowsByClient, client, row);
    addToArrayMap(rowsByPeriod, period, row);
    addToSetMap(clientsByActivity, activity, client);
    addToSetMap(activitiesByClient, client, activity);
    addToSetMap(presentationsByActivity, activity, presentation);
  });
  return {
    sourceRows: rows,
    rowsByField,
    rowsByActivity,
    rowsByClient,
    rowsByPeriod,
    clientsByActivity,
    activitiesByClient,
    presentationsByActivity
  };
}
function initializeProcessedDataIndexes(rows) {
  state.indexes = buildProcessedDataIndexes(rows || []);
  return state.indexes;
}
function clearProcessedDataIndexes() {
  state.indexes = null;
}
function getProcessedDataIndexes() {
  return state.indexes;
}

function normalizeCellText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  return isBlankText(text) ? "" : text;
}

function isEmptyCell(value) {
  return value === null || value === undefined || isBlankText(String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim());
}

function isBlankText(value) {
  return BLANK_TEXT_MARKERS.has(String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim());
}

function hasUsableValue(value) {
  return normalizeCellText(value) !== "";
}

function sumField(rows, field) {
  return rows.reduce((acc, row) => acc + numberForCalc(row[field]), 0);
}

function numberForCalc(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function countUnique(rows, field) {
  return new Set(rows.map((row) => normalizeCellText(row[field])).filter(Boolean)).size;
}

function dateOnly(value) {
  const iso = typeof value === "string" ? value : parseDate(value);
  if (!iso) {
    return null;
  }
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildIsoDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return toIsoDate(date);
}

function normalizeYear(year) {
  return year < 100 ? 2000 + year : year;
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatInteger(value) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
