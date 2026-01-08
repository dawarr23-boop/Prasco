import { Request, Response } from 'express';
import ElementAnimation from '../models/ElementAnimation';
import Post from '../models/Post';

/**
 * GET /api/animations/effects
 * Liefert alle verfügbaren Animation-Effekte gruppiert nach Typ
 */
export const getAvailableEffects = async (_req: Request, res: Response) => {
  try {
    const effects = {
      entrance: [
        { name: 'fadeIn', displayName: 'Fade In', description: 'Sanft einblenden' },
        { name: 'fadeInUp', displayName: 'Fade In Up', description: 'Von unten einblenden' },
        { name: 'fadeInDown', displayName: 'Fade In Down', description: 'Von oben einblenden' },
        { name: 'fadeInLeft', displayName: 'Fade In Left', description: 'Von links einblenden' },
        { name: 'fadeInRight', displayName: 'Fade In Right', description: 'Von rechts einblenden' },
        { name: 'flyIn', displayName: 'Fly In', description: 'Hereinfliegen' },
        { name: 'flyInUp', displayName: 'Fly In Up', description: 'Von unten hereinfliegen' },
        { name: 'flyInDown', displayName: 'Fly In Down', description: 'Von oben hereinfliegen' },
        { name: 'flyInLeft', displayName: 'Fly In Left', description: 'Von links hereinfliegen' },
        { name: 'flyInRight', displayName: 'Fly In Right', description: 'Von rechts hereinfliegen' },
        { name: 'zoomIn', displayName: 'Zoom In', description: 'Hineinzoomen' },
        { name: 'zoomInUp', displayName: 'Zoom In Up', description: 'Zoom mit Aufwärtsbewegung' },
        { name: 'zoomInDown', displayName: 'Zoom In Down', description: 'Zoom mit Abwärtsbewegung' },
        { name: 'bounceIn', displayName: 'Bounce In', description: 'Hüpfend erscheinen' },
        { name: 'slideIn', displayName: 'Slide In', description: 'Hereingleiten' },
        { name: 'slideInUp', displayName: 'Slide In Up', description: 'Von unten gleiten' },
        { name: 'slideInDown', displayName: 'Slide In Down', description: 'Von oben gleiten' },
        { name: 'slideInLeft', displayName: 'Slide In Left', description: 'Von links gleiten' },
        { name: 'slideInRight', displayName: 'Slide In Right', description: 'Von rechts gleiten' },
        { name: 'rotateIn', displayName: 'Rotate In', description: 'Rotierend erscheinen' },
        { name: 'flipIn', displayName: 'Flip In', description: 'Umdrehen und erscheinen' },
        { name: 'lightSpeedIn', displayName: 'Light Speed In', description: 'Blitzschnell erscheinen' },
      ],
      exit: [
        { name: 'fadeOut', displayName: 'Fade Out', description: 'Sanft ausblenden' },
        { name: 'fadeOutUp', displayName: 'Fade Out Up', description: 'Nach oben ausblenden' },
        { name: 'fadeOutDown', displayName: 'Fade Out Down', description: 'Nach unten ausblenden' },
        { name: 'fadeOutLeft', displayName: 'Fade Out Left', description: 'Nach links ausblenden' },
        { name: 'fadeOutRight', displayName: 'Fade Out Right', description: 'Nach rechts ausblenden' },
        { name: 'flyOut', displayName: 'Fly Out', description: 'Herausfliegen' },
        { name: 'flyOutUp', displayName: 'Fly Out Up', description: 'Nach oben fliegen' },
        { name: 'flyOutDown', displayName: 'Fly Out Down', description: 'Nach unten fliegen' },
        { name: 'flyOutLeft', displayName: 'Fly Out Left', description: 'Nach links fliegen' },
        { name: 'flyOutRight', displayName: 'Fly Out Right', description: 'Nach rechts fliegen' },
        { name: 'zoomOut', displayName: 'Zoom Out', description: 'Herauszoomen' },
        { name: 'bounceOut', displayName: 'Bounce Out', description: 'Hüpfend verschwinden' },
        { name: 'slideOut', displayName: 'Slide Out', description: 'Herausgleiten' },
        { name: 'slideOutUp', displayName: 'Slide Out Up', description: 'Nach oben gleiten' },
        { name: 'slideOutDown', displayName: 'Slide Out Down', description: 'Nach unten gleiten' },
        { name: 'slideOutLeft', displayName: 'Slide Out Left', description: 'Nach links gleiten' },
        { name: 'slideOutRight', displayName: 'Slide Out Right', description: 'Nach rechts gleiten' },
        { name: 'rotateOut', displayName: 'Rotate Out', description: 'Rotierend verschwinden' },
        { name: 'flipOut', displayName: 'Flip Out', description: 'Umdrehen und verschwinden' },
      ],
      emphasis: [
        { name: 'pulse', displayName: 'Pulse', description: 'Pulsieren' },
        { name: 'bounce', displayName: 'Bounce', description: 'Hüpfen' },
        { name: 'shake', displayName: 'Shake', description: 'Schütteln' },
        { name: 'swing', displayName: 'Swing', description: 'Schwingen' },
        { name: 'wobble', displayName: 'Wobble', description: 'Wackeln' },
        { name: 'jello', displayName: 'Jello', description: 'Wabbeln' },
        { name: 'heartBeat', displayName: 'Heart Beat', description: 'Herzschlag' },
        { name: 'flash', displayName: 'Flash', description: 'Blitzen' },
        { name: 'rubberBand', displayName: 'Rubber Band', description: 'Gummiband-Effekt' },
        { name: 'tada', displayName: 'Tada', description: 'Tada! Aufmerksamkeit' },
        { name: 'grow', displayName: 'Grow', description: 'Wachsen' },
        { name: 'shrink', displayName: 'Shrink', description: 'Schrumpfen' },
        { name: 'spin', displayName: 'Spin', description: 'Drehen' },
      ],
    };

    res.json({
      success: true,
      effects,
    });
  } catch (error: any) {
    console.error('Error fetching effects:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Effekte',
      error: error.message,
    });
  }
};

