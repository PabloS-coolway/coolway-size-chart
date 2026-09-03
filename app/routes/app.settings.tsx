/**
 * app/routes/app.settings.tsx
 *
 * Tarea 2.10 (Pieza F) — Settings mínimo.
 *
 * Solo un placeholder de configuración para la decisión 4 de la 2.9
 * ("auto-selección de unidad por geolocalización del comprador: sí, se
 * necesita"). Esta pieza NO implementa la detección real — eso vive en la
 * Theme App Extension (Fase 3, todavía sin empezar). Aquí solo se guarda
 * la preferencia (activado/desactivado) para que, cuando se construya la
 * Fase 3, ya exista un sitio donde leerla.
 *
 * DECISIÓN DE ALCANCE (para mantener el coste bajo, como esta pieza pedía):
 * se guarda como un metafield SIN una definición formal creada de antemano
 * (a diferencia de resolved_size_guide en la 2.3, que sí tiene su definición
 * en el script de despliegue de la 1.4). Shopify permite escribir un
 * metafield sin definición previa — es menos "formal" (no aparece con nombre
 * bonito en el Admin nativo si alguien lo mira desde fuera de este panel),
 * pero evita tener que ampliar el script de despliegue solo para esto. Se
 * puede añadir una definición formal más adelante (Pieza G o al construir la
 * Fase 3) si hace falta.
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

const GET_SETTINGS_QUERY = `#graphql
  query GetSettings {
    shop {
      id
      autoUnitDetection: metafield(namespace: "custom", key: "auto_unit_detection") {
        value
      }
    }
  }
`;

const SET_SETTING_MUTATION = `#graphql
  mutation SetAutoUnitDetection($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { field message }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(GET_SETTINGS_QUERY);
  const { data } = await response.json();

  return {
    shopId: data.shop.id,
    autoUnitDetection: data.shop.autoUnitDetection?.value === "true",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const shopId = String(formData.get("shopId") ?? "");
  const enabled = formData.get("autoUnitDetection") === "on";

  const response = await admin.graphql(SET_SETTING_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId: shopId,
          namespace: "custom",
          key: "auto_unit_detection",
          type: "boolean",
          value: enabled ? "true" : "false",
        },
      ],
    },
  });
  const { data } = await response.json();
  const userErrors = data.metafieldsSet.userErrors;

  if (userErrors.length > 0) {
    return { ok: false, errors: userErrors };
  }

  return { ok: true, errors: [] };
};

export default function SettingsPage() {
  const { shopId, autoUnitDetection } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isSaving = fetcher.state === "submitting";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show("Configuración guardada correctamente");
    } else {
      shopify.toast.show(`Error al guardar: ${JSON.stringify(fetcher.data.errors)}`, {
        isError: true,
      });
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="Configuración">
      <s-section heading="Unidades de medida">
        <fetcher.Form method="post">
          <input type="hidden" name="shopId" value={shopId} />

          <div style={{ marginBottom: "1rem" }}>
            <label>
              <input
                type="checkbox"
                name="autoUnitDetection"
                defaultChecked={autoUnitDetection}
              />{" "}
              <strong>Detectar automáticamente la unidad (cm/pulgadas) según la ubicación del comprador</strong>
            </label>
            <s-paragraph>
              Esta opción solo guarda la preferencia. La detección real en la
              ficha de producto se implementará en la Fase 3 (Theme App
              Extension) — todavía no tiene ningún efecto visible en la
              tienda.
            </s-paragraph>
          </div>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </fetcher.Form>
      </s-section>

      <s-section slot="aside" heading="Sobre esta pantalla">
        <s-paragraph>
          Corresponde a la decisión 4 de la tarea 2.9 (confirmada por el
          equipo: "sí" hace falta auto-selección de unidad). Placeholder de
          configuración únicamente — sin lógica de detección todavía.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
