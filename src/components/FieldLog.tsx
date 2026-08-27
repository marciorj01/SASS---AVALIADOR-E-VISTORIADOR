import { useEffect, useMemo, useState } from "react";
import { todayISO, uid, type FieldReading, type InspectionFieldLog, type InspectionPhase, type KeyRecord, type MeterKind } from "../lib/store";
import { Btn, Field, Select, TextArea, TextInput } from "./ui";
import { IcPlus, IcTrash } from "./icons";

const PHASES: { id: InspectionPhase; label: string; description: string }[] = [
  { id: "entrada", label: "Vistoria de entrada", description: "Registre o estado inicial, leituras e chaves recebidas." },
  { id: "saida", label: "Vistoria de saída", description: "Registre a devolução e o estado final do imóvel." },
  { id: "conferencia", label: "Conferência", description: "Compare ou confirme pendências antes da entrega do relatório." },
];

const METER_LABELS: Record<MeterKind, string> = { agua: "Água", energia: "Energia", gas: "Gás" };
const KEY_STATUSES: { id: KeyRecord["status"]; label: string }[] = [
  { id: "entregue", label: "Entregue" },
  { id: "pendente", label: "Pendente" },
  { id: "nao_aplicavel", label: "Não se aplica" },
];

function emptyLog(inspectionId: string): InspectionFieldLog {
  return { inspectionId, phase: "entrada", readings: [], keys: [], notes: "", updatedAt: todayISO() };
}

export default function FieldLog({ inspectionId, value, onChange }: { inspectionId: string; value?: InspectionFieldLog; onChange: (next: InspectionFieldLog) => void }) {
  const initialLog = useMemo(() => value ?? emptyLog(inspectionId), [inspectionId, value]);
  const [log, setLog] = useState<InspectionFieldLog>(initialLog);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  useEffect(() => { setLog(initialLog); setSavedAt(null); }, [initialLog]);
  const phase = PHASES.find((item) => item.id === log.phase) ?? PHASES[0];
  const update = (patch: Partial<InspectionFieldLog>) => { setLog((current) => ({ ...current, ...patch, updatedAt: todayISO() })); setSavedAt(null); };
  const updateReading = (id: string, patch: Partial<FieldReading>) => update({ readings: log.readings.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const updateKey = (id: string, patch: Partial<KeyRecord>) => update({ keys: log.keys.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const addReading = () => update({ readings: [...log.readings, { id: uid(), kind: "agua", meterNumber: "", value: "", unit: "m³", note: "" }] });
  const addKey = () => update({ keys: [...log.keys, { id: uid(), label: "Chave", quantity: 1, status: "entregue", note: "" }] });
  const save = () => { onChange({ ...log, updatedAt: todayISO() }); setSavedAt(new Date().toLocaleTimeString("pt-BR")); };

  return (
    <div className="space-y-4">
      <div className="panel blueprint p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="eyebrow">DADOS DE CAMPO</p><h2 className="font-display text-2xl font-semibold uppercase text-fog-100">{phase.label}</h2><p className="mt-1 text-sm text-fog-500">{phase.description}</p></div>
          <Select value={log.phase} onChange={(e) => update({ phase: e.target.value as InspectionPhase })}>{PHASES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
        </div>
      </div>

      <div className="panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">LEITURAS DE CONSUMO</p><h3 className="font-display text-xl font-semibold uppercase text-fog-100">Medidores</h3></div><div className="flex items-center gap-2"><Btn onClick={addReading}><IcPlus width={14} height={14} /> Leitura</Btn><Btn variant="primary" onClick={save}>Salvar leituras</Btn></div></div>
        {log.readings.length === 0 ? <p className="text-sm text-fog-500">Nenhuma leitura registrada nesta fase.</p> : <div className="space-y-3">{log.readings.map((reading) => <div key={reading.id} className="rounded-lg border border-line-soft bg-ink-900/45 p-3"><div className="grid gap-2 sm:grid-cols-[130px_1fr_130px_34px] sm:items-end"><Field label="Tipo"><Select value={reading.kind} onChange={(e) => updateReading(reading.id, { kind: e.target.value as MeterKind, unit: e.target.value === "energia" ? "kWh" : e.target.value === "gas" ? "m³" : "m³" })}>{Object.entries(METER_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select></Field><Field label="Número do medidor"><TextInput value={reading.meterNumber} onChange={(e) => updateReading(reading.id, { meterNumber: e.target.value })} placeholder="Ex.: 0048217" /></Field><Field label={`Leitura (${reading.unit})`}><TextInput value={reading.value} onChange={(e) => updateReading(reading.id, { value: e.target.value })} placeholder="Ex.: 128,40" /></Field><button aria-label="Remover leitura" onClick={() => update({ readings: log.readings.filter((item) => item.id !== reading.id) })} className="rounded-md p-2 text-fog-600 hover:text-danger-400"><IcTrash width={15} height={15} /></button></div><TextInput value={reading.note} onChange={(e) => updateReading(reading.id, { note: e.target.value })} placeholder="Observação da leitura, lacre ou acesso ao medidor" className="mt-2" /></div>)}</div>}
      </div>

      <div className="panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">CONTROLE DE ACESSO</p><h3 className="font-display text-xl font-semibold uppercase text-fog-100">Chaves e controles</h3></div><div className="flex items-center gap-2"><Btn onClick={addKey}><IcPlus width={14} height={14} /> Chave</Btn><Btn variant="primary" onClick={save}>Salvar chaves</Btn></div></div>
        {log.keys.length === 0 ? <p className="text-sm text-fog-500">Nenhuma chave ou controle registrado nesta fase.</p> : <div className="space-y-3">{log.keys.map((key) => <div key={key.id} className="grid gap-2 rounded-lg border border-line-soft bg-ink-900/45 p-3 sm:grid-cols-[1fr_90px_150px_1fr_34px] sm:items-end"><Field label="Descrição"><TextInput value={key.label} onChange={(e) => updateKey(key.id, { label: e.target.value })} placeholder="Ex.: porta principal" /></Field><Field label="Qtd."><TextInput type="number" min="0" value={key.quantity} onChange={(e) => updateKey(key.id, { quantity: Math.max(0, Number(e.target.value) || 0) })} /></Field><Field label="Situação"><Select value={key.status} onChange={(e) => updateKey(key.id, { status: e.target.value as KeyRecord["status"] })}>{KEY_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></Field><Field label="Observação"><TextInput value={key.note} onChange={(e) => updateKey(key.id, { note: e.target.value })} placeholder="Ex.: controle sem pilha" /></Field><button aria-label="Remover chave" onClick={() => update({ keys: log.keys.filter((item) => item.id !== key.id) })} className="rounded-md p-2 text-fog-600 hover:text-danger-400"><IcTrash width={15} height={15} /></button></div>)}</div>}
      </div>

      <div className="panel p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="eyebrow mb-0">OBSERVAÇÕES DA FASE</p><Btn variant="primary" onClick={save}>Salvar observações</Btn></div><TextArea value={log.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Registre condições gerais, pendências de entrega ou informações importantes da conferência..." className="mt-2 min-h-[100px]" />{savedAt && <p className="mt-2 text-xs text-mint-400">Salvo neste dispositivo às {savedAt}.</p>}</div>
    </div>
  );
}
