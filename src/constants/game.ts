import type { ColName, RowName } from '../types/game';

export const COLS: ColName[] = [
  'down', 'free', 'up', 'announce', 'manual',
  'directed', 'diamond', 'hourglass', 'obligatory', 'max',
];

export const COL_LABELS: Record<ColName, string> = {
  down:       '▼',
  free:       '▼▲',
  up:         '▲',
  announce:   'N',
  manual:     'R',
  directed:   'D',
  diamond:    '◆',
  hourglass:  '⧖',
  obligatory: 'O',
  max:        'M',
};

export const COL_FULL_LABELS: Record<ColName, string> = {
  down:       'Dole',
  free:       'Slobodno',
  up:         'Gore',
  announce:   'Najava',
  manual:     'Ručno',
  directed:   'Dirigovano',
  diamond:    'Dijamant',
  hourglass:  'Peščanik',
  obligatory: 'Obavezno',
  max:        'Max',
};

export const ALL_ROWS: RowName[] = [
  'r1', 'r2', 'r3', 'r4', 'r5', 'r6',
  'max', 'min', 'kenta', 'triling', 'ful', 'poker', 'yamb',
];

export const ROW_LABELS: Record<RowName, string> = {
  r1:     '1',
  r2:     '2',
  r3:     '3',
  r4:     '4',
  r5:     '5',
  r6:     '6',
  max:    'Max',
  min:    'Min',
  kenta:  'Kenta',
  triling:'Triling',
  ful:    'Ful',
  poker:  'Poker',
  yamb:   'Yamb',
};

// Diamond column sequences
export const DIAMOND_TOP_SEQ: RowName[] = ['max', 'r6', 'r5', 'r4', 'r3', 'r2', 'r1'];
export const DIAMOND_BOT_SEQ: RowName[] = ['min', 'kenta', 'triling', 'ful', 'poker', 'yamb'];

// Hourglass column sequences
export const HOURGLASS_TOP_SEQ: RowName[] = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'max'];
export const HOURGLASS_BOT_SEQ: RowName[] = ['yamb', 'poker', 'ful', 'triling', 'kenta', 'min'];

export const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export const XP_TABLE: Record<string, number> = {
  solo_finish: 20,
  solo_win:    50,
  yamb_scored: 30,
  poker_scored:15,
  bonus_top:   10,
  multiplayer_win: 100,
  tournament_win:  200,
  daily_bonus:     25,
};

export const RANK_THRESHOLDS = [
  { rank: 'Početnik',   xp: 0 },
  { rank: 'Igrač',      xp: 200 },
  { rank: 'Napredni',   xp: 600 },
  { rank: 'Ekspert',    xp: 1500 },
  { rank: 'Majstor',    xp: 3000 },
  { rank: 'Veleigrač',  xp: 6000 },
  { rank: 'Legenda',    xp: 12000 },
];

export function getRankFromXP(xp: number): { rank: string; next: number; progress: number } {
  let current = RANK_THRESHOLDS[0];
  let next = RANK_THRESHOLDS[1];
  for (let i = 0; i < RANK_THRESHOLDS.length - 1; i++) {
    if (xp >= RANK_THRESHOLDS[i].xp) {
      current = RANK_THRESHOLDS[i];
      next = RANK_THRESHOLDS[i + 1] ?? RANK_THRESHOLDS[i];
    }
  }
  const range = next.xp - current.xp || 1;
  const progress = Math.min(100, Math.round(((xp - current.xp) / range) * 100));
  return { rank: current.rank, next: next.xp, progress };
}
