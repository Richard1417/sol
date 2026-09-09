import { useEffect, useRef, type RefObject } from 'react';
import { VisualizerMode } from '../types';

interface AudioVisualizerProps {
  analyserRef: RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  mode?: VisualizerMode;
  className?: string;
}

export function AudioVisualizer({
  analyserRef,
  isPlaying,
  mode = 'bars',
  className = 'w-full h-28'
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      phaseRef.current += isPlaying ? 0.05 : 0.01;
      const phase = phaseRef.current;

      const analyser = analyserRef.current;
      let hasRealAudio = false;

      if (analyser && isPlaying) {
        bufferLength = analyser.frequencyBinCount;
        if (dataArray.length !== bufferLength) {
          dataArray = new Uint8Array(bufferLength);
        }
        analyser.getByteFrequencyData(dataArray);

        // Check if any frequency has noticeable energy
        let sum = 0;
        for (let i = 0; i < 30; i++) {
          sum += dataArray[i];
        }
        if (sum > 50) {
          hasRealAudio = true;
        }
      }

      // Generate synthetic energy array if real audio data isn't streaming through analyser (e.g. crossOrigin stream)
      const barCount = mode === 'minimal' ? 24 : mode === 'radial' ? 48 : 36;
      const values: number[] = [];

      for (let i = 0; i < barCount; i++) {
        if (hasRealAudio) {
          const step = Math.floor((bufferLength / barCount) * 0.8);
          const val = dataArray[i * step] || 0;
          values.push(val / 255);
        } else if (isPlaying) {
          // Beautiful fluid mathematical beat simulation
          const wave1 = Math.sin(phase * 1.8 + i * 0.25);
          const wave2 = Math.cos(phase * 0.9 + i * 0.15);
          const wave3 = Math.sin(phase * 3.1 + i * 0.4);
          const normalized = Math.max(0.12, (wave1 + wave2 + wave3 + 3) / 6);
          values.push(normalized);
        } else {
          // Idling calm resting state
          const wave = Math.sin(phase * 0.4 + i * 0.1);
          values.push(0.04 + (wave + 1) * 0.02);
        }
      }

      // Render based on selected visualizer mode
      if (mode === 'radial') {
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(width, height) * 0.26;
        const maxSpike = Math.min(width, height) * 0.2;

        // Inner glowing circle
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isPlaying ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)';
        ctx.fill();
        ctx.strokeStyle = isPlaying ? 'rgba(52, 211, 153, 0.4)' : 'rgba(113, 113, 122, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Radial spikes
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 + phase * 0.2;
          const energy = values[i];
          const spikeLen = energy * maxSpike;

          const x1 = cx + Math.cos(angle) * (baseRadius + 2);
          const y1 = cy + Math.sin(angle) * (baseRadius + 2);
          const x2 = cx + Math.cos(angle) * (baseRadius + 2 + spikeLen);
          const y2 = cy + Math.sin(angle) * (baseRadius + 2 + spikeLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);

          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(0.5, '#06b6d4');
          grad.addColorStop(1, '#8b5cf6');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      } else if (mode === 'wave') {
        // Continuous smooth waveform
        ctx.beginPath();
        const sliceWidth = width / (barCount - 1);

        for (let i = 0; i < barCount; i++) {
          const x = i * sliceWidth;
          const energy = values[i];
          const midY = height / 2;
          const offset = (energy * (height * 0.4)) * Math.sin(phase * 2 + i * 0.4);
          const y = midY + offset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = (i - 1) * sliceWidth;
            const prevEnergy = values[i - 1];
            const prevY = midY + (prevEnergy * (height * 0.4)) * Math.sin(phase * 2 + (i - 1) * 0.4);
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(cpX, prevY, x, y);
          }
        }

        const waveGrad = ctx.createLinearGradient(0, 0, width, 0);
        waveGrad.addColorStop(0, '#10b981');
        waveGrad.addColorStop(0.5, '#06b6d4');
        waveGrad.addColorStop(1, '#3b82f6');

        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Subtle glow copy
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 6;
        ctx.stroke();
      } else {
        // Standard / Minimal Bars
        const spacing = mode === 'minimal' ? 3 : 4;
        const totalSpacing = spacing * (barCount - 1);
        const barWidth = Math.max(3, (width - totalSpacing) / barCount);

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#059669');
        gradient.addColorStop(0.4, '#10b981');
        gradient.addColorStop(0.8, '#06b6d4');
        gradient.addColorStop(1, '#818cf8');

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + spacing);
          const energy = values[i];
          const barHeight = Math.max(4, energy * (height - 8));
          const y = height - barHeight;

          // Rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Top floating glow cap
          if (isPlaying && energy > 0.3) {
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, Math.max(2, y - 3), 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#a5f3fc';
            ctx.fill();
          }
        }
      }

      ctx.restore();
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyserRef, isPlaying, mode]);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
