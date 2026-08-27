import { useMemo, useState } from "react";
import { fmt, fmtArea, homogenizedUnitValue, comparableUnitValue, parseNum, summarizeAssessment, uid, type ComparableProperty, type Inspection, type PropertyAssessment } from "../lib/store";
import { Btn, Field, SectionHead, Select, TextArea, TextInput } from "./ui";
import { IcCalc, IcCheck, IcClip, IcPlus, IcTrash } from "./icons";

type Props = {
  assessments: PropertyAssessment[];
  inspections: Inspection[];
  profile: import("../lib/store").Profile;
  onSave: (assessment: PropertyAssessment) => void;
  onDelete: (id: string) => void;
  toast: (text: string) => void;
};

type ComparableDraft = Omit<ComparableProperty, "id">;

const emptyComparable: ComparableDraft = {
  address: "",
  city: "",
  source: "",
  date: new Date().toISOString().slice(0, 10),
  price: 0,
  areaM2: 0,
  locationFactor: 1,
  conservationFactor: 1,
  offerFactor: 0.9,
  notes: "",
};

const emptyAssessment = (): PropertyAssessment => ({
  id: uid(),
  inspectionId: null,
  purpose: "Valor de mercado",
  propertyType: "Residencial",
  address: "",
  city: "",
  areaM2: 0,
  bedrooms: 0,
  parking: 0,
  conservation: "Normal",
  topography: "Plano",
  notes: "",
  comparables: [],
  updatedAt: new Date().toISOString(),
  requester: "",
  owner: "",
  documentReference: "",
  registrationOffice: "",
  inspectionDate: new Date().toISOString().slice(0, 10),
  referenceDate: new Date().toISOString().slice(0, 10),
  methodology: "Método comparativo direto de dados de mercado",
  sourceNotes: "",
  limitations: "",

});

const money = (value: number) => `R$ ${fmt(value, 2)}`;

