import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ColName, RowName, AllScores } from '../../types/game';
import { COLS, COL_LABELS, ALL_ROWS, ROW_LABELS } from '../../constants/game';
import { emptyScores } from '../../utils/gameRules';
import { calcColTotal, calcGrandTotal, topSectionSum, topBonus, middleSectionValue } from '../../utils/scoring';
import ManualEntryDialog from './ManualEntryDialog';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Team {
  id: string;
  name: string;
  scores: AllScores;
  colPointers: Record<ColName, number>;
  diamondTopPtr: number;
  diamondBotPtr: number;
  hourglassTopPtr: number;
  hourglassBotPtr: number;
}

const DIAMOND_TOP: RowName[] = ['max','r6','r5','r4','r3','r2','r1'];
const DIAMOND_BOT: RowName[] = ['min','kenta','triling','ful','poker','yamb'];
const HOURGLASS_TOP: RowName[] = ['r1','r2','r3','r4','r5','r6','max'];
const HOURGLASS_BOT: RowName[] = ['yamb','poker','ful','triling','kenta','min'];
const TOP_ROWS: RowName[] = ['r1','r2','r3','r4','r5','r6'];
const MID_ROWS: RowName[] = ['max','min'];
const BOT_ROWS: RowName[] = ['kenta','triling','ful','poker','yamb'];

function makeTeam(id: string, name: string): Team {
  return {
    id, name,
    scores: emptyScores(),
    colPointers: { down:0, free:0, up:12, announce:0, manual:0, directed:0, diamond:0, hourglass:0, obligatory:0, max:0 },
    diamondTopPtr: 0, diamondBotPtr: 0, hourglassTopPtr: 0, hourglassBotPtr: 0,
  };
}

function isCellOpen(col: ColName, row: RowName, team: Team): boolean {
  if (team.scores[col][row] !== null) return false;
  if (col === 'max') return false;
  if (col === 'down') return ALL_ROWS.indexOf(row) === team.colPointers.down;
  if (col === 'up')   return ALL_ROWS.indexOf(row) === team.colPointers.up;
  if (col === 'free' || col === 'announce' || col === 'manual') return true;
  if (col === 'directed') return true;
  if (col === 'obligatory') return ALL_ROWS[team.colPointers.obligatory] === row;
  if (col === 'diamond') {
    return DIAMOND_TOP[team.diamondTopPtr] === row || DIAMOND_BOT[team.diamondBotPtr] === row;
  }
  if (col === 'hourglass') {
    return HOURGLASS_TOP[team.hourglassTopPtr] === row || HOURGLASS_BOT[team.hourglassBotPtr] === row;
  }
  return false;
}

function advanceTeamPointer(team: Team, col: ColName, row: RowName): Partial<Team> {
  const cp = { ...team.colPointers };
  let { diamondTopPtr, diamondBotPtr, hourglassTopPtr, hourglassBotPtr } = team;
  if (col === 'down') cp.down++;
  if (col === 'up')   cp.up--;
  if (col === 'obligatory') cp.obligatory++;
  if (col === 'diamond') {
    if (DIAMOND_TOP[diamondTopPtr] === row) diamondTopPtr++;
    else diamondBotPtr++;
  }
  if (col === 'hourglass') {
    if (HOURGLASS_TOP[hourglassTopPtr] === row) hourglassTopPtr++;
    else hourglassBotPtr++;
  }
  return { colPointers: cp, diamondTopPtr, diamondBotPtr, hourglassTopPtr, hourglassBotPtr };
}

