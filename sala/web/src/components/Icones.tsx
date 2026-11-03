// Ícones de 24 px, traço 2, pontas redondas.
type P = { tamanho?: number };
const base = (t = 20) => ({
  width: t, height: t, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const IconeMais = ({ tamanho }: P) => <svg {...base(tamanho)}><path d="M12 5v14M5 12h14" /></svg>;
export const IconeEnviar = ({ tamanho }: P) => <svg {...base(tamanho)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconePlugue = ({ tamanho }: P) => (
  <svg {...base(tamanho)}><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v5" /></svg>
);
export const IconeConvite = ({ tamanho }: P) => (
  <svg {...base(tamanho)}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" /></svg>
);
export const IconeVoltar = ({ tamanho }: P) => <svg {...base(tamanho)}><path d="M15 6l-6 6 6 6" /></svg>;
export const IconeFechar = ({ tamanho }: P) => <svg {...base(tamanho)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IconeCopiar = ({ tamanho }: P) => (
  <svg {...base(tamanho)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></svg>
);
export const IconeSair = ({ tamanho }: P) => (
  <svg {...base(tamanho)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" /></svg>
);
export const IconeAgente = ({ tamanho }: P) => (
  <svg {...base(tamanho)}><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 8V5M9 13h.01M15 13h.01" /></svg>
);

export const Marca = () => (
  <div className="marca">
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <circle cx="12" cy="16" r="4.5" fill="var(--fundo)" />
      <circle cx="21" cy="16" r="4.5" fill="none" stroke="var(--fundo)" strokeWidth="2.2" />
    </svg>
    <span>Sala</span>
  </div>
);

export const IconeGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);
export const IconeAjustes = ({ tamanho }: P) => (
  <svg {...base(tamanho)}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
);
export const IconeCheck = ({ tamanho }: P) => <svg {...base(tamanho)}><path d="M5 12l5 5L20 7" /></svg>;
