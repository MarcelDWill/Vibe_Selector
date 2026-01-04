'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type UseAudioPlayer = {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  error: string | null;
  setSource: (src: string | undefined, opts?: { autoplay?: boolean }) => void;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  seek: (timeSeconds: number) => void;
  setVolume: (volume01: number) => void;
};

export function useAudioPlayer(): UseAudioPlayer {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const setSource = useCallback((src: string | undefined, opts?: { autoplay?: boolean }) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setIsLoading(Boolean(src));

    audio.pause();
    audio.removeAttribute('src');

    if (!src) {
      audio.load();
      setIsPlaying(false);
      setDuration(0);
      setCurrentTime(0);
      setIsLoading(false);
      return;
    }

    audio.src = src;
    audio.load();

    if (opts?.autoplay) {
      audio
        .play()
        .catch((e) => {
          console.error('Autoplay blocked:', e);
          setError('Autoplay blocked. Tap PLAY VIBE.');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    try {
      await audio.play();
    } catch (e) {
      console.error('Play failed:', e);
      setError('Could not play audio.');
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await play();
    else pause();
  }, [pause, play]);

  const seek = useCallback(
    (timeSeconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const clamped = Math.max(0, Math.min(timeSeconds, Number.isFinite(duration) ? duration : timeSeconds));
      audio.currentTime = clamped;
    },
    [duration],
  );

  const setVolume = useCallback((volume01: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume01));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      setIsLoading(false);
      setError('Audio failed to load.');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, []);

  return useMemo(
    () => ({
      audioRef,
      isPlaying,
      isLoading,
      duration,
      currentTime,
      error,
      setSource,
      play,
      pause,
      toggle,
      seek,
      setVolume,
    }),
    [isPlaying, isLoading, duration, currentTime, error, setSource, play, pause, toggle, seek, setVolume],
  );
}
