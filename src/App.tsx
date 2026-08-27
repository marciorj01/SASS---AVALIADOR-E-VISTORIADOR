import { useCallback, useEffect, useState, type ReactNode } from "react";
import Dashboard from "./components/Dashboard";
import Calculator, { type SavePayload } from "./components/Calculator";
import PhotoField from "./components/PhotoField";
import Inspections from "./components/Inspections";
import Evaluation from "./components/Evaluation";
import Login from "./components/Login";
import Cadastro from "./components/Cadastro";
import Settings from "./components/Settings";
import { Btn, Field, Modal, Select, TextArea, TextInput } from "./components/ui";
import {
  IcCalc,
  IcCamera,
  IcCheck,
  IcClip,
  IcCog,
  IcDash,
  IcInstall,
  IcLogout,
  IcUser,
  IcWifi,
  IcWifiOff,
  LogoMark,
} from "./components/icons";
import {
  clearSession,
  hashPass,
  INSPECTION_TYPES,
  nextCode,
  readSession,
  seedActivity,
  seedClients,
  seedInspections,
  seedMeasurements,
  seedPhotos,
  seedProfile,
  seedUsers,
  todayISO,
  uid,
  usePersist,
  writeSession,
  type Activity,
  type Client,
  type PropertyAssessment,
  type Inspection,
  type InspStatus,
  type Measurement,
  type Photo,
  type Profile,
  type Session,
  type User,
  type ViewId,
} from "./lib/store";

interface Toast {
  id: string;
  text: string;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const NAV: { id: ViewId; label: string; short: string; index: string; icon: ReactNode }[] = [
  { id: "painel", label: "Painel de campo", short: "Painel", index: "01", icon: <IcDash /> },
  { id: "calc", label: "Calculadora", short: "Medidas", index: "02", icon: <IcCalc /> },
  { id: "fotos", label: "Fotos & anotações", short: "Fotos", index: "03", icon: <IcCamera /> },
  { id: "vistorias", label: "Vistorias", short: "Vistorias", index: "04", icon: <IcClip /> },
  { id: "avaliacao", label: "Avaliação mercadológica", short: "Avaliação", index: "05", icon: <IcCalc /> },
  { id: "cadastro", label: "Cadastro do avaliador", short: "Cadastro", index: "06", icon: <IcUser /> },
  { id: "config", label: "Configurações", short: "Config", index: "07", icon: <IcCog /> },
];

const VIEW_META: Record<ViewId, { title: string; sub: string }> = {
  painel: { title: "Painel", sub: "resumo de campo" },
  calc: { title: "Calculadora", sub: "medidas & áreas" },
  fotos: { title: "Fotos & anotações", sub: "registro fotográfico" },
  vistorias: { title: "Vistorias", sub: "fichas & relatórios" },
  avaliacao: { title: "Avaliação", sub: "mercado & homogeneização" },
  cadastro: { title: "Cadastro", sub: "avaliador & vistoriador" },
  config: { title: "Configurações", sub: "acesso & preferências" },
};

function TopClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="num hidden items-center gap-2 rounded-md border border-line-soft bg-ink-800/60 px-3 py-1.5 text-[13px] text-fog-300 sm:inline-flex">
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-brand-400" />
      {now.toLocaleTimeString("pt-BR")}
    </span>
  );
}

