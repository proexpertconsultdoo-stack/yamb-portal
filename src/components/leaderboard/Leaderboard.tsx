import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type Period = 'all_time' | 'weekly' | 'daily';
type Mode   = 'solo' | 'multiplayer';

interface Entry {
  rank: number;
  username: string;
  display_name: string;
  score: number;
  avatar_url: string | null;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [period, setPeriod]   = useState<Period>('all_time');
  const [mode, setMode]       = useState<Mode>('solo');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Placeholder data for demo
      setEntries([
        { rank: 1, username: 'petar', display_name: 'Petar P.', score: 4250, avatar_url: null },
        { rank: 2, username: 'marko', display_name: 'Marko M.', score: 3980, avatar_url: null },
        { rank: 3, username: 'ana',   display_name: 'Ana A.',   score: 3710, avatar_url: null },
        { rank: 4, username: 'ivan',  display_name: 'Ivan I.',  score: 3540, avatar_url: null },
        { rank: 5, username: 'nina',  display_name: 'Nina N.',  score: 3320, avatar_url: null },
      ]);
      return;
    }

    setLoading(true);
    const now = new Date();
    let since = new Date(0);
    if (period === 'weekly') { since = new Date(now); since.setDate(now.getDate() - 7); }
    if (period === 'daily')  { since = new Date(now); since.setHours(0,0,0,0); }

    Promise.resolve(
      supabase
        .from('games')
        .select('user_id, total, profiles(username, display_name, avatar_url)')
        .eq('mode', mode)
        .gte('created_at', since.toISOString())
        .order('total', { ascending: false })
        .limit(50)
    ).then(({ data }) => {
      if (data) {
        setEntries((data as any[]).map((d, i) => ({
          rank: i + 1,
          username: d.profiles?.username ?? '?',
          display_name: d.profiles?.display_name ?? '?',
          score: d.total,
          avatar_url: d.profiles?.avatar_url ?? null,
        })));
      }
    }).finally(() => setLoading(false));
  }, [period, mode]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-navy mb-4">Rang lista</h1>

      {/* Mode tabs */}
      <div className="flex rounded-btn overflow-hidden border border-gborder mb-3">
        {(['solo', 'multiplayer'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              mode === m ? 'bg-blue text-white' : 'bg-surface2 text-text2 hover:bg-gborder'
            }`}
          >
            {m === 'solo' ? '👤 Solo' : '🌐 Online'}
          </button>
        ))}
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-4">
        {(['all_time', 'weekly', 'daily'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              period === p ? 'bg-navy text-white border-navy' : 'border-gborder text-text3 hover:border-navy'
            }`}
          >
            {p === 'all_time' ? 'Ukupno' : p === 'weekly' ? 'Sedmica' : 'Danas'}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-text3 py-8">Učitavanje...</p>}

      {!loading && entries.length === 0 && (
        <p className="text-center text-text3 py-8">Nema podataka</p>
      )}

      <div className="space-y-2">
        {entries.map(e => (
          <div
            key={e.username}
            className={`flex items-center gap-3 p-3 rounded-card border ${
              e.rank <= 3 ? 'border-accent bg-accent/5' : 'border-gborder bg-surface'
            }`}
          >
            <div className="w-8 text-center font-bold text-navy">
              {e.rank <= 3 ? MEDAL[e.rank - 1] : e.rank}
            </div>
            <div className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center text-lg font-bold text-text3 overflow-hidden">
              {e.avatar_url
                ? <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                : e.display_name[0]?.toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-navy text-sm truncate">{e.display_name}</div>
              <div className="text-xs text-text3">@{e.username}</div>
            </div>
            <div className="font-bold text-navy">{e.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
