import { describe, expect, it } from "vitest";
import {
  fmtAreaSmart,
  hashPass,
  nextCode,
  parseNum,
  summarizeAssessment,
  type ComparableProperty,
  type Inspection,
  writeSession,
  readSession,
  clearSession,
} from "./store";

const makeStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear() { data.clear(); },
    getItem(key) { return data.get(key) ?? null; },
    key(index) { return [...data.keys()][index] ?? null; },
    removeItem(key) { data.delete(key); },
    setItem(key, value) { data.set(key, String(value)); },
  };
};

Object.defineProperty(globalThis, "localStorage", { value: makeStorage(), configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: makeStorage(), configurable: true });

const inspection = (code: string): Inspection => ({
  id: code,
  code,
  client: "Cliente de teste",
  address: "Rua de teste, 1",
  city: "São Paulo / SP",
  type: "Vistoria cautelar",
  status: "agendada",
  date: "2026-08-26",
  notes: "",
});

describe("utilitários do Prumo", () => {
  it("interpreta números com vírgula decimal", () => {
    expect(parseNum(" 12,50 ")).toBe(12.5);
    expect(parseNum("não é número")).toBeNaN();
  });

  it("formata áreas pequenas em m² e grandes em hectares", () => {
    expect(fmtAreaSmart(300)).toContain("300");
    expect(fmtAreaSmart(10000)).toContain("ha");
  });

  it("gera o próximo código sequencial da vistoria", () => {
    const year = new Date().getFullYear();
    expect(nextCode([inspection(`VIS-${year}-001`), inspection(`VIS-${year}-009`)])).toBe(`VIS-${year}-010`);
    expect(nextCode([])).toBe(`VIS-${year}-001`);
  });

  it("calcula a homogeneização e a projeção do valor", () => {
    const comparable: ComparableProperty = {
      id: "c-1", address: "Rua A", city: "São Paulo / SP", source: "Teste", date: "2026-08-26",
      price: 500000, areaM2: 100, locationFactor: 1.1, conservationFactor: 0.95, offerFactor: 0.9, notes: "",
    };
    const summary = summarizeAssessment({
      id: "a-1", inspectionId: null, purpose: "Valor de mercado", propertyType: "Residencial",
      address: "Rua do avaliando", city: "São Paulo / SP", areaM2: 100, bedrooms: 2, parking: 1,
      conservation: "Bom", topography: "Plano", notes: "", comparables: [comparable], updatedAt: "2026-08-26T00:00:00.000Z",
    });
    expect(summary.averageUnit).toBeCloseTo(5000 * 1.1 * 0.95 * 0.9);
    expect(summary.estimatedValue).toBeCloseTo(summary.averageUnit * 100);
    expect(summary.precision).toBe("Insuficiente");
  });

  it("calcula indicadores estatísticos e respeita exclusão manual", () => {
    const makeComparable = (id: string, price: number, excluded = false): ComparableProperty => ({
      id, address: `Rua ${id}`, city: "São Paulo / SP", source: "Teste", date: "2026-08-26",
      price, areaM2: 100, locationFactor: 1, conservationFactor: 1, offerFactor: 1, notes: "", excluded,
    });
    const assessment = {
      id: "a-stats", inspectionId: null, purpose: "Valor de mercado", propertyType: "Residencial",
      address: "Rua do avaliando", city: "São Paulo / SP", areaM2: 100, bedrooms: 2, parking: 1,
      conservation: "Bom", topography: "Plano", notes: "", comparables: [
        makeComparable("c1", 100000), makeComparable("c2", 110000), makeComparable("c3", 120000), makeComparable("c4", 1000000),
      ], updatedAt: "2026-08-26T00:00:00.000Z",
    };
    const summary = summarizeAssessment(assessment);
    expect(summary.medianUnit).toBe(1150);
    expect(summary.outlierIds).toContain("c4");
    expect(summary.coefficientOfVariation).toBeGreaterThan(0);
    const withoutOutlier = summarizeAssessment({ ...assessment, comparables: assessment.comparables.map((item) => item.id === "c4" ? { ...item, excluded: true } : item) });
    expect(withoutOutlier.validCount).toBe(3);
    expect(withoutOutlier.estimatedValue).toBe(110000);
  });

  it("mantém o hash determinístico sem armazenar a senha em texto puro", () => {
    expect(hashPass("admin")).toBe(hashPass("admin"));
    expect(hashPass("admin")).not.toBe(hashPass("outra senha"));
    expect(hashPass("admin")).not.toContain("admin");
  });

  it("grava, lê e limpa sessões persistentes", () => {
    const session = { userId: "u-test", username: "teste", name: "Teste", loginAt: "2026-08-26T00:00:00.000Z" };
    writeSession(session, true);
    expect(readSession()).toEqual(session);
    clearSession();
    expect(readSession()).toBeNull();
  });
});
