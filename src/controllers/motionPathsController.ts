import { Request, Response } from 'express';
import MotionPath from '../models/MotionPath';
import ElementAnimation from '../models/ElementAnimation';

/**
 * MotionPaths Controller
 * 
 * Verwaltet Motion Paths für Element-Animationen
 * - CRUD Operationen für Motion Paths
 * - Laden nach Animation-ID
 * - Vordefinierte Pfad-Templates
 */

/**
 * GET /api/motion-paths/animation/:animationId
 * Lade Motion Path für eine bestimmte ElementAnimation
 */
export const getMotionPathByAnimationId = async (req: Request, res: Response) => {
  try {
    const { animationId } = req.params;

    const motionPath = await MotionPath.findOne({
      where: { elementAnimationId: parseInt(animationId) },
    });

    if (!motionPath) {
      res.status(404).json({
        success: false,
        message: 'Motion Path nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      motionPath,
    });
  } catch (error) {
    console.error('Error loading motion path:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Motion Paths',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/motion-paths/:id
 * Lade einen spezifischen Motion Path nach ID
 */
export const getMotionPathById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const motionPath = await MotionPath.findByPk(parseInt(id));

    if (!motionPath) {
      res.status(404).json({
        success: false,
        message: 'Motion Path nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      motionPath,
    });
  } catch (error) {
    console.error('Error loading motion path:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Motion Paths',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/motion-paths
 * Erstelle einen neuen Motion Path
 */
export const createMotionPath = async (req: Request, res: Response) => {
  try {
    const {
      elementAnimationId,
      pathType,
      pathData,
      autoOrient = true,
      orientAngle = 0,
      anchorPoint = 'center',
    } = req.body;

    // Validierung
    if (!elementAnimationId) {
      res.status(400).json({
        success: false,
        message: 'elementAnimationId ist erforderlich',
      });
      return;
    }

    if (!pathType) {
      res.status(400).json({
        success: false,
        message: 'pathType ist erforderlich',
      });
      return;
    }

    if (!MotionPath.isValidPathType(pathType)) {
      res.status(400).json({
        success: false,
        message: 'Ungültiger pathType. Erlaubt: line, curve, arc, circle, custom',
      });
      return;
    }

    if (!pathData) {
      res.status(400).json({
        success: false,
        message: 'pathData ist erforderlich',
      });
      return;
    }

    // Prüfe ob ElementAnimation existiert
    const elementAnimation = await ElementAnimation.findByPk(elementAnimationId);
    if (!elementAnimation) {
      res.status(404).json({
        success: false,
        message: 'ElementAnimation nicht gefunden',
      });
      return;
    }

    // Prüfe ob bereits ein MotionPath für diese Animation existiert
    const existingPath = await MotionPath.findOne({
      where: { elementAnimationId },
    });

    if (existingPath) {
      res.status(409).json({
        success: false,
        message: 'Motion Path für diese Animation existiert bereits. Verwenden Sie PUT zum Aktualisieren.',
      });
      return;
    }

    // pathData als String sicherstellen (falls Objekt übergeben wurde)
    const pathDataString = typeof pathData === 'string' ? pathData : JSON.stringify(pathData);

    // Erstelle Motion Path
    const motionPath = await MotionPath.create({
      elementAnimationId,
      pathType,
      pathData: pathDataString,
      autoOrient,
      orientAngle,
      anchorPoint,
    });

    res.status(201).json({
      success: true,
      message: 'Motion Path erfolgreich erstellt',
      motionPath,
    });
  } catch (error) {
    console.error('Error creating motion path:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Motion Paths',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/motion-paths/:id
 * Aktualisiere einen Motion Path
 */
export const updateMotionPath = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      pathType,
      pathData,
      autoOrient,
      orientAngle,
      anchorPoint,
    } = req.body;

    const motionPath = await MotionPath.findByPk(parseInt(id));

    if (!motionPath) {
      res.status(404).json({
        success: false,
        message: 'Motion Path nicht gefunden',
      });
      return;
    }

    // Validierung
    if (pathType && !MotionPath.isValidPathType(pathType)) {
      res.status(400).json({
        success: false,
        message: 'Ungültiger pathType',
      });
      return;
    }

    if (anchorPoint && !MotionPath.isValidAnchorPoint(anchorPoint)) {
      res.status(400).json({
        success: false,
        message: 'Ungültiger anchorPoint',
      });
      return;
    }

    // Update Felder
    if (pathType !== undefined) motionPath.pathType = pathType;
    if (pathData !== undefined) {
      motionPath.pathData = typeof pathData === 'string' ? pathData : JSON.stringify(pathData);
    }
    if (autoOrient !== undefined) motionPath.autoOrient = autoOrient;
    if (orientAngle !== undefined) motionPath.orientAngle = orientAngle;
    if (anchorPoint !== undefined) motionPath.anchorPoint = anchorPoint;

    await motionPath.save();

    res.json({
      success: true,
      message: 'Motion Path erfolgreich aktualisiert',
      motionPath,
    });
  } catch (error) {
    console.error('Error updating motion path:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Motion Paths',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * DELETE /api/motion-paths/:id
 * Lösche einen Motion Path
 */
export const deleteMotionPath = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const motionPath = await MotionPath.findByPk(parseInt(id));

    if (!motionPath) {
      res.status(404).json({
        success: false,
        message: 'Motion Path nicht gefunden',
      });
      return;
    }

    await motionPath.destroy();

    res.json({
      success: true,
      message: 'Motion Path erfolgreich gelöscht',
    });
  } catch (error) {
    console.error('Error deleting motion path:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Motion Paths',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/motion-paths/templates
 * Lade vordefinierte Path-Templates
 */
export const getPathTemplates = async (req: Request, res: Response) => {
  try {
    const width = parseInt(req.query.width as string) || 300;
    const height = parseInt(req.query.height as string) || 300;

    const templates = [
      {
        type: 'line',
        name: 'Gerade Linie',
        description: 'Einfache lineare Bewegung von A nach B',
        pathData: MotionPath.generatePredefinedPath('line', width, height),
      },
      {
        type: 'curve',
        name: 'Kurve',
        description: 'Sanfte Kurve (Quadratische Bézier)',
        pathData: MotionPath.generatePredefinedPath('curve', width, height),
      },
      {
        type: 'arc',
        name: 'Bogen',
        description: 'Kreisbogen von links nach rechts',
        pathData: MotionPath.generatePredefinedPath('arc', width, height),
      },
      {
        type: 'circle',
        name: 'Kreis',
        description: 'Vollständige Kreisbewegung',
        pathData: MotionPath.generatePredefinedPath('circle', width, height),
      },
    ];

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Error loading path templates:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/motion-paths/upsert
 * Erstelle oder aktualisiere Motion Path (für bequeme Verwendung)
 */
export const upsertMotionPath = async (req: Request, res: Response) => {
  try {
    const {
      elementAnimationId,
      pathType,
      pathData,
      autoOrient = true,
      orientAngle = 0,
      anchorPoint = 'center',
    } = req.body;

    if (!elementAnimationId) {
      res.status(400).json({
        success: false,
        message: 'elementAnimationId ist erforderlich',
      });
      return;
    }

    // Prüfe ob bereits existiert
    const existingPath = await MotionPath.findOne({
      where: { elementAnimationId },
    });

    const pathDataString = typeof pathData === 'string' ? pathData : JSON.stringify(pathData);

    if (existingPath) {
      // Update
      if (pathType !== undefined) existingPath.pathType = pathType;
      if (pathData !== undefined) existingPath.pathData = pathDataString;
      if (autoOrient !== undefined) existingPath.autoOrient = autoOrient;
      if (orientAngle !== undefined) existingPath.orientAngle = orientAngle;
      if (anchorPoint !== undefined) existingPath.anchorPoint = anchorPoint;

      await existingPath.save();

      res.json({
        success: true,
        message: 'Motion Path erfolgreich aktualisiert',
        motionPath: existingPath,
        action: 'updated',
      });
    } else {
      // Create
      const motionPath = await MotionPath.create({
        elementAnimationId,
        pathType,
        pathData: pathDataString,
        autoOrient,
        orientAngle,
        anchorPoint,
      });

      res.status(201).json({
        success: true,
        message: 'Motion Path erfolgreich erstellt',
        motionPath,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('Error upserting motion path:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Speichern des Motion Paths',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
