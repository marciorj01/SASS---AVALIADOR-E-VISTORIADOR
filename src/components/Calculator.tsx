import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { AREA_UNITS, fmt, parseNum, type Inspection } from "../lib/store";
import { Btn, Field, SectionHead, Seg, Select, TextInput } from "./ui";
import { IcAreaShape, IcCopy, IcHome, IcPlus, IcSwap, IcTrash } from "./icons";

type Group = "terreno" | "planta" | "conversor";
type Shape = "retangulo" | "triangulo" | "trapezio" | "poligono" | "circulo";

export interface SavePayload {
  label: string;
  group: string;
  detail: string;
  areaM2: number | null;
  inspectionId: string | null;
}

/* ---------- utilidades locais ---------- */

function MeasureIn({
  label,
  value,
  onChange,
  unit = "m",
  placeholder = "0,00",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <TextInput
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <span className="num pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fog-600">
          {unit}
        </span>
      </div>
    </Field>
  );
}

function ResultRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line-soft/70 py-2">
      <span className="text-sm text-fog-500">{k}</span>
      <span className="num text-[15px] font-medium text-fog-100">{v}</span>
    </div>
  );
}

function ResultPanel({
  title,
  areaLabel,
  areaValue,
  rows,
  children,
}: {
  title: string;
  areaLabel: string;
  areaValue: string;
  rows: { k: string; v: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="panel blueprint relative overflow-hidden p-5 lg:sticky lg:top-24">
      <span className="absolute right-4 top-4 h-4 w-4 border-r border-t border-brand-400/50" />
      <span className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-brand-400/50" />
      <p className="num text-[10.5px] tracking-[0.2em] text-fog-500">{title}</p>
      <p className="num mt-1 text-[11px] uppercase tracking-wider text-brand-400">{areaLabel}</p>
      <p className="num mt-1 text-[42px] font-semibold leading-none text-accent-300 sm:text-[48px]">{areaValue}</p>
      <div className="mt-4">
        {rows.map((r) => (
          <ResultRow key={r.k} k={r.k} v={r.v} />
        ))}
      </div>
      {children && <div className="mt-4 border-t border-line-soft/70 pt-4">{children}</div>}
    </div>
  );
}

function SaveBar({
  defaultLabel,
  detail,
  areaM2,
  group,
  inspections,
  onSave,
  onCopy,
}: {
  defaultLabel: string;
  detail: string;
  areaM2: number | null;
  group: string;
  inspections: Inspection[];
  onSave: (p: SavePayload) => void;
  onCopy: (text: string) => void;
}) {
  const [label, setLabel] = useState(defaultLabel);
  const [inspId, setInspId] = useState("");
  useEffect(() => setLabel(defaultLabel), [defaultLabel]);
  const valid = areaM2 !== null && areaM2 > 0;

  return (
    <div className="space-y-2.5">
      <Field label="Identificação da medição">
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Lote 12 × 25 — quadra B" />
      </Field>
      <Field label="Vincular à vistoria">
        <Select value={inspId} onChange={(e) => setInspId(e.target.value)}>
          <option value="">— Avulsa (sem vistoria) —</option>
          {inspections.map((i) => (
            <option key={i.id} value={i.id}>
              {i.code} · {i.client}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex gap-2 pt-1">
        <Btn
          variant="primary"
          className="flex-1"
          disabled={!valid}
          onClick={() =>
            onSave({ label: label.trim() || defaultLabel, group, detail, areaM2, inspectionId: inspId || null })
          }
        >
          <IcPlus width={15} height={15} /> Salvar medição
        </Btn>
        <Btn onClick={() => onCopy(`${label || defaultLabel} — ${detail}`)} title="Copiar resultado">
          <IcCopy width={15} height={15} />
        </Btn>
      </div>
      {!valid && <p className="text-[11px] text-fog-600">Preencha as medidas acima para habilitar o salvamento.</p>}
    </div>
  );
}

/* ---------- pré-visualização do polígono ---------- */

function PolyPreview({
  verts,
  onMoveVertex,
}: {
  verts: { x: number; y: number }[];
  onMoveVertex?: (index: number, x: number, y: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (verts.length < 3) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-line text-xs text-fog-600">
        Informe ao menos 3 vértices válidos para desenhar o lote.
      </div>
    );
  }
  const xs = verts.map((v) => v.x);
  const ys = verts.map((v) => v.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
  const W = 340, H = 220, pad = 30;
  const px = (x: number) => pad + ((x - minX) / spanX) * (W - 2 * pad);
  const py = (y: number) => H - pad - ((y - minY) / spanY) * (H - 2 * pad);
  const pts = verts.map((v) => `${px(v.x).toFixed(1)},${py(v.y).toFixed(1)}`).join(" ");

  const moveFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (dragIndex === null || !onMoveVertex || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * W;
    const viewY = ((event.clientY - rect.top) / rect.height) * H;
    const nextX = minX + ((viewX - pad) / (W - 2 * pad)) * spanX;
    const nextY = minY + ((H - pad - viewY) / (H - 2 * pad)) * spanY;
    onMoveVertex(dragIndex, nextX, nextY);
  };

  const startDrag = (event: PointerEvent<SVGCircleElement>, index: number) => {
    if (!onMoveVertex) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragIndex(index);
  };

  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (dragIndex !== null) {
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* captura já liberada */ }
    }
    setDragIndex(null);
  };

  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-line-soft bg-ink-950/70"
        style={{ touchAction: "none", cursor: dragIndex === null ? "default" : "grabbing" }}
        onPointerMove={moveFromPointer}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
      <defs>
        <pattern id="pgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0v20" fill="none" stroke="rgba(86,200,238,.08)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#pgrid)" />
      <polygon points={pts} fill="rgba(86,200,238,.13)" stroke="#56c8ee" strokeWidth="1.8" strokeLinejoin="round" />
      {verts.map((v, i) => (
        <g key={i}>
          <circle
            cx={px(v.x)}
            cy={py(v.y)}
            r={dragIndex === i ? 7 : 6}
            fill={dragIndex === i ? "#ffb224" : "#0a111f"}
            stroke="#ffb224"
            strokeWidth="1.6"
            role="slider"
            tabIndex={0}
            aria-label={`Vértice ${i + 1}: ${fmt(v.x, 2)} metros por ${fmt(v.y, 2)} metros`}
            onPointerDown={(event) => startDrag(event, i)}
            onKeyDown={(event) => {
              if (!onMoveVertex) return;
              const step = event.shiftKey ? 1 : 0.1;
              if (event.key === "ArrowLeft") onMoveVertex(i, v.x - step, v.y);
              if (event.key === "ArrowRight") onMoveVertex(i, v.x + step, v.y);
              if (event.key === "ArrowUp") onMoveVertex(i, v.x, v.y + step);
              if (event.key === "ArrowDown") onMoveVertex(i, v.x, v.y - step);
            }}
          />
          <text
            x={px(v.x) + 8}
            y={py(v.y) - 8}
            fill="#8ba3c2"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            V{i + 1} ({fmt(v.x, 1)}; {fmt(v.y, 1)})
          </text>
        </g>
      ))}
      </svg>
      {onMoveVertex && (
        <p className="text-[11px] text-fog-600">
          Arraste as bolinhas amarelas com o mouse ou toque e mova com o dedo. Os campos X e Y continuam disponíveis para ajuste preciso.
        </p>
      )}
    </div>
  );
}

/* ---------- componente principal ---------- */

const POLY_PRESETS: { name: string; pts: [number, number][] }[] = [
  { name: "Retângulo 12 × 25", pts: [[0, 0], [12, 0], [12, 25], [0, 25]] },
  { name: "Lote em “L”", pts: [[0, 0], [12, 0], [12, 15], [6, 15], [6, 25], [0, 25]] },
  { name: "Irregular 5 vértices", pts: [[0, 0], [16.5, 1.2], [19, 14.5], [9.5, 22.3], [0.8, 17.6]] },
];

const ROOM_PRESETS: { name: string; w: string; l: string }[] = [
  { name: "Sala", w: "4,20", l: "3,40" },
  { name: "Cozinha", w: "3,20", l: "2,80" },
  { name: "Quarto", w: "3,40", l: "3,00" },
  { name: "Banheiro", w: "2,40", l: "1,80" },
  { name: "Área de serviço", w: "2,50", l: "1,50" },
  { name: "Garagem", w: "5,00", l: "3,00" },
];

export default function Calculator({
  inspections,
  onSave,
  toast,
}: {
  inspections: Inspection[];
  onSave: (p: SavePayload) => void;
  toast: (text: string) => void;
}) {
  const [group, setGroup] = useState<Group>("terreno");
  const [shape, setShape] = useState<Shape>("retangulo");

  // terreno — retângulo
  const [rw, setRw] = useState("12,00");
  const [rl, setRl] = useState("25,00");
  // triângulo
  const [triMode, setTriMode] = useState<"bh" | "sss">("bh");
  const [tb, setTb] = useState("8,00");
  const [th, setTh] = useState("6,50");
  const [ta, setTa] = useState("7,00");
  const [tb2, setTb2] = useState("8,50");
  const [tc, setTc] = useState("9,20");
  // trapézio
  const [za, setZa] = useState("18,00");
  const [zb, setZb] = useState("12,00");
  const [zh, setZh] = useState("20,00");
  // círculo
  const [cr, setCr] = useState("7,50");
  // polígono
  const [verts, setVerts] = useState<{ x: string; y: string }[]>(
    POLY_PRESETS[2].pts.map(([x, y]) => ({ x: String(x).replace(".", ","), y: String(y).replace(".", ",") }))
  );

  // planta
  const [rooms, setRooms] = useState(
    ROOM_PRESETS.slice(0, 4).map((r, i) => ({ id: `r${i}`, name: r.name, w: r.w, l: r.l }))
  );
  const [pd, setPd] = useState("2,80");
  const [lot, setLot] = useState("300,00");

  // conversor
  const [cVal, setCVal] = useState("1000");
  const [cFrom, setCFrom] = useState("m2");

  const copy = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast("Resultado copiado para a área de transferência."),
        () => toast("Não foi possível copiar neste navegador.")
      );
    } else toast("Não foi possível copiar neste navegador.");
  };

  /* ----- resultados: terreno ----- */

  const rect = useMemo(() => {
    const w = parseNum(rw), l = parseNum(rl);
    const ok = w > 0 && l > 0;
    return {
      ok,
      area: ok ? w * l : NaN,
      per: ok ? 2 * (w + l) : NaN,
      diag: ok ? Math.hypot(w, l) : NaN,
    };
  }, [rw, rl]);

  const tri = useMemo(() => {
    if (triMode === "bh") {
      const b = parseNum(tb), h = parseNum(th);
      const ok = b > 0 && h > 0;
      return { ok, area: ok ? (b * h) / 2 : NaN, per: NaN as number };
    }
    const a = parseNum(ta), b = parseNum(tb2), c = parseNum(tc);
    const ok = a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a;
    const s = (a + b + c) / 2;
    return { ok, invalid: a > 0 && b > 0 && c > 0 && !ok, area: ok ? Math.sqrt(s * (s - a) * (s - b) * (s - c)) : NaN, per: ok ? a + b + c : NaN };
  }, [triMode, tb, th, ta, tb2, tc]);

  const trap = useMemo(() => {
    const a = parseNum(za), b = parseNum(zb), h = parseNum(zh);
    const ok = a > 0 && b > 0 && h > 0;
    const side = ok ? Math.hypot(h, (a - b) / 2) : NaN;
    return { ok, area: ok ? ((a + b) / 2) * h : NaN, per: ok ? a + b + 2 * side : NaN };
  }, [za, zb, zh]);

  const circ = useMemo(() => {
    const r = parseNum(cr);
    const ok = r > 0;
    return { ok, area: ok ? Math.PI * r * r : NaN, per: ok ? 2 * Math.PI * r : NaN, d: ok ? 2 * r : NaN };
  }, [cr]);

  const poly = useMemo(() => {
    const pts = verts
      .map((v) => ({ x: parseNum(v.x), y: parseNum(v.y) }))
      .filter((v) => Number.isFinite(v.x) && Number.isFinite(v.y));
    let area = NaN, per = NaN;
    if (pts.length >= 3) {
      area = Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p.x * q.y - q.x * p.y; }, 0)) / 2;
      per = pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + Math.hypot(q.x - p.x, q.y - p.y); }, 0);
    }
    return { pts, area, per, valid: pts.length >= 3 };
  }, [verts]);

  /* ----- resultados: planta ----- */

  const planta = useMemo(() => {
    const parsed = rooms
      .map((r) => ({ ...r, w: parseNum(r.w), l: parseNum(r.l) }))
      .filter((r) => r.w > 0 && r.l > 0);
    const built = parsed.reduce((s, r) => s + r.w * r.l, 0);
    const perim = parsed.reduce((s, r) => s + 2 * (r.w + r.l), 0);
    const h = parseNum(pd);
    const walls = h > 0 ? perim * h : NaN;
    const lotM2 = parseNum(lot);
    const taxa = lotM2 > 0 ? (built / lotM2) * 100 : NaN;
    return { parsed, built, perim, walls, taxa, valid: built > 0 };
  }, [rooms, pd, lot]);

  /* ----- resultados: conversor ----- */

  const conv = useMemo(() => {
    const v = parseNum(cVal);
    const unit = AREA_UNITS.find((u) => u.id === cFrom) ?? AREA_UNITS[0];
    const m2 = Number.isFinite(v) && v > 0 ? v * unit.f : NaN;
    return { m2, unit };
  }, [cVal, cFrom]);

  const convDigits = (v: number) => (Math.abs(v) >= 1000 ? 1 : Math.abs(v) >= 1 ? 2 : 5);

  /* ----- payloads de salvamento por forma ----- */

  let shapeUI: ReactNode = null;
  let resultUI: ReactNode = null;

  if (group === "terreno") {
    if (shape === "retangulo") {
      const detail = `Área ${fmt(rect.area)} m² · Perímetro ${fmt(rect.per)} m · Diagonal ${fmt(rect.diag)} m`;
      shapeUI = (
        <div className="grid gap-3 sm:grid-cols-2">
          <MeasureIn label="Largura (frente)" value={rw} onChange={setRw} />
          <MeasureIn label="Comprimento (fundos)" value={rl} onChange={setRl} />
        </div>
      );
      resultUI = (
        <ResultPanel
          title="TERRENO RETANGULAR"
          areaLabel="Área do lote"
          areaValue={rect.ok ? fmt(rect.area) : "—"}
          rows={[
            { k: "Perímetro", v: rect.ok ? `${fmt(rect.per)} m` : "—" },
            { k: "Diagonal", v: rect.ok ? `${fmt(rect.diag)} m` : "—" },
            { k: "Em hectares", v: rect.ok ? `${fmt(rect.area / 10000, 4)} ha` : "—" },
          ]}
        >
          <SaveBar
            defaultLabel={`Terreno retangular ${fmt(parseNum(rw))} × ${fmt(parseNum(rl))} m`}
            detail={detail}
            areaM2={rect.ok ? rect.area : null}
            group="terreno"
            inspections={inspections}
            onSave={onSave}
            onCopy={copy}
          />
        </ResultPanel>
      );
    } else if (shape === "triangulo") {
      const invalid = triMode === "sss" && (tri as { invalid?: boolean }).invalid;
      const detail = `Área ${fmt(tri.area)} m²${Number.isFinite(tri.per) ? ` · Perímetro ${fmt(tri.per!)} m` : ""}`;
      shapeUI = (
        <div className="space-y-3">
          <Seg
            size="sm"
            value={triMode}
            onChange={setTriMode}
            options={[
              { id: "bh", label: "Base × altura" },
              { id: "sss", label: "Três lados (Heron)" },
            ]}
          />
          {triMode === "bh" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <MeasureIn label="Base" value={tb} onChange={setTb} />
              <MeasureIn label="Altura" value={th} onChange={setTh} />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <MeasureIn label="Lado A" value={ta} onChange={setTa} />
              <MeasureIn label="Lado B" value={tb2} onChange={setTb2} />
              <MeasureIn label="Lado C" value={tc} onChange={setTc} />
            </div>
          )}
          {invalid && (
            <p className="rounded-md border border-danger-400/40 bg-danger-400/10 px-3 py-2 text-xs text-danger-400">
              Estes lados não fecham um triângulo — a soma de dois lados deve superar o terceiro.
            </p>
          )}
        </div>
      );
      resultUI = (
        <ResultPanel
          title="TERRENO TRIANGULAR"
          areaLabel="Área do lote"
          areaValue={tri.ok ? fmt(tri.area) : "—"}
          rows={[
            { k: "Perímetro", v: Number.isFinite(tri.per) ? `${fmt(tri.per!)} m` : "—" },
            { k: "Método", v: triMode === "bh" ? "Base × altura ÷ 2" : "Fórmula de Heron" },
          ]}
        >
          <SaveBar
            defaultLabel={`Terreno triangular — área ${fmt(tri.area)} m²`}
            detail={detail}
            areaM2={tri.ok ? tri.area : null}
            group="terreno"
            inspections={inspections}
            onSave={onSave}
            onCopy={copy}
          />
        </ResultPanel>
      );
    } else if (shape === "trapezio") {
      const detail = `Área ${fmt(trap.area)} m² · Perímetro estimado ${fmt(trap.per)} m (trapézio isósceles)`;
      shapeUI = (
        <div className="grid gap-3 sm:grid-cols-3">
          <MeasureIn label="Base maior (A)" value={za} onChange={setZa} />
          <MeasureIn label="Base menor (B)" value={zb} onChange={setZb} />
          <MeasureIn label="Altura (h)" value={zh} onChange={setZh} />
        </div>
      );
      resultUI = (
        <ResultPanel
          title="TERRENO TRAPEZOIDAL"
          areaLabel="Área do lote"
          areaValue={trap.ok ? fmt(trap.area) : "—"}
          rows={[
            { k: "Perímetro (isósceles)", v: trap.ok ? `${fmt(trap.per)} m` : "—" },
            { k: "Fórmula", v: "(A + B) × h ÷ 2" },
          ]}
        >
          <SaveBar
            defaultLabel={`Terreno trapezoidal — área ${fmt(trap.area)} m²`}
            detail={detail}
            areaM2={trap.ok ? trap.area : null}
            group="terreno"
            inspections={inspections}
            onSave={onSave}
            onCopy={copy}
          />
        </ResultPanel>
      );
    } else if (shape === "circulo") {
      const detail = `Área ${fmt(circ.area)} m² · Circunferência ${fmt(circ.per)} m`;
      shapeUI = (
        <div className="grid gap-3 sm:grid-cols-2">
          <MeasureIn label="Raio" value={cr} onChange={setCr} />
          <Field label="Diâmetro (calculado)">
            <TextInput value={circ.ok ? fmt(circ.d) : "—"} readOnly className="bg-ink-900/40 text-fog-500" />
          </Field>
        </div>
      );
      resultUI = (
        <ResultPanel
          title="GLEBA CIRCULAR"
          areaLabel="Área"
          areaValue={circ.ok ? fmt(circ.area) : "—"}
          rows={[
            { k: "Circunferência", v: circ.ok ? `${fmt(circ.per)} m` : "—" },
            { k: "Fórmula", v: "π × r²" },
          ]}
        >
          <SaveBar
            defaultLabel={`Gleba circular r = ${fmt(parseNum(cr))} m`}
            detail={detail}
            areaM2={circ.ok ? circ.area : null}
            group="terreno"
            inspections={inspections}
            onSave={onSave}
            onCopy={copy}
          />
        </ResultPanel>
      );
    } else {
      const detail = `Área ${fmt(poly.area)} m² · Perímetro ${fmt(poly.per)} m · ${poly.pts.length} vértices (Gauss)`;
      shapeUI = (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lbl mb-0">Modelos rápidos</span>
            {POLY_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setVerts(p.pts.map(([x, y]) => ({ x: String(x).replace(".", ","), y: String(y).replace(".", ",") })))}
                className="chip border-line text-fog-300 transition hover:border-brand-400/50 hover:text-brand-300"
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-fog-500">
            Levante os vértices em campo (trena a laser ou GPS) no sentido horário ou anti-horário, em metros, a partir de um ponto de origem (0;0).
          </p>
          <div className="space-y-2">
            {verts.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="num w-9 shrink-0 text-[11px] text-brand-400">V{i + 1}</span>
                <TextInput
                  inputMode="decimal"
                  value={v.x}
                  placeholder="X (m)"
                  onChange={(e) => setVerts((old) => old.map((o, j) => (j === i ? { ...o, x: e.target.value } : o)))}
                  className="num"
                />
                <TextInput
                  inputMode="decimal"
                  value={v.y}
                  placeholder="Y (m)"
                  onChange={(e) => setVerts((old) => old.map((o, j) => (j === i ? { ...o, y: e.target.value } : o)))}
                  className="num"
                />
                <button
                  onClick={() => setVerts((old) => old.filter((_, j) => j !== i))}
                  disabled={verts.length <= 3}
                  aria-label={`Remover vértice ${i + 1}`}
                  className="shrink-0 rounded-md border border-transparent p-2 text-fog-600 transition hover:border-danger-400/40 hover:text-danger-400 disabled:opacity-30"
                >
                  <IcTrash width={15} height={15} />
                </button>
              </div>
            ))}
          </div>
          <Btn
            onClick={() => setVerts((old) => [...old, { x: "", y: "" }])}
            className="w-full border-dashed"
          >
            <IcPlus width={15} height={15} /> Adicionar vértice
          </Btn>
          <PolyPreview
            verts={poly.pts}
            onMoveVertex={(index, x, y) => {
              const asInput = (value: number) => String(Number(value.toFixed(2))).replace(".", ",");
              setVerts((old) => old.map((vertex, vertexIndex) => (
                vertexIndex === index ? { x: asInput(x), y: asInput(y) } : vertex
              )));
            }}
          />
          {!poly.valid && (
            <p className="text-[11px] text-fog-600">A área é calculada pela fórmula de Gauss (shoelace) com no mínimo 3 vértices.</p>
          )}
        </div>
      );
      resultUI = (
        <ResultPanel
          title="POLÍGONO IRREGULAR"
          areaLabel="Área do lote"
          areaValue={poly.valid ? fmt(poly.area) : "—"}
          rows={[
            { k: "Perímetro", v: poly.valid ? `${fmt(poly.per)} m` : "—" },
            { k: "Vértices válidos", v: `${poly.pts.length}` },
            { k: "Método", v: "Fórmula de Gauss" },
          ]}
        >
          <SaveBar
            defaultLabel={`Polígono irregular ${poly.pts.length} vértices — ${fmt(poly.area)} m²`}
            detail={detail}
            areaM2={poly.valid ? poly.area : null}
            group="terreno"
            inspections={inspections}
            onSave={onSave}
            onCopy={copy}
          />
        </ResultPanel>
      );
    }
  } else if (group === "planta") {
    const detail = `Área construída ${fmt(planta.built)} m² · Paredes ${fmt(planta.walls)} m² · Rodapé ${fmt(planta.perim)} m${Number.isFinite(planta.taxa) ? ` · Taxa de ocupação ${fmt(planta.taxa, 1)}%` : ""}`;
    shapeUI = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="lbl mb-0">Adicionar cômodo</span>
          {ROOM_PRESETS.map((r) => (
            <button
              key={r.name}
              onClick={() => setRooms((old) => [...old, { id: `r${Date.now()}${Math.random().toString(36).slice(2, 5)}`, name: r.name, w: r.w, l: r.l }])}
              className="chip border-line text-fog-300 transition hover:border-accent-400/50 hover:text-accent-300"
            >
              + {r.name}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {rooms.map((r, i) => {
            const w = parseNum(r.w), l = parseNum(r.l);
            const a = w > 0 && l > 0 ? w * l : NaN;
            return (
              <div key={r.id} className="grid grid-cols-[1fr_76px_76px_86px_34px] items-center gap-2 sm:grid-cols-[1fr_90px_90px_100px_34px]">
                <TextInput
                  value={r.name}
                  placeholder={`Cômodo ${i + 1}`}
                  onChange={(e) => setRooms((old) => old.map((o) => (o.id === r.id ? { ...o, name: e.target.value } : o)))}
                />
                <TextInput
                  inputMode="decimal"
                  value={r.w}
                  placeholder="Larg."
                  onChange={(e) => setRooms((old) => old.map((o) => (o.id === r.id ? { ...o, w: e.target.value } : o)))}
                  className="num"
                />
                <TextInput
                  inputMode="decimal"
                  value={r.l}
                  placeholder="Comp."
                  onChange={(e) => setRooms((old) => old.map((o) => (o.id === r.id ? { ...o, l: e.target.value } : o)))}
                  className="num"
                />
                <span className="num rounded-md border border-line-soft bg-ink-900/60 px-2 py-2 text-right text-[13px] text-accent-300">
                  {Number.isFinite(a) ? `${fmt(a)} m²` : "—"}
                </span>
                <button
                  onClick={() => setRooms((old) => old.filter((o) => o.id !== r.id))}
                  aria-label={`Remover ${r.name}`}
                  className="rounded-md border border-transparent p-2 text-fog-600 transition hover:border-danger-400/40 hover:text-danger-400"
                >
                  <IcTrash width={15} height={15} />
                </button>
              </div>
            );
          })}
        </div>
        <p className="num text-[11px] text-fog-600">Colunas: nome · largura (m) · comprimento (m) · área</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <MeasureIn label="Pé-direito (para paredes)" value={pd} onChange={setPd} />
          <MeasureIn label="Área do terreno (opcional)" value={lot} onChange={setLot} hint="Usada para calcular a taxa de ocupação." />
        </div>
      </div>
    );
    resultUI = (
      <ResultPanel
        title={`PLANTA — ${planta.parsed.length} CÔMODO(S)`}
        areaLabel="Área construída"
        areaValue={planta.valid ? fmt(planta.built) : "—"}
        rows={[
          { k: "Piso / teto", v: planta.valid ? `${fmt(planta.built)} m²` : "—" },
          { k: "Paredes (bruto)", v: Number.isFinite(planta.walls) ? `${fmt(planta.walls)} m²` : "—" },
          { k: "Rodapé / perímetro", v: planta.valid ? `${fmt(planta.perim)} m` : "—" },
          { k: "Taxa de ocupação", v: Number.isFinite(planta.taxa) ? `${fmt(planta.taxa, 1)}%` : "informe o terreno" },
        ]}
      >
        {Number.isFinite(planta.taxa) && (
          <div className="mb-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-400 transition-all duration-500"
                style={{ width: `${Math.min(100, planta.taxa)}%` }}
              />
            </div>
            <p className="num mt-1 text-[11px] text-fog-600">{fmt(planta.taxa, 1)}% do terreno ocupado</p>
          </div>
        )}
        <SaveBar
          defaultLabel={`Planta — ${planta.parsed.length} cômodos (pé-direito ${Number.isFinite(parseNum(pd)) ? fmt(parseNum(pd)) : "—"} m)`}
          detail={detail}
          areaM2={planta.valid ? planta.built : null}
          group="planta"
          inspections={inspections}
          onSave={onSave}
          onCopy={copy}
        />
      </ResultPanel>
    );
  } else {
    const m2 = conv.m2;
    shapeUI = (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Valor a converter">
            <TextInput inputMode="decimal" value={cVal} onChange={(e) => setCVal(e.target.value)} placeholder="0,00" className="num text-lg" />
          </Field>
          <Field label="Unidade de origem">
            <Select value={cFrom} onChange={(e) => setCFrom(e.target.value)}>
              {AREA_UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.short})
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {AREA_UNITS.filter((u) => u.id !== cFrom).map((u) => {
            const v = Number.isFinite(m2) ? m2 / u.f : NaN;
            return (
              <div key={u.id} className="group flex items-center justify-between gap-2 rounded-lg border border-line-soft bg-ink-800/50 px-3.5 py-3 transition hover:border-brand-400/40">
                <div className="min-w-0">
                  <p className="num text-[10.5px] uppercase tracking-wider text-fog-500">{u.label}</p>
                  <p className="num truncate text-lg font-semibold text-fog-100">
                    {Number.isFinite(v) ? fmt(v, convDigits(v)) : "—"} <span className="text-xs text-fog-500">{u.short}</span>
                  </p>
                </div>
                <button
                  onClick={() => Number.isFinite(v) && copy(`${fmt(parseNum(cVal))} ${conv.unit.short} = ${fmt(v, convDigits(v))} ${u.short}`)}
                  aria-label={`Copiar em ${u.short}`}
                  className="rounded-md border border-transparent p-2 text-fog-600 opacity-60 transition hover:border-brand-400/40 hover:text-brand-300 group-hover:opacity-100"
                >
                  <IcCopy width={14} height={14} />
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-fog-600">
          Referências agrárias brasileiras: alqueire paulista = 24.200 m² · alqueire mineiro = 48.400 m² · tarefa baiana = 4.356 m².
        </p>
      </div>
    );
    const top3 = AREA_UNITS.filter((u) => u.id !== cFrom)
      .slice(0, 3)
      .map((u) => `${fmt(Number.isFinite(m2) ? m2 / u.f : 0, convDigits(Number.isFinite(m2) ? m2 / u.f : 0))} ${u.short}`)
      .join(" · ");
    resultUI = (
      <ResultPanel
        title="CONVERSOR DE ÁREA"
        areaLabel={`Em metros quadrados (${fmt(parseNum(cVal))} ${conv.unit.short})`}
        areaValue={Number.isFinite(m2) ? fmt(m2, convDigits(m2)) : "—"}
        rows={[
          { k: "Hectares", v: Number.isFinite(m2) ? `${fmt(m2 / 10000, 4)} ha` : "—" },
          { k: "Equivalência", v: Number.isFinite(m2) ? `${fmt(Math.sqrt(m2))} m de lado (quadrado)` : "—" },
        ]}
      >
        <SaveBar
          defaultLabel={`${fmt(parseNum(cVal))} ${conv.unit.short} convertidos`}
          detail={`${fmt(parseNum(cVal))} ${conv.unit.short} = ${Number.isFinite(m2) ? fmt(m2) : "—"} m² · ${top3}`}
          areaM2={Number.isFinite(m2) ? m2 : null}
          group="conversao"
          inspections={inspections}
          onSave={onSave}
          onCopy={copy}
        />
      </ResultPanel>
    );
  }

  return (
    <div>
      <SectionHead
        index="02"
        title="Calculadora de medidas"
        sub="Terrenos, plantas e glebas: calcule área, perímetro e equivalências — e vincule cada medição a uma vistoria."
      >
        <Seg
          value={group}
          onChange={setGroup}
          options={[
            { id: "terreno", label: (<><IcAreaShape width={15} height={15} /> Terreno</>) },
            { id: "planta", label: (<><IcHome width={15} height={15} /> Planta & cômodos</>) },
            { id: "conversor", label: (<><IcSwap width={15} height={15} /> Conversor</>) },
          ]}
        />
      </SectionHead>

      {group === "terreno" && (
        <div className="mb-4">
          <Seg
            size="sm"
            value={shape}
            onChange={setShape}
            options={[
              { id: "retangulo", label: "Retângulo" },
              { id: "triangulo", label: "Triângulo" },
              { id: "trapezio", label: "Trapézio" },
              { id: "poligono", label: "Polígono irregular" },
              { id: "circulo", label: "Círculo" },
            ]}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fog-100">
                {group === "terreno" ? "Medidas do terreno" : group === "planta" ? "Cômodos da edificação" : "Conversão de unidades"}
              </h3>
              <span className="num text-[11px] text-fog-600">use vírgula p/ decimais</span>
            </div>
            {shapeUI}
          </div>
        </div>
        <div className="lg:col-span-2">{resultUI}</div>
      </div>
    </div>
  );
}
