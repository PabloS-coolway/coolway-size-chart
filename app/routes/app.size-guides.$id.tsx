/**
 * app/routes/app.size-guides.$id.tsx
 *
 * Tarea 2.10 (Pieza B) — Editor de guía: datos básicos (título, descripción,
 * prioridad, estado). NO incluye todavía la gestión de bloques de contenido
 * (Pieza C) ni la regla de asignación (Pieza D).
 *
 * VALIDADO (01-sept-2026, contra la guía de prueba real en coolway-sandbox):
 * - El guardado (metaobjectUpdate con `fields` + `capabilities.publishable`)
 *   funciona y persiste correctamente.
 * - Confirmado que es un PATCH parcial: tras guardar solo título/descripción/
 *   prioridad/estado, tanto `legacy_kiwi_id` ("Football") como `Blocks` (el
 *   bloque de tabla enlazado) siguieron intactos. Los 2 puntos que estaban
 *   marcados como "sin verificar" quedan confirmados correctos.
 *
 * CORRECCIÓN (tras la primera prueba real): con <Form method="post"> de
 * react-router, el guardado funcionaba pero no se veía ningún mensaje de
 * "guardado correctamente" ni de error en pantalla — probablemente porque
 * la navegación de un <Form> normal recarga la página en vez de hacer una
 * actualización en cliente. Se sustituye por useFetcher + un toast vía
 * App Bridge (shopify.toast.show(...)), el mismo patrón ya usado y probado
 * en app._index.tsx — evita introducir un mecanismo nuevo sin confirmar.
 *
 * LIMITACIÓN CONOCIDA (documentada, no un descuido): `description` es un
 * campo de texto enriquecido (rich_text_field), guardado internamente como
 * una estructura JSON. Esta pieza lo trata como texto plano — al guardar
 * desde este editor, cualquier negrita/enlace que tuviera se perdería
 * (se sustituye por un único párrafo de texto plano). Aceptable ahora porque
 * la entrada de prueba real no usa ningún formato enriquecido todavía.
 *
 * Los campos de formulario usan HTML nativo (<input>, <textarea>, <select>)
 * en vez de componentes <s-text-field> / <s-number-field> de Shopify sin
 * verificar — mismo criterio aplicado en la Pieza A con <strong>.
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

interface SizeGuideDetail {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: "ACTIVE" | "DRAFT";
}

const GET_SIZE_GUIDE_QUERY = `#graphql
  query GetSizeGuide($id: ID!) {
    metaobject(id: $id) {
      id
      capabilities {
        publishable {
          status
        }
      }
      title: field(key: "title") { value }
      description: field(key: "description") { value }
      priority: field(key: "priority") { value }
    }
  }
`;

const UPDATE_SIZE_GUIDE_MUTATION = `#graphql
  mutation UpdateSizeGuide($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

/**
 * Extrae el texto plano de la estructura JSON de un rich_text_field. Si el
 * JSON no tiene la forma esperada, o viene vacío/corrupto, devuelve cadena
 * vacía en vez de lanzar una excepción que tumbe toda la página.
 */
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

/** Construye un rich_text_field válido con un único párrafo de texto plano. */
function buildRichTextFromPlainText(plainText: string): string {
  return JSON.stringify({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: plainText }],
      },
    ],
  });
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const id = decodeURIComponent(params.id!);

  const response = await admin.graphql(GET_SIZE_GUIDE_QUERY, { variables: { id } });
  const { data } = await response.json();

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

  return { guide };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const id = decodeURIComponent(params.id!);
  const formData = await request.formData();

  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const priority = String(formData.get("priority") ?? "0");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "DRAFT";

  const response = await admin.graphql(UPDATE_SIZE_GUIDE_MUTATION, {
    variables: {
      id,
      metaobject: {
        fields: [
          { key: "title", value: title },
          { key: "description", value: buildRichTextFromPlainText(description) },
          { key: "priority", value: priority },
        ],
        capabilities: {
          publishable: { status },
        },
      },
    },
  });
  const { data } = await response.json();
  const userErrors = data.metaobjectUpdate.userErrors;

  if (userErrors.length > 0) {
    return { ok: false, errors: userErrors };
  }

  return { ok: true, errors: [] };
};

export default function SizeGuideEditor() {
  const { guide } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isSaving = fetcher.state === "submitting";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show("Guía guardada correctamente");
    } else {
      shopify.toast.show(`Error al guardar: ${JSON.stringify(fetcher.data.errors)}`, {
        isError: true,
      });
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="Editar guía de tallas">
      <s-section heading="Datos básicos">
        <fetcher.Form method="post">
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="title">
              <strong>Título</strong>
            </label>
            <br />
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={guide.title}
              maxLength={70}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="description">
              <strong>Descripción</strong> (texto plano — ver limitación en el
              comentario de cabecera del código)
            </label>
            <br />
            <textarea
              id="description"
              name="description"
              defaultValue={guide.description}
              rows={4}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="priority">
              <strong>Prioridad</strong>
            </label>
            <br />
            <input
              id="priority"
              name="priority"
              type="number"
              defaultValue={guide.priority}
              style={{ width: "150px", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="status">
              <strong>Estado</strong>
            </label>
            <br />
            <select
              id="status"
              name="status"
              defaultValue={guide.status}
              style={{ padding: "0.5rem" }}
            >
              <option value="ACTIVE">Activa</option>
              <option value="DRAFT">Borrador</option>
            </select>
          </div>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </fetcher.Form>
      </s-section>

      <s-section slot="aside" heading="Sobre este editor">
        <s-paragraph>
          Guarda los datos básicos de la guía. Los bloques de contenido
          (tabla, texto, imagen, vídeo) y la regla de asignación se añaden en
          los siguientes pasos de la tarea 2.10.
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
