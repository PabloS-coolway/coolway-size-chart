/**
 * app/components/TableStylesEditor.tsx
 *
 * Tarea 2.16 (parte 2) — panel "Estilos de tabla" dentro del panel
 * lateral de edición de un bloque de tipo tabla. Cada bloque de tabla
 * guarda su propio JSON de estilos (por bloque, no global — decisión
 * confirmada por el usuario).
 *
 * Mismo patrón que TableGridEditor: estado interno + un único
 * <input type="hidden"> serializado a JSON, sin cambiar el contrato
 * con la action (`save-block` sigue leyendo un único campo de texto,
 * `tableStyles`, y guardándolo tal cual en el metaobject).
 */

import { useState } from "react";

export interface TableStylesValue {
  rowColorEven: string;
  rowColorOdd: string;
  borderColor: string;
  borderWidth: string;
  headerTextColor: string;
  headerFontSize: string;
  headerFontWeight: string;
  cellTextColor: string;
  cellFontSize: string;
  footerTextColor: string;
  footerFontSize: string;
}

export const DEFAULT_TABLE_STYLES: TableStylesValue = {
  rowColorEven: "#ffffff",
  rowColorOdd: "#f6f6f7",
  borderColor: "#d0d0d0",
  borderWidth: "1",
  headerTextColor: "#1a1a1a",
  headerFontSize: "14",
  headerFontWeight: "600",
  cellTextColor: "#1a1a1a",
  cellFontSize: "14",
  footerTextColor: "#6b6b6b",
  footerFontSize: "12",
};

function parseTableStyles(raw: string | undefined): TableStylesValue {
  if (!raw) return { ...DEFAULT_TABLE_STYLES };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...DEFAULT_TABLE_STYLES, ...parsed };
    }
  } catch {
    // ignorar, usar valores por defecto
  }
  return { ...DEFAULT_TABLE_STYLES };
}

interface Props {
  fieldName: string;
  initialStylesJson?: string;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <label style={{ fontSize: "0.8rem", color: "#4a4a4a" }}>{label}</label>
      {children}
    </div>
  );
}

const colorInputStyle: React.CSSProperties = { width: "100%", height: "2.25rem", padding: "0.1rem", boxSizing: "border-box" };
const numberInputStyle: React.CSSProperties = { width: "100%", padding: "0.4rem", boxSizing: "border-box" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" };

export default function TableStylesEditor({ fieldName, initialStylesJson }: Props) {
  const [styles, setStyles] = useState<TableStylesValue>(() => parseTableStyles(initialStylesJson));

  const set = (key: keyof TableStylesValue) => (value: string) =>
    setStyles((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid #e3e3e3" }}>
      <input type="hidden" name={fieldName} value={JSON.stringify(styles)} />

      <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Estilos de tabla</h3>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Filas y bordes</div>
        <div style={gridStyle}>
          <Field label="Color fila par">
            <input type="color" style={colorInputStyle} value={styles.rowColorEven} onChange={(e) => set("rowColorEven")(e.target.value)} />
          </Field>
          <Field label="Color fila impar">
            <input type="color" style={colorInputStyle} value={styles.rowColorOdd} onChange={(e) => set("rowColorOdd")(e.target.value)} />
          </Field>
          <Field label="Color de borde">
            <input type="color" style={colorInputStyle} value={styles.borderColor} onChange={(e) => set("borderColor")(e.target.value)} />
          </Field>
          <Field label="Grosor de borde (px)">
            <input type="number" min={0} max={10} style={numberInputStyle} value={styles.borderWidth} onChange={(e) => set("borderWidth")(e.target.value)} />
          </Field>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Texto de cabecera</div>
        <div style={gridStyle}>
          <Field label="Color">
            <input type="color" style={colorInputStyle} value={styles.headerTextColor} onChange={(e) => set("headerTextColor")(e.target.value)} />
          </Field>
          <Field label="Tamaño (px)">
            <input type="number" min={8} max={32} style={numberInputStyle} value={styles.headerFontSize} onChange={(e) => set("headerFontSize")(e.target.value)} />
          </Field>
          <Field label="Peso">
            <select style={numberInputStyle} value={styles.headerFontWeight} onChange={(e) => set("headerFontWeight")(e.target.value)}>
              <option value="400">Normal</option>
              <option value="600">Seminegrita</option>
              <option value="700">Negrita</option>
            </select>
          </Field>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Texto de celda</div>
        <div style={gridStyle}>
          <Field label="Color">
            <input type="color" style={colorInputStyle} value={styles.cellTextColor} onChange={(e) => set("cellTextColor")(e.target.value)} />
          </Field>
          <Field label="Tamaño (px)">
            <input type="number" min={8} max={32} style={numberInputStyle} value={styles.cellFontSize} onChange={(e) => set("cellFontSize")(e.target.value)} />
          </Field>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Texto de pie (footer)</div>
        <div style={gridStyle}>
          <Field label="Color">
            <input type="color" style={colorInputStyle} value={styles.footerTextColor} onChange={(e) => set("footerTextColor")(e.target.value)} />
          </Field>
          <Field label="Tamaño (px)">
            <input type="number" min={8} max={32} style={numberInputStyle} value={styles.footerFontSize} onChange={(e) => set("footerFontSize")(e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}
