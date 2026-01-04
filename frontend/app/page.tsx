'use client';

import { useMemo, useState } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibe-selector.onrender.com';

const extractDriveId = (idOrUrl: string) => {
  if (!idOrUrl) return '';
  const match = idOrUrl.match(/\/d\/(.+?)\//) || idOrUrl.match(/id=([^&]+)/);
  return match ? match[1] : idOrUrl;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

interface Song {
  title: string;
  drive_id: string;
  persona: string;
}

export default function Page() {
  const player = useAudioPlayer();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [bgImage, setBgImage] = useState('/default-bg.jpg'); // Ensure this exists in /public
  const [isLoadingSong, setIsLoadingSong] = useState(false);

  // Dynamic glow styles based on persona
  const isRuby = currentSong?.persona === 'Ruby';
  const isMarshall = currentSong?.persona === 'Marshall';
  const accentColor = isRuby ? 'shadow-rose-500/50 border-rose-500/30' : 
                     isMarshall ? 'shadow-sky-500/50 border-sky-500/30' : 
                     'shadow-white/10 border-white/10';

  const audioSrc = useMemo(() => {
    if (!currentSong) return undefined;
    const driveId = extractDriveId(currentSong.drive_id);
    return `${API_URL}/stream/${encodeURIComponent(driveId)}`;
  }, [currentSong]);

  const handleVibeClick = async (persona: string, bgPath: string) => {
    setBgImage(bgPath);
    setIsLoadingSong(true);
    try {
      const res = await fetch(`${API_URL}/songs/${encodeURIComponent(persona)}`);
      const data = (await res.json()) as Song;
      setCurrentSong(data);
      const src = `${API_URL}/stream/${encodeURIComponent(extractDriveId(data.drive_id))}`;
      player.setSource(src, { autoplay: true });
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsLoadingSong(false);
    }
  };

  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center transition-all duration-1000"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* THE FLASHY PLAYER CONTAINER */}
      <div className={`relative z-10 w-full max-w-sm bg-black/85 backdrop-blur-3xl rounded-[3.5rem] border transition-all duration-500 shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)] ${accentColor} p-8 flex flex-col items-center space-y-10 overflow-hidden`}>
        
        {/* GLASS REFLECTION EFFECT */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
        
        {/* TOP HIGHLIGHT (The "Rim" light) */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <header className="relative z-20">
          <h1 className="text-white/40 text-[10px] font-black tracking-[0.5em] uppercase italic">
            Vibe Selector
          </h1>
        </header>

        {/* IMAGE ORBS */}
        <div className="relative z-20 flex justify-around w-full gap-2">
          {['Ruby', 'Marshall'].map((p) => (
            <div key={p} className="flex flex-col items-center gap-3">
              <button 
                onClick={() => handleVibeClick(p, `/${p.toLowerCase()}-bg.jpg`)}
                className={`w-24 h-24 rounded-full overflow-hidden border-2 transition-all duration-300 hover:scale-110 active:scale-95 
                  ${currentSong?.persona === p ? (p === 'Ruby' ? 'border-rose-500 ring-4 ring-rose-500/20 shadow-[0_0_25px_rgba(244,63,94,0.4)]' : 'border-sky-500 ring-4 ring-sky-500/20 shadow-[0_0_25px_rgba(14,165,233,0.4)]') : 'border-white/10'}`}
              >
                <img src={`/${p.toLowerCase()}-thumb.jpg`} alt={p} className="w-full h-full object-cover" />
              </button>
              <span className={`text-[10px] font-black tracking-widest uppercase ${p === 'Ruby' ? 'text-rose-500' : 'text-sky-500'}`}>
                {p}
              </span>
            </div>
          ))}
        </div>

        {/* LCD SCREEN AREA */}
        <div className="relative z-20 w-full min-h-[110px] bg-gradient-to-b from-white/5 to-transparent rounded-3xl flex flex-col items-center justify-center border border-white/10 px-6 py-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          {isLoadingSong ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/40 text-[10px] uppercase tracking-widest animate-pulse font-bold">Syncing Vibe...</p>
              {/* Disclaimer 1: Cold Start Warning */}
              <p className="text-[8px] text-white/20 italic text-center leading-tight">
                Backend warming up... <br/> (May take 30-60s on first load)
              </p>
            </div>
          ) : currentSong ? (
            <>
              <p className={`text-[9px] uppercase tracking-[0.3em] mb-2 font-black ${isRuby ? 'text-rose-400' : 'text-sky-400'}`}>
                Now Streaming
              </p>
              <h2 className="text-white text-xl font-bold text-center leading-tight truncate w-full drop-shadow-md">
                {currentSong.title}
              </h2>
            </>
          ) : (
            <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-black text-center px-4">
              Select Vibe to Begin
            </p>
          )}
        </div>

        {/* Disclaimer 2: Manual Interaction Requirement */}
        <div className="mt-6 px-8 text-center relative z-20">
          <p className="text-[9px] text-white/30 uppercase tracking-widest leading-relaxed">
            Note: Manual selection required for each vibe. <br/>
            Continuous playback is restricted by browser security.
          </p>
        </div>

        {/* FLASHY PLAY BUTTON */}
        <button 
          onClick={player.toggle}
          disabled={!currentSong}
          className={`relative z-20 group w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl
            ${player.isPlaying ? 'bg-rose-600 scale-95 shadow-rose-500/40' : 'bg-white hover:scale-105 active:scale-90 shadow-white/10'}
            ${!currentSong ? 'opacity-10 cursor-not-allowed' : 'opacity-100'}
          `}
        >
          {player.isPlaying ? (
            <div className="flex gap-2">
              <div className="w-3 h-10 bg-white rounded-full" />
              <div className="w-3 h-10 bg-white rounded-full" />
            </div>
          ) : (
            <div className="w-0 h-0 border-t-[20px] border-t-transparent border-l-[35px] border-l-black border-b-[20px] border-b-transparent ml-2 group-hover:border-l-rose-600 transition-colors" />
          )}
        </button>

        {/* PROGRESS BAR (Integrated) */}
        {currentSong && (
          <div className="relative z-20 w-full space-y-2">
            <input
              type="range"
              min={0}
              max={player.duration || 0}
              value={player.currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-white ${isRuby ? 'bg-rose-900/40' : 'bg-sky-900/40'}`}
            />
            <div className="flex justify-between text-[10px] font-bold text-white/40 tabular-nums">
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>
        )}

      </div>
      <audio ref={player.audioRef} />
    </main>
  );
}