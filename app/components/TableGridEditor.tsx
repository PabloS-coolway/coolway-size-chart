/**
 * app/components/TableGridEditor.tsx
 *
 * Tarea 2.12 — Editor de tabla tipo hoja de cálculo (spec:
 * size-guide-admin-panel / "Editor de tabla tipo hoja de cálculo").
 *
 * Sustituye los dos <textarea> JSON (headers/rows) del editor de bloques
 * de tipo tabla por una cuadrícula editable estilo Kiwi: botones "+ Fila"
 * / "+ Columna", menú contextual (clic derecho), navegación por teclado
 * básica (Tab/Shift+Tab/Enter) e importación desde texto pegado
 * (TSV/CSV).
 *
 * IMPORTANTE: el contrato con el backend NO cambia. Este componente solo
 * serializa su estado interno (string[][]) a los mismos campos ocultos
 * `headers` y `rows` (JSON) que ya consume la action de
 * app.size-guides.$id_.blocks_.$type.$blockId.tsx. No se toca el
 * modelo de datos del metaobject.
 */

import type React from "react";
import { useCallback, useRef, useState } from "react";

type ContextMenuState = {
  x: number;
  y: number;
  rowIndex: number; // -1 = fila de cabecera
  colIndex: number;
} | null;

function parseJsonArray(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v ?? ""));
  } catch {
    // ignorar, usar fallback
  }
  return fallback;
}

function parseJsonMatrix(raw: string | undefined, fallback: string[][]): string[][] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((row: any) => (Array.isArray(row) ? row.map((v: any) => String(v ?? "")) : []));
    }
  } catch {
    // ignorar, usar fallback
  }
  return fallback;
}

function parseImportText(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const parsedLines = lines.map((l) => l.split(delimiter).map((c) => c.trim()));
  const width = parsedLines[0].length;
  const consistent = parsedLines.every((l) => l.length === width);
  if (!consistent || width === 0) return null;

  const [headers, ...rows] = parsedLines;
  return { headers, rows };
}

type TableGridEditorProps = {
  headersFieldName: string;
  rowsFieldName: string;
  initialHeadersJson?: string;
  initialRowsJson?: string;
};

const DEFAULT_HEADERS = ["EU", "UK", "US"];
const DEFAULT_ROWS: string[][] = [["", "", ""]];

