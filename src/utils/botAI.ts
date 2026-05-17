import type { ColName, RowName, GameState, BotLevel } from '../types/game';
import { COLS, ALL_ROWS } from '../constants/game';
import { calcScore } from './scoring';
import { isCellAvailable } from './gameRules';

export function smartHold(dice: number[], targetRow: RowName | null, level: BotLevel): boolean[] {
  const held = dice.map(() => false);
  if (level === 'easy') return held;

  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);

  if (targetRow === 'yamb') {
    const max = counts.indexOf(Math.max(...counts.slice(1)));
    return dice.map(d => d === max);
  }
  if (targetRow === 'poker') {
    const max = counts.indexOf(Math.max(...counts.slice(1)));
    return dice.map(d => d === max);
  }
  if (targetRow === 'kenta') {
    const unique = [...new Set(dice)];
    return dice.map(d => unique.includes(d));
  }
  if (targetRow && ['r1','r2','r3','r4','r5','r6'].includes(targetRow)) {
    const val = parseInt(targetRow.slice(1));
    return dice.map(d => d === val);
  }

  // Default: keep best combination
  const maxCount = Math.max(...counts.slice(1));
  if (maxCount >= 2 || level === 'hard') {
    const bestVal = counts.indexOf(maxCount);
    return dice.map(d => d === bestVal);
  }
  return held.map(() => false);
}

export function botDecideEntry(
  state: GameState,
  _level: BotLevel,
): { col: ColName; row: RowName } | null {
  let best: { col: ColName; row: RowName; score: number } | null = null;

  for (const col of COLS) {
    for (const row of ALL_ROWS) {
      if (!isCellAvailable(col, row, state)) continue;
      const score = calcScore(row, state.dice, state.rollCount);
      if (best === null || score > best.score) {
        best = { col, row, score };
      }
    }
  }

  return best ? { col: best.col, row: best.row } : null;
}

export function botDecideHold(state: GameState, level: BotLevel): boolean[] {
  if (level === 'easy') {
    return state.dice.map(() => Math.random() > 0.6);
  }

  let bestTarget: RowName | null = null;
  let bestScore = -1;

  for (const col of COLS) {
    for (const row of ALL_ROWS) {
      if (!isCellAvailable(col, row, state)) continue;
      const sc = calcScore(row, state.dice, state.rollCount);
      if (sc > bestScore) {
        bestScore = sc;
        bestTarget = row;
      }
    }
  }

  return smartHold(state.dice, bestTarget, level);
}

export function botFullTurn(
  state: GameState,
  level: BotLevel,
): { held: boolean[]; entry: { col: ColName; row: RowName } | null } {
  const held = state.rollCount < 3 ? botDecideHold(state, level) : state.held;
  const entry = state.rollCount >= 1 ? botDecideEntry(state, level) : null;
  return { held, entry };
}
