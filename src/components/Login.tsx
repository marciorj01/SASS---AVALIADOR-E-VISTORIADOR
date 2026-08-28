import { useState, type FormEvent } from "react";
import { Btn, TextInput } from "./ui";
import {
  IcAlert,
  IcCamera,
  IcCheck,
  IcDoc,
  IcEye,
  IcEyeOff,
  IcLock,
  IcRuler,
  IcUser,
  IcWifiOff,
  LogoMark,
} from "./icons";

interface LoginProps {
  firstUse: boolean;
  onLogin: (username: string, pass: string, remember: boolean) => string | null;
}

const FEATURES = [
  { icon: <IcRuler width={17} height={17} />, title: "Medição precisa", text: "Terrenos, plantas e polígonos irregulares com conferência visual." },
  { icon: <IcCamera width={17} height={17} />, title: "Registro fotográfico", text: "Fotografe o local e anote observações do perito em cada imagem." },
  { icon: <IcDoc width={17} height={17} />, title: "Relatórios prontos", text: "Fichas de vistoria exportáveis em PDF e prontas para impressão." },
];

export default function Login({ firstUse, onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    window.setTimeout(() => {
      const err = onLogin(username, pass, remember);
      if (err) {
        setError(err);
        setShakeKey((k) => k + 1);
        setLoading(false);
      }
    }, 620);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- painel institucional ---------- */}
      <div className="blueprint scanline relative hidden flex-col justify-between overflow-hidden border-r border-line-soft bg-ink-900/60 p-10 lg:flex">
        <div className="pointer-events-none absolute -right-28 -top-28 h-[430px] w-[430px] rounded-full border border-brand-400/15" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[460px] w-[460px] rounded-full border border-accent-400/10" />

        <div className="animate-rise flex items-center gap-3">
          <LogoMark className="text-brand-400" width={30} height={30} />
          <div>
            <p className="font-display text-2xl font-bold uppercase leading-none tracking-[0.18em] text-fog-100">Prumo</p>
            <p className="num mt-1 text-[10px] uppercase tracking-[0.18em] text-fog-600">vistoria &amp; avaliação de imóveis</p>
          </div>
        </div>

        {/* prumo central */}
        <div className="relative mx-auto flex items-center justify-center">
          <svg viewBox="0 0 300 300" className="h-[320px] w-[320px]" aria-hidden>
            <g className="animate-spin-slow" style={{ transformOrigin: "150px 150px" }}>
              <circle cx="150" cy="150" r="128" fill="none" stroke="rgba(86,200,238,.35)" strokeWidth="1.4" strokeDasharray="5 9" />
            </g>
            <circle cx="150" cy="150" r="96" fill="none" stroke="rgba(86,200,238,.16)" strokeWidth="1" />
            <circle cx="150" cy="150" r="60" fill="rgba(86,200,238,.04)" stroke="rgba(86,200,238,.25)" strokeWidth="1" />
            <line x1="150" y1="6" x2="150" y2="42" stroke="rgba(139,163,194,.5)" strokeWidth="1.4" />
            <line x1="150" y1="258" x2="150" y2="294" stroke="rgba(139,163,194,.5)" strokeWidth="1.4" />
            <line x1="6" y1="150" x2="42" y2="150" stroke="rgba(139,163,194,.5)" strokeWidth="1.4" />
            <line x1="258" y1="150" x2="294" y2="150" stroke="rgba(139,163,194,.5)" strokeWidth="1.4" />
            <line x1="150" y1="60" x2="150" y2="108" stroke="#ffb224" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M150 108 L176 150 L150 214 L124 150 Z" fill="rgba(255,178,36,.12)" stroke="#ffb224" strokeWidth="2.4" strokeLinejoin="round" />
            <circle cx="150" cy="150" r="5" fill="#56c8ee" />
            <text x="150" y="246" textAnchor="middle" fill="#647fa3" fontSize="10" fontFamily="IBM Plex Mono, monospace" letterSpacing="3">
              NÍVEL · PRUMO · ESQUADRO
            </text>
          </svg>
        </div>

        <div className="space-y-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-rise flex items-start gap-3.5 rounded-lg border border-line-soft bg-ink-850/70 px-4 py-3 transition hover:border-brand-400/40"
              style={{ animationDelay: `${0.15 + i * 0.12}s` }}
            >
              <span className="mt-0.5 text-brand-400">{f.icon}</span>
              <div>
                <p className="font-display text-[15px] font-semibold uppercase tracking-wide text-fog-100">{f.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-fog-500">{f.text}</p>
              </div>
            </div>
          ))}
          <p className="num flex items-center gap-2 pt-1 text-[10.5px] uppercase tracking-[0.16em] text-fog-600">
            <IcWifiOff width={13} height={13} className="text-mint-400" />
            Sistema de campo — funciona offline · dados no dispositivo
          </p>
        </div>
      </div>

      {/* ---------- formulário ---------- */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="animate-rise mb-6 flex items-center gap-2.5 lg:hidden">
            <LogoMark className="text-brand-400" width={26} height={26} />
            <div>
              <p className="font-display text-xl font-bold uppercase leading-none tracking-[0.18em] text-fog-100">Prumo</p>
              <p className="num mt-0.5 text-[9px] uppercase tracking-[0.16em] text-fog-600">vistoria &amp; avaliação</p>
            </div>
          </div>

          <div key={shakeKey} className={`panel animate-pop p-6 sm:p-7 ${shakeKey > 0 && error ? "animate-shake" : ""}`}>
            <p className="num text-[11px] tracking-[0.22em] text-brand-400">
              ACESSO RESTRITO <span className="text-fog-600">/ PRUMO</span>
            </p>
            <h1 className="font-display mt-2 text-[30px] font-semibold uppercase leading-none tracking-wide text-fog-100">
              Entrar no sistema
            </h1>
            <p className="mt-2 text-sm text-fog-500">
              Identifique-se para abrir o painel de campo, a calculadora de medidas e o registro fotográfico.
            </p>

            <div className="mt-4 rounded-md border border-brand-400/30 bg-ink-800/80 p-3 space-y-1.5">
              <p className="num text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">Demonstração de Contas e Perfis</p>
              <p className="text-[12.5px] text-fog-300">
                • <strong>Desenvolvedor Master:</strong> login <code className="text-brand-300">admin</code> · senha <code className="text-brand-300">admin</code> (Acesso Master + Plataforma)
              </p>
              <p className="text-[12.5px] text-fog-300">
                • <strong>Cliente Contratante:</strong> login <code className="text-mint-400">cliente_demo</code> · senha <code className="text-mint-400">cliente123</code> (Acesso restrito à operação, sem Painel Master)
              </p>
            </div>

            {error && (
              <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-md border border-danger-400/45 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
                <IcAlert width={15} height={15} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="lbl" htmlFor="login-user">Usuário</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog-600">
                    <IcUser width={15} height={15} />
                  </span>
                  <TextInput
                    id="login-user"
                    autoComplete="username"
                    autoFocus
                    className="pl-9"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="lbl" htmlFor="login-pass">Senha</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog-600">
                    <IcLock width={15} height={15} />
                  </span>
                  <TextInput
                    id="login-pass"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    className="pl-9 pr-10"
                    placeholder="••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-fog-600 transition hover:text-brand-300"
                  >
                    {showPass ? <IcEyeOff width={16} height={16} /> : <IcEye width={16} height={16} />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-fog-300">
                <span
                  onClick={() => setRemember((r) => !r)}
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded border transition ${
                    remember ? "border-brand-400 bg-brand-400/20 text-brand-300" : "border-line bg-ink-800 text-transparent"
                  }`}
                >
                  <IcCheck width={12} height={12} />
                </span>
                <span onClick={() => setRemember((r) => !r)}>Manter conectado neste dispositivo</span>
              </label>

              <Btn type="submit" variant="primary" disabled={loading || !username.trim() || !pass} className="h-11 w-full text-[15px]">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                    Verificando…
                  </>
                ) : (
                  <>
                    <IcLock width={15} height={15} /> Acessar painel de campo
                  </>
                )}
              </Btn>
            </form>
          </div>

          <p className="num mt-4 text-center text-[10.5px] uppercase tracking-[0.16em] text-fog-600">
            Prumo v1.1 · PWA instalável · dados locais
          </p>
        </div>
      </div>
    </div>
  );
}
