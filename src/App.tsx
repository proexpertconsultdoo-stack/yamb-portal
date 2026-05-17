import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/ui/Nav';
import BottomNav from './components/ui/BottomNav';
import GameModeSelect from './components/game/GameModeSelect';
import GameBoard from './components/game/GameBoard';
import LobbyPage from './components/lobby/LobbyPage';
import Leaderboard from './components/leaderboard/Leaderboard';
import ProfilePage from './components/profile/ProfilePage';
import TournamentPage from './components/tournament/TournamentPage';
import AuthPage from './components/auth/AuthPage';
import LiveSetupPage from './components/live/LiveSetupPage';
import LiveRoomPage from './components/live/LiveRoomPage';
import type { GameMode, BotLevel } from './types/game';

function HomePage() {
  const [activeMode, setActiveMode] = useState<{ mode: GameMode; botLevel?: BotLevel } | null>(null);

  if (activeMode) {
    return (
      <GameBoard
        onExit={() => setActiveMode(null)}
        training={activeMode.mode === 'training'}
      />
    );
  }

  return <GameModeSelect onSelect={(mode, botLevel) => setActiveMode({ mode, botLevel })} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg flex flex-col">
        <Nav />
        <main className="flex-1 max-w-2xl mx-auto w-full">
          <Routes>
            <Route path="/"            element={<HomePage />} />
            <Route path="/lobby"       element={<LobbyPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile"     element={<ProfilePage />} />
            <Route path="/tournaments" element={<TournamentPage />} />
            <Route path="/live"           element={<LiveSetupPage />} />
            <Route path="/live/room/:code" element={<LiveRoomPage />} />
            <Route path="/auth"        element={
              <div className="p-6">
                <h1 className="text-xl font-bold text-navy mb-6 text-center">Yamb Portal</h1>
                <AuthPage />
              </div>
            } />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
