import type { ColName, RowName, AllScores, GameState } from '../types/game';
import {
  ALL_ROWS, COLS,
  DIAMOND_TOP_SEQ, DIAMOND_BOT_SEQ,
  HOURGLASS_TOP_SEQ, HOURGLASS_BOT_SEQ,
} from '../constants/game';
import { bestScoreForRow } from './scoring';

export function initialColPointers(): Record<ColName, number> {
  return {
    down: 0, free: 0, up: 12, announce: 0, manual: 0,
    directed: 0, diamond: 0, hourglass: 0, obligatory: 0, max: 0,
  };
}

export function emptyScores(): AllScores {
  const empty = {} as AllScores;
  COLS.forEach(col => {
    empty[col] = {} as Record<RowName, number | null>;
    ALL_ROWS.forEach(row => { empty[col][row] = null; });
  });
  return empty;
}

export function isCellAvailable(
  col: ColName,
  row: RowName,
  state: Pick<GameState, 'scores' | 'colPointers' | 'rollCount' | 'announced' | 'directed' | 'manualMode' | 'manualRolls'>,
): boolean {
  if (state.rollCount === 0) return false;
  if (state.scores[col][row] !== null) return false;

  switch (col) {
    case 'down': {
      const idx = ALL_ROWS.indexOf(row);
      return idx === state.colPointers.down;
    }
    case 'up': {
      const idx = ALL_ROWS.indexOf(row);
      return idx === state.colPointers.up;
    }
    case 'free':
      return true;
    case 'announce': {
      if (state.announced === null) return false;
      return row === state.announced;
    }
    case 'manual':
      // Uvek dostupno kad ima bacanja — ali GameBoard forsira 0 ako nije bilo ručnog bacanja
      return true;
    case 'directed': {
      if (state.directed === null) return false;
      return row === state.directed;
    }
    case 'diamond': {
      const currentTop = DIAMOND_TOP_SEQ[state.diamondTopPtr];
      const currentBot = DIAMOND_BOT_SEQ[state.diamondBotPtr];
      return row === currentTop || row === currentBot;
    }
    case 'hourglass': {
      const currentTop = HOURGLASS_TOP_SEQ[state.hourglassTopPtr];
      const currentBot = HOURGLASS_BOT_SEQ[state.hourglassBotPtr];
      return row === currentTop || row === currentBot;
    }
    case 'obligatory': {
      const ptr = state.colPointers.obligatory;
      if (ptr >= ALL_ROWS.length) return false;
      return ALL_ROWS[ptr] === row;
    }
    case 'max':
      return false;
    default:
      return false;
  }
}

export function updateMaxCol(scores: AllScores): AllScores {
  const updated = { ...scores, max: { ...scores.max } };
  ALL_ROWS.forEach(row => {
    const best = bestScoreForRow(row, scores);
    updated.max[row] = best > 0 ? best : null;
  });
  return updated;
}

export function isGameOver(scores: AllScores): boolean {
  return COLS.filter(c => c !== 'max').every(col =>
    ALL_ROWS.every(row => scores[col][row] !== null),
  );
}

export function advancePointer(col: ColName, pointer: number): number {
  switch (col) {
    case 'down':
    case 'obligatory':
    case 'diamond':
    case 'hourglass':
      return pointer + 1;
    case 'up':
      return pointer - 1;
    default:
      return pointer;
  }
}
