/**
 * scripts/deploy-metaobject-definitions.js
 *
 * Tarea 1.4 — Estrategia de despliegue de definiciones multi-tienda.
 * Tarea 2.3 — Ampliado para incluir también la definición del metafield
 * `custom.resolved_size_guide` (producto → referencia a size_guide), que
 * escribe el motor de resolución. Mismo patrón idempotente, misma decisión
 * de arquitectura ("las definiciones se crean por script, nunca a mano").
 *
 * Script idempotente contra la Admin GraphQL API para crear/actualizar las 6
 * definiciones de metaobject del proyecto (size_guide, los 4 size_guide_block_*,
 * y size_guide_rule) y la definición del metafield resolved_size_guide, en
 * cualquier tienda donde esté instalada la app.
 *
 * USO
 * ---
 *   node scripts/deploy-metaobject-definitions.js --store=coolway-sandbox.myshopify.com --token=$ADMIN_API_TOKEN
 *   node scripts/deploy-metaobject-definitions.js --store=coolway-sandbox.myshopify.com --token=$ADMIN_API_TOKEN --dry-run
 *
 * El token debe ser un Admin API access token con los scopes write_metaobytes
 * y write_metaobject_definitions (ya declarados en shopify.app.toml).
 *
 * IDEMPOTENCIA
 * ------------
 * Antes de crear cada definición, el script consulta si ya existe (por `type`,
 * o por namespace+key+ownerType en el caso del metafield).
 * - Si no existe: la crea completa (metaobjectDefinitionCreate / metafieldDefinitionCreate).
 * - Si existe (metaobjects): compara los campos declarados aquí contra los que ya
 *   tiene la definición real, y SOLO añade los campos que falten
 *   (metaobjectDefinitionUpdate con fieldDefinitions: { create: [...] }).
 * - Si existe (metafield): no hace nada — un metafield no tiene "campos" que
 *   añadir, solo existe o no existe.
 * - Si un campo de metaobject ya existe pero con un tipo distinto al de este
 *   fichero, el script NO lo toca — Shopify no permite cambiar el tipo de un
 *   campo ya guardado (lo comprobamos a mano en la 1.1 con `description`). Se
 *   imprime un aviso para revisión manual en vez de fallar o intentar un
 *   cambio destructivo.
 * Esto cumple el criterio de aceptación: ejecutar el script dos veces seguidas
 * no crea duplicados ni genera errores — la segunda vez no encuentra nada que
 * añadir y termina sin hacer cambios.
 *
 * ROLLBACK
 * --------
 * Este script nunca borra campos ni definiciones (evita perder datos de entradas
 * ya creadas por Marketing). El rollback documentado es:
 *   1. Revertir el commit de este fichero en git (vuelve al estado de config anterior).
 *   2. Volver a ejecutar el script con la versión anterior — añadirá de nuevo lo
 *      que falte según la config antigua, pero NO puede deshacer un campo ya
 *      creado con la config nueva (Shopify no permite borrar campos con datos).
 *   3. Si un despliegue salió mal por un campo con el tipo equivocado: hay que
 *      corregirlo a mano en el Admin de esa tienda (borrar el campo + recrearlo,
 *      igual que hicimos en la 1.1 con `description`) porque no es automatizable
 *      de forma segura sin arriesgar pérdida de datos.
 *   4. Ver docs/metaobjects/deployment-strategy.md para el detalle completo y
 *      el procedimiento de rollout por olas (piloto → 3 tiendas → resto).
 *
 * PUNTOS PENDIENTES DE VERIFICAR EN EL PRIMER DESPLIEGUE REAL (contra coolway-sandbox)
 * -------------------------------------------------------------------------------------
 * Ver también docs/metaobjects/deployment-strategy.md. Marcados también en línea:
 *   1. Nombre del tipo para "Referencia mixta" (campo `blocks`): se usa
 *      "list.mixed_reference" como mejor estimación.
 *   2. Nombre de la validación para asociar esa referencia mixta a varios tipos
 *      destino: se usa "metaobject_definition_ids" (array JSON de GIDs).
 *   3. Nombre de la validación para la referencia simple de size_guide_rule.size_guide:
 *      se usa "metaobject_definition_id" (singular).
 *   4. Acceso a la Storefront API: en el sandbox activamos a mano, para las 6
 *      definiciones, el toggle "Acceso a la API de tiendas online" (necesario para
 *      que la Theme App Extension pueda leer estos datos por Storefront API en el
 *      render SSR). Este script lo declara vía `access: { storefront: "PUBLIC_READ" }`
 *      en DEFINITION_OPTIONS — es la mejor estimación del nombre de campo/valor de
 *      la API; no verificado contra el schema real.
 *   5. (Nuevo, 2.3) Estructura exacta de MetafieldDefinitionInput para el
 *      metafield resolved_size_guide — no verificado contra el schema real.
 *   Si el primer despliegue de prueba falla en cualquiera de estos puntos,
 *   confirmar el nombre exacto con el Shopify Dev MCP conectado en Claude Code
 *   antes de corregir el script.
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? true];
  }),
);

const STORE = args.store;
const TOKEN = args.token;
const DRY_RUN = Boolean(args["dry-run"]);
const API_VERSION = "2026-07"; // Debe coincidir con apiVersion en app/shopify.server.ts

if (!STORE || !TOKEN) {
  console.error(
    "Uso: node scripts/deploy-metaobject-definitions.js --store=<tienda>.myshopify.com --token=<admin_api_token> [--dry-run]",
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
// Definiciones — deben coincidir exactamente con lo validado a mano en el
// sandbox (ver docs/metaobjects/*.md). Cambiar aquí = cambiar la fuente de
// verdad del esquema para las 14 tiendas.
// ---------------------------------------------------------------------------

const BLOCK_DEFINITIONS = [
  {
    type: "size_guide_block_table",
    name: "Bloque de tabla de tallas",
    fields: [
      { key: "label", name: "Label", type: "single_line_text_field" },
      { key: "headers", name: "Headers", type: "json" },
      { key: "rows", name: "Rows", type: "json" },
      { key: "unit_primary", name: "Unit primary", type: "single_line_text_field" },
      { key: "unit_secondary", name: "Unit secondary", type: "single_line_text_field" },
      { key: "has_dual_unit_selector", name: "Has dual unit selector", type: "boolean" },
    ],
  },
  {
    type: "size_guide_block_text",
    name: "Bloque de texto de tallas",
    fields: [{ key: "content", name: "Content", type: "rich_text_field" }],
  },
  {
    type: "size_guide_block_image",
    name: "Bloque de imagen de tallas",
    fields: [
      { key: "image", name: "Image", type: "file_reference" },
      { key: "alt_text", name: "Alt text", type: "single_line_text_field" },
      { key: "caption", name: "Caption", type: "single_line_text_field" },
    ],
  },
  {
    type: "size_guide_block_video",
    name: "Bloque de vídeo de tallas",
    fields: [
      { key: "video_url", name: "Video URL", type: "url" },
      { key: "caption", name: "Caption", type: "single_line_text_field" },
    ],
  },
];

const DEFINITION_OPTIONS = {
  capabilities: {
    publishable: { enabled: true }, // habilita Estados activo/borrador
    translatable: { enabled: true },
  },
  // NOTA (punto 4 del bloque de arriba): mejor estimación de cómo declarar el
  // acceso a la Storefront API que activamos a mano en el sandbox. No
  // verificado contra el schema real — confirmar con Shopify Dev MCP en el
  // primer despliegue de prueba.
  access: {
    storefront: "PUBLIC_READ",
  },
};

// ---------------------------------------------------------------------------
// GraphQL: consultar si una definición ya existe (por type) y con qué campos
// ---------------------------------------------------------------------------

const GET_DEFINITION_QUERY = `
  query GetMetaobjectDefinition($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
      fieldDefinitions {
        key
        type {
          name
        }
      }
    }
  }
`;

async function getExistingDefinition(type) {
  const data = await shopifyGraphQL(GET_DEFINITION_QUERY, { type });
  return data.metaobjectDefinitionByType; // null si no existe
}

// ---------------------------------------------------------------------------
// GraphQL: crear una definición nueva
// ---------------------------------------------------------------------------

const CREATE_DEFINITION_MUTATION = `
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createDefinition({ type, name, fields }) {
  const definition = {
    type,
    name,
    fieldDefinitions: fields.map((f) => ({
      key: f.key,
      name: f.name,
      type: f.type,
      ...(f.validations ? { validations: f.validations } : {}),
    })),
    ...DEFINITION_OPTIONS,
  };

  if (DRY_RUN) {
    console.log(`[dry-run] Crearía la definición "${type}" con campos: ${fields.map((f) => f.key).join(", ")}`);
    return { id: `dry-run-${type}`, type };
  }

  const data = await shopifyGraphQL(CREATE_DEFINITION_MUTATION, { definition });
  const { metaobjectDefinition, userErrors } = data.metaobjectDefinitionCreate;
  if (userErrors.length) {
    throw new Error(`Error creando "${type}": ${JSON.stringify(userErrors, null, 2)}`);
  }
  console.log(`✅ Creada la definición "${type}" (${metaobjectDefinition.id})`);
  return metaobjectDefinition;
}

// ---------------------------------------------------------------------------
// GraphQL: añadir SOLO los campos que falten a una definición ya existente
// ---------------------------------------------------------------------------

const UPDATE_DEFINITION_MUTATION = `
  mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function reconcileDefinition({ type, name, fields }) {
  const existing = await getExistingDefinition(type);

  if (!existing) {
    return createDefinition({ type, name, fields });
  }

  const existingKeys = new Set(existing.fieldDefinitions.map((f) => f.key));
  const missingFields = fields.filter((f) => !existingKeys.has(f.key));

  if (missingFields.length === 0) {
    console.log(`↔️  "${type}" ya existe con todos los campos — nada que hacer.`);
    return existing;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] Añadiría a "${type}" los campos: ${missingFields.map((f) => f.key).join(", ")}`);
    return existing;
  }

  const definitionUpdate = {
    fieldDefinitions: missingFields.map((f) => ({
      create: {
        key: f.key,
        name: f.name,
        type: f.type,
        ...(f.validations ? { validations: f.validations } : {}),
      },
    })),
  };

  const data = await shopifyGraphQL(UPDATE_DEFINITION_MUTATION, {
    id: existing.id,
    definition: definitionUpdate,
  });
  const { metaobjectDefinition, userErrors } = data.metaobjectDefinitionUpdate;
  if (userErrors.length) {
    throw new Error(`Error actualizando "${type}": ${JSON.stringify(userErrors, null, 2)}`);
  }
  console.log(`✅ Actualizada "${type}" — añadidos: ${missingFields.map((f) => f.key).join(", ")}`);
  return metaobjectDefinition;
}

// ---------------------------------------------------------------------------
// GraphQL: definición del metafield resolved_size_guide (tarea 2.3)
// ---------------------------------------------------------------------------

const GET_METAFIELD_DEFINITION_QUERY = `
  query GetMetafieldDefinition($namespace: String!, $key: String!, $ownerType: MetafieldOwnerType!) {
    metafieldDefinitions(namespace: $namespace, key: $key, ownerType: $ownerType, first: 1) {
      nodes {
        id
        namespace
        key
      }
    }
  }
`;

const CREATE_METAFIELD_DEFINITION_MUTATION = `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Crea (si no existe) la definición del metafield custom.resolved_size_guide
 * en productos, apuntando a size_guide. Un metafield no tiene "campos" que
 * ampliar como un metaobject — o existe con la forma correcta, o no existe.
 */
