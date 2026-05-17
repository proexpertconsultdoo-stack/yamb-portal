import { useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { LiveSession, LivePlayer, LiveTeam, TeamTurn, PlayerRoll, PairingType, SessionFormat } from '../types/live';
import type { ColName, RowName } from '../types/game';
import { generatePairings } from '../utils/pairing';
import { emptyScores } from '../utils/gameRules';
import { calcScore, calcGrandTotal } from '../utils/scoring';

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function useLiveGame(currentUser: LivePlayer | null) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [currentTeamTurn, setCurrentTeamTurn] = useState<TeamTurn | null>(null);
  const [myRoll, setMyRoll] = useState<PlayerRoll | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ── Kreiranje sesije ─────────────────────────────────────────────────────
  const createSession = useCallback((
    name: string,
    format: SessionFormat,
    pairingType: PairingType,
    totalRounds: number | null,
    targetScore: number | null,
  ): LiveSession => {
    if (!currentUser) throw new Error('Morate biti prijavljeni');
    const newSession: LiveSession = {
      id: crypto.randomUUID(),
      code: generateCode(),
      name,
      host_id: currentUser.id,
      format,
      pairing_type: pairingType,
      status: 'setup',
      players: [{ ...currentUser, is_host: true, joined_at: new Date().toISOString() }],
      teams: [],
      current_round: 0,
      total_rounds: totalRounds,
      target_score: targetScore,
      rounds: [],
      created_at: new Date().toISOString(),
    };
    setSession(newSession);
    return newSession;
  }, [currentUser]);

  // ── Dodavanje igrača (admin) ─────────────────────────────────────────────
  const addPlayer = useCallback((player: LivePlayer) => {
    setSession(prev => {
      if (!prev) return prev;
      if (prev.players.find(p => p.id === player.id)) return prev;
      return { ...prev, players: [...prev.players, player] };
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setSession(prev => {
      if (!prev) return prev;
      return { ...prev, players: prev.players.filter(p => p.id !== playerId) };
    });
  }, []);

  // ── Generisanje parova ───────────────────────────────────────────────────
  const generateTeams = useCallback((adminAssignments?: { player1Id: string; player2Id: string }[]) => {
    setSession(prev => {
      if (!prev) return prev;
      const previousTeams = prev.rounds.map(r => r.teams);
      const teams = adminAssignments
        ? adminAssignments.map((a, i) => ({
            id: `team-${i}`,
            player1: prev.players.find(p => p.id === a.player1Id)!,
            player2: prev.players.find(p => p.id === a.player2Id) ?? null,
            scorecard: emptyScores(),
            total: 0,
            round_scores: [],
          }))
        : generatePairings(prev.players, prev.pairing_type, prev.current_round + 1, previousTeams);
      return { ...prev, teams, status: 'pairing' };
    });
  }, []);

  // ── Pokretanje kola ──────────────────────────────────────────────────────
  const startRound = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'playing',
        current_round: prev.current_round + 1,
      };
    });
    setCurrentTeamTurn(null);
    setMyRoll(null);
  }, []);

  // ── Moje bacanje (jedan igrač iz tima) ───────────────────────────────────
  const updateMyRoll = useCallback((roll: Partial<PlayerRoll>) => {
    setMyRoll(prev => prev ? { ...prev, ...roll } : null);
  }, []);

  const initMyRoll = useCallback(() => {
    if (!currentUser) return;
    setMyRoll({
      player_id: currentUser.id,
      dice: [1, 1, 1, 1, 1],
      held: [false, false, false, false, false],
      roll_count: 0,
      locked: false,
    });
  }, [currentUser]);

  const lockMyRoll = useCallback(() => {
    setMyRoll(prev => prev ? { ...prev, locked: true } : null);
    // Broadcast na partnera (Supabase Realtime)
    if (myRoll) {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'player_roll',
        payload: myRoll,
      });
    }
  }, [myRoll]);

  // ── Tim bira čiji rezultat upisuje ───────────────────────────────────────
  const chooseRoll = useCallback((chosenPlayerId: string) => {
    setCurrentTeamTurn(prev => prev ? { ...prev, chosen_player_id: chosenPlayerId } : null);
  }, []);

  // ── Upis u listić ────────────────────────────────────────────────────────
  const commitTeamEntry = useCallback((
    teamId: string,
    col: ColName,
    row: RowName,
    dice: number[],
    rollCount: number,
    announced: RowName | null,
  ) => {
    const score = calcScore(row, dice, rollCount);
    setSession(prev => {
      if (!prev) return prev;
      const updatedTeams = prev.teams.map(team => {
        if (team.id !== teamId) return team;
        const newScorecard = {
          ...team.scorecard,
          [col]: { ...team.scorecard[col], [row]: score },
        };
        return {
          ...team,
          scorecard: newScorecard,
          total: calcGrandTotal(newScorecard),
        };
      });

      // Dirigovano za naredni tim ako je bila najava
      const currentRound = prev.rounds[prev.rounds.length - 1];
      const directedRow = (col === 'announce' && announced !== null) ? row : null;
      if (currentRound) {
        currentRound.directed_row = directedRow;
      }

      return { ...prev, teams: updatedTeams };
    });
    setCurrentTeamTurn(null);
    setMyRoll(null);
  }, []);

  // ── Kraj sesije ──────────────────────────────────────────────────────────
  const endSession = useCallback(() => {
    setSession(prev => prev ? { ...prev, status: 'finished' } : null);
  }, []);

  // ── Realtim kanal ────────────────────────────────────────────────────────
  const connectChannel = useCallback((sessionId: string) => {
    const channel = supabase.channel(`live:${sessionId}`);
    channel
      .on('broadcast', { event: 'player_roll' }, ({ payload }) => {
        setCurrentTeamTurn(prev => {
          if (!prev) return prev;
          const isP1 = prev.player1_roll?.player_id === payload.player_id;
          return isP1
            ? { ...prev, player1_roll: payload }
            : { ...prev, player2_roll: payload };
        });
      })
      .subscribe();
    channelRef.current = channel;
  }, []);

  const disconnectChannel = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return {
    session,
    currentTeamTurn,
    myRoll,
    createSession,
    addPlayer,
    removePlayer,
    generateTeams,
    startRound,
    initMyRoll,
    updateMyRoll,
    lockMyRoll,
    chooseRoll,
    commitTeamEntry,
    endSession,
    connectChannel,
    disconnectChannel,
  };
}
