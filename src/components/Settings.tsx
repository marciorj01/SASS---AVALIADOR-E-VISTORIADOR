import { useMemo, useState, type FormEvent } from "react";
import { Btn, Field, Reveal, SectionHead, Select, TextInput } from "./ui";
import {
  IcAlert,
  IcCheck,
  IcCog,
  IcDownload,
  IcInstall,
  IcLock,
  IcLogout,
  IcTrash,
  IcUser,
  IcUsers,
  IcWifi,
  IcWifiOff,
} from "./icons";
import {
  fmtDate,
  timeAgo,
  uid,
  type Activity,
  type Client,
  type ComparisonColumn,
  type ComparableProperty,
  type Inspection,
  type InspectionChecklist,
  type InspectionFieldLog,
  type Measurement,
  type Photo,
  type Profile,
  type PropertyAssessment,
  type Session,
  type TrashItem,
} from "../lib/store";

interface SettingsProps {
  profile: Profile;
  onSaveProfile: (p: Profile) => void;
  clients: Client[];
  onAddClient: (c: Client) => void;
  onDeleteClient: (id: string) => void;
  session: Session;
  onChangePass: (current: string, next: string) => string | null;
  onLogout: () => void;
  online: boolean;
  canInstall: boolean;
  installed: boolean;
  onInstall: () => void;
  data: { inspections: Inspection[]; photos: Photo[]; measurements: Measurement[]; activity: Activity[]; assessments: PropertyAssessment[]; checklists: InspectionChecklist[]; fieldLogs: InspectionFieldLog[]; comparableLibrary: ComparableProperty[]; comparisonColumns: ComparisonColumn[] };
  trash: TrashItem[];
  comparisonColumns: ComparisonColumn[];
  onSaveComparisonColumns: (columns: ComparisonColumn[]) => void;
  onRestoreTrash: (item: TrashItem) => void;
  onPermanentlyDeleteTrash: (id: string) => void;
  toast: (t: string) => void;
}

function PanelHead({ index, title, sub, icon }: { index: string; title: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3 border-b border-line-soft pb-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-ink-800 text-brand-300">
        {icon}
      </span>
      <div>
        <p className="num text-[10px] tracking-[0.2em] text-fog-600">{index} / CONFIGURAÇÕES</p>
        <h2 className="font-display text-lg font-semibold uppercase leading-tight tracking-wide text-fog-100">{title}</h2>
        <p className="mt-0.5 text-xs text-fog-500">{sub}</p>
      </div>
    </div>
  );
}

