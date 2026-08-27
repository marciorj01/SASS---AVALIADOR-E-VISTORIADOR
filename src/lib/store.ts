import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/* ---------- Tipos ---------- */

export type ViewId = "painel" | "calc" | "fotos" | "vistorias" | "avaliacao" | "cadastro" | "config";
export type InspStatus = "agendada" | "campo" | "concluida";
export type ChecklistCondition = "nao_verificado" | "novo" | "bom" | "regular" | "desgastado" | "danificado" | "inexistente" | "nao_aplicavel";
export type ChecklistSeverity = "info" | "atencao" | "critico";


export interface Inspection {
  id: string;
  code: string;
  client: string;
  address: string;
  city: string;
  type: string;
  status: InspStatus;
  date: string; // ISO (data da vistoria)
  notes: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  condition: ChecklistCondition;
  severity: ChecklistSeverity;
  note: string;
  pending: boolean;
  damageType?: string;
  recommendedAction?: string;
  updatedAt: string;
}

export interface ChecklistRoom {
  id: string;
  name: string;
  items: ChecklistItem[];
  order: number;
}

export interface InspectionChecklist {
  inspectionId: string;
  template: string;
  rooms: ChecklistRoom[];
  updatedAt: string;
}

export type ChecklistDifferenceStatus = "inalterado" | "alterado" | "pendencia_aberta" | "pendencia_resolvida";
export interface ChecklistDifference {
  key: string;
  roomName: string;
  itemName: string;
  entryCondition: ChecklistCondition;
  exitCondition: ChecklistCondition;
  entryPending: boolean;
  exitPending: boolean;
  entryNote: string;
  exitNote: string;
  status: ChecklistDifferenceStatus;
}

export function compareChecklists(entry: InspectionChecklist, exit: InspectionChecklist): ChecklistDifference[] {
  const entryItems = new Map(entry.rooms.flatMap((room) => room.items.map((item) => [`${room.name}::${item.name}`, { room, item }] as const)));
  const exitItems = new Map(exit.rooms.flatMap((room) => room.items.map((item) => [`${room.name}::${item.name}`, { room, item }] as const)));
  const keys = Array.from(new Set([...entryItems.keys(), ...exitItems.keys()]));
  return keys.map((key) => {
    const before = entryItems.get(key);
    const after = exitItems.get(key);
    const entryCondition = before?.item.condition ?? "nao_verificado";
    const exitCondition = after?.item.condition ?? "nao_verificado";
    const entryPending = Boolean(before?.item.pending);
    const exitPending = Boolean(after?.item.pending);
    const status: ChecklistDifferenceStatus = !entryPending && exitPending ? "pendencia_aberta" : entryPending && !exitPending ? "pendencia_resolvida" : entryCondition !== exitCondition || (before?.item.note ?? "") !== (after?.item.note ?? "") ? "alterado" : "inalterado";
    return { key, roomName: after?.room.name ?? before?.room.name ?? "Ambiente", itemName: after?.item.name ?? before?.item.name ?? "Item", entryCondition, exitCondition, entryPending, exitPending, entryNote: before?.item.note ?? "", exitNote: after?.item.note ?? "", status };
  });
}

export interface PhotoNote {
  id: string;
  text: string;
  at: string; // ISO
}

export interface Photo {
  id: string;
  src: string; // dataURL ou caminho
  caption: string;
  category: string;
  inspectionId: string | null;
  roomId?: string | null;
  checklistItemId?: string | null;
  notes: PhotoNote[];
  at: string; // ISO
}

export type InspectionPhase = "entrada" | "saida" | "conferencia";
export type MeterKind = "agua" | "energia" | "gas";
export type KeyStatus = "entregue" | "pendente" | "nao_aplicavel";

export interface FieldReading {
  id: string;
  kind: MeterKind;
  meterNumber: string;
  value: string;
  unit: string;
  note: string;
}

export interface KeyRecord {
  id: string;
  label: string;
  quantity: number;
  status: KeyStatus;
  note: string;
}

