/**
 * app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx
 *
 * Tarea 2.10 (Pieza C, parte 2) — Editor de un bloque de contenido
 * individual. Una sola ruta gestiona los 4 tipos (table/text/image/video).
 *
 * Pieza G6 (segundo intento, tras confirmar que `resourcePicker` NO sirve
 * para subir archivos nuevos — solo admite product/variant/collection, error
 * real confirmado en la práctica): se sustituye por subida de archivo
 * directa vía la Admin API (`stagedUploadsCreate` + `fileCreate`), el
 * mecanismo correcto para que una app suba una imagen NUEVA (no elegir entre
 * las ya existentes, que es lo que hacía resourcePicker).
 *
 * Cómo funciona:
 * 1. El formulario incluye un <input type="file"> normal (encType
 *    multipart/form-data).
 * 2. En la acción: si se envió un archivo, se pide a Shopify una URL de
 *    subida temporal (`stagedUploadsCreate`), se sube el archivo ahí
 *    directamente (fetch POST, fuera de la Admin API), y con la URL
 *    resultante se crea el archivo real en Shopify (`fileCreate`).
 * 3. El GID del archivo creado se usa como valor del campo `image`
 *    (file_reference) del bloque — igual que ya confirmamos que funciona al
 *    duplicar bloques de imagen en la Pieza G3.
 *
 * ⚠️ PUNTO SIN VERIFICAR: es la primera vez que se usa este flujo de subida
 * en el proyecto. `stagedUploadsCreate`/`fileCreate` son mutaciones
 * estándar y bien documentadas de la Admin API (más confianza que la
 * llamada de resourcePicker que sí falló), pero el flujo completo de 3
 * pasos encadenados no se ha probado hasta ahora.
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
import TableGridEditor from "../components/TableGridEditor";
import RichTextEditor from "../components/RichTextEditor";

const TYPE_TO_METAOBJECT: Record<string, string> = {
  table: "size_guide_block_table",
  text: "size_guide_block_text",
  image: "size_guide_block_image",
  video: "size_guide_block_video",
};

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
      image: field(key: "image") {
        reference {
          ... on MediaImage {
            id
            image { url }
          }
        }
      }
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

const STAGED_UPLOADS_CREATE_MUTATION = `#graphql
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters { name value }
      }
      userErrors { field message }
    }
  }
`;

const FILE_CREATE_MUTATION = `#graphql
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        ... on MediaImage {
          image { url }
        }
      }
      userErrors { field message }
    }
  }
`;

/**
 * Sube un archivo de imagen nuevo a Shopify y devuelve el GID del archivo
 * creado, listo para usarse como valor de un campo file_reference.
 */
