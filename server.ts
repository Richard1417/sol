import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to extract YouTube video ID from various URL formats or raw ID
function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  // music.youtube.com or www.youtube.com / watch?v=...
  const watchMatch = trimmed.match(/(?:music\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];
  
  // youtu.be/...
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];
  
  // youtube.com/embed/...
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  return null;
}

// Convert "3:45" or "1:02:30" to seconds
function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

// Search YouTube & YouTube Music
async function searchYouTube(query: string) {
  const searchQuery = query.trim() || 'trending music';
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' music audio')}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
  });

  const html = await response.text();
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
  if (!match) {
    return [];
  }

  const data = JSON.parse(match[1]);
  const sectionList =
    data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

  const results: Array<{
    id: string;
    videoId: string;
    title: string;
    artist: string;
    duration: string;
    durationSec: number;
    thumbnail: string;
    genre: string;
    isLive: boolean;
  }> = [];

  for (const section of sectionList) {
    const itemSection = section.itemSectionRenderer?.contents || [];
    for (const item of itemSection) {
      const v = item.videoRenderer;
      if (v && v.videoId && v.title) {
        const title = v.title?.runs?.[0]?.text || 'Sin título';
        const artist = v.ownerText?.runs?.[0]?.text || 'Artista en YouTube Music';
        const isLive = Boolean(v.badges?.some((b: any) => b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW'));
        const durationStr = v.lengthText?.simpleText || (isLive ? 'En vivo' : '3:30');
        const durationSec = isLive ? 0 : parseDurationToSeconds(durationStr);

        // Get highest resolution thumbnail
        const thumbs = v.thumbnail?.thumbnails || [];
        const thumbnail =
          thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

        results.push({
          id: `yt-${v.videoId}`,
          videoId: v.videoId,
          title,
          artist,
          duration: durationStr,
          durationSec,
          thumbnail,
          genre: 'YouTube Music',
          isLive,
        });

        if (results.length >= 24) break;
      }
    }
    if (results.length >= 24) break;
  }

  return results;
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'SOLARE MUSIC',
    server: 'Online',
    youtubeConnected: true,
    timestamp: Date.now(),
  });
});

// Search YouTube Music online
app.get('/api/yt/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      return res.json({ results: [], query: q });
    }
    const results = await searchYouTube(q);
    res.json({ results, query: q, total: results.length });
  } catch (err: any) {
    console.error('Error en búsqueda de YouTube Music:', err);
    res.status(500).json({ error: 'Error conectando a los servidores de YouTube Music', details: err.message });
  }
});

// Resolve video info by URL or video ID (using YouTube oEmbed)
app.get('/api/yt/info', async (req: Request, res: Response) => {
  try {
    const input = (req.query.v as string) || (req.query.url as string) || '';
    const videoId = extractYouTubeVideoId(input);

    if (!videoId) {
      return res.status(400).json({ error: 'No se pudo identificar el ID del video de YouTube Music.' });
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      // Fallback metadata if oEmbed returns 404 or restricted
      return res.json({
        id: `yt-${videoId}`,
        videoId,
        title: `Pista de YouTube Music (${videoId})`,
        artist: 'YouTube Music Audio',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 'En vivo / Streaming',
        durationSec: 210,
        isLive: false,
      });
    }

    const data = await response.json();
    res.json({
      id: `yt-${videoId}`,
      videoId,
      title: data.title || 'Canción en YouTube Music',
      artist: data.author_name || 'YouTube Music',
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: 'Online',
      durationSec: 200,
      isLive: false,
    });
  } catch (err: any) {
    console.error('Error obteniendo info de YouTube:', err);
    res.status(500).json({ error: 'Error al consultar servidor de YouTube', details: err.message });
  }
});

// Trending YouTube Music Hits
app.get('/api/yt/trending', async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'global';
    let query = 'top hits 2025';
    if (category === 'latin') query = 'latin hits exitos';
    else if (category === 'chill') query = 'lofi hip hop chill beats';
    else if (category === 'rock') query = 'rock classics';
    else if (category === 'electronic') query = 'edm electronic music';

    const results = await searchYouTube(query);
    res.json({ results, category });
  } catch (err: any) {
    console.error('Error al obtener tendencias:', err);
    res.status(500).json({ error: 'Error cargando tendencias de YouTube Music' });
  }
});

// Start Express Server with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SOLARE MUSIC] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
