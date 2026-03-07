import { Router, Response } from 'express';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import Setting from '../models/Setting';
import Media from '../models/Media';
import Post from '../models/Post';
import logger from '../utils/logger';

const router = Router();

// ──────────────────────────────────────────────
// Hilfsfunktion: OpenAI API-Key aus Settings laden
// ──────────────────────────────────────────────
async function getOpenAIKey(): Promise<string | null> {
  try {
    const setting = await Setting.findOne({ where: { key: 'ai_openai_api_key' } });
    return setting ? setting.value : null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// System-Prompts je Aktion
// ──────────────────────────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  generate: `Du bist ein professioneller Texter für digitale Anzeigetafeln (Digital Signage).
Erstelle ansprechenden, prägnanten Text basierend auf dem Prompt des Benutzers.
Der Text soll gut lesbar auf einem Bildschirm dargestellt werden können.
Verwende kein Markdown. Nutze Zeilenumbrüche für Absätze.
Antworte nur mit dem generierten Text, ohne Erklärungen oder Einleitungen.`,

  improve: `Du bist ein professioneller Lektor für digitale Anzeigetafeln.
Verbessere den folgenden Text: bessere Formulierungen, korrigiere Fehler, optimiere die Lesbarkeit.
Behalte die Kernaussage bei. Verwende kein Markdown. Nutze Zeilenumbrüche für Absätze.
Antworte nur mit dem verbesserten Text, ohne Erklärungen.`,

  shorten: `Du bist ein Spezialist für kompakte Texte auf digitalen Anzeigetafeln.
Kürze den folgenden Text auf das Wesentliche. Maximal 2-3 Sätze.
Behalte die wichtigsten Informationen bei. Verwende kein Markdown.
Antworte nur mit dem gekürzten Text, ohne Erklärungen.`,

  translate: `Du bist ein professioneller Übersetzer.
Übersetze den folgenden Text in die gewünschte Zielsprache.
Behalte den Ton und Stil bei. Verwende kein Markdown. Nutze Zeilenumbrüche für Absätze.
Antworte nur mit der Übersetzung, ohne Erklärungen.`,

  generate_title: `Du bist Texter für digitale Anzeigetafeln (Digital Signage).
Erstelle einen prägnanten, aussagekräftigen Titel (max. 60 Zeichen) für den folgenden Inhalt.
Der Titel soll klar und direkt sein, gut lesbar auf einem großen Bildschirm.
Antworte NUR mit dem Titel, ohne Anführungszeichen, Erklärungen oder zusätzlichen Text.`,

  generate_html: `Du bist HTML/CSS-Experte für Digital Signage (Vollbild 1920×1080px).
Erstelle ein vollständiges, eigenständiges HTML-Dokument mit Inline-CSS basierend auf der Beschreibung.
Anforderungen:
- Kein <script>, keine externen Ressourcen, keine Fonts via @import oder <link>
- Schriftgröße mindestens 2rem (gut lesbar aus 3 Metern Entfernung)
- Farben: #58585a (PRASCO Grau), #ffffff (Weiß), Akzentfarben nach Kontext
- body: margin:0; padding:2rem; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:100vh; font-family:Arial,sans-serif; box-sizing:border-box;
- Antworte NUR mit dem HTML-Code beginnend mit <!DOCTYPE html>, ohne Erklärungen oder Markdown.`,
};

// ──────────────────────────────────────────────
// POST /api/ai/generate
// Body: { action, text, targetLanguage? }
// action: 'generate' | 'improve' | 'shorten' | 'translate'
// ──────────────────────────────────────────────
router.post('/generate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, text, targetLanguage } = req.body;

    // Validierung
    if (!action || !SYSTEM_PROMPTS[action]) {
      res.status(400).json({ error: 'Ungültige Aktion. Erlaubt: generate, improve, shorten, translate, generate_title, generate_html' });
      return;
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text darf nicht leer sein.' });
      return;
    }

    if (text.length > 5000) {
      res.status(400).json({ error: 'Text darf maximal 5000 Zeichen lang sein.' });
      return;
    }

    if (action === 'translate' && !targetLanguage) {
      res.status(400).json({ error: 'Zielsprache muss angegeben werden.' });
      return;
    }

    // API-Key prüfen
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      res.status(400).json({ error: 'OpenAI API-Key nicht konfiguriert. Bitte unter Einstellungen hinterlegen.' });
      return;
    }

    // User-Prompt zusammenbauen
    let userPrompt = text;
    if (action === 'translate' && targetLanguage) {
      userPrompt = `Übersetze in ${targetLanguage}:\n\n${text}`;
    }

    // OpenAI API aufrufen
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[action] },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: action === 'generate_html' ? 3000 : 1000,
        temperature: action === 'generate_title' ? 0.5 : 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const result = response.data?.choices?.[0]?.message?.content?.trim();

    if (!result) {
      res.status(500).json({ error: 'Keine Antwort von der KI erhalten.' });
      return;
    }

    logger.info(`AI ${action} request by user ${req.user?.id}, input: ${text.length} chars, output: ${result.length} chars`);

    res.json({
      success: true,
      result,
      action,
      tokensUsed: response.data?.usage?.total_tokens || 0,
    });

  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { error?: { message?: string; code?: string } } }; message?: string };
    // OpenAI-spezifische Fehler abfangen
    if (err.response?.status === 401) {
      res.status(400).json({ error: 'Ungültiger OpenAI API-Key. Bitte prüfen.' });
      return;
    }
    if (err.response?.status === 429) {
      res.status(429).json({ error: 'Zu viele Anfragen an OpenAI. Bitte kurz warten.' });
      return;
    }
    if (err.response?.status === 402 || err.response?.data?.error?.code === 'insufficient_quota') {
      res.status(402).json({ error: 'OpenAI Guthaben aufgebraucht. Bitte API-Konto aufladen.' });
      return;
    }

    logger.error('AI generation error:', err.message || error);
    res.status(500).json({ error: 'KI-Fehler: ' + (err.response?.data?.error?.message || err.message || 'Unbekannter Fehler') });
  }
});

// ──────────────────────────────────────────────
// GET /api/ai/status
// Prüft ob AI konfiguriert ist
// ──────────────────────────────────────────────
router.get('/status', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apiKey = await getOpenAIKey();
    res.json({
      configured: !!apiKey,
      provider: 'OpenAI',
      model: 'gpt-4o-mini',
    });
  } catch {
    res.json({ configured: false });
  }
});

// ──────────────────────────────────────────────
// POST /api/ai/generate-image
// Body: { prompt, size?, quality? }
// Generiert ein Bild via DALL-E 3 und speichert es in /uploads/originals/
// ──────────────────────────────────────────────
router.post('/generate-image', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt, size = '1792x1024', quality = 'standard' } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      res.status(400).json({ error: 'Prompt ist zu kurz (mindestens 5 Zeichen).' });
      return;
    }
    if (prompt.length > 800) {
      res.status(400).json({ error: 'Prompt darf maximal 800 Zeichen haben.' });
      return;
    }

    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      res.status(400).json({ error: 'Ungültige Bildgröße. Erlaubt: 1024x1024, 1792x1024, 1024x1792' });
      return;
    }

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      res.status(400).json({ error: 'OpenAI API-Key nicht konfiguriert. Bitte unter Einstellungen hinterlegen.' });
      return;
    }

    // DALL-E 3 aufrufen
    const genResponse = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt.trim(),
        n: 1,
        size,
        quality,
        response_format: 'url',
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 90000,
      }
    );

    const imageUrl = genResponse.data?.data?.[0]?.url;
    if (!imageUrl) {
      res.status(500).json({ error: 'Keine Bild-URL von DALL-E erhalten.' });
      return;
    }

    // Bild herunterladen (DALL-E URLs sind temporär, ~1h gültig)
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
    const buffer = Buffer.from(imageRes.data as ArrayBuffer);

    // Dateiname aus Prompt ableiten
    const safeName = prompt.trim().slice(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜ]/g, '_').replace(/_+/g, '_');
    const filename = `ki_${safeName}_${Date.now()}.png`;
    const uploadsDir = path.join(__dirname, '../../uploads/originals');

    // Verzeichnis sicherstellen
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const savePath = path.join(uploadsDir, filename);
    fs.writeFileSync(savePath, buffer);

    // Media-Eintrag in DB anlegen
    const media = await Media.create({
      filename,
      originalName: `KI: ${prompt.trim().slice(0, 80)}`,
      mimeType: 'image/png',
      size: buffer.length,
      url: `/uploads/originals/${filename}`,
      uploadedBy: req.user!.id,
    });

    logger.info(`AI image generated by user ${req.user?.id}: "${prompt.slice(0, 60)}" → ${filename} (${Math.round(buffer.length / 1024)}KB)`);

    res.json({
      success: true,
      mediaId: media.id,
      url: `/uploads/originals/${filename}`,
      filename,
      prompt: prompt.trim(),
    });

  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { error?: { message?: string; code?: string } } }; message?: string };

    if (err.response?.status === 401) {
      res.status(400).json({ error: 'Ungültiger OpenAI API-Key.' });
      return;
    }
    if (err.response?.status === 429) {
      res.status(429).json({ error: 'Zu viele Anfragen. Bitte kurz warten.' });
      return;
    }
    if (err.response?.status === 400) {
      const msg = err.response.data?.error?.message || 'content policy violation';
      res.status(400).json({ error: 'Prompt abgelehnt: ' + msg });
      return;
    }
    if (err.response?.status === 402 || err.response?.data?.error?.code === 'insufficient_quota') {
      res.status(402).json({ error: 'OpenAI Guthaben aufgebraucht.' });
      return;
    }

    logger.error('AI image generation error:', err.message || error);
    res.status(500).json({ error: 'Bildgenerierung fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler') });
  }
});

// ──────────────────────────────────────────────
// POST /api/ai/analyze-image
// Body: { imageUrl }  — muss mit /uploads/ beginnen
// Analysiert ein hochgeladenes Bild via GPT-4o Vision
// Gibt zurück: { title, caption, description }
// ──────────────────────────────────────────────
router.post('/analyze-image', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { imageUrl } = req.body;

    // Sicherheit: nur interne Upload-Pfade erlaubt (verhindert SSRF)
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) {
      res.status(400).json({ error: 'Nur interne Bild-URLs aus /uploads/ sind erlaubt.' });
      return;
    }
    // Path-Traversal-Schutz
    const normalizedUrl = path.posix.normalize(imageUrl);
    if (!normalizedUrl.startsWith('/uploads/')) {
      res.status(400).json({ error: 'Ungültige Bild-URL.' });
      return;
    }

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      res.status(400).json({ error: 'OpenAI API-Key nicht konfiguriert.' });
      return;
    }

    const filePath = path.join(__dirname, '../../', normalizedUrl);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Bilddatei nicht gefunden.' });
      return;
    }

    // Datei als Base64 lesen (kein öffentlicher URL nötig)
    const imgBuffer = fs.readFileSync(filePath);
    const base64 = imgBuffer.toString('base64');
    const lc = normalizedUrl.toLowerCase();
    const mimeType = lc.endsWith('.jpg') || lc.endsWith('.jpeg') ? 'image/jpeg'
      : lc.endsWith('.webp') ? 'image/webp'
      : 'image/png';

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analysiere dieses Bild für eine digitale Anzeigetafel in einem Unternehmensumfeld.
Gib zurück als reines JSON-Objekt (kein Markdown, keine Erklärungen):
{"title":"Kurzer prägnanter Titel (max. 60 Zeichen, Deutsch)","caption":"Kurze Bildunterschrift (max. 120 Zeichen, Deutsch)","description":"Kurze sachliche Bildbeschreibung (max. 200 Zeichen, Deutsch)"}`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        }],
        max_tokens: 300,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('KI-Antwort konnte nicht geparst werden');

    const result = JSON.parse(jsonMatch[0]);
    logger.info(`AI analyze-image by user ${req.user?.id}: ${normalizedUrl}`);

    res.json({
      success: true,
      title: result.title || '',
      caption: result.caption || '',
      description: result.description || '',
      tokensUsed: response.data?.usage?.total_tokens || 0,
    });

  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };
    if (err.response?.status === 401) { res.status(400).json({ error: 'Ungültiger OpenAI API-Key.' }); return; }
    if (err.response?.status === 429) { res.status(429).json({ error: 'Zu viele Anfragen. Bitte kurz warten.' }); return; }
    logger.error('AI analyze-image error:', err.message || error);
    res.status(500).json({ error: 'Bildanalyse fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler') });
  }
});