export default function TableGridEditor({
  headersFieldName,
  rowsFieldName,
  initialHeadersJson,
  initialRowsJson,
}: TableGridEditorProps) {
  const [headers, setHeaders] = useState<string[]>(() =>
    parseJsonArray(initialHeadersJson, DEFAULT_HEADERS),
  );
  const [rows, setRows] = useState<string[][]>(() =>
    parseJsonMatrix(initialRowsJson, DEFAULT_ROWS),
  );
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const clipboardRef = useRef<{ headers: string[]; rows: string[][] } | null>(null);

  const colCount = headers.length;

  const focusCell = useCallback((rowIndex: number, colIndex: number) => {
    // rowIndex -1 = cabecera
    const id = `tge-cell-${rowIndex}-${colIndex}`;
    requestAnimationFrame(() => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      el?.focus();
    });
  }, []);

  const handleHeaderChange = (colIndex: number, value: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[colIndex] = value;
      return next;
    });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setRows((prev) => {
      const next = prev.map((r) => [...r]);
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, new Array(colCount).fill("")]);
  };

  const addColumn = () => {
    setHeaders((prev) => [...prev, ""]);
    setRows((prev) => prev.map((r) => [...r, ""]));
  };

  const deleteRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  const deleteColumn = (colIndex: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== colIndex));
    setRows((prev) => prev.map((r) => r.filter((_, i) => i !== colIndex)));
  };

  const insertRow = (atIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      next.splice(atIndex, 0, new Array(colCount).fill(""));
      return next;
    });
  };

  const insertColumn = (atIndex: number) => {
    setHeaders((prev) => {
      const next = [...prev];
      next.splice(atIndex, 0, "");
      return next;
    });
    setRows((prev) =>
      prev.map((r) => {
        const next = [...r];
        next.splice(atIndex, 0, "");
        return next;
      }),
    );
  };

  const clearCell = (rowIndex: number, colIndex: number) => {
    if (rowIndex === -1) {
      handleHeaderChange(colIndex, "");
    } else {
      handleCellChange(rowIndex, colIndex, "");
    }
  };

  const copyTable = () => {
    clipboardRef.current = { headers: [...headers], rows: rows.map((r) => [...r]) };
  };

  const pasteTable = () => {
    if (clipboardRef.current) {
      setHeaders([...clipboardRef.current.headers]);
      setRows(clipboardRef.current.rows.map((r) => [...r]));
    }
  };

  const openContextMenu = (
    e: React.MouseEvent,
    rowIndex: number,
    colIndex: number,
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, rowIndex, colIndex });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const forward = !e.shiftKey;
      if (forward) {
        if (colIndex + 1 < colCount) {
          focusCell(rowIndex, colIndex + 1);
        } else if (rowIndex + 1 < rows.length) {
          focusCell(rowIndex + 1, 0);
        } else if (rowIndex === -1 && rows.length > 0) {
          focusCell(0, 0);
        }
      } else {
        if (colIndex - 1 >= 0) {
          focusCell(rowIndex, colIndex - 1);
        } else if (rowIndex - 1 >= 0) {
          focusCell(rowIndex - 1, colCount - 1);
        } else if (rowIndex === 0) {
          focusCell(-1, colCount - 1);
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rowIndex === -1) {
        if (rows.length > 0) focusCell(0, colIndex);
      } else if (rowIndex + 1 < rows.length) {
        focusCell(rowIndex + 1, colIndex);
      }
    }
  };

  const handleImportConfirm = () => {
    const parsed = parseImportText(importText);
    if (!parsed) {
      setImportError(
        "No se ha podido interpretar el texto como tabla. Comprueba que todas las filas tengan el mismo número de columnas (separadas por tabulador o coma).",
      );
      return;
    }
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setImportError(null);
    setImportText("");
    setShowImport(false);
  };

  const cellStyle: React.CSSProperties = {
    border: "1px solid #d0d0d0",
    padding: 0,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    minWidth: "60px",
    padding: "0.4rem",
    border: "none",
    outline: "none",
    boxSizing: "border-box",
    background: "transparent",
  };

  return (
    <div onClick={closeContextMenu} style={{ marginBottom: "1rem" }}>
      <input type="hidden" name={headersFieldName} value={JSON.stringify(headers)} />
      <input type="hidden" name={rowsFieldName} value={JSON.stringify(rows)} />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <button type="button" onClick={addRow}>
          + Fila
        </button>
        <button type="button" onClick={addColumn}>
          + Columna
        </button>
        <button type="button" onClick={() => setShowImport((v) => !v)}>
          Importar tabla
        </button>
        <span style={{ fontSize: "0.8rem", color: "#666", alignSelf: "center" }}>
          Clic derecho sobre una celda para más opciones (igual que en Excel)
        </span>
      </div>

      {showImport && (
        <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "#f6f6f7", borderRadius: "6px" }}>
          <div style={{ fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            Pega el contenido (primera línea = cabecera), separado por tabuladores o comas:
          </div>
          <textarea
            rows={4}
            style={{ width: "100%", padding: "0.5rem" }}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          {importError && (
            <div style={{ color: "#d72c0d", fontSize: "0.85rem", marginTop: "0.3rem" }}>{importError}</div>
          )}
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={handleImportConfirm}>
              Confirmar importación
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImport(false);
                setImportError(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {headers.map((h, colIndex) => (
                <th key={colIndex} style={{ ...cellStyle, background: "#f6f6f7" }}>
                  <input
                    id={`tge-cell--1-${colIndex}`}
                    style={{ ...inputStyle, fontWeight: 600 }}
                    value={h}
                    onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, -1, colIndex)}
                    onContextMenu={(e) => openContextMenu(e, -1, colIndex)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} style={cellStyle}>
                    <input
                      id={`tge-cell-${rowIndex}-${colIndex}`}
                      style={inputStyle}
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                      onContextMenu={(e) => openContextMenu(e, rowIndex, colIndex)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contextMenu && (
        <ul
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "white",
            border: "1px solid #d0d0d0",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            listStyle: "none",
            margin: 0,
            padding: "0.25rem 0",
            zIndex: 1000,
            minWidth: "220px",
            fontSize: "0.9rem",
          }}
        >
          <ContextMenuItem
            label="Eliminar fila"
            disabled={contextMenu.rowIndex === -1}
            onClick={() => {
              if (contextMenu.rowIndex !== -1) deleteRow(contextMenu.rowIndex);
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Eliminar columna"
            onClick={() => {
              deleteColumn(contextMenu.colIndex);
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Insertar fila arriba"
            disabled={contextMenu.rowIndex === -1}
            onClick={() => {
              if (contextMenu.rowIndex !== -1) insertRow(contextMenu.rowIndex);
              closeContextMenu();
            }}
          />

          <ContextMenuItem
            label="Insertar fila abajo"
            disabled={contextMenu.rowIndex === -1}
            onClick={() => {
              if (contextMenu.rowIndex !== -1) insertRow(contextMenu.rowIndex + 1);
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Insertar columna a la izquierda"
            onClick={() => {
              insertColumn(contextMenu.colIndex);
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Insertar columna a la derecha"
            onClick={() => {
              insertColumn(contextMenu.colIndex + 1);
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Vaciar valores"
            onClick={() => {
              clearCell(contextMenu.rowIndex, contextMenu.colIndex);
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Copiar tabla"
            onClick={() => {
              copyTable();
              closeContextMenu();
            }}
          />
          <ContextMenuItem
            label="Pegar tabla"
            disabled={!clipboardRef.current}
            onClick={() => {
              pasteTable();
              closeContextMenu();
            }}
          />
        </ul>
      )}
    </div>
  );
}

function ContextMenuItem({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "0.4rem 0.75rem",
          border: "none",
          background: "transparent",
          cursor: disabled ? "default" : "pointer",
          color: disabled ? "#a0a0a0" : "#1a1a1a",
        }}
      >
        {label}
      </button>
    </li>
  );
}
