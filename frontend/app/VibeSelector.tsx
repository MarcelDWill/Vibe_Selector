// =====================================
// app/VibeSelector.tsx (your component, updated to use the hook)
// =====================================
'use client';

import { useState } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';

const extractDriveId = (idOrUrl: string) => {
  if (!idOrUrl) return '';
  if (idOrUrl.length > 20 && !idOrUrl.includes('/')) return idOrUrl;
  const match = idOrUrl.match(/\/d\/(.+?)\//) || idOrUrl.match(/id=([^&]+)/);
  return match ? match[1] : idOrUrl;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://vibe-selector.onrender.com';

interface Song {
  title: string;
  drive_id: string;
  persona: string;
}

export default function VibeSelector() {
  const [vibeColor, setVibeColor] = useState('bg-slate-900');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const player = useAudioPlayer();

  const handleVibeClick = async (persona: string, color: string) => {
    setVibeColor(color);
    setFetchError(null);

    try {
      const res = await fetch(`${API_URL}/songs/${encodeURIComponent(persona)}`);
      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = (await res.json()) as Song;
      setCurrentSong(data);

      const driveId = extractDriveId(data.drive_id);
      const audioSrc = `${API_URL}/stream/${encodeURIComponent(driveId)}`;

      player.setSource(audioSrc, { autoplay: true });
    } catch (e) {
      console.error('Could not fetch song:', e);
      setFetchError('Could not fetch song for that artist.');
      player.setSource(undefined);
      setCurrentSong(null);
    }
  };

  return (
    <main className={`${vibeColor} min-h-screen transition-colors duration-1000 flex flex-col items-center justify-center p-10`}>
      <h1 className="text-white text-6xl font-black mb-16 tracking-tighter italic">
        VIBE SELECTOR
      </h1>

      <div className="flex gap-12">
        <button
          onClick={() => handleVibeClick('Ruby', 'bg-rose-600')}
          className="w-44 h-44 rounded-full bg-white/10 border-2 border-white/30 text-white font-bold hover:scale-110 hover:bg-white/20 transition-all shadow-2xl"
        >
          Ruby
        </button>

        <button
          onClick={() => handleVibeClick('Marshall', 'bg-sky-700')}
          className="w-44 h-44 rounded-full bg-white/10 border-2 border-white/30 text-white font-bold hover:scale-110 hover:bg-white/20 transition-all shadow-2xl"
        >
          Marshall
        </button>
      </div>

      <audio ref={player.audioRef} preload="auto" />

      {(player.isLoading) && (
        <p className="text-white animate-pulse mt-8">Tuning into the vibe...</p>
      )}

      {(fetchError || player.error) && (
        <p className="text-white mt-6 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
          {fetchError ?? player.error}
        </p>
      )}

      {currentSong && !player.isLoading && (
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={player.toggle}
            className="mb-4 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
          >
            {player.isPlaying ? 'PAUSE VIBE' : 'PLAY VIBE'}
          </button>

          <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 text-white text-center">
            <h2 className="text-2xl font-bold">{currentSong.title}</h2>
          </div>
        </div>
      )}
    </main>
  );
}
