# Modelo de datos

## Clasificación de columnas

`app.js` conserva un esquema conocido de 25 columnas y las clasifica así:

- **Obligatorias:** Año, Mes, Cliente SAP, venta física, `TotalVentaMes`, objetivo mensual, actividad, fecha de inicio y fecha de fin.
- **Analíticas opcionales:** Año Mes, canal, categoría, texto/clave de presentación, región, objetivo total y CEDI.
- **Informativas:** las restantes, como centro, NIT, tipología, nombres, tipo y porcentaje de descuento y período de negociación.

Una columna obligatoria ausente bloquea el procesamiento. Una opcional ausente desactiva o reduce la dimensión correspondiente sin inventar datos.

## Diccionario principal

| Campo | Uso | Granularidad conceptual | Obligatorio | Ejemplo |
| --- | --- | --- | --- | --- |
| Año | Construir período canónico | fila/período | Sí | 2026 |
| Mes | Construir período canónico | fila/período | Sí | JUN |
| Año Mes | Respaldo y validación del período | fila/período | No | 202606 |
| Cliente SAP - Clave | Identidad de cliente | cliente | Sí | 1002559342 |
| ID Actividad | Identidad de negociación | actividad | Sí | 947124 |
| Presentación AS400 - Clave | Deduplicación de presentación | presentación | No | P-001 |
| Presentación AS400 - Texto | Etiqueta y búsqueda | presentación | No | Producto 500 ml |
| Ventas cajas físicas (sin rep) | Atribución granular | cliente + actividad + presentación + período | Sí | 371 |
| TotalVentaMes | Venta general | cliente + período | Sí | 67.401 |
| Objetivo mes | Objetivo comparable | actividad | Sí | 1.100 |
| Objetivo cajas total | Información contractual adicional | actividad | No | 12.000 |
| Fecha inicio | Vigencia | actividad | Sí | 2026-07-01 |
| Fecha fin | Vigencia | actividad | Sí | 2026-12-31 |
| Región SAP | Contexto y filtro | cliente/fila | No | Centro Sur |
| Canal | Contexto y filtro | cliente/fila | No | Tradicional |
| Categoría AS400 de la venta | Composición | presentación | No | Gaseosa |
| Cedi | Dimensión de cumplimiento | actividad/fila | No | Bogotá |
| Porcentaje descuento | Información contractual | fila | No | 0,15 |

## Tipos y normalización

`NUMERIC_COLUMNS`, `TEXT_COLUMNS` y `DATE_COLUMNS` controlan la conversión. Una venta física vacía se normaliza a cero para clasificar la presentación; un `TotalVentaMes` vacío permanece ausente. `TotalVentaMes` admite punto o coma decimal cuando llega como texto. Las fechas se normalizan a `YYYY-MM-DD`.

Los alias de encabezado aceptan variaciones conocidas, por ejemplo `Objetivo mes` sin espacio final y `Total venta mes`.

## Período canónico

El período usa Año y Mes y se representa internamente como `AAAAMM`, por ejemplo `202606`. `Año Mes` es respaldo, no la única fuente. Esto evita interpretar erróneamente valores como `52026` al cruzar años.

## Relaciones conceptuales

```mermaid
erDiagram
    ACTIVIDAD ||--o{ CLIENTE_ACTIVIDAD : asocia
    CLIENTE ||--o{ CLIENTE_ACTIVIDAD : participa
    ACTIVIDAD ||--o{ PRESENTACION : negocia
    CLIENTE ||--o{ VENTA_MENSUAL : registra
    PERIODO ||--o{ VENTA_MENSUAL : contiene
    ACTIVIDAD ||--o{ DESEMPENO : evalua
    PERIODO ||--o{ DESEMPENO : contextualiza
    ACTIVIDAD {
      string id
      number objetivoMensual
      date inicio
      date fin
    }
    CLIENTE {
      string claveSAP
    }
    VENTA_MENSUAL {
      number TotalVentaMes
    }
    PRESENTACION {
      string claveAS400
      number ventaFisica
    }
```

En palabras:

- una actividad puede tener muchos clientes;
- un cliente puede tener muchas actividades;
- una actividad puede negociar muchas presentaciones;
- `TotalVentaMes` pertenece a cliente + período;
- el objetivo mensual pertenece a actividad;
- la venta atribuible puede requerir cliente + actividad + presentación + período.

## Valores ausentes y conflictos

Ausente no significa cero. Los resolutores devuelven estados como `SIN_VALOR` o `CONFLICTO`. Las actividades con venta ambigua, fechas conflictivas u objetivo conflictivo permanecen visibles para revisión, pero no se incluyen silenciosamente en el cumplimiento comparable.

Continúa con [Reglas de negocio](04_REGLAS_DE_NEGOCIO.md).