async function uploadImageFile(admin: any, file: File): Promise<{ id: string; url: string | null }> {
  // 1) Pedir una URL de subida temporal.
  const stagedResponse = await admin.graphql(STAGED_UPLOADS_CREATE_MUTATION, {
    variables: {
      input: [
        {
          filename: file.name,
          mimeType: file.type || "image/jpeg",
          httpMethod: "POST",
          resource: "IMAGE",
        },
      ],
    },
  });
  const { data: stagedData } = await stagedResponse.json();
  const stagedErrors = stagedData.stagedUploadsCreate.userErrors;
  if (stagedErrors.length > 0) {
    throw new Error(`stagedUploadsCreate: ${JSON.stringify(stagedErrors)}`);
  }
  const target = stagedData.stagedUploadsCreate.stagedTargets[0];

  // 2) Subir el archivo a esa URL temporal (fuera de la Admin API).
  const uploadForm = new FormData();
  for (const param of target.parameters) {
    uploadForm.append(param.name, param.value);
  }
  uploadForm.append("file", file, file.name);

  const uploadResponse = await fetch(target.url, { method: "POST", body: uploadForm });
  if (!uploadResponse.ok) {
    throw new Error(`Fallo al subir el archivo a la URL temporal (status ${uploadResponse.status})`);
  }

  // 3) Crear el archivo real en Shopify a partir de la URL subida.
  const fileCreateResponse = await admin.graphql(FILE_CREATE_MUTATION, {
    variables: {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: "IMAGE",
        },
      ],
    },
  });
  const { data: fileCreateData } = await fileCreateResponse.json();
  const fileCreateErrors = fileCreateData.fileCreate.userErrors;
  if (fileCreateErrors.length > 0) {
    throw new Error(`fileCreate: ${JSON.stringify(fileCreateErrors)}`);
  }
  const createdFile = fileCreateData.fileCreate.files[0];
  return { id: createdFile.id, url: createdFile.image?.url ?? null };
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);
  const type = params.type!;
  const blockId = params.blockId!;

  if (blockId === "new") {
    return { guideId, type, blockId: "new", fields: {} as Record<string, string>, imagePreviewUrl: null as string | null };
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
    content: m.content?.value ?? "",
    altText: m.altText?.value ?? "",
    caption: m.caption?.value ?? "",
    videoUrl: m.videoUrl?.value ?? "",
  };

  return {
    guideId,
    type,
    blockId: decodedBlockId,
    fields,
    imagePreviewUrl: m.image?.reference?.image?.url ?? null,
  };
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
        return {
          ok: false,
          errors: [{ message: `Error al subir la imagen: ${err instanceof Error ? err.message : String(err)}` }],
          created: false,
        };
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
    if (createErrors.length > 0) return { ok: false, errors: createErrors, created: false };

    const newBlockId = createData.metaobjectCreate.metaobject.id;

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
    if (appendErrors.length > 0) return { ok: false, errors: appendErrors, created: false };

    return { ok: true, errors: [], created: true, newBlockId };
  }

  const decodedBlockId = decodeURIComponent(blockId);
  const updateResponse = await admin.graphql(UPDATE_BLOCK_MUTATION, {
    variables: { id: decodedBlockId, metaobject: { fields } },
  });
  const { data: updateData } = await updateResponse.json();
  const userErrors = updateData.metaobjectUpdate.userErrors;
  if (userErrors.length > 0) return { ok: false, errors: userErrors, created: false };

  return { ok: true, errors: [], created: false };
};

export default function BlockEditor() {
  const { guideId, type, blockId, fields, imagePreviewUrl } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isSaving = fetcher.state === "submitting";
  const isNew = blockId === "new";
  const backHref = `/app/size-guides/${encodeURIComponent(guideId)}/blocks`;

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show(fetcher.data.created ? "Bloque creado y añadido a la guía" : "Bloque guardado correctamente");
    } else {
      shopify.toast.show(`Error al guardar: ${JSON.stringify(fetcher.data.errors)}`, {
        isError: true,
      });
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading={isNew ? "Añadir bloque" : "Editar bloque"}>
      <s-section heading={`Tipo: ${type}`}>
        <fetcher.Form method="post" encType="multipart/form-data">
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
                <label>
                  <strong>Tabla de tallas</strong>
                </label>
                <TableGridEditor
                  headersFieldName="headers"
                  rowsFieldName="rows"
                  initialHeadersJson={fields.headers}
                  initialRowsJson={fields.rows}
                />
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
              <label>
                <strong>Contenido</strong>
              </label>
              <RichTextEditor fieldName="content" initialContentJson={fields.content} />
            </div>
          )}

          {type === "image" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label>
                  <strong>Imagen</strong>
                </label>
                <br />
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt=""
                    style={{ maxWidth: "200px", display: "block", marginBottom: "0.5rem", borderRadius: "4px" }}
                  />
                )}
                <input id="imageFile" name="imageFile" type="file" accept="image/*" />
                <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>
                  {imagePreviewUrl
                    ? "Elige un archivo aquí solo si quieres reemplazar la imagen actual."
                    : "Elige un archivo para subir la imagen de este bloque."}
                </div>
              </div>
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
            {isSaving ? "Subiendo/Guardando..." : isNew ? "Crear y añadir a la guía" : "Guardar"}
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
