import { useMemo, useState, type FormEvent } from "react";
import { Btn, Field, SectionHead, Select, TextInput } from "./ui";
import { IcCheck, IcCog, IcUsers } from "./icons";
import { uid, type Activity, type FinancialEntry, type PartnerAccount, type TenantAccount, type User } from "../lib/store";

interface MasterProps {
  users: User[];
  tenants: TenantAccount[];
  partners: PartnerAccount[];
  finances: FinancialEntry[];
  activity: Activity[];
  onAddTenant: (tenant: TenantAccount) => void;
  onAddPartner: (partner: PartnerAccount) => void;
  onAddFinance: (entry: FinancialEntry) => void;
}

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Master({ users, tenants, partners, finances, activity, onAddTenant, onAddPartner, onAddFinance }: MasterProps) {
  const [tenant, setTenant] = useState({ name: "", contact: "", plan: "teste" as TenantAccount["plan"] });
  const [partner, setPartner] = useState({ name: "", contact: "", type: "revendedor" as PartnerAccount["type"], commissionPercent: "" });
  const [finance, setFinance] = useState({ tenantId: "", type: "cobranca" as FinancialEntry["type"], amount: "", dueDate: "", note: "" });

  const activeTenants = tenants.filter((item) => item.status === "ativo").length;
  const pending = useMemo(() => finances.filter((item) => item.status === "pendente").reduce((sum, item) => sum + item.amount, 0), [finances]);

  const submitTenant = (event: FormEvent) => {
    event.preventDefault();
    if (!tenant.name.trim()) return;
    onAddTenant({ id: uid(), name: tenant.name.trim(), contact: tenant.contact.trim(), plan: tenant.plan, status: "ativo", createdAt: new Date().toISOString() });
    setTenant({ name: "", contact: "", plan: "teste" });
  };

  const submitPartner = (event: FormEvent) => {
    event.preventDefault();
    if (!partner.name.trim()) return;
    onAddPartner({ id: uid(), name: partner.name.trim(), contact: partner.contact.trim(), type: partner.type, status: "ativo", commissionPercent: Number(partner.commissionPercent.replace(",", ".")) || 0, createdAt: new Date().toISOString() });
    setPartner({ name: "", contact: "", type: "revendedor", commissionPercent: "" });
  };

  const submitFinance = (event: FormEvent) => {
    event.preventDefault();
    if (!finance.tenantId || !finance.amount) return;
    onAddFinance({ id: uid(), tenantId: finance.tenantId, type: finance.type, status: "pendente", amount: Number(finance.amount.replace(",", ".")) || 0, dueDate: finance.dueDate, note: finance.note.trim(), createdAt: new Date().toISOString() });
    setFinance({ tenantId: "", type: "cobranca", amount: "", dueDate: "", note: "" });
  };

  return <div className="space-y-5">
    <SectionHead index="MASTER" title="Painel de controle da plataforma" sub="Administração de clientes contratantes, parceiros, financeiro e auditoria."><span className="chip border-accent-400/40 bg-accent-400/10 text-accent-300">Acesso Master</span></SectionHead>

    <div className="grid gap-3 sm:grid-cols-4">
      <div className="panel p-4"><p className="eyebrow">CLIENTES ATIVOS</p><p className="num mt-1 text-2xl font-semibold text-brand-300">{activeTenants}</p></div>
      <div className="panel p-4"><p className="eyebrow">PARCEIROS</p><p className="num mt-1 text-2xl font-semibold text-brand-300">{partners.length}</p></div>
      <div className="panel p-4"><p className="eyebrow">A RECEBER</p><p className="num mt-1 text-2xl font-semibold text-accent-300">{money(pending)}</p></div>
      <div className="panel p-4"><p className="eyebrow">USUÁRIOS LOCAIS</p><p className="num mt-1 text-2xl font-semibold text-mint-400">{users.length}</p></div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel p-5"><div className="mb-4 flex items-start gap-3 border-b border-line-soft pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-ink-800 text-brand-300"><IcUsers width={16} height={16} /></span><div><p className="eyebrow">A · TENANTS</p><h2 className="font-display text-lg font-semibold uppercase text-fog-100">Novo cliente contratante</h2><p className="text-xs text-fog-500">Organização isolada para a futura operação online.</p></div></div>
        <form onSubmit={submitTenant} className="space-y-3"><Field label="Nome da organização *"><TextInput value={tenant.name} onChange={(e) => setTenant((v) => ({ ...v, name: e.target.value }))} placeholder="Imobiliária ou empresa" /></Field><Field label="Contato"><TextInput value={tenant.contact} onChange={(e) => setTenant((v) => ({ ...v, contact: e.target.value }))} placeholder="E-mail ou telefone" /></Field><Field label="Plano"><Select value={tenant.plan} onChange={(e) => setTenant((v) => ({ ...v, plan: e.target.value as TenantAccount["plan"] }))}><option value="teste">Teste</option><option value="essencial">Essencial</option><option value="profissional">Profissional</option><option value="empresarial">Empresarial</option></Select></Field><Btn type="submit" variant="primary" disabled={!tenant.name.trim()}><IcCheck width={15} height={15} /> Cadastrar cliente</Btn></form>
        <div className="mt-4 divide-y divide-line-soft/70">{tenants.slice(0, 6).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="truncate text-fog-100">{item.name}</span><span className="chip border-mint-400/30 text-mint-400">{item.status}</span></div>)}</div>
      </div>

      <div className="panel p-5"><div className="mb-4 flex items-start gap-3 border-b border-line-soft pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-ink-800 text-brand-300"><IcCog width={16} height={16} /></span><div><p className="eyebrow">B · PARCEIROS</p><h2 className="font-display text-lg font-semibold uppercase text-fog-100">Revendedores e afiliados</h2><p className="text-xs text-fog-500">Cadastro comercial e percentual de comissão.</p></div></div>
        <form onSubmit={submitPartner} className="space-y-3"><Field label="Nome *"><TextInput value={partner.name} onChange={(e) => setPartner((v) => ({ ...v, name: e.target.value }))} placeholder="Nome do parceiro" /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Tipo"><Select value={partner.type} onChange={(e) => setPartner((v) => ({ ...v, type: e.target.value as PartnerAccount["type"] }))}><option value="revendedor">Revendedor</option><option value="afiliado">Afiliado</option></Select></Field><Field label="Comissão (%)"><TextInput value={partner.commissionPercent} onChange={(e) => setPartner((v) => ({ ...v, commissionPercent: e.target.value }))} placeholder="0,00" inputMode="decimal" /></Field></div><Field label="Contato"><TextInput value={partner.contact} onChange={(e) => setPartner((v) => ({ ...v, contact: e.target.value }))} placeholder="E-mail ou telefone" /></Field><Btn type="submit" variant="soft" disabled={!partner.name.trim()}>Adicionar parceiro</Btn></form>
        <div className="mt-4 divide-y divide-line-soft/70">{partners.slice(0, 6).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="truncate text-fog-100">{item.name} <span className="text-fog-500">· {item.type}</span></span><span className="num text-fog-500">{item.commissionPercent}%</span></div>)}</div>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <div className="panel p-5"><p className="eyebrow">C · FINANCEIRO</p><h2 className="font-display text-lg font-semibold uppercase text-fog-100">Lançar cobrança ou pagamento</h2><p className="mb-4 text-xs text-fog-500">No banco online, estes lançamentos serão vinculados à organização e à assinatura.</p><form onSubmit={submitFinance} className="grid gap-3 sm:grid-cols-2"><Field label="Cliente"><Select value={finance.tenantId} onChange={(e) => setFinance((v) => ({ ...v, tenantId: e.target.value }))}><option value="">Selecione</option>{tenants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Tipo"><Select value={finance.type} onChange={(e) => setFinance((v) => ({ ...v, type: e.target.value as FinancialEntry["type"] }))}><option value="cobranca">Cobrança</option><option value="pagamento">Pagamento</option><option value="comissao">Comissão</option><option value="estorno">Estorno</option></Select></Field><Field label="Valor"><TextInput value={finance.amount} onChange={(e) => setFinance((v) => ({ ...v, amount: e.target.value }))} placeholder="0,00" inputMode="decimal" /></Field><Field label="Vencimento"><TextInput type="date" value={finance.dueDate} onChange={(e) => setFinance((v) => ({ ...v, dueDate: e.target.value }))} /></Field><div className="sm:col-span-2"><Field label="Observação"><TextInput value={finance.note} onChange={(e) => setFinance((v) => ({ ...v, note: e.target.value }))} placeholder="Referência do lançamento" /></Field></div><Btn type="submit" variant="primary" disabled={!finance.tenantId || !finance.amount}>Salvar lançamento</Btn></form></div>
      <div className="panel p-5"><p className="eyebrow">D · AUDITORIA</p><h2 className="font-display text-lg font-semibold uppercase text-fog-100">Atividade recente</h2><div className="mt-3 divide-y divide-line-soft/70">{activity.slice(0, 8).map((item) => <div key={item.id} className="py-2"><p className="text-xs text-fog-300">{item.text}</p><p className="num text-[10px] text-fog-600">{new Date(item.at).toLocaleString("pt-BR")}</p></div>)}</div></div>
    </div>
  </div>;
}
