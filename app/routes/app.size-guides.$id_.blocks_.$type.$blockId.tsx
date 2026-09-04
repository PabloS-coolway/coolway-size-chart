/**
 * app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx
 *
 * Tarea 2.10 (Pieza C, parte 2) — Editor de un bloque de contenido
 * individual. Una sola ruta gestiona los 4 tipos (table/text/image/video),
 * con campos condicionales según :type.
 *
 * Ruta: /app/size-guides/:id/blocks/:type/:blockId
 * :blockId = "new" → crea un bloque nuevo y lo añade a la lista `blocks` de
 * la guía. Cualquier otro valor (un GID) → edita ese bloque existente.
 *
 * NOMBRE DE ARCHIVO: doble escape `$id_` y `blocks_` — aplicando la lección
 * de la Pieza D: cualquier segmento fijo que venga después de un parámetro
 * dinámico, en el mismo nombre de archivo, se anida por defecto dentro de la
 * página del padre (que no tiene <Outlet>). Sin el escape, esta pantalla no
 * navegaría al hacer clic, igual que pasó con la regla de asignación.
 *
 * DECISIONES DE ALCANCE (coste alto de la pieza):
 * - Imagen: solo se editan alt_text y caption desde aquí. El archivo de
 *   imagen en sí (campo `image`) NO se puede cambiar desde este editor —
 *   requeriría un selector de archivos de Shopify (App Bridge resource
 *   picker) que no se ha construido en esta pieza. Para cambiar la imagen,
 *   usar el editor nativo de Shopify (Contenido → Metaobjetos).
 * - Tabla: `headers` y `rows` se editan como JSON en un textarea, no con un
 *   editor visual de filas/columnas — mismo patrón ya usado en las
 *   condiciones de la regla (Pieza D).
 */

import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

const TYPE_TO_METAOBJECT: Record<string, string> = {
  table: "size_guide_block_table",
  text: "size_guide_block_text",
  image: "size_guide_block_image",
  video: "size_guide_block_video",
};

/** Extrae texto plano de un rich_text_field (mismo helper que la Pieza B). */
function extractPlainTextFromRichText(rawValue: string | undefined): string {
  if (!rawValue) return "";
  try {
    const doc = JSON.parse(rawValue);
    const parts: string[] = [];
    function walk(node: any) {
      if (!node) return;
      if (typeof node.value === "string") parts.push(node.value);
      if (Array.isArray(node.children)) node.children.forEach(walk);
    }
    walk(doc);
    return parts.join(" ");
  } catch {
    return "";
  }
}

function buildRichTextFromPlainText(plainText: string): string {
  return JSON.stringify({
    type: "root",
    children: [{ type: "paragraph", children: [{ type: "text", value: plainText }] }],
  });
}

const GET_BLOCK_QUERY = `#graphql
  query GetBlock($id: ID!) {
    metaobject(id: $id) {
      id
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
    }
  }
`;

