export type ColName =
  | 'down' | 'free' | 'up' | 'announce' | 'manual'
  | 'directed' | 'diamond' | 'hourglass' | 'obligatory' | 'max';

export type RowName =
  | 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6'
  | 'max' | 'min' | 'kenta' | 'triling' | 'ful' | 'poker' | 'yamb';

export type ScoreCell = number | null;
export type ColScores = Record<RowName, ScoreCell>;
export type AllScores = Record<ColName, ColScores>;

export interface GameState {
  dice: number[];
  held: boolean[];
  rollCount: number;
  manualMode: boolean;
  manualRolls: number[];
  announced: RowName | null;
  directed: RowName | null;
  scores: AllScores;
  gameOver: boolean;
  diceCount: number;
  turnCount: number;
  colPointers: Record<ColName, number>;
  diamondTopPtr: number;
  diamondBotPtr: number;
  hourglassTopPtr: number;
  hourglassBotPtr: number;
  mode: GameMode;
  wasRucno: boolean;
}

export type GameMode = 'solo' | 'vs_bot' | 'training' | 'multiplayer' | 'team';
export type BotLevel = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isBot?: boolean;
  botLevel?: BotLevel;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  host_id: string;
  mode: GameMode;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'playing' | 'finished';
  is_private: boolean;
  created_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  format: 'swiss' | 'elimination' | 'round_robin' | 'qualification';
  status: 'upcoming' | 'active' | 'finished';
  max_players: number;
  current_players: number;
  entry_fee: number;
  prize_pool: number;
  starts_at: string;
}

export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'MANUAL_ROLL'; value: number }
  | { type: 'TOGGLE_HOLD'; index: number }
  | { type: 'COMMIT_ENTRY'; col: ColName; row: RowName }
  | { type: 'ANNOUNCE'; row: RowName }
  | { type: 'CANCEL_ANNOUNCE' }
  | { type: 'SET_DIRECTED'; row: RowName }
  | { type: 'SET_MANUAL_MODE'; active: boolean }
  | { type: 'NEW_GAME' };