// ──────────────────────────────────────────────
// POST /api/ai/suggest-post
// Body: { topic, context? }
// Erstellt einen vollständigen Beitragsvorschlag
// Gibt zurück: { contentType, title, content, duration, showTitle }
// ──────────────────────────────────────────────
router.post('/suggest-post', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topic, context } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      res.status(400).json({ error: 'Thema ist zu kurz (mindestens 3 Zeichen).' });
      return;
    }
    if (topic.length > 500) {
      res.status(400).json({ error: 'Thema darf maximal 500 Zeichen haben.' });
      return;
    }
    if (context && typeof context === 'string' && context.length > 300) {
      res.status(400).json({ error: 'Kontext darf maximal 300 Zeichen haben.' });
      return;
    }

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      res.status(400).json({ error: 'OpenAI API-Key nicht konfiguriert.' });
      return;
    }

    const systemPrompt = `Du bist Assistent für digitale Anzeigetafeln (Digital Signage) in einem Unternehmensumfeld.
Erstelle einen vollständigen Beitragsvorschlag als reines JSON-Objekt (kein Markdown, keine Erklärungen):
{"contentType":"text","title":"Kurzer Titel (max. 60 Zeichen)","content":"Beitragstext (plain text, Zeilenumbrüche mit \\n)","duration":10,"showTitle":true}
Regeln: contentType immer "text". duration 5–60 Sekunden je nach Textlänge. Sprache: Deutsch. Sachlich und prägnant.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Thema: ${topic.trim()}${context?.trim() ? '\nKontext: ' + context.trim() : ''}` },
        ],
        max_tokens: 1500,
        temperature: 0.8,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('KI-Antwort konnte nicht geparst werden');

    const result = JSON.parse(jsonMatch[0]);
    logger.info(`AI suggest-post by user ${req.user?.id}: "${topic.slice(0, 50)}"`);

    res.json({
      success: true,
      contentType: result.contentType || 'text',
      title: result.title || '',
      content: result.content || '',
      duration: Math.min(60, Math.max(5, parseInt(result.duration) || 10)),
      showTitle: result.showTitle !== false,
      tokensUsed: response.data?.usage?.total_tokens || 0,
    });

  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };
    if (err.response?.status === 401) { res.status(400).json({ error: 'Ungültiger OpenAI API-Key.' }); return; }
    if (err.response?.status === 429) { res.status(429).json({ error: 'Zu viele Anfragen. Bitte kurz warten.' }); return; }
    if (err.response?.status === 402) { res.status(402).json({ error: 'OpenAI Guthaben aufgebraucht.' }); return; }
    logger.error('AI suggest-post error:', err.message || error);
    res.status(500).json({ error: 'Vorschlag fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler') });
  }
});

