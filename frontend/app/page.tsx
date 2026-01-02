'use client'; 

import { useState, useRef, useEffect } from 'react';

// 1. Helper Function (defined outside component for clean code)
const extractDriveId = (idOrUrl: string) => {
  if (!idOrUrl) return '';
  if (idOrUrl.length > 20 && !idOrUrl.includes('/')) return idOrUrl;
  const match = idOrUrl.match(/\/d\/(.+?)\//) || idOrUrl.match(/id=([^&]+)/);
  return match ? match[1] : idOrUrl;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibe-selector-api.onrender.com';

interface Song {
  title: string;
  drive_id: string;
  persona: string;
}

export default function VibeSelector() {
  // 2. State & Refs (Must be at the top level)
  const [vibeColor, setVibeColor] = useState('bg-slate-900');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  // Add a piece of state to track if music is playing
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 3. Side Effect: Watch for song changes and play audio
  // 3. Side Effect: Watch for song changes and play audio
  useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  // Sync state if audio is paused/played via other means
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  audio.addEventListener('play', handlePlay);
  audio.addEventListener('pause', handlePause);

  if (currentSong) {
    audio.pause(); 
    audio.load();
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => console.error("Playback failed:", error));
    }
  }

  // Cleanup listeners when component unmounts
  return () => {
    audio.removeEventListener('play', handlePlay);
    audio.removeEventListener('pause', handlePause);
  };
}, [currentSong]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback error:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 4. Click Handler
  const handleVibeClick = async (persona: string, color: string) => {
    setVibeColor(color);
    setIsLoading(true); // Start loading
    try {
      const res = await fetch(`${API_URL}/songs/${persona}`);
      const data = await res.json();
      if (data) {
        setCurrentSong(data);
      }
    } catch (err) {
      console.error("Could not fetch song:", err);
    } finally {
      setIsLoading(false); // End loading once data is set (or error)
    }
  };

  return (
    <main className={`${vibeColor} min-h-screen transition-colors duration-1000 flex flex-col items-center justify-center p-10`}>
      
      <h1 className="text-white text-6xl font-black mb-16 tracking-tighter italic">
        VIBE SELECTOR
      </h1>

      {/* THE ORBS */}
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

      {/* HIDDEN AUDIO ELEMENT */}
      <audio 
        ref={audioRef} 
        src={currentSong ? `https://docs.google.com/uc?export=download&id=${extractDriveId(currentSong.drive_id)}` : undefined} 
      />

      {/* LOADING INDICATOR */}
      {isLoading && <p className="text-white animate-pulse mt-8">Tuning into the vibe...</p>}

      {/* NOW PLAYING CARD */}
      {currentSong && !isLoading && (
        <div className="mt-8 flex flex-col items-center">
          <button 
            onClick={togglePlay}
            className="mb-4 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
          >
            {isPlaying ? "PAUSE VIBE" : "PLAY VIBE"}
          </button>
          <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 text-white text-center">
             <h2 className="text-2xl font-bold">{currentSong.title}</h2>
          </div>
        </div>
      )}
    </main>
  );
}