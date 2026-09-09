import { useState, useEffect, useRef, useCallback } from 'react';
import { Track, PlaybackState, RepeatMode, EqualizerPreset, ServerConnectionStatus } from '../types';
import { INITIAL_TRACKS, EQUALIZER_PRESETS } from '../data/curatedTracks';

const LOCAL_STORAGE_FAVORITES_KEY = 'solare_music_favorites_v2';
const LOCAL_STORAGE_CUSTOM_TRACKS_KEY = 'solare_music_custom_tracks_v2';
const OLD_STORAGE_FAVORITES_KEY = 'onda_music_favorites_v1';
const OLD_STORAGE_CUSTOM_TRACKS_KEY = 'onda_music_custom_tracks_v1';

export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // YouTube IFrame Player refs
  const ytPlayerRef = useRef<any>(null);
  const isYtApiReadyRef = useRef<boolean>(false);
  const currentYtVideoIdRef = useRef<string | null>(null);

  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTrack: INITIAL_TRACKS[0],
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: INITIAL_TRACKS[0].duration || 0,
    volume: 0.85,
    isMuted: false,
    playbackRate: 1.0,
    repeatMode: 'all',
    isShuffle: false,
    error: null,
  });

  // Toggle video display mode for YouTube Music tracks
  const [isVideoMode, setIsVideoMode] = useState<boolean>(false);

  // Track queue
  const [queue, setQueue] = useState<Track[]>(() => INITIAL_TRACKS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // EQ Gains (5 bands: 60Hz, 250Hz, 1kHz, 4kHz, 16kHz)
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0]);
  const [currentPresetName, setCurrentPresetName] = useState<string>('Plano (Default)');

  // Sleep Timer
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  const [sleepTimerFadeOut, setSleepTimerFadeOut] = useState<boolean>(true);
  const sleepTimerIntervalRef = useRef<number | null>(null);

  // Server & YouTube connection status
  const [serverStatus, setServerStatus] = useState<ServerConnectionStatus>({
    online: true,
    youtubeConnected: true,
    latencyMs: 35,
    lastChecked: Date.now(),
  });

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved =
        localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY) ||
        localStorage.getItem(OLD_STORAGE_FAVORITES_KEY);
      return saved ? JSON.parse(saved) : ['yt-yKNxeF4KMsY', 'yt-TmKh7lAwnBI', 'radio-1'];
    } catch {
      return ['yt-yKNxeF4KMsY', 'yt-TmKh7lAwnBI', 'radio-1'];
    }
  });

  // Custom Tracks (user added streams or YouTube Music URLs)
  const [customTracks, setCustomTracks] = useState<Track[]>(() => {
    try {
      const saved =
        localStorage.getItem(LOCAL_STORAGE_CUSTOM_TRACKS_KEY) ||
        localStorage.getItem(OLD_STORAGE_CUSTOM_TRACKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  // Save custom tracks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TRACKS_KEY, JSON.stringify(customTracks));
    } catch {
      // ignore
    }
  }, [customTracks]);

  // Health check & ping to YouTube Music server
  useEffect(() => {
    const checkServer = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const latency = Math.round(performance.now() - t0);
          setServerStatus({
            online: true,
            youtubeConnected: true,
            latencyMs: latency,
            lastChecked: Date.now(),
          });
        }
      } catch {
        setServerStatus((s) => ({ ...s, online: false, youtubeConnected: false }));
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize HTML5 Audio Element for Radio & standard streams
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audio.volume = playbackState.volume;
    audioRef.current = audio;

    const onPlay = () => setPlaybackState((s) => ({ ...s, isPlaying: true, isLoading: false, error: null }));
    const onPause = () => setPlaybackState((s) => ({ ...s, isPlaying: false }));
    const onWaiting = () => setPlaybackState((s) => ({ ...s, isLoading: true }));
    const onPlaying = () => setPlaybackState((s) => ({ ...s, isPlaying: true, isLoading: false, error: null }));

    const onTimeUpdate = () => {
      // Only update time if current track is standard audio (not YouTube)
      if (playbackState.currentTrack?.sourceType !== 'youtube') {
        setPlaybackState((s) => ({
          ...s,
          currentTime: audio.currentTime || 0,
          duration: audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) ? audio.duration : s.duration,
        }));
      }
    };

    const onDurationChange = () => {
      if (playbackState.currentTrack?.sourceType !== 'youtube' && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setPlaybackState((s) => ({ ...s, duration: audio.duration }));
      }
    };

    const onError = () => {
      if (playbackState.currentTrack?.sourceType === 'youtube') return;
      const err = audio.error;
      let msg = 'Error al reproducir el flujo de audio.';
      if (err) {
        if (err.code === 1) msg = 'Reproducción cancelada por el usuario.';
        else if (err.code === 2) msg = 'Error de red al conectar al servidor.';
        else if (err.code === 3) msg = 'Error en el decodificador de audio.';
        else if (err.code === 4) msg = 'El stream de audio no se encuentra disponible.';
      }
      setPlaybackState((s) => ({ ...s, isPlaying: false, isLoading: false, error: msg }));
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('error', onError);
    };
  }, [playbackState.currentTrack?.sourceType]);

  // Web Audio Context & Equalizer setup
  const initWebAudio = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;

      // 5-band EQ filters
      const freqConfig = [
        { type: 'lowshelf' as BiquadFilterType, freq: 60 },
        { type: 'peaking' as BiquadFilterType, freq: 250 },
        { type: 'peaking' as BiquadFilterType, freq: 1000 },
        { type: 'peaking' as BiquadFilterType, freq: 4000 },
        { type: 'highshelf' as BiquadFilterType, freq: 16000 },
      ];

      const filters = freqConfig.map((cfg) => {
        const filter = ctx.createBiquadFilter();
        filter.type = cfg.type;
        filter.frequency.value = cfg.freq;
        filter.gain.value = 0;
        return filter;
      });
      filtersRef.current = filters;

      try {
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;

        let prevNode: AudioNode = source;
        filters.forEach((f) => {
          prevNode.connect(f);
          prevNode = f;
        });
        prevNode.connect(analyser);
        analyser.connect(ctx.destination);
      } catch (corsErr) {
        console.warn('Web Audio direct stream notice:', corsErr);
      }
    } catch (e) {
      console.warn('Web Audio API initialized with limited context:', e);
    }
  }, []);

  // Sync EQ gains to filters
  useEffect(() => {
    if (filtersRef.current.length === 5) {
      eqGains.forEach((gain, i) => {
        if (filtersRef.current[i]) {
          filtersRef.current[i].gain.value = gain;
        }
      });
    }
  }, [eqGains]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    // If YouTube script already exists, check if ready
    if ((window as any).YT && (window as any).YT.Player) {
      isYtApiReadyRef.current = true;
      initYtPlayer();
      return;
    }

    // Set callback for YouTube API ready
    (window as any).onYouTubeIframeAPIReady = () => {
      isYtApiReadyRef.current = true;
      initYtPlayer();
    };

    // Append script if not present
    if (!document.getElementById('solare-yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'solare-yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  // Instantiate or attach YouTube Player to container
  const initYtPlayer = useCallback(() => {
    if (!isYtApiReadyRef.current || ytPlayerRef.current) return;
    const container = document.getElementById('solare-yt-player-slot');
    if (!container) return;

    try {
      ytPlayerRef.current = new (window as any).YT.Player('solare-yt-player-slot', {
        height: '100%',
        width: '100%',
        videoId: currentYtVideoIdRef.current || 'yKNxeF4KMsY',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(playbackState.volume * 100);
            if (playbackState.isMuted) {
              event.target.mute();
            }
          },
          onStateChange: (event: any) => {
            const stateCode = event.data;
            // 1: PLAYING, 2: PAUSED, 3: BUFFERING, 0: ENDED
            if (stateCode === 1) {
              setPlaybackState((s) => ({
                ...s,
                isPlaying: true,
                isLoading: false,
                error: null,
              }));
            } else if (stateCode === 2) {
              setPlaybackState((s) => ({
                ...s,
                isPlaying: false,
              }));
            } else if (stateCode === 3) {
              setPlaybackState((s) => ({
                ...s,
                isLoading: true,
              }));
            } else if (stateCode === 0) {
              // Track ended
              handleTrackEnded();
            }
          },
          onError: (event: any) => {
            console.warn('YouTube Player error code:', event.data);
            setPlaybackState((s) => ({
              ...s,
              isPlaying: false,
              isLoading: false,
              error: 'El video no está disponible en tu región o tiene restricciones de reproducción.',
            }));
          },
        },
      });
    } catch (err) {
      console.warn('Error inicializando YouTube Player:', err);
    }
  }, [playbackState.volume, playbackState.isMuted]);

  // Periodic polling for YouTube playback time and duration
  useEffect(() => {
    if (playbackState.currentTrack?.sourceType !== 'youtube' || !playbackState.isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && typeof player.getCurrentTime === 'function') {
        try {
          const cur = player.getCurrentTime() || 0;
          const dur = player.getDuration() || 0;
          setPlaybackState((s) => ({
            ...s,
            currentTime: cur,
            duration: dur > 0 ? dur : s.duration,
          }));
        } catch {
          // ignore
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [playbackState.currentTrack, playbackState.isPlaying]);

  // Update MediaSession API for lockscreen / keyboard media keys
  useEffect(() => {
    if ('mediaSession' in navigator && playbackState.currentTrack) {
      const track = playbackState.currentTrack;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || (track.sourceType === 'youtube' ? 'YouTube Music' : 'Radio en Directo'),
        artwork: [{ src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' }],
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    }
  }, [playbackState.currentTrack]);

  // Play a specific track
  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      initWebAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      if (newQueue) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setCurrentIndex(idx >= 0 ? idx : 0);
      } else {
        const idx = queue.findIndex((t) => t.id === track.id);
        if (idx !== -1) {
          setCurrentIndex(idx);
        } else {
          setQueue((prev) => [track, ...prev]);
          setCurrentIndex(0);
        }
      }

      setPlaybackState((s) => ({
        ...s,
        currentTrack: track,
        isLoading: true,
        currentTime: 0,
        duration: track.duration || 0,
        error: null,
      }));

      // Check if track is from YouTube Music
      const isYoutube = track.sourceType === 'youtube' || Boolean(track.youtubeVideoId);

      if (isYoutube) {
        // Pause HTML5 audio
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const videoId =
          track.youtubeVideoId ||
          track.id.replace('yt-', '') ||
          'yKNxeF4KMsY';
        currentYtVideoIdRef.current = videoId;

        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(videoId, 0);
          ytPlayerRef.current.playVideo();
          ytPlayerRef.current.setVolume(playbackState.volume * 100);
          if (playbackState.isMuted) {
            ytPlayerRef.current.mute();
          } else {
            ytPlayerRef.current.unMute();
          }
        } else {
          // If not initialized yet, try to init and play
          initYtPlayer();
          setTimeout(() => {
            if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
              ytPlayerRef.current.loadVideoById(videoId, 0);
              ytPlayerRef.current.playVideo();
            }
          }, 600);
        }
      } else {
        // Pause YouTube player
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }

        // Play via HTML5 Audio
        const audio = audioRef.current;
        if (audio) {
          audio.src = track.url;
          audio.playbackRate = playbackState.playbackRate;
          audio.volume = playbackState.volume;
          audio.muted = playbackState.isMuted;
          audio.play().catch((err) => {
            console.warn('Playback error:', err);
            setPlaybackState((s) => ({
              ...s,
              isPlaying: false,
              isLoading: false,
              error: 'Haz clic en reproducir para conectar al servidor de audio.',
            }));
          });
        }
      }
    },
    [queue, playbackState.volume, playbackState.isMuted, playbackState.playbackRate, initWebAudio, initYtPlayer]
  );

  // Next track
  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    let nextIdx = 0;
    if (playbackState.isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = (currentIndex + 1) % queue.length;
    }

    setCurrentIndex(nextIdx);
    playTrack(queue[nextIdx]);
  }, [queue, currentIndex, playbackState.isShuffle, playTrack]);

  // Prev track
  const prevTrack = useCallback(() => {
    const isYt = playbackState.currentTrack?.sourceType === 'youtube';
    const curTime = playbackState.currentTime;

    if (curTime > 3) {
      seek(0);
      return;
    }

    if (queue.length === 0) return;
    const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIdx);
    playTrack(queue[prevIdx]);
  }, [queue, currentIndex, playbackState.currentTime, playbackState.currentTrack, playTrack]);

  // Track ended handler (used for both HTML5 and YouTube)
  const handleTrackEnded = useCallback(() => {
    if (playbackState.repeatMode === 'one') {
      seek(0);
      togglePlayPause();
    } else if (playbackState.repeatMode === 'all' || currentIndex < queue.length - 1) {
      nextTrack();
    } else {
      setPlaybackState((s) => ({ ...s, isPlaying: false }));
    }
  }, [playbackState.repeatMode, currentIndex, queue.length, nextTrack]);

  // HTML5 audio ended event listener
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (playbackState.currentTrack?.sourceType !== 'youtube') {
        handleTrackEnded();
      }
    };

    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, [handleTrackEnded, playbackState.currentTrack]);

  // Toggle Play / Pause
  const togglePlayPause = useCallback(() => {
    initWebAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const track = playbackState.currentTrack;
    if (!track) return;

    const isYoutube = track.sourceType === 'youtube' || Boolean(track.youtubeVideoId);

    if (isYoutube) {
      const player = ytPlayerRef.current;
      if (player && typeof player.getPlayerState === 'function') {
        if (playbackState.isPlaying) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      } else {
        // Try playTrack again if player wasn't initialized
        playTrack(track);
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (playbackState.isPlaying) {
        audio.pause();
      } else {
        if (!audio.src) {
          audio.src = track.url;
        }
        audio.play().catch((e) => {
          console.warn('Play error:', e);
          setPlaybackState((s) => ({ ...s, error: 'Error al iniciar reproducción.' }));
        });
      }
    }
  }, [playbackState.isPlaying, playbackState.currentTrack, initWebAudio, playTrack]);

  // Seek
  const seek = useCallback(
    (seconds: number) => {
      if (!isFinite(seconds)) return;
      const targetSec = Math.max(0, seconds);

      const isYoutube = playbackState.currentTrack?.sourceType === 'youtube';
      if (isYoutube) {
        const player = ytPlayerRef.current;
        if (player && typeof player.seekTo === 'function') {
          player.seekTo(targetSec, true);
        }
      } else {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = Math.min(targetSec, audio.duration || targetSec);
        }
      }

      setPlaybackState((s) => ({ ...s, currentTime: targetSec }));
    },
    [playbackState.currentTrack]
  );

  // Set Volume
  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    const isMuted = clamped === 0;

    // YouTube Player Volume
    const player = ytPlayerRef.current;
    if (player && typeof player.setVolume === 'function') {
      player.setVolume(clamped * 100);
      if (isMuted) player.mute();
      else player.unMute();
    }

    // HTML5 Audio Volume
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clamped;
      audio.muted = isMuted;
    }

    setPlaybackState((s) => ({
      ...s,
      volume: clamped,
      isMuted,
    }));
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    const nextMuted = !playbackState.isMuted;

    // YouTube Player Mute
    const player = ytPlayerRef.current;
    if (player && typeof player.mute === 'function') {
      if (nextMuted) player.mute();
      else player.unMute();
    }

    // HTML5 Audio Mute
    const audio = audioRef.current;
    if (audio) {
      audio.muted = nextMuted;
    }

    setPlaybackState((s) => ({
      ...s,
      isMuted: nextMuted,
    }));
  }, [playbackState.isMuted]);

  // Set Playback Rate
  const setPlaybackRate = useCallback((rate: number) => {
    const player = ytPlayerRef.current;
    if (player && typeof player.setPlaybackRate === 'function') {
      player.setPlaybackRate(rate);
    }
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = rate;
    }
    setPlaybackState((s) => ({ ...s, playbackRate: rate }));
  }, []);

  // Toggle Repeat Mode (off -> all -> one)
  const toggleRepeat = useCallback(() => {
    setPlaybackState((s) => {
      let next: RepeatMode = 'off';
      if (s.repeatMode === 'off') next = 'all';
      else if (s.repeatMode === 'all') next = 'one';
      else next = 'off';
      return { ...s, repeatMode: next };
    });
  }, []);

  // Toggle Shuffle
  const toggleShuffle = useCallback(() => {
    setPlaybackState((s) => ({ ...s, isShuffle: !s.isShuffle }));
  }, []);

  // Toggle Video Mode (Audio / Video view)
  const toggleVideoMode = useCallback(() => {
    setIsVideoMode((prev) => !prev);
  }, []);

  // Set individual EQ band gain
  const setEqGain = useCallback((bandIndex: number, gainDb: number) => {
    setEqGains((prev) => {
      const next = [...prev];
      next[bandIndex] = gainDb;
      return next;
    });
    setCurrentPresetName('Personalizado');
  }, []);

  // Apply EQ Preset
  const applyEqPreset = useCallback((preset: EqualizerPreset) => {
    setEqGains([...preset.values]);
    setCurrentPresetName(preset.name);
  }, []);

  // Reset EQ
  const resetEq = useCallback(() => {
    setEqGains([0, 0, 0, 0, 0]);
    setCurrentPresetName('Plano (Default)');
  }, []);

  // Sleep Timer countdown logic
  useEffect(() => {
    if (sleepTimerSeconds === null) {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
        sleepTimerIntervalRef.current = null;
      }
      return;
    }

    sleepTimerIntervalRef.current = window.setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          // Pause all playback
          if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
            ytPlayerRef.current.pauseVideo();
          }
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setPlaybackState((s) => ({ ...s, isPlaying: false }));
          return null;
        }

        // Fade out in the last 30 seconds if enabled
        if (sleepTimerFadeOut && prev <= 30) {
          const ratio = prev / 30;
          if (audioRef.current) {
            audioRef.current.volume = Math.max(0, playbackState.volume * ratio);
          }
          if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
            ytPlayerRef.current.setVolume(playbackState.volume * ratio * 100);
          }
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    };
  }, [sleepTimerSeconds, sleepTimerFadeOut, playbackState.volume]);

  const startSleepTimer = useCallback((minutes: number, fadeOut: boolean = true) => {
    setSleepTimerSeconds(minutes * 60);
    setSleepTimerFadeOut(fadeOut);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setSleepTimerSeconds(null);
    if (audioRef.current) {
      audioRef.current.volume = playbackState.volume;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(playbackState.volume * 100);
    }
  }, [playbackState.volume]);

  // Favorites
  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  }, []);

  // Queue manipulation
  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => {
        const next = prev.filter((_, i) => i !== index);
        return next;
      });
      if (index < currentIndex) {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    },
    [currentIndex]
  );

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (playbackState.currentTrack) {
      setQueue([playbackState.currentTrack]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(0);
    }
  }, [playbackState.currentTrack]);

  // Add custom track/stream or YouTube Music track
  const addCustomTrack = useCallback(
    (track: Track, playImmediately: boolean = true) => {
      setCustomTracks((prev) => [track, ...prev]);
      setQueue((prev) => [track, ...prev]);
      if (playImmediately) {
        playTrack(track);
      }
    },
    [playTrack]
  );

  return {
    state: playbackState,
    queue,
    currentIndex,
    analyserRef,
    audioRef,
    ytPlayerRef,
    eqGains,
    currentPresetName,
    presets: EQUALIZER_PRESETS,
    sleepTimerSeconds,
    sleepTimerFadeOut,
    serverStatus,
    favorites,
    customTracks,
    isVideoMode,
    toggleVideoMode,
    playTrack,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleRepeat,
    toggleShuffle,
    nextTrack,
    prevTrack,
    setEqGain,
    applyEqPreset,
    resetEq,
    startSleepTimer,
    cancelSleepTimer,
    toggleFavorite,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    addCustomTrack,
  };
}
