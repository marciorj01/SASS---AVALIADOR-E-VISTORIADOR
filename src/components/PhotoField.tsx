import { useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  compressImage,
  fileToDataUrl,
  fmtDate,
  fmtTime,
  type Inspection,
  type Photo,
} from "../lib/store";
import { Btn, EmptyState, Field, Modal, SectionHead, Select, TextArea, TextInput } from "./ui";
import { IcCamera, IcCamSwitch, IcNote, IcPlus, IcTrash, IcX } from "./icons";

/* ---------- Modal da câmera ---------- */

function CameraModal({
  open,
  onClose,
  onCapture,
  onPickFiles,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (src: string) => void;
  onPickFiles: (files: FileList) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setErr("");
    setShot(null);
    setStarting(true);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
      } catch {
        if (!cancelled) setErr("Câmera indisponível ou permissão negada pelo navegador.");
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setShot(c.toDataURL("image/jpeg", 0.82));
  };

  const useShot = async () => {
    if (!shot) return;
    setSaving(true);
    try {
      const final = await compressImage(shot);
      onCapture(final);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Fotografar o local"
      sub="Após o clique, a foto abre para receber as anotações do perito."
      w="max-w-2xl"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-ink-950">
        {shot ? (
          <img src={shot} alt="Foto capturada" className="h-full w-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
            />
            {/* grade de enquadramento */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-0 h-full w-px bg-fog-100/15" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-fog-100/15" />
              <div className="absolute top-1/3 left-0 w-full h-px bg-fog-100/15" />
              <div className="absolute top-2/3 left-0 w-full h-px bg-fog-100/15" />
              <svg className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="6" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </div>
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
                <p className="num text-xs tracking-[0.2em] text-fog-300">ABRINDO CÂMERA…</p>
              </div>
            )}
            {err && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/85 p-6 text-center">
                <span className="text-accent-400"><IcCamera width={22} height={22} /></span>
                <p className="max-w-sm text-sm text-fog-300">{err}</p>
                <p className="text-xs text-fog-500">Você ainda pode enviar fotos da galeria do dispositivo.</p>
              </div>
            )}
          </>
        )}
        <span className="num absolute left-3 top-3 rounded bg-ink-950/70 px-2 py-0.5 text-[10px] tracking-widest text-fog-300 backdrop-blur-sm">
          REGISTRO DE CAMPO
        </span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-5">
        {shot ? (
          <>
            <Btn onClick={() => setShot(null)}>Tirar outra</Btn>
            <Btn variant="primary" onClick={useShot} disabled={saving}>
              <IcCamera width={15} height={15} /> {saving ? "Processando…" : "Usar foto"}
            </Btn>
          </>
        ) : (
          <>
            <button
              onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              aria-label="Alternar câmera"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fog-300 transition hover:border-brand-400/50 hover:text-brand-300"
            >
              <IcCamSwitch />
            </button>
            <button
              onClick={capture}
              disabled={starting || !!err}
              aria-label="Capturar foto"
              className="h-16 w-16 rounded-full border-4 border-fog-100 bg-fog-100/10 transition hover:scale-105 hover:bg-accent-400/70 active:scale-95 disabled:opacity-40"
            />
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Enviar arquivo"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fog-300 transition hover:border-accent-400/50 hover:text-accent-300"
            >
              <IcPlus />
            </button>
          </>
        )}
      </div>
      <p className="mt-3 text-center text-[11px] text-fog-600">
        Dica: em celulares, o botão “+” abre a câmera nativa do sistema pelo seletor de arquivos.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onPickFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </Modal>
  );
}

/* ---------- miniatura ---------- */

