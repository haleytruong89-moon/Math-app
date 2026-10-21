// Tutor workspace v2 (mockup 21/10/2026): one filled primary button per area, outline for secondary actions,
// links for navigation; buttons at least 40 px high (34 px in dense rows).
const base = "inline-flex items-center justify-center gap-2 rounded-lg font-display font-semibold whitespace-nowrap disabled:opacity-50";
export const btn = {
  primary: `${base} h-10 bg-accent px-4 text-sm text-on-accent hover:brightness-110`,
  outline: `${base} h-10 border border-border bg-surface px-4 text-sm text-ink hover:border-accent hover:text-accent`,
  primarySm: `${base} h-[34px] bg-accent px-3.5 text-[13px] text-on-accent hover:brightness-110`,
  outlineSm: `${base} h-[34px] border border-border bg-surface px-3.5 text-[13px] text-accent hover:border-accent`,
} as const;

export const card = "rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05)]";
export const sectionTitle = "font-display text-[15px] font-bold";
