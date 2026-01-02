'use client'; // This must be at the very top for React hooks to work

import { useState, useRef } from 'react';

// Define the structure of our Song data
interface Song {
  title: string;
  drive_id: string;
  persona: string;
}

export default function VibeSelector() {
  // 1. STATE: Track the current theme color and the song data
  const [vibeColor, setVibeColor] = useState('bg-slate-900');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // 2. REF: Create a reference to the audio element to control play/pause
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleVibeClick = async (persona: string, color: string) => {
    // Change the background color immediately
    setVibeColor(color);

    try {
      // Fetch a random song for this persona from your backend
      // Note: Use 3000 or 3001 depending on where your backend is running!
      const response = await fetch(`http://localhost:3000/songs/${persona}`);
      const data = await response.json();

      if (data) {
        setCurrentSong(data);
        // We wait a tiny bit for the <audio> src to update before playing
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play();
          }
        }, 100);
      }
    } catch (err) {
      console.error("Could not fetch song:", err);
    }
  };

  return (
    // The "transition-colors duration-1000" makes the background shift smooth
    <main className={`${vibeColor} min-h-screen transition-colors duration-1000 flex flex-col items-center justify-center p-10`}>
      
      <h1 className="text-white text-6xl font-black mb-16 tracking-tighter italic">
        VIBE SELECTOR
      </h1>

      {/* THE ORBS */}
      <div className="flex gap-12">
  {/* Ruby Orb */}
  <button 
    onClick={() => handleVibeClick('Ruby', 'bg-rose-600')}
    className="w-44 h-44 rounded-full bg-white/10 border-2 border-white/30 text-white font-bold hover:scale-110 hover:bg-white/20 transition-all shadow-2xl"
  >
    Ruby
  </button>

  {/* Marshall Orb */}
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
        src={currentSong ? `https://drive.google.com/uc?export=download&id=${currentSong.drive_id}` : ''} 
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