import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, ColName, RowName, GameMode } from '../types/game';
import { COLS, ALL_ROWS, DIAMOND_TOP_SEQ, DIAMOND_BOT_SEQ, HOURGLASS_TOP_SEQ, HOURGLASS_BOT_SEQ } from '../constants/game';
import { isCellAvailable, updateMaxCol, isGameOver, advancePointer, emptyScores, initialColPointers } from '../utils/gameRules';
import { calcScore } from '../utils/scoring';

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function initialState(mode: GameMode = 'solo'): GameState {
  return {
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollCount: 0,
    manualMode: false,
    manualRolls: [],
    announced: null,
    directed: null,
    scores: emptyScores(),
    gameOver: false,
    diceCount: 5,
    turnCount: 0,
    colPointers: initialColPointers(),
    diamondTopPtr: 0,
    diamondBotPtr: 0,
    hourglassTopPtr: 0,
    hourglassBotPtr: 0,
    mode,
    wasRucno: false,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROLL_DICE': {
      if (state.rollCount >= 3) return state;
      if (state.manualMode) return state;

      const newDice = state.dice.map((d, i) =>
        state.held[i] ? d : rollDie(),
      );
      const noHolds = state.rollCount === 0 || !state.held.some(h => h);
      return {
        ...state,
        dice: newDice,
        held: state.rollCount === 0
          ? [false, false, false, false, false]
          : state.held,
        rollCount: state.rollCount + 1,
        wasRucno: noHolds,
      };
    }

    case 'SET_MANUAL_MODE': {
      if (state.rollCount > 0) return state; // može samo pre bacanja
      return { ...state, manualMode: action.active, manualRolls: [] };
    }

    case 'MANUAL_ROLL': {
      const newRolls = [...state.manualRolls, action.value];
      if (newRolls.length === 5) {
        return {
          ...state,
          dice: newRolls,
          manualRolls: newRolls,
          rollCount: 1,
          manualMode: false,
        };
      }
      return { ...state, manualRolls: newRolls };
    }

    case 'TOGGLE_HOLD': {
      if (state.rollCount === 0 || state.rollCount >= 3) return state;
      const newHeld = [...state.held];
      newHeld[action.index] = !newHeld[action.index];
      return { ...state, held: newHeld };
    }

    case 'ANNOUNCE': {
      if (state.rollCount !== 1 || state.announced !== null) return state;
      return { ...state, announced: action.row };
    }

    case 'CANCEL_ANNOUNCE': {
      // Može se odustati samo pre drugog bacanja
      if (state.rollCount >= 2) return state;
      return { ...state, announced: null };
    }

    case 'SET_DIRECTED': {
      return { ...state, directed: action.row };
    }

    case 'COMMIT_ENTRY': {
      const { col, row } = action;
      if (!isCellAvailable(col, row, state)) return state;

      const score = calcScore(row, state.dice, state.rollCount);
      let newScores = {
        ...state.scores,
        [col]: { ...state.scores[col], [row]: score },
      };

      // Auto-update max column
      newScores = updateMaxCol(newScores);

      // Advance column pointer
      const newPointers = { ...state.colPointers };
      newPointers[col] = advancePointer(col, newPointers[col]);

      // Advance diamond / hourglass top or bottom pointer independently
      let { diamondTopPtr, diamondBotPtr, hourglassTopPtr, hourglassBotPtr } = state;
      if (col === 'diamond') {
        if (DIAMOND_TOP_SEQ[diamondTopPtr] === row) diamondTopPtr++;
        else if (DIAMOND_BOT_SEQ[diamondBotPtr] === row) diamondBotPtr++;
      }
      if (col === 'hourglass') {
        if (HOURGLASS_TOP_SEQ[hourglassTopPtr] === row) hourglassTopPtr++;
        else if (HOURGLASS_BOT_SEQ[hourglassBotPtr] === row) hourglassBotPtr++;
      }

      // Handle announce → directed chain
      // Dirigovano se aktivira samo u multiplayer modovima (za sledećeg igrača)
      const isMultiplayer = state.mode === 'multiplayer' || state.mode === 'team';
      let newDirected = state.directed;
      let newAnnounced = state.announced;
      if (col === 'announce' && isMultiplayer) {
        newDirected = row;
      }
      if (col === 'announce') newAnnounced = null;
      if (col === 'directed') newDirected = null;

      const over = isGameOver(newScores);

      return {
        ...state,
        scores: newScores,
        colPointers: newPointers,
        diamondTopPtr,
        diamondBotPtr,
        hourglassTopPtr,
        hourglassBotPtr,
        rollCount: 0,
        held: [false, false, false, false, false],
        manualMode: false,
        manualRolls: [],
        announced: newAnnounced,
        directed: newDirected,
        turnCount: state.turnCount + 1,
        gameOver: over,
        wasRucno: false,
      };
    }

    case 'NEW_GAME':
      return initialState(state.mode);

    default:
      return state;
  }
}

export function useGameState(mode: GameMode = 'solo') {
  const [state, dispatch] = useReducer(gameReducer, mode, initialState);

  const rollDice = useCallback(() => dispatch({ type: 'ROLL_DICE' }), []);
  const toggleHold = useCallback((i: number) => dispatch({ type: 'TOGGLE_HOLD', index: i }), []);
  const commitEntry = useCallback((col: ColName, row: RowName) =>
    dispatch({ type: 'COMMIT_ENTRY', col, row }), []);
  const announce = useCallback((row: RowName) => dispatch({ type: 'ANNOUNCE', row }), []);
  const cancelAnnounce = useCallback(() => dispatch({ type: 'CANCEL_ANNOUNCE' }), []);
  const setDirected = useCallback((row: RowName) => dispatch({ type: 'SET_DIRECTED', row }), []);
  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const setManualMode = useCallback((active: boolean) => dispatch({ type: 'SET_MANUAL_MODE', active }), []);
  const manualRoll = useCallback((value: number) => dispatch({ type: 'MANUAL_ROLL', value }), []);

  const availableCells = useCallback(() => {
    const result: Array<{ col: ColName; row: RowName }> = [];
    COLS.forEach(col => {
      ALL_ROWS.forEach(row => {
        if (isCellAvailable(col, row, state)) result.push({ col, row });
      });
    });
    return result;
  }, [state]);

  return {
    state,
    rollDice,
    toggleHold,
    commitEntry,
    announce,
    cancelAnnounce,
    setDirected,
    newGame,
    availableCells,
    setManualMode,
    manualRoll,
  };
}
