import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P): P => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
});

export const LogoMark = (p: P) => (
  <svg viewBox="0 0 24 24" width={26} height={26} fill="none" aria-hidden {...p}>
    <circle cx="12" cy="12.5" r="8.2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="1.6" x2="12" y2="4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="20.7" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1.8" y1="12.5" x2="4.3" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="19.7" y1="12.5" x2="22.2" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="5.6" x2="12" y2="8.4" stroke="#ffb224" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 8.4 L14.6 12.3 L12 18.6 L9.4 12.3 Z" fill="rgba(255,178,36,.14)" stroke="#ffb224" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="12" cy="12.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IcDash = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="13" y="10" width="8" height="11" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
  </svg>
);

export const IcCalc = (p: P) => (
  <svg {...base(p)}>
    <rect x="4.5" y="2.5" width="15" height="19" rx="2" />
    <path d="M8 6.5h8" />
    <path d="M8.2 11h.01M12 11h.01M15.8 11h.01M8.2 14.5h.01M12 14.5h.01M15.8 14.5h.01M8.2 18h.01M12 18h3.8" />
  </svg>
);

export const IcCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8.2h2.8l1.9-2.7h6.6l1.9 2.7H20a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.2a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.6" r="3.4" />
  </svg>
);

export const IcClip = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <rect x="9" y="2.2" width="6" height="3.6" rx="1" />
    <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.2" />
  </svg>
);

export const IcRuler = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="8.5" width="19" height="7" rx="1.2" />
    <path d="M6.5 8.5v3M10.2 8.5v4.4M13.8 8.5v3M17.5 8.5v4.4" />
  </svg>
);

export const IcPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IcX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IcTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12M10 11v6M14 11v6" />
  </svg>
);

export const IcNote = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4.5v-15Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);

export const IcPrinter = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8V3.5h10V8" />
    <rect x="4" y="8" width="16" height="8" rx="1.5" />
    <path d="M7 13.5h10v7H7z" />
  </svg>
);

export const IcInstall = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v10M8 10.5l4 4 4-4" />
    <path d="M4.5 16.5v2A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
  </svg>
);

export const IcWifi = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 9.5a13.5 13.5 0 0 1 18 0M6.2 13a9 9 0 0 1 11.6 0M9.4 16.3a4.6 4.6 0 0 1 5.2 0" />
    <circle cx="12" cy="19.3" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IcWifiOff = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 9.5a13.5 13.5 0 0 1 5.4-3.1M13 6.1a13.5 13.5 0 0 1 8 3.4M6.2 13a9 9 0 0 1 4-2.2M14.6 11.5a9 9 0 0 1 3.2 1.5M9.4 16.3a4.6 4.6 0 0 1 5.2 0" />
    <circle cx="12" cy="19.3" r="1.1" fill="currentColor" stroke="none" />
    <path d="M4 4l16 16" />
  </svg>
);

export const IcChevR = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const IcBack = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const IcCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IcPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.6-6.5-10.4A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.6C18.5 15.4 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </svg>
);

export const IcCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="1.8" />
    <path d="M5.5 15.5h-.7A1.8 1.8 0 0 1 3 13.7V4.8A1.8 1.8 0 0 1 4.8 3h8.9a1.8 1.8 0 0 1 1.8 1.8v.7" />
  </svg>
);

export const IcSwap = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 4 3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7" />
  </svg>
);

export const IcDoc = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 15.5h6M9 8.5h2" />
  </svg>
);

export const IcHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 11.5 12 4.5l8 7" />
    <path d="M6 10v10h12V10" />
    <path d="M10 20v-5.5h4V20" />
  </svg>
);

export const IcCamSwitch = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 3.5v3.2h-3.2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IcAreaShape = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <path d="M4 20 20 4" strokeDasharray="2.5 3" />
    <path d="M8 20v-2M16 20v-2M4 8h2M4 16h2" strokeWidth="1.3" />
  </svg>
);

export const IcPen = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h16" />
    <path d="M6.5 16.5 15 8l2.5 2.5-8.5 8.5H6.5z" />
    <path d="M13.5 9.5l1-1a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3l-1 1" />
  </svg>
);

export const IcClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IcLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3.5 8.5 4.5L12 12.5 3.5 8Z" />
    <path d="m4.5 12.5 7.5 4 7.5-4M4.5 16.5l7.5 4 7.5-4" strokeWidth="1.4" />
  </svg>
);

export const IcFlag = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 21V4" />
    <path d="M6 5h11l-2.5 3.5L17 12H6" />
  </svg>
);
