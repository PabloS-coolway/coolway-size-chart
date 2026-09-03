/**
 * app/routes/app.size-guides._index.tsx
 *
 * Tarea 2.10 (Pieza A) — Dashboard del panel: listado de guías de tallas.
 *
 * Lee todas las entradas `size_guide` vía Admin GraphQL y las muestra en una
 * lista simple (título, estado, prioridad, Legacy Kiwi ID) con un enlace de
 * edición por fila. El enlace de "Editar" apunta a una ruta que todavía no
 * existe (se construye en la Pieza B) — es intencional, es el siguiente paso
 * ya previsto del desglose de la 2.10, no un enlace roto por descuido.
 *
 * ALCANCE DELIBERADAMENTE ACOTADO (para no disparar el coste de esta pieza):
 * no se muestra qué regla de asignación tiene cada guía — eso requeriría
 * cargar también todas las size_guide_rule y cruzarlas en memoria (como hace
 * el motor de resolución, 2.2), y no aporta valor imprescindible solo para
 * listar. Se puede añadir como mejora posterior si Marketing lo pide.
 *
 * Sin paginación todavía: se cargan hasta 50 guías de una vez. El inventario
 * real de la 0.1 (123 guías repartidas entre 13 tiendas) hace que ninguna
 * tienda individual se acerque a ese límite — aceptable para esta pieza, a
 * revisar si algún día una tienda supera las 50 guías.
 *
 * CORRECCIÓN 1 (primera prueba visual): el estado aparecía pegado al título
 * ("...adultoActiva"). Se usa un separador de texto explícito (" · ") entre
 * campos.
 *
 * CORRECCIÓN 2: el título va en su propia línea; el resto de campos (estado,
 * prioridad, Legacy Kiwi ID, enlace) en una segunda línea debajo, con la
 * etiqueta "Estado:" añadida.
 *
 * CORRECCIÓN 3: la propiedad `fontWeight="bold"` de `<s-text>` no está
 * verificada contra el schema real de Polaris Web Components, y en la
 * práctica no puso el título en negrita. Se usa la etiqueta HTML nativa
 * `<strong>` en su lugar — siempre se renderiza en negrita, sin depender de
 * qué propiedades soporte el componente de Shopify.
 */

import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

interface SizeGuideListItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  legacyKiwiId: string;
}

const SIZE_GUIDES_LIST_QUERY = `#graphql
  query SizeGuidesList {
    metaobjects(type: "size_guide", first: 50) {
      nodes {
        id
        capabilities {
          publishable {
            status
          }
        }
        title: field(key: "title") { value }
        priority: field(key: "priority") { value }
        legacyKiwiId: field(key: "legacy_kiwi_id") { value }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(SIZE_GUIDES_LIST_QUERY);
  const { data } = await response.json();

  const guides: SizeGuideListItem[] = data.metaobjects.nodes.map(
    (node: {
      id: string;
      capabilities?: { publishable?: { status?: string } };
      title?: { value?: string };
      priority?: { value?: string };
      legacyKiwiId?: { value?: string };
    }) => ({
      id: node.id,
      title: node.title?.value || "(sin título)",
      status: node.capabilities?.publishable?.status === "ACTIVE" ? "Activa" : "Borrador",
      priority: node.priority?.value ?? "0",
      legacyKiwiId: node.legacyKiwiId?.value || "—",
    }),
  );

  return { guides };
};

export default function SizeGuidesDashboard() {
  const { guides } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Guías de tallas">
      <s-section heading={`${guides.length} guía${guides.length === 1 ? "" : "s"}`}>
        {guides.length === 0 && (
          <s-paragraph>
            No hay ninguna guía de tallas creada todavía en esta tienda.
          </s-paragraph>
        )}

        <s-stack direction="block" gap="base">
          {guides.map((guide) => (
            <s-box
              key={guide.id}
              padding="base"
              borderWidth="base"
              borderRadius="base"
            >
              <s-paragraph>
                <strong>{guide.title}</strong>
              </s-paragraph>
              <s-paragraph>
                <s-text>
                  Estado: {guide.status} · Prioridad: {guide.priority} · Legacy Kiwi ID: {guide.legacyKiwiId} ·{" "}
                </s-text>
                <s-link href={`/app/size-guides/${encodeURIComponent(guide.id)}`}>
                  Editar
                </s-link>
              </s-paragraph>
            </s-box>
          ))}
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Sobre esta lista">
        <s-paragraph>
          Muestra las guías de tallas creadas en esta tienda (metaobjects
          <s-text fontWeight="bold"> size_guide</s-text>). El editor completo
          (bloques de contenido y regla de asignación) se añade en los
          siguientes pasos de la tarea 2.10.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
