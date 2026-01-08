import { Request, Response } from 'express';
import SlideTransition from '../models/SlideTransition';
import Post from '../models/Post';
import effectPresets from '../../config/effect-presets.json';

/**
 * GET /api/transitions
 * Liefert alle verfügbaren Transition-Presets
 */
export const getAvailableTransitions = async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      transitions: effectPresets.transitions,
    });
  } catch (error: any) {
    console.error('Error fetching transitions:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Transition-Presets',
      error: error.message,
    });
  }
};

/**
 * GET /api/posts/:postId/transition
 * Ruft die Transition-Konfiguration für einen Post ab
 */
export const getPostTransition = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    // Prüfe ob Post existiert
    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post nicht gefunden',
      });
      return;
    }

    // Finde Transition
    const transition = await SlideTransition.findOne({
      where: { postId },
    });

    if (!transition) {
      res.status(404).json({
        success: false,
        message: 'Keine Transition für diesen Post konfiguriert',
      });
      return;
    }

    res.json({
      success: true,
      transition: transition.toJSON(),
    });
  } catch (error: any) {
    console.error('Error fetching post transition:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Transition',
      error: error.message,
    });
  }
};

/**
 * POST /api/posts/:postId/transition
 * Setzt oder aktualisiert die Transition für einen Post
 */
export const setPostTransition = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { transitionType, direction, duration, easing, delay, zIndex, options } = req.body;

    // Validierung
    if (!transitionType) {
      res.status(400).json({
        success: false,
        message: 'transitionType ist erforderlich',
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

    // Prüfe ob Transition-Typ valid ist
    const validTypes = Object.keys(effectPresets.transitions);
    if (!validTypes.includes(transitionType)) {
      res.status(400).json({
        success: false,
        message: `Ungültiger Transition-Typ. Erlaubt: ${validTypes.join(', ')}`,
      });
      return;
    }

    // Finde oder erstelle Transition
    const [transition, created] = await SlideTransition.upsert({
      postId: parseInt(postId),
      transitionType,
      direction: direction || null,
      duration: duration || 800,
      easing: easing || 'ease-in-out',
      delay: delay || 0,
      zIndex: zIndex || 1,
      options: options || null,
    });

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Transition erstellt' : 'Transition aktualisiert',
      transition: transition.toJSON(),
    });
  } catch (error: any) {
    console.error('Error setting post transition:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Speichern der Transition',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/posts/:postId/transition
 * Entfernt die Transition für einen Post
 */
export const deletePostTransition = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const deleted = await SlideTransition.destroy({
      where: { postId },
    });

    if (deleted === 0) {
      res.status(404).json({
        success: false,
        message: 'Keine Transition zum Löschen gefunden',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Transition gelöscht',
    });
  } catch (error: any) {
    console.error('Error deleting post transition:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Transition',
      error: error.message,
    });
  }
};

/**
 * GET /api/posts/with-transitions
 * Liefert alle Posts mit ihren Transitions
 */
export const getPostsWithTransitions = async (_req: Request, res: Response) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: SlideTransition,
          as: 'transition',
          required: false, // LEFT JOIN (auch Posts ohne Transition)
        },
      ],
      where: {
        isActive: true,
      },
      order: [['priority', 'ASC']],
    });

    res.json({
      success: true,
      posts: posts.map((post) => ({
        ...post.toJSON(),
        transition: post.get('transition') || null,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching posts with transitions:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Posts',
      error: error.message,
    });
  }
};
