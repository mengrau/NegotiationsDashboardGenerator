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
  "Ventas cajas físicas mes (sin rep)",
  "Objetivo mes ",
  "Ventas acumuladas negociacion",
  "ID Actividad",
  "Fecha inicio",
  "Fecha fin",
  "Objetivo cajas total",
  "Tipo descuento",
  "Porcentaje descuento",
  "Periodo negociacion",
  "Cedi"
];

const NUMERIC_COLUMNS = new Set([
  "Año",
  "Año Mes",
  "Ventas cajas físicas mes (sin rep)",
  "Objetivo mes ",
  "Ventas acumuladas negociacion",
  "Objetivo cajas total",
  "Porcentaje descuento"
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

const state = {
  file: null,
  workbook: null,
  sheetName: "",
  headers: [],
  rowsRaw: [],
  ignoredEmptyRows: 0,
  validation: null,
  processedRows: [],
  quality: null,
  generatedHtml: "",
  previewObjectUrl: ""
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
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
    previewFrame: document.getElementById("previewFrame")
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
  els.openPreviewButton?.addEventListener("click", () => {
    if (!state.generatedHtml) {
      return;
    }
    const blob = new Blob([state.generatedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
  els.clearButton.addEventListener("click", resetState);
}

async function handleFile(file) {
  resetState(false);
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
    state.workbook = await parseExcelFile(file);
    if (!state.workbook.SheetNames.length) {
      throw new Error("El archivo no contiene hojas.");
    }
    populateSheetSelect(state.workbook.SheetNames);
    els.sheetsCount.textContent = formatInteger(state.workbook.SheetNames.length);
    state.sheetName = state.workbook.SheetNames[0];
    els.sheetSelect.value = state.sheetName;
    readSelectedSheet();
  } catch (error) {
    console.error(error);
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
    raw: false,
    dateNF: "yyyy-mm-dd",
    blankrows: false
  });

  resetProcessedOutput();

  if (!matrix.length || !Array.isArray(matrix[0]) || matrix[0].every(isEmptyCell)) {
    state.headers = [];
    state.rowsRaw = [];
    state.validation = { missing: REQUIRED_COLUMNS.slice(), extras: [], isValid: false };
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

  const extraMessage = state.validation.extras.length
    ? `Hay ${state.validation.extras.length} columna(s) extra. Puedes procesar el archivo.`
    : "Estructura válida. Puedes procesar el archivo.";
  setStatus(state.validation.extras.length ? "warning" : "success", extraMessage);
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
    const requiredDetected = REQUIRED_COLUMNS.length - validation.missing.length;
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
        <span>${formatInteger(requiredDetected)} de ${formatInteger(REQUIRED_COLUMNS.length)} columnas requeridas detectadas</span>
        <small>${validation.missing.length ? `${formatInteger(validation.missing.length)} columna(s) faltante(s)` : "Sin columnas faltantes"} · ${extraText}</small>
      </div>`;
  }

  const validation = state.validation || { missing: [], extras: [], isValid: false };
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
  els.validationDetails.innerHTML = missingHtml + extraHtml;
  refreshIcons();
}

function processCurrentSheet() {
  if (!state.validation || !state.validation.isValid || !state.rowsRaw.length) {
    return;
  }

  setStatus("info", "Procesando datos...");
  setPreviewState("loading");
  updateStepper("process");
  els.processButton.disabled = true;
  els.processButton.classList.add("is-loading");

  window.setTimeout(() => {
    try {
      const headerMap = buildHeaderMap(state.headers);
      state.processedRows = state.rowsRaw.map((row) => {
        const rowObject = {};
        REQUIRED_COLUMNS.forEach((requiredColumn) => {
          const actualIndex = headerMap.get(normalizeHeader(requiredColumn));
          rowObject[requiredColumn] = actualIndex === undefined ? null : row[actualIndex];
        });
        return normalizeRow(rowObject);
      });

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
      renderPreviewDashboard(state.processedRows);
      els.validRows.textContent = formatInteger(state.processedRows.length);
      els.warningRows.textContent = formatInteger(state.quality.rowsWithWarnings);
      els.downloadButton.hidden = false;
      updateStepper("download");
      setStatus("success", "Dashboard procesado correctamente. Ya puedes descargar el HTML.");
    } catch (error) {
      console.error(error);
      updateStepper("process", "error");
      setStatus("error", "No se pudo generar el dashboard. Revisa el archivo e inténtalo de nuevo.");
      setPreviewState("error");
    } finally {
      els.processButton.disabled = false;
      els.processButton.classList.remove("is-loading");
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

function validateColumns(headers) {
  const normalizedHeaders = new Set(headers.map(normalizeHeader).filter(Boolean));
  const expectedHeaders = new Set(REQUIRED_COLUMNS.map(normalizeHeader));

  const missing = REQUIRED_COLUMNS.filter((column) => !normalizedHeaders.has(normalizeHeader(column)));
  const extras = headers.filter((header) => {
    const normalized = normalizeHeader(header);
    return normalized && !expectedHeaders.has(normalized);
  });

  return {
    missing,
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

function parseNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined) {
    return null;
  }

  let text = String(value).trim();
  if (!text || text === "-") {
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

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    text = text.split(thousandsSeparator).join("");
    text = text.replace(decimalSeparator, ".");
  } else if (lastComma > -1) {
    text = normalizeSingleSeparatorNumber(text, ",");
  } else if (lastDot > -1) {
    text = normalizeSingleSeparatorNumber(text, ".");
  }

  const number = Number(text);
  if (!Number.isFinite(number)) {
    return null;
  }
  return isNegative ? -number : number;
}

function normalizeSingleSeparatorNumber(text, separator) {
  const parts = text.split(separator);
  if (parts.length === 1) {
    return text;
  }

  const lastPart = parts[parts.length - 1];
  const hasMultipleSeparators = parts.length > 2;
  const isLikelyDecimal = lastPart.length > 0 && lastPart.length <= 2;

  if (hasMultipleSeparators || !isLikelyDecimal) {
    return parts.join("");
  }

  return `${parts.slice(0, -1).join("")}.${lastPart}`;
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

  const text = String(value).trim();
  if (!text || text === "-") {
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
    const value = row[column];
    if (NUMERIC_COLUMNS.has(column)) {
      normalized[column] = parseNumber(value);
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

  if (!normalized["Nit cliente - Clave"]) {
    normalized.__warnings.push("Sin NIT cliente");
  }
  if (!normalized["Cliente SAP - Clave"]) {
    normalized.__warnings.push("Sin cliente SAP");
  }
  if (!normalized["Presentación AS400 de la venta - Clave"]) {
    normalized.__warnings.push("Sin presentación");
  }
  if (normalized["Objetivo cajas total"] === null) {
    normalized.__warnings.push("Sin objetivo");
  }
  if (normalized["Ventas cajas físicas mes (sin rep)"] === null) {
    normalized.__warnings.push("Sin ventas");
  }

  normalized["Estado de vigencia"] = getVigenciaStatus(normalized["Fecha inicio"], normalized["Fecha fin"]);
  return normalized;
}

function buildDataQualityReport(rows, context = {}) {
  return {
    totalRows: rows.length,
    ignoredEmptyRows: context.ignoredEmptyRows || 0,
    invalidDateRows: rows.filter((row) => row.__warnings.some((warning) => warning.startsWith("Fecha inválida"))).length,
    rowsWithoutNit: rows.filter((row) => !row["Nit cliente - Clave"]).length,
    rowsWithoutSapClient: rows.filter((row) => !row["Cliente SAP - Clave"]).length,
    rowsWithoutPresentation: rows.filter((row) => !row["Presentación AS400 de la venta - Clave"]).length,
    rowsWithoutObjective: rows.filter((row) => row["Objetivo cajas total"] === null).length,
    rowsWithoutSales: rows.filter((row) => row["Ventas cajas físicas mes (sin rep)"] === null).length,
    rowsWithWarnings: rows.filter((row) => row.__warnings.length).length,
    extraColumns: context.extraColumns || [],
    detectedColumns: context.detectedColumns || [],
    sourceFileName: context.sourceFileName || "",
    generatedAt: new Date().toISOString()
  };
}

function computeKpis(rows) {
  const salesMonth = sumField(rows, "Ventas cajas físicas mes (sin rep)");
  const accumulatedSales = sumField(rows, "Ventas acumuladas negociacion");
  const objective = sumField(rows, "Objetivo cajas total");
  const compliance = objective ? accumulatedSales / objective : null;
  const missingBoxes = objective - accumulatedSales;
  const discounts = rows
    .map((row) => row["Porcentaje descuento"])
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  return {
    salesMonth,
    accumulatedSales,
    objective,
    compliance,
    missingBoxes,
    uniqueClients: countUnique(rows, "Nit cliente - Clave"),
    uniquePresentations: countUnique(rows, "Presentación AS400 de la venta - Clave"),
    uniqueActivities: countUnique(rows, "ID Actividad"),
    averageDiscount: discounts.length ? discounts.reduce((acc, value) => acc + value, 0) / discounts.length : null,
    activeNegotiations: rows.filter((row) => getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) === "Vigente").length
  };
}

function groupBySum(rows, groupField, valueField) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = normalizeCellText(row[groupField]) || "Sin dato";
    grouped.set(key, (grouped.get(key) || 0) + numberForCalc(row[valueField]));
  });
  return Array.from(grouped, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
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

function renderPreviewDashboard(rows) {
  const metadata = buildMetadata();
  const html = generateDashboardHtml({
    rows,
    metadata,
    quality: state.quality
  });
  revokePreviewUrl();
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  state.previewObjectUrl = URL.createObjectURL(blob);
  els.previewFrame.removeAttribute("srcdoc");
  els.previewFrame.src = state.previewObjectUrl;
  els.previewFrame.hidden = false;
  els.previewWindow.hidden = false;
  els.previewEmpty.hidden = true;
  els.openPreviewButton.disabled = false;
  els.previewBadge.textContent = "Interactivo";
  els.previewBadge.className = "badge badge-success";
  refreshIcons();
}

function downloadHtml(filename, htmlContent) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportFilteredCsv(rows) {
  const columns = REQUIRED_COLUMNS.concat(["Estado de vigencia"]);
  const csv = [columns.join(",")]
    .concat(
      rows.map((row) =>
        columns
          .map((column) => {
            const value = column === "Estado de vigencia" ? getVigenciaStatus(row["Fecha inicio"], row["Fecha fin"]) : row[column];
            return `"${String(value ?? "").replace(/"/g, '""')}"`;
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
    processedRows: state.processedRows.length,
    detectedColumns: state.headers,
    extraColumns: state.validation ? state.validation.extras : [],
    qualityWarnings: state.quality || null
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
  state.processedRows = [];
  state.quality = null;
  state.generatedHtml = "";
  revokePreviewUrl();
  els.validRows.textContent = "0";
  els.warningRows.textContent = "0";
  els.downloadButton.hidden = true;
  els.openPreviewButton.disabled = true;
  els.qualityBadge.textContent = "Sin procesar";
  els.qualityBadge.className = "badge badge-muted";
  els.qualitySummary.innerHTML = '<div class="empty-state"><i data-lucide="sparkles"></i><span>El resumen aparecerá después de procesar el archivo.</span></div>';
  els.previewBadge.textContent = "No disponible";
  els.previewBadge.className = "badge badge-muted";
  els.previewFrame.hidden = true;
  els.previewFrame.removeAttribute("srcdoc");
  els.previewFrame.removeAttribute("src");
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
      title: "Generando vista previa",
      text: "Estamos preparando KPIs, filtros, gráficas y tabla dentro del HTML final."
    },
    error: {
      icon: "circle-alert",
      title: "Vista previa no disponible",
      text: "Corrige los errores de validación o revisa el archivo antes de procesarlo nuevamente."
    }
  };
  const content = contentByMode[mode] || contentByMode.initial;
  els.previewFrame.hidden = true;
  els.previewWindow.hidden = true;
  els.previewFrame.removeAttribute("src");
  els.previewEmpty.hidden = false;
  els.previewEmpty.innerHTML = `<span class="preview-empty-icon"><i data-lucide="${content.icon}"></i></span><strong>${escapeHtml(content.title)}</strong><p>${escapeHtml(content.text)}</p>`;
  els.previewEmpty.classList.toggle("is-loading-preview", mode === "loading");
  if (mode !== "loading") {
    revokePreviewUrl();
    els.previewFrame.removeAttribute("srcdoc");
    els.previewFrame.removeAttribute("src");
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
  if (window.lucide) {
    window.lucide.createIcons();
  }
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
  const icons = ["rows-3", "trash-2", "calendar-x", "id-card", "badge-user", "package", "target", "chart-no-axes-column", "columns-3", "clock"];
  return `<i data-lucide="${icons[index] || "sparkles"}"></i>`;
}

function normalizeCellText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function isEmptyCell(value) {
  return value === null || value === undefined || String(value).trim() === "";
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
