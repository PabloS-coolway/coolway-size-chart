/**
 * app/lib/size-guide-resolver.test.ts
 *
 * Tests del motor de resolución (tarea 2.2). Ejecutar con:
 *   npx vitest run
 *
 * (Vitest se añadió como devDependency en esta misma tarea — no existía
 * ningún framework de test en el repo antes de la 2.2).
 */

import { describe, expect, it } from "vitest";
import {
  resolveSizeGuide,
  type ProductMatchContext,
  type SizeGuideRule,
  type SizeGuideSummary,
} from "./size-guide-resolver";

describe("resolveSizeGuide", () => {
  describe("operador ANY", () => {
    // Caso real documentado en la 1.3: guía "Football" — ANY: tag=football
    // O colección=calzado-hombre.
    const rules: SizeGuideRule[] = [
      {
        id: "rule-football",
        sizeGuideId: "guide-football",
        rootOperator: "ANY",
        conditions: [
          { field: "tag", operator: "equals", value: "football" },
          { field: "collection", operator: "equals", value: "calzado-hombre" },
        ],
      },
    ];
    const guides: SizeGuideSummary[] = [{ id: "guide-football", priority: 0 }];

    it("coincide si se cumple solo la primera condición (tag)", () => {
      const product: ProductMatchContext = { tags: ["football"], collectionIds: [] };
      expect(resolveSizeGuide(product, rules, guides)).toEqual({
        status: "resolved",
        sizeGuideId: "guide-football",
        matchedRuleIds: ["rule-football"],
      });
    });

    it("coincide si se cumple solo la segunda condición (colección)", () => {
      const product: ProductMatchContext = { tags: [], collectionIds: ["calzado-hombre"] };
      expect(resolveSizeGuide(product, rules, guides)).toEqual({
        status: "resolved",
        sizeGuideId: "guide-football",
        matchedRuleIds: ["rule-football"],
      });
    });

    it("no coincide si no se cumple ninguna condición", () => {
      const product: ProductMatchContext = { tags: [], collectionIds: ["calzado-mujer"] };
      expect(resolveSizeGuide(product, rules, guides)).toEqual({ status: "no_match" });
    });
  });

  describe("operador ALL", () => {
    const rules: SizeGuideRule[] = [
      {
        id: "rule-invierno",
        sizeGuideId: "guide-invierno",
        rootOperator: "ALL",
        conditions: [
          { field: "tag", operator: "equals", value: "invierno" },
          { field: "collection", operator: "equals", value: "abrigos" },
        ],
      },
    ];
    const guides: SizeGuideSummary[] = [{ id: "guide-invierno", priority: 0 }];

    it("no coincide si falta una de las condiciones", () => {
      const product: ProductMatchContext = { tags: ["invierno"], collectionIds: [] };
      expect(resolveSizeGuide(product, rules, guides)).toEqual({ status: "no_match" });
    });

    it("coincide solo si se cumplen todas las condiciones", () => {
      const product: ProductMatchContext = { tags: ["invierno"], collectionIds: ["abrigos"] };
      expect(resolveSizeGuide(product, rules, guides)).toEqual({
        status: "resolved",
        sizeGuideId: "guide-invierno",
        matchedRuleIds: ["rule-invierno"],
      });
    });
  });

  describe("combinación OR entre varias reglas de la misma guía", () => {
    const rules: SizeGuideRule[] = [
      { id: "rule-a", sizeGuideId: "guide-x", rootOperator: "ANY", conditions: [{ field: "tag", operator: "equals", value: "a" }] },
      { id: "rule-b", sizeGuideId: "guide-x", rootOperator: "ANY", conditions: [{ field: "tag", operator: "equals", value: "b" }] },
    ];
    const guides: SizeGuideSummary[] = [{ id: "guide-x", priority: 0 }];

    it("basta que una de las dos reglas coincida", () => {
      const product: ProductMatchContext = { tags: ["b"], collectionIds: [] };
      expect(resolveSizeGuide(product, rules, guides)).toEqual({
        status: "resolved",
        sizeGuideId: "guide-x",
        matchedRuleIds: ["rule-b"],
      });
    });

    it("si coinciden las dos reglas, se listan ambas en matchedRuleIds", () => {
      const product: ProductMatchContext = { tags: ["a", "b"], collectionIds: [] };
      const result = resolveSizeGuide(product, rules, guides);
      expect(result.status).toBe("resolved");
      if (result.status === "resolved") {
        expect(result.matchedRuleIds.sort()).toEqual(["rule-a", "rule-b"]);
      }
    });
  });

  describe("desempate por prioridad entre guías distintas", () => {
    const rules: SizeGuideRule[] = [
      { id: "r-alto", sizeGuideId: "guide-alto", rootOperator: "ANY", conditions: [{ field: "tag", operator: "equals", value: "mujer" }] },
      { id: "r-bajo", sizeGuideId: "guide-bajo", rootOperator: "ANY", conditions: [{ field: "tag", operator: "equals", value: "mujer" }] },
    ];
    const product: ProductMatchContext = { tags: ["mujer"], collectionIds: [] };

    it("gana la guía de mayor prioridad cuando ambas coinciden", () => {
      const guides: SizeGuideSummary[] = [
        { id: "guide-alto", priority: 10 },
        { id: "guide-bajo", priority: 1 },
      ];
      expect(resolveSizeGuide(product, rules, guides)).toEqual({
        status: "resolved",
        sizeGuideId: "guide-alto",
        matchedRuleIds: ["r-alto"],
      });
    });

    it("devuelve status 'tie' si la prioridad está exactamente igualada (decisión de la 2.2: no se resuelve automáticamente)", () => {
      const guides: SizeGuideSummary[] = [
        { id: "guide-alto", priority: 5 },
        { id: "guide-bajo", priority: 5 },
      ];
      const result = resolveSizeGuide(product, rules, guides);
      expect(result.status).toBe("tie");
      if (result.status === "tie") {
        expect(result.tiedSizeGuideIds.sort()).toEqual(["guide-alto", "guide-bajo"]);
      }
    });
  });

  describe("casos límite y datos corruptos", () => {
    it("ninguna regla existente -> no_match", () => {
      const product: ProductMatchContext = { tags: ["x"], collectionIds: [] };
      expect(resolveSizeGuide(product, [], [])).toEqual({ status: "no_match" });
    });

    it("una regla sin condiciones nunca coincide (evita activar una guía para todo el catálogo por error)", () => {
      const rules: SizeGuideRule[] = [
        { id: "rule-vacia", sizeGuideId: "guide-e", rootOperator: "ANY", conditions: [] },
      ];
      const product: ProductMatchContext = { tags: ["cualquier-cosa"], collectionIds: [] };
      expect(resolveSizeGuide(product, rules, [{ id: "guide-e", priority: 0 }])).toEqual({
        status: "no_match",
      });
    });

    it("producto sin tags ni colecciones -> no_match frente a reglas que exigen tag/colección", () => {
      const rules: SizeGuideRule[] = [
        { id: "rule-tag", sizeGuideId: "guide-tag", rootOperator: "ANY", conditions: [{ field: "tag", operator: "equals", value: "cualquiera" }] },
      ];
      const product: ProductMatchContext = { tags: [], collectionIds: [] };
      expect(resolveSizeGuide(product, rules, [{ id: "guide-tag", priority: 0 }])).toEqual({
        status: "no_match",
      });
    });

    it("operador not_equals en tag se evalúa correctamente", () => {
      const rules: SizeGuideRule[] = [
        { id: "rule-not", sizeGuideId: "guide-not", rootOperator: "ALL", conditions: [{ field: "tag", operator: "not_equals", value: "descatalogado" }] },
      ];
      const guides: SizeGuideSummary[] = [{ id: "guide-not", priority: 0 }];

      expect(
        resolveSizeGuide({ tags: ["descatalogado"], collectionIds: [] }, rules, guides),
      ).toEqual({ status: "no_match" });

      expect(
        resolveSizeGuide({ tags: ["nuevo"], collectionIds: [] }, rules, guides),
      ).toEqual({ status: "resolved", sizeGuideId: "guide-not", matchedRuleIds: ["rule-not"] });
    });

    it("campo desconocido en una condición no lanza excepción, simplemente no coincide", () => {
      const rules: SizeGuideRule[] = [
        {
          id: "rule-raro",
          sizeGuideId: "guide-raro",
          rootOperator: "ANY",
          // @ts-expect-error — simula un dato corrupto/futuro no soportado
          conditions: [{ field: "unknown_field", operator: "equals", value: "x" }],
        },
      ];
      const product: ProductMatchContext = { tags: [], collectionIds: [] };
      expect(() => resolveSizeGuide(product, rules, [{ id: "guide-raro", priority: 0 }])).not.toThrow();
      expect(resolveSizeGuide(product, rules, [{ id: "guide-raro", priority: 0 }])).toEqual({
        status: "no_match",
      });
    });
  });

  describe("operador contains en title", () => {
    it("coincide si el título contiene el valor buscado", () => {
      const rules: SizeGuideRule[] = [
        { id: "rule-title", sizeGuideId: "guide-title", rootOperator: "ANY", conditions: [{ field: "title", operator: "contains", value: "Hoodie" }] },
      ];
      const product: ProductMatchContext = { tags: [], collectionIds: [], title: "Hoodie Roomy SYA" };
      expect(resolveSizeGuide(product, rules, [{ id: "guide-title", priority: 0 }])).toEqual({
        status: "resolved",
        sizeGuideId: "guide-title",
        matchedRuleIds: ["rule-title"],
      });
    });
  });
});
