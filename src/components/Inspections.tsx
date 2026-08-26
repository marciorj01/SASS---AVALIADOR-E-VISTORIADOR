import { useState } from "react";
import {
  fmtArea,
  fmtDate,
  fmtTime,
  timeAgo,
  type Inspection,
  type InspStatus,
  type Measurement,
  type Photo,
} from "../lib/store";
import { Btn, EmptyState, SectionHead, Seg, StatusChip } from "./ui";
import {
  IcBack,
  IcCalc,
  IcCamera,
  IcCheck,
  IcChevR,
  IcClip,
  IcClock,
  IcFlag,
  IcNote,
  IcPin,
  IcPlus,
  IcPrinter,
  IcTrash,
  LogoMark,
} from "./icons";

/* ---------- Relatório imprimível ---------- */

const GROUP_LABEL: Record<string, string> = {
  terreno: "Terreno",
  planta: "Planta",
  conversao: "Conversão",
};

function ReportSheet({
  insp,
  photos,
  measurements,
}: {
  insp: Inspection;
  photos: Photo[];
  measurements: Measurement[];
}) {
  const rPhotos = photos.filter((p) => p.inspectionId === insp.id);
  const rMeas = measurements.filter((m) => m.inspectionId === insp.id);
  const statusLabel: Record<InspStatus, string> = {
    agendada: "Agendada",
    campo: "Em campo",
    concluida: "Concluída",
  };

  return (
    <div className="print-area rounded-lg bg-paper-50 p-6 text-[#22304a] shadow-2xl sm:p-9">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#22304a] pb-5">
        <div className="flex items-center gap-3">
          <LogoMark width={34} height={34} className="text-[#22304a]" />
          <div>
            <p className="font-display text-2xl font-bold uppercase leading-none tracking-[0.14em]">Prumo</p>
            <p className="num mt-1 text-[10px] uppercase tracking-[0.2em] text-[#6b7a94]">
              Vistoria &amp; Avaliação de Imóveis
            </p>
          </div>
        </div>
        <div className="num text-right text-[11px] leading-relaxed text-[#42536f]">
          <p>Relatório nº <strong className="text-[#22304a]">{insp.code}</strong></p>
          <p>Emissão: {fmtDate(new Date().toISOString())} {fmtTime(new Date().toISOString())}</p>
          <p>Situação: {statusLabel[insp.status]}</p>
        </div>
      </header>

      <h2 className="font-display mt-6 text-[26px] font-semibold uppercase leading-tight tracking-wide">
        Relatório de vistoria e registro fotográfico
      </h2>

      <section className="mt-5">
        <h3 className="num text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#6b7a94]">1 · Identificação</h3>
        <dl className="mt-2 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 border-b border-[#d9d3c2] py-1.5">
            <dt className="text-[#6b7a94]">Cliente</dt><dd className="text-right font-semibold">{insp.client}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[#d9d3c2] py-1.5">
            <dt className="text-[#6b7a94]">Data da vistoria</dt><dd className="font-semibold">{fmtDate(insp.date)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[#d9d3c2] py-1.5">
            <dt className="text-[#6b7a94]">Endereço</dt><dd className="text-right font-semibold">{insp.address}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[#d9d3c2] py-1.5">
            <dt className="text-[#6b7a94]">Município</dt><dd className="font-semibold">{insp.city || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[#d9d3c2] py-1.5 sm:col-span-2">
            <dt className="text-[#6b7a94]">Tipo de serviço</dt><dd className="font-semibold">{insp.type}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6">
        <h3 className="num text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#6b7a94]">
          2 · Medições ({rMeas.length})
        </h3>
        {rMeas.length === 0 ? (
          <p className="mt-2 text-sm text-[#6b7a94]">Nenhuma medição vinculada a esta vistoria.</p>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[#22304a] text-left text-[11px] uppercase tracking-wider text-[#42536f]">
                <th className="py-2 pr-3 font-semibold">Descrição</th>
                <th className="py-2 pr-3 font-semibold">Detalhes</th>
                <th className="py-2 text-right font-semibold">Área</th>
              </tr>
            </thead>
            <tbody>
              {rMeas.map((m) => (
                <tr key={m.id} className="border-b border-[#d9d3c2] align-top">
                  <td className="py-2 pr-3 font-semibold">{m.label}</td>
                  <td className="py-2 pr-3 text-[#42536f]">{m.detail}</td>
                  <td className="num py-2 text-right font-semibold">{m.areaM2 != null ? fmtArea(m.areaM2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-6">
        <h3 className="num text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#6b7a94]">
          3 · Registro fotográfico ({rPhotos.length})
        </h3>
        {rPhotos.length === 0 ? (
          <p className="mt-2 text-sm text-[#6b7a94]">Nenhuma fotografia vinculada a esta vistoria.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {rPhotos.map((p, idx) => (
              <figure key={p.id} className="break-inside-avoid">
                <img
                  src={p.src}
                  alt={p.caption || `Foto ${idx + 1}`}
                  className="w-full rounded border border-[#c9c2ae] object-cover"
                  style={{ maxHeight: 220 }}
                />
                <figcaption className="mt-1.5">
                  <p className="text-sm font-semibold">
                    Foto {idx + 1} — {p.caption || "Sem legenda"} <span className="font-normal text-[#6b7a94]">({p.category})</span>
                  </p>
                  <p className="num text-[10px] text-[#6b7a94]">{fmtDate(p.at)} · {fmtTime(p.at)}</p>
                  {p.notes.length > 0 && (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] text-[#42536f]">
                      {p.notes.map((n) => (
                        <li key={n.id}>{n.text}</li>
                      ))}
                    </ul>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="num text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#6b7a94]">4 · Observações do perito</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#22304a]">
          {insp.notes || "Sem observações gerais registradas."}
        </p>
      </section>

      <div className="mt-14 grid grid-cols-2 gap-10">
        <div className="border-t border-[#22304a] pt-2 text-center text-[11px] text-[#42536f]">
          Perito / vistoriador responsável
        </div>
        <div className="border-t border-[#22304a] pt-2 text-center text-[11px] text-[#42536f]">
          Cliente ou representante
        </div>
      </div>

      <p className="num mt-10 border-t border-[#d9d3c2] pt-3 text-center text-[10px] text-[#6b7a94]">
        Documento gerado pelo Prumo em {fmtDate(new Date().toISOString())} às {fmtTime(new Date().toISOString())} — registros capturados em campo e armazenados no dispositivo do avaliador.
      </p>
    </div>
  );
}

/* ---------- componente principal ---------- */

type Tab = "fotos" | "medicoes" | "relatorio";
type StatusFilter = "todas" | InspStatus;

export default function Inspections({
  inspections,
  photos,
  measurements,
  selectedId,
  onSelect,
  onSetStatus,
  onDelete,
  onNew,
  onOpenPhoto,
  onGotoCalc,
  onGotoFotos,
}: {
  inspections: Inspection[];
  photos: Photo[];
  measurements: Measurement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSetStatus: (id: string, status: InspStatus) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onOpenPhoto: (id: string) => void;
  onGotoCalc: () => void;
  onGotoFotos: () => void;
}) {
  const [filter, setFilter] = useState<StatusFilter>("todas");
  const [tab, setTab] = useState<Tab>("fotos");
  const [confirmDel, setConfirmDel] = useState(false);

  const selected = inspections.find((i) => i.id === selectedId) ?? null;
  const list = inspections
    .filter((i) => (filter === "todas" ? true : i.status === filter))
    .sort((a, b) => b.date.localeCompare(a.date));

  /* ---------- ficha detalhada ---------- */
  if (selected) {
    const iPhotos = photos.filter((p) => p.inspectionId === selected.id);
    const iMeas = measurements.filter((m) => m.inspectionId === selected.id);

    return (
      <div>
        <button
          onClick={() => {
            onSelect(null);
            setConfirmDel(false);
          }}
          className="mb-4 inline-flex items-center gap-2 text-sm text-fog-500 transition hover:text-brand-300"
        >
          <IcBack width={15} height={15} /> Voltar para a lista
        </button>

        <div className="panel blueprint relative overflow-hidden p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="num text-[11px] tracking-[0.22em] text-brand-400">{selected.code}</p>
              <h1 className="font-display mt-1 text-3xl font-semibold uppercase leading-none tracking-wide text-fog-100 sm:text-4xl">
                {selected.client}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-fog-500">
                <IcPin width={13} height={13} /> {selected.address}{selected.city ? ` — ${selected.city}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusChip status={selected.status} />
                <span className="chip border-line text-fog-300">{selected.type}</span>
                <span className="chip border-line text-fog-300">
                  <IcClock width={11} height={11} /> {fmtDate(selected.date)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2">
              {selected.status === "agendada" && (
                <Btn variant="primary" onClick={() => onSetStatus(selected.id, "campo")}>
                  <IcFlag width={15} height={15} /> Iniciar em campo
                </Btn>
              )}
              {selected.status === "campo" && (
                <Btn variant="mint" onClick={() => onSetStatus(selected.id, "concluida")}>
                  <IcCheck width={15} height={15} /> Concluir vistoria
                </Btn>
              )}
              {selected.status === "concluida" && (
                <Btn onClick={() => onSetStatus(selected.id, "campo")}>
                  <IcFlag width={15} height={15} /> Reabrir em campo
                </Btn>
              )}
              {confirmDel ? (
                <div className="flex gap-2">
                  <Btn onClick={() => setConfirmDel(false)}>Cancelar</Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      onDelete(selected.id);
                      setConfirmDel(false);
                    }}
                  >
                    Confirmar
                  </Btn>
                </div>
              ) : (
                <Btn variant="danger" onClick={() => setConfirmDel(true)}>
                  <IcTrash width={15} height={15} /> Excluir
                </Btn>
              )}
            </div>
          </div>

          {selected.notes && (
            <p className="mt-4 border-t border-line-soft pt-3 text-sm leading-relaxed text-fog-300">
              <span className="num mr-2 text-[10px] uppercase tracking-[0.18em] text-fog-600">Observações</span>
              {selected.notes}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Seg
            value={tab}
            onChange={setTab}
            options={[
              { id: "fotos", label: (<><IcCamera width={15} height={15} /> Fotos ({iPhotos.length})</>) },
              { id: "medicoes", label: (<><IcCalc width={15} height={15} /> Medições ({iMeas.length})</>) },
              { id: "relatorio", label: (<><IcPrinter width={15} height={15} /> Relatório</>) },
            ]}
          />
          {tab === "relatorio" && (
            <Btn variant="primary" className="no-print" onClick={() => window.print()}>
              <IcPrinter width={15} height={15} /> Imprimir / salvar PDF
            </Btn>
          )}
        </div>

        <div className="mt-4">
          {tab === "fotos" &&
            (iPhotos.length === 0 ? (
              <div className="panel">
                <EmptyState
                  icon={<IcCamera />}
                  title="Sem fotos nesta vistoria"
                  text="Fotografe o imóvel e vincule as imagens a esta ficha para montar o registro fotográfico do laudo."
                  action={<Btn variant="primary" onClick={onGotoFotos}><IcCamera width={15} height={15} /> Ir para Fotos & anotações</Btn>}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {iPhotos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenPhoto(p.id)}
                    className="group overflow-hidden rounded-lg border border-line-soft text-left transition hover:border-brand-400/50"
                  >
                    <div className="aspect-video overflow-hidden bg-ink-800">
                      <img src={p.src} alt={p.caption} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    </div>
                    <div className="bg-ink-800/70 px-2.5 py-2">
                      <p className="truncate text-xs font-semibold text-fog-100">{p.caption || "Sem legenda"}</p>
                      <p className="num flex items-center gap-1 text-[10px] text-fog-500">
                        {p.category}
                        {p.notes.length > 0 && (
                          <span className="text-accent-300">· <IcNote width={10} height={10} /> {p.notes.length} anotação(ões)</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ))}

          {tab === "medicoes" &&
            (iMeas.length === 0 ? (
              <div className="panel">
                <EmptyState
                  icon={<IcCalc />}
                  title="Sem medições nesta vistoria"
                  text="Use a calculadora para medir o terreno ou a planta e vincule o resultado a esta ficha."
                  action={<Btn variant="primary" onClick={onGotoCalc}><IcCalc width={15} height={15} /> Abrir calculadora</Btn>}
                />
              </div>
            ) : (
              <div className="panel divide-y divide-line-soft/70">
                {iMeas.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="chip border-brand-400/40 text-brand-300">{GROUP_LABEL[m.group] ?? m.group}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fog-100">{m.label}</p>
                      <p className="truncate text-xs text-fog-500">{m.detail}</p>
                    </div>
                    <span className="num text-sm font-semibold text-accent-300">{m.areaM2 != null ? fmtArea(m.areaM2) : "—"}</span>
                    <span className="num text-[11px] text-fog-600">{timeAgo(m.at)}</span>
                  </div>
                ))}
              </div>
            ))}

          {tab === "relatorio" && <ReportSheet insp={selected} photos={photos} measurements={measurements} />}
        </div>
      </div>
    );
  }

  /* ---------- lista ---------- */
  return (
    <div>
      <SectionHead
        index="04"
        title="Vistorias"
        sub="Fichas de avaliação e vistoria com fotos, medições e relatório imprimível por cliente."
      >
        <Btn variant="primary" onClick={onNew}>
          <IcPlus width={15} height={15} /> Nova vistoria
        </Btn>
      </SectionHead>

      <div className="mb-4">
        <Seg
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "todas", label: `Todas (${inspections.length})` },
            { id: "agendada", label: "Agendadas" },
            { id: "campo", label: "Em campo" },
            { id: "concluida", label: "Concluídas" },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<IcClip />}
            title="Nenhuma vistoria aqui"
            text="Cadastre o cliente, o endereço do imóvel e o tipo de laudo para abrir uma nova ficha de campo."
            action={<Btn variant="primary" onClick={onNew}><IcPlus width={15} height={15} /> Nova vistoria</Btn>}
          />
        </div>
      ) : (
        <div className="panel divide-y divide-line-soft/70">
          {list.map((i) => {
            const nPh = photos.filter((p) => p.inspectionId === i.id).length;
            const nMe = measurements.filter((m) => m.inspectionId === i.id).length;
            return (
              <button
                key={i.id}
                onClick={() => onSelect(i.id)}
                className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-ink-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num text-[11px] tracking-wider text-brand-400">{i.code}</span>
                    <span className="truncate text-sm font-semibold text-fog-100">{i.client}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-fog-500">
                    <IcPin width={11} height={11} className="shrink-0" />
                    <span className="truncate">{i.address}{i.city ? ` — ${i.city}` : ""}</span>
                  </p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <span className="chip border-line text-fog-500">{i.type}</span>
                  <span className="num text-[10px] text-fog-600">{fmtDate(i.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="chip border-line text-fog-500"><IcCamera width={11} height={11} /> {nPh}</span>
                  <span className="chip border-line text-fog-500"><IcCalc width={11} height={11} /> {nMe}</span>
                </div>
                <StatusChip status={i.status} />
                <IcChevR width={16} height={16} className="shrink-0 text-fog-600 transition group-hover:translate-x-0.5 group-hover:text-brand-300" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
