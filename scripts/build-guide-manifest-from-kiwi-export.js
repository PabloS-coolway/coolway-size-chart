/**
 * scripts/build-guide-manifest-from-kiwi-export.js
 *
 * Fase 5.2 — Confirmado por atención al cliente de Kiwi (22-sept-2026): NO
 * pueden exportar más que los bloques de tipo tabla de cada guía. Texto,
 * imagen y la configuración de la regla de asignación (colecciones) quedan
 * fuera de cualquier export posible — solo se pueden obtener mirando el
 * panel de Kiwi guía por guía.
 *
 * Este script no sustituye a eso, pero automatiza la parte que SÍ tenemos
 * exportada: convierte el CSV de export de Kiwi ("Currently Published" de
 * una tienda — mismo formato que el que pasó atención al cliente, ver
 * C:\Users\Juanmi\Downloads\Coolway Charts\Coolway Charts\<Tienda>\Currently Published\*.csv)
 * en un manifiesto JSON válido para scripts/migrate-store-guides.js, con los
 * bloques de tabla ya completos y solo el texto/imagen/regla marcados como
 * "TODO" explícito — igual que se hizo a mano para Chile, pero sin tener que
 * repetir esa transcripción de tablas guía por guía en cada una de las 14
 * tiendas.
 *
 * USO
 * ---
 *   node scripts/build-guide-manifest-from-kiwi-export.js \
 *     --csv="Coolway Charts/Chile/Currently Published/size-chart-exports-....csv" \
 *     --out=data/migration/coolway-chile.json
 *
 * FORMATO DE ENTRADA (export de Kiwi, columnas): _source_file, tables, title
 *   "tables" es un JSON-en-texto: array de { id, data }, donde data[0] es
 *   [etiqueta_genero, "", "", ""], data[1] son las cabeceras de columna, y
 *   data[2..] son las filas de valores. Confirmado en el export real de
 *   Chile (KIZUNA, GOAL) el 16-sept-2026.
 *
 * LO QUE ESTE SCRIPT NO PUEDE SABER (y por tanto deja como "TODO"):
 *   - Si la guía lleva bloques de texto/imagen antes o después de las tablas,
 *     y su contenido — Kiwi no lo exporta bajo ninguna forma.
 *   - Las colecciones/condiciones de la regla de asignación de cada guía.
 *   - El estado real (Publicada/Borrador) más allá de que este export sea el
 *     de "Currently Published" (se asume ACTIVE) o "All Charts" (se marca
 *     status como null y hay que decidir cuáles de las guías extra están
 *     realmente activas).
 */

import fs from "node:fs/promises";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? true];
  }),
);

const CSV_PATH = args.csv;
const OUT_PATH = args.out;
const ASSUME_PUBLISHED = args["from-all-charts"] ? false : true; // false = no asumir ACTIVE si viene de "All Charts"

if (!CSV_PATH || !OUT_PATH) {
  console.error(
    'Uso: node scripts/build-guide-manifest-from-kiwi-export.js --csv="<export de Kiwi>.csv" --out=<manifiesto>.json [--from-all-charts]',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parser CSV minimalista, suficiente para el formato de 3 columnas del
// export de Kiwi (_source_file, tables, title), con "tables" como JSON
// entrecomillado al estilo RFC4180 (comillas dobles dobladas "").
// No se usa una librería externa a propósito: mantener el script sin
// dependencias, igual que deploy-metaobject-definitions.js y
// migrate-store-guides.js.
// ---------------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function titleCaseGender(rawLabel) {
  const label = (rawLabel ?? "").trim().toUpperCase();
  if (label === "HOMBRE" || label === "MEN") return "Hombre";
  if (label === "MUJER" || label === "WOMEN") return "Mujer";
  return rawLabel || "";
}

function guessUnitPrimary(headers) {
  // Mejor estimación: si CM está entre las columnas, es la unidad primaria
  // habitual de Coolway (ver openspec/specs/size-guide-metaobjects/spec.md,
  // has_dual_unit_selector); si no, la primera columna declarada.
  return headers.includes("CM") ? "CM" : (headers[0] ?? "");
}

function kiwiTableToBlock(tableEntry) {
  const [genderRow, headerRow, ...dataRows] = tableEntry.data;
  const label = titleCaseGender(genderRow?.[0]);
  const headers = headerRow ?? [];
  return {
    type: "table",
    label,
    unitPrimary: guessUnitPrimary(headers),
    headers,
    rows: dataRows,
    hasDualUnitSelector: false, // TODO si esta guía tiene selector INCHES|CM real (ver 0.1) — no viene en el export
  };
}

function buildGuideManifest(legacyKiwiId, tables) {
  const tableBlocks = tables.map(kiwiTableToBlock);
  return {
    legacyKiwiId,
    title: legacyKiwiId,
    priority: 0,
    status: ASSUME_PUBLISHED ? "ACTIVE" : null,
    blocks: [
      {
        type: "text",
        content: `TODO: confirmar en el panel de Kiwi si "${legacyKiwiId}" lleva un bloque de texto introductorio — Kiwi no exporta texto/imagen bajo ninguna forma (confirmado por su atención al cliente, 22-sept-2026).`,
      },
      ...tableBlocks,
      {
        type: "text",
        content: `TODO: confirmar en el panel de Kiwi si "${legacyKiwiId}" lleva un bloque de texto de cierre.`,
      },
      {
        type: "image",
        image: `TODO: confirmar en Kiwi si "${legacyKiwiId}" lleva imagen; si la lleva, subirla con uploadImageFile (app/lib/size-guide-block-helpers.ts) y poner aquí el GID.`,
        altText: "TODO",
      },
    ],
    rule: {
      rootOperator: "ANY",
      conditions: [
        {
          field: "collection",
          operator: "equals",
          value: `TODO: identificar en el panel de Kiwi las colecciones de la regla de "${legacyKiwiId}" — no viene en ningún export.`,
        },
      ],
    },
  };
}

async function main() {
  const csvText = await fs.readFile(CSV_PATH, "utf-8");
  const rows = parseCsv(csvText);
  const [header, ...dataRows] = rows;
  const titleCol = header.indexOf("title");
  const tablesCol = header.indexOf("tables");

  if (titleCol === -1 || tablesCol === -1) {
    throw new Error(`El CSV no tiene las columnas esperadas (title, tables). Cabecera encontrada: ${header.join(", ")}`);
  }

  const guides = dataRows
    .filter((row) => row.length > 1)
    .map((row) => {
      const legacyKiwiId = row[titleCol];
      const tables = JSON.parse(row[tablesCol]);
      return buildGuideManifest(legacyKiwiId, tables);
    });

  const manifest = {
    _comment: `Generado automáticamente por scripts/build-guide-manifest-from-kiwi-export.js desde ${CSV_PATH} (22-sept-2026). Bloques de tabla completos; texto/imagen/regla marcados "TODO" — Kiwi confirmó que no puede exportarlos.`,
    guides,
  };

  await fs.writeFile(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  console.log(`✅ Manifiesto generado: ${OUT_PATH} (${guides.length} guía(s), bloques de tabla completos, texto/imagen/regla pendientes de revisar en Kiwi).`);
}

main().catch((err) => {
  console.error("❌ Error generando el manifiesto:", err.message);
  process.exit(1);
});
