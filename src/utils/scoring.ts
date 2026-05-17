import type { ColName, RowName, AllScores } from '../types/game';
import { COLS } from '../constants/game';

export function calcScore(row: RowName, dice: number[], rollCount: number): number {
  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);

  switch (row) {
    case 'r1': return counts[1] * 1;
    case 'r2': return counts[2] * 2;
    case 'r3': return counts[3] * 3;
    case 'r4': return counts[4] * 4;
    case 'r5': return counts[5] * 5;
    case 'r6': return counts[6] * 6;
    case 'max': return dice.reduce((a, b) => a + b, 0);
    case 'min': return dice.reduce((a, b) => a + b, 0);
    case 'kenta': {
      const sorted = [...new Set(dice)].sort();
      const isSmall = [1, 2, 3, 4, 5].every(v => sorted.includes(v));
      const isBig   = [2, 3, 4, 5, 6].every(v => sorted.includes(v));
      if (!isSmall && !isBig) return 0;
      const base = isSmall ? 35 : 45;
      if (rollCount === 1) return base + 31;
      if (rollCount === 2) return base + 21;
      return base + 11;
    }
    case 'triling': {
      const triple = [1, 2, 3, 4, 5, 6].find(v => counts[v] >= 3);
      return triple ? triple * 3 + 20 : 0;
    }
    case 'ful': {
      const triple = [1, 2, 3, 4, 5, 6].find(v => counts[v] >= 3);
      const pair   = [1, 2, 3, 4, 5, 6].find(v => counts[v] >= 2 && v !== triple);
      return triple && pair ? triple * 3 + pair * 2 + 30 : 0;
    }
    case 'poker': {
      const four = [1, 2, 3, 4, 5, 6].find(v => counts[v] >= 4);
      return four ? four * 4 + 40 : 0;
    }
    case 'yamb': {
      if (counts.some(c => c === 5)) {
        const val = dice[0];
        return val * 5 + 50;
      }
      return 0;
    }
    default: return 0;
  }
}

export function topSectionSum(colScores: Partial<Record<RowName, number | null>>): number {
  return (['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as RowName[])
    .reduce((s, r) => s + (colScores[r] ?? 0), 0);
}

export function topBonus(colScores: Partial<Record<RowName, number | null>>): number {
  return topSectionSum(colScores) >= 60 ? 30 : 0;
}

export function middleSectionValue(colScores: Partial<Record<RowName, number | null>>, r1Val: number | null): number {
  const maxV = colScores['max'] ?? null;
  const minV = colScores['min'] ?? null;
  if (maxV === null || minV === null || r1Val === null) return 0;
  return (maxV - minV) * r1Val;
}

export function calcColTotal(_colName: ColName, colScores: Partial<Record<RowName, number | null>>): number {
  const top = topSectionSum(colScores);
  const bonus = topBonus(colScores);
  const mid = middleSectionValue(colScores, colScores['r1'] ?? null);
  const bot = (['kenta', 'triling', 'ful', 'poker', 'yamb'] as RowName[])
    .reduce((s, r) => s + (colScores[r] ?? 0), 0);
  return top + bonus + mid + bot;
}

export function calcGrandTotal(scores: AllScores): number {
  return COLS
    .filter(c => c !== 'max')
    .reduce((sum, col) => sum + calcColTotal(col, scores[col]), 0);
}

export function calcRowSum(row: RowName, scores: AllScores): number {
  return COLS
    .filter(c => c !== 'max')
    .reduce((sum, col) => sum + (scores[col][row] ?? 0), 0);
}

export function bestScoreForRow(row: RowName, scores: AllScores): number {
  let best = -Infinity;
  COLS.filter(c => c !== 'max').forEach(col => {
    const v = scores[col][row];
    if (v !== null && v !== undefined && v > best) best = v;
  });
  return best === -Infinity ? 0 : best;
}
