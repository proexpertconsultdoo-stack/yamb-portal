import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLiveGame } from '../../hooks/useLiveGame';
import type { PairingType, SessionFormat, LivePlayer } from '../../types/live';

const PAIRING_OPTIONS: { type: PairingType; label: string; desc: string }[] = [
  { type: 'fixed',            label: 'Fiksni parovi',      desc: 'Admin postavlja parove na početku, ne menjaju se tokom takmičenja' },
  { type: 'random',           label: 'Slučajni svaki put', desc: 'Kompjuter nasumično paruje pre svake partije' },
  { type: 'no_repeat',        label: 'Bez ponavljanja',    desc: 'Nasumično, ali isti par se ne ponavlja' },
  { type: 'all_combinations', label: 'Sve kombinacije',    desc: 'Svaki igrač igra sa svakim (round-robin)' },
  { type: 'admin_choice',     label: 'Admin bira',         desc: 'Admin ručno određuje parove pre svake partije' },
];

export default function LiveSetupPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  function createQuickRoom() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    navigate(`/live/room/${code}`);
  }

  const currentUser: LivePlayer | null = user && profile ? {
    id: user.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    is_host: true,
    joined_at: new Date().toISOString(),
  } : null;

  const { session, createSession, addPlayer, removePlayer, generateTeams, startRound } = useLiveGame(currentUser);

  const [step, setStep] = useState<'config' | 'players' | 'pairing'>('config');
  const [form, setForm] = useState({
    name: '',
    format: 'pairs_live' as SessionFormat,
    pairingType: 'random' as PairingType,
    totalRounds: '' as string,
    targetScore: '' as string,
    endType: 'rounds' as 'rounds' | 'score',
  });
  const [newPlayerUsername, setNewPlayerUsername] = useState('');
  const [error, setError] = useState('');

  function handleConfig(e: React.FormEvent) {
    e.preventDefault();
    createSession(
      form.name || 'Uživo sesija',
      form.format,
      form.pairingType,
      form.endType === 'rounds' ? Number(form.totalRounds) || null : null,
      form.endType === 'score'  ? Number(form.targetScore) || null : null,
    );
    setStep('players');
  }

  async function handleAddPlayer() {
    if (!newPlayerUsername.trim()) return;
    setError('');
    // U produkciji: traži igrača po username-u iz Supabase
    // Za demo: dodaj mock igrača
    const mockPlayer: LivePlayer = {
      id: `player-${Date.now()}`,
      username: newPlayerUsername,
      display_name: newPlayerUsername,
      avatar_url: null,
      is_host: false,
      joined_at: new Date().toISOString(),
    };
    addPlayer(mockPlayer);
    setNewPlayerUsername('');
  }

  function handleGenerateTeams() {
    generateTeams();
    setStep('pairing');
  }

  function handleStartRound() {
    startRound();
    navigate('/live/game');
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-text3 hover:text-navy">←</button>
        <h1 className="text-xl font-bold text-navy">Uživo igra</h1>
      </div>

      {/* Brza igra — odmah počni */}
      <div className="bg-gradient-to-br from-[#0A1628] to-[#1A2D5A] rounded-2xl p-5 border border-white/10">
        <div className="text-white font-bold text-lg mb-1">🏟️ Brza igra</div>
        <div className="text-white/60 text-sm mb-4">Kreiraj sobu odmah, podeli link sa drugarima i počnite da igrate. Bez registracije.</div>
        <button
          onClick={createQuickRoom}
          className="w-full py-3 bg-[#F5A623] text-[#0A1628] font-bold rounded-xl text-base hover:bg-[#F5B84A] transition-colors"
        >
          Kreiraj sobu i počni odmah →
        </button>
      </div>

      {user && profile ? (
      <>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gborder" />
        <span className="text-text3 text-xs">ili napravi sesiju sa naprednim opcijama</span>
        <div className="flex-1 h-px bg-gborder" />
      </div>

      {/* Step indikator */}
      <div className="flex gap-2">
        {['Podešavanja', 'Igrači', 'Parovi'].map((s, i) => (
          <div key={s} className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-btn ${
            i === (['config','players','pairing'].indexOf(step))
              ? 'bg-blue text-white'
              : i < (['config','players','pairing'].indexOf(step))
                ? 'bg-ggreen/20 text-ggreen'
                : 'bg-surface2 text-text3'
          }`}>{s}</div>
        ))}
      </div>

      {/* Korak 1: Konfiguracija */}
      {step === 'config' && (
        <form onSubmit={handleConfig} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text2 mb-1">Naziv sesije</label>
            <input
              className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
              placeholder="npr. Turnir subota"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text2 mb-2">Format igre</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'pairs_live', label: '👥 Parovi / Timovi' },
                { val: 'solo_live',  label: '👤 Pojedinci' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, format: opt.val as SessionFormat }))}
                  className={`py-3 text-sm font-semibold rounded-btn border transition-colors ${
                    form.format === opt.val ? 'bg-blue text-white border-blue' : 'border-gborder text-text2 hover:border-blue'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.format === 'pairs_live' && (
            <div>
              <label className="block text-sm font-medium text-text2 mb-2">Sistem pariranja</label>
              <div className="space-y-2">
                {PAIRING_OPTIONS.map(opt => (
                  <label key={opt.type} className={`flex items-start gap-3 p-3 rounded-btn border cursor-pointer transition-colors ${
                    form.pairingType === opt.type ? 'border-blue bg-blue/5' : 'border-gborder hover:border-blue/50'
                  }`}>
                    <input
                      type="radio"
                      name="pairingType"
                      value={opt.type}
                      checked={form.pairingType === opt.type}
                      onChange={() => setForm(f => ({ ...f, pairingType: opt.type }))}
                      className="mt-0.5 accent-blue"
                    />
                    <div>
                      <div className="font-semibold text-navy text-sm">{opt.label}</div>
                      <div className="text-xs text-text3 mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text2 mb-2">Kraj takmičenja</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { val: 'rounds', label: 'Broj partija' },
                { val: 'score',  label: 'Broj bodova' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, endType: opt.val as 'rounds'|'score' }))}
                  className={`py-2 text-sm font-semibold rounded-btn border transition-colors ${
                    form.endType === opt.val ? 'bg-navy text-white border-navy' : 'border-gborder text-text2 hover:border-navy/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.endType === 'rounds' ? (
              <input
                type="number"
                min="1"
                className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
                placeholder="Broj partija (npr. 5)"
                value={form.totalRounds}
                onChange={e => setForm(f => ({ ...f, totalRounds: e.target.value }))}
              />
            ) : (
              <input
                type="number"
                min="100"
                step="100"
                className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
                placeholder="Ciljani broj bodova (npr. 5000)"
                value={form.targetScore}
                onChange={e => setForm(f => ({ ...f, targetScore: e.target.value }))}
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue text-white font-semibold py-2.5 rounded-btn hover:bg-blue-light"
          >
            Dalje → Dodaj igrače
          </button>
        </form>
      )}

      {/* Korak 2: Dodavanje igrača */}
      {step === 'players' && session && (
        <div className="space-y-4">
          <div className="bg-surface2 rounded-btn px-4 py-2 text-sm text-text2">
            Kod sesije: <strong className="font-mono text-blue">{session.code}</strong>
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
              placeholder="Korisničko ime igrača"
              value={newPlayerUsername}
              onChange={e => setNewPlayerUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
            />
            <button
              onClick={handleAddPlayer}
              className="px-4 py-2 bg-blue text-white font-semibold rounded-btn hover:bg-blue-light"
            >
              +
            </button>
          </div>

          {error && <p className="text-gred text-sm">{error}</p>}

          <div className="space-y-2">
            {session.players.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-surface border border-gborder rounded-card">
                <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-sm font-bold text-text3">
                  {p.display_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-navy text-sm">{p.display_name}</div>
                  <div className="text-xs text-text3">@{p.username} {p.is_host && '· Admin'}</div>
                </div>
                {!p.is_host && (
                  <button
                    onClick={() => removePlayer(p.id)}
                    className="text-gred hover:opacity-70 text-sm"
                  >
                    Ukloni
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-sm text-text3">{session.players.length} igrač(a) dodato</div>

          <button
            onClick={handleGenerateTeams}
            disabled={session.players.length < 2}
            className="w-full bg-blue text-white font-semibold py-2.5 rounded-btn hover:bg-blue-light disabled:opacity-50"
          >
            Dalje → Generiši parove
          </button>
        </div>
      )}

      {/* Korak 3: Parovi */}
      {step === 'pairing' && session && (
        <div className="space-y-4">
          <div className="space-y-3">
            {session.teams.map((team, i) => (
              <div key={team.id} className="bg-surface border border-gborder rounded-card p-4">
                <div className="text-xs font-semibold text-text3 mb-2">TIM {i + 1}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-center">
                    <div className="font-semibold text-navy">{team.player1.display_name}</div>
                    <div className="text-xs text-text3">@{team.player1.username}</div>
                  </div>
                  {team.player2 && (
                    <>
                      <div className="text-accent font-bold text-lg">+</div>
                      <div className="flex-1 text-center">
                        <div className="font-semibold text-navy">{team.player2.display_name}</div>
                        <div className="text-xs text-text3">@{team.player2.username}</div>
                      </div>
                    </>
                  )}
                  {!team.player2 && (
                    <div className="flex-1 text-center text-text3 text-sm italic">Solo</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {session.pairing_type !== 'fixed' && session.pairing_type !== 'admin_choice' && (
            <button
              onClick={() => generateTeams()}
              className="w-full border border-gborder text-text2 font-semibold py-2 rounded-btn hover:bg-surface2"
            >
              ↺ Ponovo generiši parove
            </button>
          )}

          <button
            onClick={handleStartRound}
            className="w-full bg-ggreen text-white font-bold py-3 rounded-btn hover:opacity-90 text-lg"
          >
            🎲 Pokreni partiju!
          </button>
        </div>
      )}
      </>
      ) : (
        <div className="text-center py-4">
          <p className="text-text3 text-sm mb-3">Prijavite se da biste koristili napredne opcije sesije.</p>
          <button onClick={() => navigate('/auth')} className="px-5 py-2 bg-blue text-white rounded-btn text-sm font-semibold">
            Prijavite se
          </button>
        </div>
      )}
    </div>
  );
}
