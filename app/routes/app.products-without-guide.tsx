/**
 * app/routes/app.products-without-guide.tsx
 *
 * Tarea 2.10 (Pieza E) — Informe "productos sin guía de tallas asignada".
 * Tarea 2.10 (Pieza G4) — paginación con "Cargar siguientes".
 *
 * CORRECCIÓN 2 (a petición de Juanmi): el encabezado mezclaba el conteo de
 * "sin guía" con el de productos revisados, sin mostrar el rango exacto de
 * la página actual dentro del catálogo total. Corregido: el encabezado
 * ahora muestra el rango real ("Productos 1-100 de 728", "Productos
 * 101-200 de 728"...), calculado a partir de cuántos se habían revisado
 * ANTES de esta página (parámetro `scanned` de la URL) más los de esta
 * página. El conteo de "sin guía" se muestra aparte, en una línea propia.
 *
 * ⚠️ PUNTO SIN VERIFICAR: se asume que existe un campo `productsCount` en
 * la raíz de la Admin GraphQL API que devuelve `{ count }` — no confirmado
 * contra el schema real, es la mejor estimación del nombre.
 */

import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
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
    productsCount {
      count
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("after");
  const scannedBefore = parseInt(url.searchParams.get("scanned") ?? "0", 10);
  const withoutGuideBefore = parseInt(url.searchParams.get("withoutGuide") ?? "0", 10);

  const response = await admin.graphql(PRODUCTS_GUIDE_STATUS_QUERY, {
    variables: { cursor },
  });
  const { data } = await response.json();
  const page = data.products;
  const totalCount: number | null = data.productsCount?.count ?? null;

  const withoutGuideThisPage: ProductWithoutGuide[] = [];
  let scannedThisPage = 0;
  for (const node of page.nodes) {
    scannedThisPage += 1;
    if (!node.resolvedSizeGuide) {
      withoutGuideThisPage.push({ id: node.id, title: node.title });
    }
  }

  const rangeStart = scannedBefore + 1;
  const rangeEnd = scannedBefore + scannedThisPage;
  const scannedTotal = rangeEnd;
  const withoutGuideTotal = withoutGuideBefore + withoutGuideThisPage.length;

  return {
    withoutGuideThisPage,
    rangeStart,
    rangeEnd,
    scannedTotal,
    withoutGuideTotal,
    totalCount,
    hasNextPage: page.pageInfo.hasNextPage,
    nextCursor: page.pageInfo.endCursor,
    isFirstPage: !cursor,
  };
};

export default function ProductsWithoutGuide() {
  const {
    withoutGuideThisPage,
    rangeStart,
    rangeEnd,
    scannedTotal,
    withoutGuideTotal,
    totalCount,
    hasNextPage,
    nextCursor,
    isFirstPage,
  } = useLoaderData<typeof loader>();

  const nextHref = `/app/products-without-guide?after=${encodeURIComponent(nextCursor)}&scanned=${scannedTotal}&withoutGuide=${withoutGuideTotal}`;

  return (
    <s-page heading="Productos sin guía de tallas">
      <s-section
        heading={
          totalCount !== null
            ? `Productos ${rangeStart}-${rangeEnd} de ${totalCount}`
            : `Productos ${rangeStart}-${rangeEnd}`
        }
      >
        <s-paragraph>
          <s-text>
            {withoutGuideThisPage.length} sin guía en esta página · {withoutGuideTotal} sin guía en total (acumulado hasta ahora)
          </s-text>
        </s-paragraph>

        {withoutGuideThisPage.length === 0 && (
          <s-paragraph>
            Ninguno de los productos de esta página tiene guía pendiente.
            {hasNextPage ? " Sigue con la siguiente página para revisar el resto." : " Fin del catálogo."}
          </s-paragraph>
        )}

        <s-stack direction="block" gap="base">
          {withoutGuideThisPage.map((product) => (
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

        <div style={{ marginTop: "1.5rem" }}>
          {hasNextPage ? (
            <Link
              to={nextHref}
              style={{
                display: "inline-block",
                padding: "0.4rem 0.9rem",
                borderRadius: "6px",
                border: "1px solid #c9cccf",
                background: "#f6f6f7",
                color: "#1a1a1a",
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              Cargar siguientes 100 productos →
            </Link>
          ) : (
            <s-text>
              Fin del catálogo — {withoutGuideTotal} de {scannedTotal} productos sin guía en total.
            </s-text>
          )}
        </div>
      </s-section>

      <s-section slot="aside" heading="Sobre este informe">
        <s-paragraph>
          Un producto aparece aquí si no tiene ninguna guía de tallas
          resuelta (metafield <s-text>custom.resolved_size_guide</s-text>{" "}
          vacío) — normalmente porque ninguna regla de asignación coincide
          con él todavía. Revisar las reglas en{" "}
          <s-link href="/app/size-guides">Guías de tallas</s-link>.
        </s-paragraph>
        {!isFirstPage && (
          <s-paragraph>
            <s-link href="/app/products-without-guide">Volver al principio</s-link>
          </s-paragraph>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
