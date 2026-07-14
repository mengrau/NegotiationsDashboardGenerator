# Índice maestro de documentación

Esta documentación describe el generador y el dashboard tal como están implementados. El orden completo recomendado va del propósito de negocio a la operación técnica.

| Documento | Propósito |
| --- | --- |
| [01. Resumen ejecutivo](01_RESUMEN_EJECUTIVO.md) | Entender el problema, la solución y sus decisiones principales sin entrar en código. |
| [02. Arquitectura](02_ARQUITECTURA.md) | Comprender componentes, responsabilidades, estado y conexiones. |
| [03. Modelo de datos](03_MODELO_DE_DATOS.md) | Conocer columnas, tipos, granularidades y relaciones. |
| [04. Reglas de negocio](04_REGLAS_DE_NEGOCIO.md) | Estudiar cómo se resuelven ventas, objetivos, vigencia y comparabilidad. |
| [05. Flujo de procesamiento](05_FLUJO_DE_PROCESAMIENTO.md) | Seguir el recorrido desde Excel hasta las interacciones del HTML generado. |
| [06. Indicadores y fórmulas](06_INDICADORES_Y_FORMULAS.md) | Interpretar cada KPI y reconciliar sus fórmulas. |
| [07. Filtros y estado](07_FILTROS_Y_ESTADO.md) | Entender la fuente de verdad, facetas, chips, scheduler y sincronización. |
| [08. Visualizaciones](08_VISUALIZACIONES.md) | Conocer las gráficas vigentes, sus tipos, fuentes e interacciones. |
| [09. Línea de tiempo](09_LINEA_DE_TIEMPO.md) | Profundizar en detalle temporal, Gantt, estados y fallbacks. |
| [10. Explorador de contribución](10_EXPLORADOR_DE_CONTRIBUCION.md) | Comprender modal, contribuciones, ranking, CSV y accesibilidad. |
| [11. Rendimiento](11_RENDIMIENTO.md) | Revisar índices, cachés, scheduler, mediciones y ciclo de vida. |
| [12. Seguridad y fallbacks](12_SEGURIDAD_Y_FALLBACKS.md) | Estudiar XSS, serialización, CSV, diagnósticos y operación sin CDN. |
| [13. Pruebas y QA](13_PRUEBAS_Y_QA.md) | Ejecutar auditorías automáticas y validación manual. |
| [14. Guía de exposición](14_GUIA_DE_EXPOSICION.md) | Preparar demostraciones de 3, 7 y 15 minutos y responder preguntas. |
| [15. Glosario](15_GLOSARIO.md) | Consultar términos de negocio y técnicos. |

## Rutas rápidas por perfil

### Negocio

1. [Resumen ejecutivo](01_RESUMEN_EJECUTIVO.md)
2. [Reglas de negocio](04_REGLAS_DE_NEGOCIO.md)
3. [Indicadores y fórmulas](06_INDICADORES_Y_FORMULAS.md)
4. [Glosario](15_GLOSARIO.md)

### Analista

1. [Modelo de datos](03_MODELO_DE_DATOS.md)
2. [Reglas de negocio](04_REGLAS_DE_NEGOCIO.md)
3. [Indicadores y fórmulas](06_INDICADORES_Y_FORMULAS.md)
4. [Línea de tiempo](09_LINEA_DE_TIEMPO.md)

### Desarrollador

1. [Arquitectura](02_ARQUITECTURA.md)
2. [Flujo de procesamiento](05_FLUJO_DE_PROCESAMIENTO.md)
3. [Filtros y estado](07_FILTROS_Y_ESTADO.md)
4. [Rendimiento](11_RENDIMIENTO.md)
5. [Seguridad y fallbacks](12_SEGURIDAD_Y_FALLBACKS.md)

### Expositor

1. [Resumen ejecutivo](01_RESUMEN_EJECUTIVO.md)
2. [Guía de exposición](14_GUIA_DE_EXPOSICION.md)
3. [Indicadores y fórmulas](06_INDICADORES_Y_FORMULAS.md)

### QA

1. [Pruebas y QA](13_PRUEBAS_Y_QA.md)
2. [Seguridad y fallbacks](12_SEGURIDAD_Y_FALLBACKS.md)
3. [Rendimiento](11_RENDIMIENTO.md)
4. Checklist operativo en `../QA_CHECKLIST.md`.

## Estado de validación

Las auditorías Node verifican reglas, HTML, seguridad y rendimiento de cálculo. La pintura, el contraste, los tooltips y el desbordamiento real requieren navegador y se mantienen como validaciones manuales cuando el entorno automatizado no dispone de uno.
