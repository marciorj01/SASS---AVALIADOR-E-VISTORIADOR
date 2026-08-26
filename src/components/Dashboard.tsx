import { useEffect, useState, type ReactNode } from "react";
import {
  fmtAreaSmart,
  timeAgo,
  fmtDate,
  type Activity,
  type Inspection,
  type Measurement,
  type Photo,
  type ViewId,
} from "../lib/store";
import { Btn, EmptyState, Reveal, SectionHead, StatusChip } from "./ui";
import {
  IcCamera,
  IcCheck,
  IcClip,
  IcInstall,
  IcNote,
  IcPin,
  IcPlus,
  IcRuler,
  IcWifiOff,
  LogoMark,
} from "./icons";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function KindIcon({ kind }: { kind: Activity["kind"] }) {
  const cls = "h-8 w-8 shrink-0 rounded-md border border-line-soft bg-ink-800 flex items-center justify-center";
  if (kind === "calc") return <span className={`${cls} text-brand-400`}><IcRuler width={15} height={15} /></span>;
  if (kind === "foto") return <span className={`${cls} text-accent-400`}><IcCamera width={15} height={15} /></span>;
  if (kind === "nota") return <span className={`${cls} text-fog-300`}><IcNote width={15} height={15} /></span>;
  return <span className={`${cls} text-mint-400`}><IcClip width={15} height={15} /></span>;
}