export interface InspectionFieldLog {
  inspectionId: string;
  phase: InspectionPhase;
  readings: FieldReading[];
  keys: KeyRecord[];
  notes: string;
  updatedAt: string;
}

export interface Measurement {
  id: string;
  label: string;
  group: string; // terreno | planta | conversao
  detail: string;
  areaM2: number | null;
  inspectionId: string | null;
  at: string;
}

export interface Activity {
  id: string;
  text: string;
  at: string;
  kind: "calc" | "foto" | "vistoria" | "nota";
}

export interface User {
  id: string;
  username: string;
  pass: string; // hash local
  name: string;
}

export interface Session {
  userId: string;
  username: string;
  name: string;
  loginAt: string;
}

export interface Profile {
  name: string;
  title: string;
  registryLabel: string;
  registryNumber: string;
  doc: string;
  phone: string;
  email: string;
  city: string;
}

export interface Client {
  id: string;
  name: string;
  doc: string;
  phone: string;
  addedAt: string;
}

export interface ComparableProperty {
  id: string;
  address: string;
  city: string;
  source: string;
  date: string;
  price: number;
  areaM2: number;
  locationFactor: number;
  conservationFactor: number;
  offerFactor: number;
  notes: string;
}

export interface PropertyAssessment {
  id: string;
  inspectionId: string | null;
  purpose: string;
  propertyType: string;
  address: string;
  city: string;
  areaM2: number;
  bedrooms: number;
  parking: number;
  conservation: string;
  topography: string;
  notes: string;
  comparables: ComparableProperty[];
  updatedAt: string;
  requester?: string;
  owner?: string;
  documentReference?: string;
  registrationOffice?: string;
  inspectionDate?: string;
  referenceDate?: string;
  methodology?: string;
  sourceNotes?: string;
  limitations?: string;
}

/* ---------- Constantes de domínio ---------- */

export const CATEGORIES = [
  "Fachada",
  "Estrutura",
  "Acabamento",
  "Hidráulica",
  "Elétrica",
  "Telhado",
  "Terreno",
  "Documento",
  "Outro",
];

export const INSPECTION_TYPES = [
  "Avaliação mercadológica",
  "Vistoria cautelar",
  "Vistoria de entrega (check-in/out)",
  "Laudo de vizinhança",
  "Avaliação para garantia",
  "Inspeção predial",
];

export const PROFESSIONAL_TITLES = [
  "Avaliador mercadológico",
  "Vistoriador de imóveis",
  "Avaliador e vistoriador",
  "Engenheiro avaliador",
  "Arquiteto avaliador",
  "Perito judicial",
];

export const REGISTRY_LABELS = ["CNAI", "CRECI", "CREA", "CAU", "CONPEJ", "Outro"];

/** Fatores de conversão para m² */
export const AREA_UNITS: { id: string; label: string; short: string; f: number }[] = [
  { id: "m2", label: "Metro quadrado", short: "m²", f: 1 },
  { id: "ha", label: "Hectare", short: "ha", f: 10000 },
  { id: "km2", label: "Quilômetro quadrado", short: "km²", f: 1000000 },
  { id: "acre", label: "Acre", short: "acre", f: 4046.8564224 },
  { id: "ft2", label: "Pé quadrado", short: "ft²", f: 0.09290304 },
  { id: "alqsp", label: "Alqueire paulista", short: "alq. SP", f: 24200 },
  { id: "alqmg", label: "Alqueire mineiro", short: "alq. MG", f: 48400 },
  { id: "tarefa", label: "Tarefa baiana", short: "tarefa", f: 4356 },
];

/* ---------- Utilitários ---------- */

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const parseNum = (s: string): number => {
  const v = parseFloat(String(s).trim().replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
};

export const fmt = (v: number, digits = 2): string =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(v);

export const fmtArea = (v: number): string => `${fmt(v)} m²`;

export const fmtAreaSmart = (v: number): string =>
  v >= 10000 ? `${fmt(v / 10000, 2)} ha` : fmtArea(v);

export const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
};

