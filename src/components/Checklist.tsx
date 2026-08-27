import { useEffect, useMemo, useState } from "react";
import { todayISO, uid, type ChecklistCondition, type ChecklistRoom, type Inspection, type InspectionChecklist } from "../lib/store";
import { Btn, Select, TextArea, TextInput } from "./ui";
import { IcCheck, IcPlus } from "./icons";

const CONDITIONS: { id: ChecklistCondition; label: string }[] = [
  { id: "nao_verificado", label: "Não verificado" }, { id: "novo", label: "Novo" }, { id: "bom", label: "Bom" },
  { id: "regular", label: "Regular" }, { id: "desgastado", label: "Desgastado" }, { id: "danificado", label: "Danificado" },
  { id: "inexistente", label: "Inexistente" }, { id: "nao_aplicavel", label: "Não se aplica" },
];

const DEFAULT_ROOMS: Record<string, string[]> = {
  comercial: ["Recepção", "Sala principal", "Banheiro", "Copa", "Depósito", "Fachada"],
  "entrega de obra": ["Sala", "Cozinha", "Dormitórios", "Banheiros", "Área de serviço", "Garagem", "Fachada"],
  default: ["Sala", "Cozinha", "Dormitórios", "Banheiros", "Área de serviço", "Varanda", "Garagem", "Fachada"],
};

const DEFAULT_ITEMS = ["Piso", "Paredes e pintura", "Teto", "Portas e fechaduras", "Janelas e esquadrias", "Instalações aparentes"];
const DAMAGE_LIBRARY = [
  { label: "Fissura ou trinca", action: "Registrar extensão, localização e fotografar em detalhe." },
  { label: "Infiltração ou umidade", action: "Registrar origem aparente, extensão e sinais de mofo." },
  { label: "Descascamento ou pintura deteriorada", action: "Registrar área afetada e necessidade de preparo/reparo." },
  { label: "Quebra, lasca ou peça ausente", action: "Registrar componente, quantidade e condição de substituição." },
  { label: "Desgaste de uso", action: "Registrar intensidade e se compromete função ou acabamento." },
  { label: "Empenamento ou desalinhamento", action: "Verificar funcionamento e registrar o sentido da deformação." },
  { label: "Corrosão ou oxidação", action: "Registrar material, extensão e possível comprometimento." },
  { label: "Outro dano", action: "Descrever tecnicamente a constatação e a recomendação." },
];

function makeChecklist(insp: Inspection): InspectionChecklist {
  const key = insp.type.toLowerCase();
  const names = DEFAULT_ROOMS[key] ?? (key.includes("comercial") ? DEFAULT_ROOMS.comercial : key.includes("obra") ? DEFAULT_ROOMS["entrega de obra"] : DEFAULT_ROOMS.default);
  return { inspectionId: insp.id, template: insp.type, rooms: names.map((name, order) => ({ id: uid(), name, order, items: DEFAULT_ITEMS.map((item) => ({ id: uid(), name: item, condition: "nao_verificado", severity: "info", note: "", pending: false, updatedAt: todayISO() })) })), updatedAt: todayISO() };
}

