import { describe, expect, it } from "vitest";
import {
  fmtAreaSmart,
  hashPass,
  nextCode,
  parseNum,
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