async function reconcileResolvedSizeGuideMetafield(sizeGuideDefinitionId) {
  const NAMESPACE = "custom";
  const KEY = "resolved_size_guide";
  const OWNER_TYPE = "PRODUCT";

  const existingData = await shopifyGraphQL(GET_METAFIELD_DEFINITION_QUERY, {
    namespace: NAMESPACE,
    key: KEY,
    ownerType: OWNER_TYPE,
  });

  if (existingData.metafieldDefinitions.nodes.length > 0) {
    console.log(`↔️  Metafield "${NAMESPACE}.${KEY}" (producto) ya existe — nada que hacer.`);
    return existingData.metafieldDefinitions.nodes[0];
  }

  if (DRY_RUN) {
    console.log(`[dry-run] Crearía el metafield "${NAMESPACE}.${KEY}" (producto) → referencia a size_guide.`);
    return { id: "dry-run-resolved_size_guide" };
  }

  const definition = {
    name: "Guía de tallas resuelta",
    namespace: NAMESPACE,
    key: KEY,
    type: "metaobject_reference",
    ownerType: OWNER_TYPE,
    // NOTA (punto 5 de la cabecera): nombre de validación no verificado.
    validations: [{ name: "metaobject_definition_id", value: sizeGuideDefinitionId }],
  };

  const data = await shopifyGraphQL(CREATE_METAFIELD_DEFINITION_MUTATION, { definition });
  const { createdDefinition, userErrors } = data.metafieldDefinitionCreate;
  if (userErrors.length) {
    throw new Error(`Error creando el metafield "${NAMESPACE}.${KEY}": ${JSON.stringify(userErrors, null, 2)}`);
  }
  console.log(`✅ Creado el metafield "${NAMESPACE}.${KEY}" (${createdDefinition.id})`);
  return createdDefinition;
}