export default function Checklist({ inspection, value, onChange }: { inspection: Inspection; value?: InspectionChecklist; onChange: (next: InspectionChecklist) => void }) {
  const [activeRoom, setActiveRoom] = useState(0);
  const initialChecklist = useMemo(() => value ?? makeChecklist(inspection), [inspection, value]);
  const [checklist, setChecklist] = useState<InspectionChecklist>(initialChecklist);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  useEffect(() => { setChecklist(initialChecklist); setSavedAt(null); }, [initialChecklist]);

  const room = checklist.rooms[activeRoom] ?? checklist.rooms[0];
  const total = checklist.rooms.reduce((sum, r) => sum + r.items.length, 0);
  const verified = checklist.rooms.reduce((sum, r) => sum + r.items.filter((item) => item.condition !== "nao_verificado").length, 0);
  const update = (fn: (rooms: ChecklistRoom[]) => ChecklistRoom[]) => { setChecklist((current) => ({ ...current, rooms: fn(current.rooms), updatedAt: todayISO() })); setSavedAt(null); };
  const updateItem = (itemId: string, patch: Partial<ChecklistRoom["items"][number]>) => update((rooms) => rooms.map((r) => r.id === room.id ? { ...r, items: r.items.map((item) => item.id === itemId ? { ...item, ...patch, updatedAt: todayISO() } : item) } : r));
  const save = () => { onChange({ ...checklist, updatedAt: todayISO() }); setSavedAt(new Date().toLocaleTimeString("pt-BR")); };

  if (!room) return <div className="panel p-5 text-sm text-fog-500">Nenhum ambiente configurado.</div>;
  return <div className="space-y-4">
    <div className="panel blueprint p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">CHECKLIST DE CAMPO</p><h2 className="font-display text-2xl font-semibold uppercase text-fog-100">{checklist.template}</h2><p className="mt-1 text-sm text-fog-500">Registre o estado observável por ambiente e item.</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="num text-2xl font-semibold text-accent-300">{total ? Math.round((verified / total) * 100) : 0}%</p><p className="text-[11px] text-fog-600">{verified} de {total} itens verificados</p></div><Btn variant="primary" onClick={save}>Salvar checklist</Btn></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-accent-400 transition-all" style={{ width: `${total ? (verified / total) * 100 : 0}%` }} /></div>{savedAt && <p className="mt-2 text-xs text-mint-400">Checklist salvo neste dispositivo às {savedAt}.</p>}</div>
    <div className="grid gap-4 lg:grid-cols-[190px_1fr]"><div className="panel h-fit p-3"><p className="lbl px-2 pb-2">Ambientes</p>{checklist.rooms.map((r, index) => <button key={r.id} onClick={() => setActiveRoom(index)} className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${index === activeRoom ? "bg-brand-400/15 text-brand-300" : "text-fog-400 hover:bg-ink-800"}`}><span>{r.name}</span><span className="num text-[10px] text-fog-600">{r.items.filter((i) => i.condition !== "nao_verificado").length}/{r.items.length}</span></button>)}</div>
      <div className="panel p-5"><div className="mb-4 flex items-center justify-between gap-2"><div><p className="eyebrow">AMBIENTE {String(activeRoom + 1).padStart(2, "0")}</p><h3 className="font-display text-2xl font-semibold uppercase text-fog-100">{room.name}</h3></div><Btn onClick={() => update((rooms) => rooms.map((r) => r.id === room.id ? { ...r, items: [...r.items, { id: uid(), name: "Novo item", condition: "nao_verificado", severity: "info", note: "", pending: false, updatedAt: todayISO() }] } : r))}><IcPlus width={14} height={14} /> Item</Btn></div>
        <div className="space-y-3">{room.items.map((item) => <div key={item.id} className="rounded-lg border border-line-soft bg-ink-900/45 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_180px_34px] sm:items-center"><TextInput value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} /><Select value={item.condition} onChange={(e) => updateItem(item.id, { condition: e.target.value as ChecklistCondition, pending: e.target.value === "danificado" || e.target.value === "regular" })}>{CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select><button aria-label={`Marcar pendência em ${item.name}`} onClick={() => updateItem(item.id, { pending: !item.pending, severity: item.pending ? "info" : "atencao" })} className={`rounded-md p-2 ${item.pending ? "text-accent-300" : "text-fog-600"}`}><IcCheck width={16} height={16} /></button></div><TextArea value={item.note} onChange={(e) => updateItem(item.id, { note: e.target.value })} placeholder="Observação, avaria ou pendência..." className="mt-2 min-h-[54px]" />{["regular", "desgastado", "danificado"].includes(item.condition) && <div className="mt-2 grid gap-2 sm:grid-cols-2"><div><span className="lbl">Dicionário de danos</span><Select value={item.damageType ?? ""} onChange={(e) => { const damage = DAMAGE_LIBRARY.find((d) => d.label === e.target.value); updateItem(item.id, { damageType: e.target.value || undefined, recommendedAction: damage?.action ?? item.recommendedAction }); }}><option value="">— Classificar ocorrência —</option>{DAMAGE_LIBRARY.map((damage) => <option key={damage.label} value={damage.label}>{damage.label}</option>)}</Select></div><div><span className="lbl">Ação recomendada</span><TextInput value={item.recommendedAction ?? ""} onChange={(e) => updateItem(item.id, { recommendedAction: e.target.value })} placeholder="Ex.: fotografar e acompanhar" /></div></div>}</div>)}</div>
      </div></div>
  </div>;
}
