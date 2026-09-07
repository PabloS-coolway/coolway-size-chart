/**
 * app/routes/app.size-guides.$id_.blocks.tsx
 *
 * Tarea 2.10 (Pieza C, parte 1) — Lista de bloques de contenido de una guía.
 * Pieza G1: resumen real de bloques de texto. Pieza G5: reordenar bloques
 * con botones "Subir"/"Bajar". Pieza G6: miniatura de imagen en el listado
 * para bloques de tipo imagen (antes solo se veía la vista previa dentro
 * del editor individual del bloque, no en esta lista).
 *
 * DECISIONES DE ALCANCE (coste alto de la pieza C, acotado deliberadamente):
 * 1. "Quitar" un bloque no borra la entrada, solo la desvincula.
 * 2. Reordenar con botones ↑/↓, no arrastrar y soltar.
 */

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

interface BlockSummary {
  id: string;
  type: string;
  summary: string;
  imageUrl: string | null;
}

const GET_GUIDE_BLOCKS_QUERY = `#graphql
  query GetGuideBlocks($id: ID!) {
    metaobject(id: $id) {
      id
      blocks: field(key: "blocks") {
        references(first: 50) {
          nodes {
            ... on Metaobject {
              id
              type
              label: field(key: "label") { value }
              content: field(key: "content") { value }
              videoUrl: field(key: "video_url") { value }
              altText: field(key: "alt_text") { value }
              image: field(key: "image") {
                reference {
                  ... on MediaImage {
                    image { url }
                  }
                }
              }
            }
          }
        }
      }
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

function typeLabel(type: string): string {
  switch (type) {
    case "size_guide_block_table":
      return "Tabla";
    case "size_guide_block_text":
      return "Texto";
    case "size_guide_block_image":
      return "Imagen";
    case "size_guide_block_video":
      return "Vídeo";
    default:
      return type;
  }
}

function shortTypeSlug(type: string): string {
  return type.replace("size_guide_block_", "");
}

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

async function fetchCurrentBlockIds(admin: any, guideId: string): Promise<string[]> {
  const response = await admin.graphql(GET_GUIDE_BLOCKS_QUERY, { variables: { id: guideId } });
  const { data } = await response.json();
  return (data.metaobject?.blocks?.references?.nodes ?? []).map((n: any) => n.id);
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);

  const response = await admin.graphql(GET_GUIDE_BLOCKS_QUERY, { variables: { id: guideId } });
  const { data } = await response.json();

  const nodes = data.metaobject?.blocks?.references?.nodes ?? [];
  const blocks: BlockSummary[] = nodes.map((node: any) => {
    const textSnippet = extractPlainTextFromRichText(node.content?.value);
    const summary =
      node.label?.value ||
      (textSnippet ? textSnippet.slice(0, 60) + (textSnippet.length > 60 ? "…" : "") : "") ||
      node.videoUrl?.value ||
      node.altText?.value ||
      "(sin resumen)";
    return {
      id: node.id,
      type: node.type,
      summary,
      imageUrl: node.image?.reference?.image?.url ?? null,
    };
  });

  return { guideId, blocks };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "remove");

  if (intent === "move") {
    const blockId = String(formData.get("blockId") ?? "");
    const direction = String(formData.get("direction") ?? "");
    const currentIds = await fetchCurrentBlockIds(admin, guideId);
    const index = currentIds.indexOf(blockId);
    if (index === -1) return { ok: false, errors: [{ message: "Bloque no encontrado en la lista" }] };

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) {
      return { ok: true, errors: [] };
    }

    const newIds = [...currentIds];
    [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];

    const updateResponse = await admin.graphql(UPDATE_GUIDE_BLOCKS_MUTATION, {
      variables: { id: guideId, blocksJson: JSON.stringify(newIds) },
    });
    const { data: updateData } = await updateResponse.json();
    const userErrors = updateData.metaobjectUpdate.userErrors;
    if (userErrors.length > 0) return { ok: false, errors: userErrors };
    return { ok: true, errors: [] };
  }

  const removeBlockId = String(formData.get("removeBlockId") ?? "");
  const currentIds = await fetchCurrentBlockIds(admin, guideId);
  const newIds = currentIds.filter((id) => id !== removeBlockId);

  const updateResponse = await admin.graphql(UPDATE_GUIDE_BLOCKS_MUTATION, {
    variables: { id: guideId, blocksJson: JSON.stringify(newIds) },
  });
  const { data: updateData } = await updateResponse.json();
  const userErrors = updateData.metaobjectUpdate.userErrors;

  if (userErrors.length > 0) return { ok: false, errors: userErrors };
  return { ok: true, errors: [] };
};

export default function GuideBlocksList() {
  const { guideId, blocks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show("Hecho");
    } else {
      shopify.toast.show(`Error: ${JSON.stringify(fetcher.data.errors)}`, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const encodedGuideId = encodeURIComponent(guideId);

  return (
    <s-page heading="Bloques de contenido">
      <s-section heading={`${blocks.length} bloque${blocks.length === 1 ? "" : "s"}`}>
        {blocks.length === 0 && <s-paragraph>Esta guía no tiene ningún bloque todavía.</s-paragraph>}

        <s-stack direction="block" gap="base">
          {blocks.map((block, index) => (
            <s-box key={block.id} padding="base" borderWidth="base" borderRadius="base">
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                {block.imageUrl && (
                  <img
                    src={block.imageUrl}
                    alt=""
                    style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                  />
                )}
                <div>
                  <s-paragraph>
                    <strong>{typeLabel(block.type)}</strong>
                  </s-paragraph>
                  <s-paragraph>
                    <s-text>{block.summary}</s-text>
                  </s-paragraph>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
                <fetcher.Form method="post" style={{ display: "contents" }}>
                  <input type="hidden" name="intent" value="move" />
                  <input type="hidden" name="blockId" value={block.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" disabled={index === 0}>
                    ↑ Subir
                  </button>
                </fetcher.Form>
                <fetcher.Form method="post" style={{ display: "contents" }}>
                  <input type="hidden" name="intent" value="move" />
                  <input type="hidden" name="blockId" value={block.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button type="submit" disabled={index === blocks.length - 1}>
                    ↓ Bajar
                  </button>
                </fetcher.Form>
                <s-link
                  href={`/app/size-guides/${encodedGuideId}/blocks/${shortTypeSlug(block.type)}/${encodeURIComponent(block.id)}`}
                >
                  Editar
                </s-link>
                <fetcher.Form method="post" style={{ display: "contents" }}>
                  <input type="hidden" name="intent" value="remove" />
                  <input type="hidden" name="removeBlockId" value={block.id} />
                  <button type="submit">Quitar de la guía</button>
                </fetcher.Form>
              </div>
            </s-box>
          ))}
        </s-stack>
      </s-section>

      <s-section heading="Añadir un bloque nuevo">
        <s-stack direction="inline" gap="base">
          <s-link href={`/app/size-guides/${encodedGuideId}/blocks/table/new`}>+ Tabla</s-link>
          <s-link href={`/app/size-guides/${encodedGuideId}/blocks/text/new`}>+ Texto</s-link>
          <s-link href={`/app/size-guides/${encodedGuideId}/blocks/image/new`}>+ Imagen</s-link>
          <s-link href={`/app/size-guides/${encodedGuideId}/blocks/video/new`}>+ Vídeo</s-link>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Sobre esta pantalla">
        <s-paragraph>
          "Quitar de la guía" no borra el bloque en sí, solo lo desvincula de
          esta guía. "Subir"/"Bajar" cambian el orden en el que se muestran
          los bloques en el storefront.
        </s-paragraph>
        <s-paragraph>
          <s-link href={`/app/size-guides/${encodedGuideId}`}>Volver a la guía</s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