export default function Evaluation({ assessments, inspections, profile, onSave, onDelete, toast }: Props) {
  const [current, setCurrent] = useState<PropertyAssessment>(() => assessments[0] ?? emptyAssessment());
  const [draft, setDraft] = useState<ComparableDraft>(emptyComparable);

  const rows = useMemo(
    () => current.comparables
      .filter((c) => comparableUnitValue(c) > 0)
      .map((c) => ({ ...c, unitValue: comparableUnitValue(c), adjustedUnitValue: homogenizedUnitValue(c) })),
    [current.comparables]
  );
  const summary = summarizeAssessment(current);
  const { averageUnit, estimatedValue, minUnit, maxUnit, precision } = summary;

  const update = <K extends keyof PropertyAssessment>(key: K, value: PropertyAssessment[K]) => {
    setCurrent((prev) => ({ ...prev, [key]: value }));
  };

  const addComparable = () => {
    if (!draft.address.trim() || draft.areaM2 <= 0 || draft.price <= 0) {
      toast("Informe endereço, área e preço válidos para a amostra.");
      return;
    }
    setCurrent((prev) => ({ ...prev, comparables: [...prev.comparables, { ...draft, id: uid() }] }));
    setDraft(emptyComparable);
    toast("Amostra comparável adicionada.");
  };

  const exportPdf = () => {
    void import("../lib/pdf").then(({ generateEvaluationPdf }) => {
      generateEvaluationPdf({ assessment: current, profile, inspection: inspections.find((item) => item.id === current.inspectionId) });
      toast("Minuta da avaliação exportada em PDF.");
    }).catch(() => toast("Não foi possível gerar o PDF da avaliação."));
  };

  const save = () => {
    if (!current.address.trim() || current.areaM2 <= 0) {
      toast("Preencha o endereço e a área do imóvel avaliando.");
      return;
    }
    onSave({ ...current, updatedAt: new Date().toISOString() });
    toast("Avaliação mercadológica salva no dispositivo.");
  };

  return (
    <div>
      <SectionHead index="03" title="Avaliação mercadológica" sub="Método comparativo direto de dados de mercado com homogeneização por fatores ajustáveis.">
        <div className="flex flex-wrap gap-2"><Btn onClick={exportPdf} disabled={!current.address.trim()}><IcClip width={15} height={15} /> Exportar minuta</Btn><Btn variant="primary" onClick={() => setCurrent(emptyAssessment())}><IcPlus width={15} height={15} /> Nova avaliação</Btn></div>
      </SectionHead>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-4">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><p className="eyebrow">01 / IMÓVEL AVALIANDO</p><h2 className="font-display text-2xl font-semibold uppercase text-fog-100">Ficha técnica</h2></div>
              <IcClip className="text-brand-400" width={22} height={22} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Finalidade"><Select value={current.purpose} onChange={(e) => update("purpose", e.target.value)}><option>Valor de mercado</option><option>Garantia</option><option>Financiamento</option><option>Inventário / partilha</option><option>Judicial</option></Select></Field>
              <Field label="Tipo de imóvel"><Select value={current.propertyType} onChange={(e) => update("propertyType", e.target.value)}><option>Residencial</option><option>Comercial</option><option>Terreno</option><option>Rural</option><option>Industrial</option></Select></Field>
              <Field label="Endereço do imóvel avaliando *"><TextInput value={current.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, complemento" /></Field>
              <Field label="Município / UF"><TextInput value={current.city} onChange={(e) => update("city", e.target.value)} placeholder="Cidade / UF" /></Field>
              <Field label="Área privativa / terreno (m²) *"><TextInput type="number" min="0" step="0.01" value={current.areaM2 || ""} onChange={(e) => update("areaM2", parseNum(e.target.value))} /></Field>
              <Field label="Dormitórios"><TextInput type="number" min="0" step="1" value={current.bedrooms || ""} onChange={(e) => update("bedrooms", Number(e.target.value) || 0)} /></Field>
              <Field label="Vagas"><TextInput type="number" min="0" step="1" value={current.parking || ""} onChange={(e) => update("parking", Number(e.target.value) || 0)} /></Field>
              <Field label="Estado de conservação"><Select value={current.conservation} onChange={(e) => update("conservation", e.target.value)}><option>Excelente</option><option>Bom</option><option>Normal</option><option>Regular</option><option>Reparos importantes</option></Select></Field>
              <Field label="Topografia"><Select value={current.topography} onChange={(e) => update("topography", e.target.value)}><option>Plano</option><option>Aclive</option><option>Declive</option><option>Irregular</option></Select></Field>
              <Field label="Vistoria vinculada"><Select value={current.inspectionId ?? ""} onChange={(e) => update("inspectionId", e.target.value || null)}><option value="">Sem vínculo</option>{inspections.map((i) => <option key={i.id} value={i.id}>{i.code} · {i.client}</option>)}</Select></Field>
            </div>
            <div className="mt-3"><Field label="Premissas e observações"><TextArea value={current.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Padrão construtivo, benfeitorias, restrições, fontes consultadas e demais premissas..." /></Field></div>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="mb-5"><p className="eyebrow">02 / IDENTIFICAÇÃO E DOCUMENTAÇÃO</p><h2 className="font-display text-2xl font-semibold uppercase text-fog-100">Partes e referências</h2><p className="mt-1 text-xs text-fog-500">Registre quem solicitou o trabalho, a titularidade informada e os documentos consultados.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Solicitante / contratante"><TextInput value={current.requester ?? ""} onChange={(e) => update("requester", e.target.value)} placeholder="Nome ou razão social" /></Field>
              <Field label="Proprietário / interessado"><TextInput value={current.owner ?? ""} onChange={(e) => update("owner", e.target.value)} placeholder="Nome do proprietário ou interessado" /></Field>
              <Field label="Matrícula / inscrição / referência"><TextInput value={current.documentReference ?? ""} onChange={(e) => update("documentReference", e.target.value)} placeholder="Número ou referência do documento" /></Field>
              <Field label="Cartório / órgão / fonte documental"><TextInput value={current.registrationOffice ?? ""} onChange={(e) => update("registrationOffice", e.target.value)} placeholder="Cartório, prefeitura ou outra fonte" /></Field>
              <Field label="Data da vistoria"><TextInput type="date" value={current.inspectionDate ?? ""} onChange={(e) => update("inspectionDate", e.target.value)} /></Field>
              <Field label="Data de referência do valor"><TextInput type="date" value={current.referenceDate ?? ""} onChange={(e) => update("referenceDate", e.target.value)} /></Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Metodologia"><Select value={current.methodology ?? "Método comparativo direto de dados de mercado"} onChange={(e) => update("methodology", e.target.value)}><option>Método comparativo direto de dados de mercado</option><option>Método evolutivo</option><option>Método involutivo</option><option>Método da renda</option><option>Metodologia definida pelo profissional</option></Select></Field><Field label="Descrição da metodologia"><TextArea value={current.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Critérios de seleção, homogeneização e tratamento dos dados..." /></Field></div>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="mb-5"><p className="eyebrow">03 / METODOLOGIA E AMOSTRAGEM</p><h2 className="font-display text-2xl font-semibold uppercase text-fog-100">Adicionar comparável</h2><p className="mt-1 text-xs text-fog-500">Use fatores relativos: 1,00 mantém o preço unitário; 0,90 reduz 10%; 1,10 aumenta 10%.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Endereço / identificação *"><TextInput value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} placeholder="Imóvel ofertado ou vendido" /></Field>
              <Field label="Cidade / UF"><TextInput value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} placeholder="Cidade / UF" /></Field>
              <Field label="Fonte do dado"><TextInput value={draft.source} onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))} placeholder="Portal, corretor, matrícula, visita..." /></Field>
              <Field label="Data da coleta"><TextInput type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} /></Field>
              <Field label="Preço (R$) *"><TextInput type="number" min="0" step="0.01" value={draft.price || ""} onChange={(e) => setDraft((d) => ({ ...d, price: parseNum(e.target.value) }))} /></Field>
              <Field label="Área (m²) *"><TextInput type="number" min="0" step="0.01" value={draft.areaM2 || ""} onChange={(e) => setDraft((d) => ({ ...d, areaM2: parseNum(e.target.value) }))} /></Field>
              <Field label="Fator localização"><TextInput type="number" min="0" step="0.01" value={draft.locationFactor} onChange={(e) => setDraft((d) => ({ ...d, locationFactor: parseNum(e.target.value) || 0 }))} /></Field>
              <Field label="Fator conservação"><TextInput type="number" min="0" step="0.01" value={draft.conservationFactor} onChange={(e) => setDraft((d) => ({ ...d, conservationFactor: parseNum(e.target.value) || 0 }))} /></Field>
              <Field label="Fator oferta / negociação"><TextInput type="number" min="0" step="0.01" value={draft.offerFactor} onChange={(e) => setDraft((d) => ({ ...d, offerFactor: parseNum(e.target.value) || 0 }))} /></Field>
              <Field label="Nota da amostra"><TextInput value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Fonte, condição, semelhanças..." /></Field>
            </div>
            <Btn className="mt-4" variant="primary" onClick={addComparable}><IcPlus width={15} height={15} /> Adicionar amostra</Btn>
          </section>
        </div>

        <div className="space-y-4">
          <section className="panel blueprint p-5 sm:p-6">
            <p className="eyebrow">03 / PROJEÇÃO DE VALOR</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
              <div className="rounded-md border border-brand-400/30 bg-brand-400/10 p-3 sm:col-span-2 xl:col-span-2"><p className="text-[11px] uppercase tracking-wider text-fog-500">Valor indicativo</p><p className="num mt-1 text-2xl font-semibold text-brand-300">{money(estimatedValue)}</p><p className="mt-1 text-xs text-fog-500">{rows.length} comparável(is) · {fmtArea(current.areaM2 || 0)}</p></div>
              <div className="rounded-md border border-line-soft bg-ink-900/50 p-3"><p className="text-[11px] uppercase tracking-wider text-fog-500">Preço unitário médio</p><p className="num mt-1 text-lg font-semibold text-fog-100">{money(averageUnit)} / m²</p></div>
              <div className="rounded-md border border-line-soft bg-ink-900/50 p-3"><p className="text-[11px] uppercase tracking-wider text-fog-500">Precisão preliminar</p><p className={`mt-1 text-lg font-semibold ${precision === "Boa" ? "text-mint-400" : precision === "Regular" ? "text-accent-300" : "text-danger-400"}`}>{precision}</p></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="border-t border-line-soft pt-2"><span className="text-fog-500">Faixa unitária inferior</span><strong className="num block text-fog-200">{money(minUnit)} / m²</strong></div><div className="border-t border-line-soft pt-2"><span className="text-fog-500">Faixa unitária superior</span><strong className="num block text-fog-200">{money(maxUnit)} / m²</strong></div></div>
            <p className="mt-4 border-t border-line-soft pt-3 text-[11px] leading-relaxed text-fog-600">Estimativa preliminar por média aritmética dos valores unitários homogeneizados. A suficiência da amostra, a fundamentação e a precisão devem ser revisadas pelo profissional responsável conforme a finalidade e os dados disponíveis.</p>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="eyebrow">04 / DADOS HOMOGENEIZADOS</p><h2 className="font-display text-2xl font-semibold uppercase text-fog-100">Comparáveis ({current.comparables.length})</h2></div><IcCalc className="text-brand-400" width={22} height={22} /></div>
            {current.comparables.length === 0 ? <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-fog-500">Cadastre pelo menos três amostras para uma análise mais consistente.</p> : <div className="space-y-2">{current.comparables.map((c) => { const row = rows.find((r) => r.id === c.id); return <div key={c.id} className="rounded-md border border-line-soft bg-ink-900/50 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-fog-100">{c.address}</p><p className="mt-0.5 text-xs text-fog-600">{c.source || "Fonte não informada"} · {fmtArea(c.areaM2)} · {money(c.price)}</p></div><button className="text-fog-600 hover:text-danger-400" aria-label="Excluir comparável" onClick={() => setCurrent((prev) => ({ ...prev, comparables: prev.comparables.filter((item) => item.id !== c.id) }))}><IcTrash width={15} height={15} /></button></div><div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><span className="text-fog-500">R$/m² <strong className="num block text-fog-200">{money(row?.unitValue ?? 0)}</strong></span><span className="text-fog-500">Homog. <strong className="num block text-brand-300">{money(row?.adjustedUnitValue ?? 0)}</strong></span><span className="text-fog-500">Fatores <strong className="num block text-fog-200">{c.locationFactor.toFixed(2)} × {c.conservationFactor.toFixed(2)} × {c.offerFactor.toFixed(2)}</strong></span><span className="text-fog-500">Data <strong className="num block text-fog-200">{c.date || "—"}</strong></span></div></div>; })}</div>}
          </section>

          <div className="flex flex-wrap justify-end gap-2"><Btn onClick={() => { if (current.id && assessments.some((a) => a.id === current.id)) onDelete(current.id); setCurrent(emptyAssessment()); toast("Avaliação removida."); }} disabled={!assessments.some((a) => a.id === current.id)}><IcTrash width={15} height={15} /> Excluir ficha</Btn><Btn variant="primary" onClick={save}><IcCheck width={15} height={15} /> Salvar avaliação</Btn></div>
        </div>
      </div>
    </div>
  );
}
