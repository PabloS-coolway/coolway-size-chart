/**
 * app/components/RichTextEditor.tsx
 *
 * Tarea 2.13 — Editor de texto enriquecido (WYSIWYG) para bloques de tipo
 * texto (spec: size-guide-admin-panel / "Editor de texto enriquecido").
 *
 * Sustituye el <textarea> de texto plano del bloque de tipo `text` por un
 * editor `contentEditable` con barra de formato (negrita, cursiva, listas,
 * enlace, quitar formato). Serializa/deserializa fielmente contra el
 * esquema `rich_text_field` nativo de Shopify — ver design.md del change
 * OpenSpec para el detalle del mapeo. El contrato con el backend no
 * cambia: el campo oculto sigue llamándose `content` y llevando el JSON
 * completo, tal como ya lo guarda la action existente.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type RTNode = any;

function textNode(value: string, marks: { bold?: boolean; italic?: boolean } = {}): RTNode {
  return { type: "text", value, ...marks };
}

function isBlockTag(tag: string): boolean {
  return tag === "P" || tag === "DIV" || tag === "UL" || tag === "OL" || tag === "LI";
}

/**
 * Recorre un nodo inline (texto, <b>/<strong>, <i>/<em>, <a>, <span>, ...)
 * y devuelve la lista de nodos `text`/`link` resultantes, arrastrando las
 * marcas bold/italic heredadas del contexto en el que aparece.
 */
function serializeInline(node: ChildNode, marks: { bold?: boolean; italic?: boolean }): RTNode[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = node.textContent ?? "";
    if (value === "") return [];
    return [textNode(value, marks)];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const tag = el.tagName;

  if (tag === "BR") return [textNode("\n")];

  if (tag === "A") {
    const url = el.getAttribute("href") || "";
    const children: RTNode[] = [];
    el.childNodes.forEach((child) => {
      children.push(...serializeInline(child, marks));
    });
    if (children.length === 0) return [];
    return [{ type: "link", url, children }];
  }

  const nextMarks = { ...marks };
  if (tag === "B" || tag === "STRONG") nextMarks.bold = true;
  if (tag === "I" || tag === "EM") nextMarks.italic = true;

  const result: RTNode[] = [];
  el.childNodes.forEach((child) => {
    result.push(...serializeInline(child, nextMarks));
  });
  return result;
}

function serializeListItem(li: HTMLElement): RTNode {
  const inline: RTNode[] = [];
  li.childNodes.forEach((child) => {
    inline.push(...serializeInline(child, {}));
  });
  // IMPORTANTE: los hijos de `list-item` deben ser nodos inline (text/link)
  // directamente — envolverlos en un `paragraph` anidado (como se hacía
  // antes) es rechazado por el validador real de Shopify para
  // rich_text_field ("No subschema in oneOf matched"), confirmado con una
  // llamada directa a metaobjectUpdate contra coolway-sandbox.
  return { type: "list-item", children: inline.length > 0 ? inline : [textNode("")] };
}

function serializeList(el: HTMLElement): RTNode {
  const listType = el.tagName === "OL" ? "ordered" : "unordered";
  const children: RTNode[] = [];
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === "LI") {
      children.push(serializeListItem(child as HTMLElement));
    }
  });
  return { type: "list", listType, children };
}

/**
 * Serializa el HTML editado (root.innerHTML del contentEditable) al JSON
 * del esquema rich_text_field de Shopify. Texto/elementos inline sueltos
 * a nivel raíz (sin envolver en <p>/<div>) se agrupan en un párrafo
 * implícito, porque el esquema exige que los hijos de `root` sean bloques.
 *
 * Recursivo a propósito: `execCommand` (negrita/cursiva/lista/enlace
 * alternados sin salir del párrafo) puede dejar el DOM real con listas
 * anidadas dentro de un `<p>`/`<div>` en vez de como hijos directos del
 * editor — confirmado con un caso real (09-sept-2026, bug de la 2.13:
 * listas guardadas como texto plano porque solo se miraban los hijos de
 * nivel raíz). `collectBlocks` baja recursivamente por cualquier `<p>`/
 * `<div>` que contenga a su vez bloques (listas u otros) para no perder
 * esa estructura, sea cual sea la profundidad de anidado real que genere
 * el navegador.
 */
function collectBlocks(container: HTMLElement | ChildNode): RTNode[] {
  const blocks: RTNode[] = [];
  let buffer: RTNode[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      blocks.push({ type: "paragraph", children: buffer });
      buffer = [];
    }
  };

  const walk = (node: ChildNode) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (tag === "UL" || tag === "OL") {
        flush();
        blocks.push(serializeList(el));
        return;
      }
      if (tag === "P" || tag === "DIV") {
        const hasNestedBlock = Array.from(el.childNodes).some((child) => {
          if (child.nodeType !== Node.ELEMENT_NODE) return false;
          const childTag = (child as HTMLElement).tagName;
          return childTag === "UL" || childTag === "OL" || childTag === "P" || childTag === "DIV";
        });
        if (hasNestedBlock) {
          // Contenedor "roto" (DOM malformado por execCommand): se baja
          // un nivel y se procesan sus hijos como si fueran de nivel
          // raíz, en vez de aplastarlos a texto suelto.
          el.childNodes.forEach((child) => walk(child));
          return;
        }
        flush();
        const inline: RTNode[] = [];
        el.childNodes.forEach((child) => {
          inline.push(...serializeInline(child, {}));
        });
        blocks.push({ type: "paragraph", children: inline.length > 0 ? inline : [textNode("")] });
        return;
      }
    }
    buffer.push(...serializeInline(node, {}));
  };

  container.childNodes.forEach((node) => walk(node));
  flush();

  if (blocks.length === 0) {
    blocks.push({ type: "paragraph", children: [textNode("")] });
  }

  return blocks;
}

