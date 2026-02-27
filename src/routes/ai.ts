import { Router, Response } from 'express';
import axios from 'axios';
import { authenticate, AuthRequest } from '../middleware/auth';
import Setting from '../models/Setting';
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
      res.status(400).json({ error: 'Ungültige Aktion. Erlaubt: generate, improve, shorten, translate' });
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
        max_tokens: 1000,
        temperature: 0.7,
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

export default router;
