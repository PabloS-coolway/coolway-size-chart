/**
 * app/routes/app.products-without-guide.tsx
 *
 * Tarea 2.10 (Pieza E) — Informe "productos sin guía de tallas asignada"
 * (decisión 6 de la 2.9: "sí, replicarlo" — equivalente a "View products
 * without size charts" de Kiwi).
 *
 * Recorre TODO el catálogo de la tienda (paginado, igual que
 * fetchAllProductContexts de la 2.4) y comprueba, para cada producto, si
 * tiene valor en el metafield custom.resolved_size_guide (escrito por el
 * motor de resolución, 2.2/2.3/2.4). Si no lo tiene, aparece en este informe.
 *
 * Deliberadamente NO reutiliza fetchAllProductContexts (que trae tags,
 * colecciones, tipo, vendor — todo lo necesario para RESOLVER una guía) ni
 * llama al motor de resolución: aquí solo hace falta comprobar si el
 * metafield YA está poblado o no, una consulta mucho más ligera.
 *
 * Sin caché ni botón de "recalcular" en esta pieza — es un informe de
 * lectura, no dispara ningún recálculo. Si un producto lleva aquí por error
 * (por ejemplo, porque no coincide con ninguna regla todavía), la forma de
 * "arreglarlo" es crear o ajustar una regla (2.2/1.3), no algo que se haga
 * desde este informe.
 */

import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

interface ProductWithoutGuide {
  id: string;
  title: string;
}

const PRODUCTS_GUIDE_STATUS_QUERY = `#graphql
  query ProductsGuideStatus($cursor: String) {
    products(first: 100, after: $cursor) {
      nodes {
        id
        title
        resolvedSizeGuide: metafield(namespace: "custom", key: "resolved_size_guide") {
          id
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const withoutGuide: ProductWithoutGuide[] = [];
  let totalProducts = 0;
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(PRODUCTS_GUIDE_STATUS_QUERY, {
      variables: { cursor },
    });
    const { data } = await response.json();
    const page = data.products;

    for (const node of page.nodes) {
      totalProducts += 1;
      if (!node.resolvedSizeGuide) {
        withoutGuide.push({ id: node.id, title: node.title });
      }
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return { withoutGuide, totalProducts };
};

export default function ProductsWithoutGuide() {
  const { withoutGuide, totalProducts } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Productos sin guía de tallas">
      <s-section
        heading={`${withoutGuide.length} de ${totalProducts} productos sin guía asignada`}
      >
        {withoutGuide.length === 0 && (
          <s-paragraph>
            Todos los productos de esta tienda tienen una guía de tallas
            resuelta. Nada que revisar.
          </s-paragraph>
        )}

        <s-stack direction="block" gap="base">
          {withoutGuide.map((product) => (
            <s-box
              key={product.id}
              padding="base"
              borderWidth="base"
              borderRadius="base"
            >
              <s-paragraph>
                <strong>{product.title}</strong>
              </s-paragraph>
            </s-box>
          ))}
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Sobre este informe">
        <s-paragraph>
          Un producto aparece aquí si no tiene ninguna guía de tallas
          resuelta (metafield <s-text>custom.resolved_size_guide</s-text>{" "}
          vacío) — normalmente porque ninguna regla de asignación coincide
          con él todavía. Revisar las reglas en{" "}
          <s-link href="/app/size-guides">Guías de tallas</s-link>.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
