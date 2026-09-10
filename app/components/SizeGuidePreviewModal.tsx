/**
 * app/components/SizeGuidePreviewModal.tsx
 *
 * Botón "Preview" en el editor de guía — pedido por el usuario tras
 * validar 2.16, para poder ver cómo quedará la guía en el storefront
 * ANTES de publicarla/activarla o de asignarla a ningún producto.
 *
 * Decisión (confirmada por el usuario): preview como modal dentro del
 * propio admin, no el previsualizador real del tema — así funciona con
 * la guía en Draft y sin producto asignado. Reconstruye el mismo
 * marcado y CSS que genera
 * extensions/size-guide-block/blocks/size_guide.liquid, a partir de los
 * datos que ya están en pantalla (sin llamada al servidor).
 *
 * Simplificaciones conscientes frente al storefront real (documentadas
 * al usuario, no bugs):
 * - No se aplica el auto-seleccionado de unidad por país del visitante
 *   (tarea 3.6) — aquí siempre se muestra "primary" como la unidad por
 *   defecto marcada en negrita.
 * - El botón de cambio de unidad (estilo guardado en `table_styles`)
 *   no se renderiza como control interactivo porque tampoco existe ese
 *   componente en el storefront real todavía (ver 2.16 parte 2).
 */

import type React from "react";
import { richTextJsonToHtml } from "./RichTextEditor";
import type { BlockFieldsValue } from "./BlockFormFields";

interface PreviewBlock {
  id: string;
  shortType: string;
  fields: BlockFieldsValue;
  imagePreviewUrl: string | null;
}

interface Props {
  guideTitle: string;
  guideDescription: string;
  blocks: PreviewBlock[];
  onClose: () => void;
}

function parseJsonArray(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v ?? "")) : fallback;
  } catch {
    return fallback;
  }
}

function parseJsonMatrix(raw: string | undefined): string[][] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row: any) => (Array.isArray(row) ? row.map((v: any) => String(v ?? "")) : []));
  } catch {
    return [];
  }
}

function parseTableStyles(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function tableCssVars(styles: Record<string, string>): React.CSSProperties {
  return {
    ["--csg-row-even" as any]: styles.rowColorEven || "#ffffff",
    ["--csg-row-odd" as any]: styles.rowColorOdd || "#fafafa",
    ["--csg-border-color" as any]: styles.borderColor || "#e5e5e5",
    ["--csg-border-width" as any]: `${styles.borderWidth || "1"}px`,
    ["--csg-header-color" as any]: styles.headerTextColor || "#1a1a1a",
    ["--csg-header-size" as any]: `${styles.headerFontSize || "13"}px`,
    ["--csg-header-weight" as any]: styles.headerFontWeight || "600",
    ["--csg-cell-color" as any]: styles.cellTextColor || "#1a1a1a",
    ["--csg-cell-size" as any]: `${styles.cellFontSize || "14"}px`,
    ["--csg-footer-color" as any]: styles.footerTextColor || "#6b6b6b",
    ["--csg-footer-size" as any]: `${styles.footerFontSize || "13.6"}px`,
  } as React.CSSProperties;
}

export default function SizeGuidePreviewModal({ guideTitle, guideDescription, blocks, onClose }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{ position: "relative", background: "#fff", maxWidth: "640px", width: "90%", maxHeight: "85vh", overflowY: "auto", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", background: "#1a1a1a", color: "#fff", padding: "1rem 1.5rem", borderRadius: "8px 8px 0 0" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{guideTitle || "(sin título)"}</span>
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Vista previa — Guía de tallas</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "none", border: "none", color: "#fff", fontSize: "1.75rem", lineHeight: 1, cursor: "pointer" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {guideDescription && (
            // `guide.description` ya llega del loader como texto plano
            // (extractPlainTextFromRichText), no como JSON rich_text_field
            // — a diferencia de `content` de los bloques de texto, que sí
            // guarda el JSON completo. Por eso aquí no se usa
            // richTextJsonToHtml.
            <div style={{ background: "#f7f7f5", borderInlineStart: "4px solid #1a1a1a", borderRadius: "6px", padding: "0.85rem 1.1rem", marginBlockEnd: "1.5rem" }}>
              <p style={{ margin: 0 }}>{guideDescription}</p>
            </div>
          )}

          {blocks.map((block) => {
            const f = block.fields;

            if (block.shortType === "table" && f.headers && f.rows && f.hideTable !== "true") {
              const headers = parseJsonArray(f.headers, []);
              const rows = parseJsonMatrix(f.rows);
              const styles = parseTableStyles(f.tableStyles);
              const hasDual = f.hasDualUnitSelector === "true";
              return (
                <div key={block.id} style={{ marginBlockEnd: "1.5rem", ...tableCssVars(styles) }}>
                  <div style={{ borderRadius: "8px", overflow: "hidden", border: "var(--csg-border-width) solid var(--csg-border-color)" } as React.CSSProperties}>
                    <div style={{ background: "#1a1a1a", color: "#fff", padding: "0.75rem 1.25rem", fontWeight: 700 }}>
                      {f.label}
                      {hasDual && f.unitPrimary && f.unitSecondary ? (
                        <>
                          {" "}(<span style={{ fontWeight: 700 }}>{f.unitPrimary}</span> / {f.unitSecondary})
                        </>
                      ) : f.unitPrimary ? (
                        <> ({f.unitPrimary})</>
                      ) : null}
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: "max-content", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {headers.map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  background: "#f2f2f2",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  fontSize: "var(--csg-header-size)",
                                  fontWeight: "var(--csg-header-weight)" as any,
                                  color: "var(--csg-header-color)",
                                  textAlign: "start",
                                  padding: "0.6rem 1.25rem",
                                  borderBlockEnd: "var(--csg-border-width) solid var(--csg-border-color)",
                                } as React.CSSProperties}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--csg-row-even)" : "var(--csg-row-odd)" } as React.CSSProperties}>
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  style={{
                                    padding: "0.6rem 1.25rem",
                                    fontSize: "var(--csg-cell-size)",
                                    color: "var(--csg-cell-color)",
                                    borderBlockEnd: "var(--csg-border-width) solid var(--csg-border-color)",
                                    fontWeight: ci === 0 ? 700 : 400,
                                  } as React.CSSProperties}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {f.footerText && (
                    <p style={{ fontSize: "var(--csg-footer-size)", fontStyle: "italic", color: "var(--csg-footer-color)", marginBlockStart: "5px", marginBlockEnd: 0 } as React.CSSProperties}>
                      {f.footerText}
                    </p>
                  )}
                </div>
              );
            }

            if (block.shortType === "text" && f.content) {
              return (
                <div key={block.id} style={{ marginBlockEnd: "1.5rem", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: richTextJsonToHtml(f.content) }} />
              );
            }

            if (block.shortType === "image" && block.imagePreviewUrl) {
              return (
                <figure key={block.id} style={{ marginBlockEnd: "1.5rem" }}>
                  <img src={block.imagePreviewUrl} alt={f.altText} style={{ maxWidth: "100%", display: "block" }} />
                  {f.caption && <figcaption style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#6b6b6b", marginBlockStart: "0.4rem" }}>{f.caption}</figcaption>}
                </figure>
              );
            }

            if (block.shortType === "video" && f.videoUrl) {
              return (
                <figure key={block.id} style={{ marginBlockEnd: "1.5rem" }}>
                  <video src={f.videoUrl} controls style={{ maxWidth: "100%", display: "block" }} />
                  {f.caption && <figcaption style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#6b6b6b", marginBlockStart: "0.4rem" }}>{f.caption}</figcaption>}
                </figure>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
