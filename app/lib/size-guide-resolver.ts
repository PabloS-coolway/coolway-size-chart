/**
 * app/lib/size-guide-resolver.ts
 *
 * Tarea 2.2 — Motor de resolución de reglas de asignación.
 *
 * Dado un producto y el conjunto de entradas `size_guide_rule` + `size_guide`
 * existentes (ya cargadas, ver app/lib/size-guide-data.server.ts para cómo se
 * obtienen desde la Admin API), decide qué guía de tallas le corresponde.
 *
 * Esta función es DELIBERADAMENTE pura (sin llamadas de red, sin `admin.graphql`,
 * sin nada de Shopify): recibe datos ya cargados, y no impone cómo se
 * obtuvieron ni qué se hace con el resultado. Esto la hace fácil de testear
 * (ver size-guide-resolver.test.ts) y reutilizable tanto desde el webhook de
 * producto (2.3) como desde el recálculo masivo por cambio de regla (2.4).
 *
 * DECISIÓN DE ARQUITECTURA (ver tarea 2.1, "Contexto_Proyecto_Kiwi_PROPIO.md"):
 * esta función se invoca desde el backend al recibir un webhook (products/update,
 * products/create, o el recálculo masivo de 2.4) — nunca desde el storefront en
 * tiempo real. El resultado se escribe en el metafield `resolved_size_guide` del
 * producto; la Theme App Extension (Fase 3) solo lee ese metafield.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Campos del producto sobre los que puede evaluarse una condición. */
export type ConditionField =
  | "tag"
  | "collection"
  | "product_type"
  | "vendor"
  | "title";

/**
 * Operadores soportados. "in_collection" es un alias histórico de "equals"
 * para el campo "collection" (así se documentó en la 1.3); se acepta por
 * compatibilidad con entradas ya creadas, pero equivale a "equals".
 */
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "in_collection";

/** Una condición individual dentro del campo `conditions` (JSON) de size_guide_rule. */
export interface RuleCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

/**
 * Una entrada `size_guide_rule` ya cargada y con su `conditions` (JSON)
 * deserializado a un array de RuleCondition.
 */
export interface SizeGuideRule {
  /** GID de la entrada de metaobject size_guide_rule. */
  id: string;
  /** GID de la entrada size_guide que esta regla activa si coincide. */
  sizeGuideId: string;
  rootOperator: "ANY" | "ALL";
  conditions: RuleCondition[];
}

/** Datos mínimos de una guía necesarios para el desempate por prioridad. */
export interface SizeGuideSummary {
  /** GID de la entrada size_guide. */
  id: string;
  priority: number;
}

/** Datos del producto contra los que se evalúan las condiciones. */
export interface ProductMatchContext {
  tags: string[];
  /** GIDs (o handles, según se decida al implementar 2.3) de las colecciones del producto. */
  collectionIds: string[];
  productType?: string;
  vendor?: string;
  title?: string;
}

export type ResolutionResult =
  | { status: "resolved"; sizeGuideId: string; matchedRuleIds: string[] }
  | { status: "no_match" }
  /**
   * Empate total de prioridad entre 2+ guías cuyas reglas coinciden a la vez.
   * Por decisión explícita (ver tarea 2.2), esto NO se resuelve de forma
   * automática — se trata como aviso a revisar manualmente. El llamador
   * (2.3/2.4) decide qué hacer con este resultado (ej. no escribir el
   * metafield y registrar un aviso para el equipo).
   */
  | { status: "tie"; tiedSizeGuideIds: string[]; matchedRuleIds: string[] };

// ---------------------------------------------------------------------------
// Evaluación de una condición individual
// ---------------------------------------------------------------------------

