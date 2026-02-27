import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const execAsync = promisify(exec);
const router = Router();

const MODE_FILE = '/etc/prasco/boot-mode';

/**
 * @openapi
 * /api/system/mode:
 *   get:
 *     tags:
 *       - System
 *     summary: Aktuellen System-Modus abrufen
 *     description: Gibt den aktuellen Boot-Modus (normal/hotspot) zurück
 *     responses:
 *       200:
 *         description: System-Modus erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     mode:
 *                       type: string
 *                       enum: [normal, hotspot]
 *                     hotspotActive:
 *                       type: boolean
 *                     hotspotConfig:
 *                       type: object
 *                       properties:
 *                         ssid:
 *                           type: string
 *                         ip:
 *                           type: string
 *     security:
 *       - bearerAuth: []
 */
router.get('/mode', authenticate, requirePermission('settings.read'), async (_req: Request, res: Response) => {
  try {
    // Lese gespeicherten Modus
    let mode = 'normal';
    try {
      const modeContent = await fs.readFile(MODE_FILE, 'utf-8');
      mode = modeContent.trim();
    } catch (err) {
      // Falls Datei nicht existiert, erstelle sie mit default
      try {
        await execAsync(`sudo mkdir -p /etc/prasco && echo "normal" | sudo tee ${MODE_FILE} > /dev/null`);
        mode = 'normal';
      } catch {
        // Ignoriere Fehler, verwende default
      }
    }

    // Prüfe ob Hotspot aktiv ist
    let hotspotActive = false;
    try {
      const { stdout } = await execAsync('sudo systemctl is-active hostapd');
      hotspotActive = stdout.trim() === 'active';
    } catch {
      hotspotActive = false;
    }

    res.json({
      success: true,
      data: {
        mode,
        hotspotActive,
        hotspotConfig: {
          ssid: 'PRASCO-Display',
          ip: '192.168.4.1',
          password: 'prasco123',
        },
      },
    });
  } catch (error: unknown) {
    console.error('System mode error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen des System-Modus',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @openapi
 * /api/system/mode:
 *   post:
 *     tags:
 *       - System
 *     summary: System-Modus wechseln
 *     description: Wechselt zwischen Normal- und Hotspot-Modus (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [normal, hotspot]
 *     responses:
 *       200:
 *         description: Modus erfolgreich gewechselt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Ungültiger Modus
 *       403:
 *         description: Keine Berechtigung
 *     security:
 *       - bearerAuth: []
 */
router.post('/mode', authenticate, requirePermission('settings.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode } = req.body;

    if (!mode || !['normal', 'hotspot'].includes(mode)) {
      res.status(400).json({
        success: false,
        error: 'Ungültiger Modus. Erlaubt: normal, hotspot',
      });
      return;
    }

    // Speichere Modus
    try {
      await execAsync(`sudo mkdir -p /etc/prasco && echo "${mode}" | sudo tee ${MODE_FILE} > /dev/null`);
    } catch (err: any) {
      console.error('Failed to save mode:', err);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Speichern des Modus',
        details: err.message,
      });
      return;
    }

    if (mode === 'normal') {
      // Wechsel zu Normal-Modus
      try {
        await execAsync('sudo systemctl stop hostapd dnsmasq || true');
        await execAsync('sudo systemctl disable hostapd dnsmasq || true');
        
        // Entferne statische IP
        await execAsync('sudo sed -i "/interface wlan0/,/nohook wpa_supplicant/d" /etc/dhcpcd.conf || true');
        await execAsync('sudo systemctl restart dhcpcd || true');
      } catch (err: any) {
        console.error('Failed to switch to normal mode:', err);
        res.status(500).json({
          success: false,
          error: 'Fehler beim Wechseln zu Normal-Modus',
          details: err.message,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Normal-Modus aktiviert. Hotspot wurde gestoppt.',
      });
    } else {
      // Wechsel zu Hotspot-Modus
      try {
        // Prüfe ob statische IP bereits existiert
        const { stdout: dhcpcdContent } = await execAsync('cat /etc/dhcpcd.conf');
        if (!dhcpcdContent.includes('interface wlan0')) {
          // Konfiguriere statische IP
          const dhcpcdConfig = `\ninterface wlan0\nstatic ip_address=192.168.4.1/24\nnohook wpa_supplicant\n`;
          await execAsync(`echo "${dhcpcdConfig}" | sudo tee -a /etc/dhcpcd.conf > /dev/null`);
          await execAsync('sudo systemctl restart dhcpcd');
        }

        // Starte Hotspot
        await execAsync('sudo systemctl enable hostapd dnsmasq');
        await execAsync('sudo systemctl start hostapd dnsmasq');
      } catch (err: any) {
        console.error('Failed to switch to hotspot mode:', err);
        res.status(500).json({
          success: false,
          error: 'Fehler beim Wechseln zu Hotspot-Modus',
          details: err.message,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Hotspot-Modus aktiviert. SSID: PRASCO-Display, IP: 192.168.4.1',
      });
    }
  } catch (error: unknown) {
    console.error('System mode switch error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Wechseln des Modus',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