const GET_GUIDE_BLOCKS_QUERY = `#graphql
  query GetGuideBlocksForAppend($id: ID!) {
    metaobject(id: $id) {
      blocks: field(key: "blocks") {
        references(first: 50) {
          nodes { ... on Metaobject { id } }
        }
      }
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

const UPDATE_GUIDE_BLOCKS_MUTATION = `#graphql
  mutation AppendGuideBlock($id: ID!, $blocksJson: String!) {
    metaobjectUpdate(id: $id, metaobject: { fields: [{ key: "blocks", value: $blocksJson }] }) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);
  const type = params.type!;
  const blockId = params.blockId!;

  if (blockId === "new") {
    return { guideId, type, blockId: "new", fields: {} as Record<string, string> };
  }

  const decodedBlockId = decodeURIComponent(blockId);
  const response = await admin.graphql(GET_BLOCK_QUERY, { variables: { id: decodedBlockId } });
  const { data } = await response.json();

  if (!data.metaobject) {
    throw new Response("Bloque no encontrado", { status: 404 });
  }

  const m = data.metaobject;
  const fields: Record<string, string> = {
    label: m.label?.value ?? "",
    headers: m.headers?.value ?? "",
    rows: m.rows?.value ?? "",
    unitPrimary: m.unitPrimary?.value ?? "",
    unitSecondary: m.unitSecondary?.value ?? "",
    hasDualUnitSelector: m.hasDualUnitSelector?.value ?? "false",
    content: extractPlainTextFromRichText(m.content?.value),
    altText: m.altText?.value ?? "",
    caption: m.caption?.value ?? "",
    videoUrl: m.videoUrl?.value ?? "",
  };

  return { guideId, type, blockId: decodedBlockId, fields };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);
  const type = params.type!;
  const blockId = params.blockId!;
  const metaobjectType = TYPE_TO_METAOBJECT[type];
  const formData = await request.formData();

  let fields: { key: string; value: string }[] = [];

  if (type === "table") {
    fields = [
      { key: "label", value: String(formData.get("label") ?? "") },
      { key: "headers", value: String(formData.get("headers") ?? "[]") },
      { key: "rows", value: String(formData.get("rows") ?? "[]") },
      { key: "unit_primary", value: String(formData.get("unitPrimary") ?? "") },
      { key: "unit_secondary", value: String(formData.get("unitSecondary") ?? "") },
      { key: "has_dual_unit_selector", value: formData.get("hasDualUnitSelector") === "on" ? "true" : "false" },
    ];
  } else if (type === "text") {
    fields = [{ key: "content", value: buildRichTextFromPlainText(String(formData.get("content") ?? "")) }];
  } else if (type === "image") {
    fields = [
      { key: "alt_text", value: String(formData.get("altText") ?? "") },
      { key: "caption", value: String(formData.get("caption") ?? "") },
    ];
  } else if (type === "video") {
    fields = [
      { key: "video_url", value: String(formData.get("videoUrl") ?? "") },
      { key: "caption", value: String(formData.get("caption") ?? "") },
    ];
  }

  if (blockId === "new") {
    // Para "image" en creación, el campo `image` (file_reference) es
    // obligatorio en la definición y esta pieza no lo rellena (ver
    // limitación de alcance en la cabecera) — la creación de un bloque de
    // imagen nuevo puede fallar por eso. Documentado, no un descuido: para
    // crear un bloque de imagen hay que hacerlo desde el editor nativo y
    // solo editar alt_text/caption desde aquí después.
    const createResponse = await admin.graphql(CREATE_BLOCK_MUTATION, {
      variables: { metaobject: { type: metaobjectType, fields } },
    });
    const { data: createData } = await createResponse.json();
    const createErrors = createData.metaobjectCreate.userErrors;
    if (createErrors.length > 0) return { ok: false, errors: createErrors };

    const newBlockId = createData.metaobjectCreate.metaobject.id;

    // Añade el bloque nuevo a la lista `blocks` de la guía.
    const guideBlocksResponse = await admin.graphql(GET_GUIDE_BLOCKS_QUERY, {
      variables: { id: guideId },
    });
    const { data: guideBlocksData } = await guideBlocksResponse.json();
    const currentIds: string[] = (guideBlocksData.metaobject?.blocks?.references?.nodes ?? []).map(
      (n: any) => n.id,
    );
    const newIds = [...currentIds, newBlockId];

    const appendResponse = await admin.graphql(UPDATE_GUIDE_BLOCKS_MUTATION, {
      variables: { id: guideId, blocksJson: JSON.stringify(newIds) },
    });
    const { data: appendData } = await appendResponse.json();
    const appendErrors = appendData.metaobjectUpdate.userErrors;
    if (appendErrors.length > 0) return { ok: false, errors: appendErrors };

    return { ok: true, errors: [], newBlockId };
  }

  // Editar bloque existente.
  const decodedBlockId = decodeURIComponent(blockId);
  const updateResponse = await admin.graphql(UPDATE_BLOCK_MUTATION, {
    variables: { id: decodedBlockId, metaobject: { fields } },
  });
  const { data: updateData } = await updateResponse.json();
  const userErrors = updateData.metaobjectUpdate.userErrors;
  if (userErrors.length > 0) return { ok: false, errors: userErrors };

  return { ok: true, errors: [] };
};

