/**
 * app/routes/app.size-guides.$id.tsx
 *
 * Tarea 2.15 — Editor de guía unificado en una sola pantalla (estilo
 * Kiwi), sustituye a la versión de la 2.10 (Pieza B) que solo cubría
 * datos básicos y enlazaba a 3 pantallas aparte (blocks.tsx,
 * blocks_.$type.$blockId.tsx, rule.tsx). Ver
 * openspec/changes/2026-09-10-size-guide-unified-editor/design.md.
 *
 * Las 3 rutas antiguas se dejan sin tocar (no se borran) pero ya no se
 * enlazan desde ningún sitio de esta pantalla.
 *
 * VALIDADO (herencia de la 2.10, sin cambios de contrato): el guardado
 * de datos básicos sigue siendo un PATCH parcial vía metaobjectUpdate.
 */

import { useEffect, useRef, useState } from "react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import BlockFormFields, { EMPTY_BLOCK_FIELDS, type BlockFieldsValue } from "../components/BlockFormFields";
import SizeGuidePreviewModal from "../components/SizeGuidePreviewModal";
import type { RuleCondition } from "../lib/size-guide-resolver";
import {
  TYPE_TO_METAOBJECT,
  typeLabel,
  shortTypeSlug,
  extractPlainTextFromRichText,
  buildRichTextFromPlainText,
  uploadImageFile,
} from "../lib/size-guide-block-helpers";

const MAX_CONDITIONS = 5;

interface SizeGuideDetail {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: "ACTIVE" | "DRAFT";
}

interface BlockRowData {
  id: string;
  shortType: string;
  typeLabelText: string;
  summary: string;
  fields: BlockFieldsValue;
  imagePreviewUrl: string | null;
}

interface RuleDetail {
  ruleId: string | null;
  rootOperator: "ANY" | "ALL";
  conditions: RuleCondition[];
}

