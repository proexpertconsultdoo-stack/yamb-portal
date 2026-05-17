import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Tournament } from '../../types/game';

const FORMAT_LABELS = {
  swiss:          'Švajcarski sistem',
  elimination:    'Ispadanje',
  round_robin:    'Svako sa svakim',
  qualification:  'Kvalifikacije',
};

const FORMAT_ICONS = {
  swiss: '🇨🇭', elimination: '⚔️', round_robin: '🔄', qualification: '🏁',
};

const PLACEHOLDER: Tournament[] = [
  { id: '1', name: 'Nedeljni kup', format: 'swiss', status: 'upcoming', max_players: 32, current_players: 14, entry_fee: 0, prize_pool: 0, starts_at: new Date(Date.now() + 86400000*2).toISOString() },
  { id: '2', name: 'Mesečni turnir', format: 'elimination', status: 'active',  max_players: 16, current_players: 16, entry_fee: 0, prize_pool: 0, starts_at: new Date().toISOString() },
  { id: '3', name: 'Elo liga', format: 'round_robin', status: 'upcoming', max_players: 8,  current_players: 3,  entry_fee: 0, prize_pool: 0, starts_at: new Date(Date.now() + 86400000*5).toISOString() },
];

type Tab = 'browse' | 'create' | 'mine';

export default function TournamentPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('browse');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', format: 'swiss' as Tournament['format'], maxPlayers: 16 });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setTournaments(PLACEHOLDER); return; }
    setLoading(true);
    Promise.resolve(supabase.from('tournaments').select('*').order('starts_at'))
      .then(({ data }) => {
        if (data) setTournaments(data as Tournament[]);
      }).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isSupabaseConfigured) return;
    setCreating(true);
    await supabase.from('tournaments').insert({
      name: createForm.name,
      format: createForm.format,
      max_players: createForm.maxPlayers,
      status: 'upcoming',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
    });
    setCreating(false);
    setTab('browse');
  }

  const statusColor = (s: Tournament['status']) =>
    s === 'active' ? 'text-ggreen' : s === 'upcoming' ? 'text-blue' : 'text-text3';

  const statusLabel = (s: Tournament['status']) =>
    s === 'active' ? 'U toku' : s === 'upcoming' ? 'Predstojeći' : 'Završen';

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-navy mb-4">Turniri</h1>

      <div className="flex rounded-btn overflow-hidden border border-gborder mb-4">
        {(['browse', 'create', 'mine'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === t ? 'bg-blue text-white' : 'bg-surface2 text-text2 hover:bg-gborder'
            }`}
          >
            {t === 'browse' ? 'Pretraži' : t === 'create' ? 'Kreiraj' : 'Moji'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="space-y-3">
          {loading && <p className="text-center text-text3 py-8">Učitavanje...</p>}
          {!loading && tournaments.filter(t => t.status !== 'finished').map(t => (
            <div key={t.id} className="bg-surface border border-gborder rounded-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{FORMAT_ICONS[t.format]}</span>
                    <span className="font-semibold text-navy">{t.name}</span>
                  </div>
                  <div className="text-xs text-text3 mt-0.5">{FORMAT_LABELS[t.format]}</div>
                </div>
                <span className={`text-xs font-semibold ${statusColor(t.status)}`}>
                  {statusLabel(t.status)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-text3">
                  {t.current_players}/{t.max_players} igrača
                </div>
                <div className="text-xs text-text3">
                  {new Date(t.starts_at).toLocaleDateString('sr')}
                </div>
              </div>
              {t.status === 'upcoming' && t.current_players < t.max_players && (
                <button className="mt-3 w-full bg-blue text-white text-sm font-semibold py-2 rounded-btn hover:bg-blue-light transition-colors">
                  Prijavi se
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text2 mb-1">Naziv turnira</label>
            <input
              className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
              placeholder="Npr. Prijateljski turnir"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text2 mb-2">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FORMAT_LABELS) as Tournament['format'][]).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setCreateForm(f => ({ ...f, format: fmt }))}
                  className={`flex items-center gap-2 p-3 rounded-btn border text-sm transition-colors ${
                    createForm.format === fmt
                      ? 'border-blue bg-blue/10 text-blue font-semibold'
                      : 'border-gborder text-text2 hover:border-blue'
                  }`}
                >
                  <span>{FORMAT_ICONS[fmt]}</span>
                  <span>{FORMAT_LABELS[fmt]}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text2 mb-1">Maks. igrača</label>
            <div className="flex gap-2">
              {[8, 16, 32, 64].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCreateForm(f => ({ ...f, maxPlayers: n }))}
                  className={`flex-1 py-2 rounded-btn border text-sm font-semibold transition-colors ${
                    createForm.maxPlayers === n
                      ? 'bg-blue text-white border-blue'
                      : 'border-gborder text-text2 hover:border-blue'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !user}
            className="w-full bg-blue text-white font-semibold py-2.5 rounded-btn hover:bg-blue-light disabled:opacity-60"
          >
            {creating ? 'Kreiram...' : !user ? 'Prijavite se da kreirate' : 'Kreiraj turnir'}
          </button>
        </form>
      )}

      {tab === 'mine' && (
        <div className="py-8 text-center text-text3">
          {user ? 'Niste prijavljeni ni za jedan turnir' : 'Prijavite se da vidite svoje turnire'}
        </div>
      )}
    </div>
  );
}