export const fmtTime = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const nextCode = (inspections: Inspection[]): string => {
  const year = new Date().getFullYear();
  const max = inspections.reduce((acc, i) => {
    const m = /(\d+)$/.exec(i.code);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  return `VIS-${year}-${String(max + 1).padStart(3, "0")}`;
};

export const comparableUnitValue = (comparable: ComparableProperty): number =>
  comparable.areaM2 > 0 && comparable.price > 0 ? comparable.price / comparable.areaM2 : 0;

export const homogenizedUnitValue = (comparable: ComparableProperty): number =>
  comparableUnitValue(comparable) * comparable.locationFactor * comparable.conservationFactor * comparable.offerFactor;

export function summarizeAssessment(assessment: PropertyAssessment) {
  const valid = assessment.comparables.filter((item) => comparableUnitValue(item) > 0);
  const adjustedValues = valid.map(homogenizedUnitValue);
  const averageUnit = adjustedValues.length ? adjustedValues.reduce((sum, value) => sum + value, 0) / adjustedValues.length : 0;
  return {
    validCount: valid.length,
    averageUnit,
    estimatedValue: averageUnit * assessment.areaM2,
    minUnit: adjustedValues.length ? Math.min(...adjustedValues) : 0,
    maxUnit: adjustedValues.length ? Math.max(...adjustedValues) : 0,
    precision: valid.length >= 5 ? "Boa" : valid.length >= 3 ? "Regular" : "Insuficiente",
  } as const;
}

/** Comprime imagem capturada/enviada para caber no armazenamento local */
export const compressImage = (src: string, maxSide = 1400, quality = 0.78): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });

/* ---------- Autenticação local (demonstração, sem backend) ---------- */

/** Hash simples FNV-1a — evita guardar a senha em texto puro no dispositivo. */
export const hashPass = (s: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};

const SESSION_KEY = "prumo.session";

export const readSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && s.userId ? s : null;
  } catch {
    return null;
  }
};

export const writeSession = (s: Session, remember: boolean): void => {
  try {
    const raw = JSON.stringify(s);
    if (remember) {
      localStorage.setItem(SESSION_KEY, raw);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, raw);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* armazenamento indisponível */
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* armazenamento indisponível */
  }
};

/* ---------- Persistência local ---------- */

export function usePersist<T>(key: string, initial: () => T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* dados corrompidos — recomeça com a carga inicial */
    }
    return initial();
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("Prumo: armazenamento local cheio — libere espaço excluindo fotos antigas.", err);
    }
  }, [key, value]);

  return [value, setValue];
}

/* ---------- Carga inicial de demonstração ---------- */

