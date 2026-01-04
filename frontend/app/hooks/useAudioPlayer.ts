// frontend/app/hooks/useAudioPlayer.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type UseAudioPlayer = {
  // We use a callback ref to ensure we capture the element when it mounts
  audioRef: (node: HTMLAudioElement | null) => void;
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
  // State to hold the actual DOM element
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // The ref callback passed to the <audio> tag
  const audioRef = useCallback((node: HTMLAudioElement | null) => {
    setAudioEl(node);
  }, []);

  const setSource = useCallback(
    (src: string | undefined, opts?: { autoplay?: boolean }) => {
      if (!audioEl) return;

      setError(null);
      setIsLoading(Boolean(src));

      audioEl.pause();
      audioEl.removeAttribute('src');

      if (!src) {
        audioEl.load();
        setIsPlaying(false);
        setDuration(0);
        setCurrentTime(0);
        setIsLoading(false);
        return;
      }

      audioEl.src = src;
      audioEl.load();

      if (opts?.autoplay) {
        audioEl
          .play()
          .catch((e) => {
            console.error('Autoplay blocked:', e);
            setError('Autoplay blocked. Tap PLAY VIBE.');
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    },
    [audioEl],
  );

  const play = useCallback(async () => {
    if (!audioEl) return;
    setError(null);
    try {
      await audioEl.play();
    } catch (e) {
      console.error('Play failed:', e);
      setError('Could not play audio.');
    }
  }, [audioEl]);

  const pause = useCallback(() => {
    if (!audioEl) return;
    audioEl.pause();
  }, [audioEl]);

  const toggle = useCallback(async () => {
    if (!audioEl) return;
    if (audioEl.paused) await play();
    else pause();
  }, [audioEl, play, pause]);

  const seek = useCallback(
    (timeSeconds: number) => {
      if (!audioEl) return;
      const clamped = Math.max(
        0,
        Math.min(timeSeconds, Number.isFinite(duration) ? duration : timeSeconds),
      );
      audioEl.currentTime = clamped;
    },
    [audioEl, duration],
  );

  const setVolume = useCallback(
    (volume01: number) => {
      if (!audioEl) return;
      audioEl.volume = Math.max(0, Math.min(1, volume01));
    },
    [audioEl],
  );

  // Effect: Attach listeners whenever audioEl changes (mounts)
  useEffect(() => {
    if (!audioEl) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audioEl.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audioEl.duration || 0);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      setIsLoading(false);
      setError('Audio failed to load.');
    };

    audioEl.addEventListener('play', onPlay);
    audioEl.addEventListener('pause', onPause);
    audioEl.addEventListener('timeupdate', onTimeUpdate);
    audioEl.addEventListener('loadedmetadata', onLoadedMetadata);
    audioEl.addEventListener('waiting', onWaiting);
    audioEl.addEventListener('canplay', onCanPlay);
    audioEl.addEventListener('error', onError);

    return () => {
      audioEl.removeEventListener('play', onPlay);
      audioEl.removeEventListener('pause', onPause);
      audioEl.removeEventListener('timeupdate', onTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      audioEl.removeEventListener('waiting', onWaiting);
      audioEl.removeEventListener('canplay', onCanPlay);
      audioEl.removeEventListener('error', onError);
    };
  }, [audioEl]);

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
    [
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
    ],
  );
}