export default function LiveRoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([
    makeTeam('t1', 'Par 1'),
    makeTeam('t2', 'Par 2'),
    makeTeam('t3', 'Par 3'),
  ]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [entry, setEntry] = useState<{ col: ColName; row: RowName } | null>(null);
  const [roomCode] = useState(code ?? Math.random().toString(36).slice(2,8).toUpperCase());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Sync via Supabase Realtime
  useEffect(() => {
    const ch = supabase.channel(`live-room:${roomCode}`, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'score_update' }, ({ payload }) => {
      setTeams(payload.teams);
    }).subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [roomCode]);

  const broadcast = useCallback((updatedTeams: Team[]) => {
    channelRef.current?.send({ type: 'broadcast', event: 'score_update', payload: { teams: updatedTeams } });
  }, []);

  function handleConfirm(score: number) {
    if (!entry) return;
    const { col, row } = entry;
    setTeams(prev => {
      const next = prev.map((t, i) => {
        if (i !== activeTeamIdx) return t;
        const newScores = { ...t.scores, [col]: { ...t.scores[col], [row]: score } };
        const ptrs = advanceTeamPointer(t, col, row);
        return { ...t, scores: newScores, ...ptrs };
      });
      broadcast(next);
      return next;
    });
    setEntry(null);
  }

  const shareUrl = `${window.location.origin}/live/room/${roomCode}`;
  const team = teams[activeTeamIdx];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0F1B3C] to-[#1A2D5A]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-white/60 hover:text-white transition-colors">
            ← Nazad
          </button>
          <div className="text-center">
            <div className="text-white font-bold tracking-tight">Yamb Uživo</div>
            <div className="text-accent text-xs font-mono font-bold tracking-widest">{roomCode}</div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl); }}
            className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 border border-accent/30 rounded-lg text-accent text-xs font-semibold transition-colors"
          >
            📋 Kopiraj link
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4 space-y-4">
        {/* Tim selector */}
        <div className="grid grid-cols-3 gap-2">
          {teams.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveTeamIdx(i)}
              className={`relative py-3 px-2 rounded-xl border-2 transition-all ${
                i === activeTeamIdx
                  ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20 scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className={`text-xs font-semibold mb-0.5 ${i===activeTeamIdx?'text-accent':'text-white/50'}`}>
                {t.name}
              </div>
              <div className={`text-2xl font-bold ${i===activeTeamIdx?'text-white':'text-white/70'}`}>
                {calcGrandTotal(t.scores)}
              </div>
              {i === activeTeamIdx && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Team name editor */}
        <div className="flex items-center gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent/50 placeholder-white/30"
            value={team.name}
            onChange={e => setTeams(prev => prev.map((t,i) => i===activeTeamIdx ? {...t, name: e.target.value} : t))}
            placeholder="Naziv para"
          />
          <div className="text-white/30 text-xs">←naziv</div>
        </div>

        {/* Scorecard */}
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-navy to-navy2">
                  <th className="text-left pl-3 py-3 text-white/70 text-xs font-semibold w-20 border-r border-white/10">Polje</th>
                  {COLS.map(col => (
                    <th key={col} className={`py-3 text-xs font-bold w-10 border-r border-white/10 last:border-0 ${col==='max'?'text-white/40':'text-accent'}`}>
                      {COL_LABELS[col]}
                    </th>
                  ))}
                  <th className="py-3 text-xs font-semibold text-white/50 px-2">∑ red</th>
                </tr>
              </thead>
              <tbody>
                {/* Top section */}
                {TOP_ROWS.map((row, ri) => (
                  <ScorecardRow key={row} row={row} team={team} onCellClick={(col) => setEntry({ col, row })} ri={ri} />
                ))}

                {/* Top sum */}
                <tr className="bg-white/5">
                  <td className="pl-3 py-1.5 text-white/40 text-xs border-b border-white/5 border-r border-white/10">Zbir 1-6</td>
                  {COLS.map(col => (
                    <td key={col} className="text-center text-xs text-white/60 border-b border-white/5 border-r border-white/10 last:border-r-0">
                      {topSectionSum(team.scores[col]) || ''}
                    </td>
                  ))}
                  <td />
                </tr>
                <tr className="bg-accent/5">
                  <td className="pl-3 py-1.5 text-accent/60 text-xs border-b border-white/5 border-r border-white/10">Bonus</td>
                  {COLS.map(col => (
                    <td key={col} className="text-center text-xs font-bold text-accent border-b border-white/5 border-r border-white/10 last:border-r-0">
                      {topBonus(team.scores[col]) > 0 ? '+30' : ''}
                    </td>
                  ))}
                  <td />
                </tr>

                {/* Mid section */}
                {MID_ROWS.map((row, ri) => (
                  <ScorecardRow key={row} row={row} team={team} onCellClick={(col) => setEntry({ col, row })} ri={ri} />
                ))}
                <tr className="bg-white/5">
                  <td className="pl-3 py-1.5 text-white/40 text-xs border-b border-white/5 border-r border-white/10">(M-m)×1</td>
                  {COLS.map(col => (
                    <td key={col} className="text-center text-xs text-white/60 border-b border-white/5 border-r border-white/10 last:border-r-0">
                      {middleSectionValue(team.scores[col], team.scores[col]['r1']) || ''}
                    </td>
                  ))}
                  <td />
                </tr>

                {/* Bottom section */}
                {BOT_ROWS.map((row, ri) => (
                  <ScorecardRow key={row} row={row} team={team} onCellClick={(col) => setEntry({ col, row })} ri={ri} />
                ))}

                {/* Totals */}
                <tr className="bg-gradient-to-r from-navy to-navy2">
                  <td className="pl-3 py-2.5 text-white font-bold text-xs border-r border-white/10">Ukupno</td>
                  {COLS.map(col => (
                    <td key={col} className="text-center py-2.5 text-xs font-bold border-r border-white/10 last:border-r-0 text-accent">
                      {calcColTotal(col, team.scores[col]) || '–'}
                    </td>
                  ))}
                  <td className="text-center py-2.5 text-accent font-bold text-sm">{calcGrandTotal(team.scores)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Svi rezultati */}
        <div className="grid grid-cols-3 gap-2">
          {teams.map(t => (
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-white/50 text-xs mb-1">{t.name}</div>
              <div className="text-2xl font-bold text-white">{calcGrandTotal(t.scores)}</div>
            </div>
          ))}
        </div>

        {/* Share info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-white/50 text-xs mb-2">Podeli ovaj link sa drugarima</div>
          <div className="text-accent font-mono text-sm break-all">{shareUrl}</div>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="mt-3 px-4 py-2 bg-accent text-navy font-bold rounded-lg text-sm hover:bg-accent2 transition-colors"
          >
            📋 Kopiraj link
          </button>
        </div>
      </div>

      {/* Manual entry dialog */}
      {entry && (
        <ManualEntryDialog
          row={entry.row}
          onConfirm={handleConfirm}
          onCancel={() => setEntry(null)}
        />
      )}
    </div>
  );
}

function ScorecardRow({ row, team, onCellClick, ri }: {
  row: RowName; team: Team; onCellClick: (col: ColName) => void; ri: number;
}) {
  return (
    <tr className={`${ri%2===0?'bg-white/[0.02]':'bg-transparent'} hover:bg-white/5 transition-colors`}>
      <td className="pl-3 py-2 text-white/70 text-xs font-medium border-b border-white/5 border-r border-white/10">
        {ROW_LABELS[row]}
      </td>
      {COLS.map(col => {
        const val   = team.scores[col][row];
        const open  = isCellOpen(col, row, team);
        const filled = val !== null;
        return (
          <td
            key={col}
            onClick={() => open && onCellClick(col)}
            className={`text-center text-xs py-2 border-b border-white/5 border-r border-white/10 last:border-r-0 transition-all select-none ${
              col === 'max'
                ? 'text-white/30 cursor-default bg-white/[0.02]'
                : filled
                  ? 'text-white/80 cursor-default'
                  : open
                    ? 'cursor-pointer text-accent/60 hover:bg-accent/20 hover:text-accent font-semibold animate-pulse'
                    : 'text-white/10 cursor-default'
            }`}
          >
            {filled ? val : open ? '·' : ''}
          </td>
        );
      })}
      <td className="text-center text-xs text-white/30 px-2">
        {['r1','r2','r3','r4','r5','r6'].includes(row)
          ? (COLS.filter(c=>c!=='max').reduce((s,c)=>s+(team.scores[c][row]??0),0) || '')
          : ''}
      </td>
    </tr>
  );
}
