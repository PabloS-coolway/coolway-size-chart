/**
 * app/routes/app.size-guides.$id_.blocks.tsx
 *
 * Tarea 2.10 (Pieza C, parte 1) — Lista de bloques de contenido de una guía,
 * con enlaces para añadir uno nuevo de cada tipo y quitar los existentes.
 *
 * DECISIONES DE ALCANCE (coste alto de la pieza, acotado deliberadamente):
 * 1. "Quitar" un bloque de esta lista NO borra la entrada del bloque en sí
 *    (size_guide_block_*) — solo lo desvincula del campo `blocks` de la
 *    guía. Más seguro: evita perder contenido por error. Si de verdad hace
 *    falta borrar la entrada, se hace desde el editor nativo de Shopify.
 * 2. Sin reordenar bloques en esta versión — el orden queda fijo según se
 *    fueron añadiendo. Pendiente como mejora futura (Pieza G o posterior).
 *
 * ⚠️ PUNTO SIN VERIFICAR: se usa `field(key:"blocks") { references(first) }`
 * para leer una lista de referencia mixta — por analogía con `reference`
 * (singular, ya confirmado en la Pieza D para `size_guide`), pero no
 * probado directamente hasta esta pieza.
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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);

  const response = await admin.graphql(GET_GUIDE_BLOCKS_QUERY, { variables: { id: guideId } });
  const { data } = await response.json();

  const nodes = data.metaobject?.blocks?.references?.nodes ?? [];
  const blocks: BlockSummary[] = nodes.map((node: any) => {
    const summary =
      node.label?.value ||
      (node.content?.value ? "(texto enriquecido)" : "") ||
      node.videoUrl?.value ||
      node.altText?.value ||
      "(sin resumen)";
    return { id: node.id, type: node.type, summary };
  });

  return { guideId, blocks };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);
  const formData = await request.formData();
  const removeBlockId = String(formData.get("removeBlockId") ?? "");

  // Recarga la lista actual, quita el bloque indicado, y guarda la lista
  // resultante — no hay una mutación de "quitar un elemento de la lista"
  // directa, hay que reescribir la lista completa con el elemento fuera.
  const response = await admin.graphql(GET_GUIDE_BLOCKS_QUERY, { variables: { id: guideId } });
  const { data } = await response.json();
  const currentIds: string[] = (data.metaobject?.blocks?.references?.nodes ?? []).map(
    (n: any) => n.id,
  );
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
      shopify.toast.show("Bloque quitado de la guía");
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
          {blocks.map((block) => (
            <s-box key={block.id} padding="base" borderWidth="base" borderRadius="base">
              <s-paragraph>
                <strong>{typeLabel(block.type)}</strong>
              </s-paragraph>
              <s-paragraph>
                <s-text>{block.summary} · </s-text>
                <s-link
                  href={`/app/size-guides/${encodedGuideId}/blocks/${shortTypeSlug(block.type)}/${encodeURIComponent(block.id)}`}
                >
                  Editar
                </s-link>
                <s-text> · </s-text>
                <fetcher.Form method="post" style={{ display: "inline" }}>
                  <input type="hidden" name="removeBlockId" value={block.id} />
                  <button type="submit">Quitar de la guía</button>
                </fetcher.Form>
              </s-paragraph>
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
          esta guía. El orden de los bloques no se puede cambiar todavía
          desde aquí.
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