const GET_GUIDE_QUERY = `#graphql
  query GetSizeGuide($id: ID!) {
    metaobject(id: $id) {
      id
      capabilities { publishable { status } }
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
              footerText: field(key: "footer_text") { value }
              hideTable: field(key: "hide_table") { value }
              tableStyles: field(key: "table_styles") { value }
              content: field(key: "content") { value }
              altText: field(key: "alt_text") { value }
              caption: field(key: "caption") { value }
              videoUrl: field(key: "video_url") { value }
              image: field(key: "image") {
                reference { ... on MediaImage { image { url } } }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_RULE_FOR_GUIDE_QUERY = `#graphql
  query GetRuleForGuide($cursor: String) {
    metaobjects(type: "size_guide_rule", first: 100, after: $cursor) {
      nodes {
        id
        sizeGuide: field(key: "size_guide") { reference { ... on Metaobject { id } } }
        rootOperator: field(key: "root_operator") { value }
        conditions: field(key: "conditions") { value }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const UPDATE_GUIDE_MUTATION = `#graphql
  mutation UpdateSizeGuide($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const UPDATE_GUIDE_BLOCKS_MUTATION = `#graphql
  mutation UpdateGuideBlocks($id: ID!, $blocksJson: String!) {
    metaobjectUpdate(id: $id, metaobject: { fields: [{ key: "blocks", value: $blocksJson }] }) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const CREATE_BLOCK_MUTATION = `#graphql
  mutation CreateBlock($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const UPDATE_BLOCK_MUTATION = `#graphql
  mutation UpdateBlock($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const CREATE_RULE_MUTATION = `#graphql
  mutation CreateSizeGuideRule($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const UPDATE_RULE_MUTATION = `#graphql
  mutation UpdateSizeGuideRule($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

async function fetchRuleForGuide(admin: any, guideId: string): Promise<RuleDetail> {
  let existingRule: RuleDetail = { ruleId: null, rootOperator: "ANY", conditions: [] };
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage && !existingRule.ruleId) {
    const response = await admin.graphql(GET_RULE_FOR_GUIDE_QUERY, { variables: { cursor } });
    const { data } = await response.json();
    const page = data.metaobjects;

    for (const node of page.nodes) {
      if (node.sizeGuide?.reference?.id === guideId) {
        let conditions: RuleCondition[] = [];
        try {
          conditions = JSON.parse(node.conditions?.value ?? "[]");
        } catch {
          conditions = [];
        }
        existingRule = {
          ruleId: node.id,
          rootOperator: node.rootOperator?.value === "ALL" ? "ALL" : "ANY",
          conditions,
        };
        break;
      }
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return existingRule;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const id = decodeURIComponent(params.id!);

  const [guideResponse, rule] = await Promise.all([
    admin.graphql(GET_GUIDE_QUERY, { variables: { id } }).then((r: any) => r.json()),
    fetchRuleForGuide(admin, id),
  ]);
  const data = guideResponse.data;

  if (!data.metaobject) {
    throw new Response("Guía no encontrada", { status: 404 });
  }

  const guide: SizeGuideDetail = {
    id: data.metaobject.id,
    title: data.metaobject.title?.value ?? "",
    description: extractPlainTextFromRichText(data.metaobject.description?.value),
    priority: data.metaobject.priority?.value ?? "0",
    status: data.metaobject.capabilities?.publishable?.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
  };

  const nodes = data.metaobject.blocks?.references?.nodes ?? [];
  const blocks: BlockRowData[] = nodes.map((node: any) => {
    const textSnippet = extractPlainTextFromRichText(node.content?.value);
    const summary =
      node.label?.value ||
      (textSnippet ? textSnippet.slice(0, 60) + (textSnippet.length > 60 ? "…" : "") : "") ||
      node.videoUrl?.value ||
      node.altText?.value ||
      "(sin resumen)";
    return {
      id: node.id,
      shortType: shortTypeSlug(node.type),
      typeLabelText: typeLabel(node.type),
      summary,
      fields: {
        label: node.label?.value ?? "",
        headers: node.headers?.value ?? "",
        rows: node.rows?.value ?? "",
        unitPrimary: node.unitPrimary?.value ?? "",
        unitSecondary: node.unitSecondary?.value ?? "",
        hasDualUnitSelector: node.hasDualUnitSelector?.value ?? "false",
        footerText: node.footerText?.value ?? "",
        hideTable: node.hideTable?.value ?? "false",
        tableStyles: node.tableStyles?.value ?? "",
        content: node.content?.value ?? "",
        altText: node.altText?.value ?? "",
        caption: node.caption?.value ?? "",
        videoUrl: node.videoUrl?.value ?? "",
      },
      imagePreviewUrl: node.image?.reference?.image?.url ?? null,
    };
  });

  return { guide, blocks, rule };
};

async function fetchCurrentBlockIds(admin: any, guideId: string): Promise<string[]> {
  const response = await admin.graphql(
    `#graphql
      query GetGuideBlockIds($id: ID!) {
        metaobject(id: $id) {
          blocks: field(key: "blocks") { references(first: 50) { nodes { ... on Metaobject { id } } } }
        }
      }
    `,
    { variables: { id: guideId } },
  );
  const { data } = await response.json();
  return (data.metaobject?.blocks?.references?.nodes ?? []).map((n: any) => n.id);
}

async function handleSaveGuide(admin: any, guideId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const priority = String(formData.get("priority") ?? "0");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "DRAFT";

  const response = await admin.graphql(UPDATE_GUIDE_MUTATION, {
    variables: {
      id: guideId,
      metaobject: {
        fields: [
          { key: "title", value: title },
          { key: "description", value: buildRichTextFromPlainText(description) },
          { key: "priority", value: priority },
        ],
        capabilities: { publishable: { status } },
      },
    },
  });
  const { data } = await response.json();
  const userErrors = data.metaobjectUpdate.userErrors;
  return userErrors.length > 0 ? { ok: false, errors: userErrors } : { ok: true, errors: [] };
}

async function handleMoveBlock(admin: any, guideId: string, formData: FormData) {
  const blockId = String(formData.get("blockId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const currentIds = await fetchCurrentBlockIds(admin, guideId);
  const index = currentIds.indexOf(blockId);
  if (index === -1) return { ok: false, errors: [{ message: "Bloque no encontrado" }] };

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= currentIds.length) return { ok: true, errors: [] };

  const newIds = [...currentIds];
  [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];

  const response = await admin.graphql(UPDATE_GUIDE_BLOCKS_MUTATION, {
    variables: { id: guideId, blocksJson: JSON.stringify(newIds) },
  });
  const { data } = await response.json();
  const userErrors = data.metaobjectUpdate.userErrors;
  return userErrors.length > 0 ? { ok: false, errors: userErrors } : { ok: true, errors: [] };
}

async function handleRemoveBlock(admin: any, guideId: string, formData: FormData) {
  const removeBlockId = String(formData.get("blockId") ?? "");
  const currentIds = await fetchCurrentBlockIds(admin, guideId);
  const newIds = currentIds.filter((id) => id !== removeBlockId);

  const response = await admin.graphql(UPDATE_GUIDE_BLOCKS_MUTATION, {
    variables: { id: guideId, blocksJson: JSON.stringify(newIds) },
  });
  const { data } = await response.json();
  const userErrors = data.metaobjectUpdate.userErrors;
  return userErrors.length > 0 ? { ok: false, errors: userErrors } : { ok: true, errors: [] };
}

async function handleSaveBlock(admin: any, guideId: string, formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const blockId = String(formData.get("blockId") ?? "new");
  const metaobjectType = TYPE_TO_METAOBJECT[type];

  let fields: { key: string; value: string }[] = [];

  if (type === "table") {
    fields = [
      { key: "label", value: String(formData.get("label") ?? "") },
      { key: "headers", value: String(formData.get("headers") ?? "[]") },
      { key: "rows", value: String(formData.get("rows") ?? "[]") },
      { key: "unit_primary", value: String(formData.get("unitPrimary") ?? "") },
      { key: "unit_secondary", value: String(formData.get("unitSecondary") ?? "") },
      { key: "has_dual_unit_selector", value: formData.get("hasDualUnitSelector") === "on" ? "true" : "false" },
      { key: "footer_text", value: String(formData.get("footerText") ?? "") },
      { key: "hide_table", value: formData.get("hideTable") === "on" ? "true" : "false" },
      { key: "table_styles", value: String(formData.get("tableStyles") || "{}") },
    ];
  } else if (type === "text") {
    fields = [{ key: "content", value: String(formData.get("content") ?? "") }];
  } else if (type === "image") {
    fields = [
      { key: "alt_text", value: String(formData.get("altText") ?? "") },
      { key: "caption", value: String(formData.get("caption") ?? "") },
    ];
    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
      try {
        const uploaded = await uploadImageFile(admin, imageFile);
        fields.push({ key: "image", value: uploaded.id });
      } catch (err) {
        return { ok: false, errors: [{ message: `Error al subir la imagen: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    }
  } else if (type === "video") {
    fields = [
      { key: "video_url", value: String(formData.get("videoUrl") ?? "") },
      { key: "caption", value: String(formData.get("caption") ?? "") },
    ];
  }

  if (blockId === "new") {
    const createResponse = await admin.graphql(CREATE_BLOCK_MUTATION, {
      variables: { metaobject: { type: metaobjectType, fields } },
    });
    const { data: createData } = await createResponse.json();
    const createErrors = createData.metaobjectCreate.userErrors;
    if (createErrors.length > 0) return { ok: false, errors: createErrors };

    const newBlockId = createData.metaobjectCreate.metaobject.id;
    const currentIds = await fetchCurrentBlockIds(admin, guideId);
    const newIds = [...currentIds, newBlockId];

    const appendResponse = await admin.graphql(UPDATE_GUIDE_BLOCKS_MUTATION, {
      variables: { id: guideId, blocksJson: JSON.stringify(newIds) },
    });
    const { data: appendData } = await appendResponse.json();
    const appendErrors = appendData.metaobjectUpdate.userErrors;
    if (appendErrors.length > 0) return { ok: false, errors: appendErrors };

    return { ok: true, errors: [], created: true };
  }

  const updateResponse = await admin.graphql(UPDATE_BLOCK_MUTATION, {
    variables: { id: blockId, metaobject: { fields } },
  });
  const { data: updateData } = await updateResponse.json();
  const userErrors = updateData.metaobjectUpdate.userErrors;
  return userErrors.length > 0 ? { ok: false, errors: userErrors } : { ok: true, errors: [], created: false };
}

async function handleSaveRule(admin: any, guideId: string, formData: FormData) {
  const existingRuleId = String(formData.get("ruleId") ?? "") || null;
  const rootOperator = formData.get("rootOperator") === "ALL" ? "ALL" : "ANY";

  const conditions: RuleCondition[] = [];
  for (let i = 1; i <= MAX_CONDITIONS; i++) {
    const field = String(formData.get(`field${i}`) ?? "");
    const operator = String(formData.get(`operator${i}`) ?? "equals");
    const value = String(formData.get(`value${i}`) ?? "");
    if (field && value) {
      conditions.push({ field: field as RuleCondition["field"], operator: operator as RuleCondition["operator"], value });
    }
  }

  const fields = [
    { key: "root_operator", value: rootOperator },
    { key: "conditions", value: JSON.stringify(conditions) },
  ];

  if (existingRuleId) {
    const response = await admin.graphql(UPDATE_RULE_MUTATION, { variables: { id: existingRuleId, metaobject: { fields } } });
    const { data } = await response.json();
    const userErrors = data.metaobjectUpdate.userErrors;
    return userErrors.length > 0 ? { ok: false, errors: userErrors } : { ok: true, errors: [] };
  }

  const response = await admin.graphql(CREATE_RULE_MUTATION, {
    variables: { metaobject: { type: "size_guide_rule", fields: [...fields, { key: "size_guide", value: guideId }] } },
  });
  const { data } = await response.json();
  const userErrors = data.metaobjectCreate.userErrors;
  return userErrors.length > 0 ? { ok: false, errors: userErrors } : { ok: true, errors: [] };
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  switch (intent) {
    case "save-guide":
      return handleSaveGuide(admin, guideId, formData);
    case "move-block":
      return handleMoveBlock(admin, guideId, formData);
    case "remove-block":
      return handleRemoveBlock(admin, guideId, formData);
    case "save-block":
      return handleSaveBlock(admin, guideId, formData);
    case "save-rule":
      return handleSaveRule(admin, guideId, formData);
    default:
      return { ok: false, errors: [{ message: `intent desconocido: ${intent}` }] };
  }
};

const FIELD_OPTIONS = ["tag", "collection", "product_type", "vendor", "title"];
const OPERATOR_OPTIONS = ["equals", "not_equals", "contains"];
const ADDABLE_TYPES = ["table", "text", "image", "video"] as const;

const KIWI_TYPE_BADGE_COLOR: Record<string, string> = {
  table: "#1a1a1a",
  text: "#3a6b3a",
  image: "#3a4f6b",
  video: "#6b3a4f",
};

function BlockRow({
  block,
  index,
  total,
  isOpen,
  onOpen,
  onClose,
}: {
  block: BlockRowData;
  index: number;
  total: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const fetcher = useFetcher<{ ok: boolean; errors: any[] }>();
  const shopify = useAppBridge();
  const isBusy = fetcher.state !== "idle";
  const editButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show("Hecho");
      onClose();
    } else {
      shopify.toast.show(`Error: ${JSON.stringify(fetcher.data.errors)}`, { isError: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, shopify]);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          background: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.15rem 0.6rem",
              borderRadius: "999px",
              background: KIWI_TYPE_BADGE_COLOR[block.shortType] ?? "#1a1a1a",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            {block.typeLabelText}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#6b6b6b" }}>{block.summary}</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button ref={editButtonRef} type="button" onClick={onOpen}>Editar</button>
          <fetcher.Form method="post" style={{ display: "contents" }}>
            <input type="hidden" name="intent" value="move-block" />
            <input type="hidden" name="blockId" value={block.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" disabled={index === 0 || isBusy}>↑</button>
          </fetcher.Form>
          <fetcher.Form method="post" style={{ display: "contents" }}>
            <input type="hidden" name="intent" value="move-block" />
            <input type="hidden" name="blockId" value={block.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" disabled={index === total - 1 || isBusy}>↓</button>
          </fetcher.Form>
          <fetcher.Form method="post" style={{ display: "contents" }}>
            <input type="hidden" name="intent" value="remove-block" />
            <input type="hidden" name="blockId" value={block.id} />
            <button type="submit" disabled={isBusy}>Quitar de la guía</button>
          </fetcher.Form>
        </div>
      </div>

      {isOpen && (
        <BlockSidePanel title={`${block.typeLabelText} — ${block.summary}`} onClose={onClose} returnFocusRef={editButtonRef}>
          <fetcher.Form method="post" encType="multipart/form-data">
            <input type="hidden" name="intent" value="save-block" />
            <input type="hidden" name="blockId" value={block.id} />
            <input type="hidden" name="type" value={block.shortType} />
            <BlockFormFields type={block.shortType} fields={block.fields} imagePreviewUrl={block.imagePreviewUrl} />
            <div style={{ marginTop: "1rem" }}>
              <button type="submit" disabled={isBusy}>{isBusy ? "Guardando..." : "Guardar bloque"}</button>
            </div>
          </fetcher.Form>
        </BlockSidePanel>
      )}
    </div>
  );
}

function BlockSidePanel({
  title,
  onClose,
  returnFocusRef,
  children,
}: {
  title: string;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "clamp(480px, 75vw, 1400px)",
          background: "#ffffff",
          boxShadow: "-2px 0 12px rgba(0,0,0,0.15)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            background: "#1a1a1a",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <strong style={{ fontSize: "0.95rem" }}>{title}</strong>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", color: "#fff", border: "none", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </>
  );
}

const ADD_BLOCK_ICON: Record<string, React.ReactNode> = {
  table: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  ),
  text: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="14" y2="18" />
    </svg>
  ),
  image: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-6-5-4 4-2-2-6 5" />
    </svg>
  ),
  video: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <polygon points="10,9 15,12 10,15" fill="currentColor" stroke="none" />
    </svg>
  ),
};

function AddBlockSection({ onCreated }: { onCreated: () => void }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const fetcher = useFetcher<{ ok: boolean; errors: any[]; created?: boolean }>();
  const shopify = useAppBridge();
  const isBusy = fetcher.state !== "idle";
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closePanel() {
    setPanelOpen(false);
    setSelectedType(null);
  }

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show("Bloque creado y añadido a la guía");
      closePanel();
      onCreated();
    } else {
      shopify.toast.show(`Error: ${JSON.stringify(fetcher.data.errors)}`, { isError: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, shopify]);

  return (
    <s-box padding="base" borderWidth="base" borderRadius="base">
      <button ref={triggerRef} type="button" onClick={() => setPanelOpen(true)}>+ Add Section</button>

      {panelOpen && (
        <BlockSidePanel
          title={selectedType ? `Añadir bloque — ${typeLabel(TYPE_TO_METAOBJECT[selectedType])}` : "Añadir sección nueva"}
          onClose={closePanel}
          returnFocusRef={triggerRef}
        >
          {!selectedType && (
            <div>
              <s-paragraph>Elige el tipo de sección que quieres añadir a la guía.</s-paragraph>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                {ADDABLE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "1.25rem 0.5rem",
                      border: "1px solid #d0d0d0",
                      borderRadius: "8px",
                      background: "#fff",
                      cursor: "pointer",
                      color: KIWI_TYPE_BADGE_COLOR[t] ?? "#1a1a1a",
                    }}
                  >
                    {ADD_BLOCK_ICON[t]}
                    <span style={{ fontSize: "0.8rem", color: "#1a1a1a" }}>{typeLabel(TYPE_TO_METAOBJECT[t])}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedType && (
            <fetcher.Form method="post" encType="multipart/form-data">
              <input type="hidden" name="intent" value="save-block" />
              <input type="hidden" name="blockId" value="new" />
              <input type="hidden" name="type" value={selectedType} />
              <BlockFormFields type={selectedType} fields={EMPTY_BLOCK_FIELDS} imagePreviewUrl={null} />
              <div style={{ marginTop: "1rem" }}>
                <button type="submit" disabled={isBusy}>{isBusy ? "Creando..." : "Crear y añadir a la guía"}</button>
                <button type="button" onClick={() => setSelectedType(null)} style={{ marginLeft: "0.5rem" }}>Volver a los tipos</button>
              </div>
            </fetcher.Form>
          )}
        </BlockSidePanel>
      )}
    </s-box>
  );
}

export default function SizeGuideUnifiedEditor() {
  const { guide, blocks, rule } = useLoaderData<typeof loader>();
  const guideFetcher = useFetcher<{ ok: boolean; errors: any[] }>();
  const ruleFetcher = useFetcher<{ ok: boolean; errors: any[] }>();
  const shopify = useAppBridge();
  const [openBlockId, setOpenBlockId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isSavingGuide = guideFetcher.state === "submitting";
  const isSavingRule = ruleFetcher.state === "submitting";

  useEffect(() => {
    if (!guideFetcher.data) return;
    if (guideFetcher.data.ok) shopify.toast.show("Guía guardada correctamente");
    else shopify.toast.show(`Error al guardar: ${JSON.stringify(guideFetcher.data.errors)}`, { isError: true });
  }, [guideFetcher.data, shopify]);

  useEffect(() => {
    if (!ruleFetcher.data) return;
    if (ruleFetcher.data.ok) shopify.toast.show("Regla guardada correctamente");
    else shopify.toast.show(`Error al guardar la regla: ${JSON.stringify(ruleFetcher.data.errors)}`, { isError: true });
  }, [ruleFetcher.data, shopify]);

  const rows = Array.from({ length: MAX_CONDITIONS }, (_, i) => rule.conditions[i] ?? null);

  return (
    <s-page heading="Editar guía de tallas">
      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setPreviewOpen(true)}>
          👁 Preview
        </button>
      </div>
      {previewOpen && (
        <SizeGuidePreviewModal
          guideTitle={guide.title}
          guideDescription={guide.description}
          blocks={blocks}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      <s-section heading="Datos básicos">
        <guideFetcher.Form method="post">
          <input type="hidden" name="intent" value="save-guide" />
          <div style={{ marginBottom: "1rem", marginRight: "1.5rem" }}>
            <label htmlFor="title"><strong>Título</strong></label>
            <br />
            <input id="title" name="title" type="text" defaultValue={guide.title} maxLength={70} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1rem", marginRight: "1.5rem" }}>
            <label htmlFor="description"><strong>Descripción</strong></label>
            <br />
            <textarea id="description" name="description" defaultValue={guide.description} rows={4} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="priority"><strong>Prioridad</strong></label>
            <br />
            <input id="priority" name="priority" type="number" defaultValue={guide.priority} style={{ width: "150px", padding: "0.5rem" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="status"><strong>Estado</strong></label>
            <br />
            <select id="status" name="status" defaultValue={guide.status} style={{ padding: "0.5rem" }}>
              <option value="ACTIVE">Activa</option>
              <option value="DRAFT">Borrador</option>
            </select>
          </div>
          <button type="submit" disabled={isSavingGuide}>{isSavingGuide ? "Guardando..." : "Guardar"}</button>
        </guideFetcher.Form>
      </s-section>

      <s-section heading={`${blocks.length} bloque${blocks.length === 1 ? "" : "s"}`}>
        {blocks.length === 0 && <s-paragraph>Esta guía no tiene ningún bloque todavía.</s-paragraph>}
        <s-stack direction="block" gap="base">
          {blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              isOpen={openBlockId === block.id}
              onOpen={() => setOpenBlockId(block.id)}
              onClose={() => setOpenBlockId(null)}
            />
          ))}
          <AddBlockSection onCreated={() => {}} />
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Regla de asignación">
        <div style={{ width: "100%", boxSizing: "border-box", paddingRight: "15px", overflow: "hidden" }}>
          {!rule.ruleId && (
            <s-paragraph>Esta guía todavía no tiene ninguna regla de asignación — al guardar se creará una nueva.</s-paragraph>
          )}
          <ruleFetcher.Form method="post">
            <input type="hidden" name="intent" value="save-rule" />
            <input type="hidden" name="ruleId" value={rule.ruleId ?? ""} />
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="rootOperator"><strong>Operador raíz</strong></label>
              <br />
              <select id="rootOperator" name="rootOperator" defaultValue={rule.rootOperator} style={{ padding: "0.5rem", width: "100%", boxSizing: "border-box" }}>
                <option value="ANY">ANY (basta con que se cumpla una condición)</option>
                <option value="ALL">ALL (deben cumplirse todas)</option>
              </select>
            </div>
            <strong>Condiciones (hasta {MAX_CONDITIONS})</strong>
            {rows.map((condition, index) => {
              const n = index + 1;
              return (
                <div key={n} style={{ marginTop: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select name={`field${n}`} defaultValue={condition?.field ?? ""} style={{ padding: "0.4rem", flex: 1, boxSizing: "border-box", minWidth: 0 }}>
                      <option value="">(vacío)</option>
                      {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select name={`operator${n}`} defaultValue={condition?.operator ?? "equals"} style={{ padding: "0.4rem", flex: 1, boxSizing: "border-box", minWidth: 0 }}>
                      {OPERATOR_OPTIONS.map((op) => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                  <input
                    name={`value${n}`}
                    type="text"
                    defaultValue={condition?.value ?? ""}
                    placeholder="valor"
                    style={{ padding: "0.5rem", width: "100%", boxSizing: "border-box", marginTop: "0.4rem" }}
                  />
                </div>
              );
            })}
            <div style={{ marginTop: "1rem" }}>
              <button type="submit" disabled={isSavingRule}>{isSavingRule ? "Guardando..." : "Guardar regla"}</button>
            </div>
          </ruleFetcher.Form>
        </div>
      </s-section>

      <s-section slot="aside" heading="Sobre este editor">
        <s-paragraph>
          Los datos básicos, los bloques de contenido y la regla de asignación se editan todos desde esta misma pantalla.
          "Quitar de la guía" no borra el bloque en sí, solo lo desvincula.
        </s-paragraph>
        <s-paragraph>
          <s-link href="/app/size-guides">Volver al listado</s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
