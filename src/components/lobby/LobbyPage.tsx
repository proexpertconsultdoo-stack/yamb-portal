import { useState, useEffect } from 'react';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useAuth } from '../../hooks/useAuth';
import type { Room } from '../../types/game';

export default function LobbyPage() {
  const { user } = useAuth();
  const { publicRooms, fetchPublicRooms, createRoom, joinRoom, leaveRoom, room } = useMultiplayer(user?.id);
  const [tab, setTab] = useState<'browse' | 'create' | 'join'>('browse');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchPublicRooms(); }, [fetchPublicRooms]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setError('Morate biti prijavljeni'); return; }
    setLoading(true); setError('');
    try {
      await createRoom(roomName || 'Moja soba', isPrivate, maxPlayers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Greška');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(codeOrId: string) {
    if (!user) { setError('Morate biti prijavljeni'); return; }
    setLoading(true); setError('');
    try {
      await joinRoom(codeOrId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Greška');
    } finally {
      setLoading(false);
    }
  }

  if (room) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="bg-surface rounded-card border border-gborder p-6 text-center">
          <div className="text-4xl mb-3">🏠</div>
          <h2 className="text-xl font-bold text-navy">{room.name}</h2>
          <p className="text-text3 text-sm mt-1">Kod sobe: <strong className="text-blue font-mono">{room.code}</strong></p>
          <p className="text-text3 text-sm mt-1">{room.current_players}/{room.max_players} igrača</p>
          <div className="mt-4 p-3 bg-surface2 rounded-btn text-sm text-text2">
            Čeka se da se pridruže igrači...
          </div>
          <button
            onClick={leaveRoom}
            className="mt-4 w-full border border-gred text-gred font-semibold py-2.5 rounded-btn hover:bg-gred/10"
          >
            Napusti sobu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-navy mb-4">Lobby</h1>

      {/* Tabs */}
      <div className="flex rounded-btn overflow-hidden border border-gborder mb-4">
        {(['browse', 'create', 'join'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === t ? 'bg-blue text-white' : 'bg-surface2 text-text2 hover:bg-gborder'
            }`}
          >
            {t === 'browse' ? 'Pretraži' : t === 'create' ? 'Kreiraj' : 'Pridruži se'}
          </button>
        ))}
      </div>

      {error && <p className="text-gred text-sm mb-3">{error}</p>}

      {/* Browse */}
      {tab === 'browse' && (
        <div className="space-y-3">
          <button
            onClick={fetchPublicRooms}
            className="text-sm text-blue hover:underline"
          >
            ↺ Osveži
          </button>
          {publicRooms.length === 0 ? (
            <p className="text-center text-text3 py-8">Nema dostupnih soba</p>
          ) : publicRooms.map((r: Room) => (
            <div key={r.id} className="bg-surface border border-gborder rounded-card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-navy">{r.name}</div>
                <div className="text-xs text-text3">{r.current_players}/{r.max_players} igrača · #{r.code}</div>
              </div>
              <button
                onClick={() => handleJoin(r.id)}
                className="px-3 py-1.5 bg-blue text-white text-sm font-semibold rounded-btn hover:bg-blue-light"
              >
                Uđi
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      {tab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
            placeholder="Naziv sobe"
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-text2">Maks igrača:</label>
            {[2, 3, 4, 6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxPlayers(n)}
                className={`w-9 h-9 rounded-btn text-sm font-semibold border transition-colors ${
                  maxPlayers === n ? 'bg-blue text-white border-blue' : 'border-gborder text-text2 hover:border-blue'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-text2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="accent-blue"
            />
            Privatna soba (samo sa kodom)
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue text-white font-semibold py-2.5 rounded-btn hover:bg-blue-light disabled:opacity-60"
          >
            {loading ? 'Kreiram...' : 'Kreiraj sobu'}
          </button>
        </form>
      )}

      {/* Join by code */}
      {tab === 'join' && (
        <div className="space-y-3">
          <input
            className="w-full border border-gborder rounded-btn px-3 py-2 text-sm font-mono outline-none focus:border-blue uppercase tracking-widest"
            placeholder="Unesi kod sobe"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button
            onClick={() => handleJoin(joinCode)}
            disabled={joinCode.length < 4 || loading}
            className="w-full bg-blue text-white font-semibold py-2.5 rounded-btn hover:bg-blue-light disabled:opacity-60"
          >
            {loading ? 'Pridružujem...' : 'Pridruži se'}
          </button>
        </div>
      )}
    </div>
  );
}
