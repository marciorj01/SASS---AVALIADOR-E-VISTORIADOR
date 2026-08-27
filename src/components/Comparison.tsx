import { useMemo, useState } from "react";
import { compareChecklists, type Inspection, type InspectionChecklist } from "../lib/store";
import { Select } from "./ui";

const conditionLabel = (value: string) => value === "nao_verificado" ? "Não verificado" : value === "nao_aplicavel" ? "Não se aplica" : value.charAt(0).toUpperCase() + value.slice(1);
const statusMeta = {
  inalterado: { label: "Inalterado", className: "border-line text-fog-500" },
  alterado: { label: "Alterado", className: "border-accent-400/40 text-accent-300" },
  pendencia_aberta: { label: "Pendência aberta", className: "border-danger-400/40 text-danger-300" },
  pendencia_resolvida: { label: "Pendência resolvida", className: "border-mint-400/40 text-mint-300" },
} as const;

export default function Comparison({ inspections, checklists, selectedId }: { inspections: Inspection[]; checklists: InspectionChecklist[]; selectedId: string }) {
  const available = inspections.filter((item) => item.id !== selectedId && checklists.some((checklist) => checklist.inspectionId === item.id));
  const [otherId, setOtherId] = useState(available[0]?.id ?? "");
  const selected = inspections.find((item) => item.id === selectedId);
  const other = inspections.find((item) => item.id === otherId);
  const selectedChecklist = checklists.find((item) => item.inspectionId === selectedId);
  const otherChecklist = checklists.find((item) => item.inspectionId === otherId);
  const differences = useMemo(() => selectedChecklist && otherChecklist ? compareChecklists(otherChecklist, selectedChecklist) : [], [otherChecklist, selectedChecklist]);
  const counts = { alterado: differences.filter((item) => item.status === "alterado").length, abertas: differences.filter((item) => item.status === "pendencia_aberta").length, resolvidas: differences.filter((item) => item.status === "pendencia_resolvida").length, iguais: differences.filter((item) => item.status === "inalterado").length };

  return <div className="space-y-4">
    <div className="panel blueprint p-5"><p className="eyebrow">COMPARAÇÃO DE VISTORIAS</p><h2 className="font-display text-2xl font-semibold uppercase text-fog-100">Entrada × saída</h2><p className="mt-1 text-sm text-fog-500">Compare os itens do checklist por ambiente e identifique o que mudou.</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div><span className="lbl">Vistoria de referência</span><div className="rounded-md border border-line-soft bg-ink-900/60 px-3 py-2 text-sm text-fog-200">{other ? `${other.code} · ${other.client}` : "Nenhuma selecionada"}</div></div><div><span className="lbl">Vistoria atual</span><div className="rounded-md border border-line-soft bg-ink-900/60 px-3 py-2 text-sm text-fog-200">{selected ? `${selected.code} · ${selected.client}` : "Nenhuma selecionada"}</div></div></div>{available.length > 0 && <div className="mt-3"><span className="lbl">Trocar vistoria de referência</span><Select value={otherId} onChange={(e) => setOtherId(e.target.value)}>{available.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.client}</option>)}</Select></div>}</div>
    {!selectedChecklist || !otherChecklist ? <div className="panel p-5 text-sm text-fog-500">As duas vistorias precisam ter um checklist salvo para iniciar a comparação.</div> : <><div className="grid gap-3 sm:grid-cols-4"><div className="panel p-4"><p className="eyebrow">ALTERADOS</p><p className="num mt-1 text-2xl font-semibold text-accent-300">{counts.alterado}</p></div><div className="panel p-4"><p className="eyebrow">ABERTAS</p><p className="num mt-1 text-2xl font-semibold text-danger-300">{counts.abertas}</p></div><div className="panel p-4"><p className="eyebrow">RESOLVIDAS</p><p className="num mt-1 text-2xl font-semibold text-mint-300">{counts.resolvidas}</p></div><div className="panel p-4"><p className="eyebrow">IGUAIS</p><p className="num mt-1 text-2xl font-semibold text-fog-400">{counts.iguais}</p></div></div><div className="panel overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-ink-800/70 text-[10px] uppercase tracking-wider text-fog-500"><tr><th className="px-4 py-3">Ambiente</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Referência</th><th className="px-4 py-3">Atual</th><th className="px-4 py-3">Resultado</th></tr></thead><tbody>{differences.map((item) => { const meta = statusMeta[item.status]; return <tr key={item.key} className={`border-t border-line-soft ${item.status === "inalterado" ? "opacity-60" : ""}`}><td className="px-4 py-3 font-semibold text-fog-200">{item.roomName}</td><td className="px-4 py-3 text-fog-300">{item.itemName}<div className="mt-1 text-xs text-fog-600">{item.entryNote || item.exitNote || ""}</div></td><td className="px-4 py-3 text-fog-400">{conditionLabel(item.entryCondition)}{item.entryPending && <span className="ml-1 text-danger-300">· pendente</span>}</td><td className="px-4 py-3 text-fog-400">{conditionLabel(item.exitCondition)}{item.exitPending && <span className="ml-1 text-danger-300">· pendente</span>}</td><td className="px-4 py-3"><span className={`chip ${meta.className}`}>{meta.label}</span></td></tr>; })}</tbody></table></div></div></>}
  </div>;
}
