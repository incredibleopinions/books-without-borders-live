// src/styles/theme.ts

export const theme = {
  // Page Containers
  pageBg: 'bg-zinc-950 text-zinc-100 font-sans',

  // Cards & Panels
  cardBg: 'bg-zinc-900/80 border-zinc-800/80 text-zinc-100 shadow-xl backdrop-blur-sm',
  cardHover: 'hover:border-amber-500/40 hover:bg-zinc-900/90',
  headerBg: 'bg-zinc-900/90 border-amber-500/20 shadow-xl',

  // Typography & Brand Accents
  brandTitle: 'text-amber-400 font-bold',
  subText: 'text-zinc-400 text-xs',
  accentBadge: 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold',

  // Interactive Elements & Buttons
  buttonPrimary: 'bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold shadow-lg transition-all',
  buttonSecondary: 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 font-medium',

  // Game States (Icebreaker / Trivia)
  selectedCard: 'bg-amber-950/40 border-amber-500 text-amber-100 ring-2 ring-amber-500/40',
  fictionCard: 'bg-emerald-950/90 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/50',
  incorrectCard: 'bg-rose-950/60 border-rose-500/80 text-rose-100',
  unselectedCard: 'bg-zinc-900/80 border-zinc-800/80 text-zinc-200',

  // Input Fields
  inputBg: 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:ring-amber-500',
};