/**
 * GET /api/animations/post/:postId
 * Ruft alle Animationen für einen Post ab
 */
export const getPostAnimations = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post nicht gefunden',
      });
      return;
    }

    const animations = await ElementAnimation.findAll({
      where: { postId },
      order: [['sequenceOrder', 'ASC']],
    });

    res.json({
      success: true,
      data: animations,
      count: animations.length,
    });
  } catch (error: any) {
    console.error('Error fetching post animations:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Animationen',
      error: error.message,
    });
  }
};

/**
 * POST /api/animations
 * Erstellt eine neue Animation für ein Element
 */
export const createAnimation = async (req: Request, res: Response) => {
  try {
    const {
      postId,
      elementSelector,
      elementIndex,
      animationType,
      effectName,
      startTime,
      duration,
      delay,
      easing,
      direction,
      intensity,
      distance,
      triggerType,
      triggerTarget,
      sequenceOrder,
      options,
    } = req.body;

    // Validierung
    if (!postId || !elementSelector || !animationType || !effectName) {
      res.status(400).json({
        success: false,
        message: 'Pflichtfelder fehlen: postId, elementSelector, animationType, effectName',
      });
      return;
    }

    // Prüfe ob Post existiert
    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post nicht gefunden',
      });
      return;
    }

    // Erstelle Animation
    const animation = await ElementAnimation.create({
      postId,
      elementSelector,
      elementIndex: elementIndex || null,
      animationType,
      effectName,
      startTime: startTime || 0,
      duration: duration || 500,
      delay: delay || 0,
      easing: easing || 'ease-out',
      direction: direction || null,
      intensity: intensity || 100,
      distance: distance || null,
      triggerType: triggerType || 'auto',
      triggerTarget: triggerTarget || null,
      sequenceOrder: sequenceOrder || 0,
      options: options || null,
    });

    // Validiere die Animation
    if (!animation.isValid()) {
      await animation.destroy();
      res.status(400).json({
        success: false,
        message: 'Ungültige Animation-Parameter',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: animation,
      message: 'Animation erfolgreich erstellt',
    });
  } catch (error: any) {
    console.error('Error creating animation:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Animation',
      error: error.message,
    });
  }
};

