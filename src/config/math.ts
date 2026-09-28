/**
 * How server content marks math (BKLT-399).
 *
 * There is no backend field for it: LaTeX sits inside ordinary text fields
 * (question, answers, explanations, lesson summary and key points, Boki
 * answers). The only spec is what the admin panel previews that text with —
 * KaTeX 0.16.9 auto-render on prs, demo and production (the inline script on
 * `/admin/login`, checked 2026-09-28). These are its delimiters, in its order,
 * so the app shows exactly what an editor saw. Change them together.
 *
 * Order matters: `$$` has to be tried before `$`.
 */
export const MATH_DELIMITERS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '\\(', right: '\\)', display: false },
  { left: '$', right: '$', display: false },
] as const;

/**
 * Formula size relative to the surrounding text. KaTeX draws math at 1.21em
 * (`.katex { font-size: 1.21em }`), because Computer Modern's small x-height
 * reads smaller than a UI font at the same size.
 */
export const MATH_SCALE = 1.21;
