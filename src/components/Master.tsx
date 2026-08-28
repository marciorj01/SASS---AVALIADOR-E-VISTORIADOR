import { useMemo, useState, type FormEvent } from "react";
import { Btn, Field, Modal, SectionHead, Select, TextArea, TextInput } from "./ui";
import { IcCheck, IcCog, IcLock, IcUser, IcUsers } from "./icons";
import { uid, type Activity, type FinancialEntry, type PartnerAccount, type TenantAccount, type User } from "../lib/store";

interface MasterProps {
  users: User[];
  tenants: TenantAccount[];
  partners: PartnerAccount[];
  finances: FinancialEntry[];
  activity: Activity[];
  onAddTenant: (tenant: TenantAccount, initialUser: { username: string; pass: string }) => void;
  onDeleteTenant?: (id: string) => void;
  onAddPartner: (partner: PartnerAccount) => void;
  onAddFinance: (entry: FinancialEntry) => void;
  onUpdateFinanceStatus?: (id: string, status: FinancialEntry["status"]) => void;
  onDeleteFinance?: (id: string) => void;
  toast?: (msg: string) => void;
}

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Master({
  users,
  tenants,
  partners,
  finances,
  activity,
  onAddTenant,
  onDeleteTenant,
  onAddPartner,
  onAddFinance,
  onUpdateFinanceStatus,
  onDeleteFinance,
  toast,
}: MasterProps) {
  const [tab, setTab] = useState<"clientes" | "financeiro" | "parceiros" | "auditoria">("clientes");

  /* ---------- Estado do Cadastro Completo de Cliente ---------- */
  const [tenantForm, setTenantForm] = useState({
    name: "",
    legalName: "",
    doc: "",
    contact: "",
    phone: "",
    responsibleName: "",
    responsibleRole: "",
    cep: "",
    address: "",
    city: "",
    uf: "",
    plan: "plano_unico" as TenantAccount["plan"],
    monthlyPrice: "199,00",
    dueDateDay: "10",
    username: "",
    pass: "cliente123",
  });

  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState("");

  const lookupTenantCep = async (cepInput: string) => {
    const cepDigits = cepInput.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;
    setCepLoading(true);
    setCepMessage("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setCepMessage("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      const street = [data.logradouro, data.bairro].filter(Boolean).join(", ");
      const formattedCep = cepDigits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
      setTenantForm((v) => ({
        ...v,
        cep: formattedCep,
        address: street || v.address,
        city: data.localidade || v.city,
        uf: data.uf || v.uf,
      }));
      setCepMessage(`🟢 Endereço localizado: ${street} — ${data.localidade}/${data.uf}`);
    } catch {
      setCepMessage("Busca de CEP indisponível. Preencha o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  /* ---------- Modal de Envio / Compartilhamento de Acesso ---------- */
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedShareTenant, setSelectedShareTenant] = useState<TenantAccount | null>(null);

  /* ---------- Estado de Parceiros ---------- */
  const [partner, setPartner] = useState({
    name: "",
    contact: "",
    type: "revendedor" as PartnerAccount["type"],
    commissionPercent: "20",
  });

  /* ---------- Estado de Lançamento Financeiro ---------- */
  const [finance, setFinance] = useState({
    tenantId: "",
    direction: "entrada" as "entrada" | "saida",
    type: "assinatura" as FinancialEntry["type"],
    planName: "Plano Único Prumo",
    amount: "199,00",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "pendente" as FinancialEntry["status"],
    note: "Mensalidade Plano Único Prumo",
  });

  const [financeFilter, setFinanceFilter] = useState<"todos" | "entradas" | "saidas" | "pendentes">("todos");

  /* ---------- Estatísticas Globais ---------- */
  const activeTenants = tenants.filter((item) => item.status === "ativo").length;

  const totalEntradasPagas = useMemo(() => {
    return finances
      .filter((item) => (item.direction ?? "entrada") === "entrada" && item.status === "pago")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [finances]);

  const totalEntradasPendentes = useMemo(() => {
    return finances
      .filter((item) => (item.direction ?? "entrada") === "entrada" && item.status === "pendente")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [finances]);

  const totalSaidasComissao = useMemo(() => {
    return finances
      .filter((item) => item.direction === "saida" && item.status !== "cancelado")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [finances]);

  const saldoLiquido = totalEntradasPagas - totalSaidasComissao;

  /* ---------- Submeter Cadastro Completo de Cliente ---------- */
  const submitTenant = (event: FormEvent) => {
    event.preventDefault();
    if (!tenantForm.name.trim()) return;

    const tenantId = uid();
    const finalUsername = (tenantForm.username.trim() || tenantForm.name.toLowerCase().replace(/[^a-z0-9]/g, "_")).slice(0, 20);
    const finalPass = tenantForm.pass.trim() || "cliente123";
    const parsedPrice = Number(tenantForm.monthlyPrice.replace(",", ".")) || 199.0;
    const parsedDueDay = Number(tenantForm.dueDateDay) || 10;

    const newTenant: TenantAccount = {
      id: tenantId,
      name: tenantForm.name.trim(),
      legalName: tenantForm.legalName.trim() || undefined,
      doc: tenantForm.doc.trim() || undefined,
      contact: tenantForm.contact.trim(),
      phone: tenantForm.phone.trim() || undefined,
      responsibleName: tenantForm.responsibleName.trim() || undefined,
      responsibleRole: tenantForm.responsibleRole.trim() || undefined,
      cep: tenantForm.cep.trim() || undefined,
      address: tenantForm.address.trim() || undefined,
      city: tenantForm.city.trim() || undefined,
      uf: tenantForm.uf.trim() || undefined,
      plan: tenantForm.plan,
      monthlyPrice: parsedPrice,
      dueDateDay: parsedDueDay,
      status: "ativo",
      initialUsername: finalUsername,
      initialPassword: finalPass,
      createdAt: new Date().toISOString(),
    };

    onAddTenant(newTenant, {
      username: finalUsername,
      pass: finalPass,
    });

    // Lança automaticamente a primeira cobrança da assinatura se for Plano Único ou pago
    const dueDateISO = new Date(new Date().getFullYear(), new Date().getMonth(), parsedDueDay).toISOString().slice(0, 10);
    onAddFinance({
      id: uid(),
      tenantId: tenantId,
      direction: "entrada",
      type: "assinatura",
      planName: tenantForm.plan === "plano_unico" ? "Plano Único Prumo" : "Assinatura Mensal",
      status: "pendente",
      amount: parsedPrice,
      dueDate: dueDateISO,
      note: `Primeira mensalidade — Vencimento dia ${parsedDueDay}`,
      createdAt: new Date().toISOString(),
    });

    // Abre o modal de compartilhamento automático de credenciais!
    setSelectedShareTenant(newTenant);
    setShareModalOpen(true);

    setTenantForm({
      name: "",
      legalName: "",
      doc: "",
      contact: "",
      phone: "",
      responsibleName: "",
      responsibleRole: "",
      cep: "",
      address: "",
      city: "",
      uf: "",
      plan: "plano_unico",
      monthlyPrice: "199,00",
      dueDateDay: "10",
      username: "",
      pass: "cliente123",
    });
  };

  /* ---------- Submeter Parceiro ---------- */
  const submitPartner = (event: FormEvent) => {
    event.preventDefault();
    if (!partner.name.trim()) return;

    onAddPartner({
      id: uid(),
      name: partner.name.trim(),
      contact: partner.contact.trim(),
      type: partner.type,
      status: "ativo",
      commissionPercent: Number(partner.commissionPercent.replace(",", ".")) || 0,
      createdAt: new Date().toISOString(),
    });

    setPartner({ name: "", contact: "", type: "revendedor", commissionPercent: "20" });
  };

  /* ---------- Submeter Financeiro ---------- */
  const submitFinance = (event: FormEvent) => {
    event.preventDefault();
    if (!finance.tenantId || !finance.amount) return;

    onAddFinance({
      id: uid(),
      tenantId: finance.tenantId,
      direction: finance.direction,
      type: finance.type,
      planName: finance.planName.trim() || "Plano Único Prumo",
      status: finance.status,
      amount: Number(finance.amount.replace(",", ".")) || 0,
      dueDate: finance.dueDate,
      note: finance.note.trim(),
      createdAt: new Date().toISOString(),
    });

    setFinance({
      tenantId: "",
      direction: "entrada",
      type: "assinatura",
      planName: "Plano Único Prumo",
      amount: "199,00",
      dueDate: new Date().toISOString().slice(0, 10),
      status: "pendente",
      note: "Mensalidade Plano Único Prumo",
    });
  };

  /* ---------- Gerar Mensalidade do Mês para um Cliente ---------- */
  const handleGenerateMonthlyInvoice = (t: TenantAccount) => {
    const dueDay = t.dueDateDay || 10;
    const price = t.monthlyPrice || 199.0;
    const now = new Date();
    const dueDateISO = new Date(now.getFullYear(), now.getMonth(), dueDay).toISOString().slice(0, 10);

    onAddFinance({
      id: uid(),
      tenantId: t.id,
      direction: "entrada",
      type: "assinatura",
      planName: t.plan === "plano_unico" ? "Plano Único Prumo" : "Mensalidade",
      status: "pendente",
      amount: price,
      dueDate: dueDateISO,
      note: `Mensalidade ${now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
      createdAt: new Date().toISOString(),
    });

    if (toast) toast(`Cobrança de R$ ${price.toFixed(2)} gerada para ${t.name}`);
  };

  /* ---------- Mensagem Formatada para Compartilhar Acesso ---------- */
  const getShareMessage = (t: TenantAccount) => {
    const origin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "http://localhost/SASS%20-%20AVALIADOR%20E%20VISTORIADOR";
    const resp = t.responsibleName ? `Prezado(a) *${t.responsibleName}*,` : "Olá!";
    return `${resp}

Seu acesso ao sistema *PRUMO — Vistoria & Avaliação de Imóveis* foi liberado com sucesso!

🏢 *Organização:* ${t.name}
🌐 *Endereço de Acesso:* ${origin}
👤 *Usuário de Login:* *${t.initialUsername || "cliente"}*
🔑 *Senha Temporária:* *${t.initialPassword || "cliente123"}*

📌 *Orientações de Segurança:*
Recomendamos alterar a sua senha no menu *Configurações* após o seu primeiro acesso.

Se tiver qualquer dúvida, nossa equipe de suporte está à sua disposição!`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    if (toast) toast("Mensagem de acesso copiada para a área de transferência!");
  };

  const openWhatsApp = (t: TenantAccount) => {
    const text = encodeURIComponent(getShareMessage(t));
    const phoneClean = (t.phone || "").replace(/\D/g, "");
    const url = phoneClean ? `https://wa.me/55${phoneClean}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  /* Lançamentos filtrados */
  const filteredFinances = useMemo(() => {
    return finances.filter((item) => {
      if (financeFilter === "entradas") return (item.direction ?? "entrada") === "entrada";
      if (financeFilter === "saidas") return item.direction === "saida";
      if (financeFilter === "pendentes") return item.status === "pendente";
      return true;
    });
  }, [finances, financeFilter]);

  return (
    <div className="space-y-6">
      <SectionHead
        index="MASTER"
        title="Painel do Desenvolvedor (Master)"
        sub="Gestão completa de clientes contratantes, emissão de credenciais, controle financeiro de assinaturas e revendas."
      >
        <span className="chip border-accent-400/40 bg-accent-400/10 text-accent-300">Acesso Desenvolvedor</span>
      </SectionHead>

      {/* Card explicativo sobre a separação de acesso */}
      <div className="rounded-lg border border-brand-400/40 bg-ink-800/90 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-brand-400 shrink-0">
            <IcLock width={20} height={20} />
          </span>
          <div className="text-xs leading-relaxed text-fog-300">
            <p className="font-semibold text-brand-300 uppercase tracking-wide">
              Controle Total do Desenvolvedor &amp; Isolamento de Clientes
            </p>
            <p className="mt-1">
              O Painel Master é acessado somente pela sua conta de Desenvolvedor (<code>admin</code>). Cada cliente contratante cadastrado abaixo recebe suas próprias credenciais de login e navega exclusivamente na **Operação do Sistema** (Painel de Campo, Vistorias, Calculadora e Fotos), **sem jamais visualizar este Painel Master**.
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Financeiras e Operacionais */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="panel p-4">
          <p className="eyebrow">CLIENTES ATIVOS</p>
          <p className="num mt-1 text-2xl font-semibold text-brand-300">{activeTenants}</p>
          <p className="text-[11px] text-fog-500 mt-1">{tenants.length} organização(ões) cadastrada(s)</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">RECEITAS RECEBIDAS</p>
          <p className="num mt-1 text-2xl font-semibold text-mint-400">{money(totalEntradasPagas)}</p>
          <p className="text-[11px] text-fog-500 mt-1">A receber: {money(totalEntradasPendentes)}</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">COMISSÕES &amp; DESPESAS</p>
          <p className="num mt-1 text-2xl font-semibold text-accent-300">{money(totalSaidasComissao)}</p>
          <p className="text-[11px] text-fog-500 mt-1">{partners.length} parceiro(s) cadastrado(s)</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">SALDO LÍQUIDO ATUAL</p>
          <p className={`num mt-1 text-2xl font-semibold ${saldoLiquido >= 0 ? "text-mint-400" : "text-danger-400"}`}>
            {money(saldoLiquido)}
          </p>
          <p className="text-[11px] text-fog-500 mt-1">Receitas confirmadas - saídas</p>
        </div>
      </div>

      {/* Navegação por Abas no Master */}
      <div className="flex border-b border-line-soft">
        <button
          onClick={() => setTab("clientes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === "clientes"
              ? "border-brand-400 text-brand-300 bg-ink-800/40"
              : "border-transparent text-fog-500 hover:text-fog-200"
          }`}
        >
          <IcUsers width={16} height={16} /> Clientes &amp; Credenciais ({tenants.length})
        </button>
        <button
          onClick={() => setTab("financeiro")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === "financeiro"
              ? "border-brand-400 text-brand-300 bg-ink-800/40"
              : "border-transparent text-fog-500 hover:text-fog-200"
          }`}
        >
          <span>💲</span> Financeiro &amp; Mensalidades ({finances.length})
        </button>
        <button
          onClick={() => setTab("parceiros")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === "parceiros"
              ? "border-brand-400 text-brand-300 bg-ink-800/40"
              : "border-transparent text-fog-500 hover:text-fog-200"
          }`}
        >
          <IcCog width={16} height={16} /> Revendas &amp; Parceiros ({partners.length})
        </button>
        <button
          onClick={() => setTab("auditoria")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === "auditoria"
              ? "border-brand-400 text-brand-300 bg-ink-800/40"
              : "border-transparent text-fog-500 hover:text-fog-200"
          }`}
        >
          <span>📜</span> Auditoria &amp; Logs
        </button>
      </div>

      {/* ==================== ABA 1: CLIENTES & CREDENCIAIS ==================== */}
      {tab === "clientes" && (
        <div className="space-y-6">
          {/* Formulário Completo de Cadastro de Cliente */}
          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between border-b border-line-soft pb-4">
              <div>
                <p className="eyebrow text-brand-400">CADASTRO COMPLETO DE ORGANIZAÇÃO</p>
                <h2 className="font-display text-xl font-semibold uppercase text-fog-100">
                  Novo Cliente ou Imobiliária Contratante
                </h2>
                <p className="text-xs text-fog-500">
                  Preencha os dados corporativos, responsável, plano e gere a conta de acesso para envio ao cliente.
                </p>
              </div>
              <span className="chip border-brand-400/40 bg-brand-400/10 text-brand-300 font-semibold">
                Plano Único Prumo (Padrão)
              </span>
            </div>

            <form onSubmit={submitTenant} className="space-y-5">
              {/* Bloco 1: Identificação da Empresa */}
              <div>
                <p className="eyebrow mb-2 text-brand-300">1. DADOS DA EMPRESA OU VISTORIADOR</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Nome Comercial (Nome Fantasia) *">
                    <TextInput
                      value={tenantForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTenantForm((v) => ({
                          ...v,
                          name: val,
                          username: v.username || val.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 18),
                        }));
                      }}
                      placeholder="Ex: Imobiliária Horizonte"
                      required
                    />
                  </Field>
                  <Field label="Razão Social (opcional)">
                    <TextInput
                      value={tenantForm.legalName}
                      onChange={(e) => setTenantForm((v) => ({ ...v, legalName: e.target.value }))}
                      placeholder="Ex: Imobiliária Horizonte Ltda. ME"
                    />
                  </Field>
                  <Field label="CNPJ / CPF">
                    <TextInput
                      value={tenantForm.doc}
                      onChange={(e) => setTenantForm((v) => ({ ...v, doc: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                    />
                  </Field>
                </div>
              </div>

              {/* Bloco 2: Contato & Responsável */}
              <div>
                <p className="eyebrow mb-2 text-brand-300">2. RESPONSÁVEL E CONTATO</p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Nome do Responsável *">
                    <TextInput
                      value={tenantForm.responsibleName}
                      onChange={(e) => setTenantForm((v) => ({ ...v, responsibleName: e.target.value }))}
                      placeholder="Ex: Dr. Carlos Menezes"
                    />
                  </Field>
                  <Field label="Cargo / Função">
                    <TextInput
                      value={tenantForm.responsibleRole}
                      onChange={(e) => setTenantForm((v) => ({ ...v, responsibleRole: e.target.value }))}
                      placeholder="Ex: Diretor / Perito Avaliador"
                    />
                  </Field>
                  <Field label="E-mail Principal (para login/notificação) *">
                    <TextInput
                      type="email"
                      value={tenantForm.contact}
                      onChange={(e) => setTenantForm((v) => ({ ...v, contact: e.target.value }))}
                      placeholder="contato@empresa.com"
                      required
                    />
                  </Field>
                  <Field label="Telefone / Celular (WhatsApp)">
                    <TextInput
                      value={tenantForm.phone}
                      onChange={(e) => setTenantForm((v) => ({ ...v, phone: e.target.value }))}
                      placeholder="(11) 99887-1122"
                    />
                  </Field>
                </div>
              </div>

              {/* Bloco 3: Endereço */}
              <div>
                <p className="eyebrow mb-2 text-brand-300">3. LOCALIZAÇÃO DA EMPRESA</p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="CEP" hint="Busca automática ao digitar 8 números">
                    <TextInput
                      value={tenantForm.cep}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTenantForm((v) => ({ ...v, cep: val }));
                        if (val.replace(/\D/g, "").length === 8) {
                          void lookupTenantCep(val);
                        }
                      }}
                      onBlur={() => {
                        if (tenantForm.cep.replace(/\D/g, "").length === 8) {
                          void lookupTenantCep(tenantForm.cep);
                        }
                      }}
                      placeholder="00000-000"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Endereço / Logradouro">
                    <TextInput
                      value={tenantForm.address}
                      onChange={(e) => setTenantForm((v) => ({ ...v, address: e.target.value }))}
                      placeholder="Av. Brasil, 1500"
                    />
                  </Field>
                  <Field label="Cidade">
                    <TextInput
                      value={tenantForm.city}
                      onChange={(e) => setTenantForm((v) => ({ ...v, city: e.target.value }))}
                      placeholder="Campinas"
                    />
                  </Field>
                  <Field label="UF">
                    <TextInput
                      value={tenantForm.uf}
                      onChange={(e) => setTenantForm((v) => ({ ...v, uf: e.target.value.toUpperCase() }))}
                      maxLength={2}
                      placeholder="SP"
                    />
                  </Field>
                </div>
                {(cepLoading || cepMessage) && (
                  <p className="mt-2 text-xs text-brand-300 font-medium">
                    {cepLoading ? "🔄 Buscando endereço no ViaCEP..." : cepMessage}
                  </p>
                )}
              </div>

              {/* Bloco 4: Contrato, Plano e Acesso */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-line bg-ink-800/60 p-4 space-y-3">
                  <p className="eyebrow text-brand-400 flex items-center gap-1">
                    <span>💳</span> CONTRATO E ASSINATURA
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Plano Comercial">
                      <Select
                        value={tenantForm.plan}
                        onChange={(e) => setTenantForm((v) => ({ ...v, plan: e.target.value as TenantAccount["plan"] }))}
                      >
                        <option value="plano_unico">Plano Único Prumo (R$ 199/mês)</option>
                        <option value="teste">Período de Teste Grátis</option>
                        <option value="essencial">Essencial</option>
                        <option value="profissional">Profissional</option>
                        <option value="empresarial">Empresarial</option>
                      </Select>
                    </Field>
                    <Field label="Valor da Mensalidade (R$)">
                      <TextInput
                        value={tenantForm.monthlyPrice}
                        onChange={(e) => setTenantForm((v) => ({ ...v, monthlyPrice: e.target.value }))}
                        placeholder="199,00"
                        inputMode="decimal"
                      />
                    </Field>
                    <Field label="Dia do Vencimento">
                      <Select
                        value={tenantForm.dueDateDay}
                        onChange={(e) => setTenantForm((v) => ({ ...v, dueDateDay: e.target.value }))}
                      >
                        <option value="5">Dia 05</option>
                        <option value="10">Dia 10</option>
                        <option value="15">Dia 15</option>
                        <option value="20">Dia 20</option>
                        <option value="25">Dia 25</option>
                        <option value="30">Dia 30</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="rounded-lg border border-brand-400/40 bg-brand-400/10 p-4 space-y-3">
                  <p className="eyebrow text-brand-300 flex items-center gap-1.5 font-bold">
                    <IcUser width={14} height={14} /> CREDENCIAIS DE ACESSO DO CLIENTE
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Usuário de Login do Cliente *">
                      <TextInput
                        value={tenantForm.username}
                        onChange={(e) => setTenantForm((v) => ({ ...v, username: e.target.value }))}
                        placeholder="ex: cliente_horizonte"
                        required
                      />
                    </Field>
                    <Field label="Senha Inicial Temporária *">
                      <TextInput
                        value={tenantForm.pass}
                        onChange={(e) => setTenantForm((v) => ({ ...v, pass: e.target.value }))}
                        placeholder="cliente123"
                        required
                      />
                    </Field>
                  </div>
                  <p className="text-[11px] text-fog-400">
                    O cliente usará este usuário e senha para entrar no sistema. Ele poderá alterar a senha depois em Configurações.
                  </p>
                </div>
              </div>

              <Btn type="submit" variant="primary" className="h-11 px-6 text-sm font-semibold">
                <IcCheck width={16} height={16} /> Cadastrar Cliente &amp; Gerar Acesso
              </Btn>
            </form>
          </div>

          {/* Listagem Completa dos Clientes */}
          <div className="panel p-6">
            <div className="flex items-center justify-between border-b border-line-soft pb-4 mb-4">
              <div>
                <p className="eyebrow">CARTEIRA DE CLIENTES</p>
                <h3 className="font-display text-lg font-semibold uppercase text-fog-100">
                  Organizações Registradas na Plataforma
                </h3>
              </div>
              <span className="chip border-mint-400/30 text-mint-400">{activeTenants} ativa(s)</span>
            </div>

            <div className="space-y-3">
              {tenants.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-line-soft bg-ink-850/80 p-4 transition hover:border-brand-400/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-display text-base font-semibold text-fog-100">{item.name}</span>
                        <span className="chip border-mint-400/30 text-mint-400 text-[10.5px] uppercase font-bold">
                          {item.status}
                        </span>
                        <span className="chip border-brand-400/30 text-brand-300 text-[10.5px]">
                          {item.plan === "plano_unico" ? "Plano Único Prumo" : item.plan}
                        </span>
                      </div>
                      <p className="text-xs text-fog-400">
                        {item.legalName && <span>{item.legalName} · </span>}
                        {item.doc && <span>{item.doc} · </span>}
                        Resp: <strong className="text-fog-200">{item.responsibleName || "Não informado"}</strong> ({item.responsibleRole || "Responsável"})
                      </p>
                      <p className="text-xs text-fog-500">
                        📧 {item.contact} {item.phone && <span>· 📱 {item.phone}</span>} {item.city && <span>· 📍 {item.city}/{item.uf}</span>}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="rounded border border-brand-400/30 bg-ink-800 px-3 py-1.5 text-xs">
                        <p className="num text-[11px] text-fog-400">Acesso Liberado:</p>
                        <p className="num font-semibold text-brand-300">
                          Login: <code>{item.initialUsername || "cliente"}</code> · Senha: <code>{item.initialPassword || "••••••"}</code>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Btn
                          variant="primary"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedShareTenant(item);
                            setShareModalOpen(true);
                          }}
                        >
                          📲 Enviar / Compartilhar Acesso
                        </Btn>
                        <Btn
                          variant="soft"
                          className="h-8 text-xs"
                          onClick={() => handleGenerateMonthlyInvoice(item)}
                          title="Gerar mensalidade deste mês no financeiro"
                        >
                          💲 Gerar Fatura
                        </Btn>
                        {onDeleteTenant && (
                          <button
                            onClick={() => onDeleteTenant(item.id)}
                            className="rounded px-2 py-1 text-xs text-danger-400 hover:bg-danger-400/10"
                            title="Remover cliente"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 2: FINANCEIRO COMPLETO ==================== */}
      {tab === "financeiro" && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            {/* Formulário de Lançamento Financeiro */}
            <div className="panel p-5 space-y-4">
              <div>
                <p className="eyebrow text-brand-400">NOVO LANÇAMENTO FINANCEIRO</p>
                <h3 className="font-display text-lg font-semibold uppercase text-fog-100">
                  Lançar Receita ou Saída de Comissão
                </h3>
                <p className="text-xs text-fog-500">
                  Registre pagamentos do Plano Único, cobranças avulsas ou repasses de revendedores.
                </p>
              </div>

              <form onSubmit={submitFinance} className="space-y-3">
                <Field label="Cliente / Organização *">
                  <Select
                    value={finance.tenantId}
                    onChange={(e) => setFinance((v) => ({ ...v, tenantId: e.target.value }))}
                    required
                  >
                    <option value="">Selecione a empresa cliente</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.contact})
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Direção do Lançamento *">
                    <Select
                      value={finance.direction}
                      onChange={(e) => setFinance((v) => ({ ...v, direction: e.target.value as "entrada" | "saida" }))}
                    >
                      <option value="entrada">🟢 Entrada (Receita / Cobrança)</option>
                      <option value="saida">🔴 Saída (Despesa / Comissão)</option>
                    </Select>
                  </Field>

                  <Field label="Tipo">
                    <Select
                      value={finance.type}
                      onChange={(e) => setFinance((v) => ({ ...v, type: e.target.value as FinancialEntry["type"] }))}
                    >
                      <option value="assinatura">Assinatura (Plano)</option>
                      <option value="cobranca">Cobrança Avulsa</option>
                      <option value="pagamento">Pagamento Recebido</option>
                      <option value="comissao">Comissão de Revenda</option>
                      <option value="estorno">Estorno / Devolução</option>
                      <option value="outros">Outros</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Plano / Referência">
                    <TextInput
                      value={finance.planName}
                      onChange={(e) => setFinance((v) => ({ ...v, planName: e.target.value }))}
                      placeholder="Plano Único Prumo"
                    />
                  </Field>
                  <Field label="Valor (R$) *">
                    <TextInput
                      value={finance.amount}
                      onChange={(e) => setFinance((v) => ({ ...v, amount: e.target.value }))}
                      placeholder="199,00"
                      inputMode="decimal"
                      required
                    />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Data de Vencimento">
                    <TextInput
                      type="date"
                      value={finance.dueDate}
                      onChange={(e) => setFinance((v) => ({ ...v, dueDate: e.target.value }))}
                    />
                  </Field>

                  <Field label="Status do Pagamento">
                    <Select
                      value={finance.status}
                      onChange={(e) => setFinance((v) => ({ ...v, status: e.target.value as FinancialEntry["status"] }))}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago / Confirmado</option>
                      <option value="cancelado">Cancelado</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Observações do Lançamento">
                  <TextInput
                    value={finance.note}
                    onChange={(e) => setFinance((v) => ({ ...v, note: e.target.value }))}
                    placeholder="Ex: Mensalidade Referente ao mês atual"
                  />
                </Field>

                <Btn type="submit" variant="primary" disabled={!finance.tenantId || !finance.amount} className="w-full">
                  Salvar Lançamento Financeiro
                </Btn>
              </form>
            </div>

            {/* Extrato e Tabela de Lançamentos */}
            <div className="panel p-5 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line-soft pb-3">
                <div>
                  <p className="eyebrow">EXTRATO E FLUXO DE CAIXA</p>
                  <h3 className="font-display text-lg font-semibold uppercase text-fog-100">
                    Histórico de Lançamentos
                  </h3>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-1 rounded-md border border-line bg-ink-800 p-1 text-xs">
                  <button
                    onClick={() => setFinanceFilter("todos")}
                    className={`px-2.5 py-1 rounded transition ${financeFilter === "todos" ? "bg-brand-400/20 text-brand-300 font-semibold" : "text-fog-400"}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFinanceFilter("entradas")}
                    className={`px-2.5 py-1 rounded transition ${financeFilter === "entradas" ? "bg-mint-400/20 text-mint-400 font-semibold" : "text-fog-400"}`}
                  >
                    Entradas
                  </button>
                  <button
                    onClick={() => setFinanceFilter("saidas")}
                    className={`px-2.5 py-1 rounded transition ${financeFilter === "saidas" ? "bg-accent-400/20 text-accent-300 font-semibold" : "text-fog-400"}`}
                  >
                    Saídas
                  </button>
                  <button
                    onClick={() => setFinanceFilter("pendentes")}
                    className={`px-2.5 py-1 rounded transition ${financeFilter === "pendentes" ? "bg-accent-400/20 text-accent-300 font-semibold" : "text-fog-400"}`}
                  >
                    Pendentes
                  </button>
                </div>
              </div>

              {/* Tabela de Lançamentos */}
              <div className="divide-y divide-line-soft/70 overflow-x-auto max-h-[460px] overflow-y-auto pr-1">
                {filteredFinances.length === 0 ? (
                  <p className="py-8 text-center text-sm text-fog-500">Nenhum lançamento financeiro encontrado.</p>
                ) : (
                  filteredFinances.map((item) => {
                    const tenantName = tenants.find((t) => t.id === item.tenantId)?.name ?? "Cliente";
                    const isEntrada = (item.direction ?? "entrada") === "entrada";
                    return (
                      <div key={item.id} className="flex items-center justify-between py-3 text-sm gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`chip text-[10px] font-bold ${
                                isEntrada ? "border-mint-400/40 text-mint-400" : "border-accent-400/40 text-accent-300"
                              }`}
                            >
                              {isEntrada ? "🟢 ENTRADA" : "🔴 SAÍDA"}
                            </span>
                            <span className="font-semibold text-fog-100">{tenantName}</span>
                          </div>
                          <p className="text-xs text-fog-400">
                            {item.planName || "Plano Único"} · Venc: <strong className="text-fog-200">{item.dueDate || "—"}</strong>
                            {item.note && <span> · {item.note}</span>}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className={`num font-bold text-base ${isEntrada ? "text-mint-400" : "text-accent-300"}`}>
                              {isEntrada ? "+" : "-"} {money(item.amount)}
                            </span>
                            <p className="text-[10px] uppercase font-semibold text-fog-500">
                              {item.status === "pago" ? "✅ PAGO" : item.status === "pendente" ? "⏳ PENDENTE" : "❌ CANCELADO"}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1">
                            {item.status === "pendente" && onUpdateFinanceStatus && (
                              <button
                                onClick={() => onUpdateFinanceStatus(item.id, "pago")}
                                className="rounded border border-mint-400/40 bg-mint-400/10 px-2 py-1 text-xs font-semibold text-mint-400 hover:bg-mint-400/20"
                                title="Marcar como Pago"
                              >
                                Dar Baixa (Pago)
                              </button>
                            )}
                            {onDeleteFinance && (
                              <button
                                onClick={() => onDeleteFinance(item.id)}
                                className="rounded px-2 py-1 text-xs text-danger-400 hover:bg-danger-400/10"
                                title="Excluir lançamento"
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 3: REVENDAS & PARCEIROS ==================== */}
      {tab === "parceiros" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5 space-y-4">
            <div>
              <p className="eyebrow text-brand-400">PROGRAMA DE PARCERIA</p>
              <h3 className="font-display text-lg font-semibold uppercase text-fog-100">
                Cadastrar Revendedor ou Afiliado
              </h3>
              <p className="text-xs text-fog-500">
                Registre parceiros comerciais que revendem a plataforma e defina a comissão por cliente contratante.
              </p>
            </div>

            <form onSubmit={submitPartner} className="space-y-3">
              <Field label="Nome da Revenda / Representante *">
                <TextInput
                  value={partner.name}
                  onChange={(e) => setPartner((v) => ({ ...v, name: e.target.value }))}
                  placeholder="Nome do parceiro comercial"
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo de Parceria">
                  <Select
                    value={partner.type}
                    onChange={(e) => setPartner((v) => ({ ...v, type: e.target.value as PartnerAccount["type"] }))}
                  >
                    <option value="revendedor">Revendedor Direto</option>
                    <option value="afiliado">Afiliado / Indicação</option>
                  </Select>
                </Field>
                <Field label="Comissão (%) *">
                  <TextInput
                    value={partner.commissionPercent}
                    onChange={(e) => setPartner((v) => ({ ...v, commissionPercent: e.target.value }))}
                    placeholder="20,00"
                    inputMode="decimal"
                    required
                  />
                </Field>
              </div>

              <Field label="Contato (Telefone / WhatsApp / E-mail)">
                <TextInput
                  value={partner.contact}
                  onChange={(e) => setPartner((v) => ({ ...v, contact: e.target.value }))}
                  placeholder="revenda@parceiro.com"
                />
              </Field>

              <Btn type="submit" variant="soft" disabled={!partner.name.trim()} className="w-full">
                Cadastrar Parceiro Comercial
              </Btn>
            </form>
          </div>

          <div className="panel p-5 space-y-4">
            <div>
              <p className="eyebrow">PARCEIROS CADASTRADOS</p>
              <h3 className="font-display text-lg font-semibold uppercase text-fog-100">
                Carteira de Revendedores
              </h3>
            </div>

            <div className="divide-y divide-line-soft/70">
              {partners.length === 0 ? (
                <p className="py-6 text-center text-sm text-fog-500">Nenhum parceiro cadastrado.</p>
              ) : (
                partners.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <span className="font-semibold text-fog-100">{item.name}</span>
                      <p className="text-xs text-fog-400">
                        {item.type === "revendedor" ? "Revendedor Direto" : "Afiliado"} · {item.contact || "Sem contato"}
                      </p>
                    </div>
                    <span className="num font-bold text-brand-300">{item.commissionPercent}% comissão</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 4: AUDITORIA & LOGS ==================== */}
      {tab === "auditoria" && (
        <div className="panel p-5 space-y-3">
          <div>
            <p className="eyebrow text-brand-400">AUDITORIA E AUDIT TRAIL</p>
            <h3 className="font-display text-lg font-semibold uppercase text-fog-100">
              Histórico de Eventos e Atividades do Sistema
            </h3>
          </div>

          <div className="divide-y divide-line-soft/70 max-h-[500px] overflow-y-auto">
            {activity.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fog-200">{item.text}</p>
                  <p className="num text-xs text-fog-500">{new Date(item.at).toLocaleString("pt-BR")}</p>
                </div>
                <span className="chip border-line bg-ink-800 text-[10px] uppercase">{item.kind}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODAL DE COMPARTILHAMENTO DE ACESSO ==================== */}
      {selectedShareTenant && (
        <Modal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title="📲 Enviar Credenciais de Acesso ao Cliente"
          sub={`Organização: ${selectedShareTenant.name}`}
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
              <Btn variant="soft" onClick={() => copyToClipboard(getShareMessage(selectedShareTenant))}>
                📋 Copiar Mensagem
              </Btn>

              <div className="flex items-center gap-2">
                <Btn variant="primary" onClick={() => openWhatsApp(selectedShareTenant)}>
                  💬 Enviar via WhatsApp
                </Btn>
                <Btn onClick={() => setShareModalOpen(false)}>Fechar</Btn>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-md border border-brand-400/40 bg-brand-400/10 p-3 text-xs text-fog-300">
              <p className="font-semibold text-brand-300 mb-1">Dados Gerados com Sucesso!</p>
              <p>
                Você pode copiar o texto formatado abaixo ou enviar diretamente para o WhatsApp do responsável (<strong>{selectedShareTenant.responsibleName || selectedShareTenant.name}</strong>).
              </p>
            </div>

            <div className="space-y-1">
              <label className="lbl">Mensagem Pronta para Envio:</label>
              <TextArea
                rows={10}
                readOnly
                value={getShareMessage(selectedShareTenant)}
                className="font-mono text-xs leading-relaxed bg-ink-900 text-fog-100 border-line"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
