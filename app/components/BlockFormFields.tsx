/**
 * app/components/BlockFormFields.tsx
 *
 * Tarea 2.15 — campos de formulario por tipo de bloque (tabla/texto/
 * imagen/vídeo), extraídos de app.size-guides.$id_.blocks_.$type.$blockId.tsx
 * para reutilizarlos inline dentro del editor de guía unificado. Misma
 * estructura de campos y mismos nombres de <input> que la ruta antigua —
 * el contrato con la action (save-block) no cambia.
 */

import TableGridEditor from "./TableGridEditor";
import RichTextEditor from "./RichTextEditor";
import TableStylesEditor from "./TableStylesEditor";

export interface BlockFieldsValue {
  label: string;
  headers: string;
  rows: string;
  unitPrimary: string;
  unitSecondary: string;
  hasDualUnitSelector: string;
  footerText: string;
  hideTable: string;
  tableStyles: string;
  content: string;
  altText: string;
  caption: string;
  videoUrl: string;
}

export const EMPTY_BLOCK_FIELDS: BlockFieldsValue = {
  label: "",
  headers: "",
  rows: "",
  unitPrimary: "",
  unitSecondary: "",
  hasDualUnitSelector: "false",
  footerText: "",
  hideTable: "false",
  tableStyles: "",
  content: "",
  altText: "",
  caption: "",
  videoUrl: "",
};

interface Props {
  type: string;
  fields: BlockFieldsValue;
  imagePreviewUrl: string | null;
}

export default function BlockFormFields({ type, fields, imagePreviewUrl }: Props) {
  return (
    <div style={{ paddingRight: "1.5rem" }}>
      {type === "table" && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="label"><strong>Label</strong></label>
            <br />
            <input id="label" name="label" type="text" defaultValue={fields.label} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label><strong>Tabla de tallas</strong></label>
            <TableGridEditor
              headersFieldName="headers"
              rowsFieldName="rows"
              initialHeadersJson={fields.headers}
              initialRowsJson={fields.rows}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="unitPrimary"><strong>Unit primary</strong></label>
            <br />
            <input id="unitPrimary" name="unitPrimary" type="text" defaultValue={fields.unitPrimary} style={{ padding: "0.5rem" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="unitSecondary"><strong>Unit secondary</strong></label>
            <br />
            <input id="unitSecondary" name="unitSecondary" type="text" defaultValue={fields.unitSecondary} style={{ padding: "0.5rem" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              <input type="checkbox" name="hasDualUnitSelector" defaultChecked={fields.hasDualUnitSelector === "true"} />{" "}
              <strong>Has dual unit selector</strong>
            </label>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="footerText"><strong>Footer text</strong></label>
            <br />
            <textarea id="footerText" name="footerText" defaultValue={fields.footerText} rows={2} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              <input type="checkbox" name="hideTable" defaultChecked={fields.hideTable === "true"} />{" "}
              <strong>Hide table</strong>
            </label>
          </div>
          <TableStylesEditor fieldName="tableStyles" initialStylesJson={fields.tableStyles} />
        </>
      )}

      {type === "text" && (
        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Contenido</strong></label>
          <RichTextEditor fieldName="content" initialContentJson={fields.content} />
        </div>
      )}

      {type === "image" && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label><strong>Imagen</strong></label>
            <br />
            {imagePreviewUrl && (
              <img src={imagePreviewUrl} alt="" style={{ maxWidth: "200px", display: "block", marginBottom: "0.5rem", borderRadius: "4px" }} />
            )}
            <input id="imageFile" name="imageFile" type="file" accept="image/*" />
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>
              {imagePreviewUrl ? "Elige un archivo aquí solo si quieres reemplazar la imagen actual." : "Elige un archivo para subir la imagen de este bloque."}
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="altText"><strong>Alt text</strong></label>
            <br />
            <input id="altText" name="altText" type="text" defaultValue={fields.altText} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="caption"><strong>Caption</strong></label>
            <br />
            <input id="caption" name="caption" type="text" defaultValue={fields.caption} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
        </>
      )}

      {type === "video" && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="videoUrl"><strong>Video URL</strong></label>
            <br />
            <input id="videoUrl" name="videoUrl" type="text" defaultValue={fields.videoUrl} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="caption"><strong>Caption</strong></label>
            <br />
            <input id="caption" name="caption" type="text" defaultValue={fields.caption} style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }} />
          </div>
        </>
      )}
    </div>
  );
}
