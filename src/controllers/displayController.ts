import { Request, Response, NextFunction } from 'express';
import { Display, Post, PostDisplay, Category, Media } from '../models';
import Setting from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheService } from '../utils/cache';
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs/promises';

/**
 * Get all displays
 * GET /api/displays
 */
export const getAllDisplays = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const where: any = {};

    // Filter by organization
    if (req.user?.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    // Filter by active status
    const { isActive } = req.query;
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const displays = await Display.findAll({
      where,
      order: [
        ['name', 'ASC'],
      ],
      attributes: [
        'id',
        'name',
        'identifier',
        'description',
        'isActive',
        'tickerText',
        'tickerTransit',
        'tickerTraffic',
        'showTransitData',
        'showTrafficData',
        'organizationId',
        'serialNumber',
        'macAddress',
        'authorizationStatus',
        'clientType',
        'deviceModel',
        'deviceOsVersion',
        'appVersion',
        'lastSeenAt',
        'registeredAt',
        'registrationOpen',
        'createdAt',
        'updatedAt',
      ],
    });

    // Include license info in response
    const licenseSetting = await Setting.findOne({ where: { key: 'display.maxLicensedDisplays' } });
    const maxLicensedDisplays = licenseSetting ? parseInt(licenseSetting.value, 10) : 5;

    res.json({
      success: true,
      data: displays,
      license: {
        used: displays.length,
        max: maxLicensedDisplays,
      },
    });

    logger.info(`Displays abgerufen: ${displays.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single display by ID
 * GET /api/displays/:id
 */
export const getDisplayById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const display = await Display.findByPk(id, {
      attributes: [
        'id',
        'name',
        'identifier',
        'description',
        'isActive',
        'tickerText',
        'tickerTransit',
        'tickerTraffic',
        'showTransitData',
        'showTrafficData',
        'organizationId',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    res.json({
      success: true,
      data: display,
    });

    logger.info(`Display abgerufen: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get display by identifier (for public display page)
 * GET /api/displays/by-identifier/:identifier
 */
export const getDisplayByIdentifier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;

    const display = await Display.findOne({
      where: { identifier },
      attributes: [
        'id',
        'name',
        'identifier',
        'description',
        'isActive',
        'tickerText',
        'tickerTransit',
        'tickerTraffic',
        'showTransitData',
        'showTrafficData',
        'registrationOpen',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    if (!display.isActive) {
      throw new AppError('Display ist nicht aktiv', 403);
    }

    res.json({
      success: true,
      data: display,
    });

    logger.info(`Display by identifier abgerufen: ${identifier}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new display
 * POST /api/displays
 */
export const createDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, identifier, description, isActive } = req.body;

    // License check: dynamic limit from settings (default: 5)
    const licenseSetting = await Setting.findOne({ where: { key: 'display.maxLicensedDisplays' } });
    const MAX_LICENSED_DISPLAYS = licenseSetting ? parseInt(licenseSetting.value, 10) : 5;
    const displayCount = await Display.count();
    if (displayCount >= MAX_LICENSED_DISPLAYS) {
      throw new AppError(
        `Display-Lizenzlimit erreicht (${displayCount}/${MAX_LICENSED_DISPLAYS}). Bitte kontaktieren Sie den Vertrieb unter kontakt@it-westfalen.de, um weitere Display-Lizenzen zu erwerben.`,
        403
      );
    }

    // Validate required fields
    if (!name || !identifier) {
      throw new AppError('Name und Identifier sind erforderlich', 400);
    }

    // Validate identifier format
    const identifierRegex = /^[a-zA-Z0-9-_]+$/;
    if (!identifierRegex.test(identifier)) {
      throw new AppError('Identifier darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten', 400);
    }

    // Check if identifier already exists
    const existingDisplay = await Display.findOne({ where: { identifier } });
    if (existingDisplay) {
      throw new AppError('Display mit diesem Identifier existiert bereits', 409);
    }

    const display = await Display.create({
      name,
      identifier,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
      showTransitData: req.body.showTransitData !== undefined ? req.body.showTransitData : true,
      showTrafficData: req.body.showTrafficData !== undefined ? req.body.showTrafficData : true,
      tickerText: req.body.tickerText || null,
      tickerTransit: req.body.tickerTransit === true || req.body.tickerTransit === 'true',
      tickerTraffic: req.body.tickerTraffic === true || req.body.tickerTraffic === 'true',
      organizationId: req.user?.organizationId,
    });

    res.status(201).json({
      success: true,
      data: display,
      message: 'Display erfolgreich erstellt',
    });

    logger.info(`Display erstellt: ${display.id} (${identifier})`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update display
 * PUT /api/displays/:id
 */
export const updateDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, identifier, description, isActive } = req.body;

    const display = await Display.findByPk(id);

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    // If identifier is being changed, check uniqueness
    if (identifier && identifier !== display.identifier) {
      const identifierRegex = /^[a-zA-Z0-9-_]+$/;
      if (!identifierRegex.test(identifier)) {
        throw new AppError('Identifier darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten', 400);
      }

      const existingDisplay = await Display.findOne({ where: { identifier } });
      if (existingDisplay) {
        throw new AppError('Display mit diesem Identifier existiert bereits', 409);
      }
    }

    // Update fields
    if (name !== undefined) display.name = name;
    if (identifier !== undefined) display.identifier = identifier;
    if (description !== undefined) display.description = description;
    if (isActive !== undefined) display.isActive = isActive;
    if (req.body.showTransitData !== undefined) display.showTransitData = req.body.showTransitData;
    if (req.body.showTrafficData !== undefined) display.showTrafficData = req.body.showTrafficData;
    if (req.body.tickerText !== undefined) display.tickerText = req.body.tickerText || null;
    if (req.body.tickerTransit !== undefined) display.tickerTransit = req.body.tickerTransit === true || req.body.tickerTransit === 'true';
    if (req.body.tickerTraffic !== undefined) display.tickerTraffic = req.body.tickerTraffic === true || req.body.tickerTraffic === 'true';

    await display.save();

    res.json({
      success: true,
      data: display,
      message: 'Display erfolgreich aktualisiert',
    });

    logger.info(`Display aktualisiert: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete display
 * DELETE /api/displays/:id
 */
export const deleteDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const display = await Display.findByPk(id);

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    // Check if display has assigned posts
    const postCount = await PostDisplay.count({ where: { displayId: id } });
    if (postCount > 0) {
      // Option 1: Prevent deletion if posts are assigned
      // throw new AppError(`Display kann nicht gelöscht werden. ${postCount} Posts sind diesem Display zugewiesen.`, 400);
      
      // Option 2: Delete assignments (CASCADE already handled by DB)
      logger.info(`Display ${id} wird gelöscht. ${postCount} Post-Zuweisungen werden entfernt.`);
    }

    await display.destroy();

    res.json({
      success: true,
      message: 'Display erfolgreich gelöscht',
    });

    logger.info(`Display gelöscht: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts for a specific display (admin view)
 * GET /api/displays/:id/posts
 */
export const getDisplayPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.query;

    const display = await Display.findByPk(id);

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    // Build query
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get posts: either displayMode='all' OR explicitly assigned to this display
    const posts = await Post.findAll({
      where: {
        ...where,
        [Op.or]: [
          { displayMode: 'all' },
          {
            displayMode: 'specific',
            id: {
              [Op.in]: await PostDisplay.findAll({
                where: { displayId: id },
                attributes: ['postId'],
              }).then(pds => pds.map(pd => pd.postId)),
            },
          },
        ],
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: Display,
          as: 'displays',
          through: { attributes: ['priorityOverride'] },
        },
      ],
    });

    res.json({
      success: true,
      data: posts,
    });

    logger.info(`Posts für Display ${id} abgerufen: ${posts.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active displays (public API for Android TV app)
 * GET /api/public/displays
 */
export const getPublicDisplays = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cacheKey = 'public:displays:list';
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const displays = await Display.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'identifier', 'description', 'isActive', 'showTransitData', 'showTrafficData', 'organizationId'],
    });

    const response = {
      success: true,
      data: displays,
      count: displays.length,
    };

    // Cache für 60 Sekunden
    cacheService.set(cacheKey, response, 60);

    res.json(response);

    logger.info(`Public displays abgerufen: ${displays.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts for a specific display (public API for display page)
 * GET /api/public/display/:identifier/posts
 */
export const getPublicDisplayPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;

    // Cache-Key für öffentliche Display-Posts
    const cacheKey = `public:display:${identifier}:posts`;
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const display = await Display.findOne({
      where: { identifier, isActive: true },
    });

    if (!display) {
      throw new AppError('Display nicht gefunden oder nicht aktiv', 404);
    }

    const now = new Date();

    // Get active posts for this display
    const postIds = await PostDisplay.findAll({
      where: { displayId: display.id },
      attributes: ['postId'],
    });

    const assignedPostIds = postIds.map(pd => pd.postId);

    const posts = await Post.findAll({
      where: {
        [Op.and]: [
          { isActive: true },
          {
            [Op.or]: [
              { displayMode: 'all' },
              {
                displayMode: 'specific',
                id: { [Op.in]: assignedPostIds },
              },
            ],
          },
          {
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: now } },
            ],
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: now } },
            ],
          },
        ],
      } as any,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
        {
          model: Media,
          as: 'media',
          attributes: ['id', 'url', 'thumbnailUrl', 'mimeType'],
        },
      ],
    });

    const response = {
      success: true,
      data: posts,
      display: {
        id: display.id,
        name: display.name,
        identifier: display.identifier,
        showTransitData: display.showTransitData,
        showTrafficData: display.showTrafficData,
      },
    };

    // Cache für 30 Sekunden
    cacheService.set(cacheKey, response, 30);

    res.json(response);

    logger.info(`Public posts für Display ${identifier} abgerufen: ${posts.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get license info
 * GET /api/displays/license
 */
export const getLicenseInfo = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const licenseSetting = await Setting.findOne({ where: { key: 'display.maxLicensedDisplays' } });
    const maxLicensedDisplays = licenseSetting ? parseInt(licenseSetting.value, 10) : 5;
    const displayCount = await Display.count();

    res.json({
      success: true,
      data: {
        used: displayCount,
        max: maxLicensedDisplays,
        available: Math.max(0, maxLicensedDisplays - displayCount),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update license limit
 * PUT /api/displays/license
 */
export const updateLicenseLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { maxDisplays } = req.body;

    if (!maxDisplays || isNaN(maxDisplays) || maxDisplays < 1 || maxDisplays > 100) {
      throw new AppError('Ungültige Lizenzanzahl (1-100)', 400);
    }

    await Setting.upsert({
      key: 'display.maxLicensedDisplays',
      value: String(maxDisplays),
      type: 'number',
      category: 'display',
      description: 'Maximale Anzahl lizenzierter Displays',
    });

    logger.info(`Lizenzlimit geändert auf ${maxDisplays}`);

    res.json({
      success: true,
      data: { max: maxDisplays },
      message: `Lizenzlimit auf ${maxDisplays} Displays geändert.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get device fleet overview with online/offline status
 * GET /api/displays/fleet
 */
export const getFleetOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const where: any = {};
    if (req.user?.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    const displays = await Display.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: [
        'id', 'name', 'identifier', 'isActive',
        'serialNumber', 'macAddress', 'authorizationStatus', 'clientType',
        'deviceModel', 'deviceOsVersion', 'appVersion',
        'lastSeenAt', 'registeredAt', 'registrationOpen',
      ],
    });

    const now = new Date();
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    const fleet = displays.map(d => {
      const lastSeen = d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : 0;
      const isOnline = lastSeen > 0 && (now.getTime() - lastSeen) < ONLINE_THRESHOLD_MS;
      const minutesAgo = lastSeen > 0 ? Math.floor((now.getTime() - lastSeen) / 60000) : null;

      return {
        id: d.id,
        name: d.name,
        identifier: d.identifier,
        isActive: d.isActive,
        isDevice: !!d.serialNumber,
        isOnline,
        minutesSinceLastSeen: minutesAgo,
        serialNumber: d.serialNumber,
        macAddress: d.macAddress,
        authorizationStatus: d.authorizationStatus,
        clientType: d.clientType || null,
        deviceModel: d.deviceModel,
        deviceOsVersion: d.deviceOsVersion,
        appVersion: d.appVersion,
        lastSeenAt: d.lastSeenAt,
        registeredAt: d.registeredAt,
        registrationOpen: d.registrationOpen,
      };
    });

    const licenseSetting = await Setting.findOne({ where: { key: 'display.maxLicensedDisplays' } });
    const maxLicensedDisplays = licenseSetting ? parseInt(licenseSetting.value, 10) : 5;

    const stats = {
      total: fleet.length,
      online: fleet.filter(d => d.isOnline).length,
      offline: fleet.filter(d => d.isDevice && !d.isOnline).length,
      unregistered: fleet.filter(d => !d.isDevice).length,
      pending: fleet.filter(d => d.authorizationStatus === 'pending' && d.isDevice).length,
      authorized: fleet.filter(d => d.authorizationStatus === 'authorized' && d.isDevice).length,
    };

    res.json({
      success: true,
      data: fleet,
      stats,
      license: {
        used: fleet.length,
        max: maxLicensedDisplays,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get registration info for a display (QR code data)
 * GET /api/displays/:id/registration-info
 */
export const getRegistrationInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const display = await Display.findByPk(id);

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Build registration URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const displayUrl = `${baseUrl}/public/display.html?id=${display.identifier}`;
    const registerUrl = `${baseUrl}/api/devices/register`;

    // QR code data: JSON with server info + display identifier
    const qrData = JSON.stringify({
      server: baseUrl,
      displayIdentifier: display.identifier,
      displayName: display.name,
    });

    res.json({
      success: true,
      data: {
        displayId: display.id,
        displayName: display.name,
        identifier: display.identifier,
        registrationOpen: display.registrationOpen,
        isRegistered: !!display.serialNumber,
        displayUrl,
        registerUrl,
        qrData,
        instructions: {
          step1: 'QR-Code in der Android TV App scannen oder manuell konfigurieren',
          step2: `Server-URL: ${baseUrl}`,
          step3: `Display-Identifier: ${display.identifier}`,
          step4: '"Registrierung starten" klicken, dann App starten',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Serve latest APK for Android TV app
 * GET /api/displays/apk/latest
 */
export const getLatestApk = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check multiple possible APK locations
    const apkPaths = [
      path.join(__dirname, '../../uploads/apk/prasco-tv-latest.apk'),
      path.join(__dirname, '../../android-tv-project/app/build/outputs/apk/debug/app-debug.apk'),
      path.join(__dirname, '../../uploads/apk'),
    ];

    for (const apkPath of apkPaths) {
      try {
        const stat = await fs.stat(apkPath);
        if (stat.isFile()) {
          res.download(apkPath, 'prasco-tv.apk');
          return;
        }
        if (stat.isDirectory()) {
          // Find newest APK in directory
          const files = await fs.readdir(apkPath);
          const apkFiles = files.filter(f => f.endsWith('.apk'));
          if (apkFiles.length > 0) {
            // Sort by modification time, newest first
            const withStats = await Promise.all(
              apkFiles.map(async f => ({
                name: f,
                mtime: (await fs.stat(path.join(apkPath, f))).mtimeMs,
              }))
            );
            withStats.sort((a, b) => b.mtime - a.mtime);
            res.download(path.join(apkPath, withStats[0].name), withStats[0].name);
            return;
          }
        }
      } catch {
        // Path doesn't exist, try next
      }
    }

    throw new AppError('Keine APK-Datei gefunden. Bitte laden Sie eine APK hoch.', 404);
  } catch (error) {
    next(error);
  }
};

/**
 * Get APK info (size, upload date, available)
 * GET /api/displays/apk/info
 */
export const getApkInfo = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apkPath = path.join(__dirname, '../../uploads/apk/prasco-tv-latest.apk');
    try {
      const stat = await fs.stat(apkPath);
      res.json({
        available: true,
        size: stat.size,
        sizeMb: (stat.size / 1024 / 1024).toFixed(1),
        uploadedAt: stat.mtime.toISOString(),
      });
    } catch {
      res.json({ available: false });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Upload APK for distribution
 * POST /api/displays/apk/upload
 */
export const uploadApk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Keine Datei hochgeladen', 400);
    }

    const uploadsDir = path.join(__dirname, '../../uploads/apk');
    await fs.mkdir(uploadsDir, { recursive: true });

    const targetPath = path.join(uploadsDir, 'prasco-tv-latest.apk');
    await fs.rename(req.file.path, targetPath);

    // Also save with version name
    const versionName = `prasco-tv-${new Date().toISOString().split('T')[0]}.apk`;
    await fs.copyFile(targetPath, path.join(uploadsDir, versionName));

    logger.info(`APK hochgeladen: ${versionName} (${req.file.size} bytes)`);

    res.json({
      success: true,
      message: `APK erfolgreich hochgeladen (${(req.file.size / 1024 / 1024).toFixed(1)} MB)`,
      data: {
        filename: versionName,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};
