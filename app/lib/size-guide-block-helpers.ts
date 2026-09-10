/**
 * app/lib/size-guide-block-helpers.ts
 *
 * Tarea 2.15 — helpers compartidos por el editor de guía unificado
 * (app.size-guides.$id.tsx). Extraídos de las rutas antiguas
 * (blocks.tsx / blocks_.$type.$blockId.tsx) para no duplicar la misma
 * lógica una tercera vez dentro de la pantalla unificada. Las rutas
 * antiguas se quedan como están (no se han tocado) hasta que se
 * confirme que nada las enlaza ya.
 */

export const TYPE_TO_METAOBJECT: Record<string, string> = {
  table: "size_guide_block_table",
  text: "size_guide_block_text",
  image: "size_guide_block_image",
  video: "size_guide_block_video",
};

export function typeLabel(type: string): string {
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

export function shortTypeSlug(type: string): string {
  return type.replace("size_guide_block_", "");
}

export function extractPlainTextFromRichText(rawValue: string | undefined): string {
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

export function buildRichTextFromPlainText(plainText: string): string {
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

const STAGED_UPLOADS_CREATE_MUTATION = `#graphql
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }
`;

const FILE_CREATE_MUTATION = `#graphql
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files { id ... on MediaImage { image { url } } }
      userErrors { field message }
    }
  }
`;

/** Sube un archivo de imagen nuevo a Shopify (mismo flujo de 3 pasos ya
 * validado en la Pieza G6 de la 2.10) y devuelve el GID creado. */
export async function uploadImageFile(admin: any, file: File): Promise<{ id: string; url: string | null }> {
  const stagedResponse = await admin.graphql(STAGED_UPLOADS_CREATE_MUTATION, {
    variables: {
      input: [{ filename: file.name, mimeType: file.type || "image/jpeg", httpMethod: "POST", resource: "IMAGE" }],
    },
  });
  const { data: stagedData } = await stagedResponse.json();
  const stagedErrors = stagedData.stagedUploadsCreate.userErrors;
  if (stagedErrors.length > 0) throw new Error(`stagedUploadsCreate: ${JSON.stringify(stagedErrors)}`);
  const target = stagedData.stagedUploadsCreate.stagedTargets[0];

  const uploadForm = new FormData();
  for (const param of target.parameters) uploadForm.append(param.name, param.value);
  uploadForm.append("file", file, file.name);

  const uploadResponse = await fetch(target.url, { method: "POST", body: uploadForm });
  if (!uploadResponse.ok) throw new Error(`Fallo al subir el archivo (status ${uploadResponse.status})`);

  const fileCreateResponse = await admin.graphql(FILE_CREATE_MUTATION, {
    variables: { files: [{ originalSource: target.resourceUrl, contentType: "IMAGE" }] },
  });
  const { data: fileCreateData } = await fileCreateResponse.json();
  const fileCreateErrors = fileCreateData.fileCreate.userErrors;
  if (fileCreateErrors.length > 0) throw new Error(`fileCreate: ${JSON.stringify(fileCreateErrors)}`);
  const createdFile = fileCreateData.fileCreate.files[0];
  return { id: createdFile.id, url: createdFile.image?.url ?? null };
}
