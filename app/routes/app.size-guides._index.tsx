/**
 * app/routes/app.size-guides._index.tsx
 *
 * Tarea 2.10 (Pieza A) — Dashboard del panel: listado de guías de tallas.
 * Piezas G1 (fecha relativa, buscador), G2 (badges, chips de regla) y G3
 * (Duplicate/Delete completo, ventana de confirmación propia, botones
 * debajo de los chips de la regla) incorporadas.
 *
 * G3 — ESTILO DE BOTONES: "Editar" pasa de `<s-link>` a `<Link>` de
 * react-router — necesitaba poder aplicarle estilo de botón, y `<s-link>`
 * no garantiza soportar esas props. `<Link>` sigue siendo seguro en el
 * contexto embebido. Los 3 botones comparten un estilo base tipo botón de
 * Shopify, con variante roja para Eliminar/"Sí, eliminar".
 *
 * CORRECCIÓN: el botón "Duplicar" se veía más pequeño que "Editar" y
 * "Eliminar" — al estar envuelto en un `<form>` (necesario para enviar los
 * campos ocultos), ese `<form>` se convertía en el elemento flex dentro del
 * contenedor de botones, en vez del propio `<button>`, afectando su tamaño.
 * Corregido con `display: "contents"` en el `<form>`: hace que el propio
 * `<form>` no genere caja de layout — sus hijos (el botón) se comportan como
 * si fueran hijos directos del contenedor flex, igual que "Editar".
 */

import { useState } from "react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { Form, Link, useFetcher, useLoaderData } from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import type { RuleCondition } from "../lib/size-guide-resolver";

interface RuleSummary {
  rootOperator: "ANY" | "ALL";
  conditions: RuleCondition[];
}

interface SizeGuideListItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  legacyKiwiId: string;
  relativeUpdatedAt: string;
  rules: RuleSummary[];
}

const SIZE_GUIDES_LIST_QUERY = `#graphql
  query SizeGuidesList {
    metaobjects(type: "size_guide", first: 50) {
      nodes {
        id
        updatedAt
        capabilities {
          publishable {
            status
          }
        }
        title: field(key: "title") { value }
        priority: field(key: "priority") { value }
        legacyKiwiId: field(key: "legacy_kiwi_id") { value }
      }
    }
  }
`;