export default function BlockEditor() {
  const { guideId, type, blockId, fields } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isSaving = fetcher.state === "submitting";
  const isNew = blockId === "new";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show(isNew ? "Bloque creado y añadido a la guía" : "Bloque guardado correctamente");
    } else {
      shopify.toast.show(`Error al guardar: ${JSON.stringify(fetcher.data.errors)}`, {
        isError: true,
      });
    }
  }, [fetcher.data, shopify, isNew]);

  const backHref = `/app/size-guides/${encodeURIComponent(guideId)}/blocks`;

  return (
    <s-page heading={isNew ? "Añadir bloque" : "Editar bloque"}>
      <s-section heading={`Tipo: ${type}`}>
        <fetcher.Form method="post">
          {type === "table" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="label">
                  <strong>Label</strong>
                </label>
                <br />
                <input id="label" name="label" type="text" defaultValue={fields.label} style={{ width: "100%", padding: "0.5rem" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="headers">
                  <strong>Headers (JSON)</strong>
                </label>
                <br />
                <textarea id="headers" name="headers" defaultValue={fields.headers} rows={2} style={{ width: "100%", padding: "0.5rem" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="rows">
                  <strong>Rows (JSON)</strong>
                </label>
                <br />
                <textarea id="rows" name="rows" defaultValue={fields.rows} rows={4} style={{ width: "100%", padding: "0.5rem" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="unitPrimary">
                  <strong>Unit primary</strong>
                </label>
                <br />
                <input id="unitPrimary" name="unitPrimary" type="text" defaultValue={fields.unitPrimary} style={{ padding: "0.5rem" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="unitSecondary">
                  <strong>Unit secondary</strong>
                </label>
                <br />
                <input id="unitSecondary" name="unitSecondary" type="text" defaultValue={fields.unitSecondary} style={{ padding: "0.5rem" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label>
                  <input type="checkbox" name="hasDualUnitSelector" defaultChecked={fields.hasDualUnitSelector === "true"} />{" "}
                  <strong>Has dual unit selector</strong>
                </label>
              </div>
            </>
          )}

          {type === "text" && (
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="content">
                <strong>Contenido</strong> (texto plano — mismo criterio que la descripción de la guía)
              </label>
              <br />
              <textarea id="content" name="content" defaultValue={fields.content} rows={4} style={{ width: "100%", padding: "0.5rem" }} />
            </div>
          )}

          {type === "image" && (
            <>
              {isNew && (
                <s-paragraph>
                  Este editor no permite subir la imagen todavía — crea el
                  bloque de imagen desde el editor nativo de Shopify primero,
                  y luego edita aquí su alt_text/caption.
                </s-paragraph>
              )}
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="altText">
                  <strong>Alt text</strong>
                </label>
                <br />
                <input id="altText" name="altText" type="text" defaultValue={fields.altText} style={{ width: "100%", padding: "0.5rem" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="caption">
                  <strong>Caption</strong>
                </label>
                <br />
                <input id="caption" name="caption" type="text" defaultValue={fields.caption} style={{ width: "100%", padding: "0.5rem" }} />
              </div>
            </>
          )}

          {type === "video" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="videoUrl">
                  <strong>Video URL</strong>
                </label>
                <br />
                <input id="videoUrl" name="videoUrl" type="text" defaultValue={fields.videoUrl} style={{ width: "100%", padding: "0.5rem" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="caption">
                  <strong>Caption</strong>
                </label>
                <br />
                <input id="caption" name="caption" type="text" defaultValue={fields.caption} style={{ width: "100%", padding: "0.5rem" }} />
              </div>
            </>
          )}

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : isNew ? "Crear y añadir a la guía" : "Guardar"}
          </button>
        </fetcher.Form>
      </s-section>

      <s-section slot="aside" heading="Sobre este editor">
        <s-paragraph>
          <s-link href={backHref}>Volver a los bloques de la guía</s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
