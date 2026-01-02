'use client'; 

import { useState, useRef, useEffect } from 'react';

// 1. Helper Function (defined outside component for clean code)
const extractDriveId = (idOrUrl: string) => {
  if (!idOrUrl) return '';
  if (idOrUrl.length > 20 && !idOrUrl.includes('/')) return idOrUrl;
  const match = idOrUrl.match(/\/d\/(.+?)\//) || idOrUrl.match(/id=([^&]+)/);
  return match ? match[1] : idOrUrl;
};

interface Song {
  title: string;
  drive_id: string;
  persona: string;
}

export default function VibeSelector() {
  // 2. State & Refs (Must be at the top level)
  const [vibeColor, setVibeColor] = useState('bg-slate-900');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 3. Side Effect: Watch for song changes and play audio
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.pause(); // Stop current track
      audioRef.current.load();  // Force browser to fetch new src
      audioRef.current.play().catch(err => console.log("Playback blocked:", err));
    }
  }, [currentSong]);

  // 4. Click Handler
  const handleVibeClick = async (persona: string, color: string) => {
    setVibeColor(color);
    try {
      const res = await fetch(`https://vibe-selector-api.onrender.com/songs/${persona}`);
      const data = await res.json();
      if (data) {
        setCurrentSong(data);
      }
    } catch (err) {
      console.error("Could not fetch song:", err);
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

      {/* NOW PLAYING CARD */}
      {currentSong && (
        <div className="mt-16 p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 text-white text-center animate-in fade-in zoom-in duration-500">
          <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Now streaming</p>
          <h2 className="text-2xl font-bold">{currentSong.title}</h2>
        </div>
      )}
    </main>
  );
}