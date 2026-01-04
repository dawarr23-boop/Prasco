import { Request, Response } from 'express';
import Setting from '../models/Setting';

/**
 * Hole alle Einstellungen oder spezifische nach Kategorie
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const settings = await Setting.findAll({ where });

    // Konvertiere zu Object mit geparsten Werten
    const settingsObj: any = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.getParsedValue();
    });

    res.json(settingsObj);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Einstellungen' });
  }
};

/**
 * Hole eine einzelne Einstellung
 */
export const getSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({ where: { key } });

    if (!setting) {
      res.status(404).json({ error: 'Einstellung nicht gefunden' });
      return;
    }

    res.json({
      key: setting.key,
      value: setting.getParsedValue(),
      type: setting.type,
      category: setting.category,
      description: setting.description,
    });
  } catch (error: any) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Einstellung' });
  }
};

/**
 * Setze oder aktualisiere eine Einstellung
 */
export const setSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, type, category, description } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({ error: 'Key und Value sind erforderlich' });
      return;
    }

    // Konvertiere Wert zu String basierend auf Typ
    let stringValue: string;
    const settingType = type || 'string';

    switch (settingType) {
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      case 'boolean':
        stringValue = value ? 'true' : 'false';
        break;
      default:
        stringValue = String(value);
    }

    const [setting, created] = await Setting.upsert({
      key,
      value: stringValue,
      type: settingType,
      category,
      description,
    });

    res.json({
      message: created ? 'Einstellung erstellt' : 'Einstellung aktualisiert',
      key: setting.key,
      value: setting.getParsedValue(),
    });
  } catch (error: any) {
    console.error('Error setting value:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Einstellung' });
  }
};

/**
 * Setze mehrere Einstellungen auf einmal
 */
export const setBulkSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Settings-Objekt ist erforderlich' });
      return;
    }

    const results = [];

    for (const [key, value] of Object.entries(settings)) {
      // Bestimme Typ automatisch
      let type: 'string' | 'number' | 'boolean' | 'json' = 'string';
      let stringValue: string;
      
      // Extrahiere Kategorie aus dem Key (z.B. "display.refreshInterval" -> "display")
      const category = key.includes('.') ? key.split('.')[0] : undefined;

      if (typeof value === 'number') {
        type = 'number';
        stringValue = String(value);
      } else if (typeof value === 'boolean') {
        type = 'boolean';
        stringValue = value ? 'true' : 'false';
      } else if (typeof value === 'object') {
        type = 'json';
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      const [setting] = await Setting.upsert({
        key,
        value: stringValue,
        type,
        category,
      });

      results.push({
        key: setting.key,
        value: setting.getParsedValue(),
      });
    }

    res.json({
      message: 'Einstellungen gespeichert',
      settings: results,
    });
  } catch (error: any) {
    console.error('Error setting bulk values:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' });
  }
};

/**
 * Lösche eine Einstellung
 */
export const deleteSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const deleted = await Setting.destroy({ where: { key } });

    if (!deleted) {
      res.status(404).json({ error: 'Einstellung nicht gefunden' });
      return;
    }

    res.json({ message: 'Einstellung gelöscht' });
  } catch (error: any) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Einstellung' });
  }
};
