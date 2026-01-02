import React, { useState, useRef, useEffect } from 'react';

const VibePlayer = ({ songs }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Improved utility for reliable streaming
  const getStreamUrl = (driveId) => 
    driveId ? `https://docs.google.com/uc?export=download&id=${driveId}` : '';

  // 1. Monitor song changes and handle playback safely
  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current;
      
      audio.pause(); 
      audio.load(); // Prepare the new source

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error("Autoplay prevented:", error);
            setIsPlaying(false);
          });
      }
    }
  }, [currentSong]);

  const playSong = (song) => {
    setCurrentSong(song); // useEffect takes it from here!
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error(e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="player-container text-white p-6 bg-white/10 rounded-xl">
      <h2 className="text-xl font-bold mb-4">
        Vibe: {currentSong?.persona || 'Select a Song'}
      </h2>

      <audio 
        ref={audioRef} 
        src={getStreamUrl(currentSong?.drive_id)} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="controls mb-6">
        <button 
          onClick={togglePlay}
          className="px-6 py-2 bg-white text-black rounded-full font-bold"
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
      </div>

      <ul className="playlist space-y-2">
        {songs.map((song) => (
          <li 
            key={song.id} 
            onClick={() => playSong(song)}
            className="cursor-pointer hover:text-rose-400 transition-colors p-2 border-b border-white/10"
          >
            {song.title} — <span className="italic opacity-70">{song.persona}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VibePlayer;