function buildSeed() {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const inspId = "insp-demo-1";

  const inspections: Inspection[] = [
    {
      id: inspId,
      code: `VIS-${new Date().getFullYear()}-001`,
      client: "Carlos Menezes",
      address: "Rua das Palmeiras, 214 — Jd. Bonfiglioli",
      city: "Jundiaí / SP",
      type: "Avaliação mercadológica",
      status: "campo",
      date: todayISO(),
      notes: "Cliente solicita valor de mercado para operação de financiamento. Comparar com 3 amostras do bairro (raio de 500 m).",
    },
    {
      id: "insp-demo-2",
      code: `VIS-${new Date().getFullYear()}-002`,
      client: "Imobiliária Horizonte Ltda.",
      address: "Av. Brasil, 1520 — Galpão 3",
      city: "Campinas / SP",
      type: "Vistoria cautelar",
      status: "agendada",
      date: new Date(now + 3 * 86400000).toISOString().slice(0, 10),
      notes: "Registrar estado das divisas antes da obra do terreno vizinho.",
    },
  ];

  const photos: Photo[] = [
    {
      id: "ph-demo-1",
      src: "https://image.qwenlm.ai/generated-images/5990b29c-8a2c-4f4b-a706-583900fd8041/_result.png",
      caption: "Fachada principal — vista frontal",
      category: "Fachada",
      inspectionId: inspId,
      notes: [
        { id: uid(), text: "Pintura com desgaste acentuado no terço inferior da parede; fotografar de perto antes de concluir.", at: iso(42 * 60000) },
        { id: uid(), text: "Recuo frontal estimado em 4,20 m do alinhamento — conferir na trena a laser.", at: iso(38 * 60000) },
      ],
      at: iso(50 * 60000),
    },
    {
      id: "ph-demo-2",
      src: "https://image.qwenlm.ai/generated-images/62fb7dc3-a51f-44bb-83ba-8153c406071e/_result.png",
      caption: "Fissura diagonal — parede da sala",
      category: "Estrutura",
      inspectionId: inspId,
      notes: [
        { id: uid(), text: "Fissura com abertura < 0,5 mm. Instalar selo de gesso e monitorar por 30 dias antes de classificar.", at: iso(20 * 60000) },
      ],
      at: iso(26 * 60000),
    },
  ];

  const measurements: Measurement[] = [
    {
      id: uid(),
      label: "Terreno retangular 12,00 × 25,00 m",
      group: "terreno",
      detail: "Área 300 m² · Perímetro 74 m · Diagonal 27,73 m",
      areaM2: 300,
      inspectionId: inspId,
      at: iso(65 * 60000),
    },
    {
      id: uid(),
      label: "Planta — 6 cômodos (pé-direito 2,80 m)",
      group: "planta",
      detail: "Área construída 118,40 m² · Paredes 243,90 m² · Taxa de ocupação 39,5%",
      areaM2: 118.4,
      inspectionId: inspId,
      at: iso(33 * 60000),
    },
  ];

  const activity: Activity[] = [
    { id: uid(), text: "Anotação registrada em “Fissura diagonal — parede da sala”", at: iso(20 * 60000), kind: "nota" },
    { id: uid(), text: "Medição de planta salva (118,40 m²) na vistoria VIS-001", at: iso(33 * 60000), kind: "calc" },
    { id: uid(), text: "Foto adicionada: “Fachada principal — vista frontal”", at: iso(50 * 60000), kind: "foto" },
    { id: uid(), text: "Medição de terreno salva (300 m²) na vistoria VIS-001", at: iso(65 * 60000), kind: "calc" },
    { id: uid(), text: "Vistoria em campo iniciada para Carlos Menezes", at: iso(70 * 60000), kind: "vistoria" },
  ];

  const users: User[] = [
    { id: "u-admin", username: "admin", pass: hashPass("admin"), name: "Administrador" },
  ];

  const profile: Profile = {
    name: "",
    title: PROFESSIONAL_TITLES[0],
    registryLabel: "CNAI",
    registryNumber: "",
    doc: "",
    phone: "",
    email: "",
    city: "",
  };

  const clients: Client[] = [
    {
      id: "cl-demo-1",
      name: "Carlos Menezes",
      doc: "CPF 214.556.878-09",
      phone: "(11) 98877-1020",
      addedAt: iso(90 * 60000),
    },
    {
      id: "cl-demo-2",
      name: "Imobiliária Horizonte Ltda.",
      doc: "CNPJ 12.345.678/0001-90",
      phone: "(19) 3232-4455",
      addedAt: iso(3 * 86400000),
    },
  ];

  return { inspections, photos, measurements, activity, users, profile, clients };
}

const SEED = buildSeed();
export const seedInspections = () => SEED.inspections;
export const seedPhotos = () => SEED.photos;
export const seedMeasurements = () => SEED.measurements;
export const seedChecklists = (): InspectionChecklist[] => [];
export const seedFieldLogs = (): InspectionFieldLog[] => [];
export const seedActivity = () => SEED.activity;
export const seedUsers = () => SEED.users;
export const seedProfile = () => SEED.profile;
export const seedClients = () => SEED.clients;