export default function Settings({
  profile,
  onSaveProfile,
  clients,
  onAddClient,
  onDeleteClient,
  session,
  onChangePass,
  onLogout,
  online,
  canInstall,
  installed,
  onInstall,
  data,
  comparisonColumns,
  trash,
  onSaveComparisonColumns,
  onRestoreTrash,
  onPermanentlyDeleteTrash,
  toast,
}: SettingsProps) {
  /* ---------- identificação ---------- */
  const [ident, setIdent] = useState({ name: profile.name, registry: `${profile.registryLabel} ${profile.registryNumber}`.trim(), phone: profile.phone, email: profile.email });
  const [identSaved, setIdentSaved] = useState(false);

  const saveIdent = () => {
    const [label, ...rest] = ident.registry.split(" ");
    onSaveProfile({ ...profile, name: ident.name.trim(), registryLabel: label || profile.registryLabel, registryNumber: rest.join(" "), phone: ident.phone, email: ident.email });
    setIdentSaved(true);
    window.setTimeout(() => setIdentSaved(false), 3500);
  };

  /* ---------- vistoriados ---------- */
  const [cli, setCli] = useState({ name: "", doc: "", phone: "" });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const submitClient = (e: FormEvent) => {
    e.preventDefault();
    if (!cli.name.trim()) return;
    onAddClient({ id: uid(), name: cli.name.trim(), doc: cli.doc.trim(), phone: cli.phone.trim(), addedAt: new Date().toISOString() });
    setCli({ name: "", doc: "", phone: "" });
  };

  /* ---------- segurança ---------- */
  const [sec, setSec] = useState({ cur: "", next: "", confirm: "" });
  const [customColumnLabel, setCustomColumnLabel] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [secMsg, setSecMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const addComparisonColumn = (e: FormEvent) => {
    e.preventDefault();
    const label = customColumnLabel.trim();
    if (!label) return;
    const id = `custom_${uid()}`;
    onSaveComparisonColumns([...comparisonColumns, { id, label, enabled: true, order: comparisonColumns.length + 1 }]);
    setCustomColumnLabel("");
    toast(`Coluna “${label}” adicionada ao comparativo.`);
  };

  const submitPass = (e: FormEvent) => {
    e.preventDefault();
    if (sec.next !== sec.confirm) {
      setSecMsg({ ok: false, text: "A confirmação não confere com a nova senha." });
      return;
    }
    const err = onChangePass(sec.cur, sec.next);
    if (err) setSecMsg({ ok: false, text: err });
    else {
      setSecMsg({ ok: true, text: "Senha alterada com sucesso. Use-a no próximo acesso." });
      setSec({ cur: "", next: "", confirm: "" });
    }
  };

  /* ---------- dados ---------- */
  const storageKB = useMemo(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("prumo.")) total += (localStorage.getItem(k) ?? "").length * 2;
      }
      return Math.round(total / 1024);
    } catch {
      return 0;
    }
  }, [data]);

  const buildBackupPayload = () => {
    return {
      sistema: "Prumo — Vistoria & Avaliação de Imóveis",
      exportadoEm: new Date().toISOString(),
      avaliador: profile,
      vistoriados: clients,
      vistorias: data.inspections,
      medicoes: data.measurements,
      fotos: data.photos,
      atividade: data.activity,
      avaliacoesMercadologicas: data.assessments,
      checklists: data.checklists,
      dadosDeCampo: data.fieldLogs,
      bibliotecaComparaveis: data.comparableLibrary,
      colunasComparativo: comparisonColumns,
    };
  };

  const exportJson = () => {
    const payload = buildBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prumo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup exportado em JSON.");
  };

  const activeTrash = trash.filter((item) => !item.restoredAt);

  const syncMySql = async () => {
    if (!online) {
      toast("Conecte-se à rede para enviar o backup ao MySQL.");
      return;
    }
    setSyncing(true);
    try {
      const response = await fetch("api/sync.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildBackupPayload()) });
      const result = await response.json() as { ok?: boolean; message?: string; summary?: Record<string, number> };
      if (!response.ok || !result.ok) throw new Error(result.message || "Falha na sincronização");
      const summary = result.summary ? ` ${result.summary.vistorias ?? 0} vistorias, ${result.summary.fotos ?? 0} fotos e ${result.summary.avaliacoes ?? 0} avaliações.` : "";
      toast(`${result.message ?? "Backup enviado ao MySQL."}${summary}`);
    } catch {
      toast("Não foi possível enviar o backup. Verifique Apache, MySQL e api/config.php.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <SectionHead
        index="06"
        title="Configurações"
        sub="Nome do avaliador, vistoriados (clientes), segurança de acesso e preferências do aplicativo."
      >
        <span className={`chip ${online ? "border-mint-400/40 text-mint-400" : "border-accent-400/50 bg-accent-400/10 text-accent-300"}`}>
          {online ? <IcWifi width={12} height={12} /> : <IcWifiOff width={12} height={12} />}
          {online ? "Sincronizado" : "Offline — dados locais"}
        </span>
      </SectionHead>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- A · Identificação ---------- */}
        <Reveal>
          <div className="panel h-full p-5">
            <PanelHead
              index="A"
              title="Identificação do avaliador"
              sub="Nome exibido nas fichas, relatórios e PDFs."
              icon={<IcUser width={16} height={16} />}
            />
            <div className="space-y-3.5">
              <Field label="Nome do avaliador / vistoriador">
                <TextInput
                  value={ident.name}
                  placeholder="Seu nome profissional completo"
                  onChange={(e) => { setIdent((v) => ({ ...v, name: e.target.value })); setIdentSaved(false); }}
                />
              </Field>
              <Field label="Registro profissional" hint="Órgão e número, ex.: CNAI 045.112-F">
                <TextInput
                  value={ident.registry}
                  placeholder="CNAI 000.000"
                  onChange={(e) => { setIdent((v) => ({ ...v, registry: e.target.value })); setIdentSaved(false); }}
                />
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Telefone">
                  <TextInput value={ident.phone} onChange={(e) => { setIdent((v) => ({ ...v, phone: e.target.value })); setIdentSaved(false); }} placeholder="(11) 90000-0000" />
                </Field>
                <Field label="E-mail">
                  <TextInput value={ident.email} onChange={(e) => { setIdent((v) => ({ ...v, email: e.target.value })); setIdentSaved(false); }} placeholder="contato@dominio.com.br" />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
                <p className="text-[12px] text-fog-600">
                  Cadastro completo em <button className="text-brand-300 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-400" onClick={() => toast("Use o menu Cadastro para os dados completos.")}>menu Cadastro</button>.
                </p>
                <Btn variant="primary" onClick={saveIdent}>
                  {identSaved ? <IcCheck width={15} height={15} /> : <IcCog width={15} height={15} />}
                  {identSaved ? "Salvo" : "Salvar"}
                </Btn>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---------- B · Vistoriados ---------- */}
        <Reveal delay={80}>
          <div className="panel h-full p-5">
            <PanelHead
              index="B"
              title="Vistoriados (clientes)"
              sub="Cadastre os clientes — eles aparecem como sugestão ao criar vistorias."
              icon={<IcUsers width={16} height={16} />}
            />
            <form onSubmit={submitClient} className="grid gap-2.5 sm:grid-cols-[1fr_120px_130px_auto]">
              <TextInput placeholder="Nome do vistoriado *" value={cli.name} onChange={(e) => setCli((c) => ({ ...c, name: e.target.value }))} />
              <TextInput placeholder="Documento" value={cli.doc} onChange={(e) => setCli((c) => ({ ...c, doc: e.target.value }))} />
              <TextInput placeholder="Telefone" value={cli.phone} onChange={(e) => setCli((c) => ({ ...c, phone: e.target.value }))} />
              <Btn type="submit" variant="soft" disabled={!cli.name.trim()}>Adicionar</Btn>
            </form>

            <div className="mt-3 divide-y divide-line-soft/70">
              {clients.length === 0 && (
                <p className="py-4 text-center text-[13px] text-fog-600">Nenhum vistoriado cadastrado ainda.</p>
              )}
              {clients.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-ink-800 text-[11px] font-bold uppercase text-brand-300">
                    {c.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fog-100">{c.name}</p>
                    <p className="num truncate text-[11px] text-fog-600">
                      {[c.doc, c.phone].filter(Boolean).join(" · ") || `cadastrado ${timeAgo(c.addedAt)}`}
                    </p>
                  </div>
                  {confirmId === c.id ? (
                    <span className="flex items-center gap-1.5">
                      <Btn variant="danger" className="h-7 px-2.5 text-xs" onClick={() => { onDeleteClient(c.id); setConfirmId(null); }}>Confirmar</Btn>
                      <Btn className="h-7 px-2.5 text-xs" onClick={() => setConfirmId(null)}>Não</Btn>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(c.id)}
                      aria-label={`Excluir ${c.name}`}
                      className="rounded-md border border-transparent p-1.5 text-fog-600 transition hover:border-danger-400/40 hover:text-danger-400"
                    >
                      <IcTrash width={15} height={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ---------- C · Segurança ---------- */}
        <Reveal delay={120}>
          <div className="panel h-full p-5">
            <PanelHead
              index="C"
              title="Segurança de acesso"
              sub={`Sessão ativa: ${session.username} — desde ${fmtDate(session.loginAt)}.`}
              icon={<IcLock width={16} height={16} />}
            />
            <form onSubmit={submitPass} className="space-y-3.5">
              <Field label="Senha atual">
                <TextInput type="password" autoComplete="current-password" value={sec.cur} onChange={(e) => setSec((s) => ({ ...s, cur: e.target.value }))} placeholder="••••••" />
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Nova senha">
                  <TextInput type="password" autoComplete="new-password" value={sec.next} onChange={(e) => setSec((s) => ({ ...s, next: e.target.value }))} placeholder="mín. 4 caracteres" />
                </Field>
                <Field label="Confirmar nova senha">
                  <TextInput type="password" autoComplete="new-password" value={sec.confirm} onChange={(e) => setSec((s) => ({ ...s, confirm: e.target.value }))} placeholder="repita a senha" />
                </Field>
              </div>

              {secMsg && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-[13px] ${
                    secMsg.ok
                      ? "border-mint-400/40 bg-mint-400/10 text-mint-400"
                      : "border-danger-400/45 bg-danger-400/10 text-danger-400"
                  }`}
                >
                  {secMsg.ok ? <IcCheck width={15} height={15} className="mt-0.5 shrink-0" /> : <IcAlert width={15} height={15} className="mt-0.5 shrink-0" />}
                  {secMsg.text}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-line-soft pt-3.5">
                <Btn type="button" variant="danger" onClick={onLogout}>
                  <IcLogout width={15} height={15} /> Encerrar sessão
                </Btn>
                <Btn type="submit" variant="primary" disabled={!sec.cur || !sec.next || !sec.confirm}>
                  <IcLock width={15} height={15} /> Alterar senha
                </Btn>
              </div>
            </form>
          </div>
        </Reveal>

        {/* ---------- D · Aplicativo & dados ---------- */}
        <Reveal delay={160}>
          <div className="panel h-full p-5">
            <PanelHead
              index="D"
              title="Aplicativo & dados"
              sub={`Uso do armazenamento local: ~${storageKB} KB · ${data.photos.length} foto(s) · ${data.inspections.length} vistoria(s) · ${data.checklists.length} checklist(s) · ${data.assessments.length} avaliação(ões) · ${data.comparableLibrary.length} comparável(is).`}
              icon={<IcCog width={16} height={16} />}
            />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line-soft bg-ink-850/70 px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold text-fog-100">Prumo como aplicativo (PWA)</p>
                  <p className="text-[12px] text-fog-500">
                    {installed
                      ? "Instalado — executando em janela própria."
                      : canInstall
                        ? "Pronto para instalar neste dispositivo."
                        : "Abra no navegador e use “Adicionar à tela inicial”."}
                  </p>
                </div>
                {installed ? (
                  <span className="chip border-mint-400/40 text-mint-400"><IcCheck width={12} height={12} /> Instalado</span>
                ) : (
                  <Btn variant="soft" disabled={!canInstall} onClick={onInstall}>
                    <IcInstall width={15} height={15} /> Instalar app
                  </Btn>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line-soft bg-ink-850/70 px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold text-fog-100">Backup dos dados de campo</p>
                  <p className="text-[12px] text-fog-500">Exporta vistorias, checklists, medições, fotos e anotações em arquivo JSON.</p>
                </div>
                <Btn variant="soft" onClick={exportJson}>
                  <IcDownload width={15} height={15} /> Exportar JSON
                </Btn>
                <Btn onClick={() => void syncMySql()} disabled={syncing || !online} variant="soft">{syncing ? "Enviando..." : "Enviar ao MySQL"}</Btn>
              </div>

              <div className="rounded-md border border-line-soft bg-ink-850/70 px-3.5 py-3">
                <p className="text-sm font-semibold text-fog-100">Colunas do resumo comparativo</p>
                <p className="mt-1 text-[12px] text-fog-500">Escolha quais informações aparecem na tabela do PDF. A configuração fica salva neste dispositivo.</p>
                <form onSubmit={addComparisonColumn} className="mt-3 flex gap-2">
                  <TextInput value={customColumnLabel} onChange={(e) => setCustomColumnLabel(e.target.value)} placeholder="Ex.: Responsável pelo reparo" />
                  <Btn type="submit" variant="soft" disabled={!customColumnLabel.trim()}>Adicionar</Btn>
                </form>
                <div className="mt-3 space-y-2">
                  {[...comparisonColumns].sort((a, b) => a.order - b.order).map((column) => (
                    <label key={column.id} className="flex items-center gap-2 text-sm text-fog-300">
                      <input type="checkbox" checked={column.enabled} onChange={() => onSaveComparisonColumns(comparisonColumns.map((item) => item.id === column.id ? { ...item, enabled: !item.enabled } : item))} />
                      <span className="flex-1">{column.label}</span>
                      <Select className="w-20" value={String(column.order)} onChange={(e) => { const nextOrder = Number(e.target.value); onSaveComparisonColumns(comparisonColumns.map((item) => item.id === column.id ? { ...item, order: nextOrder } : item)); }}>
                        {[1, 2, 3, 4, 5, 6].map((order) => <option key={order} value={order}>{order}º</option>)}
                      </Select>
                      {column.id.startsWith("custom_") && <button type="button" className="text-xs text-danger-300" onClick={() => onSaveComparisonColumns(comparisonColumns.filter((item) => item.id !== column.id))}>Excluir</button>}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-line-soft bg-ink-850/70 px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-semibold text-fog-100">Lixeira</p><p className="mt-1 text-[12px] text-fog-500">Itens excluídos ficam aqui até serem restaurados ou removidos definitivamente.</p></div>
                  <span className="chip border-accent-400/40 text-accent-300">{activeTrash.length} item(ns)</span>
                </div>
                <div className="mt-3 divide-y divide-line-soft/70">
                  {activeTrash.length === 0 && <p className="py-3 text-xs text-fog-600">A lixeira está vazia.</p>}
                  {activeTrash.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-2 py-2.5"><div className="min-w-0 flex-1"><p className="truncate text-sm text-fog-100">{item.label}</p><p className="text-[11px] text-fog-600">{item.entityType} · excluído por {item.deletedBy} em {new Date(item.deletedAt).toLocaleString("pt-BR")}</p></div><Btn className="h-7 px-2.5 text-xs" onClick={() => onRestoreTrash(item)}>Restaurar</Btn><Btn variant="danger" className="h-7 px-2.5 text-xs" onClick={() => { if (window.confirm(`Excluir definitivamente “${item.label}”? Esta ação não poderá ser desfeita.`)) onPermanentlyDeleteTrash(item.id); }}>Excluir definitivamente</Btn></div>)}
                </div>
              </div>

              <p className="num pt-1 text-[10.5px] uppercase tracking-[0.16em] text-fog-600">
                Prumo v1.1 · dados armazenados neste dispositivo
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
