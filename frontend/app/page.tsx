// =====================================
// frontend/app/page.tsx
// =====================================
'use client';

import { useMemo, useState } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://vibe-selector-api.onrender.com';

const extractDriveId = (idOrUrl: string) => {
  if (!idOrUrl) return '';
  if (idOrUrl.length > 20 && !idOrUrl.includes('/')) return idOrUrl;
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

  const [vibeColor, setVibeColor] = useState('bg-slate-900');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);

  // Scrubbing state for the progress bar
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const audioSrc = useMemo(() => {
    if (!currentSong) return undefined;
    const driveId = extractDriveId(currentSong.drive_id);
    if (!driveId) return undefined;
    return `${API_URL}/stream/${encodeURIComponent(driveId)}`;
  }, [currentSong]);

  const displayedTime = isScrubbing ? scrubValue : player.currentTime;
  const duration = player.duration || 0;

  const handleVibeClick = async (persona: string, color: string) => {
    setVibeColor(color);
    setIsLoadingSong(true);
    setFetchError(null);

    try {
      const res = await fetch(`${API_URL}/songs/${encodeURIComponent(persona)}`);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text}`);
      }

      const data = (await res.json()) as Song;
      setCurrentSong(data);

      const driveId = extractDriveId(data.drive_id);
      const src = `${API_URL}/stream/${encodeURIComponent(driveId)}`;
      player.setSource(src, { autoplay: true });
    } catch (e) {
      console.error('Could not fetch song:', e);
      setFetchError('Could not fetch song for that artist.');
      setCurrentSong(null);
      player.setSource(undefined);
    } finally {
      setIsLoadingSong(false);
    }
  };

  const onScrubStart = () => {
    setIsScrubbing(true);
    setScrubValue(player.currentTime || 0);
  };

  const onScrubChange = (value: number) => {
    setScrubValue(value);
  };

  const onScrubCommit = () => {
    player.seek(scrubValue);
    setIsScrubbing(false);
  };

  const hasSong = Boolean(currentSong && audioSrc);
  const uiError = fetchError ?? player.error;

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

      {/* Single source of truth: hook owns the audio element */}
      <audio ref={player.audioRef} src={audioSrc} preload="auto" />

      {(isLoadingSong || player.isLoading) && (
        <p className="text-white animate-pulse mt-8">Tuning into the vibe...</p>
      )}

      {uiError && (
        <p className="text-white mt-6 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
          {uiError}
        </p>
      )}

      {hasSong && !isLoadingSong && (
        <div className="mt-8 flex flex-col items-center w-full max-w-lg">
          <button
            onClick={player.toggle}
            className="mb-4 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
          >
            {player.isPlaying ? 'PAUSE VIBE' : 'PLAY VIBE'}
          </button>

          <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 text-white w-full">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">{currentSong?.title}</h2>
              <p className="text-white/80 mt-1">{currentSong?.persona}</p>
            </div>

            {/* Progress + time */}
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums text-white/80 w-12 text-right">
                {formatTime(displayedTime)}
              </span>

              <input
                type="range"
                min={0}
                max={Math.max(0, duration)}
                step={0.25}
                value={Math.min(Math.max(0, displayedTime), Math.max(0, duration))}
                disabled={!Number.isFinite(duration) || duration <= 0}
                onMouseDown={onScrubStart}
                onTouchStart={onScrubStart}
                onChange={(e) => onScrubChange(Number(e.target.value))}
                onMouseUp={onScrubCommit}
                onTouchEnd={onScrubCommit}
                className="w-full accent-white"
                aria-label="Seek"
              />

              <span className="text-sm tabular-nums text-white/80 w-12">
                {formatTime(duration)}
              </span>
            </div>

            {/* Optional: volume (simple) */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-white/80 w-12 text-right">VOL</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                defaultValue={1}
                onChange={(e) => player.setVolume(Number(e.target.value))}
                className="w-full accent-white"
                aria-label="Volume"
              />
              <span className="text-sm text-white/80 w-12"> </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