export default function Dashboard({
  inspections,
  photos,
  measurements,
  activity,
  online,
  canInstall,
  installed,
  onNavigate,
  onNewInspection,
  onOpenInspection,
  onInstall,
}: {
  inspections: Inspection[];
  photos: Photo[];
  measurements: Measurement[];
  activity: Activity[];
  online: boolean;
  canInstall: boolean;
  installed: boolean;
  onNavigate: (v: ViewId) => void;
  onNewInspection: () => void;
  onOpenInspection: (id: string) => void;
  onInstall: () => void;
}) {
  const now = useNow();
  const active = inspections.filter((i) => i.status !== "concluida");
  const emCampo = inspections.filter((i) => i.status === "campo");
  const totalArea = measurements.reduce((s, m) => s + (m.areaM2 ?? 0), 0);
  const next = [...active].sort((a, b) => a.date.localeCompare(b.date))[0];

  const hh = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const ss = now.toLocaleTimeString("pt-BR", { second: "2-digit" }).slice(-2);
  const dateLong = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const stats: { label: string; value: ReactNode; tick: string }[] = [
    { label: "Vistorias ativas", value: active.length, tick: "bg-brand-400" },
    { label: "Fotografias", value: photos.length, tick: "bg-accent-400" },
    { label: "Medições salvas", value: measurements.length, tick: "bg-mint-400" },
    { label: "Área total medida", value: fmtAreaSmart(totalArea), tick: "bg-fog-500" },
  ];

  const quick: { icon: ReactNode; title: string; desc: string; act: () => void }[] = [
    { icon: <IcRuler />, title: "Medir terreno ou planta", desc: "Retângulo, triângulo, trapézio, polígono e cômodos", act: () => onNavigate("calc") },
    { icon: <IcCamera />, title: "Fotografar com anotação", desc: "Registre o local e vincule notas do perito à foto", act: () => onNavigate("fotos") },
    { icon: <IcPlus />, title: "Nova vistoria", desc: "Cadastre cliente, endereço e tipo de laudo", act: onNewInspection },
  ];

  return (
    <div>
      <SectionHead
        index="01"
        title="Painel de campo"
        sub="Visão geral das vistorias, medições e registros fotográficos deste dispositivo."
      />

      {/* Frente de trabalho + retomada */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div className="panel blueprint scanline relative h-full overflow-hidden p-6 sm:p-7">
            <svg
              className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-brand-400/25"
              viewBox="0 0 200 200" fill="none" aria-hidden
            >
              <circle cx="100" cy="100" r="86" stroke="currentColor" strokeWidth="1.5" />
              <circle className="dash-ring" cx="100" cy="100" r="64" stroke="currentColor" strokeWidth="1.5" />
              <path d="M100 6v26M100 168v26M6 100h26M168 100h26" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="4" fill="#ffb224" />
            </svg>

            <p className="num text-[11px] tracking-[0.22em] text-fog-500">HORÁRIO DE CAMPO</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="num text-[64px] font-semibold leading-none text-fog-100 sm:text-[84px]">{hh}</span>
              <span className="num animate-blink text-2xl text-accent-400 sm:text-3xl">:{ss}</span>
            </div>
            <p className="mt-2 text-sm capitalize text-fog-500">{dateLong}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="chip border-accent-400/50 bg-accent-400/10 text-accent-300">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent-400" />
                {emCampo.length} em campo
              </span>
              <span className="chip border-line text-fog-300">{active.length - emCampo.length} agendada(s)</span>
              <span className="chip border-line text-fog-300">{measurements.length} medições</span>
            </div>

            {!online && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-accent-400/40 bg-accent-400/10 px-3 py-2 text-xs text-accent-300">
                <IcWifiOff width={15} height={15} />
                Modo offline ativo — fotos, notas e medições ficam salvas neste dispositivo.
              </div>
            )}

            {next && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
                <div className="min-w-0">
                  <p className="num text-[10.5px] tracking-[0.18em] text-fog-600">PRÓXIMA VISTORIA</p>
                  <p className="mt-1 truncate font-semibold text-fog-100">
                    <span className="num text-brand-400">{next.code}</span> · {next.client}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fog-500">
                    <IcPin width={12} height={12} /> {next.address} — {fmtDate(next.date)}
                  </p>
                </div>
                <Btn variant="primary" onClick={() => onOpenInspection(next.id)}>Abrir ficha</Btn>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={90} className="lg:col-span-5">
          <div className="panel flex h-full flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fog-100">
                Continuar vistoria
              </h3>
              <button onClick={onNewInspection} className="num text-[11px] tracking-wider text-brand-400 transition hover:text-brand-300">
                + NOVA
              </button>
            </div>
            {active.length === 0 ? (
              <EmptyState
                icon={<IcClip />}
                title="Nada em andamento"
                text="Crie uma vistoria para começar a registrar medições e fotos em campo."
                action={<Btn variant="primary" onClick={onNewInspection}><IcPlus width={15} height={15} /> Nova vistoria</Btn>}
              />
            ) : (
              <ul className="space-y-2">
                {active.slice(0, 4).map((i) => {
                  const nPhotos = photos.filter((p) => p.inspectionId === i.id).length;
                  return (
                    <li key={i.id}>
                      <button
                        onClick={() => onOpenInspection(i.id)}
                        className="group flex w-full items-center gap-3 rounded-lg border border-line-soft bg-ink-800/50 px-3.5 py-3 text-left transition hover:border-brand-400/45 hover:bg-ink-700/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="num text-[11px] tracking-wider text-brand-400">{i.code}</p>
                          <p className="truncate text-sm font-semibold text-fog-100">{i.client}</p>
                          <p className="truncate text-xs text-fog-500">{i.address}</p>
                        </div>
                        <span className="chip border-line text-fog-500">
                          <IcCamera width={12} height={12} /> {nPhotos}
                        </span>
                        <StatusChip status={i.status} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>
      </div>

      {/* Faixa de indicadores */}
      <Reveal delay={60}>
        <div className="panel mt-4 grid grid-cols-2 sm:grid-cols-4">
          {stats.map((s, idx) => (
            <div
              key={s.label}
              className={`border-line-soft p-5 ${idx === 1 ? "border-l" : ""} ${
                idx === 2 ? "border-t sm:border-l sm:border-t-0" : ""
              } ${idx === 3 ? "border-l border-t sm:border-t-0" : ""}`}
            >
              <span className={`block h-0.5 w-7 ${s.tick}`} />
              <p className="num mt-3 text-[10.5px] uppercase tracking-[0.16em] text-fog-500">{s.label}</p>
              <p className="num mt-1 text-[26px] font-semibold leading-tight text-fog-100">{s.value}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Atividade + acesso rápido */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div className="panel h-full p-5">
            <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fog-100">
              Atividade recente
            </h3>
            {activity.length === 0 ? (
              <p className="mt-6 text-sm text-fog-500">Nenhum registro ainda — meça, fotografe e anote para alimentar o diário de campo.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line-soft/70">
                {activity.slice(0, 7).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <KindIcon kind={a.kind} />
                    <p className="min-w-0 flex-1 truncate text-sm text-fog-300">{a.text}</p>
                    <span className="num shrink-0 text-[11px] text-fog-600">{timeAgo(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        <Reveal delay={90} className="lg:col-span-5">
          <div className="flex h-full flex-col gap-4">
            <div className="panel p-5">
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fog-100">Acesso rápido</h3>
              <ul className="mt-3 space-y-2">
                {quick.map((q) => (
                  <li key={q.title}>
                    <button
                      onClick={q.act}
                      className="group flex w-full items-center gap-3 rounded-lg border border-line-soft bg-ink-800/50 px-3.5 py-2.5 text-left transition hover:border-accent-400/45 hover:bg-ink-700/60"
                    >
                      <span className="text-accent-400 transition group-hover:scale-110">{q.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-fog-100">{q.title}</span>
                        <span className="block truncate text-xs text-fog-500">{q.desc}</span>
                      </span>
                      <span className="num text-fog-600 transition group-hover:translate-x-0.5 group-hover:text-accent-300">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel flex items-center gap-3 border-dashed p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line-soft ${installed ? "text-mint-400" : "text-brand-400"}`}>
                {installed ? <IcCheck /> : <IcInstall />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fog-100">
                  {installed ? "Aplicativo instalado" : canInstall ? "Instale o Prumo neste dispositivo" : "Disponível como app (PWA)"}
                </p>
                <p className="text-xs text-fog-500">
                  {installed
                    ? "Execute em tela cheia, mesmo sem conexão."
                    : canInstall
                      ? "Ícone na tela inicial + funcionamento offline."
                      : "No navegador: menu ⋮ → “Adicionar à tela inicial”. Dados 100% locais."}
                </p>
              </div>
              {canInstall && !installed && (
                <Btn variant="primary" onClick={onInstall} className="shrink-0"><IcInstall width={15} height={15} /> Instalar</Btn>
              )}
            </div>

            <p className="flex items-center justify-center gap-2 pb-1 text-center text-[11px] text-fog-600">
              <LogoMark width={13} height={13} className="text-fog-600" />
              Prumo v1.0 — diário de campo do avaliador imobiliário
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