function htmlToRichTextJson(root: HTMLElement): string {
  return JSON.stringify({ type: "root", children: collectBlocks(root) });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInlineNode(node: RTNode): string {
  if (!node) return "";
  if (node.type === "text") {
    let html = escapeHtml(String(node.value ?? "")).replace(/\n/g, "<br>");
    if (node.bold) html = `<strong>${html}</strong>`;
    if (node.italic) html = `<em>${html}</em>`;
    return html;
  }
  if (node.type === "link") {
    const url = escapeHtml(String(node.url ?? ""));
    const inner = Array.isArray(node.children) ? node.children.map(renderInlineNode).join("") : "";
    return `<a href="${url}">${inner}</a>`;
  }
  return "";
}

function renderBlockNode(node: RTNode): string {
  if (!node) return "";
  if (node.type === "paragraph") {
    const inner = Array.isArray(node.children) ? node.children.map(renderInlineNode).join("") : "";
    return `<p>${inner || "<br>"}</p>`;
  }
  if (node.type === "list") {
    const tag = node.listType === "ordered" ? "ol" : "ul";
    const items = Array.isArray(node.children)
      ? node.children
          .map((li: RTNode) => {
            // Los hijos de `list-item` son nodos inline (text/link)
            // directamente — ver nota en serializeListItem.
            const inner = Array.isArray(li.children) ? li.children.map(renderInlineNode).join("") : "";
            return `<li>${inner}</li>`;
          })
          .join("")
      : "";
    return `<${tag}>${items}</${tag}>`;
  }
  // list-item's own children son inline; unwrap a HTML plano si aparece
  // suelto (no debería pasar a nivel raíz, solo defensivo).
  if (node.type === "list-item") {
    const inner = Array.isArray(node.children) ? node.children.map(renderInlineNode).join("") : "";
    return inner;
  }
  return "";
}

/** Deserializa el JSON rich_text_field a HTML editable. */
function richTextJsonToHtml(raw: string | undefined): string {
  if (!raw) return "<p><br></p>";
  try {
    const doc = JSON.parse(raw);
    const children = Array.isArray(doc?.children) ? doc.children : [];
    if (children.length === 0) return "<p><br></p>";
    const html = children.map(renderBlockNode).join("");
    return html || "<p><br></p>";
  } catch {
    return "<p><br></p>";
  }
}

type RichTextEditorProps = {
  fieldName: string;
  initialContentJson?: string;
};

type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  unorderedList: boolean;
  orderedList: boolean;
};

const NO_ACTIVE_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  unorderedList: false,
  orderedList: false,
};

export default function RichTextEditor({ fieldName, initialContentJson }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const EMPTY_RICH_TEXT_JSON = '{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","value":""}]}]}';
  const [hiddenValue, setHiddenValue] = useState<string>(() =>
    initialContentJson && initialContentJson.trim() !== "" ? initialContentJson : EMPTY_RICH_TEXT_JSON,
  );
  // Estado "pulsado" de cada botón según el punto donde está el cursor —
  // sin esto es imposible saber si se sigue escribiendo en negrita/
  // cursiva/lista, lo que lleva a mezclar formatos sin querer (causa real
  // de un bug de guardado reportado en la 2.13: listas que acababan
  // anidadas dentro de un párrafo porque no se veía en qué modo se estaba).
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(NO_ACTIVE_FORMATS);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = richTextJsonToHtml(initialContentJson);
      setHiddenValue(htmlToRichTextJson(editorRef.current));
    }
    // Solo al montar: cargar el contenido inicial una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncFromDom = useCallback(() => {
    if (editorRef.current) {
      setHiddenValue(htmlToRichTextJson(editorRef.current));
    }
  }, []);

  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current || document.activeElement !== editorRef.current) {
      setActiveFormats(NO_ACTIVE_FORMATS);
      return;
    }
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      setActiveFormats(NO_ACTIVE_FORMATS);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  const exec = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      syncFromDom();
      updateActiveFormats();
    },
    [syncFromDom, updateActiveFormats],
  );

  const handleLink = useCallback(() => {
    const url = window.prompt("URL del enlace:");
    if (url) exec("createLink", url);
  }, [exec]);

  return (
    <div>
      <input type="hidden" name={fieldName} value={hiddenValue} />
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
        <ToolbarButton label="Negrita" onClick={() => exec("bold")} bold active={activeFormats.bold} />
        <ToolbarButton label="Cursiva" onClick={() => exec("italic")} italic active={activeFormats.italic} />
        <ToolbarButton
          label="• Lista"
          onClick={() => exec("insertUnorderedList")}
          active={activeFormats.unorderedList}
        />
        <ToolbarButton
          label="1. Lista"
          onClick={() => exec("insertOrderedList")}
          active={activeFormats.orderedList}
        />
        <ToolbarButton label="Enlace" onClick={handleLink} />
        <ToolbarButton label="Quitar formato" onClick={() => exec("removeFormat")} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncFromDom}
        onBlur={() => {
          syncFromDom();
          setActiveFormats(NO_ACTIVE_FORMATS);
        }}
        onFocus={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        style={{
          minHeight: "120px",
          border: "1px solid #c9cccf",
          borderRadius: "4px",
          padding: "0.6rem",
          outline: "none",
        }}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  bold,
  italic,
  active,
}: {
  label: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-pressed={active ?? false}
      style={{
        padding: "0.3rem 0.6rem",
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? "italic" : "normal",
        background: active ? "#1a1a1a" : "#fff",
        color: active ? "#fff" : "#1a1a1a",
        border: active ? "1px solid #1a1a1a" : "1px solid #c9cccf",
        borderRadius: "4px",
      }}
    >
      {label}
    </button>
  );
}
