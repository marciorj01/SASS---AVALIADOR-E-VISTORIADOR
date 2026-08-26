import { useState } from "react";
import { Btn, Field, Reveal, SectionHead, Select, TextInput } from "./ui";
import { IcCheck, IcDoc, IcUser, LogoMark } from "./icons";
import { PROFESSIONAL_TITLES, REGISTRY_LABELS, type Profile } from "../lib/store";

interface CadastroProps {
  profile: Profile;
  onSave: (p: Profile) => void;
}

export default function Cadastro({ profile, onSave }: CadastroProps) {
  const [form, setForm] = useState<Profile>({ ...profile });
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<Profile>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };

  const complete = Boolean(form.name.trim() && form.registryNumber.trim());
  const techName = form.name.trim() || "Nome do avaliador";
  const registry = form.registryNumber.trim()
    ? `${form.registryLabel} ${form.registryNumber}`
    : `${form.registryLabel} —`;

  const submit = () => {
    onSave({ ...form, name: form.name.trim(), registryNumber: form.registryNumber.trim() });
    setSaved(true);
  };

  return (
    <div>
      <SectionHead
        index="05"
        title="Cadastro do avaliador"
        sub="Identificação profissional do avaliador mercadológico / vistoriador. Estes dados assinam os relatórios e os PDFs gerados."
      >
        <span
          className={`chip ${
            complete
              ? "border-mint-400/40 bg-mint-400/10 text-mint-400"
              : "border-accent-400/50 bg-accent-400/10 text-accent-300"
          }`}
        >
          {complete ? <IcCheck width={12} height={12} /> : <IcUser width={12} height={12} />}
          {complete ? "Cadastro completo" : "Cadastro pendente"}
        </span>
      </SectionHead>

      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        {/* ---------- formulário ---------- */}
        <Reveal>
          <div className="panel p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line-soft pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-400/30 bg-brand-400/10 text-brand-300">
                <IcUser width={20} height={20} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-fog-100">
                  Dados profissionais
                </h2>
                <p className="text-xs text-fog-500">Obrigatórios: nome completo e número de registro.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome completo *">
                  <TextInput
                    value={form.name}
                    placeholder="Ex.: Eng.ª Marina Duarte Prado"
                    onChange={(e) => set({ name: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Atuação profissional">
                <Select value={form.title} onChange={(e) => set({ title: e.target.value })}>
                  {PROFESSIONAL_TITLES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-[110px_1fr] gap-3">
                <Field label="Órgão / registro">
                  <Select value={form.registryLabel} onChange={(e) => set({ registryLabel: e.target.value })}>
                    {REGISTRY_LABELS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nº do registro *">
                  <TextInput
                    value={form.registryNumber}
                    placeholder="Ex.: 045.112-F"
                    onChange={(e) => set({ registryNumber: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="CPF / CNPJ">
                <TextInput
                  value={form.doc}
                  placeholder="000.000.000-00"
                  onChange={(e) => set({ doc: e.target.value })}
                />
              </Field>

              <Field label="Telefone / WhatsApp">
                <TextInput
                  value={form.phone}
                  placeholder="(11) 90000-0000"
                  onChange={(e) => set({ phone: e.target.value })}
                />
              </Field>

              <Field label="E-mail profissional">
                <TextInput
                  type="email"
                  value={form.email}
                  placeholder="contato@dominio.com.br"
                  onChange={(e) => set({ email: e.target.value })}
                />
              </Field>

              <Field label="Cidade / UF de atuação">
                <TextInput
                  value={form.city}
                  placeholder="Ex.: Jundiaí / SP"
                  onChange={(e) => set({ city: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
              <p className="text-[12px] text-fog-600">
                {saved ? (
                  <span className="inline-flex items-center gap-1.5 text-mint-400">
                    <IcCheck width={13} height={13} /> Cadastro salvo neste dispositivo.
                  </span>
                ) : (
                  "As alterações valem para os próximos relatórios."
                )}
              </p>
              <div className="flex gap-2">
                <Btn onClick={() => set({ ...profile })}>Descartar</Btn>
                <Btn variant="primary" disabled={!form.name.trim()} onClick={submit}>
                  <IcCheck width={15} height={15} /> Salvar cadastro
                </Btn>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---------- pré-visualização da assinatura ---------- */}
        <Reveal delay={120}>
          <div className="space-y-4">
            <div className="rounded-lg bg-paper-50 p-5 text-[#22304a] shadow-xl">
              <div className="flex items-center gap-2.5 border-b-2 border-[#22304a] pb-3">
                <LogoMark width={24} height={24} className="text-[#22304a]" />
                <p className="font-display text-sm font-bold uppercase tracking-[0.14em]">
                  Prumo <span className="font-normal text-[#6b7a94]">· relatório</span>
                </p>
              </div>
              <p className="num mt-4 text-[9.5px] uppercase tracking-[0.2em] text-[#6b7a94]">
                Pré-visualização · bloco de assinatura
              </p>
              <div className="mt-8">
                <div className="border-t border-[#22304a] pt-2 text-center">
                  <p className="text-sm font-bold">{techName}</p>
                  <p className="text-[11px] text-[#42536f]">{form.title}</p>
                  <p className="num text-[10.5px] text-[#42536f]">{registry}</p>
                  <p className="num mt-0.5 text-[10px] text-[#6b7a94]">
                    {[form.phone, form.city].filter(Boolean).join(" · ") || "contato não informado"}
                  </p>
                </div>
                <p className="num mt-2 text-center text-[9.5px] uppercase tracking-[0.18em] text-[#6b7a94]">
                  Perito / vistoriador responsável
                </p>
              </div>
            </div>

            <div className="panel p-5">
              <div className="flex items-center gap-2.5">
                <span className="text-accent-300"><IcDoc width={17} height={17} /></span>
                <h3 className="font-display text-[15px] font-semibold uppercase tracking-wide text-fog-100">
                  Onde o cadastro aparece
                </h3>
              </div>
              <ul className="mt-3 space-y-2 text-[13px] leading-snug text-fog-500">
                <li className="flex gap-2"><span className="text-brand-400">▸</span> Relatório imprimível de cada vistoria (seção 1 e assinaturas).</li>
                <li className="flex gap-2"><span className="text-brand-400">▸</span> Arquivo PDF exportado pelo botão “Salvar PDF”.</li>
                <li className="flex gap-2"><span className="text-brand-400">▸</span> Identificação do responsável em campo, no painel do sistema.</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
