/**
 * scripts/migrate-store-guides.js
 *
 * Fase 5.2 — Migración de contenido real Kiwi -> Metaobjects, por tienda/ola.
 *
 * Lee un manifiesto JSON con las guías reales de UNA tienda (ya saneadas según
 * las decisiones de la 5.0: duplicados fusionados, huérfanas descartadas,
 * naming normalizado) y crea/actualiza en esa tienda, vía Admin GraphQL API:
 *   - un metaobject `size_guide` por guía
 *   - un metaobject `size_guide_block_*` por cada bloque de contenido de la guía
 *   - (opcional) un metaobject `size_guide_rule` con la regla de asignación
 *
 * Sigue exactamente el mismo patrón de mutaciones ya usado y confirmado en el
 * panel de administración (app/routes/app.size-guides._index.tsx, acción
 * "duplicar guía"): metaobjectCreate con fields: [{key, value}], luego
 * metaobjectUpdate del campo `blocks` de la guía con los IDs ya creados, luego
 * metaobjectCreate de la regla referenciando la guía. No se reinventa el
 * formato de campos: se reutiliza el mismo.
 *
 * ESTE SCRIPT NO INVENTA CONTENIDO. Kiwi no tiene export nativo (ver tarea
 * 0.1), así que el contenido real de cada guía (texto, filas de tabla,
 * imágenes) tiene que transcribirse a mano UNA VEZ desde el panel de Kiwi al
 * manifiesto JSON de entrada. Lo que este script automatiza es el volcado de
 * ESE JSON a Shopify — no la lectura de Kiwi. Ahorra el trabajo de crear cada
 * metaobject a mano, guía por guía, clicando en el panel propio.
 *
 * IDEMPOTENCIA
 * ------------
 * Antes de crear una guía, el script busca entre las `size_guide` existentes
 * una con el mismo `legacy_kiwi_id` (convención ya fijada en
 * openspec/specs/size-guide-metaobjects/spec.md). Si ya existe, la SALTA por
 * completo (no la actualiza, no duplica sus bloques) y avisa por consola —
 * igual que el script de definiciones (1.4), este script nunca sobreescribe
 * ni borra una entrada real ya migrada. Para corregir una guía ya migrada, se
 * edita a mano en el panel (no se vuelve a ejecutar este script sobre ella).
 *
 * USO
 * ---
 *   node scripts/migrate-store-guides.js --store=coolway-chile.myshopify.com --token=$ADMIN_API_TOKEN --input=data/migration/coolway-chile.json
 *   node scripts/migrate-store-guides.js --store=... --token=... --input=... --dry-run
 *
 * FORMATO DEL MANIFIESTO
 * -----------------------
 * Ver data/migration/coolway-chile.json como ejemplo real (tienda piloto).
 * Forma general:
 * {
 *   "guides": [
 *     {
 *       "legacyKiwiId": "KIZUNA",          // idéntico al nombre en Kiwi (0.1)
 *       "title": "KIZUNA",
 *       "priority": 0,
 *       "status": "ACTIVE",                 // o "DRAFT"
 *       "blocks": [
 *         { "type": "text", "content": "..." },
 *         { "type": "table", "label": "Mujer", "unitPrimary": "CM",
 *           "headers": ["EU","US","UK","CM"], "rows": [["36","5","3","23"]],
 *           "hasDualUnitSelector": false },
 *         { "type": "image", "image": "gid://shopify/MediaImage/...", "altText": "..." }
 *       ],
 *       "rule": {
 *         "rootOperator": "ANY",
 *         "conditions": [
 *           { "field": "collection", "operator": "equals", "value": "gid://shopify/Collection/..." }
 *         ]
 *       }
 *     }
 *   ]
 * }
 *
 * Campos de bloque no usados por un tipo se ignoran (p.ej. "label" en un
 * bloque de texto). El bloque "image" espera ya un GID de archivo subido
 * (ver app/lib/size-guide-block-helpers.ts:uploadImageFile — no lo repite
 * este script, que es deliberadamente solo de datos/metaobjects, no de
 * subida de ficheros).
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? true];
  }),
);

const STORE = args.store;
const TOKEN = args.token;
const INPUT = args.input;
const DRY_RUN = Boolean(args["dry-run"]);
const API_VERSION = "2026-07"; // CLAUDE.md sección 3 — debe coincidir con la versión pineada

if (!STORE || !TOKEN || !INPUT) {
  console.error(
    "Uso: node scripts/migrate-store-guides.js --store=<tienda>.myshopify.com --token=<admin_api_token> --input=<manifiesto.json> [--dry-run]",
  );
  process.exit(1);
}

const ENDPOINT = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

async function shopifyGraphQL(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Error GraphQL: ${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Mutaciones — idénticas a las ya usadas en app/routes/app.size-guides._index.tsx
// y app.size-guides.$id_.rule.tsx. No se inventa un esquema nuevo.
// ---------------------------------------------------------------------------

const CREATE_METAOBJECT_MUTATION = `#graphql
  mutation CreateMetaobjectGeneric($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const SET_GUIDE_BLOCKS_MUTATION = `#graphql
  mutation SetGuideBlocks($id: ID!, $blocksJson: String!) {
    metaobjectUpdate(id: $id, metaobject: { fields: [{ key: "blocks", value: $blocksJson }] }) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

// Para comprobar idempotencia: listar las size_guide existentes y su legacy_kiwi_id.
const EXISTING_GUIDES_QUERY = `#graphql
  query ExistingGuides($cursor: String) {
    metaobjects(type: "size_guide", first: 100, after: $cursor) {
      nodes {
        id
        legacyKiwiId: field(key: "legacy_kiwi_id") { value }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchExistingLegacyIds() {
  const map = new Map(); // legacyKiwiId -> guideId
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const data = await shopifyGraphQL(EXISTING_GUIDES_QUERY, { cursor });
    const page = data.metaobjects;
    for (const node of page.nodes) {
      const legacyId = node.legacyKiwiId?.value;
      if (legacyId) map.set(legacyId, node.id);
    }
    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Construcción de fields por tipo de bloque — mismo esquema que
// scripts/deploy-metaobject-definitions.js (BLOCK_DEFINITIONS) y
// openspec/specs/size-guide-metaobjects/spec.md.
// ---------------------------------------------------------------------------

function buildRichTextFromPlainText(plainText) {
  return JSON.stringify({
    type: "root",
    children: [{ type: "paragraph", children: [{ type: "text", value: plainText ?? "" }] }],
  });
}

const BLOCK_TYPE_TO_METAOBJECT = {
  table: "size_guide_block_table",
  text: "size_guide_block_text",
  image: "size_guide_block_image",
  video: "size_guide_block_video",
};

function buildBlockFields(block) {
  switch (block.type) {
    case "table":
      return [
        { key: "label", value: block.label ?? "" },
        { key: "headers", value: JSON.stringify(block.headers ?? []) },
        { key: "rows", value: JSON.stringify(block.rows ?? []) },
        { key: "unit_primary", value: block.unitPrimary ?? "" },
        { key: "unit_secondary", value: block.unitSecondary ?? "" },
        { key: "has_dual_unit_selector", value: String(Boolean(block.hasDualUnitSelector)) },
        { key: "footer_text", value: block.footerText ?? "" },
        { key: "hide_table", value: String(Boolean(block.hideTable)) },
        { key: "table_styles", value: JSON.stringify(block.tableStyles ?? {}) },
      ];
    case "text":
      return [{ key: "content", value: buildRichTextFromPlainText(block.content) }];
    case "image":
      return [
        { key: "image", value: block.image ?? "" }, // GID de archivo ya subido (ver cabecera)
        { key: "alt_text", value: block.altText ?? "" },
        { key: "caption", value: block.caption ?? "" },
      ];
    case "video":
      return [
        { key: "video_url", value: block.videoUrl ?? "" },
        { key: "caption", value: block.caption ?? "" },
      ];
    default:
      throw new Error(`Tipo de bloque desconocido en el manifiesto: "${block.type}"`);
  }
}

// ---------------------------------------------------------------------------
// Migración de una guía
// ---------------------------------------------------------------------------

async function createBlock(block) {
  const metaobjectType = BLOCK_TYPE_TO_METAOBJECT[block.type];
  if (!metaobjectType) throw new Error(`Tipo de bloque desconocido: "${block.type}"`);
  const fields = buildBlockFields(block);

  if (DRY_RUN) {
    console.log(`  [dry-run] Crearía bloque "${metaobjectType}" con: ${fields.map((f) => f.key).join(", ")}`);
    return `dry-run-block-${metaobjectType}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const data = await shopifyGraphQL(CREATE_METAOBJECT_MUTATION, {
    metaobject: { type: metaobjectType, fields },
  });
  const { metaobject, userErrors } = data.metaobjectCreate;
  if (userErrors.length) throw new Error(`Error creando bloque "${metaobjectType}": ${JSON.stringify(userErrors)}`);
  console.log(`  ✅ Bloque "${metaobjectType}" creado (${metaobject.id})`);
  return metaobject.id;
}

async function migrateGuide(guideManifest, existingLegacyIds) {
  const { legacyKiwiId, title, priority = 0, status = "ACTIVE", blocks = [], rule } = guideManifest;

  if (!legacyKiwiId) {
    console.warn(`⚠️  Guía "${title ?? "(sin título)"}" sin legacyKiwiId en el manifiesto — se SALTA (obligatorio para idempotencia y trazabilidad, ver spec).`);
    return;
  }

  if (existingLegacyIds.has(legacyKiwiId)) {
    console.log(`↔️  "${legacyKiwiId}" ya migrada (${existingLegacyIds.get(legacyKiwiId)}) — se salta por completo.`);
    return;
  }

  console.log(`\n— Migrando guía "${legacyKiwiId}" —`);

  if (DRY_RUN) {
    console.log(`[dry-run] Crearía size_guide "${legacyKiwiId}" (status=${status}, priority=${priority}) con ${blocks.length} bloque(s)${rule ? " + 1 regla" : ""}.`);
    for (const block of blocks) await createBlock(block);
    return;
  }

  const guideData = await shopifyGraphQL(CREATE_METAOBJECT_MUTATION, {
    metaobject: {
      type: "size_guide",
      fields: [
        { key: "title", value: title ?? legacyKiwiId },
        { key: "priority", value: String(priority) },
        { key: "legacy_kiwi_id", value: legacyKiwiId },
      ],
      capabilities: { publishable: { status } },
    },
  });
  const guideErrors = guideData.metaobjectCreate.userErrors;
  if (guideErrors.length) throw new Error(`Error creando guía "${legacyKiwiId}": ${JSON.stringify(guideErrors)}`);
  const guideId = guideData.metaobjectCreate.metaobject.id;
  console.log(`✅ Guía "${legacyKiwiId}" creada (${guideId})`);

  const blockIds = [];
  for (const block of blocks) blockIds.push(await createBlock(block));

  if (blockIds.length > 0) {
    const setBlocksData = await shopifyGraphQL(SET_GUIDE_BLOCKS_MUTATION, {
      id: guideId,
      blocksJson: JSON.stringify(blockIds),
    });
    const setBlocksErrors = setBlocksData.metaobjectUpdate.userErrors;
    if (setBlocksErrors.length) throw new Error(`Error enlazando bloques a "${legacyKiwiId}": ${JSON.stringify(setBlocksErrors)}`);
    console.log(`  ✅ ${blockIds.length} bloque(s) enlazado(s) a la guía.`);
  }

  if (rule) {
    const ruleData = await shopifyGraphQL(CREATE_METAOBJECT_MUTATION, {
      metaobject: {
        type: "size_guide_rule",
        fields: [
          { key: "size_guide", value: guideId },
          { key: "root_operator", value: rule.rootOperator ?? "ANY" },
          { key: "conditions", value: JSON.stringify(rule.conditions ?? []) },
          { key: "legacy_kiwi_id", value: legacyKiwiId },
        ],
      },
    });
    const ruleErrors = ruleData.metaobjectCreate.userErrors;
    if (ruleErrors.length) throw new Error(`Error creando la regla de "${legacyKiwiId}": ${JSON.stringify(ruleErrors)}`);
    console.log(`  ✅ Regla de asignación creada.`);
  } else {
    console.warn(`  ⚠️  Guía "${legacyKiwiId}" migrada SIN regla de asignación (no venía en el manifiesto) — revisar antes de dar la tienda por completa.`);
  }
}

// ---------------------------------------------------------------------------
// Orquestación
// ---------------------------------------------------------------------------

async function main() {
  const fs = await import("node:fs/promises");
  const manifest = JSON.parse(await fs.readFile(INPUT, "utf-8"));

  console.log(`\n== Migrando guías Kiwi -> Metaobjects en ${STORE} ==`);
  console.log(`Manifiesto: ${INPUT} (${manifest.guides.length} guía(s))`);
  console.log(DRY_RUN ? "(modo --dry-run: no se escribe nada)\n" : "\n");

  const existingLegacyIds = DRY_RUN ? new Map() : await fetchExistingLegacyIds();

  for (const guideManifest of manifest.guides) {
    await migrateGuide(guideManifest, existingLegacyIds);
  }

  console.log("\n== Migración terminada ==\n");
}

main().catch((err) => {
  console.error("\n❌ La migración ha fallado:\n", err.message);
  process.exit(1);
});
