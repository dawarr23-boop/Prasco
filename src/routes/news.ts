import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';

const router = Router();

// In-Memory Cache: 10 Minuten TTL
const newsCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 10 * 60 * 1000;

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: 'world' | 'local';
}

/**
 * Einfacher RSS/Atom XML-Parser ohne externe Abhängigkeiten.
 * Extrahiert <item> und <entry> Elemente und liest Felder per Regex.
 */
function parseRss(xml: string, source: string, category: 'world' | 'local'): NewsItem[] {
  const items: NewsItem[] = [];

  // Entferne CDATA-Wrapper für einfacheres Parsen
  const clean = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

  // Matche <item> oder <entry> Blöcke
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(clean)) !== null && items.length < 10) {
    const block = match[1];

    const title = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(block)?.[1] || '').trim();
    const description = (/<(?:description|summary|content)[^>]*>([\s\S]*?)<\/(?:description|summary|content)>/i.exec(block)?.[1] || '').trim();
    const link = (/<link[^>]*href="([^"]+)"/i.exec(block)?.[1] ||
                  /<link[^>]*>(https?:\/\/[^\s<]+)<\/link>/i.exec(block)?.[1] || '').trim();
    const pubDate = (/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i.exec(block)?.[1] || '').trim();

    // Leere oder ungültige Einträge überspringen
    if (!title || title.length < 5) continue;

    // HTML-Tags aus Description entfernen, kürzen auf 180 Zeichen
    const cleanDesc = description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .trim()
      .substring(0, 180);

    items.push({
      title: title
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim(),
      description: cleanDesc,
      link,
      pubDate,
      source,
      category,
    });
  }

  return items;
}

/**
 * Holt RSS-Feed mit Timeout und Error-Handling.
 */
async function fetchFeed(url: string, source: string, category: 'world' | 'local'): Promise<NewsItem[]> {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'PRASCO-Signage/2.0 (+https://prasco.net)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      responseType: 'text',
      maxContentLength: 1024 * 512, // 512 KB max
    });
    return parseRss(response.data, source, category);
  } catch (err: any) {
    logger.warn(`Nachrichten-Feed Fehler [${source}]: ${err.message}`);
    return [];
  }
}

/**
 * GET /api/news
 * Liefert aktuelle Nachrichten aus RSS-Feeds (National + Ahlen lokal).
 */
router.get('/', async (_req: Request, res: Response) => {
  const cacheKey = 'news_all';
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  // Feeds parallel laden
  const [tagesschau, spiegel, ahlener] = await Promise.all([
    fetchFeed(
      'https://www.tagesschau.de/xml/rss2/',
      'Tagesschau',
      'world'
    ),
    fetchFeed(
      'https://www.spiegel.de/schlagzeilen/index.rss',
      'SPIEGEL',
      'world'
    ),
    fetchFeed(
      'https://www.wa.de/lokales/ahlen/rssfeed.rdf',
      'WA Ahlen',
      'local'
    ),
  ]);

  // Weltmeldungen: Tagesschau + Spiegel zusammenführen, max 8 je Feed, abwechselnd
  const worldItems: NewsItem[] = [];
  const maxWorld = 8;
  for (let i = 0; i < maxWorld; i++) {
    if (i < tagesschau.length) worldItems.push(tagesschau[i]);
    if (i < spiegel.length) worldItems.push(spiegel[i]);
  }
  const worldDedup = worldItems.slice(0, 10);

  const result = {
    success: true,
    data: {
      world: worldDedup,
      local: ahlener.slice(0, 8),
      fetchedAt: new Date().toISOString(),
    },
  };

  newsCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return res.json(result);
});

export default router;