export default function App() {
  /* ---------- estado persistente ---------- */
  const [inspections, setInspections] = usePersist<Inspection[]>("prumo.inspections", seedInspections);
  const [photos, setPhotos] = usePersist<Photo[]>("prumo.photos", seedPhotos);
  const [measurements, setMeasurements] = usePersist<Measurement[]>("prumo.measurements", seedMeasurements);
  const [activity, setActivity] = usePersist<Activity[]>("prumo.activity", seedActivity);
  const [assessments, setAssessments] = usePersist<PropertyAssessment[]>("prumo.assessments", () => []);

  /* ---------- autenticação, perfil e vistoriados ---------- */
  const [users, setUsers] = usePersist<User[]>("prumo.users", seedUsers);
  const [profile, setProfile] = usePersist<Profile>("prumo.profile", seedProfile);
  const [clients, setClients] = usePersist<Client[]>("prumo.clients", seedClients);
  const [hasLoggedIn, setHasLoggedIn] = usePersist<boolean>("prumo.logged", () => false);
  const [session, setSession] = useState<Session | null>(() => readSession());

  /* ---------- estado de navegação ---------- */
  const [view, setView] = useState<ViewId>("painel");
  const [selectedInsp, setSelectedInsp] = useState<string | null>(null);
  const [focusPhoto, setFocusPhoto] = useState<string | null>(null);

  /* ---------- toasts ---------- */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((text: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  /* ---------- conectividade & PWA ---------- */
  const [online, setOnline] = useState(() => navigator.onLine);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const onBip = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvt(null);
      setInstalled(true);
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const doInstall = useCallback(async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") toast("Prumo instalado neste dispositivo.");
    setInstallEvt(null);
  }, [installEvt, toast]);

  /* ---------- diário de atividade ---------- */
  const log = useCallback((kind: Activity["kind"], text: string) => {
    setActivity((prev) => [{ id: uid(), text, at: new Date().toISOString(), kind }, ...prev].slice(0, 40));
  }, [setActivity]);

  /* ---------- ações: autenticação, perfil e vistoriados ---------- */
  const handleLogin = useCallback(
    (username: string, pass: string, remember: boolean): string | null => {
      const u = users.find((x) => x.username === username.trim().toLowerCase());
      if (!u || u.pass !== hashPass(pass)) return "Usuário ou senha inválidos. No primeiro acesso use admin / admin.";
      writeSession({ userId: u.id, username: u.username, name: u.name, loginAt: new Date().toISOString() }, remember);
      setSession(readSession());
      setHasLoggedIn(true);
      return null;
    },
    [users, setHasLoggedIn]
  );

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setView("painel");
  }, []);

  const changePass = useCallback(
    (current: string, next: string): string | null => {
      if (!session) return "Sessão expirada — entre novamente.";
      const u = users.find((x) => x.id === session.userId);
      if (!u || u.pass !== hashPass(current)) return "A senha atual informada está incorreta.";
      if (next.length < 4) return "A nova senha precisa ter ao menos 4 caracteres.";
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, pass: hashPass(next) } : x)));
      return null;
    },
    [session, users, setUsers]
  );

  const saveProfile = useCallback(
    (p: Profile) => {
      setProfile(p);
      toast("Cadastro profissional salvo.");
    },
    [setProfile, toast]
  );

  const addClient = useCallback(
    (c: Client) => {
      setClients((prev) => [c, ...prev]);
      log("vistoria", `Vistoriado cadastrado: ${c.name}`);
      toast(`Vistoriado “${c.name}” cadastrado.`);
    },
    [setClients, log, toast]
  );

  const deleteClient = useCallback(
    (id: string) => {
      const c = clients.find((x) => x.id === id);
      setClients((prev) => prev.filter((x) => x.id !== id));
      toast(`Vistoriado “${c?.name ?? ""}” removido.`);
    },
    [clients, setClients, toast]
  );

  /* ---------- ações: medições ---------- */
  const saveMeasurement = useCallback(
    (p: SavePayload) => {
      const m: Measurement = { id: uid(), at: new Date().toISOString(), ...p };
      setMeasurements((prev) => [m, ...prev]);
      const insp = inspections.find((i) => i.id === p.inspectionId);
      log("calc", `Medição salva: “${p.label}”${insp ? ` na vistoria ${insp.code}` : ""}`);
      toast(insp ? `Medição vinculada à vistoria ${insp.code}.` : "Medição salva no histórico.");
    },
    [inspections, log, setMeasurements, toast]
  );

  /* ---------- ações: fotos ---------- */
  const addPhotos = useCallback(
    (srcs: string[]): string[] => {
      const now = Date.now();
      const items: Photo[] = srcs.map((src, i) => ({
        id: uid(),
        src,
        caption: "",
        category: "Outro",
        inspectionId: null,
        notes: [],
        at: new Date(now + i).toISOString(),
      }));
      setPhotos((prev) => [...items, ...prev]);
      log("foto", srcs.length === 1 ? "Foto adicionada ao acervo de campo" : `${srcs.length} fotos adicionadas ao acervo de campo`);
      return items.map((i) => i.id);
    },
    [log, setPhotos]
  );

  const updatePhoto = useCallback(
    (id: string, patch: Partial<Photo>) => {
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [setPhotos]
  );

  const deletePhoto = useCallback(
    (id: string) => {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    },
    [setPhotos]
  );

  const addNote = useCallback(
    (photoId: string, text: string) => {
      const ph = photos.find((p) => p.id === photoId);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? { ...p, notes: [{ id: uid(), text, at: new Date().toISOString() }, ...p.notes] }
            : p
        )
      );
      log("nota", `Anotação registrada em “${ph?.caption || "foto sem legenda"}”`);
    },
    [photos, log, setPhotos]
  );

  const deleteNote = useCallback(
    (photoId: string, noteId: string) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, notes: p.notes.filter((n) => n.id !== noteId) } : p))
      );
    },
    [setPhotos]
  );

  /* ---------- ações: vistorias ---------- */
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({
    client: "",
    address: "",
    city: "",
    type: INSPECTION_TYPES[0],
    date: todayISO(),
    notes: "",
  });

  const openNew = useCallback(() => {
    setForm({ client: "", address: "", city: "", type: INSPECTION_TYPES[0], date: todayISO(), notes: "" });
    setNewOpen(true);
  }, []);

  const createInspection = useCallback(() => {
    const insp: Inspection = {
      id: uid(),
      code: nextCode(inspections),
      client: form.client.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      type: form.type,
      status: "agendada",
      date: form.date || todayISO(),
      notes: form.notes.trim(),
    };
    setInspections((prev) => [insp, ...prev]);
    log("vistoria", `Vistoria ${insp.code} criada para ${insp.client}`);
    toast(`Vistoria ${insp.code} criada.`);
    setNewOpen(false);
    setSelectedInsp(insp.id);
    setView("vistorias");
  }, [form, inspections, log, setInspections, toast]);

  const setInspStatus = useCallback(
    (id: string, status: InspStatus) => {
      const insp = inspections.find((i) => i.id === id);
      setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      const msg =
        status === "campo"
          ? `Vistoria ${insp?.code ?? ""} em campo iniciada`
          : status === "concluida"
            ? `Vistoria ${insp?.code ?? ""} concluída`
            : `Vistoria ${insp?.code ?? ""} reaberta`;
      log("vistoria", msg);
      toast(
        status === "campo" ? "Vistoria marcada como em campo." : status === "concluida" ? "Vistoria concluída." : "Vistoria reaberta."
      );
    },
    [inspections, log, setInspections, toast]
  );

  const saveAssessment = useCallback((assessment: PropertyAssessment) => {
    setAssessments((prev) => [assessment, ...prev.filter((item) => item.id !== assessment.id)]);
    log("calc", `Avaliação mercadológica salva para ${assessment.address}`);
  }, [log, setAssessments]);

  const deleteAssessment = useCallback((id: string) => {
    setAssessments((prev) => prev.filter((item) => item.id !== id));
  }, [setAssessments]);

  const deleteInspection = useCallback(
    (id: string) => {
      const insp = inspections.find((i) => i.id === id);
      setInspections((prev) => prev.filter((i) => i.id !== id));
      setPhotos((prev) => prev.map((p) => (p.inspectionId === id ? { ...p, inspectionId: null } : p)));
      setMeasurements((prev) => prev.map((m) => (m.inspectionId === id ? { ...m, inspectionId: null } : m)));
      setSelectedInsp(null);
      log("vistoria", `Vistoria ${insp?.code ?? ""} excluída (fotos e medições foram desvinculadas)`);
      toast("Vistoria excluída. Fotos e medições permanecem no acervo.");
    },
    [inspections, log, setInspections, setPhotos, setMeasurements, toast]
  );

  /* ---------- navegação cruzada ---------- */
  const openInspection = useCallback((id: string) => {
    setSelectedInsp(id);
    setView("vistorias");
  }, []);

  const openPhoto = useCallback((id: string) => {
    setFocusPhoto(id);
    setView("fotos");
  }, []);

  const consumeFocus = useCallback(() => setFocusPhoto(null), []);

  const meta = VIEW_META[view];

  /* ---------- portão de acesso ---------- */
  if (!session) {
    return <Login firstUse={!hasLoggedIn} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      {/* ---------- barra lateral ---------- */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line-soft bg-ink-900/85 backdrop-blur md:flex">
        <div className="ruler-y pointer-events-none absolute inset-y-0 right-0 w-2.5" />
        <div className="flex h-16 items-center gap-2.5 border-b border-line-soft px-5">
          <LogoMark className="text-brand-400" />
          <div>
            <p className="font-display text-xl font-bold uppercase leading-none tracking-[0.18em] text-fog-100">Prumo</p>
            <p className="num mt-0.5 text-[9.5px] uppercase tracking-[0.16em] text-fog-600">vistoria & avaliação</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((n) => {
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setView(n.id);
                  if (n.id !== "vistorias") setSelectedInsp(null);
                }}
                className={`group flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                  active
                    ? "border-line bg-ink-700/80 text-brand-300 shadow-[inset_2px_0_0_0_var(--color-brand-400)]"
                    : "border-transparent text-fog-500 hover:bg-ink-800/70 hover:text-fog-100"
                }`}
              >
                <span className={active ? "text-brand-400" : "text-fog-600 group-hover:text-fog-300"}>{n.icon}</span>
                <span className="flex-1 font-medium">{n.label}</span>
                <span className={`num text-[10px] ${active ? "text-brand-400" : "text-fog-600"}`}>{n.index}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line-soft px-5 py-4">
          <p className="num text-[10px] uppercase tracking-[0.16em] text-fog-600">Armazenamento local</p>
          <p className="mt-1 text-[11.5px] leading-snug text-fog-500">
            {photos.length} foto(s) · {measurements.length} medição(ões) neste dispositivo
          </p>
          <p className="num mt-2 text-[10px] text-fog-600">Prumo v1.1 · PWA · acesso restrito</p>
        </div>
      </aside>

      <div className="md:pl-60">
        {/* ---------- topo ---------- */}
        <header className="no-print sticky top-0 z-30 border-b border-line-soft bg-ink-950/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-brand-400 md:hidden"><LogoMark width={22} height={22} /></span>
              <div className="min-w-0">
                <p className="font-display truncate text-lg font-semibold uppercase leading-none tracking-wide text-fog-100">
                  {meta.title}
                </p>
                <p className="num hidden text-[10px] uppercase tracking-[0.18em] text-fog-600 sm:block">{meta.sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`chip ${online ? "border-mint-400/40 text-mint-400" : "border-accent-400/50 bg-accent-400/10 text-accent-300"}`}
                title={online ? "Conectado" : "Offline — dados salvos localmente"}
              >
                {online ? <IcWifi width={12} height={12} /> : <IcWifiOff width={12} height={12} />}
                <span className="hidden sm:inline">{online ? "Online" : "Offline"}</span>
              </span>
              <TopClock />
              {installed ? (
                <span className="chip border-mint-400/40 text-mint-400" title="Executando como aplicativo">
                  <IcCheck width={12} height={12} /> <span className="hidden sm:inline">App</span>
                </span>
              ) : installEvt ? (
                <Btn variant="primary" className="h-8 px-3 text-xs" onClick={() => void doInstall()}>
                  <IcInstall width={14} height={14} /> Instalar app
                </Btn>
              ) : null}
              <span
                className="chip cursor-pointer border-brand-400/40 bg-brand-400/10 text-brand-300 transition hover:bg-brand-400/20"
                title={`Sessão de ${session.name} (${session.username}) — clique para ir ao cadastro`}
                onClick={() => setView("cadastro")}
              >
                <IcUser width={12} height={12} />
                <span className="hidden max-w-[130px] truncate sm:inline">{profile.name.trim() || session.name}</span>
              </span>
              <button
                onClick={handleLogout}
                title="Encerrar sessão"
                aria-label="Encerrar sessão"
                className="rounded-md border border-line bg-ink-800/60 p-1.5 text-fog-500 transition hover:border-danger-400/50 hover:text-danger-400 active:scale-95"
              >
                <IcLogout width={15} height={15} />
              </button>
            </div>
          </div>
        </header>

        {/* ---------- conteúdo ---------- */}
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-14">
          <div key={view} className="animate-rise">
            {view === "painel" && (
              <Dashboard
                inspections={inspections}
                photos={photos}
                measurements={measurements}
                activity={activity}
                online={online}
                canInstall={!!installEvt}
                installed={installed}
                onNavigate={setView}
                onNewInspection={openNew}
                onOpenInspection={openInspection}
                onInstall={() => void doInstall()}
              />
            )}
            {view === "calc" && (
              <Calculator inspections={inspections} onSave={saveMeasurement} toast={toast} />
            )}
            {view === "fotos" && (
              <PhotoField
                photos={photos}
                inspections={inspections}
                focusId={focusPhoto}
                onFocusConsumed={consumeFocus}
                onAddPhotos={addPhotos}
                onUpdate={updatePhoto}
                onDelete={deletePhoto}
                onAddNote={addNote}
                onDeleteNote={deleteNote}
                toast={toast}
              />
            )}
            {view === "vistorias" && (
              <Inspections
                inspections={inspections}
                photos={photos}
                measurements={measurements}
                profile={profile}
                selectedId={selectedInsp}
                onSelect={setSelectedInsp}
                onSetStatus={setInspStatus}
                onDelete={deleteInspection}
                onNew={openNew}
                onOpenPhoto={openPhoto}
                onGotoCalc={() => setView("calc")}
                onGotoFotos={() => setView("fotos")}
                toast={toast}
              />
            )}
            {view === "avaliacao" && (
              <Evaluation
                assessments={assessments}
                inspections={inspections}
                profile={profile}
                onSave={saveAssessment}
                onDelete={deleteAssessment}
                toast={toast}
              />
            )}
            {view === "cadastro" && <Cadastro profile={profile} onSave={saveProfile} />}
            {view === "config" && (
              <Settings
                profile={profile}
                onSaveProfile={saveProfile}
                clients={clients}
                onAddClient={addClient}
                onDeleteClient={deleteClient}
                session={session}
                onChangePass={changePass}
                onLogout={handleLogout}
                online={online}
                canInstall={!!installEvt}
                installed={installed}
                onInstall={() => void doInstall()}
                data={{ inspections, photos, measurements, activity, assessments }}
                toast={toast}
              />
            )}
          </div>
        </main>
      </div>

      {/* ---------- navegação móvel ---------- */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-ink-900/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((n) => {
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setView(n.id);
                  if (n.id !== "vistorias") setSelectedInsp(null);
                }}
                className={`relative flex flex-col items-center gap-1 py-2 text-[9px] font-medium transition ${
                  active ? "text-brand-300" : "text-fog-600"
                }`}
              >
                {active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-400" />}
                {n.icon}
                {n.short}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---------- toasts ---------- */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[70] space-y-2 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="panel pointer-events-auto flex animate-pop items-center gap-2.5 border-brand-400/40 px-4 py-3 text-sm text-fog-100"
          >
            <span className="text-brand-400"><IcCheck width={15} height={15} /></span>
            {t.text}
          </div>
        ))}
      </div>

      {/* ---------- nova vistoria ---------- */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nova vistoria"
        sub={`Cadastro nº ${nextCode(inspections)} — os dados ficam salvos neste dispositivo.`}
        footer={
          <>
            <Btn onClick={() => setNewOpen(false)}>Cancelar</Btn>
            <Btn variant="primary" disabled={!form.client.trim() || !form.address.trim()} onClick={createInspection}>
              <IcCheck width={15} height={15} /> Criar vistoria
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Cliente *" hint={clients.length > 0 ? "Sugestões dos vistoriados cadastrados em Configurações." : undefined}>
            <TextInput
              list="prumo-clientes"
              value={form.client}
              placeholder="Nome do contratante"
              onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
            />
            <datalist id="prumo-clientes">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Endereço do imóvel *">
            <TextInput
              value={form.address}
              placeholder="Rua, número, bairro"
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Município / UF">
              <TextInput
                value={form.city}
                placeholder="Ex.: Jundiaí / SP"
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </Field>
            <Field label="Data da vistoria">
              <TextInput
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Tipo de serviço">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {INSPECTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Observações iniciais">
            <TextArea
              value={form.notes}
              placeholder="Objetivo do laudo, documentos a conferir, pontos de atenção…"
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
