import React, { useState, useRef } from 'react';

const VibePlayer = ({ songs }) => {
  // 1. Manage State: Track the current song index or object
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 2. useRef: Create a direct reference to the <audio> tag
  const audioRef = useRef(null);

  // The Utility function you mentioned
  const getStreamUrl = (driveId) => `https://drive.google.com/uc?export=download&id=${driveId}`;

  const playSong = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    // We use a small timeout to ensure the src has changed before playing
    setTimeout(() => {
      audioRef.current.play();
    }, 100);
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="player-container">
      <h2>Vibe: {currentSong?.vibe || 'Select a Song'}</h2>

      {/* The Hidden or Visible Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentSong ? getStreamUrl(currentSong.drive_id) : ''} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="controls">
        <button onClick={togglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      {/* Example list of songs from your DB */}
      <ul className="playlist">
        {songs.map((song) => (
          <li key={song.id} onClick={() => playSong(song)}>
            {song.title} - {song.vibe}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VibePlayer;