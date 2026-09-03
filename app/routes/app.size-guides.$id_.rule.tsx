/**
 * app/routes/app.size-guides.$id.rule.tsx
 *
 * Tarea 2.10 (Pieza D) — Editor de la regla de asignación de una guía
 * (root_operator ANY/ALL + condiciones). Ruta anidada bajo la guía:
 * /app/size-guides/:id/rule
 *
 * DECISIONES DE ALCANCE (para no disparar el coste de esta pieza):
 * 1. Solo gestiona UNA regla por guía en esta primera versión. El modelo de
 *    datos (1.3) permite varias reglas por guía combinadas como OR, pero la
 *    guía de prueba real solo tiene 1 — cubre el caso actual. Gestionar
 *    varias reglas por guía (añadir/quitar reglas completas) queda como
 *    mejora futura explícita, no un descuido.
 * 2. Hasta 5 condiciones FIJAS por regla (no una lista dinámica con
 *    "añadir fila" en JavaScript) — las filas vacías se ignoran al guardar.
 *    Mantiene el formulario en HTML nativo puro, sin estado de cliente.
 *
 * ⚠️ PUNTOS SIN VERIFICAR:
 * - Se asume que `metaobjectCreate`/`metaobjectUpdate` para ENTRADAS
 *   (a diferencia de metaobjectDefinitionCreate/Update para DEFINICIONES,
 *   ya usados y confirmados en el script de la 1.4) siguen el mismo patrón
 *   de nombres. Es la mejor estimación, con bastante confianza por ser los
 *   nombres estándar de la Admin API, pero no probada hasta este momento.
 * - Se asume (por analogía con la Pieza B, ya confirmada) que actualizar una
 *   entrada existente con `fields: [...]` es un PATCH parcial, no un
 *   reemplazo — así que actualizar root_operator/conditions no debería
 *   borrar `legacy_kiwi_id` de la regla si lo tuviera.
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
import type { RuleCondition } from "../lib/size-guide-resolver";

const MAX_CONDITIONS = 5;

interface RuleDetail {
  ruleId: string | null; // null = todavía no existe ninguna regla para esta guía
  rootOperator: "ANY" | "ALL";
  conditions: RuleCondition[];
}

const GET_RULE_FOR_GUIDE_QUERY = `#graphql
  query GetRuleForGuide($cursor: String) {
    metaobjects(type: "size_guide_rule", first: 100, after: $cursor) {
      nodes {
        id
        sizeGuide: field(key: "size_guide") {
          reference {
            ... on Metaobject { id }
          }
        }
        rootOperator: field(key: "root_operator") { value }
        conditions: field(key: "conditions") { value }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const CREATE_RULE_MUTATION = `#graphql
  mutation CreateSizeGuideRule($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

const UPDATE_RULE_MUTATION = `#graphql
  mutation UpdateSizeGuideRule($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);

  // Busca, entre TODAS las reglas, la primera que referencia a esta guía.
  // (No hay forma de filtrar por campo de referencia directamente en la
  // consulta de metaobjects, así que se recorre igual que hace el motor de
  // resolución en la 2.2 — volumen bajo, aceptable.)
  let existingRule: RuleDetail = { ruleId: null, rootOperator: "ANY", conditions: [] };
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage && !existingRule.ruleId) {
    const response = await admin.graphql(GET_RULE_FOR_GUIDE_QUERY, { variables: { cursor } });
    const { data } = await response.json();
    const page = data.metaobjects;

    for (const node of page.nodes) {
      if (node.sizeGuide?.reference?.id === guideId) {
        let conditions: RuleCondition[] = [];
        try {
          conditions = JSON.parse(node.conditions?.value ?? "[]");
        } catch {
          conditions = [];
        }
        existingRule = {
          ruleId: node.id,
          rootOperator: node.rootOperator?.value === "ALL" ? "ALL" : "ANY",
          conditions,
        };
        break;
      }
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return { guideId, rule: existingRule };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const guideId = decodeURIComponent(params.id!);
  const formData = await request.formData();

  const existingRuleId = String(formData.get("ruleId") ?? "") || null;
  const rootOperator = formData.get("rootOperator") === "ALL" ? "ALL" : "ANY";

  const conditions: RuleCondition[] = [];
  for (let i = 1; i <= MAX_CONDITIONS; i++) {
    const field = String(formData.get(`field${i}`) ?? "");
    const operator = String(formData.get(`operator${i}`) ?? "equals");
    const value = String(formData.get(`value${i}`) ?? "");
    if (field && value) {
      conditions.push({ field: field as RuleCondition["field"], operator: operator as RuleCondition["operator"], value });
    }
  }

  const fields = [
    { key: "root_operator", value: rootOperator },
    { key: "conditions", value: JSON.stringify(conditions) },
  ];

  if (existingRuleId) {
    const response = await admin.graphql(UPDATE_RULE_MUTATION, {
      variables: { id: existingRuleId, metaobject: { fields } },
    });
    const { data } = await response.json();
    const userErrors = data.metaobjectUpdate.userErrors;
    if (userErrors.length > 0) return { ok: false, errors: userErrors };
    return { ok: true, errors: [] };
  }

  // No existía ninguna regla para esta guía todavía — crear una nueva.
  const response = await admin.graphql(CREATE_RULE_MUTATION, {
    variables: {
      metaobject: {
        type: "size_guide_rule",
        fields: [...fields, { key: "size_guide", value: guideId }],
      },
    },
  });
  const { data } = await response.json();
  const userErrors = data.metaobjectCreate.userErrors;
  if (userErrors.length > 0) return { ok: false, errors: userErrors };
  return { ok: true, errors: [] };
};

const FIELD_OPTIONS = ["tag", "collection", "product_type", "vendor", "title"];
const OPERATOR_OPTIONS = ["equals", "not_equals", "contains"];

export default function SizeGuideRuleEditor() {
  const { guideId, rule } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isSaving = fetcher.state === "submitting";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) {
      shopify.toast.show("Regla guardada correctamente");
    } else {
      shopify.toast.show(`Error al guardar: ${JSON.stringify(fetcher.data.errors)}`, {
        isError: true,
      });
    }
  }, [fetcher.data, shopify]);

  // Rellena las 5 filas con las condiciones existentes (si las hay), el resto vacías.
  const rows = Array.from({ length: MAX_CONDITIONS }, (_, i) => rule.conditions[i] ?? null);

  return (
    <s-page heading="Editar regla de asignación">
      <s-section heading={rule.ruleId ? "Regla existente" : "Crear regla nueva"}>
        {!rule.ruleId && (
          <s-paragraph>
            Esta guía todavía no tiene ninguna regla de asignación — al
            guardar se creará una nueva.
          </s-paragraph>
        )}

        <fetcher.Form method="post">
          <input type="hidden" name="ruleId" value={rule.ruleId ?? ""} />

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="rootOperator">
              <strong>Operador raíz</strong>
            </label>
            <br />
            <select
              id="rootOperator"
              name="rootOperator"
              defaultValue={rule.rootOperator}
              style={{ padding: "0.5rem" }}
            >
              <option value="ANY">ANY (basta con que se cumpla una condición)</option>
              <option value="ALL">ALL (deben cumplirse todas)</option>
            </select>
          </div>

          <strong>Condiciones (hasta {MAX_CONDITIONS})</strong>
          {rows.map((condition, index) => {
            const n = index + 1;
            return (
              <div
                key={n}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                  alignItems: "center",
                }}
              >
                <select name={`field${n}`} defaultValue={condition?.field ?? ""} style={{ padding: "0.4rem" }}>
                  <option value="">(vacío)</option>
                  {FIELD_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <select name={`operator${n}`} defaultValue={condition?.operator ?? "equals"} style={{ padding: "0.4rem" }}>
                  {OPERATOR_OPTIONS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                <input
                  name={`value${n}`}
                  type="text"
                  defaultValue={condition?.value ?? ""}
                  placeholder="valor"
                  style={{ padding: "0.4rem", flex: 1 }}
                />
              </div>
            );
          })}

          <div style={{ marginTop: "1rem" }}>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar regla"}
            </button>
          </div>
        </fetcher.Form>
      </s-section>

      <s-section slot="aside" heading="Sobre este editor">
        <s-paragraph>
          Gestiona una única regla por guía en esta versión. Si en el futuro
          hace falta combinar varias reglas para la misma guía (como OR entre
          ellas, ver tarea 2.2), esta pantalla necesitará ampliarse.
        </s-paragraph>
        <s-paragraph>
          <s-link href={`/app/size-guides/${encodeURIComponent(guideId)}`}>
            Volver a la guía
          </s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
