import type { LivePlayer, LiveTeam, PairingType } from '../types/live';
import { emptyScores } from './gameRules';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTeam(p1: LivePlayer, p2: LivePlayer | null, id: string): LiveTeam {
  return {
    id,
    player1: p1,
    player2: p2,
    scorecard: emptyScores(),
    total: 0,
    round_scores: [],
  };
}

export function generatePairings(
  players: LivePlayer[],
  type: PairingType,
  roundNumber: number,
  previousTeams: LiveTeam[][] = [],
): LiveTeam[] {
  if (type === 'fixed') {
    if (previousTeams.length > 0) return previousTeams[0];
    return randomPairing(players);
  }

  if (type === 'random') {
    return randomPairing(players);
  }

  if (type === 'no_repeat') {
    return noRepeatPairing(players, previousTeams);
  }

  if (type === 'all_combinations') {
    return roundRobinPairing(players, roundNumber);
  }

  // admin_choice — vraća prazne timove, admin popunjava ručno
  return [];
}

function randomPairing(players: LivePlayer[]): LiveTeam[] {
  const shuffled = shuffle(players);
  const teams: LiveTeam[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const p2 = shuffled[i + 1] ?? null;
    teams.push(makeTeam(shuffled[i], p2, `team-${i}`));
  }
  return teams;
}

function noRepeatPairing(players: LivePlayer[], previousTeams: LiveTeam[][]): LiveTeam[] {
  const usedPairs = new Set<string>();
  previousTeams.forEach(round => {
    round.forEach(team => {
      if (team.player2) {
        usedPairs.add([team.player1.id, team.player2.id].sort().join('-'));
      }
    });
  });

  const shuffled = shuffle(players);
  const available = [...shuffled];
  const teams: LiveTeam[] = [];
  let teamIdx = 0;

  while (available.length >= 2) {
    const p1 = available.shift()!;
    const partnerIdx = available.findIndex(p => {
      const key = [p1.id, p.id].sort().join('-');
      return !usedPairs.has(key);
    });
    const p2 = partnerIdx >= 0 ? available.splice(partnerIdx, 1)[0] : available.shift()!;
    teams.push(makeTeam(p1, p2, `team-${teamIdx++}`));
  }
  if (available.length === 1) {
    teams.push(makeTeam(available[0], null, `team-${teamIdx}`));
  }
  return teams;
}

// Berger sistem — round-robin raspored
function roundRobinPairing(players: LivePlayer[], round: number): LiveTeam[] {
  const n = players.length % 2 === 0 ? players.length : players.length + 1;
  const fixed = players[0];
  const rotating = [...players.slice(1)];
  const offset = (round - 1) % (n - 1);
  const rotated = [
    ...rotating.slice(rotating.length - offset),
    ...rotating.slice(0, rotating.length - offset),
  ];
  const all = [fixed, ...rotated];
  const teams: LiveTeam[] = [];
  for (let i = 0; i < n / 2; i++) {
    const p1 = all[i];
    const p2 = all[n - 1 - i];
    if (p1 && p2 && p1.id !== p2.id) {
      teams.push(makeTeam(p1, p2, `team-${i}`));
    }
  }
  return teams;
}

export function adminPairing(
  players: LivePlayer[],
  assignments: { player1Id: string; player2Id: string }[],
): LiveTeam[] {
  return assignments.map((a, i) => {
    const p1 = players.find(p => p.id === a.player1Id)!;
    const p2 = players.find(p => p.id === a.player2Id)!;
    return makeTeam(p1, p2, `team-${i}`);
  });
}
