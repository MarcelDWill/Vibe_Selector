// frontend/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const extractDriveId = (idOrUrl: string) => {
  if (!idOrUrl) return '';
  if (idOrUrl.length > 20 && !idOrUrl.includes('/')) return idOrUrl;
  const match = idOrUrl.match(/\/d\/(.+?)\//) || idOrUrl.match(/id=([^&]+)/);
  return match ? match[1] : idOrUrl;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://vibe-selector-api.onrender.com';

interface Song {
  title: string;
  drive_id: string;
  persona: string;
}

export default function Page() {
  const [vibeColor, setVibeColor] = useState('bg-slate-900');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Keep isPlaying in sync with actual <audio> state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setErrorMsg('Audio failed to load/play.');

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // When a new song is set, reload + try autoplay.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong) {
      setErrorMsg(null);
      audio.pause();
      audio.load();
      audio.play().catch((e) => {
        console.error('Playback failed:', e);
        setErrorMsg('Browser blocked autoplay. Tap PLAY VIBE.');
      });
    }
  }, [currentSong]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch((e) => {
        console.error('Playback error:', e);
        setErrorMsg('Could not play audio.');
      });
    } else {
      audio.pause();
    }
  };

  const handleVibeClick = async (persona: string, color: string) => {
    setVibeColor(color);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/songs/${encodeURIComponent(persona)}`);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text}`);
      }

      const data = (await res.json()) as Song;
      setCurrentSong(data);
    } catch (err) {
      console.error('Could not fetch song:', err);
      setErrorMsg('Could not fetch song for that artist.');
      setCurrentSong(null);
    } finally {
      setIsLoading(false);
    }
  };

  // PROXY STREAM SOURCE: your backend serves the bytes and supports Range requests.
  const audioSrc = currentSong
    ? `${API_URL}/stream/${encodeURIComponent(extractDriveId(currentSong.drive_id))}`
    : undefined;

  return (
    <main
      className={`${vibeColor} min-h-screen transition-colors duration-1000 flex flex-col items-center justify-center p-10`}
    >
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

      <audio ref={audioRef} src={audioSrc} preload="auto" />

      {isLoading && (
        <p className="text-white animate-pulse mt-8">Tuning into the vibe...</p>
      )}

      {errorMsg && (
        <p className="text-white mt-6 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
          {errorMsg}
        </p>
      )}

      {currentSong && !isLoading && (
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={togglePlay}
            className="mb-4 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
          >
            {isPlaying ? 'PAUSE VIBE' : 'PLAY VIBE'}
          </button>

          <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 text-white text-center">
            <h2 className="text-2xl font-bold">{currentSong.title}</h2>
          </div>
        </div>
      )}
    </main>
  );
}