const ALL_RULES_QUERY = `#graphql
  query AllRulesForList($cursor: String) {
    metaobjects(type: "size_guide_rule", first: 100, after: $cursor) {
      nodes {
        id
        sizeGuide: field(key: "size_guide") {
          reference {
            ... on Metaobject { id }
          }
        }
        rootOperator: field(key: "root_operator") { value }
        conditions: field(key: "conditions") { value }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const GET_GUIDE_FOR_DUPLICATE_QUERY = `#graphql
  query GetGuideForDuplicate($id: ID!) {
    metaobject(id: $id) {
      title: field(key: "title") { value }
      description: field(key: "description") { value }
      priority: field(key: "priority") { value }
      blocks: field(key: "blocks") {
        references(first: 50) {
          nodes {
            ... on Metaobject {
              id
              type
              label: field(key: "label") { value }
              headers: field(key: "headers") { value }
              rows: field(key: "rows") { value }
              unitPrimary: field(key: "unit_primary") { value }
              unitSecondary: field(key: "unit_secondary") { value }
              hasDualUnitSelector: field(key: "has_dual_unit_selector") { value }
              content: field(key: "content") { value }
              altText: field(key: "alt_text") { value }
              caption: field(key: "caption") { value }
              videoUrl: field(key: "video_url") { value }
              image: field(key: "image") {
                reference {
                  ... on Node { id }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_METAOBJECT_MUTATION = `#graphql
  mutation CreateMetaobjectGeneric($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const UPDATE_GUIDE_BLOCKS_MUTATION = `#graphql
  mutation SetGuideBlocks($id: ID!, $blocksJson: String!) {
    metaobjectUpdate(id: $id, metaobject: { fields: [{ key: "blocks", value: $blocksJson }] }) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const DELETE_GUIDE_MUTATION = `#graphql
  mutation DeleteGuide($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors { field message }
    }
  }
`;

function toRelativeDate(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? "" : "es"}`;
}

function Badge({ text, color, background }: { text: string; color: string; background: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.1rem 0.5rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        color,
        background,
        marginRight: "0.25rem",
      }}
    >
      {text}
    </span>
  );
}

const buttonBaseStyle: React.CSSProperties = {
  display: "inline-block",
  boxSizing: "border-box",
  padding: "0.4rem 0.9rem",
  borderRadius: "6px",
  border: "1px solid #c9cccf",
  background: "#f6f6f7",
  color: "#1a1a1a",
  fontSize: "0.85rem",
  lineHeight: "1.3",
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid #e2b3ac",
  background: "#fdf1ef",
  color: "#a41c11",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid #a41c11",
  background: "#d82c0d",
  color: "#fff",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const guidesResponse = await admin.graphql(SIZE_GUIDES_LIST_QUERY);
  const { data: guidesData } = await guidesResponse.json();

  const rulesByGuideId = new Map<string, RuleSummary[]>();
  let cursor: string | null = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const rulesResponse = await admin.graphql(ALL_RULES_QUERY, { variables: { cursor } });
    const { data: rulesData } = await rulesResponse.json();
    const page = rulesData.metaobjects;

    for (const node of page.nodes) {
      const guideId = node.sizeGuide?.reference?.id;
      if (!guideId) continue;
      let conditions: RuleCondition[] = [];
      try {
        conditions = JSON.parse(node.conditions?.value ?? "[]");
      } catch {
        conditions = [];
      }
      const summary: RuleSummary = {
        rootOperator: node.rootOperator?.value === "ALL" ? "ALL" : "ANY",
        conditions,
      };
      const existing = rulesByGuideId.get(guideId) ?? [];
      existing.push(summary);
      rulesByGuideId.set(guideId, existing);
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  let guides: SizeGuideListItem[] = guidesData.metaobjects.nodes.map(
    (node: {
      id: string;
      updatedAt?: string;
      capabilities?: { publishable?: { status?: string } };
      title?: { value?: string };
      priority?: { value?: string };
      legacyKiwiId?: { value?: string };
    }) => ({
      id: node.id,
      title: node.title?.value || "(sin título)",
      status: node.capabilities?.publishable?.status === "ACTIVE" ? "Activa" : "Borrador",
      priority: node.priority?.value ?? "0",
      legacyKiwiId: node.legacyKiwiId?.value || "—",
      relativeUpdatedAt: toRelativeDate(node.updatedAt),
      rules: rulesByGuideId.get(node.id) ?? [],
    }),
  );

  if (query) {
    guides = guides.filter((g) => g.title.toLowerCase().includes(query));
  }

  return { guides, query };
};

function buildBlockCopyFields(block: any): { key: string; value: string }[] {
  switch (block.type) {
    case "size_guide_block_table":
      return [
        { key: "label", value: block.label?.value ?? "" },
        { key: "headers", value: block.headers?.value ?? "[]" },
        { key: "rows", value: block.rows?.value ?? "[]" },
        { key: "unit_primary", value: block.unitPrimary?.value ?? "" },
        { key: "unit_secondary", value: block.unitSecondary?.value ?? "" },
        { key: "has_dual_unit_selector", value: block.hasDualUnitSelector?.value ?? "false" },
      ];
    case "size_guide_block_text":
      return [{ key: "content", value: block.content?.value ?? "" }];
    case "size_guide_block_image": {
      const fields = [
        { key: "alt_text", value: block.altText?.value ?? "" },
        { key: "caption", value: block.caption?.value ?? "" },
      ];
      const imageId = block.image?.reference?.id;
      if (imageId) fields.push({ key: "image", value: imageId });
      return fields;
    }
    case "size_guide_block_video":
      return [
        { key: "video_url", value: block.videoUrl?.value ?? "" },
        { key: "caption", value: block.caption?.value ?? "" },
      ];
    default:
      return [];
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const guideId = String(formData.get("guideId") ?? "");

  if (intent === "delete") {
    const response = await admin.graphql(DELETE_GUIDE_MUTATION, { variables: { id: guideId } });
    const { data } = await response.json();
    const userErrors = data.metaobjectDelete.userErrors;
    if (userErrors.length > 0) return { ok: false, errors: userErrors };
    return { ok: true, errors: [] };
  }

  if (intent === "duplicate") {
    const getResponse = await admin.graphql(GET_GUIDE_FOR_DUPLICATE_QUERY, { variables: { id: guideId } });
    const { data: getData } = await getResponse.json();
    const original = getData.metaobject;
    if (!original) return { ok: false, errors: [{ message: "Guía original no encontrada" }] };

    const newTitle = `${original.title?.value ?? "(sin título)"} (copia)`;
    const createGuideResponse = await admin.graphql(CREATE_METAOBJECT_MUTATION, {
      variables: {
        metaobject: {
          type: "size_guide",
          fields: [
            { key: "title", value: newTitle },
            { key: "description", value: original.description?.value ?? "" },
            { key: "priority", value: original.priority?.value ?? "0" },
          ],
          capabilities: { publishable: { status: "DRAFT" } },
        },
      },
    });
    const { data: createGuideData } = await createGuideResponse.json();
    const guideErrors = createGuideData.metaobjectCreate.userErrors;
    if (guideErrors.length > 0) return { ok: false, errors: guideErrors };
    const newGuideId = createGuideData.metaobjectCreate.metaobject.id;

    const originalBlocks = original.blocks?.references?.nodes ?? [];
    const newBlockIds: string[] = [];
    for (const block of originalBlocks) {
      const createBlockResponse = await admin.graphql(CREATE_METAOBJECT_MUTATION, {
        variables: {
          metaobject: { type: block.type, fields: buildBlockCopyFields(block) },
        },
      });
      const { data: createBlockData } = await createBlockResponse.json();
      const blockErrors = createBlockData.metaobjectCreate.userErrors;
      if (blockErrors.length > 0) return { ok: false, errors: blockErrors };
      newBlockIds.push(createBlockData.metaobjectCreate.metaobject.id);
    }

    if (newBlockIds.length > 0) {
      const setBlocksResponse = await admin.graphql(UPDATE_GUIDE_BLOCKS_MUTATION, {
        variables: { id: newGuideId, blocksJson: JSON.stringify(newBlockIds) },
      });
      const { data: setBlocksData } = await setBlocksResponse.json();
      const setBlocksErrors = setBlocksData.metaobjectUpdate.userErrors;
      if (setBlocksErrors.length > 0) return { ok: false, errors: setBlocksErrors };
    }

    let cursor: string | null = null;
    let hasNextPage = true;
    let originalRule: any = null;
    while (hasNextPage && !originalRule) {
      const rulesResponse = await admin.graphql(ALL_RULES_QUERY, { variables: { cursor } });
      const { data: rulesData } = await rulesResponse.json();
      const page = rulesData.metaobjects;
      originalRule = page.nodes.find((n: any) => n.sizeGuide?.reference?.id === guideId) ?? null;
      hasNextPage = page.pageInfo.hasNextPage;
      cursor = page.pageInfo.endCursor;
    }

    if (originalRule) {
      const createRuleResponse = await admin.graphql(CREATE_METAOBJECT_MUTATION, {
        variables: {
          metaobject: {
            type: "size_guide_rule",
            fields: [
              { key: "size_guide", value: newGuideId },
              { key: "root_operator", value: originalRule.rootOperator?.value ?? "ANY" },
              { key: "conditions", value: originalRule.conditions?.value ?? "[]" },
            ],
          },
        },
      });
      const { data: createRuleData } = await createRuleResponse.json();
      const ruleErrors = createRuleData.metaobjectCreate.userErrors;
      if (ruleErrors.length > 0) return { ok: false, errors: ruleErrors };
    }

    return { ok: true, errors: [] };
  }

  return { ok: false, errors: [{ message: "Acción desconocida" }] };
};

function DeleteButton({ guideId, guideTitle }: { guideId: string; guideTitle: string }) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<typeof action>();

  return (
    <>
      <button type="button" style={dangerButtonStyle} onClick={() => setOpen(true)}>
        Eliminar
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1.5rem",
              maxWidth: "400px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ marginTop: 0, fontWeight: "bold" }}>Eliminar guía de tallas</p>
            <p>
              ¿Seguro que quieres eliminar <strong>"{guideTitle}"</strong>? Esta acción no
              se puede deshacer. Sus bloques de contenido y su regla de asignación no se
              borrarán, pero se quedarán sin usar.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="button" style={buttonBaseStyle} onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <fetcher.Form method="post" onSubmit={() => setOpen(false)} style={{ display: "contents" }}>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="guideId" value={guideId} />
                <button type="submit" style={primaryButtonStyle}>
                  Sí, eliminar
                </button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SizeGuidesDashboard() {
  const { guides, query } = useLoaderData<typeof loader>();
  const duplicateFetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (!duplicateFetcher.data) return;
    if (duplicateFetcher.data.ok) {
      shopify.toast.show("Hecho");
    } else {
      shopify.toast.show(`Error: ${JSON.stringify(duplicateFetcher.data.errors)}`, { isError: true });
    }
  }, [duplicateFetcher.data, shopify]);

  return (
    <s-page heading="Guías de tallas">
      <s-section heading={`${guides.length} guía${guides.length === 1 ? "" : "s"}`}>
        <Form method="get" style={{ marginBottom: "0.5rem" }}>
          <input
            key={query}
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por título..."
            style={{ padding: "0.5rem", width: "300px" }}
          />
          <button type="submit" style={buttonBaseStyle}>
            Buscar
          </button>
        </Form>
        {query && (
          <s-paragraph>
            <s-link href="/app/size-guides">Limpiar búsqueda</s-link>
          </s-paragraph>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          {guides.length === 0 && (
            <s-paragraph>
              {query
                ? `No hay ninguna guía cuyo título contenga "${query}".`
                : "No hay ninguna guía de tallas creada todavía en esta tienda."}
            </s-paragraph>
          )}

          <s-stack direction="block" gap="base">
            {guides.map((guide) => (
              <s-box
                key={guide.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-paragraph>
                  <strong>{guide.title}</strong>{" "}
                  <Badge
                    text={guide.status}
                    color={guide.status === "Activa" ? "#0a5c2b" : "#7a5b00"}
                    background={guide.status === "Activa" ? "#d3f2df" : "#fff2cc"}
                  />
                </s-paragraph>
                <s-paragraph>
                  <s-text>
                    Prioridad: {guide.priority} · Legacy Kiwi ID: {guide.legacyKiwiId} · Actualizada {guide.relativeUpdatedAt}
                  </s-text>
                </s-paragraph>

                {guide.rules.length === 0 && (
                  <s-paragraph>
                    <s-text>Sin regla de asignación todavía</s-text>
                  </s-paragraph>
                )}
                {guide.rules.map((rule, i) => (
                  <s-paragraph key={i}>
                    <Badge text={`Match ${rule.rootOperator}`} color="#1a3d7c" background="#dbe7ff" />
                    {rule.conditions.map((c, j) => (
                      <Badge key={j} text={`${c.field}: ${c.value}`} color="#333" background="#eee" />
                    ))}
                  </s-paragraph>
                ))}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <Link to={`/app/size-guides/${encodeURIComponent(guide.id)}`} style={buttonBaseStyle}>
                    Editar
                  </Link>
                  <duplicateFetcher.Form method="post" style={{ display: "contents" }}>
                    <input type="hidden" name="intent" value="duplicate" />
                    <input type="hidden" name="guideId" value={guide.id} />
                    <button type="submit" style={buttonBaseStyle}>
                      Duplicar
                    </button>
                  </duplicateFetcher.Form>
                  <DeleteButton guideId={guide.id} guideTitle={guide.title} />
                </div>
              </s-box>
            ))}
          </s-stack>
        </div>
      </s-section>

      <s-section slot="aside" heading="Sobre esta lista">
        <s-paragraph>
          "Duplicar" copia la guía completa: datos básicos, bloques de
          contenido y regla de asignación (si tiene). La copia se crea
          siempre como Borrador. "Eliminar" borra solo la guía, no sus
          bloques ni su regla (quedan sin usar, no se pierden).
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