// ──────────────────────────────────────────────
// Bulk-Übersetzung: mehrere Beiträge auf einmal
// ──────────────────────────────────────────────
router.post('/bulk-translate', authenticate, async (req: AuthRequest, res: Response) => {
  const { postIds, targetLanguage } = req.body;

  if (!Array.isArray(postIds) || postIds.length === 0 || postIds.length > 20) {
    res.status(400).json({ error: 'postIds muss ein Array mit 1–20 Einträgen sein.' }); return;
  }
  if (!targetLanguage || typeof targetLanguage !== 'string' || targetLanguage.length > 60) {
    res.status(400).json({ error: 'targetLanguage fehlt oder ist ungültig.' }); return;
  }

  const apiKey = await getOpenAIKey();
  if (!apiKey) { res.status(400).json({ error: 'Kein OpenAI API-Key konfiguriert.' }); return; }

  const results: { id: number; newPostId?: number; skipped?: boolean; error?: string }[] = [];

  for (const rawId of postIds) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) { results.push({ id: rawId, error: 'Ungültige ID' }); continue; }

    let post: Post | null = null;
    try {
      post = await Post.findByPk(id);
    } catch {
      results.push({ id, error: 'Datenbankfehler' }); continue;
    }
    if (!post) { results.push({ id, error: 'Beitrag nicht gefunden' }); continue; }
    if (post.contentType !== 'text') { results.push({ id, skipped: true }); continue; }

    try {
      const translateTitle = async (text: string) => {
        const r = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          { model: 'gpt-4o-mini', messages: [
              { role: 'system', content: SYSTEM_PROMPTS.translate },
              { role: 'user', content: `Zielsprache: ${targetLanguage}\n\n${text}` }
            ], max_tokens: 200, temperature: 0.3 },
          { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return r.data?.choices?.[0]?.message?.content?.trim() || text;
      };

      const [translatedTitle, translatedContent] = await Promise.all([
        translateTitle(post.title),
        post.content ? translateTitle(post.content) : Promise.resolve(post.content),
      ]);

      const postData = post.toJSON() as Record<string, unknown>;
      delete postData.id;
      delete postData.createdAt;
      delete postData.updatedAt;

      const newPost = await Post.create({
        ...postData,
        title: translatedTitle,
        content: translatedContent,
        createdBy: req.user!.id,
      } as Post);

      results.push({ id, newPostId: newPost.id });
      logger.info(`AI bulk-translate: post ${id} → new post ${newPost.id} (${targetLanguage}) by user ${req.user?.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      results.push({ id, error: e.response?.data?.error?.message || e.message || 'Übersetzungsfehler' });
    }
  }

  const translated = results.filter(r => r.newPostId).length;
  const skipped = results.filter(r => r.skipped).length;
  const errors = results.filter(r => r.error).length;

  res.json({ success: true, results, translated, skipped, errors });
});

export default router;
