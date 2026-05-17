import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

type Tab = 'login' | 'register' | 'forgot';

interface AuthPageProps {
  onClose?: () => void;
}

export default function AuthPage({ onClose }: AuthPageProps) {
  const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email, password);
        onClose?.();
      } else if (tab === 'register') {
        await signUp(email, password, username);
        setSuccess('Registracija uspešna! Proverite email za potvrdu.');
      } else {
        await resetPassword(email);
        setSuccess('Email za reset lozinke je poslat.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Greška');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'facebook' | 'azure') {
    try {
      await signInWithOAuth(provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OAuth greška');
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Tabs */}
      <div className="flex rounded-btn overflow-hidden border border-gborder mb-6">
        {(['login', 'register'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === t ? 'bg-blue text-white' : 'bg-surface2 text-text2 hover:bg-gborder'
            }`}
          >
            {t === 'login' ? 'Prijava' : 'Registracija'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {tab === 'register' && (
          <input
            className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
            placeholder="Korisničko ime"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {tab !== 'forgot' && (
          <input
            type="password"
            className="w-full border border-gborder rounded-btn px-3 py-2 text-sm outline-none focus:border-blue"
            placeholder="Lozinka"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        )}

        {error && <p className="text-gred text-sm">{error}</p>}
        {success && <p className="text-ggreen text-sm">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue hover:bg-blue-light text-white font-semibold py-2.5 rounded-btn transition-colors disabled:opacity-60"
        >
          {loading ? 'Učitavanje...' : tab === 'login' ? 'Prijavite se' : tab === 'register' ? 'Registrujte se' : 'Pošalji reset'}
        </button>
      </form>

      {tab === 'login' && (
        <button
          onClick={() => { setTab('forgot'); setError(''); setSuccess(''); }}
          className="w-full text-center text-sm text-text3 hover:text-blue mt-2"
        >
          Zaboravili ste lozinku?
        </button>
      )}
      {tab === 'forgot' && (
        <button
          onClick={() => setTab('login')}
          className="w-full text-center text-sm text-text3 hover:text-blue mt-2"
        >
          ← Nazad na prijavu
        </button>
      )}

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gborder" />
        <span className="text-text3 text-xs">ili</span>
        <div className="flex-1 h-px bg-gborder" />
      </div>

      <div className="space-y-2">
        <button
          onClick={() => handleOAuth('google')}
          className="w-full flex items-center justify-center gap-2 border border-gborder rounded-btn py-2.5 text-sm font-medium hover:bg-surface2 transition-colors"
        >
          <span>G</span> Nastavi sa Google
        </button>
        <button
          onClick={() => handleOAuth('facebook')}
          className="w-full flex items-center justify-center gap-2 border border-gborder rounded-btn py-2.5 text-sm font-medium hover:bg-surface2 transition-colors"
        >
          <span>f</span> Nastavi sa Facebook
        </button>
        <button
          onClick={() => handleOAuth('azure')}
          className="w-full flex items-center justify-center gap-2 border border-gborder rounded-btn py-2.5 text-sm font-medium hover:bg-surface2 transition-colors"
        >
          <span>⊞</span> Nastavi sa Microsoft
        </button>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full text-center text-sm text-text3 hover:text-text2 mt-4"
        >
          Nastavi kao gost
        </button>
      )}
    </div>
  );
}
