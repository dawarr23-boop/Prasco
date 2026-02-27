import { Request, Response } from 'express';
import Setting from '../models/Setting';
import { cacheService } from '../utils/cache';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Hole alle Einstellungen oder spezifische nach Kategorie
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    // Cache key based on category filter
    const cacheKey = `settings:category_${category || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

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

    // Cache for 10 minutes (settings rarely change)
    cacheService.set(cacheKey, settingsObj, 600);

    res.json(settingsObj);
  } catch (error: unknown) {
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
  } catch (error: unknown) {
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

    // Invalidate all settings caches
    cacheService.delByPrefix('settings:');

    // Spezielle Behandlung für system.networkMode - update boot-mode file
    if (key === 'system.networkMode' && (stringValue === 'normal' || stringValue === 'hotspot')) {
      try {
        console.log(`🔄 Updating boot-mode file to: ${stringValue}`);
        await execAsync(`echo "${stringValue}" | sudo tee /etc/prasco/boot-mode > /dev/null`);
        console.log(`✅ Boot-mode file updated to: ${stringValue}`);
      } catch (err: any) {
        console.error('⚠️ Failed to update boot-mode file:', err.message);
        // Don't fail the request, just log the error
      }
    }

    res.json({
      message: created ? 'Einstellung erstellt' : 'Einstellung aktualisiert',
      key: setting.key,
      value: setting.getParsedValue(),
    });
  } catch (error: unknown) {
    console.error('Error setting value:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Einstellung' });
  }
};

/**
 * Setze mehrere Einstellungen auf einmal
 */
export const setBulkSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📥 Full req.body:', JSON.stringify(req.body, null, 2));
    console.log('📥 req.body.settings:', req.body.settings);
    console.log('📥 typeof req.body:', typeof req.body);
    console.log('📥 Object.keys(req.body):', Object.keys(req.body));
    
    const { settings } = req.body;

    console.log('💾 setBulkSettings called with:', settings);

    if (!settings || typeof settings !== 'object') {
      console.log('❌ Invalid settings object');
      res.status(400).json({ error: 'Settings-Objekt ist erforderlich' });
      return;
    }

    const results = [];
    let networkModeChanged = false;
    let newNetworkMode = '';

    for (const [key, value] of Object.entries(settings)) {
      console.log(`  📝 Processing: ${key} = ${value} (type: ${typeof value})`);
      
      // Bestimme Typ automatisch
      let type: 'string' | 'number' | 'boolean' | 'json' = 'string';
      let stringValue: string;

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

      // Kategorie automatisch aus dem Key-Prefix ableiten (z.B. 'transit.enabled' → 'transit')
      const category = key.includes('.') ? key.split('.')[0] : undefined;

      console.log(`  💿 Upserting: ${key} = ${stringValue} (type: ${type}, category: ${category})`);
      
      const [setting] = await Setting.upsert({
        key,
        value: stringValue,
        type,
        category,
      });

      console.log(`  ✅ Saved: ${setting.key} = ${setting.value}`);

      // Check if network mode was changed
      if (key === 'system.networkMode' && (stringValue === 'normal' || stringValue === 'hotspot')) {
        networkModeChanged = true;
        newNetworkMode = stringValue;
      }

      results.push({
        key: setting.key,
        value: setting.getParsedValue(),
      });
    }

    console.log('✅ All settings saved, results count:', results.length);

    // Update boot-mode file if network mode changed
    if (networkModeChanged) {
      try {
        console.log(`🔄 Updating boot-mode file to: ${newNetworkMode}`);
        await execAsync(`echo "${newNetworkMode}" | sudo tee /etc/prasco/boot-mode > /dev/null`);
        console.log(`✅ Boot-mode file updated to: ${newNetworkMode}`);
      } catch (err: any) {
        console.error('⚠️ Failed to update boot-mode file:', err.message);
        // Don't fail the request, just log the error
      }
    }

    // Invalidate all settings caches
    cacheService.delByPrefix('settings:');

    res.json({
      message: 'Einstellungen gespeichert',
      settings: results,
    });
  } catch (error: unknown) {
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

    // Invalidate all settings caches
    cacheService.delByPrefix('settings:');

    res.json({ message: 'Einstellung gelöscht' });
  } catch (error: unknown) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Einstellung' });
  }
};