/**
 * PUT /api/animations/:id
 * Aktualisiert eine Animation
 */
export const updateAnimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const animation = await ElementAnimation.findByPk(id);
    if (!animation) {
      res.status(404).json({
        success: false,
        message: 'Animation nicht gefunden',
      });
      return;
    }

    // Update alle erlaubten Felder
    const allowedFields = [
      'elementSelector',
      'elementIndex',
      'animationType',
      'effectName',
      'startTime',
      'duration',
      'delay',
      'easing',
      'direction',
      'intensity',
      'distance',
      'triggerType',
      'triggerTarget',
      'sequenceOrder',
      'options',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        (animation as any)[field] = updateData[field];
      }
    });

    // Validiere vor dem Speichern
    if (!animation.isValid()) {
      res.status(400).json({
        success: false,
        message: 'Ungültige Animation-Parameter',
      });
      return;
    }

    await animation.save();

    res.json({
      success: true,
      data: animation,
      message: 'Animation erfolgreich aktualisiert',
    });
  } catch (error: any) {
    console.error('Error updating animation:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der Animation',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/animations/:id
 * Löscht eine Animation
 */
export const deleteAnimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await ElementAnimation.destroy({
      where: { id },
    });

    if (deleted === 0) {
      res.status(404).json({
        success: false,
        message: 'Animation nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Animation erfolgreich gelöscht',
    });
  } catch (error: any) {
    console.error('Error deleting animation:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Animation',
      error: error.message,
    });
  }
};

/**
 * POST /api/animations/bulk
 * Erstellt mehrere Animationen auf einmal (für Timeline-Editor)
 */
export const bulkCreateAnimations = async (req: Request, res: Response) => {
  try {
    const { postId, animations } = req.body;

    if (!postId || !Array.isArray(animations)) {
      res.status(400).json({
        success: false,
        message: 'postId und animations-Array erforderlich',
      });
      return;
    }

    // Prüfe ob Post existiert
    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post nicht gefunden',
      });
      return;
    }

    // Erstelle alle Animationen
    const createdAnimations = await Promise.all(
      animations.map((anim: any) =>
        ElementAnimation.create({
          postId,
          ...anim,
        })
      )
    );

    res.status(201).json({
      success: true,
      data: createdAnimations,
      count: createdAnimations.length,
      message: `${createdAnimations.length} Animationen erfolgreich erstellt`,
    });
  } catch (error: any) {
    console.error('Error bulk creating animations:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Animationen',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/animations/post/:postId
 * Löscht alle Animationen eines Posts
 */
export const deletePostAnimations = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const deleted = await ElementAnimation.destroy({
      where: { postId },
    });

    res.json({
      success: true,
      message: `${deleted} Animationen gelöscht`,
      count: deleted,
    });
  } catch (error: any) {
    console.error('Error deleting post animations:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Animationen',
      error: error.message,
    });
  }
};

/**
 * PUT /api/animations/reorder
 * Ändert die Reihenfolge von Animationen
 */
export const reorderAnimations = async (req: Request, res: Response) => {
  try {
    const { animationIds } = req.body; // Array von IDs in neuer Reihenfolge

    if (!Array.isArray(animationIds)) {
      res.status(400).json({
        success: false,
        message: 'animationIds muss ein Array sein',
      });
      return;
    }

    // Update sequenceOrder für jede Animation
    await Promise.all(
      animationIds.map((id, index) =>
        ElementAnimation.update({ sequenceOrder: index }, { where: { id } })
      )
    );

    res.json({
      success: true,
      message: 'Reihenfolge erfolgreich aktualisiert',
    });
  } catch (error: any) {
    console.error('Error reordering animations:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Ändern der Reihenfolge',
      error: error.message,
    });
  }
};