function evaluateCondition(
  condition: RuleCondition,
  product: ProductMatchContext,
): boolean {
  const { field, operator, value } = condition;

  switch (field) {
    case "tag":
      return operator === "not_equals"
        ? !product.tags.includes(value)
        : product.tags.includes(value);

    case "collection":
      // "equals" e "in_collection" son equivalentes para este campo.
      return operator === "not_equals"
        ? !product.collectionIds.includes(value)
        : product.collectionIds.includes(value);

    case "product_type": {
      const actual = product.productType ?? "";
      return operator === "not_equals" ? actual !== value : actual === value;
    }

    case "vendor": {
      const actual = product.vendor ?? "";
      return operator === "not_equals" ? actual !== value : actual === value;
    }

    case "title": {
      const actual = product.title ?? "";
      if (operator === "contains") return actual.includes(value);
      return operator === "not_equals" ? actual !== value : actual === value;
    }

    default:
      // Campo desconocido (dato corrupto o versión futura no soportada aún):
      // nunca coincide, en vez de lanzar una excepción que tumbe todo el
      // recálculo por una sola regla mal formada.
      return false;
  }
}

// ---------------------------------------------------------------------------
// Evaluación de una regla completa (root_operator ANY/ALL)
// ---------------------------------------------------------------------------

function ruleMatches(rule: SizeGuideRule, product: ProductMatchContext): boolean {
  // Una regla sin condiciones nunca coincide (evita que un dato vacío o mal
  // migrado active una guía para todo el catálogo por accidente).
  if (rule.conditions.length === 0) return false;

  return rule.rootOperator === "ANY"
    ? rule.conditions.some((c) => evaluateCondition(c, product))
    : rule.conditions.every((c) => evaluateCondition(c, product));
}

// ---------------------------------------------------------------------------
// Resolución completa
// ---------------------------------------------------------------------------

/**
 * Resuelve qué size_guide corresponde a un producto dado, entre todas las
 * reglas y guías existentes.
 *
 * Reglas de combinación (ver tarea 1.3 y 2.1):
 * - Varias reglas de la MISMA guía se combinan como OR (basta que una coincida).
 * - Si reglas de guías DISTINTAS coinciden a la vez, desempata `size_guide.priority`
 *   (mayor valor = más prioridad).
 * - Si el desempate sigue empatado, se devuelve `status: "tie"` — no se elige
 *   ninguna automáticamente (ver tarea 2.2, decisión explícita del equipo).
 */
export function resolveSizeGuide(
  product: ProductMatchContext,
  rules: SizeGuideRule[],
  guides: SizeGuideSummary[],
): ResolutionResult {
  const matchedRuleIdsByGuide = new Map<string, string[]>();

  for (const rule of rules) {
    if (ruleMatches(rule, product)) {
      const existing = matchedRuleIdsByGuide.get(rule.sizeGuideId) ?? [];
      existing.push(rule.id);
      matchedRuleIdsByGuide.set(rule.sizeGuideId, existing);
    }
  }

  const matchedGuideIds = [...matchedRuleIdsByGuide.keys()];

  if (matchedGuideIds.length === 0) {
    return { status: "no_match" };
  }

  if (matchedGuideIds.length === 1) {
    const sizeGuideId = matchedGuideIds[0]!;
    return {
      status: "resolved",
      sizeGuideId,
      matchedRuleIds: matchedRuleIdsByGuide.get(sizeGuideId)!,
    };
  }

  // Varias guías distintas coinciden a la vez: desempatar por prioridad.
  const priorityById = new Map(guides.map((g) => [g.id, g.priority]));
  let maxPriority = -Infinity;
  for (const id of matchedGuideIds) {
    const priority = priorityById.get(id) ?? 0;
    if (priority > maxPriority) maxPriority = priority;
  }

  const topGuideIds = matchedGuideIds.filter(
    (id) => (priorityById.get(id) ?? 0) === maxPriority,
  );

  if (topGuideIds.length === 1) {
    const sizeGuideId = topGuideIds[0]!;
    return {
      status: "resolved",
      sizeGuideId,
      matchedRuleIds: matchedRuleIdsByGuide.get(sizeGuideId)!,
    };
  }

  // Empate total de prioridad entre 2+ guías — aviso a revisar manualmente.
  return {
    status: "tie",
    tiedSizeGuideIds: topGuideIds,
    matchedRuleIds: topGuideIds.flatMap((id) => matchedRuleIdsByGuide.get(id)!),
  };
}