function Thumb({ p, onOpen }: { p: Photo; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-lg border border-line-soft bg-ink-800 text-left transition hover:border-brand-400/50"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={p.src}
          alt={p.caption || "Foto de vistoria"}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
        />
      </div>
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
        <span className="chip border-line bg-ink-950/70 text-fog-300 backdrop-blur-sm">{p.category}</span>
        {p.notes.length > 0 && (
          <span className="chip border-accent-400/50 bg-ink-950/70 text-accent-300 backdrop-blur-sm">
            <IcNote width={11} height={11} /> {p.notes.length}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/95 via-ink-950/60 to-transparent p-2.5 pt-8">
        <p className="truncate text-xs font-semibold text-fog-100">{p.caption || "Sem legenda — toque para anotar"}</p>
        <p className="num text-[10px] text-fog-500">{fmtDate(p.at)} · {fmtTime(p.at)}</p>
      </div>
    </button>
  );
}

const QUICK_NOTES = [
  "Apresenta fissura",
  "Umidade aparente",
  "Necessita reparo",
  "Divergência com a planta",
  "Confirmar medida em campo",
];

/* ---------- componente principal ---------- */

export default function PhotoField({
  photos,
  inspections,
  focusId,
  onFocusConsumed,
  onAddPhotos,
  onUpdate,
  onDelete,
  onAddNote,
  onDeleteNote,
  toast,
}: {
  photos: Photo[];
  inspections: Inspection[];
  focusId: string | null;
  onFocusConsumed: () => void;
  onAddPhotos: (srcs: string[]) => string[];
  onUpdate: (id: string, patch: Partial<Photo>) => void;
  onDelete: (id: string) => void;
  onAddNote: (id: string, text: string) => void;
  onDeleteNote: (id: string, noteId: string) => void;
  toast: (t: string) => void;
}) {
  const [catFilter, setCatFilter] = useState("Todas");
  const [inspFilter, setInspFilter] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusId) {
      setDetailId(focusId);
      onFocusConsumed();
    }
  }, [focusId, onFocusConsumed]);

  useEffect(() => {
    setNoteText("");
    setConfirmDel(false);
  }, [detailId]);

  const filtered = photos
    .filter((p) => (catFilter === "Todas" ? true : p.category === catFilter))
    .filter((p) => (inspFilter ? p.inspectionId === inspFilter : true))
    .sort((a, b) => b.at.localeCompare(a.at));

  const detail = photos.find((p) => p.id === detailId) ?? null;

  const captureDone = (src: string) => {
    const ids = onAddPhotos([src]);
    setCamOpen(false);
    setDetailId(ids[0] ?? null);
    toast("Foto registrada — adicione legenda e anotações do perito.");
  };

  const pickFiles = async (files: FileList) => {
    const list = Array.from(files).slice(0, 8);
    const srcs: string[] = [];
    for (const f of list) {
      try {
        srcs.push(await compressImage(await fileToDataUrl(f)));
      } catch {
        /* arquivo ilegível — ignora */
      }
    }
    if (!srcs.length) {
      toast("Não foi possível ler os arquivos selecionados.");
      return;
    }
    const ids = onAddPhotos(srcs);
    setCamOpen(false);
    setDetailId(ids[0] ?? null);
    toast(srcs.length === 1 ? "Foto adicionada — registre suas anotações." : `${srcs.length} fotos adicionadas ao acervo.`);
  };

  return (
    <div>
      <SectionHead
        index="03"
        title="Fotos & anotações"
        sub="Fotografe o local e vincule anotações extras do avaliador a cada registro — tudo fica salvo no dispositivo."
      >
        <Btn onClick={() => fileRef.current?.click()}>
          <IcPlus width={15} height={15} /> Enviar arquivos
        </Btn>
        <Btn variant="primary" onClick={() => setCamOpen(true)}>
          <IcCamera width={15} height={15} /> Fotografar
        </Btn>
      </SectionHead>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void pickFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["Todas", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`chip transition ${
              catFilter === c
                ? "border-brand-400/60 bg-brand-400/10 text-brand-300"
                : "border-line text-fog-500 hover:border-fog-600 hover:text-fog-300"
            }`}
          >
            {c}
            {c !== "Todas" && (
              <span className="num text-[10px] opacity-70">{photos.filter((p) => p.category === c).length}</span>
            )}
          </button>
        ))}
        <span className="ml-auto w-44">
          <Select value={inspFilter} onChange={(e) => setInspFilter(e.target.value)} className="h-8 py-1 text-xs">
            <option value="">Todas as vistorias</option>
            {inspections.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} · {i.client}
              </option>
            ))}
          </Select>
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<IcCamera />}
            title="Nenhuma foto neste filtro"
            text="Fotografe o local diretamente pelo sistema ou envie imagens da galeria. Cada foto pode receber legenda, categoria e anotações do perito."
            action={
              <div className="flex gap-2">
                <Btn variant="primary" onClick={() => setCamOpen(true)}>
                  <IcCamera width={15} height={15} /> Fotografar agora
                </Btn>
                <Btn onClick={() => fileRef.current?.click()}>Enviar arquivos</Btn>
              </div>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Thumb key={p.id} p={p} onOpen={() => setDetailId(p.id)} />
          ))}
        </div>
      )}

      <p className="num mt-4 text-center text-[11px] text-fog-600">
        {filtered.length} registro(s) · armazenamento local do dispositivo
      </p>

      <CameraModal open={camOpen} onClose={() => setCamOpen(false)} onCapture={captureDone} onPickFiles={(f) => void pickFiles(f)} />

      {/* ---------- detalhe da foto ---------- */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title="Registro fotográfico"
        sub={detail ? `${fmtDate(detail.at)} · ${fmtTime(detail.at)}` : undefined}
        w="max-w-4xl"
        footer={
          detail && (
            <>
              {confirmDel ? (
                <>
                  <Btn onClick={() => setConfirmDel(false)}>Cancelar</Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      onDelete(detail.id);
                      setDetailId(null);
                      toast("Foto excluída do acervo.");
                    }}
                  >
                    <IcTrash width={15} height={15} /> Confirmar exclusão
                  </Btn>
                </>
              ) : (
                <Btn variant="danger" onClick={() => setConfirmDel(true)}>
                  <IcTrash width={15} height={15} /> Excluir foto
                </Btn>
              )}
              <Btn variant="primary" onClick={() => setDetailId(null)}>Concluir</Btn>
            </>
          )
        }
      >
        {detail && (
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="overflow-hidden rounded-lg border border-line bg-ink-950">
                <img src={detail.src} alt={detail.caption || "Foto de vistoria"} className="max-h-[56vh] w-full object-contain" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="chip border-line text-fog-300">{detail.category}</span>
                <span className="num text-[11px] text-fog-600">
                  {detail.inspectionId
                    ? `Vinculada: ${inspections.find((i) => i.id === detail.inspectionId)?.code ?? "vistoria"}`
                    : "Sem vistoria vinculada"}
                </span>
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Field label="Legenda da foto">
                <TextInput
                  value={detail.caption}
                  placeholder="Ex.: Fachada principal — vista frontal"
                  onChange={(e) => onUpdate(detail.id, { caption: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Categoria">
                  <Select value={detail.category} onChange={(e) => onUpdate(detail.id, { category: e.target.value })}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Vistoria">
                  <Select
                    value={detail.inspectionId ?? ""}
                    onChange={(e) => onUpdate(detail.id, { inspectionId: e.target.value || null })}
                  >
                    <option value="">— Nenhuma —</option>
                    {inspections.map((i) => (
                      <option key={i.id} value={i.id}>{i.code} · {i.client}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="lbl mb-0">Anotações do perito</span>
                  <span className="chip border-accent-400/50 text-accent-300">
                    <IcNote width={11} height={11} /> {detail.notes.length}
                  </span>
                </div>

                {detail.notes.length > 0 && (
                  <ul className="mb-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
                    {detail.notes.map((n) => (
                      <li key={n.id} className="rounded-md border border-line-soft bg-ink-800/60 p-2.5">
                        <p className="text-[13px] leading-snug text-fog-100">{n.text}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="num text-[10px] text-fog-600">{fmtDate(n.at)} · {fmtTime(n.at)}</span>
                          <button
                            onClick={() => {
                              onDeleteNote(detail.id, n.id);
                              toast("Anotação removida.");
                            }}
                            aria-label="Remover anotação"
                            className="rounded p-1 text-fog-600 transition hover:text-danger-400"
                          >
                            <IcX width={12} height={12} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mb-2 flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map((q) => (
                    <button
                      key={q}
                      onClick={() => setNoteText((t) => (t ? `${t}; ${q.toLowerCase()}` : q))}
                      className="chip border-line text-[11px] text-fog-500 transition hover:border-accent-400/50 hover:text-accent-300"
                    >
                      + {q}
                    </button>
                  ))}
                </div>

                <TextArea
                  value={noteText}
                  placeholder="Descreva a observação vinculada a esta foto…"
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Btn
                  variant="primary"
                  className="mt-2 w-full"
                  disabled={!noteText.trim()}
                  onClick={() => {
                    onAddNote(detail.id, noteText.trim());
                    setNoteText("");
                    toast("Anotação registrada na foto.");
                  }}
                >
                  <IcPlus width={15} height={15} /> Registrar anotação
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
