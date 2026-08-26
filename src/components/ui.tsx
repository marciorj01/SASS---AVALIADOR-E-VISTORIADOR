import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { IcX } from "./icons";

/* ---------- Botão ---------- */

type BtnVariant = "primary" | "ghost" | "soft" | "danger" | "mint";

const btnVariants: Record<BtnVariant, string> = {
  primary:
    "bg-accent-400 text-ink-950 font-semibold hover:bg-accent-300 border border-transparent shadow-[0_8px_20px_-10px_rgba(255,178,36,.55)]",
  ghost:
    "border border-line bg-ink-800/60 text-fog-300 hover:border-brand-400/50 hover:text-brand-300",
  soft: "border border-transparent bg-ink-700 text-fog-100 hover:bg-ink-600",
  danger:
    "border border-danger-400/40 bg-transparent text-danger-400 hover:bg-danger-400/10",
  mint: "bg-mint-400 text-ink-950 font-semibold hover:brightness-110 border border-transparent",
};

export function Btn({
  variant = "ghost",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...rest}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm transition-all duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 ${btnVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  w = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  w?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-[3px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`panel relative flex max-h-[94vh] w-full ${w} animate-pop flex-col rounded-b-none sm:rounded-b-[10px]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fog-100">
              {title}
            </h2>
            {sub && <p className="mt-0.5 text-xs text-fog-500">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md border border-transparent p-1.5 text-fog-500 transition hover:border-line hover:text-fog-100"
          >
            <IcX />
          </button>
        </div>
        <div className="grow overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Campos ---------- */

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="lbl">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-fog-600">{hint}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`inp ${className}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`inp min-h-[74px] resize-y ${className}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select {...rest} className={`inp appearance-none pr-8 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238ba3c2' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {children}
    </select>
  );
}

/* ---------- Controle segmentado ---------- */

export function Seg<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { id: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-line-soft bg-ink-900/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          title={o.title}
          onClick={() => onChange(o.id)}
          className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-all duration-150 ${
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]"
          } ${
            value === o.id
              ? "bg-ink-600 text-brand-300 shadow-[inset_0_0_0_1px_rgba(86,200,238,.35)]"
              : "text-fog-500 hover:text-fog-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Cabeçalho de seção ---------- */

export function SectionHead({
  index,
  title,
  sub,
  children,
}: {
  index: string;
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="num mb-1 text-[11px] tracking-[0.22em] text-brand-400">
          {index} <span className="text-fog-600">/ PRUMO</span>
        </p>
        <h1 className="font-display text-[34px] font-semibold uppercase leading-none tracking-wide text-fog-100 sm:text-[40px]">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-xl text-sm text-fog-500">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/* ---------- Revelação ao rolar ---------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------- Estado vazio ---------- */

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-line text-fog-500">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-fog-300">{title}</p>
      <p className="max-w-sm text-sm text-fog-500">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ---------- Chips de status ---------- */

export function StatusChip({ status }: { status: "agendada" | "campo" | "concluida" }) {
  const map = {
    agendada: "border-fog-600/40 text-fog-300",
    campo: "border-accent-400/50 text-accent-300 bg-accent-400/10",
    concluida: "border-mint-400/50 text-mint-400 bg-mint-400/10",
  } as const;
  const label = { agendada: "Agendada", campo: "Em campo", concluida: "Concluída" } as const;
  return (
    <span className={`chip ${map[status]}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "campo" ? "animate-blink bg-accent-400" : status === "concluida" ? "bg-mint-400" : "bg-fog-500"
        }`}
      />
      {label[status]}
    </span>
  );
}
