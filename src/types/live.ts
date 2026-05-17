import type { RowName, ColName, AllScores } from './game';

export type PairingType =
  | 'fixed'           // admin fiksira parove na početku, ne menjaju se
  | 'random'          // kompjuter bira nasumično svaki put
  | 'no_repeat'       // nasumično ali parovi se ne ponavljaju
  | 'all_combinations'// svi igraju sa svima (svaka kombinacija)
  | 'admin_choice';   // admin ručno paruje pre svake partije

export type SessionFormat = 'solo_live' | 'pairs_live';
export type SessionStatus  = 'setup' | 'pairing' | 'playing' | 'round_end' | 'finished';

export interface LivePlayer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_host: boolean;
  joined_at: string;
}

export interface LiveTeam {
  id: string;
  player1: LivePlayer;
  player2: LivePlayer | null; // null u solo_live
  scorecard: AllScores;
  total: number;
  round_scores: number[];
}

export interface PlayerRoll {
  player_id: string;
  dice: number[];
  held: boolean[];
  roll_count: number;
  locked: boolean; // završio sa bacanjem, čeka partnera
}

export interface TeamTurn {
  team_id: string;
  player1_roll: PlayerRoll | null;
  player2_roll: PlayerRoll | null;
  chosen_player_id: string | null; // čiji rezultat je izabran
  entry: { col: ColName; row: RowName; score: number } | null;
  announced: RowName | null;
}

export interface LiveRound {
  round_number: number;
  teams: LiveTeam[];
  current_col: ColName | null;  // koja kolona se igra u ovom kolu (za obavezne kolone)
  turns: TeamTurn[];
  directed_row: RowName | null; // ako prethodni tim najavio → naredni mora ovo
  status: 'active' | 'finished';
}

export interface LiveSession {
  id: string;
  code: string;
  name: string;
  host_id: string;
  format: SessionFormat;
  pairing_type: PairingType;
  status: SessionStatus;
  players: LivePlayer[];
  teams: LiveTeam[];
  current_round: number;
  total_rounds: number | null; // null = neograničeno (do broja bodova)
  target_score: number | null; // null = do broja partija
  rounds: LiveRound[];
  created_at: string;
}