// ---------------------------------------------------------------------------
// Orquestación — el orden importa: los bloques y size_guide deben existir
// antes de poder referenciarlos desde size_guide_rule / el campo blocks /
// el metafield resolved_size_guide.
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n== Desplegando definiciones de metaobject en ${STORE} ==`);
  console.log(DRY_RUN ? "(modo --dry-run: no se escribe nada)\n" : "\n");

  // 1) Los 4 tipos de bloque (sin dependencias entre sí)
  const blockDefs = [];
  for (const def of BLOCK_DEFINITIONS) {
    blockDefs.push(await reconcileDefinition(def));
  }

  // 2) size_guide — su campo `blocks` es una referencia mixta a los 4 bloques
  //    de arriba, así que necesitamos sus GIDs reales antes de construirlo.
  const blockDefinitionIds = blockDefs.map((d) => d.id).filter((id) => !id.startsWith("dry-run"));

  const sizeGuideDef = {
    type: "size_guide",
    name: "Guía de tallas",
    fields: [
      {
        key: "title",
        name: "Título",
        type: "single_line_text_field",
        validations: [{ name: "max", value: "70" }],
      },
      { key: "description", name: "Descripción", type: "rich_text_field" },
      { key: "priority", name: "Prioridad", type: "number_integer" },
      { key: "legacy_kiwi_id", name: "Legacy Kiwi ID", type: "single_line_text_field" },
      {
        key: "blocks",
        name: "Blocks",
        type: "list.mixed_reference",
        // NOTA: si esta validación falla al ejecutar por primera vez, comprobar
        // con Shopify Dev MCP el nombre exacto de la validación para referencia
        // mixta (candidatos: "metaobject_definition_ids" con un JSON array de
        // GIDs). Documentado como punto a verificar en el primer despliegue real.
        validations: DRY_RUN
          ? undefined
          : [{ name: "metaobject_definition_ids", value: JSON.stringify(blockDefinitionIds) }],
      },
    ],
  };
  const sizeGuideResult = await reconcileDefinition(sizeGuideDef);

  // 3) size_guide_rule — referencia simple a size_guide, necesita su GID real.
  const sizeGuideRuleDef = {
    type: "size_guide_rule",
    name: "Regla de asignación de guía",
    fields: [
      {
        key: "size_guide",
        name: "Size guide",
        type: "metaobject_reference",
        validations: DRY_RUN
          ? undefined
          : [{ name: "metaobject_definition_id", value: sizeGuideResult.id }],
      },
      {
        key: "root_operator",
        name: "Root operator",
        type: "single_line_text_field",
        validations: [{ name: "choices", value: JSON.stringify(["ANY", "ALL"]) }],
      },
      { key: "conditions", name: "Conditions", type: "json" },
      { key: "legacy_kiwi_id", name: "Legacy Kiwi ID", type: "single_line_text_field" },
    ],
  };
  await reconcileDefinition(sizeGuideRuleDef);

  // 4) (2.3) Metafield custom.resolved_size_guide en productos — referencia
  //    simple a size_guide, necesita su GID real (igual que size_guide_rule).
  await reconcileResolvedSizeGuideMetafield(sizeGuideResult.id);

  console.log("\n== Despliegue terminado ==\n");
}

main().catch((err) => {
  console.error("\n❌ El despliegue ha fallado:\n", err.message);
  process.exit(1);
});
